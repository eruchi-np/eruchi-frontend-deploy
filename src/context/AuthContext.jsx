// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    const token = localStorage.getItem('access_token');
    const authMethod = localStorage.getItem('auth_method');
    
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      let res;
      
      // Check if using cookie-based auth
      if (authMethod === 'cookie' || token === 'USE_COOKIE_AUTH') {
        // Use cookie authentication
        res = await axios.get(`${API_BASE_URL}/users/me`, {
          withCredentials: true
        });
      } else {
        // Use token authentication
        res = await axios.get(`${API_BASE_URL}/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true // Also try cookies as fallback
        });
      }
      
      const userData = res.data.data.user;
      setUser(userData);
      // Also sync localStorage for legacy components
      localStorage.setItem('username', `${userData.firstName} ${userData.lastName}`);
      localStorage.setItem('email', userData.email);
      localStorage.setItem('user_id', userData.id);
    } catch (err) {
      console.error('Failed to fetch user:', err);
      
      // Only clear if 401 error
      if (err.response?.status === 401) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('email');
        localStorage.removeItem('username');
        localStorage.removeItem('user_id');
        localStorage.removeItem('auth_method');
      }
      
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // On mount + when storage changes (cross-tab)
  useEffect(() => {
    fetchUser();

    const handleStorage = () => fetchUser();
    window.addEventListener('storage', handleStorage);
    window.addEventListener('authChange', fetchUser);
    window.addEventListener('profileComplete', fetchUser);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('authChange', fetchUser);
      window.removeEventListener('profileComplete', fetchUser);
    };
  }, []);

  const logout = () => {
    localStorage.clear();
    // Clear both possible cookie names
    Cookies.remove('token');
    Cookies.remove('access_token');
    document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    setUser(null);
    window.dispatchEvent(new Event('authChange'));
  };

  return (
    <AuthContext.Provider value={{ user, loading, fetchUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
};