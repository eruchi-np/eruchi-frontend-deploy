import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getPostLoginPath } from '../../utils/auth';

const ProfileCompletionGuard = ({ children }) => {
  const { user, loading } = useAuth?.() || {};

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  // Profile just finished. First visit goes to Surveys, where the install card shows.
  if (user?.isProfileComplete) {
    if (!user.first_survey_completed) {
      return (
        <Navigate
          to="/standalone-surveys"
          replace
          state={{ scrollToCatalog: true, firstSurveyNudge: true }}
        />
      );
    }
    return <Navigate to={getPostLoginPath(user)} replace />;
  }

  // Otherwise, allow access to CompleteProfile page
  return children;
};

export default ProfileCompletionGuard;