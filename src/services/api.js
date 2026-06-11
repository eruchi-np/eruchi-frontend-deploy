import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  const authMethod = localStorage.getItem('auth_method');
  
  if (token && authMethod !== 'cookie' && token !== 'USE_COOKIE_AUTH') {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('email');
      localStorage.removeItem('username');
      localStorage.removeItem('user_id');
      localStorage.removeItem('auth_method');
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
  deleteAccount: () => api.delete('/users/me'),
  updateBasicProfile: (data) => api.put('/users/me/basic-profile', data),
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
  getBusinesses: (params) => api.get('/admin/businesses', { params }),
  createBusiness: (data) => api.post('/admin/businesses', data),
  verifyBusiness: (id, data) => api.put(`/admin/businesses/${id}/verify`, data),
  getVoucherOffers: (params) => api.get('/admin/voucher-offers', { params }),
  createVoucherOffer: (data) => api.post('/admin/voucher-offers', data),
  updateVoucherOffer: (id, data) => api.put(`/admin/voucher-offers/${id}`, data),
  getVouchers: (params) => api.get('/admin/vouchers', { params }),
  getScanLog: (params) => api.get('/admin/scan-log', { params }),
  deleteVoucherOffer: (id) => api.delete(`/admin/voucher-offers/${id}`),
  getVoucherWithToken: (id) => api.get(`/admin/vouchers/${id}`),
};

export const sepSurveyAPI = {
  getAvailable: (params = {}) => api.get('/sepsurveys', { params }),
  getById: (surveyId) => api.get(`/sepsurveys/${surveyId}`),
  submit: (surveyId, responses, timingData) => api.post(`/sepsurveys/${surveyId}/submit`, { responses, timingData }),
  skip: (surveyId) => api.post(`/sepsurveys/${surveyId}/skip`),
  getHistory: (params = {}) => api.get('/sepsurveys/history', { params }),
  create: (data) => api.post('/sepsurveys', data),
  exportTimingsCSV: (surveyId) => api.get(`/sepsurveys/${surveyId}/timings/csv`, { responseType: 'blob' }),
};

export const voucherAPI = {
  // ALL PATHS PERFECTLY ALIGNED TO BACKEND BASE PATH
  getOffers: (params = {}) => api.get('/vouchers/voucher-offers', { params }),
  redeem: (offerId) => api.post('/vouchers/redeem', { offerId }),
  getMyVouchers: (params = {}) => api.get('/vouchers', { params }),
  getVoucherById: (id) => api.get(`/vouchers/${id}`),
};

export const businessAPI = {
  login: (credentials) => api.post('/business/auth/login', credentials),
  logout: () => api.post('/business/auth/logout'),
  scan: (payload) => api.post('/business/scan', payload),
  getDashboard: () => api.get('/business/dashboard'),
  getVoucherOffers: () => api.get('/business/voucher-offers'),
  previewScan: (voucherId, redemptionToken) =>
  api.get('/business/scan/preview', { params: { voucherId, redemptionToken } }),
};

export default api;