import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { adminHomePath, hasPermission, isStaffAdmin } from '../../utils/adminRoles';

const AdminRoute = ({ children, permission }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

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

  if (!isStaffAdmin(user.role)) {
    return <Navigate to="/profile" replace />;
  }

  if (permission && !hasPermission(user.role, permission)) {
    return <Navigate to={adminHomePath(user.role)} replace />;
  }

  return children;
};

export default AdminRoute;
