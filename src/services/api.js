import axios from 'axios';
import toast from 'react-hot-toast';
import { attachCsrf } from '../utils/csrf';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

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
      const url = error.config?.url || '';
      const isBrandRequest = url.includes('/brand/');
      const isBusinessRequest = url.includes('/business');
      // Brand 401 only redirects brand clients. Do not clear staff/user tokens.
      if (isBrandRequest) {
        if (window.location.pathname.startsWith('/brand')) {
          window.location.href = '/brand/login';
        }
      } else if (isBusinessRequest) {
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

export const healthAPI = {
  track: (data, config = {}) => api.post('/signals/event', data, {
    skipErrorToast: true,
    skipAuthRedirect: true,
    ...config,
  }),
  trackVisitor: (data, config = {}) => api.post('/signals/visitor', data, {
    skipErrorToast: true,
    skipAuthRedirect: true,
    ...config,
  }),
  visit: (data, config = {}) => api.post('/signals/visit', data, {
    skipErrorToast: true,
    skipAuthRedirect: true,
    ...config,
  }),
};

export const authAPI = {
  login: (data, config = {}) => api.post('/auth/login', data, config),
  register: (data, config = {}) => api.post('/auth/register', data, config),
  logout: (config = {}) => api.post('/auth/logout', {}, { skipErrorToast: true, ...config }),
  forgotPassword: (data, config = {}) => api.post('/auth/forgot-password', data, config),
  resetPassword: (token, data, config = {}) => api.put(`/auth/reset-password/${token}`, data, config),
};

export const userAPI = {
  getProfile: (config = {}) => api.get('/users/me', config),
  deleteAccount: (config = {}) => api.delete('/users/me/delete', config),
  updateBasicProfile: (data, config = {}) => api.put('/users/me/basic-profile', data, config),
  updateDemographics: (data, config = {}) => api.put('/users/me/demographics', data, config),
  updateAdditionalProfile: (data, config = {}) => api.put('/users/me/additional-profile', data, config),
  purchaseStreakGuard: (days, config = {}) => api.post('/users/me/streak-guard', { days }, config),
  getActivity: (options = {}) => getRequest('/users/me/activity', options),
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
  giftUserVoucher: (userId, data, config = {}) => api.post(`/admin/users/${userId}/gift-voucher`, data, config),
  restoreUserStreak: (userId, data, config = {}) =>
    api.post(`/admin/users/${userId}/restore-streak`, data, config),
  getStats: (options = {}) => getRequest('/admin/stats', options),
  updateUserStatus: (userId, data, config = {}) => api.put(`/admin/users/${userId}/status`, data, config),
  getBusinesses: (options = {}) => getRequest('/admin/businesses', options),
  getBusinessDashboard: (id, options = {}) => getRequest(`/admin/businesses/${id}/dashboard`, options),
  createBusiness: (data, config = {}) => api.post('/admin/businesses', data, config),
  updateBusiness: (id, data, config = {}) => api.put(`/admin/businesses/${id}`, data, config),
  verifyBusiness: (id, data, config = {}) => api.put(`/admin/businesses/${id}/verify`, data, config),
  setRepeatVisits: (id, showRepeatVisits, config = {}) =>
    api.put(`/admin/businesses/${id}/repeat-visits`, { showRepeatVisits }, config),
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
  getVoucherRecommendations: (options = {}) => getRequest('/admin/voucher-recommendations', options),
  createVoucherRecommendation: (data, config = {}) => api.post('/admin/voucher-recommendations', data, config),
  updateVoucherRecommendation: (id, data, config = {}) => api.put(`/admin/voucher-recommendations/${id}`, data, config),
  deleteVoucherRecommendation: (id, config = {}) => api.delete(`/admin/voucher-recommendations/${id}`, config),
  createVoucherOffer: (data, config = {}) => api.post('/admin/voucher-offers', data, config),
  updateVoucherOffer: (id, data, config = {}) => api.put(`/admin/voucher-offers/${id}`, data, config),
  getVouchers: (options = {}) => getRequest('/admin/vouchers', options),
  cancelVoucher: (id, config = {}) => api.post(`/admin/vouchers/${id}/cancel`, {}, config),
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
  getHealth: (options = {}) => getRequest('/admin/health', options),
  getBrandMetrics: (category, brand, metrics, config = {}) => api.get('/admin/brand-metrics', {
    ...config,
    params: { category, brand, metrics },
  }),
  getBrandMetricsStatus: (config = {}) => api.get('/admin/brand-metrics/status', config),
  importBrandMetricsCsv: (formData, config = {}) => api.post('/admin/brand-metrics/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    ...config,
  }),
  getInsightOverview: (config = {}) => api.get('/admin/insights/overview', config),
  listInsightCompanies: (config = {}) => api.get('/admin/insights/companies', config),
  createInsightCompany: (data, config = {}) => api.post('/admin/insights/companies', data, config),
  updateInsightCompany: (id, data, config = {}) => api.put(`/admin/insights/companies/${id}`, data, config),
  deleteInsightCompany: (id, config = {}) => api.delete(`/admin/insights/companies/${id}`, config),
  listInsightBrands: (params = {}, config = {}) => api.get('/admin/insights/brands', { ...config, params }),
  createInsightBrand: (data, config = {}) => api.post('/admin/insights/brands', data, config),
  updateInsightBrand: (id, data, config = {}) => api.put(`/admin/insights/brands/${id}`, data, config),
  deleteInsightBrand: (id, config = {}) => api.delete(`/admin/insights/brands/${id}`, config),
  seedInsightBrands: (config = {}) => api.post('/admin/insights/brands/seed', {}, config),
  listInsightUsers: (config = {}) => api.get('/admin/insights/users', config),
  createInsightUser: (data, config = {}) => api.post('/admin/insights/users', data, config),
  updateInsightUser: (id, data, config = {}) => api.put(`/admin/insights/users/${id}`, data, config),
  listInsightInvites: (params = {}, config = {}) => api.get('/admin/insights/invites', { ...config, params }),
  createActivateInvite: (data, config = {}) => api.post('/admin/insights/invites/activate', data, config),
  createResetInvite: (data, config = {}) => api.post('/admin/insights/invites/reset', data, config),
  revokeInsightInvite: (id, config = {}) => api.post(`/admin/insights/invites/${id}/revoke`, {}, config),
  listInsightWeeks: (params = {}, config = {}) => api.get('/admin/insights/weeks', { ...config, params }),
  upsertInsightWeek: (data, config = {}) => api.put('/admin/insights/weeks', data, config),
  insightReadMeta: (config = {}) => api.get('/admin/insights/reads/meta', config),
  listInsightReads: (params = {}, config = {}) => api.get('/admin/insights/reads', { ...config, params }),
  createInsightRead: (data, config = {}) => api.post('/admin/insights/reads', data, config),
  updateInsightRead: (id, data, config = {}) => api.put(`/admin/insights/reads/${id}`, data, config),
  deleteInsightRead: (id, config = {}) => api.delete(`/admin/insights/reads/${id}`, config),
  copyInsightReadsFromLast: (data, config = {}) => api.post('/admin/insights/reads/copy-from-last', data, config),
  getInsightUsage: (params = {}, config = {}) => api.get('/admin/insights/usage', { ...config, params }),
  exportInsightUsageCsv: (params = {}, config = {}) => api.get('/admin/insights/usage/csv', {
    responseType: 'blob',
    ...config,
    params,
  }),
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

export const fifteenDaySurveyAPI = {
  getBoard: (config = {}) => api.get('/fifteen-day/board', config),
  create: (data, config = {}) => api.post('/fifteen-day', data, config),
  getById: (surveyId, config = {}) => api.get(`/fifteen-day/${surveyId}`, config),
  update: (surveyId, data, config = {}) => api.put(`/fifteen-day/${surveyId}`, data, config),
  archive: (surveyId, config = {}) => api.delete(`/fifteen-day/${surveyId}`, config),
  exportTimings: (surveyId, config = {}) =>
    api.get(`/fifteen-day/${surveyId}/timings/csv`, { responseType: "blob", ...config }),
  updateProgram: (existingUsersSendAt, config = {}) =>
    api.put('/fifteen-day/program', { existingUsersSendAt }, config),
  getMine: (config = {}) => api.get('/fifteen-day/mine', config),
  getToTake: (surveyId, wave, config = {}) =>
    api.get(`/fifteen-day/take/${surveyId}`, {
      ...config,
      params: {
        ...(config.params || {}),
        ...(Number.isInteger(Number(wave)) && Number(wave) >= 1 ? { wave: Number(wave) } : {}),
      },
    }),
  submit: (surveyId, responses, timingData, wave) =>
    api.post(`/fifteen-day/take/${surveyId}/submit`, {
      responses,
      timingData,
      ...(Number.isInteger(Number(wave)) && Number(wave) >= 1 ? { wave: Number(wave) } : {}),
    }),
};

export const voucherAPI = {
  // ALL PATHS PERFECTLY ALIGNED TO BACKEND BASE PATH
  getOffers: (options = {}) => getRequest('/vouchers/voucher-offers', options),
  getRecommended: (options = {}) => getRequest('/vouchers/recommended', options),
  redeem: (offerId, { receivedVia, ...config } = {}) => api.post('/vouchers/redeem', {
    offerId,
    ...(receivedVia ? { receivedVia } : {}),
  }, config),
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
  getPublicProfile: (id, config = {}) => api.get(`/business/public/${id}`, config),
};

export const brandAPI = {
  catalog: (options = {}) => getRequest('/brand/catalog', options),
  signup: (data, config = {}) => api.post('/brand/auth/signup', data, config),
  login: (data, config = {}) => api.post('/brand/auth/login', data, config),
  googleLogin: (data, config = {}) => api.post('/brand/auth/google', data, config),
  forgotPassword: (data, config = {}) => api.post('/brand/auth/forgot-password', data, config),
  resetPassword: (resetToken, data, config = {}) => api.put(`/brand/auth/reset-password/${resetToken}`, data, config),
  changePassword: (data, config = {}) => api.post('/brand/auth/change-password', data, config),
  updateProfile: (data, config = {}) => api.patch('/brand/auth/profile', data, config),
  getActivateInvite: (token, config = {}) => api.get(`/brand/auth/invite/${encodeURIComponent(token)}`, config),
  activate: (data, config = {}) => api.post('/brand/auth/activate', data, config),
  logout: (config = {}) => api.post('/brand/auth/logout', {}, config),
  me: (config = {}) => api.get('/brand/auth/me', config),
  metrics: (metrics, config = {}) => api.get('/brand/metrics', {
    ...config,
    params: { metrics },
  }),
  staffMetrics: (category, brand, metrics, config = {}) => api.get('/brand/staff/metrics', {
    ...config,
    params: { category, brand, metrics },
  }),
  staffMetricsStatus: (config = {}) => api.get('/brand/staff/metrics-status', config),
  insightReads: (params = {}, config = {}) => api.get('/brand/insight-reads', {
    ...config,
    params,
  }),
  // Insights CMS via staff session (same shapes as adminAPI insight methods)
  getInsightOverview: (config = {}) => api.get('/brand/staff/insights/overview', config),
  listInsightCompanies: (config = {}) => api.get('/brand/staff/insights/companies', config),
  createInsightCompany: (data, config = {}) => api.post('/brand/staff/insights/companies', data, config),
  updateInsightCompany: (id, data, config = {}) => api.put(`/brand/staff/insights/companies/${id}`, data, config),
  deleteInsightCompany: (id, config = {}) => api.delete(`/brand/staff/insights/companies/${id}`, config),
  listInsightBrands: (params = {}, config = {}) => api.get('/brand/staff/insights/brands', { ...config, params }),
  createInsightBrand: (data, config = {}) => api.post('/brand/staff/insights/brands', data, config),
  updateInsightBrand: (id, data, config = {}) => api.put(`/brand/staff/insights/brands/${id}`, data, config),
  deleteInsightBrand: (id, config = {}) => api.delete(`/brand/staff/insights/brands/${id}`, config),
  seedInsightBrands: (config = {}) => api.post('/brand/staff/insights/brands/seed', {}, config),
  listInsightUsers: (config = {}) => api.get('/brand/staff/insights/users', config),
  createInsightUser: (data, config = {}) => api.post('/brand/staff/insights/users', data, config),
  updateInsightUser: (id, data, config = {}) => api.put(`/brand/staff/insights/users/${id}`, data, config),
  listInsightInvites: (params = {}, config = {}) => api.get('/brand/staff/insights/invites', { ...config, params }),
  createActivateInvite: (data, config = {}) => api.post('/brand/staff/insights/invites/activate', data, config),
  createResetInvite: (data, config = {}) => api.post('/brand/staff/insights/invites/reset', data, config),
  revokeInsightInvite: (id, config = {}) => api.post(`/brand/staff/insights/invites/${id}/revoke`, {}, config),
  listInsightWeeks: (params = {}, config = {}) => api.get('/brand/staff/insights/weeks', { ...config, params }),
  upsertInsightWeek: (data, config = {}) => api.put('/brand/staff/insights/weeks', data, config),
  insightReadMeta: (config = {}) => api.get('/brand/staff/insights/reads/meta', config),
  listInsightReads: (params = {}, config = {}) => api.get('/brand/staff/insights/reads', { ...config, params }),
  createInsightRead: (data, config = {}) => api.post('/brand/staff/insights/reads', data, config),
  updateInsightRead: (id, data, config = {}) => api.put(`/brand/staff/insights/reads/${id}`, data, config),
  deleteInsightRead: (id, config = {}) => api.delete(`/brand/staff/insights/reads/${id}`, config),
  copyInsightReadsFromLast: (data, config = {}) => api.post('/brand/staff/insights/reads/copy-from-last', data, config),
  getInsightUsage: (params = {}, config = {}) => api.get('/brand/staff/insights/usage', { ...config, params }),
  exportInsightUsageCsv: (params = {}, config = {}) => api.get('/brand/staff/insights/usage/csv', {
    responseType: 'blob',
    ...config,
    params,
  }),
};

/** Staff portal Insights CMS — same method names as adminAPI insight helpers. */
export const brandStaffInsightsAPI = {
  getInsightOverview: brandAPI.getInsightOverview,
  listInsightCompanies: brandAPI.listInsightCompanies,
  createInsightCompany: brandAPI.createInsightCompany,
  updateInsightCompany: brandAPI.updateInsightCompany,
  deleteInsightCompany: brandAPI.deleteInsightCompany,
  listInsightBrands: brandAPI.listInsightBrands,
  createInsightBrand: brandAPI.createInsightBrand,
  updateInsightBrand: brandAPI.updateInsightBrand,
  deleteInsightBrand: brandAPI.deleteInsightBrand,
  seedInsightBrands: brandAPI.seedInsightBrands,
  listInsightUsers: brandAPI.listInsightUsers,
  createInsightUser: brandAPI.createInsightUser,
  updateInsightUser: brandAPI.updateInsightUser,
  listInsightInvites: brandAPI.listInsightInvites,
  createActivateInvite: brandAPI.createActivateInvite,
  createResetInvite: brandAPI.createResetInvite,
  revokeInsightInvite: brandAPI.revokeInsightInvite,
  listInsightWeeks: brandAPI.listInsightWeeks,
  upsertInsightWeek: brandAPI.upsertInsightWeek,
  insightReadMeta: brandAPI.insightReadMeta,
  listInsightReads: brandAPI.listInsightReads,
  createInsightRead: brandAPI.createInsightRead,
  updateInsightRead: brandAPI.updateInsightRead,
  deleteInsightRead: brandAPI.deleteInsightRead,
  copyInsightReadsFromLast: brandAPI.copyInsightReadsFromLast,
  getInsightUsage: brandAPI.getInsightUsage,
  exportInsightUsageCsv: brandAPI.exportInsightUsageCsv,
};

export default api;