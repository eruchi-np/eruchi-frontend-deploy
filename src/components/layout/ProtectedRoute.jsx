import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ children, requireProfileComplete = false }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const isCompletionRoute =
    location.pathname === '/complete-basic-info' ||
    location.pathname === '/complete-profile';

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

  if (isCompletionRoute) {
    if (location.pathname === '/complete-profile' && !user.isRegistrationComplete) {
      return <Navigate to="/complete-basic-info" state={{ from: location }} replace />;
    }
    return children;
  }

  if (!user.isRegistrationComplete) {
    return <Navigate to="/complete-basic-info" state={{ from: location }} replace />;
  }

  if (requireProfileComplete && !user.isProfileComplete) {
    return <Navigate to="/complete-profile" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;
