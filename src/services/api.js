import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Enable sending cookies with requests
});

// Request interceptor – adds Bearer only when appropriate
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  const authMethod = localStorage.getItem('auth_method');
  
  // Only add Authorization header if it's a valid JWT token (not cookie-based auth)
  if (token && authMethod !== 'cookie' && token !== 'USE_COOKIE_AUTH') {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
});

// Response interceptor – improved to handle 429 without breaking flow
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    if (status === 401) {
      console.warn('[API] 401 Unauthorized – clearing legacy auth data');
      // Clear legacy / non-cookie data only
      localStorage.removeItem('access_token');
      localStorage.removeItem('email');
      localStorage.removeItem('username');
      localStorage.removeItem('user_id');
      localStorage.removeItem('auth_method');
      
      // Redirect – but only once
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    } 
    else if (status === 429) {
      console.warn('[API] 429 Too Many Requests – rate limited');
      toast.error(
        "Too many requests. Please wait 1–2 minutes before trying again.",
        { duration: 8000 }
      );
      // Do NOT redirect, do NOT clear auth – this prevents the loop
    } 
    else if (status >= 500) {
      console.error('[API] Server error:', status, error?.response?.data || error.message);
      toast.error("Something went wrong on the server. Please try again later.");
    }

    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword: (token, data) => api.put(`/auth/reset-password/${token}`, data),
};

export const userAPI = {
  getProfile: () => api.get('/users/me'),
  getCampaignHistory: () => api.get('/users/me/campaign-history'),
  deleteAccount: () => api.delete('/users/me/delete'),
  updateDemographics: (data) => api.put('/users/me/demographics', data)
};

export const campaignAPI = {
  getCampaigns: () => api.get('/campaigns'),
  joinCampaign: (id) => api.post(`/campaigns/${id}/join`),
  createCampaign: (data) => api.post('/campaigns', data),
};

export const surveyAPI = {
  getSurvey: (campaignId) => api.get(`/surveys/${campaignId}`),
  submitSurvey: (data) => api.post('/surveys', data),
  skipSurvey: () => api.post('/surveys/skip'),
  getSurveyHistory: () => api.get('/surveys/history'),
};

export const adminAPI = {
  getUsers: (params) => api.get('/admin/users', { params }),
  updateUserStatus: (userId, data) => api.put(`/admin/users/${userId}/status`, data),
};

export const sepSurveyAPI = {
  getAvailable: (params = {}) => api.get('/sepsurveys', { params }),
  getById: (surveyId) => api.get(`/sepsurveys/${surveyId}`),
  submit: (surveyId, responses) => api.post(`/sepsurveys/${surveyId}/submit`, { responses }),
  skip: (surveyId) => api.post(`/sepsurveys/${surveyId}/skip`),
  getHistory: (params = {}) => api.get('/sepsurveys/history', { params }),
  create: (data) => api.post('/sepsurveys', data),
};

export default api;