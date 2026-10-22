// Merchant list lifecycle: fetch, expand/offers, logo, repeat-visit, delete.

import { useEffect, useState } from 'react';
import { adminAPI } from '../../../services/api';
import toast from 'react-hot-toast';
import { BUSINESS_PAGE_SIZE } from './businessShared.js';

export default function useAdminBusinessList({ verifiedFilter, setSearchParams }) {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [listTotal, setListTotal] = useState(0);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [expandedBusinesses, setExpandedBusinesses] = useState({});
  const [businessOffers, setBusinessOffers] = useState({});
  const [offersLoading, setOffersLoading] = useState({});
  const [logoUploading, setLogoUploading] = useState({});
  const [repeatVisitSaving, setRepeatVisitSaving] = useState({});

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

  useEffect(() => { fetchStats(); }, []);
  useEffect(() => {
    fetchBusinesses(currentPage);
  }, [currentPage, verifiedFilter]);

  const setVerifiedFilter = (next) => {
    setCurrentPage(1);
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      if (next === 'pending') params.set('verified', 'pending');
      else params.delete('verified');
      return params;
    });
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
      setOffersLoading((prev) => ({ ...prev, [businessId]: true }));
      const res = await adminAPI.getVoucherOffers({ businessId, skipErrorToast: true });
      setBusinessOffers((prev) => ({ ...prev, [businessId]: res.data.data || [] }));
    } catch (err) {
      console.error(err);
      toast.error('Failed to load voucher offers');
    } finally {
      setOffersLoading((prev) => ({ ...prev, [businessId]: false }));
    }
  };

  const toggleExpand = async (businessId) => {
    const isExpanded = !!expandedBusinesses[businessId];
    setExpandedBusinesses((prev) => ({ ...prev, [businessId]: !isExpanded }));
    if (!isExpanded && !businessOffers[businessId]) fetchOffers(businessId);
  };

  const handleLogoUpload = async (business, file) => {
    if (!file) return;
    try {
      setLogoUploading((prev) => ({ ...prev, [business._id]: true }));
      const formData = new FormData();
      formData.append('logo', file);
      const res = await adminAPI.uploadBusinessLogo(business._id, formData);
      const updated = res.data.data;
      setBusinesses((prev) => prev.map((b) => (b._id === business._id ? updated : b)));
      toast.success('Logo updated');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to upload logo');
    } finally {
      setLogoUploading((prev) => ({ ...prev, [business._id]: false }));
    }
  };

  const handleDeleteOffer = async (offerId, businessId) => {
    if (!window.confirm('Are you sure you want to permanently delete this voucher offer?')) return;
    try {
      await adminAPI.deleteVoucherOffer(offerId);
      toast.success('Voucher offer deleted');
      setBusinessOffers((prev) => ({
        ...prev,
        [businessId]: (prev[businessId] || []).filter((o) => o._id !== offerId),
      }));
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to delete voucher offer');
    }
  };

  const handleDeleteBusiness = async (business) => {
    if (!window.confirm(`Permanently delete "${business.name}"? This cannot be undone.`)) return;
    try {
      await adminAPI.deleteBusiness(business._id);
      toast.success('Business deleted');
      setBusinesses((prev) => prev.filter((b) => b._id !== business._id));
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to delete business');
    }
  };

  return {
    businesses,
    setBusinesses,
    loading,
    currentPage,
    setCurrentPage,
    totalPages,
    listTotal,
    setListTotal,
    dashboardStats,
    expandedBusinesses,
    businessOffers,
    setBusinessOffers,
    offersLoading,
    logoUploading,
    repeatVisitSaving,
    fetchStats,
    fetchBusinesses,
    fetchOffers,
    setVerifiedFilter,
    handleRepeatVisitsToggle,
    toggleExpand,
    handleLogoUpload,
    handleDeleteOffer,
    handleDeleteBusiness,
  };
}
