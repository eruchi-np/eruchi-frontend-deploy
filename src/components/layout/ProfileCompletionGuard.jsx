import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext'; 
import axios from 'axios';

const ProfileCompletionGuard = ({ children }) => {
  const { user, loading } = useAuth?.() || {};

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  // If profile is already complete → BLOCK access
  if (user?.isProfileComplete) {
    return <Navigate to="/" replace />;
  }

  // Otherwise, allow access to CompleteProfile page
  return children;
};

export default ProfileCompletionGuard;