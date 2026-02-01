import React, { useState } from 'react';
import DemographicsWizard from '../components/demographics/DemographicsWizard';
import WelcomeToERuchi from '../components/demographics/steps/WelcomeToERuchi';

const CompleteProfile = () => {
  const [profileCompleted, setProfileCompleted] = useState(false);

  const handleProfileComplete = () => {
    console.log('Profile completed – showing welcome screen');
    setProfileCompleted(true);
  };

  if (profileCompleted) {
    return <WelcomeToERuchi />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Complete Your Profile
          </h1>
          <p className="text-gray-600 mb-6">
            Please provide some additional information to help us serve you better.
          </p>
          
          <DemographicsWizard onComplete={handleProfileComplete} />
        </div>
      </div>
    </div>
  );
};

export default CompleteProfile;