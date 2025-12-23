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

// Clear all authentication data
export const clearAuth = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('email');
  localStorage.removeItem('username');
  localStorage.removeItem('user_id');
  localStorage.removeItem('auth_method');
  
  // Clear cookies
  document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  document.cookie = 'access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
};