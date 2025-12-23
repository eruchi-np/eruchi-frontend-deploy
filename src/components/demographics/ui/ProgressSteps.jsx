import React from 'react';

const ProgressSteps = ({ currentStep }) => {
  const steps = [
    'Sampler Profile',
    'Address',
    'Household & Durables',
    'Psychographics'
  ];

  return (
    <div className="flex justify-between mb-8">
      {steps.map((step, index) => (
        <div key={step} className="flex flex-col items-center flex-1">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            index + 1 === currentStep 
              ? 'bg-blue-500 text-white border-2 border-blue-500' 
              : index + 1 < currentStep 
              ? 'bg-green-500 text-white border-2 border-green-500' 
              : 'bg-white text-gray-600 border-2 border-gray-300'
          }`}>
            {index + 1 < currentStep ? (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            ) : (
              index + 1
            )}
          </div>
          <span className={`text-xs mt-2 text-center ${
            index + 1 === currentStep ? 'text-blue-600 font-medium' : 
            index + 1 < currentStep ? 'text-green-600 font-medium' : 'text-gray-500'
          }`}>
            {step}
          </span>
        </div>
      ))}
    </div>
  );
};

export default ProgressSteps;