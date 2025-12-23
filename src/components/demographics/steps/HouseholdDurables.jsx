import React, { useState } from 'react';
import { HelpCircle, Check } from 'lucide-react';
import EnhancedSelect from '../ui/EnhancedSelect';

const HouseholdDurables = ({ formData, updateFormData }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const durableGoodsOptions = [
    'Electricity Connection',
    'Ceiling Fan',
    'Gas Stove',
    'Refrigerator',
    'Land in Rural Area',
    'Television',
    'Computer / Laptop',
    'Two-wheeler Vehicle',
    'Four-wheeler Vehicle',
    'Air Conditioner'
  ];

const mainEarnerOptions = [
  { value: 'Me', label: 'Me' },
  { value: 'Father', label: 'Father' },
  { value: 'Mother', label: 'Mother' },
  { value: 'Spouse/partner', label: 'Spouse/partner' },
  { value: 'Sibling', label: 'Sibling' },
  { value: 'Other guardian or relative', label: 'Other guardian or relative' }
];

const educationOptions = [
  { value: 'Illiterate', label: 'Illiterate' },
  { value: 'Literate without formal schooling / Grade 4', label: 'Literate without formal schooling / Grade 4' },
  { value: 'Grade 9', label: 'Grade 9' },
  { value: 'Grade 12', label: 'Grade 12' },
  { value: 'Bachelors / Diploma', label: 'Bachelors / Diploma' },
  { value: 'Masters', label: 'Masters' },
  { value: 'PhD', label: 'PhD' }
];

  const handleDurableGoodToggle = (good) => {
    const currentGoods = formData.durableGoods || [];
    let newGoods;

    if (currentGoods.includes(good)) {
      newGoods = currentGoods.filter(item => item !== good);
    } else {
      newGoods = [...currentGoods, good];
    }

    updateFormData('durableGoods', newGoods);
  };

  const handleMainEarnerChange = (earner) => {
    updateFormData('mainHouseholdEarner', earner);
    // Clear earner education if user selects "Me"
    if (earner === 'Me') {
      updateFormData('earnerEducation', '');
    }
  };

  const showEarnerEducation = formData.mainHouseholdEarner && formData.mainHouseholdEarner !== 'Me';

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Household and Durables</h2>
      <p className="text-gray-600 mb-8">Tell us about your household assets and income source</p>
      
      <div className="space-y-8">
        {/* Durable Goods Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-4">
            Which of the following durable goods are owned or used regularly in your household 
            (including you and your immediate family)? Select all that apply:
          </label>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {durableGoodsOptions.map((good) => {
              const isSelected = formData.durableGoods?.includes(good) || false;
              
              return (
                <div
                  key={good}
                  className={`p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 flex items-center justify-between ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                  }`}
                  onClick={() => handleDurableGoodToggle(good)}
                >
                  <span className="font-medium">{good}</span>
                  {isSelected && (
                    <Check className="h-5 w-5 text-blue-500 flex-shrink-0" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Selected Count */}
          {formData.durableGoods && formData.durableGoods.length > 0 && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center">
                <Check className="h-4 w-4 text-blue-600 mr-2" />
                <span className="text-blue-800 font-medium">
                  {formData.durableGoods.length} item{formData.durableGoods.length !== 1 ? 's' : ''} selected
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Main Household Earner */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Whose income is the main source of household earnings?
            </label>
            <div className="relative">
              <button
                type="button"
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <HelpCircle className="h-4 w-4" />
              </button>
              
              {showTooltip && (
                <div className="absolute z-10 w-64 p-3 bg-gray-900 text-white text-sm rounded-lg shadow-lg bottom-full left-1/2 transform -translate-x-1/2 mb-2">
                  <div className="text-center">
                    Households can have multiple earners. Choose the person whose income mostly 
                    supports the household's living costs — like food, housing, education, and daily expenses.
                  </div>
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                </div>
              )}
            </div>
          </div>

          <EnhancedSelect
            options={mainEarnerOptions}
            value={formData.mainHouseholdEarner}
            onChange={handleMainEarnerChange}
            placeholder="Select main household earner"
            label=""
          />
        </div>

        {/* Conditional Education Field */}
        {showEarnerEducation && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl transition-all duration-300">
            <EnhancedSelect
              options={educationOptions}
              value={formData.earnerEducation}
              onChange={(value) => updateFormData('earnerEducation', value)}
              placeholder="Select education level"
              label={`What is the highest level of completed education completed by ${formData.mainHouseholdEarner?.toLowerCase()}?`}
            />
            
            {formData.earnerEducation && (
              <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center">
                  <Check className="h-4 w-4 text-green-600 mr-2" />
                  <span className="text-green-800 text-sm">
                    Education level recorded for {formData.mainHouseholdEarner}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Summary Card */}
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
          <h3 className="font-semibold text-gray-900 mb-3">Summary</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <div>
              <span className="font-medium">Durable goods selected:</span>{' '}
              {formData.durableGoods && formData.durableGoods.length > 0 
                ? formData.durableGoods.join(', ')
                : 'None selected'
              }
            </div>
            <div>
              <span className="font-medium">Main household earner:</span>{' '}
              {formData.mainHouseholdEarner || 'Not selected'}
            </div>
            {showEarnerEducation && (
              <div>
                <span className="font-medium">Earner's education:</span>{' '}
                {formData.earnerEducation || 'Not selected'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Progress indicator */}
      <div className="mt-10 pt-6 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Step 3 of 4</span>
          <span className="font-medium text-blue-600">Household & Durables</span>
        </div>
        <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
          <div className="bg-blue-600 h-2 rounded-full w-3/4"></div>
        </div>
      </div>
    </div>
  );
};

export default HouseholdDurables;