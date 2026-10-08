// Business management. Lists merchants, redeemed vouchers, and the dialogs to edit a business or a voucher offer.

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { adminAPI, sepSurveyAPI } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import { businessRedeemedVouchersPath, isFullAdminRole } from '../../../utils/adminRoles';
import {
  ArrowLeft, Building2, ShieldAlert, Users, Ticket,
} from 'lucide-react';
import toast from 'react-hot-toast';
import StatsGrid from '../components/StatsGrid.jsx';
import BusinessDashboardModal from '../components/BusinessDashboardModal.jsx';
import BusinessList from './BusinessList.jsx';
import BusinessFormModal from './BusinessFormModal.jsx';
import BusinessPasswordModal from './BusinessPasswordModal.jsx';
import VoucherOfferModal from './VoucherOfferModal.jsx';
import {
  BUSINESS_PAGE_SIZE,
  EMPTY_BUSINESS_FORM,
  EMPTY_FEEDBACK_SURVEY_ROW,
  EMPTY_VOUCHER_FORM,
  NAVY,
  VOUCHER_STATUSES,
  formFromOffer,
  last7NepalDaysRange,
  placeError,
} from './businessShared.js';

export default function AdminBusinessManagement() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const fullAdmin = isFullAdminRole(user?.role);
  const [searchParams, setSearchParams] = useSearchParams();
  const verifiedParam = searchParams.get('verified');
  const verifiedFilter = verifiedParam === 'pending' ? 'pending' : 'all';
  const showingRedeemed = searchParams.get('view') === 'redeemed' && !fullAdmin;
  const voucherStatusParam = VOUCHER_STATUSES.includes(searchParams.get('status'))
    ? searchParams.get('status')
    : 'used';
  const voucherFromParam = searchParams.get('from') || '';
  const voucherToParam = searchParams.get('to') || '';

  // Business list
  const [businesses, setBusinesses]               = useState([]);
  const [loading, setLoading]                     = useState(true);
  const [currentPage, setCurrentPage]             = useState(1);
  const [totalPages, setTotalPages]               = useState(1);
  const [listTotal, setListTotal]                 = useState(0);
    const [dashboardStats, setDashboardStats]       = useState(null);
  const [expandedBusinesses, setExpandedBusinesses] = useState({});
  const [businessOffers, setBusinessOffers]       = useState({});
  const [offersLoading, setOffersLoading]         = useState({});
  const [logoUploading, setLogoUploading]         = useState({});

  // Voucher offer modal
  const [selectedBusinessForModal, setSelectedBusinessForModal] = useState(null);
  const [editingOffer, setEditingOffer]           = useState(null);
  const [voucherForm, setVoucherForm]             = useState(EMPTY_VOUCHER_FORM);
  const [voucherModalError, setVoucherModalError] = useState('');
  const [voucherSubmitLoading, setVoucherSubmitLoading] = useState(false);

  // Feedback survey picker (for the voucher offer modal)
  const [availableSurveys, setAvailableSurveys]   = useState([]);
  const [surveysLoading, setSurveysLoading]       = useState(false);
  const [surveysLoaded, setSurveysLoaded]         = useState(false);

  // Add/edit-business modal
  const [showAddBusinessModal, setShowAddBusinessModal] = useState(false);
  const [editingBusiness, setEditingBusiness]     = useState(null);
  const [businessForm, setBusinessForm]           = useState(EMPTY_BUSINESS_FORM);
  const [businessModalError, setBusinessModalError] = useState('');
  const [businessSubmitLoading, setBusinessSubmitLoading] = useState(false);
  const [showPassword, setShowPassword]           = useState(false);
  const [posterUploading, setPosterUploading]     = useState(false);
  const [ratingRefreshing, setRatingRefreshing]   = useState(false);
  const [selectedBusinessForPassword, setSelectedBusinessForPassword] = useState(null);
  const [newPassword, setNewPassword]                                 = useState('');
  const [passwordModalError, setPasswordModalError]                   = useState('');
  const [passwordSubmitLoading, setPasswordSubmitLoading]             = useState(false);
  const [showNewPassword, setShowNewPassword]                         = useState(false);
  const [dashboardBusiness, setDashboardBusiness]                     = useState(null);
  const [repeatVisitSaving, setRepeatVisitSaving]                   = useState({});
  const [vouchers, setVouchers] = useState([]);
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [voucherPage, setVoucherPage] = useState(1);
  const [voucherPagination, setVoucherPagination] = useState(null);
  const [voucherStatusCounts, setVoucherStatusCounts] = useState({
    active: 0,
    used: 0,
    expired: 0,
    cancelled: 0,
  });
  const [voucherRedeemedInRange, setVoucherRedeemedInRange] = useState(null);

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  useEffect(() => { fetchStats(); }, []);
  useEffect(() => {
    fetchBusinesses(currentPage);
  }, [currentPage, verifiedFilter]);

  useEffect(() => {
    if (searchParams.get('view') !== 'redeemed' || !fullAdmin) return;
    const from = searchParams.get('from') || '';
    const to = searchParams.get('to') || '';
    const status = VOUCHER_STATUSES.includes(searchParams.get('status'))
      ? searchParams.get('status')
      : 'used';
    const params = new URLSearchParams({ tab: 'vouchers', status });
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    navigate(`/admin?${params.toString()}`, { replace: true });
  }, [fullAdmin, navigate, searchParams]);

  const loadRedeemedVouchers = useCallback(async (status, page, from, to) => {
    setVoucherLoading(true);
    try {
      const [listRes, statsRes] = await Promise.all([
        adminAPI.getVouchers({
          status,
          page,
          limit: 20,
          ...(from && { from }),
          ...(to && { to }),
          skipErrorToast: true,
        }),
        adminAPI.getVoucherStats({
          ...(from && { from }),
          ...(to && { to }),
          skipErrorToast: true,
        }),
      ]);
      setVouchers(listRes.data.data || []);
      setVoucherPagination(listRes.data.pagination || null);
      const data = statsRes.data.data || {};
      if (from || to) {
        setVoucherStatusCounts(data.inRangeByStatus || { active: 0, used: 0, expired: 0, cancelled: 0 });
        setVoucherRedeemedInRange(data.redeemedInRange ?? 0);
      } else {
        setVoucherStatusCounts(data.byStatus || { active: 0, used: 0, expired: 0, cancelled: 0 });
        setVoucherRedeemedInRange(null);
      }
    } catch {
      toast.error('Failed to load vouchers');
    } finally {
      setVoucherLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!showingRedeemed) return;
    loadRedeemedVouchers(voucherStatusParam, voucherPage, voucherFromParam, voucherToParam);
  }, [
    showingRedeemed,
    voucherStatusParam,
    voucherPage,
    voucherFromParam,
    voucherToParam,
    loadRedeemedVouchers,
  ]);

  const handleVoucherStatusFilter = (status) => {
    setVoucherPage(1);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('view', 'redeemed');
      next.set('status', status);
      return next;
    });
  };

  const handleVoucherDateRangeChange = ({ from, to }) => {
    setVoucherPage(1);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('view', 'redeemed');
      if (from) next.set('from', from);
      else next.delete('from');
      if (to) next.set('to', to);
      else next.delete('to');
      return next;
    });
  };

  const leaveRedeemedView = () => {
    setVoucherPage(1);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('view');
      next.delete('status');
      next.delete('from');
      next.delete('to');
      return next;
    });
  };

  const setVerifiedFilter = (next) => {
    setCurrentPage(1);
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      if (next === 'pending') params.set('verified', 'pending');
      else params.delete('verified');
      return params;
    });
  };

  const addPublicSurveyRow = () => {
    setVoucherForm((prev) => ({
      ...prev,
      publicSurveys: [...(prev.publicSurveys || []), ''],
    }));
  };

  const removePublicSurveyRow = (index) => {
    setVoucherForm((prev) => ({
      ...prev,
      publicSurveys: (prev.publicSurveys || []).filter((_, i) => i !== index),
    }));
  };

  const handlePublicSurveyChange = (index, value) => {
    setVoucherForm((prev) => {
      const updated = [...(prev.publicSurveys || [])];
      updated[index] = value;
      return { ...prev, publicSurveys: updated };
    });
  };

  const updatePublicSurveyRow = handlePublicSurveyChange;

  // ── Data fetching ──────────────────────────────────────────────────────────

  const fetchStats = async () => {
    try {
      const res = await adminAPI.getStats({ skipErrorToast: true });
      setDashboardStats(res.data.data);
    } catch (err) {
      console.error('Failed to fetch admin stats', err);
    }
  };

  const fetchBusinesses = async (page = currentPage) => {
    try {
      setLoading(true);
      const res = await adminAPI.getBusinesses({
        page,
        limit: BUSINESS_PAGE_SIZE,
        ...(verifiedFilter === 'pending' ? { isVerified: 'false' } : {}),
        skipErrorToast: true,
      });
      setBusinesses(res.data.data || []);
      setCurrentPage(res.data.pagination?.currentPage || page);
      setTotalPages(res.data.pagination?.totalPages || 1);
      setListTotal(res.data.pagination?.total || 0);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load businesses');
    } finally {
      setLoading(false);
    }
  };

  const handleRepeatVisitsToggle = async (business, showRepeatVisits) => {
    const previous = business.showRepeatVisits !== false;
    setBusinesses((prev) => prev.map((row) => (
      row._id === business._id ? { ...row, showRepeatVisits } : row
    )));
    setRepeatVisitSaving((prev) => ({ ...prev, [business._id]: true }));
    try {
      await adminAPI.setRepeatVisits(business._id, showRepeatVisits, { skipErrorToast: true });
    } catch (err) {
      console.error(err);
      setBusinesses((prev) => prev.map((row) => (
        row._id === business._id ? { ...row, showRepeatVisits: previous } : row
      )));
      toast.error('Failed to update visit counts');
    } finally {
      setRepeatVisitSaving((prev) => ({ ...prev, [business._id]: false }));
    }
  };

  const fetchOffers = async (businessId) => {
    try {
      setOffersLoading(prev => ({ ...prev, [businessId]: true }));
      const res = await adminAPI.getVoucherOffers({ businessId, skipErrorToast: true });
      setBusinessOffers(prev => ({ ...prev, [businessId]: res.data.data || [] }));
    } catch (err) {
      console.error(err);
      toast.error('Failed to load voucher offers');
    } finally {
      setOffersLoading(prev => ({ ...prev, [businessId]: false }));
    }
  };

  const toggleExpand = async (businessId) => {
    const isExpanded = !!expandedBusinesses[businessId];
    setExpandedBusinesses(prev => ({ ...prev, [businessId]: !isExpanded }));
    if (!isExpanded && !businessOffers[businessId]) fetchOffers(businessId);
  };

  // Fetch the full survey list (admin sees everything, including drafts and
  // targeted surveys) once, the first time the voucher offer modal is opened.
  const fetchAvailableSurveys = async () => {
    try {
      setSurveysLoading(true);
      const res = await sepSurveyAPI.getAvailable({ limit: 100, manage: 1, skipErrorToast: true });
      setAvailableSurveys(res.data.data || []);
      setSurveysLoaded(true);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load surveys for feedback picker');
    } finally {
      setSurveysLoading(false);
    }
  };

  // ── Logo actions ───────────────────────────────────────────────────────────

  const handleLogoUpload = async (business, file) => {
    if (!file) return;
    try {
      setLogoUploading(prev => ({ ...prev, [business._id]: true }));
      const formData = new FormData();
      formData.append('logo', file);
      const res = await adminAPI.uploadBusinessLogo(business._id, formData);
      const updated = res.data.data;
      setBusinesses(prev => prev.map(b => (b._id === business._id ? updated : b)));
      toast.success('Logo updated');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to upload logo');
    } finally {
      setLogoUploading(prev => ({ ...prev, [business._id]: false }));
    }
  };

  // ── Voucher offer actions ──────────────────────────────────────────────────

  const openVoucherModal = (business) => {
    setSelectedBusinessForModal(business);
    setEditingOffer(null);
    setVoucherForm(EMPTY_VOUCHER_FORM);
    setVoucherModalError('');
    if (!surveysLoaded) fetchAvailableSurveys();
  };

  const openEditVoucherModal = (business, offer) => {
    setSelectedBusinessForModal(business);
    setEditingOffer(offer);
    setVoucherForm(formFromOffer(offer));
    setVoucherModalError('');
    if (!surveysLoaded) fetchAvailableSurveys();
  };

  const closeVoucherModal = () => {
    setSelectedBusinessForModal(null);
    setEditingOffer(null);
  };

  const handleDeleteOffer = async (offerId, businessId) => {
    if (!window.confirm('Are you sure you want to permanently delete this voucher offer?')) return;
    try {
      await adminAPI.deleteVoucherOffer(offerId);
      toast.success('Voucher offer deleted');
      setBusinessOffers(prev => ({
        ...prev,
        [businessId]: (prev[businessId] || []).filter(o => o._id !== offerId),
      }));
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to delete voucher offer');
    }
  };

  // ── Feedback survey row helpers ─────────────────────────────────────────────

  const addFeedbackSurveyRow = () => {
    setVoucherForm(f => ({
      ...f,
      feedbackSurveys: [...f.feedbackSurveys, { ...EMPTY_FEEDBACK_SURVEY_ROW }],
    }));
  };

  const removeFeedbackSurveyRow = (index) => {
    setVoucherForm(f => ({
      ...f,
      feedbackSurveys: f.feedbackSurveys.filter((_, i) => i !== index),
    }));
  };

  const updateFeedbackSurveyRow = (index, key, value) => {
    setVoucherForm(f => ({
      ...f,
      feedbackSurveys: f.feedbackSurveys.map((row, i) =>
        i === index ? { ...row, [key]: value } : row
      ),
    }));
  };

  const handleVoucherSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBusinessForModal) return;
    const isEdit = Boolean(editingOffer);
    if (!voucherForm.validUntil) {
      setVoucherModalError('A calendar deadline date is mandatory.');
      return;
    }
    if (!isEdit && new Date(voucherForm.validUntil) <= new Date()) {
      setVoucherModalError('The calendar deadline must be set to a future date.');
      return;
    }

    // Validate feedback survey rows before submitting
    for (const row of voucherForm.feedbackSurveys) {
      if (!row.survey) {
        setVoucherModalError('Each feedback survey row needs a survey selected (or remove the row).');
        return;
      }
      if ((row.trigger === 'nth_redemption' || row.trigger === 'days_after_redemption')) {
        const n = Number(row.triggerValue);
        if (!row.triggerValue || Number.isNaN(n) || n <= 0) {
          setVoucherModalError(
            row.trigger === 'nth_redemption'
              ? 'Enter which redemption number (e.g. 2) for the "Nth time redeeming" trigger.'
              : 'Enter how many days after redemption for the "X days after" trigger.'
          );
          return;
        }
      }
    }

    setVoucherSubmitLoading(true);
    setVoucherModalError('');
    try {
      const payload = {
        businessId:          selectedBusinessForModal._id,
        title:               voucherForm.title,
        description:         voucherForm.description,
        discountType:        voucherForm.discountType,
        discountValue:       (voucherForm.discountType === 'percentage' || voucherForm.discountType === 'flat')
          ? Number(voucherForm.discountValue)
          : (voucherForm.discountType === 'free_item' ? (voucherForm.discountValue || null) : null),
        approxValue:         voucherForm.approxValue !== '' ? Number(voucherForm.approxValue) : null,
        creditsRequired:     Number(voucherForm.creditsRequired),
        expiryDays:          Number(voucherForm.expiryDays),
        validUntil:          new Date(voucherForm.validUntil).toISOString(),
        perUserMonthlyLimit: voucherForm.perUserMonthlyLimit !== '' ? Number(voucherForm.perUserMonthlyLimit) : null,
        totalStock:          voucherForm.totalStock !== '' ? Number(voucherForm.totalStock) : null,
        imageUrl:            voucherForm.imageUrl,
        feedbackSurveys:     voucherForm.feedbackSurveys.map(row => ({
          survey:       row.survey,
          trigger:      row.trigger,
          triggerValue: (row.trigger === 'nth_redemption' || row.trigger === 'days_after_redemption')
            ? Number(row.triggerValue)
            : null,
          active:       row.active,
        })),
        publicSurveys: (voucherForm.publicSurveys || []).filter(Boolean),
      };
      const res = isEdit
        ? await adminAPI.updateVoucherOffer(editingOffer._id, payload)
        : await adminAPI.createVoucherOffer(payload);
      toast.success(isEdit ? 'Voucher offer updated' : 'Voucher offer created successfully');
      const savedOffer = res.data.data;
      if (savedOffer) {
        setBusinessOffers(prev => {
          const current = prev[selectedBusinessForModal._id] || [];
          const next = isEdit
            ? current.map((offer) => (offer._id === editingOffer._id ? savedOffer : offer))
            : [savedOffer, ...current];
          return { ...prev, [selectedBusinessForModal._id]: next };
        });
      } else {
        fetchOffers(selectedBusinessForModal._id);
      }
      closeVoucherModal();
    } catch (err) {
      console.error(err);
      setVoucherModalError(err.response?.data?.message || (isEdit ? 'Failed to update voucher offer' : 'Failed to create voucher offer'));
    } finally {
      setVoucherSubmitLoading(false);
    }
  };

  // ── Add-business actions ───────────────────────────────────────────────────

  const openAddBusinessModal = () => {
    setEditingBusiness(null);
    setBusinessForm(EMPTY_BUSINESS_FORM);
    setBusinessModalError('');
    setShowPassword(false);
    setShowAddBusinessModal(true);
  };

  const closeBusinessModal = () => {
    setShowAddBusinessModal(false);
    setEditingBusiness(null);
    setBusinessModalError('');
  };

  const formFromBusiness = (business) => ({
    name: business.name || '',
    brandName: business.brandName || '',
    email: business.email || '',
    password: '',
    phone: business.phone || '',
    address: business.address || '',
    category: business.category || '',
    categories: Array.isArray(business.categories) ? business.categories : [],
    description: business.description || '',
    contactName: business.contactPerson?.name || '',
    contactDesignation: business.contactPerson?.designation || '',
    contactPhone: business.contactPerson?.phone || '',
    operatingDays: business.operatingDays || [],
    openingTime: business.operatingHours?.open || '',
    closingTime: business.operatingHours?.close || '',
    instagram: business.instagram || '',
    website: business.website || '',
    googleMapsUrl: business.googleMapsUrl || '',
    municipality: business.municipality || '',
    wardNumber: business.wardNumber || '',
    isVerified: !!business.isVerified,
    searchKeywords: Array.isArray(business.searchKeywords) ? business.searchKeywords : [],
  });

  const openEditBusinessModal = (business) => {
    setEditingBusiness(business);
    setBusinessForm(formFromBusiness(business));
    setBusinessModalError('');
    setShowPassword(false);
    setShowAddBusinessModal(true);
  };

  const mergeBusiness = (updated) => {
    setBusinesses((prev) => prev.map((b) => (b._id === updated._id ? { ...b, ...updated } : b)));
    setEditingBusiness((prev) => (prev && prev._id === updated._id ? { ...prev, ...updated } : prev));
  };

  const profilePayload = () => ({
    name:         businessForm.name,
    brandName:    businessForm.brandName,
    phone:        businessForm.phone,
    address:      businessForm.address,
    municipality: businessForm.municipality,
    wardNumber:   businessForm.wardNumber,
    category:     businessForm.category,
    categories:   businessForm.categories,
    description:  businessForm.description,
    contactPerson: {
      name:        businessForm.contactName,
      designation: businessForm.contactDesignation,
      phone:       businessForm.contactPhone,
    },
    operatingDays:  businessForm.operatingDays,
    operatingHours: {
      open:  businessForm.openingTime,
      close: businessForm.closingTime,
    },
    instagram:     businessForm.instagram,
    website:       businessForm.website,
    googleMapsUrl: businessForm.googleMapsUrl,
    isVerified:    businessForm.isVerified,
    searchKeywords: businessForm.searchKeywords,
  });

  const handleSaveBusiness = async (e) => {
    e.preventDefault();
    const localityError = placeError(businessForm.municipality, businessForm.wardNumber);
    if (localityError) {
      setBusinessModalError(localityError);
      return;
    }
    if (!editingBusiness && businessForm.password.length < 8) {
      setBusinessModalError('Password must be at least 8 characters.');
      return;
    }
    setBusinessSubmitLoading(true);
    setBusinessModalError('');
    try {
      if (editingBusiness) {
        const res = await adminAPI.updateBusiness(editingBusiness._id, profilePayload());
        toast.success('Business updated');
        mergeBusiness(res.data.data);
        fetchStats();
        closeBusinessModal();
      } else {
        const payload = {
          ...profilePayload(),
          email:    businessForm.email,
          password: businessForm.password,
        };
        const res = await adminAPI.createBusiness(payload);
        toast.success('Business created successfully!');
        const newBusiness = res.data.data;
        if (newBusiness) {
          setBusinesses((prev) => [newBusiness, ...prev]);
          setListTotal((n) => n + 1);
        } else {
          fetchBusinesses();
        }
        fetchStats();
        closeBusinessModal();
      }
    } catch (err) {
      console.error(err);
      setBusinessModalError(
        err.response?.data?.message || (editingBusiness ? 'Failed to update business' : 'Failed to create business')
      );
    } finally {
      setBusinessSubmitLoading(false);
    }
  };

  const handlePosterUpload = async (file) => {
    if (!file || !editingBusiness) return;
    try {
      setPosterUploading(true);
      const formData = new FormData();
      formData.append('poster', file);
      const res = await adminAPI.uploadBusinessPoster(editingBusiness._id, formData);
      mergeBusiness(res.data.data);
      toast.success('Poster added');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload poster');
    } finally {
      setPosterUploading(false);
    }
  };

  const handlePosterDelete = async (index) => {
    if (!editingBusiness) return;
    try {
      const res = await adminAPI.deleteBusinessPoster(editingBusiness._id, index);
      mergeBusiness(res.data.data);
      toast.success('Poster removed');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove poster');
    }
  };

  const handleRefreshRating = async () => {
    if (!editingBusiness) return;
    try {
      setRatingRefreshing(true);
      const res = await adminAPI.refreshBusinessGoogleRating(editingBusiness._id);
      mergeBusiness(res.data.data);
      toast.success('Rating updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to refresh rating');
    } finally {
      setRatingRefreshing(false);
    }
  };

  const toggleDay = (day) => {
    setBusinessForm(f => ({
      ...f,
      operatingDays: f.operatingDays.includes(day)
        ? f.operatingDays.filter(d => d !== day)
        : [...f.operatingDays, day],
    }));
  };

  const toggleCategory = (cat) => {
    setBusinessForm(f => {
      const has = f.categories.includes(cat);
      if (has) return { ...f, categories: f.categories.filter(c => c !== cat) };
      if (f.categories.length >= 3) return f; // max 3
      return { ...f, categories: [...f.categories, cat] };
    });
  };

  const handleDeleteBusiness = async (business) => {
    if (!window.confirm(`Permanently delete "${business.name}"? This cannot be undone.`)) return;
    try {
      await adminAPI.deleteBusiness(business._id);
      toast.success('Business deleted');
      setBusinesses(prev => prev.filter(b => b._id !== business._id));
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to delete business');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      setPasswordModalError('Password must be at least 8 characters.');
      return;
    }
    setPasswordSubmitLoading(true);
    setPasswordModalError('');
    try {
      await adminAPI.changeBusinessPassword(selectedBusinessForPassword._id, { password: newPassword });
      toast.success('Password updated');
      setSelectedBusinessForPassword(null);
    } catch (err) {
      console.error(err);
      setPasswordModalError(err.response?.data?.message || 'Failed to update password');
    } finally {
      setPasswordSubmitLoading(false);
    }
  };

  // ── Field helpers ──────────────────────────────────────────────────────────

  const bField = (key) => ({
    value: businessForm[key],
    onChange: (e) => setBusinessForm(f => ({ ...f, [key]: e.target.value })),
  });

  const vField = (key) => ({
    value: voucherForm[key],
    onChange: (e) => setVoucherForm(f => ({ ...f, [key]: e.target.value })),
  });

  // ── Shared input class ─────────────────────────────────────────────────────

  const inputCls = 'w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-gray-900 transition-colors';

  const redeemedRange = useMemo(() => last7NepalDaysRange(), []);
  const stats = [
    { label: 'Total Users', value: dashboardStats?.totalUsers ?? 0, icon: Users },
    {
      label: 'Total Businesses',
      value: dashboardStats?.totalBusinesses ?? listTotal,
      icon: Building2,
      to: '/admin/businesses',
    },
    {
      label: 'Pending businesses',
      value: dashboardStats?.pendingBusinesses ?? 0,
      icon: ShieldAlert,
      to: '/admin/businesses?verified=pending',
    },
    {
      label: 'Redeemed (7d)',
      value: dashboardStats?.vouchersRedeemedWeek ?? 0,
      icon: Ticket,
      to: fullAdmin
        ? `/admin?tab=vouchers&status=used&from=${redeemedRange.from}&to=${redeemedRange.to}`
        : businessRedeemedVouchersPath(redeemedRange.from, redeemedRange.to),
    },
  ];

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 pb-28" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="max-w-6xl mx-auto">

        {/* ── Page header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <button
              onClick={() => {
                if (showingRedeemed) {
                  leaveRedeemedView();
                  return;
                }
                navigate(fullAdmin ? '/admin' : '/profile');
              }}
              className="p-2 bg-white border border-gray-200 rounded-xl shadow-sm hover:bg-gray-50 transition-colors shrink-0"
              aria-label={showingRedeemed ? 'Back to businesses' : 'Back'}
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <h1 className="text-lg sm:text-2xl font-bold text-gray-900 leading-tight">Business Management</h1>
          </div>
          <button
            onClick={openAddBusinessModal}
            className="flex items-center justify-center gap-1.5 px-4 py-2 text-white rounded-xl text-sm font-medium shadow-sm transition-all hover:opacity-90 shrink-0"
            style={{ backgroundColor: NAVY }}
          >
            <Building2 className="h-4 w-4" />
            Add Business
          </button>
        </div>

        <StatsGrid stats={stats} NAVY={NAVY} />

        <BusinessList
          businessOffers={businessOffers}
          businesses={businesses}
          currentPage={currentPage}
          dashboardStats={dashboardStats}
          expandedBusinesses={expandedBusinesses}
          handleDeleteBusiness={handleDeleteBusiness}
          handleDeleteOffer={handleDeleteOffer}
          handleLogoUpload={handleLogoUpload}
          handleRepeatVisitsToggle={handleRepeatVisitsToggle}
          handleVoucherDateRangeChange={handleVoucherDateRangeChange}
          handleVoucherStatusFilter={handleVoucherStatusFilter}
          listTotal={listTotal}
          loadRedeemedVouchers={loadRedeemedVouchers}
          loading={loading}
          logoUploading={logoUploading}
          offersLoading={offersLoading}
          openEditBusinessModal={openEditBusinessModal}
          openEditVoucherModal={openEditVoucherModal}
          openVoucherModal={openVoucherModal}
          repeatVisitSaving={repeatVisitSaving}
          setCurrentPage={setCurrentPage}
          setDashboardBusiness={setDashboardBusiness}
          setNewPassword={setNewPassword}
          setPasswordModalError={setPasswordModalError}
          setSelectedBusinessForPassword={setSelectedBusinessForPassword}
          setShowNewPassword={setShowNewPassword}
          setVerifiedFilter={setVerifiedFilter}
          setVoucherPage={setVoucherPage}
          showingRedeemed={showingRedeemed}
          toggleExpand={toggleExpand}
          totalPages={totalPages}
          verifiedFilter={verifiedFilter}
          voucherFromParam={voucherFromParam}
          voucherLoading={voucherLoading}
          voucherPage={voucherPage}
          voucherPagination={voucherPagination}
          voucherRedeemedInRange={voucherRedeemedInRange}
          voucherStatusCounts={voucherStatusCounts}
          voucherStatusParam={voucherStatusParam}
          voucherToParam={voucherToParam}
          vouchers={vouchers}
        />
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          ADD BUSINESS MODAL
      ════════════════════════════════════════════════════════════════════ */}
      <BusinessFormModal
        bField={bField}
        businessForm={businessForm}
        businessModalError={businessModalError}
        businessSubmitLoading={businessSubmitLoading}
        closeBusinessModal={closeBusinessModal}
        editingBusiness={editingBusiness}
        handlePosterDelete={handlePosterDelete}
        handlePosterUpload={handlePosterUpload}
        handleRefreshRating={handleRefreshRating}
        handleSaveBusiness={handleSaveBusiness}
        inputCls={inputCls}
        posterUploading={posterUploading}
        ratingRefreshing={ratingRefreshing}
        setBusinessForm={setBusinessForm}
        setShowPassword={setShowPassword}
        showAddBusinessModal={showAddBusinessModal}
        showPassword={showPassword}
        toggleCategory={toggleCategory}
        toggleDay={toggleDay}
      />

      {/* ════════════════════════════════════════════════════════════════════
          CHANGE PASSWORD MODAL
      ════════════════════════════════════════════════════════════════════ */}
      <BusinessPasswordModal
        handleChangePassword={handleChangePassword}
        inputCls={inputCls}
        newPassword={newPassword}
        passwordModalError={passwordModalError}
        passwordSubmitLoading={passwordSubmitLoading}
        selectedBusinessForPassword={selectedBusinessForPassword}
        setNewPassword={setNewPassword}
        setSelectedBusinessForPassword={setSelectedBusinessForPassword}
        setShowNewPassword={setShowNewPassword}
        showNewPassword={showNewPassword}
      />

      {/* ════════════════════════════════════════════════════════════════════
          CREATE VOUCHER OFFER MODAL
      ════════════════════════════════════════════════════════════════════ */}
      <VoucherOfferModal
        addFeedbackSurveyRow={addFeedbackSurveyRow}
        addPublicSurveyRow={addPublicSurveyRow}
        availableSurveys={availableSurveys}
        closeVoucherModal={closeVoucherModal}
        editingOffer={editingOffer}
        handleVoucherSubmit={handleVoucherSubmit}
        inputCls={inputCls}
        removeFeedbackSurveyRow={removeFeedbackSurveyRow}
        removePublicSurveyRow={removePublicSurveyRow}
        selectedBusinessForModal={selectedBusinessForModal}
        surveysLoading={surveysLoading}
        updateFeedbackSurveyRow={updateFeedbackSurveyRow}
        updatePublicSurveyRow={updatePublicSurveyRow}
        vField={vField}
        voucherForm={voucherForm}
        voucherModalError={voucherModalError}
        voucherSubmitLoading={voucherSubmitLoading}
      />

      {dashboardBusiness && (
        <BusinessDashboardModal
          business={dashboardBusiness}
          onClose={() => setDashboardBusiness(null)}
        />
      )}
    </div>
  );
}