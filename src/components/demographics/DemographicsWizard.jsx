import React, { useEffect, useRef, useState } from "react";
import useDemographics, { clearDemographicsDraft } from "../../hooks/useDemographics";
import Stepper, { Step } from "../layout/Stepper";
import AboutYou from "./steps/SamplerProfile";
import AddressInfo from "./steps/AddressInfo";
import HouseholdDurables from "./steps/HouseholdDurables";
import { userAPI } from "../../services/api";
import toast from "react-hot-toast";
import { demographicsStepSchema, parseStep } from "../../utils/onboardingSchemas";
import { REFRESH_STORAGE_KEY, loadDraft } from "../../utils/demographicsDraft";
import { hasSavedValue, valuesMatch } from "./ConfirmSame";
import "../onboarding/onboarding.css";
import { trackOnboardingError, trackOnboardingSubmit, trackOnboardingView } from "../../utils/healthEvents";

const DemographicsWizard = ({ onComplete, mode = "registration" }) => {
  const isRefresh = mode === "refresh";
  const storageKey = isRefresh ? REFRESH_STORAGE_KEY : undefined;
  const { formData, updateFormData, replaceFormData, errors: hookErrors, currentStep, goToStep } =
    useDemographics({ storageKey });
  const [localErrors, setLocalErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState(null);
  const [confirmed, setConfirmed] = useState({});
  const [seedState, setSeedState] = useState(isRefresh ? "loading" : "ready");
  const submittingRef = useRef(false);

  const fieldsByStep = {
    1: ["firstLanguage", "education", "maritalStatus", "occupation"],
    2: ["municipality", "wardNumber"],
    3: ["durableGoods", "mainHouseholdEarner", "earnerEducation"],
  };

  const stepLabels = ["About You", "Address", "Household & Durables"];

  useEffect(() => {
    trackOnboardingView("pc1");
  }, []);

  useEffect(() => {
    if (!isRefresh) return undefined;
    let cancel = false;
    userAPI.getProfile({ skipErrorToast: true }).then((res) => {
      if (cancel) return;
      const profile = res.data?.data?.user || {};
      const seeded = {
        firstLanguage: profile.firstLanguage === undefined ? "" : profile.firstLanguage,
        education: profile.educationLevel || "",
        maritalStatus: profile.maritalStatus || "",
        occupation: profile.occupation || "",
        municipality: profile.address?.municipality || "",
        wardNumber: profile.address?.wardNumber ? String(profile.address.wardNumber) : "",
        durableGoods: profile.householdDurables || [],
        mainHouseholdEarner: profile.mainIncomeSource || "",
        earnerEducation: profile.mainIncomeSourceEducation || "",
      };
      setSaved(seeded);
      if (!loadDraft(storageKey)) replaceFormData(seeded);
      setSeedState("ready");
    }).catch(() => {
      if (!cancel) setSeedState("ready");
    });
    return () => {
      cancel = true;
    };
  }, [isRefresh]);

  const checkStepValidation = (step) => {
    const schema = demographicsStepSchema[step];
    if (!schema) return true;

    const nextErrors = parseStep(schema, {
      ...formData,
      durableGoods: formData.durableGoods || [],
    });
    setLocalErrors(nextErrors);
    Object.keys(nextErrors).forEach((field) => trackOnboardingError("pc1", field));
    return Object.keys(nextErrors).length === 0;
  };

  const clearFieldError = (field) => {
    setLocalErrors((prev) => (prev[field] ? { ...prev, [field]: "" } : prev));
  };

  const fieldStillNeedsConfirm = (field) => {
    if (field === "earnerEducation" && (!formData.mainHouseholdEarner || formData.mainHouseholdEarner === "Me")) {
      return false;
    }
    if (!saved || !hasSavedValue(saved[field])) return false;
    if (!valuesMatch(saved[field], formData[field])) return false;
    return !confirmed[field];
  };

  const unconfirmedOnStep = (step) =>
    (fieldsByStep[step] || []).filter(fieldStillNeedsConfirm);

  const handleFieldChange = (field, value) => {
    clearFieldError(field);
    setSubmitError("");
    setConfirmed((prev) => ({ ...prev, [field]: false }));
    updateFormData(field, value);
  };

  const confirmField = (field) => {
    setSubmitError("");
    setConfirmed((prev) => ({ ...prev, [field]: true }));
  };

  const handleComplete = async () => {
    if (submittingRef.current) return;
    if (!checkStepValidation(3)) return;
    const pending = [1, 2, 3].flatMap(unconfirmedOnStep);
    if (pending.length) {
      setSubmitError("Confirm same or update each answer before you submit.");
      return;
    }
    submittingRef.current = true;
    setSubmitting(true);
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
      ...(isRefresh ? { profileSurvey: true } : {}),
    };

    let saved = false;
    try {
      const response = await userAPI.updateDemographics(payload, { skipErrorToast: true });

      if (response.data.success) {
        const awarded = Number(response.data.creditsAwarded) || 0;
        toast.success(
          isRefresh
            ? awarded
              ? `${awarded} Ruchi Credits added. One more short survey.`
              : "Saved. One more short survey."
            : "You're in. Your first survey is ready. Takes under 2 minutes."
        );
        clearDemographicsDraft(storageKey);
        trackOnboardingSubmit("pc1");
        saved = true;
        onComplete(awarded);
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
    } finally {
      if (!saved) {
        submittingRef.current = false;
        setSubmitting(false);
      }
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
  const confirmProps = {
    saved: isRefresh ? saved : null,
    confirmed,
    onConfirm: confirmField,
  };

  if (seedState === "loading") {
    return <p className="onboard-copy">Loading your current answers...</p>;
  }

  return (
    <div className="w-full onboard-step">
      {submitError && (
        <p className="text-sm text-red-600 font-medium text-center mb-4">{submitError}</p>
      )}
      <Stepper
        initialStep={currentStep}
        onStepChange={goToStep}
        onBeforeNext={(step) => {
          if (!checkStepValidation(step)) return false;
          if (unconfirmedOnStep(step).length) {
            setSubmitError("Confirm same or update each answer on this step.");
            return false;
          }
          setSubmitError("");
          return true;
        }}
        onFinalStepCompleted={handleComplete}
        renderStepIndicator={renderCustomIndicator}
        stepContainerClassName="max-w-3xl mx-auto px-4"
        contentClassName="mt-6"
        backButtonText="Back"
        nextButtonText="Next"
        completeButtonText={isRefresh ? "Submit" : "Complete"}
        nextButtonProps={{
          disabled: submitting,
          className: `home-pill home-pill-sm ${
            currentStep === 3 ? "home-pill-lime" : "home-pill-navy"
          }`,
        }}
        backButtonProps={{
          className: "home-pill home-pill-sm profile-btn-outline",
        }}
      >
        <Step>
          <AboutYou
            formData={formData}
            updateFormData={handleFieldChange}
            errors={combinedErrors}
            {...confirmProps}
          />
        </Step>
        <Step>
          <AddressInfo
            formData={formData}
            updateFormData={handleFieldChange}
            errors={combinedErrors}
            {...confirmProps}
          />
        </Step>
        <Step>
          <HouseholdDurables
            formData={formData}
            updateFormData={handleFieldChange}
            errors={combinedErrors}
            {...confirmProps}
          />
        </Step>
      </Stepper>
    </div>
  );
};

export default DemographicsWizard;
