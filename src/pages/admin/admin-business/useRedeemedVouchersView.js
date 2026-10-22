// URL-driven redeemed-vouchers view: load, filter, and leave handlers.

import { useCallback, useEffect, useState } from 'react';
import { adminAPI } from '../../../services/api';
import toast from 'react-hot-toast';
import { VOUCHER_STATUSES } from './businessShared.js';

export default function useRedeemedVouchersView({
  searchParams,
  setSearchParams,
  fullAdmin,
  navigate,
}) {
  const showingRedeemed = searchParams.get('view') === 'redeemed' && !fullAdmin;
  const voucherStatusParam = VOUCHER_STATUSES.includes(searchParams.get('status'))
    ? searchParams.get('status')
    : 'used';
  const voucherFromParam = searchParams.get('from') || '';
  const voucherToParam = searchParams.get('to') || '';

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

  return {
    showingRedeemed,
    voucherStatusParam,
    voucherFromParam,
    voucherToParam,
    vouchers,
    voucherLoading,
    voucherPage,
    setVoucherPage,
    voucherPagination,
    voucherStatusCounts,
    voucherRedeemedInRange,
    loadRedeemedVouchers,
    handleVoucherStatusFilter,
    handleVoucherDateRangeChange,
    leaveRedeemedView,
  };
}
