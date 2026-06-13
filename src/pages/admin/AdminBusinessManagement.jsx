import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import {
  ArrowLeft, ChevronDown, ChevronUp, Plus, Trash2, Calendar,
  ShieldAlert, Eye, EyeOff, RefreshCw, Building2, KeyRound,
} from 'lucide-react';
import toast from 'react-hot-toast';

const NAVY = "#1B2A4A";

// ─── Constants ───────────────────────────────────────────────────────────────

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const CATEGORIES = [
  'Restaurant', 'Cafe', 'Bakery', 'Bar & Lounge', 'Fast Food',
  'Fine Dining', 'Food Court', 'Ice Cream & Desserts',
  'Retail', 'Fashion', 'Electronics', 'Health & Beauty',
  'Entertainment', 'Fitness', 'Spa & Wellness', 'Hotel', 'Other',
];

const generatePassword = () => {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$';
  return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

// ─── Empty form states ────────────────────────────────────────────────────────

const EMPTY_VOUCHER_FORM = {
  title: '',
  description: '',
  discountType: 'percentage',
  discountValue: '',
  creditsRequired: '',
  expiryDays: '',
  perUserMonthlyLimit: '5',
  totalStock: '',
  validUntil: '',
  imageUrl: '',
};

const EMPTY_BUSINESS_FORM = {
  name: '',
  brandName: '',
  email: '',
  password: '',
  phone: '',
  address: '',
  category: '',
  description: '',
  contactName: '',
  contactDesignation: '',
  contactPhone: '',
  operatingDays: [],
  openingTime: '',
  closingTime: '',
  instagram: '',
  website: '',
  isVerified: false,
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminBusinessManagement() {
  const navigate = useNavigate();

  // Business list
  const [businesses, setBusinesses]               = useState([]);
  const [loading, setLoading]                     = useState(true);
  const [expandedBusinesses, setExpandedBusinesses] = useState({});
  const [businessOffers, setBusinessOffers]       = useState({});
  const [offersLoading, setOffersLoading]         = useState({});

  // Voucher offer modal
  const [selectedBusinessForModal, setSelectedBusinessForModal] = useState(null);
  const [voucherForm, setVoucherForm]             = useState(EMPTY_VOUCHER_FORM);
  const [voucherModalError, setVoucherModalError] = useState('');
  const [voucherSubmitLoading, setVoucherSubmitLoading] = useState(false);

  // Add-business modal
  const [showAddBusinessModal, setShowAddBusinessModal] = useState(false);
  const [businessForm, setBusinessForm]           = useState(EMPTY_BUSINESS_FORM);
  const [businessModalError, setBusinessModalError] = useState('');
  const [businessSubmitLoading, setBusinessSubmitLoading] = useState(false);
  const [showPassword, setShowPassword]           = useState(false);
  const [selectedBusinessForPassword, setSelectedBusinessForPassword] = useState(null);
  const [newPassword, setNewPassword]                                 = useState('');
  const [passwordModalError, setPasswordModalError]                   = useState('');
  const [passwordSubmitLoading, setPasswordSubmitLoading]             = useState(false);
  const [showNewPassword, setShowNewPassword]                         = useState(false);

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  useEffect(() => { fetchBusinesses(); }, []);

  // ── Data fetching ──────────────────────────────────────────────────────────

  const fetchBusinesses = async () => {
    try {
      setLoading(true);
      const res = await adminAPI.getBusinesses();
      setBusinesses(res.data.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load businesses');
    } finally {
      setLoading(false);
    }
  };

  const fetchOffers = async (businessId) => {
    try {
      setOffersLoading(prev => ({ ...prev, [businessId]: true }));
      const res = await adminAPI.getVoucherOffers({ businessId });
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

  // ── Voucher offer actions ──────────────────────────────────────────────────

  const openVoucherModal = (business) => {
    setSelectedBusinessForModal(business);
    setVoucherForm(EMPTY_VOUCHER_FORM);
    setVoucherModalError('');
  };

  const closeVoucherModal = () => setSelectedBusinessForModal(null);

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

  const handleVoucherSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBusinessForModal) return;
    if (!voucherForm.validUntil) {
      setVoucherModalError('A calendar deadline date is mandatory.');
      return;
    }
    if (new Date(voucherForm.validUntil) <= new Date()) {
      setVoucherModalError('The calendar deadline must be set to a future date.');
      return;
    }
    setVoucherSubmitLoading(true);
    setVoucherModalError('');
    try {
      const payload = {
        businessId:          selectedBusinessForModal._id,
        title:               voucherForm.title,
        description:         voucherForm.description,
        discountType:        voucherForm.discountType,
        discountValue:       Number(voucherForm.discountValue),
        creditsRequired:     Number(voucherForm.creditsRequired),
        expiryDays:          Number(voucherForm.expiryDays),
        validUntil:          new Date(voucherForm.validUntil).toISOString(),
        perUserMonthlyLimit: voucherForm.perUserMonthlyLimit !== '' ? Number(voucherForm.perUserMonthlyLimit) : null,
        totalStock:          voucherForm.totalStock !== '' ? Number(voucherForm.totalStock) : null,
        imageUrl:            voucherForm.imageUrl,
      };
      const res = await adminAPI.createVoucherOffer(payload);
      toast.success('Voucher offer created successfully');
      const newOffer = res.data.data;
      if (newOffer) {
        setBusinessOffers(prev => ({
          ...prev,
          [selectedBusinessForModal._id]: [newOffer, ...(prev[selectedBusinessForModal._id] || [])],
        }));
      } else {
        fetchOffers(selectedBusinessForModal._id);
      }
      closeVoucherModal();
    } catch (err) {
      console.error(err);
      setVoucherModalError(err.response?.data?.message || 'Failed to create voucher offer');
    } finally {
      setVoucherSubmitLoading(false);
    }
  };

  // ── Add-business actions ───────────────────────────────────────────────────

  const openAddBusinessModal = () => {
    setBusinessForm(EMPTY_BUSINESS_FORM);
    setBusinessModalError('');
    setShowPassword(false);
    setShowAddBusinessModal(true);
  };

  const handleCreateBusiness = async (e) => {
    e.preventDefault();
    if (businessForm.password.length < 8) {
      setBusinessModalError('Password must be at least 8 characters.');
      return;
    }
    setBusinessSubmitLoading(true);
    setBusinessModalError('');
    try {
      const payload = {
        name:         businessForm.name,
        brandName:    businessForm.brandName,
        email:        businessForm.email,
        password:     businessForm.password,
        phone:        businessForm.phone,
        address:      businessForm.address,
        category:     businessForm.category,
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
        instagram:  businessForm.instagram,
        website:    businessForm.website,
        isVerified: businessForm.isVerified,
      };
      const res = await adminAPI.createBusiness(payload);
      toast.success('Business created successfully!');
      const newBusiness = res.data.data;
      if (newBusiness) {
        setBusinesses(prev => [newBusiness, ...prev]);
      } else {
        fetchBusinesses();
      }
      setShowAddBusinessModal(false);
    } catch (err) {
      console.error(err);
      setBusinessModalError(err.response?.data?.message || 'Failed to create business');
    } finally {
      setBusinessSubmitLoading(false);
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

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="max-w-6xl mx-auto">

        {/* ── Page header ── */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/admin')}
              className="p-2 bg-white border border-gray-200 rounded-xl shadow-sm hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Business Management</h1>
          </div>
          <button
            onClick={openAddBusinessModal}
            className="flex items-center gap-1.5 px-4 py-2 text-white rounded-xl text-sm font-medium shadow-sm transition-all hover:opacity-90"
            style={{ backgroundColor: NAVY }}
          >
            <Building2 className="h-4 w-4" />
            Add Business
          </button>
        </div>

        {/* ── Business list ── */}
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading businesses…</div>
        ) : businesses.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center text-gray-500 shadow-sm">
            No businesses found.
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {businesses.map((business) => {
              const isExpanded      = !!expandedBusinesses[business._id];
              const offers          = businessOffers[business._id] || [];
              const isOffersLoading = !!offersLoading[business._id];

              return (
                <div key={business._id} className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                  {/* Business row */}
                  <div className="p-4 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 flex-1">
                      <div>
                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Name</p>
                        <p className="text-sm font-semibold text-gray-900 mt-0.5">{business.name}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Email</p>
                        <p className="text-sm text-gray-600 mt-0.5 break-all">{business.email}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Category / Phone</p>
                        <p className="text-sm text-gray-600 mt-0.5">
                          {business.category || 'N/A'} · {business.phone || 'N/A'}
                        </p>
                      </div>
                      <div className="flex items-center md:justify-start">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          business.isVerified ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {business.isVerified ? 'Verified' : 'Unverified'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => {
                          setSelectedBusinessForPassword(business);
                          setNewPassword('');
                          setPasswordModalError('');
                          setShowNewPassword(false);
                        }}
                        className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                        title="Change password"
                      >
                        <KeyRound className="h-4 w-4 text-gray-500" />
                      </button>
                      <button
                        onClick={() => handleDeleteBusiness(business)}
                        className="p-2 border border-gray-200 rounded-xl hover:bg-red-50 hover:border-red-200 transition-colors"
                        title="Delete business"
                      >
                        <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-600" />
                      </button>
                      <button
                        onClick={() => toggleExpand(business._id)}
                        className="flex items-center gap-1 px-4 py-2 text-sm font-medium border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                      >
                        {isExpanded ? 'Collapse' : 'Expand'}
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded offers panel */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 bg-gray-50/50 p-4 md:p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                        <h3 className="text-base font-bold text-gray-900">Voucher Offers</h3>
                        <button
                          onClick={() => openVoucherModal(business)}
                          className="flex items-center gap-1.5 px-4 py-2 text-white rounded-xl text-sm font-medium shadow-sm transition-all hover:opacity-90"
                          style={{ backgroundColor: NAVY }}
                        >
                          <Plus className="h-4 w-4" />
                          Add Voucher Offer
                        </button>
                      </div>

                      {isOffersLoading ? (
                        <div className="text-sm text-gray-400 py-2">Loading offers…</div>
                      ) : offers.length === 0 ? (
                        <div className="text-sm text-gray-500 py-2 bg-white rounded-xl border border-gray-100 p-4 text-center">
                          No voucher offers found for this business.
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2">
                          {offers.map((offer) => {
                            const currentLog = offer.monthlyRedemptionLog?.length > 0
                              ? offer.monthlyRedemptionLog[offer.monthlyRedemptionLog.length - 1]
                              : null;
                            const redeemedThisMonth = currentLog ? currentLog.count : 0;

                            return (
                              <div
                                key={offer._id}
                                className="bg-white p-4 rounded-xl border border-gray-100 flex flex-row items-center justify-between gap-3 shadow-sm"
                              >
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-gray-900 text-sm truncate">{offer.title}</p>
                                  <div className="text-xs text-gray-500 mt-1 flex flex-wrap gap-x-2 gap-y-0.5 items-center">
                                    <span className="font-medium text-gray-700">
                                      {offer.discountType === 'percentage'
                                        ? `${offer.discountValue}% off`
                                        : `Rs. ${offer.discountValue} off`}
                                    </span>
                                    <span>•</span>
                                    <span>{offer.creditsRequired} credits</span>
                                    <span>•</span>
                                    <span>{offer.expiryDays}d usage window</span>
                                    <span>•</span>
                                    <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded text-[10px]">
                                      {offer.perUserMonthlyLimit != null
                                        ? `${offer.perUserMonthlyLimit}/user/month`
                                        : 'unlimited/user/month'}
                                    </span>
                                  </div>
                                  <div className="text-xs text-gray-400 mt-1 flex flex-wrap gap-x-2 items-center">
                                    {offer.monthlyStock != null && (
                                      <>
                                        <span>Monthly Volume: {redeemedThisMonth}/{offer.monthlyStock}</span>
                                        <span>•</span>
                                      </>
                                    )}
                                    <span>
                                      Total Stock:{' '}
                                      {offer.totalStock != null
                                        ? `${offer.totalRedeemed ?? 0}/${offer.totalStock}`
                                        : `${offer.totalRedeemed ?? 0} (unlimited)`}
                                    </span>
                                    {offer.validUntil && (
                                      <>
                                        <span>•</span>
                                        <span className="text-amber-600 font-medium flex items-center gap-0.5">
                                          <Calendar size={12} />
                                          Ends: {new Date(offer.validUntil).toLocaleDateString()}
                                        </span>
                                      </>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    offer.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                                  }`}>
                                    {offer.status}
                                  </span>
                                  <button
                                    onClick={() => handleDeleteOffer(offer._id, business._id)}
                                    className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-50 transition-colors"
                                    title="Delete Voucher Offer"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          ADD BUSINESS MODAL
      ════════════════════════════════════════════════════════════════════ */}
      {showAddBusinessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl max-h-[90vh] overflow-y-auto">

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Add New Business</h3>
                <p className="text-xs text-gray-500 mt-0.5">Create a merchant account on eRuchi</p>
              </div>
              <button
                onClick={() => setShowAddBusinessModal(false)}
                className="text-gray-400 hover:text-gray-700 font-medium text-lg leading-none"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateBusiness} className="flex flex-col gap-6">

              {/* ── Section: Business Details ── */}
              <section>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 pb-1 border-b border-gray-100">
                  Business Details
                </p>
                <div className="flex flex-col gap-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Legal Name *</label>
                      <input
                        type="text"
                        placeholder="Registered business name"
                        required
                        {...bField('name')}
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Brand Name</label>
                      <input
                        type="text"
                        placeholder="Public-facing name"
                        {...bField('brandName')}
                        className={inputCls}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Email *</label>
                      <input
                        type="email"
                        placeholder="merchant@email.com"
                        required
                        {...bField('email')}
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Phone *</label>
                      <input
                        type="tel"
                        placeholder="98XXXXXXXX"
                        required
                        {...bField('phone')}
                        className={inputCls}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Category</label>
                      <select {...bField('category')} className={`${inputCls} bg-white`}>
                        <option value="">Select category</option>
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Address *</label>
                      <input
                        type="text"
                        placeholder="Physical address"
                        required
                        {...bField('address')}
                        className={inputCls}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">One-line Description</label>
                    <input
                      type="text"
                      placeholder="What users see on the app (max 120 chars)"
                      maxLength={120}
                      {...bField('description')}
                      className={inputCls}
                    />
                  </div>
                </div>
              </section>

              {/* ── Section: Contact Person ── */}
              <section>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 pb-1 border-b border-gray-100">
                  Contact Person
                </p>
                <div className="flex flex-col gap-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Name *</label>
                      <input
                        type="text"
                        placeholder="Full name"
                        required
                        {...bField('contactName')}
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Designation *</label>
                      <input
                        type="text"
                        placeholder="e.g., Manager, Owner"
                        required
                        {...bField('contactDesignation')}
                        className={inputCls}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">WhatsApp Phone *</label>
                    <input
                      type="tel"
                      placeholder="98XXXXXXXX"
                      required
                      {...bField('contactPhone')}
                      className={inputCls}
                    />
                  </div>
                </div>
              </section>

              {/* ── Section: Operating Hours ── */}
              <section>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 pb-1 border-b border-gray-100">
                  Operating Hours
                </p>
                <div className="flex flex-col gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase mb-2">Operational Days</label>
                    <div className="flex flex-wrap gap-1.5">
                      {DAYS_OF_WEEK.map(day => {
                        const active = businessForm.operatingDays.includes(day);
                        return (
                          <button
                            key={day}
                            type="button"
                            onClick={() => toggleDay(day)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                              active
                                ? 'text-white border-transparent'
                                : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                            }`}
                            style={active ? { backgroundColor: NAVY } : {}}
                          >
                            {day.slice(0, 3)}
                          </button>
                        );
                      })}
                      <button
                        type="button"
                        onClick={() =>
                          setBusinessForm(f => ({
                            ...f,
                            operatingDays: f.operatingDays.length === 7 ? [] : [...DAYS_OF_WEEK],
                          }))
                        }
                        className="px-3 py-1.5 rounded-lg text-xs font-medium border border-dashed border-gray-300 bg-gray-50 text-gray-500 hover:border-gray-400 transition-colors"
                      >
                        {businessForm.operatingDays.length === 7 ? 'Clear all' : 'All days'}
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Opening Time</label>
                      <input type="time" {...bField('openingTime')} className={inputCls} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Closing Time</label>
                      <input type="time" {...bField('closingTime')} className={inputCls} />
                    </div>
                  </div>
                </div>
              </section>

              {/* ── Section: Online Presence ── */}
              <section>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 pb-1 border-b border-gray-100">
                  Online Presence
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Instagram</label>
                    <input
                      type="text"
                      placeholder="@handle"
                      {...bField('instagram')}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Website</label>
                    <input
                      type="text"
                      placeholder="https://eruchi.com"
                      {...bField('website')}
                      className={inputCls}
                    />
                  </div>
                </div>
              </section>

              {/* ── Section: Account Setup ── */}
              <section>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 pb-1 border-b border-gray-100">
                  Account Setup
                </p>
                <div className="flex flex-col gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Password *</label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Min. 8 characters"
                          required
                          minLength={8}
                          {...bField('password')}
                          className={`${inputCls} pr-9 font-mono`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(s => !s)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const p = generatePassword();
                          setBusinessForm(f => ({ ...f, password: p }));
                          setShowPassword(true);
                        }}
                        className="flex items-center gap-1 px-3 py-2 border border-gray-200 rounded-xl text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors whitespace-nowrap"
                        title="Auto-generate a secure password"
                      >
                        <RefreshCw className="h-3 w-3" />
                        Generate
                      </button>
                    </div>
                    {businessForm.password && (
                      <p className="text-[10px] text-gray-400 mt-1">
                        {businessForm.password.length} characters
                        {businessForm.password.length < 8 && (
                          <span className="text-red-500 ml-1">— too short</span>
                        )}
                      </p>
                    )}
                  </div>

                  {/* Verified toggle */}
                  <label
                    htmlFor="biz-verified"
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 cursor-pointer hover:bg-gray-100/60 transition-colors"
                  >
                    <input
                      type="checkbox"
                      id="biz-verified"
                      checked={businessForm.isVerified}
                      onChange={(e) => setBusinessForm(f => ({ ...f, isVerified: e.target.checked }))}
                      className="h-4 w-4 rounded cursor-pointer"
                      style={{ accentColor: NAVY }}
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Mark as verified immediately</p>
                      <p className="text-[10px] text-gray-400">Business can log in right away if checked</p>
                    </div>
                  </label>
                </div>
              </section>

              {/* Error */}
              {businessModalError && (
                <div className="p-2.5 bg-red-50 rounded-xl flex items-start gap-1.5 border border-red-100">
                  <ShieldAlert className="w-3.5 h-3.5 text-red-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-600 font-medium leading-normal">{businessModalError}</p>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={businessSubmitLoading}
                className="w-full py-2.5 rounded-xl text-white text-sm font-medium transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                style={{ backgroundColor: NAVY }}
              >
                {businessSubmitLoading ? 'Creating account…' : 'Create Business Account'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          CHANGE PASSWORD MODAL
      ════════════════════════════════════════════════════════════════════ */}
      {selectedBusinessForPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Change Password</h3>
                <p className="text-xs text-gray-500 mt-0.5">for {selectedBusinessForPassword.name}</p>
              </div>
              <button
                onClick={() => setSelectedBusinessForPassword(null)}
                className="text-gray-400 hover:text-gray-700 font-medium text-lg leading-none"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">New Password *</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      placeholder="Min. 8 characters"
                      required
                      minLength={8}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className={`${inputCls} pr-9 font-mono`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(s => !s)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showNewPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setNewPassword(generatePassword()); setShowNewPassword(true); }}
                    className="flex items-center gap-1 px-3 py-2 border border-gray-200 rounded-xl text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors whitespace-nowrap"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Generate
                  </button>
                </div>
                {newPassword && (
                  <p className="text-[10px] text-gray-400 mt-1">
                    {newPassword.length} characters
                    {newPassword.length < 8 && <span className="text-red-500 ml-1">— too short</span>}
                  </p>
                )}
              </div>
              {passwordModalError && (
                <div className="p-2.5 bg-red-50 rounded-xl flex items-start gap-1.5 border border-red-100">
                  <ShieldAlert className="w-3.5 h-3.5 text-red-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-600 font-medium leading-normal">{passwordModalError}</p>
                </div>
              )}
              <button
                type="submit"
                disabled={passwordSubmitLoading}
                className="w-full py-2.5 rounded-xl text-white text-sm font-medium transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                style={{ backgroundColor: NAVY }}
              >
                {passwordSubmitLoading ? 'Updating…' : 'Update Password'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          CREATE VOUCHER OFFER MODAL  (unchanged logic)
      ════════════════════════════════════════════════════════════════════ */}
      {selectedBusinessForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Add Voucher Offer</h3>
                <p className="text-xs text-gray-500 mt-0.5">for {selectedBusinessForModal.name}</p>
              </div>
              <button onClick={closeVoucherModal} className="text-gray-400 hover:text-gray-700 font-medium text-lg leading-none">✕</button>
            </div>

            <form onSubmit={handleVoucherSubmit} className="flex flex-col gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Title *</label>
                <input
                  type="text"
                  placeholder="e.g., 20% Off Main Course"
                  required
                  {...vField('title')}
                  className={inputCls}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Description</label>
                <input
                  type="text"
                  placeholder="Optional context details"
                  {...vField('description')}
                  className={inputCls}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Discount Type *</label>
                  <select {...vField('discountType')} className={`${inputCls} bg-white`}>
                    <option value="percentage">Percentage (%)</option>
                    <option value="flat">Flat (Rs.)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Discount Value *</label>
                  <input
                    type="number"
                    placeholder="Value"
                    required
                    min="0"
                    {...vField('discountValue')}
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Credits Cost *</label>
                  <input
                    type="number"
                    placeholder="e.g., 100"
                    required
                    min="0"
                    {...vField('creditsRequired')}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Expiry (Days) *</label>
                  <input
                    type="number"
                    placeholder="Days valid once claimed"
                    required
                    min="1"
                    {...vField('expiryDays')}
                    className={inputCls}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-red-600 uppercase mb-1 flex items-center gap-1">
                  Calendar Offer Deadline *{' '}
                  <span className="text-[10px] text-gray-400 lowercase">(Absolute expiration date)</span>
                </label>
                <input
                  type="date"
                  required
                  {...vField('validUntil')}
                  className={`${inputCls} border-red-200 bg-amber-50/20`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-gray-600 uppercase mb-1">Limit / User / Mo</label>
                  <input
                    type="number"
                    placeholder="Unlimited"
                    min="1"
                    {...vField('perUserMonthlyLimit')}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-gray-600 uppercase mb-1">Total Stock</label>
                  <input
                    type="number"
                    placeholder="Unlimited"
                    min="1"
                    {...vField('totalStock')}
                    className={inputCls}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Image URL</label>
                <input
                  type="text"
                  placeholder="Optional asset path"
                  {...vField('imageUrl')}
                  className={inputCls}
                />
              </div>

              {voucherModalError && (
                <div className="p-2.5 bg-red-50 rounded-xl flex items-start gap-1.5 border border-red-100">
                  <ShieldAlert className="w-3.5 h-3.5 text-red-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-600 font-medium leading-normal">{voucherModalError}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={voucherSubmitLoading}
                className="w-full py-2.5 rounded-xl text-white text-sm font-medium transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed mt-2 shadow-sm"
                style={{ backgroundColor: NAVY }}
              >
                {voucherSubmitLoading ? 'Creating…' : 'Create Voucher Offer'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}