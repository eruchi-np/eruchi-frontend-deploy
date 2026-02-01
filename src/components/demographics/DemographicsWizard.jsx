import React from 'react';
import useDemographics from '../../hooks/useDemographics';
import ProgressSteps from './ui/ProgressSteps';
import SamplerProfile from './steps/SamplerProfile';
import AddressInfo from './steps/AddressInfo';
import HouseholdDurables from './steps/HouseholdDurables';
import Psychographics from './steps/Psychographics';
import { userAPI } from '../../services/api';
import toast from "react-hot-toast";
import { useAuth } from '../../context/AuthContext';  

const DemographicsWizard = ({ onComplete }) => {
  const { currentStep, formData, nextStep, prevStep, updateFormData, errors } = useDemographics();
  const { refreshUser } = useAuth();  // ← Get refreshUser from AuthContext

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <SamplerProfile formData={formData} updateFormData={updateFormData} />;
      case 2:
        return <AddressInfo formData={formData} updateFormData={updateFormData} />;
      case 3:
        return <HouseholdDurables formData={formData} updateFormData={updateFormData} />;
      case 4:
        return <Psychographics formData={formData} updateFormData={updateFormData} />;
      default:
        return <SamplerProfile formData={formData} updateFormData={updateFormData} />;
    }
  };

  const canProceed = () => {
    if (currentStep === 4) {
      return formData.selectedInterests && formData.selectedInterests.length >= 3;
    }
    return true;
  };

  const handleComplete = async () => {
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
        toast.success("Profile completed successfully! Welcome to eRuchi!");

        // CRITICAL FIX: Immediately refresh user context so isProfileComplete = true
        await refreshUser();  // This fetches fresh /users/me data → updates AuthContext

        // Now safely trigger welcome screen
        onComplete();
      }
    } catch (error) {
      console.error('Error:', error.response?.data);
      toast.error(error.response?.data?.message || "Failed to save profile");
    }
  };

  return (
    <div className="min-h-screen flex flex-col pb-8">
      {/* Progress Steps */}
      <div className="px-4 sm:px-6 lg:px-8">
        <ProgressSteps currentStep={currentStep} />
      </div>

      {/* Form Content */}
      <div className="mt-8 px-4 sm:px-6 lg:px-8 flex-1">
        {renderStep()}
      </div>

      {/* Fixed/Sticky Button Bar */}
      <div className="mt-auto pt-6 border-t border-gray-200 bg-white">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center pb-8 sm:pb-12">
            <button
              onClick={prevStep}
              disabled={currentStep === 1}
              className="px-6 py-3 text-base font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Back
            </button>

            {currentStep < 4 ? (
              <button
                onClick={nextStep}
                className="px-8 py-3 text-base font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm transition-all"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleComplete}
                disabled={!canProceed()}
                className="px-8 py-3 text-base font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all"
              >
                Complete
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Extra padding for mobile */}
      <div className="h-4 sm:h-8" />
    </div>
  );
};

export default DemographicsWizard;