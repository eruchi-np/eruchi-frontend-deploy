import React from 'react';

const ProgressSteps = ({ currentStep }) => {
  const steps = [
    'Sampler Profile',
    'Address',
    'Household & Durables',
    'Psychographics'
  ];

  return (
    <div className="mb-8 w-full">
      {/* Circles row — separate from labels so all circles share one baseline */}
      <div className="relative">
        {/* Connector line sits behind the circles */}
        <div className="absolute top-4 left-4 right-4 h-px bg-gray-200 z-0" />

        <div className="relative z-10 flex justify-between">
          {steps.map((step, index) => (
            <div key={step} className="flex flex-1 justify-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors duration-300 ${
                index + 1 === currentStep
                  ? 'bg-blue-500 border-blue-500 text-white'
                  : index + 1 < currentStep
                  ? 'bg-green-500 border-green-500 text-white'
                  : 'bg-white border-gray-300 text-gray-400'
              }`}>
                {index + 1 < currentStep ? (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  index + 1
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Labels row — completely separate, so wrapping never pushes circles around */}
      <div className="flex justify-between mt-2">
        {steps.map((step, index) => (
          <div key={step} className="flex flex-1 justify-center">
            <span className={`text-xs text-center leading-tight max-w-[56px] block ${
              index + 1 === currentStep
                ? 'text-blue-600 font-medium'
                : index + 1 < currentStep
                ? 'text-green-600 font-medium'
                : 'text-gray-400'
            }`}>
              {step}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProgressSteps;