import React from 'react';
import { useNavigate } from 'react-router-dom';
import AdditionalProfileSurvey from '../components/demographics/AdditionalProfileSurvey';

// Non-blocking Part 2 survey. Unlike CompleteProfile, nothing routes here
// forcibly — it's just a page users can visit (or be linked to) whenever.
const CompleteAdditionalProfile = () => {
  const navigate = useNavigate();

  const handleComplete = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-8 pb-28">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
            A Few More Questions
          </h1>
          <p className="text-gray-600 mb-6">
            This helps us tailor surveys to you better. It's optional — you can skip it and come back anytime.
          </p>

          <AdditionalProfileSurvey onComplete={handleComplete} />
        </div>
      </div>
    </div>
  );
};

export default CompleteAdditionalProfile;