import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const SESSION_HINT = 'USE_COOKIE_AUTH';

export const persistAuthSession = (userData) => {
  if (!userData) throw new Error('Invalid login response');

  localStorage.setItem('access_token', SESSION_HINT);
  localStorage.setItem('auth_method', 'cookie');
  localStorage.setItem('email', userData.email);
  localStorage.setItem('username', `${userData.firstName} ${userData.lastName}`);
  localStorage.setItem('user_id', userData.id);
  window.dispatchEvent(new Event('authChange'));
};

export const isAuthenticated = () => {
  return localStorage.getItem('access_token') === SESSION_HINT;
};

export const getPostLoginPath = (user) => {
  if (!user) return '/';
  if (!user.isRegistrationComplete) return '/complete-basic-info';
  if (!user.isProfileComplete) return '/complete-profile';
  return '/';
};

export const redirectToProfile = (router) => {
  router('/profile');
};

export const isCookieAuth = () => true;

export const getAuthMethod = () => 'cookie';

const clearLocalStorage = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('email');
  localStorage.removeItem('username');
  localStorage.removeItem('user_id');
  localStorage.removeItem('auth_method');
  localStorage.removeItem('is_business');
  localStorage.removeItem('business_name');
};

export const clearAuth = async () => {
  clearLocalStorage();

  try {
    // Axios has CSRF attached in main.jsx — raw fetch omits X-CSRF-Token and logout fails.
    await axios.post(`${API_BASE_URL}/auth/logout`, {}, { withCredentials: true });
  } catch {
    // Non-fatal: local hint is already cleared
  }
};
