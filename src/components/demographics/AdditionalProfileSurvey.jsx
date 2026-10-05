import React, { useEffect, useRef, useState } from 'react';
import { Check } from 'lucide-react';
import useAdditionalProfile from '../../hooks/useAdditionalProfile';
import { userAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { PROFILE_COMPLETION_2_CREDITS } from '../../utils/onboardingCredits';
import { additionalProfileSchema, parseStep } from '../../utils/onboardingSchemas';
import ConfirmSame, { hasSavedValue, valuesMatch } from './ConfirmSame';
import '../onboarding/onboarding.css';
import { trackOnboardingError, trackOnboardingSubmit, trackOnboardingView } from '../../utils/healthEvents';

const QUESTIONS = [
  {
    id: 'livingSituation',
    type: 'single',
    label: 'Which best describes your current living situation?',
    options: ['Family house', 'Apartment', 'Student hostel', 'Living alone', 'Other']
  },
  {
    id: 'householdSize',
    type: 'single',
    label: 'How many people, including you, live in your household?',
    options: ['1', '2', '3', '4', '5 or more']
  },
  {
    id: 'hasChildrenUnder12',
    type: 'single',
    label: 'Are there any children under 12 living in your household?',
    options: ['Yes', 'No', 'Prefer not to say']
  },
  {
    id: 'ownsPets',
    type: 'single',
    label: 'Do you currently own any pets?',
    options: ['Yes', 'No']
  },
  {
    id: 'transportation',
    type: 'multi',
    label: 'Which transportation options do you personally own or rely on most often?',
    helper: 'Select all that apply',
    options: ['Two-wheeler', 'Four-wheeler', 'Public transit', 'Ride-sharing or taxi services', 'Walking or cycling', 'Other']
  },
  {
    id: 'dailySchedule',
    type: 'single',
    label: 'How would you describe your typical daily schedule?',
    options: ['Very rigid (fixed times for most activities)', 'Somewhat structured', 'Balanced', 'Mostly flexible', 'Completely flexible']
  }
];

const OptionPill = ({ label, selected, onClick, multi }) => (
  <button
    type="button"
    onClick={onClick}
    className={`onboard-pill ${selected ? 'is-on' : ''}`}
  >
    {multi && (
      <span className="onboard-check">
        {selected && <Check className="w-3 h-3" />}
      </span>
    )}
    {label}
  </button>
);

const AdditionalProfileSurvey = ({ onComplete, mode = 'registration' }) => {
  const isRefresh = mode === 'refresh';
  const { formData, updateField, toggleArrayField, replaceForm } = useAdditionalProfile();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [errorTick, setErrorTick] = useState(0);
  const [errors, setErrors] = useState({});
  const errorRef = useRef(null);
  const [saved, setSaved] = useState(null);
  const [confirmed, setConfirmed] = useState({});
  const [seedState, setSeedState] = useState(isRefresh ? 'loading' : 'ready');

  useEffect(() => {
    trackOnboardingView('pc2');
  }, []);

  useEffect(() => {
    if (!submitError) return;
    errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [submitError, errorTick]);

  useEffect(() => {
    if (!isRefresh) return undefined;
    let cancel = false;
    userAPI.getProfile({ skipErrorToast: true }).then((res) => {
      if (cancel) return;
      const extra = res.data?.data?.user?.additionalProfile || {};
      const seeded = {
        livingSituation: extra.livingSituation || '',
        householdSize: extra.householdSize || '',
        hasChildrenUnder12: extra.hasChildrenUnder12 || '',
        ownsPets: extra.ownsPets || '',
        transportation: Array.isArray(extra.transportation) ? extra.transportation : [],
        dailySchedule: extra.dailySchedule || '',
      };
      setSaved(seeded);
      replaceForm(seeded);
      setSeedState('ready');
    }).catch(() => {
      if (!cancel) setSeedState('ready');
    });
    return () => {
      cancel = true;
    };
  }, [isRefresh]);

  const markChanged = (field) => {
    setErrors((prev) => (prev[field] ? { ...prev, [field]: '' } : prev));
    setSubmitError('');
    setConfirmed((prev) => ({ ...prev, [field]: false }));
  };

  const handleFieldChange = (field, value) => {
    markChanged(field);
    updateField(field, value);
  };

  const handleToggle = (field, value) => {
    markChanged(field);
    toggleArrayField(field, value);
  };

  const fieldStillNeedsConfirm = (field) => {
    if (!saved || !hasSavedValue(saved[field])) return false;
    if (!valuesMatch(saved[field], formData[field])) return false;
    return !confirmed[field];
  };

  const handleSubmit = async () => {
    const fieldErrors = parseStep(additionalProfileSchema, formData);
    if (Object.keys(fieldErrors).length) {
      setErrors(fieldErrors);
      Object.keys(fieldErrors).forEach((field) => trackOnboardingError('pc2', field));
      setSubmitError(
        isRefresh
          ? 'Please answer every question.'
          : 'Please answer every question before claiming your credits.'
      );
      setErrorTick((tick) => tick + 1);
      return;
    }
    const pending = QUESTIONS.map((question) => question.id).filter(fieldStillNeedsConfirm);
    if (pending.length) {
      const nextErrors = {};
      pending.forEach((field) => {
        nextErrors[field] = 'Confirm same or update this answer.';
      });
      setErrors(nextErrors);
      setSubmitError('Confirm same or update each answer before you submit.');
      setErrorTick((tick) => tick + 1);
      return;
    }

    setSubmitting(true);
    setSubmitError('');
    setErrors({});
    try {
      const response = await userAPI.updateAdditionalProfile(
        isRefresh ? { ...formData, profileSurvey: true } : formData,
        { skipErrorToast: true }
      );
      if (response.data.success) {
        const awarded = Number(response.data.creditsAwarded) || 0;
        toast.success(
          awarded
            ? `${awarded} Ruchi Credits added.`
            : isRefresh
              ? 'Profile updated.'
              : `${PROFILE_COMPLETION_2_CREDITS} Ruchi Credits added.`
        );
        trackOnboardingSubmit('pc2');
        onComplete?.();
      } else {
        setSubmitError(response.data.message || 'Failed to save your answers');
        setErrorTick((tick) => tick + 1);
      }
    } catch (error) {
      console.error('Error:', error.response?.data);
      const data = error.response?.data;
      setSubmitError(
        data?.message ||
        data?.errors?.[0]?.msg ||
        'Failed to save your answers'
      );
      setErrorTick((tick) => tick + 1);
    } finally {
      setSubmitting(false);
    }
  };

  if (seedState === 'loading') {
    return <p className="onboard-copy">Loading your current answers...</p>;
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="space-y-10">
        {QUESTIONS.map((question) => (
          <div key={question.id} className="onboard-field">
            <h3 className="text-base font-semibold text-[var(--navy)]">{question.label}</h3>
            {question.helper && (
              <p className="text-sm text-[var(--muted)] mt-0.5">{question.helper}</p>
            )}

            <div className="onboard-pills">
              {question.options.map((option) => {
                const isMulti = question.type === 'multi';
                const selected = isMulti
                  ? (formData[question.id] || []).includes(option)
                  : formData[question.id] === option;

                return (
                  <OptionPill
                    key={option}
                    label={option}
                    selected={selected}
                    multi={isMulti}
                    onClick={() =>
                      isMulti
                        ? handleToggle(question.id, option)
                        : handleFieldChange(question.id, option)
                    }
                  />
                );
              })}
            </div>
            {errors[question.id] && <p className="onboard-error">{errors[question.id]}</p>}
            <ConfirmSame
              saved={saved?.[question.id]}
              value={formData[question.id]}
              confirmed={confirmed[question.id]}
              onConfirm={() => {
                setSubmitError('');
                setErrors((prev) => (prev[question.id] ? { ...prev, [question.id]: '' } : prev));
                setConfirmed((prev) => ({ ...prev, [question.id]: true }));
              }}
            />
          </div>
        ))}
      </div>

      {submitError && (
        <p ref={errorRef} className="onboard-error mt-6" role="alert">{submitError}</p>
      )}

      <div className="onboard-actions mt-10 pt-6 border-t border-[#eef1f4]">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="home-pill home-pill-lg home-pill-lime"
        >
          {submitting ? 'Saving...' : isRefresh ? 'Submit' : 'Claim your credits'}
        </button>
      </div>
    </div>
  );
};

export default AdditionalProfileSurvey;
