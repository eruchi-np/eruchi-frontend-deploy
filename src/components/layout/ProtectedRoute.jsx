// src/components/layout/ProtectedRoute.jsx
import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Loader2 } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const ProtectedRoute = ({ children, requireProfileComplete = false }) => {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [profileComplete, setProfileComplete] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('access_token');
      const authMethod = localStorage.getItem('auth_method');

      if (!token) {
        setAuthenticated(false);
        setLoading(false);
        return;
      }

      try {
        let response;
        
        // Check if using cookie-based auth
        if (authMethod === 'cookie' || token === 'USE_COOKIE_AUTH') {
          // Use cookie authentication
          response = await axios.get(`${API_BASE_URL}/users/me`, {
            withCredentials: true // Send cookies
          });
        } else {
          // Use token authentication
          response = await axios.get(`${API_BASE_URL}/users/me`, {
            headers: { Authorization: `Bearer ${token}` },
            withCredentials: true // Also try cookies as fallback
          });
        }

        const user = response.data.data.user;

        if (!user) {
          throw new Error("User data missing");
        }

        setAuthenticated(true);
        setProfileComplete(user.isProfileComplete === true);

      } catch (err) {
        console.error("Auth check failed:", err.response?.data || err.message);
        
        // Only clear localStorage if it's a 401 error
        if (err.response?.status === 401) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('email');
          localStorage.removeItem('username');
          localStorage.removeItem('user_id');
          localStorage.removeItem('auth_method');
        }
        
        setAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
      </div>
    );
  }

  // Not logged in
  if (!authenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Profile incomplete + page requires completion
  if (requireProfileComplete && !profileComplete) {
    return <Navigate to="/complete-profile" replace />;
  }

  // All good — render the page
  return children;
};

export default ProtectedRoute;