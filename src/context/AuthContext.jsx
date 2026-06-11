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

  const refreshUser = async () => {
    const token = localStorage.getItem('access_token');
    const authMethod = localStorage.getItem('auth_method');
    
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      let res;
      const config = { withCredentials: true };

      if (authMethod === 'cookie' || token === 'USE_COOKIE_AUTH') {
        res = await axios.get(`${API_BASE_URL}/users/me`, config);
      } else {
        config.headers = { Authorization: `Bearer ${token}` };
        res = await axios.get(`${API_BASE_URL}/users/me`, config);
      }
      
      const userData = res.data.data.user;
      setUser(userData);
      // Sync localStorage for legacy components
      localStorage.setItem('username', `${userData.firstName} ${userData.lastName}`);
      localStorage.setItem('email', userData.email);
      localStorage.setItem('user_id', userData.id);
    } catch (err) {
      console.error('Failed to fetch user:', err);
      
      if (err.response?.status === 401) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('email');
        localStorage.setItem('username');
        localStorage.removeItem('user_id');
        localStorage.removeItem('auth_method');
        setUser(null);
      }
      
      if (err.response?.status === 429) {
        console.warn('Rate limited on user fetch - retrying later');
      }
    } finally {
      setLoading(false);
    }
  };

  // On mount + events
  useEffect(() => {
    refreshUser();

    const interval = setInterval(refreshUser, 3 * 60 * 1000); // Refresh every 3 minutes

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

  const logout = () => {
    localStorage.clear();
    // Clear cookies
    Cookies.remove('token');
    Cookies.remove('access_token');
    document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    setUser(null);
    window.dispatchEvent(new Event('authChange'));
  };

  return (
    <AuthContext.Provider value={{ user, loading, refreshUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
};