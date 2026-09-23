import { useState, useEffect } from 'react';
import { demographicsStepSchema, parseStep } from '../utils/onboardingSchemas';
import {
  initialFormData,
  initialCompletedSteps,
  hasDraftProgress,
  loadDraft,
  saveDraft,
  clearDemographicsDraft,
} from '../utils/demographicsDraft';

export { clearDemographicsDraft, hasDraftProgress };

const useDemographics = () => {
  const draft = loadDraft();

  const [currentStep, setCurrentStep] = useState(draft?.currentStep || 1);
  const [formData, setFormData] = useState(draft?.formData || { ...initialFormData });
  const [completedSteps, setCompletedSteps] = useState(
    draft?.completedSteps || { ...initialCompletedSteps }
  );

  const [errors, setErrors] = useState({});

  // Persist partial progress whenever anything draft-relevant changes.
  // Clears storage when the form is fully empty so fresh visits stay blank.
  useEffect(() => {
    if (hasDraftProgress(formData, completedSteps, currentStep)) {
      saveDraft(formData, completedSteps, currentStep);
    } else {
      clearDemographicsDraft();
    }
  }, [formData, completedSteps, currentStep]);

  const validateStep = (step) => {
    const schema = demographicsStepSchema[step];
    if (!schema) return true;

    const newErrors = parseStep(schema, {
      ...formData,
      durableGoods: formData.durableGoods || [],
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCompletedSteps((prev) => ({
        ...prev,
        [`step${currentStep}`]: true,
      }));

      setCurrentStep((prev) => prev + 1);
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => prev - 1);
  };

  const goToStep = (step) => {
    if (step < 1 || step > 3) return;
    setCurrentStep((prev) => {
      if (step > prev) {
        setCompletedSteps((cs) => {
          const next = { ...cs };
          for (let i = prev; i < step; i += 1) next[`step${i}`] = true;
          return next;
        });
      }
      return step;
    });
  };

  const updateFormData = (field, value) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'mainHouseholdEarner' && value === 'Me') {
        next.earnerEducation = '';
      }
      return next;
    });

    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  const updateArrayField = (field, value, action = 'toggle') => {
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: '',
      }));
    }

    setFormData((prev) => {
      const currentArray = prev[field] || [];
      let newArray;

      if (action === 'toggle') {
        if (currentArray.includes(value)) {
          newArray = currentArray.filter((item) => item !== value);
        } else {
          newArray = [...currentArray, value];
        }
      } else if (action === 'add') {
        newArray = [...currentArray, value];
      } else if (action === 'remove') {
        newArray = currentArray.filter((item) => item !== value);
      } else if (action === 'set') {
        newArray = value;
      }

      return {
        ...prev,
        [field]: newArray,
      };
    });
  };

  const isStepCompleted = (step) => {
    return completedSteps[`step${step}`];
  };

  const canProceedToStep = (step) => {
    if (step <= currentStep) return true;

    for (let i = 1; i < step; i++) {
      if (!isStepCompleted(i)) return false;
    }
    return true;
  };

  const getStepProgress = () => {
    const completedCount = Object.values(completedSteps).filter(Boolean).length;
    return {
      completed: completedCount,
      total: 3,
      percentage: (completedCount / 3) * 100,
    };
  };

  const resetForm = () => {
    setFormData({ ...initialFormData });
    setCompletedSteps({ ...initialCompletedSteps });
    setErrors({});
    setCurrentStep(1);
    clearDemographicsDraft();
  };

  const isFormComplete = () => {
    return Object.values(completedSteps).every(Boolean);
  };

  const submitForm = async () => {
    for (let step = 1; step <= 3; step++) {
      if (!validateStep(step)) {
        setCurrentStep(step);
        return { success: false, error: 'Please complete all required fields' };
      }
    }

    try {
      return { success: true, data: formData };
    } catch (error) {
      console.error('Error submitting form:', error);
      return { success: false, error: error.message || 'Failed to submit form' };
    }
  };

  return {
    currentStep,
    formData,
    completedSteps,
    errors,
    nextStep,
    prevStep,
    goToStep,
    updateFormData,
    updateArrayField,
    submitForm,
    resetForm,
    validateStep,
    isStepCompleted,
    canProceedToStep,
    isFormComplete,
    getStepProgress,
  };
};

export default useDemographics;
