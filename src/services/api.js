import axios from 'axios';
import toast from 'react-hot-toast';

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

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const skipToast = error.config?.skipErrorToast;

    if (status === 401 && !error.config?.skipAuthRedirect) {
      const isBusinessRequest = error.config?.url?.includes('/business');
      if (isBusinessRequest) {
        localStorage.removeItem('is_business');
        localStorage.removeItem('business_name');
        window.location.href = '/business/login';
      } else {
        localStorage.removeItem('access_token');
        localStorage.removeItem('email');
        localStorage.removeItem('username');
        localStorage.removeItem('user_id');
        localStorage.removeItem('auth_method');
        window.location.href = '/login';
      }
    } else if (!skipToast) {
      if (!error.response) {
        toast.error('Network error. Check your connection.');
      } else if (status >= 500) {
        toast.error(error.response?.data?.message || 'Server error. Please try again.');
      }
    }

    return Promise.reject(error);
  }
);

function getRequest(url, options = {}) {
  const { skipErrorToast, skipAuthRedirect, ...params } = options;
  return api.get(url, { params, skipErrorToast, skipAuthRedirect });
}

export const authAPI = {
  login: (data, config = {}) => api.post('/auth/login', data, config),
  register: (data, config = {}) => api.post('/auth/register', data, config),
  forgotPassword: (data, config = {}) => api.post('/auth/forgot-password', data, config),
  resetPassword: (token, data, config = {}) => api.put(`/auth/reset-password/${token}`, data, config),
};

export const userAPI = {
  getProfile: (config = {}) => api.get('/users/me', config),
  getCampaignHistory: (config = {}) => api.get('/users/me/campaign-history', config),
  deleteAccount: (config = {}) => api.delete('/users/me/delete', config),
  updateBasicProfile: (data, config = {}) => api.put('/users/me/basic-profile', data, config),
  updateDemographics: (data, config = {}) => api.put('/users/me/demographics', data, config),
  updateAdditionalProfile: (data, config = {}) => api.put('/users/me/additional-profile', data, config),
};

export const campaignAPI = {
  getCampaigns: (config = {}) => api.get('/campaigns', config),
  joinCampaign: (id, config = {}) => api.post(`/campaigns/${id}/join`, {}, config),
  createCampaign: (data, config = {}) => api.post('/campaigns', data, config),
};

export const surveyAPI = {
  getSurvey: (campaignId, config = {}) => api.get(`/surveys/${campaignId}`, config),
  submitSurvey: (data, config = {}) => api.post('/surveys', data, config),
  skipSurvey: (config = {}) => api.post('/surveys/skip', {}, config),
  getSurveyHistory: (config = {}) => api.get('/surveys/history', config),
};

export const adminAPI = {
  getUsers: (options = {}) => getRequest('/admin/users', options),
  updateUserStatus: (userId, data, config = {}) => api.put(`/admin/users/${userId}/status`, data, config),
  getBusinesses: (options = {}) => getRequest('/admin/businesses', options),
  createBusiness: (data, config = {}) => api.post('/admin/businesses', data, config),
  updateBusiness: (id, data, config = {}) => api.put(`/admin/businesses/${id}`, data, config),
  verifyBusiness: (id, data, config = {}) => api.put(`/admin/businesses/${id}/verify`, data, config),
  deleteBusiness: (id, config = {}) => api.delete(`/admin/businesses/${id}`, config),
  changeBusinessPassword: (id, data, config = {}) => api.put(`/admin/businesses/${id}/password`, data, config),
  uploadBusinessPoster: (id, formData, config = {}) =>
    api.post(`/admin/businesses/${id}/posters`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      ...config,
    }),
  deleteBusinessPoster: (id, index, config = {}) => api.delete(`/admin/businesses/${id}/posters/${index}`, config),
  refreshBusinessGoogleRating: (id, config = {}) => api.post(`/admin/businesses/${id}/google-rating/refresh`, {}, config),
  getVoucherOffers: (options = {}) => getRequest('/admin/voucher-offers', options),
  createVoucherOffer: (data, config = {}) => api.post('/admin/voucher-offers', data, config),
  updateVoucherOffer: (id, data, config = {}) => api.put(`/admin/voucher-offers/${id}`, data, config),
  getVouchers: (options = {}) => getRequest('/admin/vouchers', options),
  getScanLog: (options = {}) => getRequest('/admin/scan-log', options),
  deleteVoucherOffer: (id, config = {}) => api.delete(`/admin/voucher-offers/${id}`, config),
  getVoucherWithToken: (id, config = {}) => api.get(`/admin/vouchers/${id}`, config),
  uploadBusinessLogo: (id, formData, config = {}) =>
  api.put(`/admin/businesses/${id}/logo`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    ...config,
  }),
};

export const sepSurveyAPI = {
  getAvailable: (options = {}) => getRequest('/sepsurveys', options),
  getById: (surveyId, config = {}) => api.get(`/sepsurveys/${surveyId}`, config),
  submit: (surveyId, responses, timingData, config = {}) => api.post(`/sepsurveys/${surveyId}/submit`, { responses, timingData }, config),
  skip: (surveyId, config = {}) => api.post(`/sepsurveys/${surveyId}/skip`, {}, config),
  getHistory: (options = {}) => getRequest('/sepsurveys/history', options),
  create: (data, config = {}) => api.post('/sepsurveys', data, config),
  update: (surveyId, data, config = {}) => api.put(`/sepsurveys/${surveyId}`, data, config),
  delete: (surveyId, config = {}) => api.delete(`/sepsurveys/${surveyId}`, config),
  exportTimingsCSV: (surveyId, config = {}) => api.get(`/sepsurveys/${surveyId}/timings/csv`, { responseType: 'blob', ...config }),
};

export const voucherAPI = {
  // ALL PATHS PERFECTLY ALIGNED TO BACKEND BASE PATH
  getOffers: (options = {}) => getRequest('/vouchers/voucher-offers', options),
  redeem: (offerId, config = {}) => api.post('/vouchers/redeem', { offerId }, config),
  getMyVouchers: (options = {}) => getRequest('/vouchers', options),
  getVoucherById: (id, config = {}) => api.get(`/vouchers/${id}`, config),
};

export const businessAPI = {
  login: (credentials, config = {}) => api.post('/business/auth/login', credentials, config),
  logout: (config = {}) => api.post('/business/auth/logout', {}, config),
  scan: (payload, config = {}) => api.post('/business/scan', payload, config),
  getDashboard: (config = {}) => api.get('/business/dashboard', config),
  getVoucherOffers: (config = {}) => api.get('/business/voucher-offers', config),
  previewScan: (voucherId, redemptionToken, config = {}) =>
  api.get('/business/scan/preview', { params: { voucherId, redemptionToken }, ...config }),
  previewScanByCode: (code, config = {}) =>
    api.get('/business/scan/preview-code', { params: { code }, ...config }),
  getProfile: (config = {}) => api.get('/business/profile', config),
  updateProfile: (data, config = {}) => api.put('/business/profile', data, config),
  uploadLogo: (formData, config = {}) =>
    api.put('/business/profile/logo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      ...config,
    }),
  createVoucherOffer: (data, config = {}) => api.post('/business/voucher-offers', data, config),
  updateVoucherOffer: (id, data, config = {}) => api.put(`/business/voucher-offers/${id}`, data, config),
  getPublicProfile: (id, config = {}) => api.get(`/business/public/${id}`, config),
};

export default api;