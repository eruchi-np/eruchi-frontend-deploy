import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { getPostLoginPath, persistAuthSession } from '../utils/auth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Create axios instance with credentials support
const axiosWithCredentials = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true
});

const LoginSuccess = () => {
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  useEffect(() => {
    const finishLogin = async (token, userData) => {
      if (!userData) {
        throw new Error('User data not found');
      }
      persistAuthSession(token, userData);
      window.dispatchEvent(new Event('authChange'));
      await new Promise(resolve => setTimeout(resolve, 200));
      navigate(getPostLoginPath(userData), { replace: true });
    };

    const fetchMeWithBearer = async (token) => {
      const response = await axios.get(`${API_BASE_URL}/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      return response.data?.data;
    };

    const handleGoogleLoginSuccess = async () => {
      try {
        const hash = window.location.hash.startsWith('#')
          ? window.location.hash.slice(1)
          : window.location.hash;
        const hashToken = new URLSearchParams(hash).get('access_token');

        if (hashToken) {
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
          const data = await fetchMeWithBearer(hashToken);
          await finishLogin(data?.token || hashToken, data?.user);
          return;
        }

        // Backend may set a readable 'token' cookie
        let token = Cookies.get('token');

        if (token) {
          const data = await fetchMeWithBearer(token);
          await finishLogin(data?.token || token, data?.user);
          return;
        }

        const response = await axiosWithCredentials.get('/users/me');
        const payload = response.data?.data;
        const userData = payload?.user;
        const jsonToken = payload?.token;

        if (jsonToken) {
          await finishLogin(jsonToken, userData);
          return;
        }

        if (!userData) {
          throw new Error('User data not found');
        }

        persistAuthSession(null, userData);
        localStorage.setItem('auth_method', 'cookie');
        localStorage.setItem('access_token', 'USE_COOKIE_AUTH');

        window.dispatchEvent(new Event('authChange'));
        await new Promise(resolve => setTimeout(resolve, 200));
        navigate(getPostLoginPath(userData), { replace: true });
      } catch (err) {
        console.error('Google login success handler error:', err);
        const message =
          err.response?.data?.message || err.message || 'Authentication failed. Please try again.';
        setError(message);

        Cookies.remove('token');
        localStorage.removeItem('access_token');
        localStorage.removeItem('auth_method');

        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 2000);
      }
    };

    handleGoogleLoginSuccess();
  }, [navigate]);

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