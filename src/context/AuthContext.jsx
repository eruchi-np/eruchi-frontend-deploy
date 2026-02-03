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
    console.log('[AuthContext] refreshUser: attempting to fetch user via cookie');

    try {
      // Always try cookie auth (withCredentials sends the httpOnly token cookie)
      const res = await axios.get(`${API_BASE_URL}/users/me`, {
        withCredentials: true,
      });

      console.log('[AuthContext] refreshUser success:', res.data);

      let userData = res.data.data.user;

      // ────────────────────────────────────────────────────────────────
      // WORKAROUND: Force role: "admin" when backend does not send it
      // This is needed because /users/me response is missing the role field
      // Add more conditions if you have other admin accounts in the future
      const isKnownAdmin =
        userData.email?.toLowerCase() === 'admin@eruchi.com.np' ||
        userData.username?.toLowerCase() === 'admin';

      if (isKnownAdmin && userData.role !== 'admin') {
        console.warn(
          '[AuthContext] Backend did not include role field → forcing role: "admin" for known admin user'
        );
        userData = {
          ...userData,
          role: 'admin',
        };
      }
      // ────────────────────────────────────────────────────────────────

      setUser(userData);

      // Keep non-sensitive info for UI/legacy components
      localStorage.setItem('username', `${userData.firstName} ${userData.lastName}`);
      localStorage.setItem('email', userData.email);
      localStorage.setItem('user_id', userData.id);
      localStorage.setItem('auth_method', 'cookie');

    } catch (err) {
      console.error('[AuthContext] refreshUser failed:', err?.response?.status, err?.response?.data);

      if (err.response?.status === 401) {
        // Clear legacy data only
        localStorage.removeItem('access_token');
        localStorage.removeItem('email');
        localStorage.removeItem('username');
        localStorage.removeItem('user_id');
        localStorage.removeItem('auth_method');
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  };

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