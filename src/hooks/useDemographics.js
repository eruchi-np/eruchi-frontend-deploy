import { useState } from 'react';

const useDemographics = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Part 1: Sampler Profile
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
    
    // Part 4: Psychographics - UPDATED FIELD NAME
    selectedInterests: [] // Changed from 'interests' to match component
  });

  const [completedSteps, setCompletedSteps] = useState({
    step1: false,
    step2: false,
    step3: false,
    step4: false
  });

  const [errors, setErrors] = useState({});

  // Validation rules for each step
  const validateStep = (step) => {
    const newErrors = {};

    switch (step) {
      case 1:
        if (!formData.firstLanguage) newErrors.firstLanguage = 'First language is required';
        if (!formData.education) newErrors.education = 'Education level is required';
        if (!formData.maritalStatus) newErrors.maritalStatus = 'Marital status is required';
        if (!formData.occupation) newErrors.occupation = 'Occupation is required';
        break;

      case 2:
        if (!formData.municipality) newErrors.municipality = 'Municipality is required';
        if (!formData.wardNumber) {
          newErrors.wardNumber = 'Ward number is required';
        } else {
          const wardNum = parseInt(formData.wardNumber);
          if (isNaN(wardNum) || wardNum < 1) {
            newErrors.wardNumber = 'Ward number must be a positive number';
          }
        }
        break;

      case 3:
        if (!formData.mainHouseholdEarner) {
          newErrors.mainHouseholdEarner = 'Please specify the main household earner';
        }
        if (formData.mainHouseholdEarner !== 'Me' && !formData.earnerEducation) {
          newErrors.earnerEducation = 'Please specify the education level of the main earner';
        }
        break;

      case 4:
        // UPDATED: Check selectedInterests instead of interests
        if (!formData.selectedInterests || formData.selectedInterests.length < 3) {
          newErrors.selectedInterests = 'Please select at least 3 interests';
        }
        break;

      default:
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      // Mark current step as completed
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
    if (step >= 1 && step <= 4) {
      setCurrentStep(step);
    }
  };

  const updateFormData = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }

    // Special handling for conditional fields
    if (field === 'mainHouseholdEarner' && value === 'Me') {
      setFormData(prev => ({
        ...prev,
        earnerEducation: '' // Clear earner education if user selects "Me"
      }));
    }
  };

  const updateArrayField = (field, value, action = 'toggle') => {
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
    // Allow going to any previous step, but for future steps require previous steps to be completed
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
      total: 4,
      percentage: (completedCount / 4) * 100
    };
  };

  const resetForm = () => {
    setFormData({
      firstLanguage: '',
      education: '',
      maritalStatus: '', 
      occupation: '',
      municipality: '',
      wardNumber: '',
      durableGoods: [],
      mainHouseholdEarner: '',
      earnerEducation: '',
      selectedInterests: [] // UPDATED
    });
    setCompletedSteps({
      step1: false,
      step2: false,
      step3: false,
      step4: false
    });
    setErrors({});
    setCurrentStep(1);
  };

  const isFormComplete = () => {
    return Object.values(completedSteps).every(Boolean);
  };

  const submitForm = async () => {
    // Validate all steps before submission
    for (let step = 1; step <= 4; step++) {
      if (!validateStep(step)) {
        setCurrentStep(step); // Go to the step with errors
        return { success: false, error: 'Please complete all required fields' };
      }
    }

    try {
      // Will handle API submission later
      console.log('Submitting form data:', formData);
      
      // Simulate API call
      // const response = await demographicsAPI.submit(formData);
      
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