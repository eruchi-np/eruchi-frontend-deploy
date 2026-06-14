const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export const isAuthenticated = () => {
  return !!localStorage.getItem('access_token');
};

export const redirectToProfile = (router) => {
  router.push('/profile');
};

// Check if user is using cookie-based authentication (Google OAuth)
export const isCookieAuth = () => {
  const authMethod = localStorage.getItem('auth_method');
  const token = localStorage.getItem('access_token');
  return authMethod === 'cookie' || token === 'USE_COOKIE_AUTH';
};

// Get authentication method
export const getAuthMethod = () => {
  if (isCookieAuth()) {
    return 'cookie';
  }
  return 'token';
};

// Clear all authentication data from localStorage
const clearLocalStorage = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('email');
  localStorage.removeItem('username');
  localStorage.removeItem('user_id');
  localStorage.removeItem('auth_method');
  // Business session keys
  localStorage.removeItem('is_business');
  localStorage.removeItem('business_name');
};

// Clear all authentication data and invalidate the httpOnly cookie via the backend
export const clearAuth = async () => {
  clearLocalStorage();

  // document.cookie cannot clear httpOnly cookies — must call the backend
  try {
    await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include', // sends the httpOnly cookie so the server can clear it
    });
  } catch {
    // Non-fatal: localStorage is already cleared so the UI will treat the user as logged out
  }
};