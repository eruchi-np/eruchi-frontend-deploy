import axios from 'axios';
import toast from 'react-hot-toast';
import { attachCsrf } from '../utils/csrf';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

attachCsrf(api);

api.interceptors.request.use((config) => config);

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
        window.location.href = '/login';
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
  logout: (config = {}) => api.post('/auth/logout', {}, { skipErrorToast: true, ...config }),
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
  purchaseStreakGuard: (days, config = {}) => api.post('/users/me/streak-guard', { days }, config),
};

export const campaignAPI = {
  getCampaigns: (config = {}) => api.get('/campaigns', config),
  joinCampaign: (id, config = {}) => api.post(`/campaigns/${id}/join`, {}, config),
};

export const surveyAPI = {
  getSurvey: (campaignId, config = {}) => api.get(`/surveys/${campaignId}`, config),
  submitSurvey: (data, config = {}) => api.post('/surveys', data, config),
  skipSurvey: (config = {}) => api.post('/surveys/skip', {}, config),
  getSurveyHistory: (config = {}) => api.get('/surveys/history', config),
};

export const adminAPI = {
  getUsers: (options = {}) => getRequest('/admin/users', options),
  exportUserEmailsCsv: (options = {}) => {
    const { skipErrorToast, skipAuthRedirect, ...params } = options;
    return api.get('/admin/users/emails/csv', {
      params,
      responseType: 'blob',
      skipErrorToast,
      skipAuthRedirect,
    });
  },
  getUser: (userId, options = {}) => getRequest(`/admin/users/${userId}`, options),
  getUserCredits: (userId, options = {}) => getRequest(`/admin/users/${userId}/credits`, options),
  adjustUserCredits: (userId, data, config = {}) => api.post(`/admin/users/${userId}/credits`, data, config),
  getStats: (options = {}) => getRequest('/admin/stats', options),
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
  getVoucherStats: (options = {}) => getRequest('/admin/vouchers/stats', options),
  getScanLog: (options = {}) => getRequest('/admin/scan-log', options),
  deleteVoucherOffer: (id, config = {}) => api.delete(`/admin/voucher-offers/${id}`, config),
  getVoucherWithToken: (id, config = {}) => api.get(`/admin/vouchers/${id}`, config),
  uploadBusinessLogo: (id, formData, config = {}) =>
  api.put(`/admin/businesses/${id}/logo`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    ...config,
  }),
  getFaqs: (options = {}) => getRequest('/admin/faqs', options),
  createFaq: (data, config = {}) => api.post('/admin/faqs', data, config),
  updateFaq: (id, data, config = {}) => api.put(`/admin/faqs/${id}`, data, config),
  deleteFaq: (id, config = {}) => api.delete(`/admin/faqs/${id}`, config),
  reorderFaq: (id, direction, config = {}) => api.put(`/admin/faqs/${id}/reorder`, { direction }, config),
  getStaff: (options = {}) => getRequest('/admin/staff', options),
  updateStaffRole: (userId, data, config = {}) => api.patch(`/admin/staff/${userId}/role`, data, config),
  promoteStaff: (data, config = {}) => api.post('/admin/staff', data, config),
  getNpsMetrics: (options = {}) => getRequest('/admin/metrics/nps', options),
  getCepMetrics: (options = {}) => getRequest('/admin/metrics/cep', options),
};

export const faqAPI = {
  getAll: (config = {}) => api.get('/faqs', config),
};

export const clusterAPI = {
  list: (options = {}) => getRequest('/clusters', options),
  create: (data, config = {}) => api.post('/clusters', data, config),
  get: (id, options = {}) => getRequest(`/clusters/${id}`, options),
  update: (id, data, config = {}) => api.patch(`/clusters/${id}`, data, config),
  remove: (id, config = {}) => api.delete(`/clusters/${id}`, config),
  listMembers: (id, options = {}) => getRequest(`/clusters/${id}/members`, options),
  addMembers: (id, userIds, config = {}) => api.post(`/clusters/${id}/members`, { userIds }, config),
  removeMembers: (id, userIds, config = {}) =>
    api.delete(`/clusters/${id}/members`, { data: { userIds }, ...config }),
  importMembersCsv: (id, file, config = {}) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/clusters/${id}/members/csv`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      ...config,
    });
  },
  listSends: (id, options = {}) => getRequest(`/clusters/${id}/sends`, options),
  createSend: (id, surveyId, scheduledFor, config = {}) =>
    api.post(
      `/clusters/${id}/sends`,
      {
        surveyId,
        ...(scheduledFor ? { scheduledFor } : {})
      },
      config
    ),
  getSend: (sendId, options = {}) => getRequest(`/clusters/sends/${sendId}`, options),
  listSendResponses: (sendId, options = {}) => getRequest(`/clusters/sends/${sendId}/responses`, options),
  exportSendResponsesCsv: (sendId, config = {}) =>
    api.get(`/clusters/sends/${sendId}/responses/csv`, { responseType: 'blob', ...config }),
};

export const sepSurveyAPI = {
  getAvailable: (options = {}) => getRequest('/sepsurveys', options),
  getById: (surveyId, config = {}) => api.get(`/sepsurveys/${surveyId}`, config),
  submit: (surveyId, responses, timingData, config = {}) => api.post(`/sepsurveys/${surveyId}/submit`, { responses, timingData }, config),
  skip: (surveyId, config = {}) => api.post(`/sepsurveys/${surveyId}/skip`, {}, config),
  getHistory: (options = {}) => getRequest('/sepsurveys/history', options),
  create: (data, config = {}) => api.post('/sepsurveys', data, config),
  update: (surveyId, data, config = {}) => api.put(`/sepsurveys/${surveyId}`, data, config),
  updateStatus: (surveyId, status, config = {}) => api.put(`/sepsurveys/${surveyId}/status`, { status }, config),
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

/** Public homepage Discover feed (stable card DTO). */
export const discoverAPI = {
  getRewards: (options = {}) => getRequest('/discover', { skipErrorToast: true, ...options }),
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