import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import axios from 'axios';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Create axios instance with credentials support
const axiosWithCredentials = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true
});

const LoginSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleGoogleLoginSuccess = async () => {
      try {
        // First, try to get the token from the cookie
        // The backend sets it as 'token', not 'access_token'
        let token = Cookies.get('token');
        
        console.log('Cookie token:', token ? 'found' : 'not found');
        console.log('All cookies:', document.cookie);

        if (!token) {
          // If cookie isn't accessible, try to fetch user data with credentials
          // The cookie will be sent automatically by the browser
          console.log('Attempting to fetch user with credentials...');
          
          const response = await axiosWithCredentials.get('/users/me');
          const userData = response.data.data.user;

          if (!userData) {
            throw new Error('User data not found');
          }

          // Since we can't access the httpOnly cookie, we need another approach
          // Check if backend sent token in response headers or we need to generate a session token
          console.log('User data fetched successfully:', userData.email);
          
          // For cookie-based auth, we'll store user info but mark it as cookie auth
          localStorage.setItem('auth_method', 'cookie');
          localStorage.setItem('email', userData.email);
          localStorage.setItem('username', `${userData.firstName} ${userData.lastName}`);
          localStorage.setItem('user_id', userData.id);
          
          // Store a placeholder token that indicates cookie-based auth
          localStorage.setItem('access_token', 'USE_COOKIE_AUTH');

          // Dispatch auth change event
          window.dispatchEvent(new Event('authChange'));

          // Small delay to ensure state updates
          await new Promise(resolve => setTimeout(resolve, 200));

          // Check if profile is complete
          if (!userData.isProfileComplete) {
            toast.success('Welcome! Please complete your profile to continue.');
            navigate('/complete-profile', { replace: true });
          } else {
            toast.success('Login successful! Welcome back!');
            navigate('/', { replace: true });
          }
          
        } else {
          // We have the token from cookie! This is the ideal case
          console.log('Token found in cookie, storing in localStorage');
          
          localStorage.setItem('access_token', token);
          localStorage.setItem('auth_method', 'token');

          // Fetch user profile
          const response = await axios.get(`${API_BASE_URL}/users/me`, {
            headers: { Authorization: `Bearer ${token}` }
          });

          const userData = response.data.data.user;

          if (!userData) {
            throw new Error('User data not found');
          }

          // Save user info to localStorage
          localStorage.setItem('email', userData.email);
          localStorage.setItem('username', `${userData.firstName} ${userData.lastName}`);
          localStorage.setItem('user_id', userData.id);

          // Dispatch auth change event
          window.dispatchEvent(new Event('authChange'));

          // Small delay to ensure state updates
          await new Promise(resolve => setTimeout(resolve, 200));

          // Check if profile is complete
          if (!userData.isProfileComplete) {
            navigate('/complete-profile', { replace: true });
          } else {
            toast.success('Login successful! Welcome back!');
            navigate('/', { replace: true });
          }
        }

      } catch (err) {
        console.error('Google login success handler error:', err);
        console.error('Error details:', err.response?.data);
        setError(err.message || 'Authentication failed');
        
        // Clear any invalid data
        Cookies.remove('token');
        localStorage.removeItem('access_token');
        localStorage.removeItem('auth_method');
        
        toast.error('Authentication failed. Please try again.');
        
        // Redirect to login after a short delay
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