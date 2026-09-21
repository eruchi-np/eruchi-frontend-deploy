import { useState, useEffect } from 'react';
import { demographicsStepSchema, parseStep } from '../utils/onboardingSchemas';

const STORAGE_KEY = 'demographics_draft_v2';
const LEGACY_STORAGE_KEY = 'demographics_draft_v1';

const initialFormData = {
  // Part 1: About You
  firstLanguage: '',
  education: '',
  maritalStatus: '',
  occupation: '',

  // Part 2: Address
  municipality: '',
  wardNumber: '',

  // Part 3: Household & Durables
  durableGoods: [],
  mainHouseholdEarner: '',
  earnerEducation: '',
};

const initialCompletedSteps = {
  step1: false,
  step2: false,
  step3: false
};

// Load any saved draft from localStorage. Falls back to defaults on any
// error (corrupt JSON, storage disabled, etc.) so a bad draft never breaks
// the wizard.
const loadDraft = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.formData?.selectedInterests) {
      delete parsed.formData.selectedInterests;
    }
    if (parsed?.completedSteps?.step4) {
      delete parsed.completedSteps.step4;
    }
    if (parsed?.currentStep > 3) parsed.currentStep = 3;
    return parsed;
  } catch (err) {
    console.warn('Failed to parse saved demographics draft, ignoring it:', err);
    return null;
  }
};

const saveDraft = (formData, completedSteps, currentStep) => {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ formData, completedSteps, currentStep })
    );
  } catch (err) {
    // Non-fatal — e.g. private browsing / storage full. Wizard still works,
    // it just won't survive a refresh.
    console.warn('Failed to save demographics draft:', err);
  }
};

export const clearDemographicsDraft = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch (err) {
    console.warn('Failed to clear demographics draft:', err);
  }
};

const useDemographics = () => {
  const draft = loadDraft();

  const [currentStep, setCurrentStep] = useState(Math.min(draft?.currentStep || 1, 3));
  const [formData, setFormData] = useState({
    ...initialFormData,
    ...(draft?.formData || {})
  });
  const [completedSteps, setCompletedSteps] = useState({
    ...initialCompletedSteps,
    ...(draft?.completedSteps || {})
  });

  const [errors, setErrors] = useState({});

  // Persist to localStorage whenever the draft-relevant state changes.
  useEffect(() => {
    saveDraft(formData, completedSteps, currentStep);
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
      setCompletedSteps(prev => ({
        ...prev,
        [`step${currentStep}`]: true
      }));

      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => prev - 1);
  };

  const goToStep = (step) => {
    if (step >= 1 && step <= 3) {
      setCurrentStep(step);
    }
  };

  const updateFormData = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }

    if (field === 'mainHouseholdEarner' && value === 'Me') {
      setFormData(prev => ({
        ...prev,
        earnerEducation: ''
      }));
    }
  };

  const updateArrayField = (field, value, action = 'toggle') => {
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }

    setFormData(prev => {
      const currentArray = prev[field] || [];
      let newArray;

      if (action === 'toggle') {
        if (currentArray.includes(value)) {
          newArray = currentArray.filter(item => item !== value);
        } else {
          newArray = [...currentArray, value];
        }
      } else if (action === 'add') {
        newArray = [...currentArray, value];
      } else if (action === 'remove') {
        newArray = currentArray.filter(item => item !== value);
      } else if (action === 'set') {
        newArray = value;
      }

      return {
        ...prev,
        [field]: newArray
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
      percentage: (completedCount / 3) * 100
    };
  };

  // Resets in-memory state AND clears the persisted draft. Call this after
  // a successful final submit so the next visit starts fresh.
  const resetForm = () => {
    setFormData(initialFormData);
    setCompletedSteps(initialCompletedSteps);
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
      console.log('Submitting form data:', formData);
      return { success: true, data: formData };
    } catch (error) {
      console.error('Error submitting form:', error);
      return { success: false, error: error.message || 'Failed to submit form' };
    }
  };

  return {
    // State
    currentStep,
    formData,
    completedSteps,
    errors,

    // Actions
    nextStep,
    prevStep,
    goToStep,
    updateFormData,
    updateArrayField,
    submitForm,
    resetForm,

    // Validation & Status
    validateStep,
    isStepCompleted,
    canProceedToStep,
    isFormComplete,
    getStepProgress
  };
};

export default useDemographics;