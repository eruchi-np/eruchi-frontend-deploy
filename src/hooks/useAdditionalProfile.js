import { useState } from 'react';

const initialFormData = {
  livingSituation: '',
  householdSize: '',
  hasChildrenUnder12: '',
  ownsPets: '',
  transportation: [],
  dailySchedule: ''
};

const useAdditionalProfile = () => {
  const [formData, setFormData] = useState(initialFormData);

  const replaceForm = (next) => {
    setFormData({
      ...initialFormData,
      ...next,
      transportation: Array.isArray(next?.transportation) ? next.transportation : [],
    });
  };

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
    replaceForm,
    toggleArrayField,
    resetForm
  };
};

export default useAdditionalProfile;
