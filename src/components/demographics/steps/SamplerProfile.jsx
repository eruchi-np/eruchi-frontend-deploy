import React from 'react';
import SearchableSelect from '../ui/SearchableSelect';
import EnhancedSelect from '../ui/EnhancedSelect';
import { occupationOptions } from '../../../utils/occupation-data';

const SamplerProfile = ({ formData, updateFormData, errors = {} }) => {
const educationOptions = [
  { value: 'Illiterate', label: 'Illiterate' },
  { value: 'Literate without formal schooling / Grade 4', label: 'Literate without formal schooling / Grade 4' },
  { value: 'Grade 9', label: 'Grade 9' },
  { value: 'Grade 12', label: 'Grade 12' },
  { value: 'Bachelors / Diploma', label: 'Bachelors / Diploma' },
  { value: 'Masters', label: 'Masters' },
  { value: 'PhD', label: 'PhD' }
];

const maritalStatusOptions = [
  { value: 'Unmarried', label: 'Unmarried' },
  { value: 'Married', label: 'Married' },
  { value: 'Divorced', label: 'Divorced' },
  { value: 'Widowed', label: 'Widowed' },
  { value: 'Separated', label: 'Separated' }
];

const languageOptions = [
  { value: 'nepali', label: 'Nepali' },        
  { value: 'english', label: 'English' },
  { value: 'hindi', label: 'Hindi' },
  { value: 'maithili', label: 'Maithili' },
  { value: 'bhojpuri', label: 'Bhojpuri' },
  { value: 'newari', label: 'Newari' },
  { value: 'tamang', label: 'Tamang' },
  { value: null, label: 'Other' }
];

  return (
    <div className="onboard-step">
      <h2>About You</h2>
      
      <div className="space-y-6">
        {/* First Language */}
        <div>
          <EnhancedSelect
            options={languageOptions}
            value={formData.firstLanguage}
            onChange={(value) => updateFormData('firstLanguage', value)}
            placeholder="Select your first language"
            label="First Language"
          />
          {errors.firstLanguage && <p className="onboard-error">{errors.firstLanguage}</p>}
        </div>

        {/* Highest Level of Completed Education */}
        <div>
          <EnhancedSelect
            options={educationOptions}
            value={formData.education}
            onChange={(value) => updateFormData('education', value)}
            placeholder="Select education level"
            label="Highest Level of Completed Education"
          />
          {errors.education && <p className="onboard-error">{errors.education}</p>}
        </div>

        {/* Marital Status */}
        <div>
          <EnhancedSelect
            options={maritalStatusOptions}
            value={formData.maritalStatus}
            onChange={(value) => updateFormData('maritalStatus', value)}
            placeholder="Select marital status"
            label="Marital Status"
          />
          {errors.maritalStatus && <p className="onboard-error">{errors.maritalStatus}</p>}
        </div>

        {/* Occupation - Searchable Select */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Occupation
          </label>
          <SearchableSelect
            options={occupationOptions}
            value={formData.occupation}
            onChange={(value) => updateFormData('occupation', value)}
            placeholder="Search or select your occupation..."
            searchPlaceholder="Search occupations..."
          />
          {errors.occupation && <p className="onboard-error">{errors.occupation}</p>}
        </div>
      </div>

      <div className="onboard-step-meta">
        <span>Step 1 of 3</span>
        <strong>About You</strong>
      </div>
      <div className="onboard-progress">
        <span style={{ width: "33%" }} />
      </div>
    </div>
  );
};

export default SamplerProfile;