import React from 'react';
import SearchableSelect from '../ui/SearchableSelect';
import EnhancedSelect from '../ui/EnhancedSelect';
import { occupationOptions } from '../../../utils/occupation-data';

const SamplerProfile = ({ formData, updateFormData }) => {
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
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Sampler Profile</h2>
      
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
          <p className="text-xs text-gray-500 mt-2">
            Note: "Nepali" always shows up on top
          </p>
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
          {formData.occupation && (
            <p className="text-sm text-green-600 font-medium mt-2">
            </p>
          )}
        </div>
      </div>

      {/* Progress indicator */}
      <div className="mt-10 pt-6 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Step 1 of 4</span>
          <span className="font-medium text-blue-600">Sampler Profile</span>
        </div>
        <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
          <div className="bg-blue-600 h-2 rounded-full w-1/4"></div>
        </div>
      </div>
    </div>
  );
};

export default SamplerProfile;