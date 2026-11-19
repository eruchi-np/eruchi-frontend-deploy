import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { isStaffAdmin } from '../../utils/adminRoles';
import { rememberReturnPath } from '../../utils/auth';
import { isLimitedSessionAllowedPath } from '../../utils/limitedSession';

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
    rememberReturnPath(location);
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (isStaffAdmin(user.role)) {
    return children;
  }

  if (
    user.limitedSession &&
    !isLimitedSessionAllowedPath(location.pathname, user.limitedSession)
  ) {
    rememberReturnPath(location);
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (isCompletionRoute) {
    if (user.limitedSession === 'rn') {
      rememberReturnPath(location);
      return <Navigate to="/login" state={{ from: location }} replace />;
    }
    if (location.pathname === '/complete-profile' && !user.isRegistrationComplete) {
      return <Navigate to="/complete-basic-info" state={{ from: location }} replace />;
    }
    return children;
  }

  if (!user.isRegistrationComplete) {
    rememberReturnPath(location);
    return <Navigate to="/complete-basic-info" state={{ from: location }} replace />;
  }

  if (requireProfileComplete && !user.isProfileComplete) {
    rememberReturnPath(location);
    return <Navigate to="/complete-profile" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;
