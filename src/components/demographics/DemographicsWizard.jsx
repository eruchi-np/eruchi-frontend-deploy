import React, { useState } from 'react';
import useDemographics from '../../hooks/useDemographics';
import Stepper, { Step } from '../layout/Stepper';
import SamplerProfile from './steps/SamplerProfile';
import AddressInfo from './steps/AddressInfo';
import HouseholdDurables from './steps/HouseholdDurables';
import Psychographics from './steps/Psychographics';
import { userAPI } from '../../services/api';
import toast from "react-hot-toast";

const DemographicsWizard = ({ onComplete }) => {
  const { formData, updateFormData, errors: hookErrors } = useDemographics();
  const [currentStep, setCurrentStep] = useState(1);
  const [localErrors, setLocalErrors] = useState({});

  const stepLabels = [
    "Sampler Profile",
    "Address",
    "Household & Durables",
    "Psychographics"
  ];

  // Evaluates fields and sets specific error messages to display inline
  const checkStepValidation = (step) => {
    setLocalErrors({});
    
    if (step === 1) {
      const hasErrors = !formData.firstLanguage || !formData.education || !formData.maritalStatus || !formData.occupation;
      if (hasErrors) {
        setLocalErrors({
          firstLanguage: !formData.firstLanguage ? "Please select your first language" : "",
          education: !formData.education ? "Please select your education level" : "",
          maritalStatus: !formData.maritalStatus ? "Please select your marital status" : "",
          occupation: !formData.occupation ? "Please select your occupation" : ""
        });
        return false;
      }
    }
    
    if (step === 2) {
      const hasErrors = !formData.municipality || !formData.wardNumber;
      if (hasErrors) {
        setLocalErrors({
          municipality: !formData.municipality ? "Municipality is required" : "",
          wardNumber: !formData.wardNumber ? "Ward number is required" : ""
        });
        return false;
      }
    }
    
    if (step === 3) {
      if (!formData.mainHouseholdEarner) {
        setLocalErrors({ mainHouseholdEarner: "Main household earner source is required" });
        return false;
      }
    }

    if (step === 4) {
      const selectedCount = formData.selectedInterests ? formData.selectedInterests.length : 0;
      if (selectedCount < 3) {
        setLocalErrors({ interests: "Select at least 3 more interests" });
        return false;
      }
    }

    return true;
  };

  const handleComplete = async () => {
    if (!checkStepValidation(4)) return;

    const payload = {
      firstLanguage: (formData.firstLanguage || '').trim(),
      educationLevel: (formData.education || '').trim(),
      maritalStatus: (formData.maritalStatus || '').trim(),
      occupation: (formData.occupation || '').trim(),
      nationality: 'Nepali',

      address: {
        municipality: formData.municipality,
        wardNumber: parseInt(formData.wardNumber, 10),
      },

      householdDurables: formData.durableGoods || [],
      mainIncomeSource: (formData.mainHouseholdEarner || '').trim(),
      mainIncomeSourceEducation: formData.earnerEducation ? formData.earnerEducation.trim() : null,

      interests: formData.selectedInterests.map((interest) => ({
        interestId: String(interest.id || interest.interestId).trim().toUpperCase(),
        intensity: interest.intensity || 0.9,
      })),
    };

    try {
      console.log('Submitting demographics:', payload);
      const response = await userAPI.updateDemographics(payload);

      if (response.data.success) {
        toast.success("You're in. Your first survey is ready. Takes under 2 minutes.");
        onComplete();
      }
    } catch (error) {
      console.error('Error:', error.response?.data);
      toast.error(error.response?.data?.message || "Failed to save profile");
    }
  };

  const renderCustomIndicator = ({ step, currentStep: activeStep, onStepClick }) => {
    const isActive = activeStep === step;
    const isCompleted = activeStep > step;

    return (
      <div 
        onClick={() => step < activeStep && onStepClick(step)}
        className={`flex flex-col items-center flex-1 transition-all duration-300 ${
          step < activeStep ? 'cursor-pointer' : 'pointer-events-none'
        }`}
      >
        <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-all duration-300 ${
          isActive 
            ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-100 scale-105' 
            : isCompleted 
              ? 'bg-green-500 border-green-500 text-white' 
              : 'bg-white border-gray-300 text-gray-400'
        }`}>
          {isCompleted ? (
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            step
          )}
        </div>
        <span className={`mt-2 text-xs font-semibold text-center tracking-wide transition-colors duration-300 ${
          isActive ? 'text-blue-600' : 'text-gray-400'
        }`}>
          {stepLabels[step - 1]}
        </span>
      </div>
    );
  };

  const combinedErrors = { ...hookErrors, ...localErrors };

  return (
    <div className="w-full">
      <Stepper
        initialStep={1}
        onStepChange={(step) => setCurrentStep(step)}
        onBeforeNext={checkStepValidation}
        onFinalStepCompleted={handleComplete}
        renderStepIndicator={renderCustomIndicator}
        stepContainerClassName="max-w-3xl mx-auto px-4"
        contentClassName="mt-6"
        backButtonText="Back"
        nextButtonText="Next"
        nextButtonProps={{
          className: `px-8 py-3 text-base font-semibold text-white rounded-lg shadow-sm transition-all duration-200 border-none outline-none active:scale-95 ${
            currentStep === 4 ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'
          }`
        }}
        backButtonProps={{
          className: 'px-6 py-3 text-base font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200 active:scale-95'
        }}
      >
        <Step>
          <SamplerProfile formData={formData} updateFormData={updateFormData} errors={combinedErrors} />
        </Step>
        <Step>
          <AddressInfo formData={formData} updateFormData={updateFormData} errors={combinedErrors} />
        </Step>
        <Step>
          <HouseholdDurables formData={formData} updateFormData={updateFormData} errors={combinedErrors} />
        </Step>
        <Step>
          <Psychographics formData={formData} updateFormData={updateFormData} errors={combinedErrors} />
        </Step>
      </Stepper>
    </div>
  );
};

export default DemographicsWizard;