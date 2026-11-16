import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const SESSION_HINT = 'USE_COOKIE_AUTH';
const RETURN_PATH_KEY = 'eruchi_post_login_path';
const MAX_RETURN_PATH_LEN = 512;

/** Survives when sessionStorage is blocked (same tab only; OAuth uses signed state). */
let memoryReturnPath = null;

const AUTH_RETURN_BLOCKLIST = new Set([
  '/login',
  '/login/success',
  '/signup',
  '/reset-password',
  '/brand/login',
]);

/** Same-site relative path only (open-redirect safe). */
export const sanitizeReturnPath = (raw) => {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) return null;
  if (trimmed.includes('\\') || /[\s<>"'`]/.test(trimmed)) return null;
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) return null;
  if (trimmed.length > MAX_RETURN_PATH_LEN) return null;

  try {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost';
    const url = new URL(trimmed, origin);
    if (typeof window !== 'undefined' && url.origin !== window.location.origin) return null;

    const path = `${url.pathname}${url.search}${url.hash}`;
    if (path.length > MAX_RETURN_PATH_LEN) return null;
    if (AUTH_RETURN_BLOCKLIST.has(url.pathname)) return null;
    if (url.pathname.startsWith('/brand/login')) return null;
    return path;
  } catch {
    return null;
  }
};

export const pathFromLocation = (location) => {
  if (!location) return null;
  if (typeof location === 'string') return sanitizeReturnPath(location);
  return sanitizeReturnPath(
    `${location.pathname || ''}${location.search || ''}${location.hash || ''}`
  );
};

export const rememberReturnPath = (raw) => {
  const path = typeof raw === 'string' ? sanitizeReturnPath(raw) : pathFromLocation(raw);
  if (!path) return null;
  memoryReturnPath = path;
  try {
    sessionStorage.setItem(RETURN_PATH_KEY, path);
  } catch {
    // private mode can block sessionStorage; memory still holds it this tab
  }
  return path;
};

export const peekReturnPath = () => {
  try {
    const stored = sanitizeReturnPath(sessionStorage.getItem(RETURN_PATH_KEY) || '');
    if (stored) return stored;
  } catch {
    // ignore
  }
  return sanitizeReturnPath(memoryReturnPath || '');
};

export const consumeReturnPath = () => {
  const path = peekReturnPath();
  memoryReturnPath = null;
  try {
    sessionStorage.removeItem(RETURN_PATH_KEY);
  } catch {
    // ignore
  }
  return path;
};

export const clearReturnPath = () => {
  memoryReturnPath = null;
  try {
    sessionStorage.removeItem(RETURN_PATH_KEY);
  } catch {
    // ignore
  }
};

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

/**
 * Post-login destination. Completion gates win; otherwise stored path, then fallback
 * (router state / ?next=), then home.
 */
export const getPostLoginPath = (user, fallback) => {
  if (!user) return '/';
  if (!user.isRegistrationComplete) return '/complete-basic-info';
  if (!user.isProfileComplete) return '/complete-profile';
  return consumeReturnPath() || pathFromLocation(fallback) || '/';
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
  clearReturnPath();

  try {
    // Axios has CSRF attached in main.jsx — raw fetch omits X-CSRF-Token and logout fails.
    await axios.post(`${API_BASE_URL}/auth/logout`, {}, { withCredentials: true });
  } catch {
    // Non-fatal: local hint is already cleared
  }
};
