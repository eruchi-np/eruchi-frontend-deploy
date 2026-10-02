import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

let csrfToken = '';
let inflight = null;

const isCsrfError = (error) =>
  error.response?.status === 403 &&
  /csrf/i.test(String(error.response?.data?.message || ''));

export const getCsrfToken = () => csrfToken;

export const clearCsrfToken = () => {
  csrfToken = '';
  inflight = null;
};

export const ensureCsrfToken = async (force = false) => {
  if (force) clearCsrfToken();
  if (csrfToken) return csrfToken;
  if (!inflight) {
    inflight = axios
      .get(`${API_BASE_URL}/csrf`, {
        withCredentials: true,
        headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
        params: { _: Date.now() },
      })
      .then((res) => {
        csrfToken = res.data?.csrfToken || '';
        return csrfToken;
      })
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
};

export const attachCsrf = (instance) => {
  instance.interceptors.request.use(async (config) => {
    const method = (config.method || 'get').toUpperCase();
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) return config;
    const token = await ensureCsrfToken();
    if (token) {
      config.headers = config.headers || {};
      config.headers['X-CSRF-Token'] = token;
    }
    config.withCredentials = true;
    return config;
  });

  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const config = error.config;
      if (!config || config._csrfRetried || !isCsrfError(error)) {
        return Promise.reject(error);
      }
      config._csrfRetried = true;
      const token = await ensureCsrfToken(true);
      if (!token) return Promise.reject(error);
      config.headers = config.headers || {};
      config.headers['X-CSRF-Token'] = token;
      return instance.request(config);
    }
  );
};
