// Add or edit a business. Details, contact, hours, posters, and the merchant login.

import { Eye, EyeOff, RefreshCw, ShieldAlert, Star, Trash2, Upload } from 'lucide-react';
import AddressInfo from '../../../components/demographics/steps/AddressInfo';
import SearchKeywordsField from '../../../components/business/SearchKeywordsField';
import { CATEGORIES, DAYS_OF_WEEK, MAX_POSTERS, NAVY, generatePassword } from './businessShared.js';

export default function BusinessFormModal({
  bField,
  businessForm,
  businessModalError,
  businessSubmitLoading,
  closeBusinessModal,
  editingBusiness,
  handlePosterDelete,
  handlePosterUpload,
  handleRefreshRating,
  handleSaveBusiness,
  inputCls,
  posterUploading,
  ratingRefreshing,
  setBusinessForm,
  setShowPassword,
  showAddBusinessModal,
  showPassword,
  toggleCategory,
  toggleDay,
}) {
  return (
    <>
      {showAddBusinessModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40">
          <div className="flex min-h-full items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl my-8">

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {editingBusiness ? 'Edit Business' : 'Add New Business'}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {editingBusiness ? 'Update merchant details, Maps link, and posters' : 'Create a merchant account on eRuchi'}
                </p>
              </div>
              <button
                onClick={closeBusinessModal}
                className="text-gray-400 hover:text-gray-700 font-medium text-lg leading-none"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveBusiness} className="flex flex-col gap-6">

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
                        readOnly={!!editingBusiness}
                        {...bField('email')}
                        className={`${inputCls} ${editingBusiness ? 'bg-gray-50 text-gray-500' : ''}`}
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
                      <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                        Categories
                        <span className="ml-1 font-normal text-gray-400 normal-case">(up to 3)</span>
                      </label>
                      <div className="relative">
                        <select
                          className={`${inputCls} bg-white`}
                          value=""
                          onChange={(e) => { if (e.target.value) toggleCategory(e.target.value); }}
                        >
                          <option value="">
                            {businessForm.categories.length === 0
                              ? 'Select categories…'
                              : businessForm.categories.length >= 3
                              ? 'Max 3 selected'
                              : `${businessForm.categories.length} selected — add more`}
                          </option>
                          {CATEGORIES.filter(c => !businessForm.categories.includes(c)).map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                        {businessForm.categories.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {businessForm.categories.map(c => (
                              <span
                                key={c}
                                className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-lg"
                              >
                                {c}
                                <button
                                  type="button"
                                  onClick={() => toggleCategory(c)}
                                  className="text-gray-400 hover:text-gray-700 leading-none"
                                  aria-label={`Remove ${c}`}
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Street address *</label>
                      <input
                        type="text"
                        placeholder="Street or landmark"
                        required
                        {...bField('address')}
                        className={inputCls}
                      />
                    </div>
                  </div>

                  <AddressInfo
                    title="Municipality"
                    copy="Same municipality and ward list as a customer address."
                    showProgress={false}
                    formData={{ municipality: businessForm.municipality, wardNumber: businessForm.wardNumber }}
                    updateFormData={(key, value) => setBusinessForm((current) => ({ ...current, [key]: value }))}
                  />

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

                  <SearchKeywordsField
                    keywords={businessForm.searchKeywords}
                    onChange={(searchKeywords) => setBusinessForm((current) => ({ ...current, searchKeywords }))}
                    inputClassName={inputCls}
                  />
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

              {/* ── Section: Google Maps ── */}
              <section>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 pb-1 border-b border-gray-100">
                  Google Maps
                </p>
                <div className="flex flex-col gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Maps link</label>
                    <input
                      type="text"
                      placeholder="https://maps.app.goo.gl/…"
                      {...bField('googleMapsUrl')}
                      className={inputCls}
                    />
                    <p className="text-[10px] text-gray-400 mt-1">
                      Paste the Google Maps share URL (merchants can also add this on their profile). Rating is fetched when the link changes and refreshed weekly. Only admin can refresh on demand.
                    </p>
                  </div>
                  {editingBusiness && (
                    <div className="flex items-center justify-between gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="min-w-0">
                        {editingBusiness.googleRating != null ? (
                          <p className="text-sm font-medium text-gray-800 flex items-center gap-1.5">
                            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                            {Number(editingBusiness.googleRating).toFixed(1)}
                            <span className="text-gray-500 font-normal">
                              ({editingBusiness.googleReviewCount ?? 0} reviews)
                            </span>
                          </p>
                        ) : (
                          <p className="text-sm text-gray-500">No rating cached yet</p>
                        )}
                        {editingBusiness.googleRatingUpdatedAt && (
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            Updated {new Date(editingBusiness.googleRatingUpdatedAt).toLocaleString()}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={handleRefreshRating}
                        disabled={ratingRefreshing || !businessForm.googleMapsUrl}
                        className="flex items-center gap-1 px-3 py-2 border border-gray-200 rounded-xl text-xs font-medium text-gray-600 hover:bg-white transition-colors whitespace-nowrap disabled:opacity-50"
                      >
                        <RefreshCw className={`h-3 w-3 ${ratingRefreshing ? 'animate-spin' : ''}`} />
                        Refresh
                      </button>
                    </div>
                  )}
                </div>
              </section>

              {/* ── Section: Posters (edit only) ── */}
              {editingBusiness && (
                <section>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 pb-1 border-b border-gray-100">
                    Store posters
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {(editingBusiness.posters || []).map((poster, index) => (
                      <div key={index} className="relative w-24 h-24 rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                        <img src={poster} alt={`Poster ${index + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handlePosterDelete(index)}
                          className="absolute top-1 right-1 p-1 bg-white/90 rounded-full shadow-sm hover:bg-red-50"
                          title="Remove poster"
                        >
                          <Trash2 className="h-3 w-3 text-red-600" />
                        </button>
                      </div>
                    ))}
                    {(editingBusiness.posters || []).length < MAX_POSTERS && (
                      <label className="w-24 h-24 rounded-xl border border-dashed border-gray-300 flex flex-col items-center justify-center gap-1 text-gray-400 cursor-pointer hover:border-gray-400 hover:bg-gray-50">
                        <Upload className="h-4 w-4" />
                        <span className="text-[10px] font-medium">{posterUploading ? 'Uploading…' : 'Add'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={posterUploading}
                          onChange={(e) => {
                            handlePosterUpload(e.target.files?.[0]);
                            e.target.value = '';
                          }}
                        />
                      </label>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-400 mt-2">Up to {MAX_POSTERS} images, 2MB each. Videos are not allowed. Shown on the public store page.</p>
                </section>
              )}

              {/* ── Section: Account Setup ── */}
              <section>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 pb-1 border-b border-gray-100">
                  Account Setup
                </p>
                <div className="flex flex-col gap-3">
                  {!editingBusiness && (
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
                  )}

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
                      <p className="text-sm font-medium text-gray-700">
                        {editingBusiness ? 'Verified (can log in)' : 'Mark as verified immediately'}
                      </p>
                      <p className="text-[10px] text-gray-400">
                        {editingBusiness ? 'Uncheck to block merchant login' : 'Business can log in right away if checked'}
                      </p>
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
                {businessSubmitLoading
                  ? (editingBusiness ? 'Saving…' : 'Creating account…')
                  : (editingBusiness ? 'Save Changes' : 'Create Business Account')}
              </button>
            </form>
          </div>
          </div>
        </div>
      )}
    </>
  );
}
