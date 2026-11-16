import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import axios from 'axios';
import { getPostLoginPath, persistAuthSession, rememberReturnPath } from '../../utils/auth';
import { clearGoogleOAuthAttempt } from '../../utils/googleOAuth';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const LoginSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleGoogleLoginSuccess = async () => {
      const next = searchParams.get('next');
      if (next) rememberReturnPath(next);

      try {
        const response = await axios.get(`${API_BASE_URL}/users/me`, { withCredentials: true });
        const userData = response.data.data.user;

        if (!userData) {
          throw new Error('User data not found');
        }

        persistAuthSession(userData);
        clearGoogleOAuthAttempt();
        await new Promise((resolve) => setTimeout(resolve, 200));
        navigate(getPostLoginPath(userData, next), { replace: true });
      } catch (err) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('auth_method');

        if (err.response?.data?.code === 'AGE_RESTRICTED') {
          const rt = err.response?.data?.data?.reminderToken;
          const qs = new URLSearchParams({ error: 'age_restricted' });
          if (rt) qs.set('rt', rt);
          navigate(`/login?${qs.toString()}`, { replace: true });
          return;
        }

        const message = !err.response
          ? "Can't reach the login server. Check your connection and try again."
          : err.response?.data?.message || err.message || 'Authentication failed. Please try again.';
        setError(message);

        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 2000);
      }
    };

    handleGoogleLoginSuccess();
  }, [navigate, searchParams]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-500 text-xl font-semibold mb-4">
            {error}
          </div>
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
        <p className="text-gray-600 text-lg">Completing authentication...</p>
      </div>
    </div>
  );
};

export default LoginSuccess;
