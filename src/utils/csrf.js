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
};
