import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

let csrfToken = '';
let inflight = null;

export const getCsrfToken = () => csrfToken;

export const ensureCsrfToken = async () => {
  if (csrfToken) return csrfToken;
  if (!inflight) {
    inflight = axios
      .get(`${API_BASE_URL}/csrf`, { withCredentials: true })
      .then((res) => {
        csrfToken = res.data?.csrfToken || '';
        return csrfToken;
      })
      .catch(() => '')
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
};

const MUTATING = ['POST', 'PUT', 'PATCH', 'DELETE'];

export const attachCsrf = (instance) => {
  instance.interceptors.request.use(async (config) => {
    const method = (config.method || 'get').toUpperCase();
    if (!MUTATING.includes(method)) return config;
    const token = await ensureCsrfToken();
    if (token) {
      config.headers = config.headers || {};
      config.headers['X-CSRF-Token'] = token;
    }
    config.withCredentials = true;
    return config;
  });
};

/** Attach CSRF + credentials to window.fetch calls against the API. */
export const installCsrfFetch = () => {
  if (typeof window === 'undefined' || window.__eruchiCsrfFetch) return;
  window.__eruchiCsrfFetch = true;
  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input, init = {}) => {
    const url = typeof input === 'string' ? input : input?.url;
    const method = String(
      init.method || (typeof Request !== 'undefined' && input instanceof Request ? input.method : 'GET')
    ).toUpperCase();

    if (url && String(url).startsWith(API_BASE_URL) && MUTATING.includes(method)) {
      const token = await ensureCsrfToken();
      const headers = new Headers(
        init.headers || (typeof Request !== 'undefined' && input instanceof Request ? input.headers : undefined)
      );
      if (token && !headers.has('X-CSRF-Token')) headers.set('X-CSRF-Token', token);
      init = { ...init, headers, credentials: init.credentials || 'include' };
    }

    return originalFetch(input, init);
  };
};
