import React, { useState } from 'react';
import { Check } from 'lucide-react';
import useAdditionalProfile from '../../hooks/useAdditionalProfile';
import { userAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { PROFILE_COMPLETION_2_CREDITS } from '../../utils/onboardingCredits';
import { additionalProfileSchema, parseStep } from '../../utils/onboardingSchemas';
import '../onboarding/onboarding.css';

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

const AdditionalProfileSurvey = ({ onComplete }) => {
  const { formData, updateField, toggleArrayField } = useAdditionalProfile();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [errors, setErrors] = useState({});

  const handleFieldChange = (field, value) => {
    setErrors((prev) => (prev[field] ? { ...prev, [field]: '' } : prev));
    updateField(field, value);
  };

  const handleToggle = (field, value) => {
    setErrors((prev) => (prev[field] ? { ...prev, [field]: '' } : prev));
    toggleArrayField(field, value);
  };

  const handleSubmit = async () => {
    const fieldErrors = parseStep(additionalProfileSchema, formData);
    if (Object.keys(fieldErrors).length) {
      setErrors(fieldErrors);
      setSubmitError('Please answer every question before claiming your credits.');
      return;
    }

    setSubmitting(true);
    setSubmitError('');
    setErrors({});
    try {
      const response = await userAPI.updateAdditionalProfile(formData, { skipErrorToast: true });
      if (response.data.success) {
        toast.success(`${PROFILE_COMPLETION_2_CREDITS} Ruchi Credits added.`);
        onComplete?.();
      } else {
        setSubmitError(response.data.message || 'Failed to save your answers');
      }
    } catch (error) {
      console.error('Error:', error.response?.data);
      const data = error.response?.data;
      setSubmitError(
        data?.message ||
        data?.errors?.[0]?.msg ||
        'Failed to save your answers'
      );
    } finally {
      setSubmitting(false);
    }
  };

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
          </div>
        ))}
      </div>

      {submitError && (
        <p className="onboard-error mt-6">{submitError}</p>
      )}

      <div className="onboard-actions mt-10 pt-6 border-t border-[#eef1f4]">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="home-pill home-pill-lg home-pill-lime"
        >
          {submitting ? 'Saving...' : 'Claim your credits'}
        </button>
      </div>
    </div>
  );
};

export default AdditionalProfileSurvey;
