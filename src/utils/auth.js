import axios from 'axios';

export const isAuthenticated = async () => {
  try {
    const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/users/me`, {
      withCredentials: true,
    });
    return !!res.data?.data?.user;
  } catch (err) {
    console.log('[auth] isAuthenticated check failed:', err?.response?.status);
    return false;
  }
};

export const isAuthenticatedSync = () => {
  return !!localStorage.getItem('user_id') || !!localStorage.getItem('auth_method');
};

export const redirectToProfile = (navigate) => {
  navigate('/profile');
};

export const clearAuth = () => {
  localStorage.clear();
  document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  document.cookie = 'access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
};