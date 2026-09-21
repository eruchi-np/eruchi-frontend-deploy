// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { authAPI } from '../services/api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

const SESSION_HINT = 'USE_COOKIE_AUTH';

const clearSessionHint = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('email');
  localStorage.removeItem('username');
  localStorage.removeItem('user_id');
  localStorage.removeItem('auth_method');
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/users/me`, { withCredentials: true });
      const userData = res.data.data.user;
      setUser(userData);
      localStorage.setItem('access_token', SESSION_HINT);
      localStorage.setItem('auth_method', 'cookie');
      localStorage.setItem('username', `${userData.firstName} ${userData.lastName}`);
      localStorage.setItem('email', userData.email);
      localStorage.setItem('user_id', userData.id);
    } catch (err) {
      console.error('Failed to fetch user:', err);

      if (err.response?.status === 401) {
        clearSessionHint();
        setUser(null);
      }

      if (err.response?.status === 429) {
        console.warn('Rate limited on user fetch - retrying later');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();

    const interval = setInterval(refreshUser, 3 * 60 * 1000);

    const handleStorage = () => refreshUser();
    window.addEventListener('storage', handleStorage);
    window.addEventListener('authChange', refreshUser);
    window.addEventListener('profileComplete', refreshUser);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('authChange', refreshUser);
      window.removeEventListener('profileComplete', refreshUser);
    };
  }, []);

  const logout = async () => {
    clearSessionHint();
    localStorage.removeItem('is_business');
    localStorage.removeItem('business_name');
    setUser(null);

    try {
      await authAPI.logout({ skipAuthRedirect: true });
    } catch {
      // still clear locally
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, refreshUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
