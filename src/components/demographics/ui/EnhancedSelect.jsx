import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

const EnhancedSelect = ({ 
  options, 
  value, 
  onChange, 
  placeholder = "Select an option...",
  label = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (optionValue) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  const selectedOption = options.find(opt => opt.value === value) || 
                        options.find(opt => opt === value); // Support both object and string arrays

  const displayValue = selectedOption ? 
    (typeof selectedOption === 'object' ? selectedOption.label : selectedOption) : 
    '';

  return (
    <div className="relative" ref={dropdownRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      
      {/* Selected value display */}
      <div
        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer flex items-center justify-between bg-white transition-all duration-200 hover:border-gray-300 hover:shadow-sm"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex-1">
          {value ? (
            <span className="font-medium text-gray-900">{displayValue}</span>
          ) : (
            <span className="text-gray-400">{placeholder}</span>
          )}
        </div>
        <ChevronDown 
          className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-blue-500' : ''
          }`} 
        />
      </div>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute z-10 w-full mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-lg shadow-gray-100 overflow-hidden">
          <div className="py-2 max-h-60 overflow-auto">
            {options.map((option, index) => {
              const optionValue = typeof option === 'object' ? option.value : option;
              const optionLabel = typeof option === 'object' ? option.label : option;
              const isSelected = value === optionValue;
              
              return (
                <div
                  key={optionValue || index}
                  className={`px-4 py-3 cursor-pointer transition-all duration-150 flex items-center justify-between group ${
                    isSelected 
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-500' 
                      : 'hover:bg-gray-50 text-gray-700 hover:text-gray-900'
                  } ${index !== options.length - 1 ? 'border-b border-gray-100' : ''}`}
                  onClick={() => handleSelect(optionValue)}
                >
                  <span className={`font-medium ${isSelected ? 'text-blue-700' : 'text-gray-700'}`}>
                    {optionLabel}
                  </span>
                  {isSelected && (
                    <Check className="h-4 w-4 text-blue-500 flex-shrink-0 ml-2" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedSelect;