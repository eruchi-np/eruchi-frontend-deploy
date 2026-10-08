// Redeemed-voucher view, or the business list with offers under each row.

import {
  Building2, Calendar, ChevronDown, ChevronUp, KeyRound, MessageSquarePlus,
  Pencil, Plus, Trash2, Upload,
} from 'lucide-react';
import Pagination from '../../../components/ui/Pagination';
import VoucherManagement from '../components/VoucherManagement.jsx';
import { BUSINESS_PAGE_SIZE, NAVY } from './businessShared.js';

export default function BusinessList({
  businessOffers,
  businesses,
  currentPage,
  dashboardStats,
  expandedBusinesses,
  handleDeleteBusiness,
  handleDeleteOffer,
  handleLogoUpload,
  handleRepeatVisitsToggle,
  handleVoucherDateRangeChange,
  handleVoucherStatusFilter,
  listTotal,
  loadRedeemedVouchers,
  loading,
  logoUploading,
  offersLoading,
  openEditBusinessModal,
  openEditVoucherModal,
  openVoucherModal,
  repeatVisitSaving,
  setCurrentPage,
  setDashboardBusiness,
  setNewPassword,
  setPasswordModalError,
  setSelectedBusinessForPassword,
  setShowNewPassword,
  setVerifiedFilter,
  setVoucherPage,
  showingRedeemed,
  toggleExpand,
  totalPages,
  verifiedFilter,
  voucherFromParam,
  voucherLoading,
  voucherPage,
  voucherPagination,
  voucherRedeemedInRange,
  voucherStatusCounts,
  voucherStatusParam,
  voucherToParam,
  vouchers,
}) {
  return (
    <>
        {showingRedeemed ? (
          <VoucherManagement
            vouchers={vouchers}
            voucherLoading={voucherLoading}
            voucherStatusFilter={voucherStatusParam}
            handleVoucherStatusFilter={handleVoucherStatusFilter}
            pagination={voucherPagination}
            onPageChange={(page) => {
              if (page === voucherPage) {
                loadRedeemedVouchers(voucherStatusParam, page, voucherFromParam, voucherToParam);
                return;
              }
              setVoucherPage(page);
            }}
            dateFrom={voucherFromParam}
            dateTo={voucherToParam}
            onDateRangeChange={handleVoucherDateRangeChange}
            statusCounts={voucherStatusCounts}
            redeemedInRange={voucherRedeemedInRange}
            NAVY={NAVY}
          />
        ) : (
        <>
        <div className="flex flex-wrap gap-2 mb-4" id="business-list">
          {[
            { id: 'all', label: 'All businesses' },
            { id: 'pending', label: 'Pending' },
          ].map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setVerifiedFilter(opt.id)}
              className="px-4 py-2 rounded-xl text-sm font-medium transition-colors"
              style={
                verifiedFilter === opt.id
                  ? { backgroundColor: NAVY, color: 'white' }
                  : { backgroundColor: '#fff', color: '#374151', border: '1px solid #e5e7eb' }
              }
            >
              {opt.label}
              {opt.id === 'pending' && dashboardStats?.pendingBusinesses != null && (
                <span className="ml-2 opacity-80">{dashboardStats.pendingBusinesses}</span>
              )}
            </button>
          ))}
          {verifiedFilter === 'pending' && (
            <p className="w-full text-sm text-gray-500 mt-1">
              Showing {listTotal} unverified {listTotal === 1 ? 'business' : 'businesses'}
            </p>
          )}
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
                    <div className="flex items-center gap-4 flex-1">
                      <div className="relative shrink-0">
                        <div className="w-14 h-14 rounded-xl bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center">
                          {business.logo ? (
                            <img src={business.logo} alt={`${business.name} logo`} loading="lazy" decoding="async" className="w-full h-full object-contain" />
                          ) : (
                            <Building2 className="h-5 w-5 text-gray-300" />
                          )}
                        </div>
                        <label
                          htmlFor={`logo-upload-${business._id}`}
                          className="absolute -bottom-1 -right-1 p-1 bg-white border border-gray-200 rounded-full shadow-sm cursor-pointer hover:bg-gray-50 transition-colors"
                          title="Upload logo"
                        >
                          <Upload className="h-3 w-3 text-gray-600" />
                        </label>
                        <input
                          id={`logo-upload-${business._id}`}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={!!logoUploading[business._id]}
                          onChange={(e) => handleLogoUpload(business, e.target.files?.[0])}
                        />
                      </div>

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
                            {(business.categories?.length
                              ? business.categories.join(', ')
                              : business.category) || 'N/A'} · {business.phone || 'N/A'}
                          </p>
                        </div>
                        <div className="flex flex-col items-start gap-2 md:justify-start">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            business.isVerified ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                          }`}>
                            {business.isVerified ? 'Verified' : 'Unverified'}
                          </span>
                          <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              className="rounded border-gray-300"
                              checked={business.showRepeatVisits !== false}
                              disabled={!!repeatVisitSaving[business._id]}
                              onChange={(e) => handleRepeatVisitsToggle(business, e.target.checked)}
                            />
                            Show 1st and 2nd visits
                          </label>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        onClick={() => openEditBusinessModal(business)}
                        className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                        title="Edit details"
                      >
                        <Pencil className="h-4 w-4 text-gray-500" />
                      </button>
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
                        onClick={() => setDashboardBusiness(business)}
                        className="px-3 py-2 text-sm font-medium border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                      >
                        Dashboard
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
                                    {offer.feedbackSurveys?.length > 0 && (
                                      <>
                                        <span>•</span>
                                        <span className="bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded text-[10px] flex items-center gap-0.5">
                                          <MessageSquarePlus size={10} />
                                          {offer.feedbackSurveys.length} feedback trigger{offer.feedbackSurveys.length !== 1 ? 's' : ''}
                                        </span>
                                      </>
                                    )}
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
                                    onClick={() => openEditVoucherModal(business, offer)}
                                    className="p-1.5 text-gray-400 hover:text-gray-900 rounded-lg hover:bg-gray-50 transition-colors"
                                    title="Edit voucher offer"
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </button>
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
        <Pagination
          page={currentPage}
          totalPages={totalPages}
          total={listTotal}
          pageSize={BUSINESS_PAGE_SIZE}
          onChange={setCurrentPage}
          label="businesses"
        />
        </>
        )}
    </>
  );
}
