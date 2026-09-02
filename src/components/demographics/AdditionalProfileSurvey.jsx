import React, { useState } from 'react';
import { Check } from 'lucide-react';
import useAdditionalProfile from '../../hooks/useAdditionalProfile';
import { userAPI } from '../../services/api';
import toast from 'react-hot-toast';

// Question config — mirrors the "Profile Completion Survey - Part 2" spreadsheet.
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
    id: 'occupationCategory',
    type: 'single',
    label: 'Which best describes your current occupation?',
    options: ['Student', 'Working professional', 'Homemaker', 'Business owner', 'Currently not working', 'Other']
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
    id: 'lifeChanges',
    type: 'multi',
    label: 'Are you currently navigating a major change in your life?',
    helper: 'Select the most relevant ones',
    options: [
      'Yes, regarding my education',
      'Yes, regarding my professional life',
      'Yes, regarding relocation or moving',
      'Yes, regading family and household (wedding, child, etc)',
      'Yes, other major changes',
      'None'
    ]
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
    className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 text-sm font-medium text-left transition-all duration-200 ${
      selected
        ? 'border-blue-600 bg-blue-50 text-blue-700'
        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
    }`}
  >
    {multi && (
      <span
        className={`flex-shrink-0 w-4 h-4 rounded flex items-center justify-center border-2 ${
          selected ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
        }`}
      >
        {selected && <Check className="w-3 h-3 text-white" />}
      </span>
    )}
    {label}
  </button>
);

// onComplete: called after a successful save (or when the user skips).
const AdditionalProfileSurvey = ({ onComplete }) => {
  const { formData, updateField, toggleArrayField } = useAdditionalProfile();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError('');
    try {
      const response = await userAPI.updateAdditionalProfile(formData, { skipErrorToast: true });
      if (response.data.success) {
        toast.success('Thanks! Your answers have been saved.');
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

  const handleSkip = () => {
    onComplete?.();
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="space-y-10">
        {QUESTIONS.map((question) => (
          <div key={question.id}>
            <h3 className="text-base font-semibold text-gray-900">{question.label}</h3>
            {question.helper && (
              <p className="text-sm text-gray-500 mt-0.5">{question.helper}</p>
            )}

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                        ? toggleArrayField(question.id, option)
                        : updateField(question.id, option)
                    }
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {submitError && (
        <p className="text-sm text-red-600 font-medium mt-6">{submitError}</p>
      )}

      <div className="mt-10 pt-6 border-t border-gray-200 flex items-center justify-between">
        <button
          type="button"
          onClick={handleSkip}
          className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
        >
          Skip for now
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="px-8 py-3 text-base font-semibold text-white bg-blue-600 rounded-lg shadow-sm hover:bg-blue-700 transition-all duration-200 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {submitting ? 'Saving...' : 'Save answers'}
        </button>
      </div>
    </div>
  );
};

export default AdditionalProfileSurvey;