import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { businessAPI } from '../../services/api';

const BusinessProtectedRoute = ({ children }) => {
  const [status, setStatus] = useState('loading'); // 'loading' | 'authed' | 'unauthed'
  const location = useLocation();

  useEffect(() => {
    const check = async () => {
      try {
        await businessAPI.getDashboard();
        setStatus('authed');
      } catch (err) {
        setStatus('unauthed');
      }
    };
    check();
  }, []);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-10 h-10 animate-spin text-gray-400" />
      </div>
    );
  }

  if (status === 'unauthed') {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default BusinessProtectedRoute;