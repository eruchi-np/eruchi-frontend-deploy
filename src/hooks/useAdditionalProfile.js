import { useState } from 'react';

const initialFormData = {
  livingSituation: '',
  householdSize: '',
  hasChildrenUnder12: '',
  occupationCategory: '',
  ownsPets: '',
  transportation: [],
  lifeChanges: [],
  dailySchedule: ''
};

// Unlike useDemographics, this survey is non-blocking — no draft persistence,
// no step gating. Just plain form state for a single-page survey.
const useAdditionalProfile = () => {
  const [formData, setFormData] = useState(initialFormData);

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleArrayField = (field, value) => {
    setFormData(prev => {
      const current = prev[field] || [];
      const exists = current.includes(value);
      return {
        ...prev,
        [field]: exists ? current.filter(v => v !== value) : [...current, value]
      };
    });
  };

  const resetForm = () => setFormData(initialFormData);

  return {
    formData,
    updateField,
    toggleArrayField,
    resetForm
  };
};

export default useAdditionalProfile;