import React, { useState } from "react";
import useDemographics, { clearDemographicsDraft } from "../../hooks/useDemographics";
import Stepper, { Step } from "../layout/Stepper";
import AboutYou from "./steps/SamplerProfile";
import AddressInfo from "./steps/AddressInfo";
import HouseholdDurables from "./steps/HouseholdDurables";
import { userAPI } from "../../services/api";
import toast from "react-hot-toast";
import { demographicsStepSchema, parseStep } from "../../utils/onboardingSchemas";
import "../onboarding/onboarding.css";

const DemographicsWizard = ({ onComplete }) => {
  const { formData, updateFormData, errors: hookErrors, currentStep, goToStep } =
    useDemographics();
  const [localErrors, setLocalErrors] = useState({});
  const [submitError, setSubmitError] = useState("");

  const stepLabels = ["About You", "Address", "Household & Durables"];

  const checkStepValidation = (step) => {
    const schema = demographicsStepSchema[step];
    if (!schema) return true;

    const nextErrors = parseStep(schema, {
      ...formData,
      durableGoods: formData.durableGoods || [],
    });
    setLocalErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const clearFieldError = (field) => {
    setLocalErrors((prev) => (prev[field] ? { ...prev, [field]: "" } : prev));
  };

  const handleFieldChange = (field, value) => {
    clearFieldError(field);
    updateFormData(field, value);
  };

  const handleComplete = async () => {
    if (!checkStepValidation(3)) return;
    setSubmitError("");

    const payload = {
      // null = "Other" (allowed by backend enum); don't coerce to ""
      firstLanguage:
        formData.firstLanguage === null
          ? null
          : String(formData.firstLanguage || "").trim(),
      educationLevel: (formData.education || "").trim(),
      maritalStatus: (formData.maritalStatus || "").trim(),
      occupation: (formData.occupation || "").trim(),
      nationality: "Nepali",

      address: {
        municipality: formData.municipality,
        wardNumber: parseInt(formData.wardNumber, 10),
      },

      householdDurables: formData.durableGoods || [],
      mainIncomeSource: (formData.mainHouseholdEarner || "").trim(),
      mainIncomeSourceEducation: formData.earnerEducation ? formData.earnerEducation.trim() : null,
    };

    try {
      const response = await userAPI.updateDemographics(payload, { skipErrorToast: true });

      if (response.data.success) {
        toast.success("You're in. Your first survey is ready. Takes under 2 minutes.");
        clearDemographicsDraft();
        onComplete();
      } else {
        setSubmitError(response.data.message || "Failed to save profile. Please try again.");
      }
    } catch (error) {
      console.error("Error:", error.response?.data);
      const data = error.response?.data;
      setSubmitError(
        data?.message ||
          data?.errors?.[0]?.msg ||
          data?.errors?.[0]?.message ||
          (!error.response
            ? "Network error. Check your connection."
            : "Failed to save profile. Please try again.")
      );
    }
  };

  const renderCustomIndicator = ({ step, currentStep: activeStep, onStepClick }) => {
    const isActive = activeStep === step;
    const isCompleted = activeStep > step;

    return (
      <div
        onClick={() => step < activeStep && onStepClick(step)}
        className={`flex flex-col items-center flex-1 self-start transition-all duration-300 ${
          step < activeStep ? "cursor-pointer" : "pointer-events-none"
        }`}
      >
        <div
          className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-all duration-300 ${
            isActive
              ? "bg-[var(--navy)] border-[var(--navy)] text-white shadow-md scale-105"
              : isCompleted
              ? "bg-[#7bd13a] border-[#7bd13a] text-white"
              : "bg-white border-gray-300 text-gray-400"
          }`}
        >
          {isCompleted ? (
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            step
          )}
        </div>
        {isActive && (
          <span className="mt-2 text-xs font-semibold text-center tracking-wide text-[var(--navy)]">
            {stepLabels[step - 1]}
          </span>
        )}
      </div>
    );
  };

  const combinedErrors = { ...hookErrors, ...localErrors };

  return (
    <div className="w-full onboard-step">
      {submitError && (
        <p className="text-sm text-red-600 font-medium text-center mb-4">{submitError}</p>
      )}
      <Stepper
        initialStep={currentStep}
        onStepChange={goToStep}
        onBeforeNext={checkStepValidation}
        onFinalStepCompleted={handleComplete}
        renderStepIndicator={renderCustomIndicator}
        stepContainerClassName="max-w-3xl mx-auto px-4"
        contentClassName="mt-6"
        backButtonText="Back"
        nextButtonText="Next"
        nextButtonProps={{
          className: `home-pill home-pill-sm ${
            currentStep === 3 ? "home-pill-lime" : "home-pill-navy"
          }`,
        }}
        backButtonProps={{
          className: "home-pill home-pill-sm profile-btn-outline",
        }}
      >
        <Step>
          <AboutYou formData={formData} updateFormData={handleFieldChange} errors={combinedErrors} />
        </Step>
        <Step>
          <AddressInfo formData={formData} updateFormData={handleFieldChange} errors={combinedErrors} />
        </Step>
        <Step>
          <HouseholdDurables formData={formData} updateFormData={handleFieldChange} errors={combinedErrors} />
        </Step>
      </Stepper>
    </div>
  );
};

export default DemographicsWizard;
