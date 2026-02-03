// src/components/layout/ProtectedRoute.jsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

// Pages where we allow access even if profile is incomplete
const ALLOWED_WITHOUT_COMPLETE = [
  '/complete-basic-info',
  '/complete-profile',
  '/login',
  '/signup',
  '/reset-password',
  '/reset-password/:token',
  '/verify-email/:token',
  '/email-verification',
];

const ProtectedRoute = ({ children, requireProfileComplete = false }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Allow public/completion routes unconditionally
  if (ALLOWED_WITHOUT_COMPLETE.some(path => 
    path.includes(':') 
      ? location.pathname.startsWith(path.split('/:')[0])
      : location.pathname === path
  )) {
    return children;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // NEW: Skip completion requirements for admin users
  const isAdmin = user.role === 'admin' ||
                  user.email?.toLowerCase() === 'admin@eruchi.com.np' ||
                  user.username?.toLowerCase() === 'admin';

  if (!isAdmin) {
    if (!user.isRegistrationComplete) {
      return <Navigate to="/complete-basic-info" state={{ from: location }} replace />;
    }

    if (requireProfileComplete && !user.isProfileComplete) {
      return <Navigate to="/complete-profile" state={{ from: location }} replace />;
    }
  }

  return children;
};

export default ProtectedRoute;