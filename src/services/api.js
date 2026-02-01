import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Enable sending cookies with requests
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  const authMethod = localStorage.getItem('auth_method');
  
  // Only add Authorization header if it's a valid JWT token (not cookie-based auth)
  if (token && authMethod !== 'cookie' && token !== 'USE_COOKIE_AUTH') {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // If authMethod is 'cookie' or token is 'USE_COOKIE_AUTH', 
  // the cookie will be sent automatically due to withCredentials: true
  
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear all auth data
      localStorage.removeItem('access_token');
      localStorage.removeItem('email');
      localStorage.removeItem('username');
      localStorage.removeItem('user_id');
      localStorage.removeItem('auth_method');
      
      // Redirect to login
      window.location.href = '/login';
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
  // List of available standalone surveys
  getAvailable: (params = {}) => api.get('/sepsurveys', { params }),

  // Get single standalone survey details (questions + rules)
  getById: (surveyId) => api.get(`/sepsurveys/${surveyId}`),

  // Submit answers
  submit: (surveyId, responses) => api.post(`/sepsurveys/${surveyId}/submit`, { responses }),

  // Skip optional survey
  skip: (surveyId) => api.post(`/sepsurveys/${surveyId}/skip`),

  // User's submission history
  getHistory: (params = {}) => api.get('/sepsurveys/history', { params }),

  create: (data) => api.post('/sepsurveys', data),
};

export default api;