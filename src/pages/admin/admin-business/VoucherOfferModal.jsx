// Create or edit a voucher offer, including feedback and public surveys.

import { MessageSquarePlus, Plus, ShieldAlert, X } from 'lucide-react';
import { NAVY, TRIGGER_OPTIONS } from './businessShared.js';

export default function VoucherOfferModal({
  addFeedbackSurveyRow,
  addPublicSurveyRow,
  availableSurveys,
  closeVoucherModal,
  editingOffer,
  handleVoucherSubmit,
  inputCls,
  removeFeedbackSurveyRow,
  removePublicSurveyRow,
  selectedBusinessForModal,
  surveysLoading,
  updateFeedbackSurveyRow,
  updatePublicSurveyRow,
  vField,
  voucherForm,
  voucherModalError,
  voucherSubmitLoading,
}) {
  return (
    <>
      {selectedBusinessForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{editingOffer ? 'Edit Voucher Offer' : 'Add Voucher Offer'}</h3>
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
                    <option value="free_item">Free Item</option>
                    <option value="value_combo">Value Combo</option>
                  </select>
                </div>
                {voucherForm.discountType !== 'value_combo' && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                      Discount Value {voucherForm.discountType === 'free_item' ? '' : '*'}
                    </label>
                    {voucherForm.discountType === 'free_item' ? (
                      <input
                        type="text"
                        placeholder="Item name (optional)"
                        {...vField('discountValue')}
                        className={inputCls}
                      />
                    ) : (
                      <input
                        type="number"
                        placeholder="Value"
                        required
                        min="0"
                        {...vField('discountValue')}
                        className={inputCls}
                      />
                    )}
                  </div>
                )}
              </div>
              

                            <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Approx. Value (Rs.)</label>
                <input
                  type="number"
                  placeholder="Estimated savings shown to users"
                  min="0"
                  {...vField('approxValue')}
                  className={inputCls}
                />
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

              {/* ── Feedback Surveys section ── */}
              <div className="pt-1">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-gray-600 uppercase flex items-center gap-1.5">
                    <MessageSquarePlus size={13} className="text-amber-600" />
                    Merchant Feedback Surveys
                  </label>
                  <button
                    type="button"
                    onClick={addFeedbackSurveyRow}
                    className="flex items-center gap-1 text-xs font-medium text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add trigger
                  </button>
                </div>

                {voucherForm.feedbackSurveys.length === 0 ? (
                  <p className="text-[11px] text-gray-400 bg-gray-50 border border-gray-100 rounded-lg p-2.5">
                    None configured. Users who redeem this voucher won't be asked for feedback.
                    Click "Add trigger" to send a survey automatically after redemption.
                  </p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {voucherForm.feedbackSurveys.map((row, index) => (
                      <div key={index} className="p-2.5 bg-amber-50/40 border border-amber-100 rounded-lg flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <select
                            value={row.survey}
                            onChange={(e) => updateFeedbackSurveyRow(index, 'survey', e.target.value)}
                            className={`${inputCls} bg-white text-xs flex-1`}
                            disabled={surveysLoading}
                          >
                            <option value="">
                              {surveysLoading ? 'Loading surveys…' : 'Select a survey'}
                            </option>
                            {availableSurveys.map((s) => (
                              <option key={s._id} value={s._id}>
                                {s.title}{s.visibility === 'targeted' ? '' : ' (public)'}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => removeFeedbackSurveyRow(index)}
                            className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-white transition-colors shrink-0"
                            title="Remove trigger"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        <div className="flex items-center gap-2">
                          <select
                            value={row.trigger}
                            onChange={(e) => updateFeedbackSurveyRow(index, 'trigger', e.target.value)}
                            className={`${inputCls} bg-white text-xs flex-1`}
                          >
                            {TRIGGER_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>

                          {(row.trigger === 'nth_redemption' || row.trigger === 'days_after_redemption') && (
                            <input
                              type="number"
                              min="1"
                              placeholder={row.trigger === 'nth_redemption' ? 'e.g. 2' : 'e.g. 7 days'}
                              value={row.triggerValue}
                              onChange={(e) => updateFeedbackSurveyRow(index, 'triggerValue', e.target.value)}
                              className={`${inputCls} text-xs w-24 shrink-0`}
                            />
                          )}
                        </div>

                        {!surveysLoading && availableSurveys.find(s => s._id === row.survey)?.visibility !== 'targeted' && row.survey && (
                          <p className="text-[10px] text-amber-700">
                            Heads up: this survey is <strong>public</strong> — it already shows to everyone.
                            Consider using a "targeted" survey for merchant feedback so it stays private to
                            the person who redeemed it.
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ── Public Surveys section ── */}
               <div className="pt-2">
                 <div className="flex items-center justify-between mb-2">
                   <label className="text-xs font-semibold text-gray-600 uppercase flex items-center gap-1.5">
                     <MessageSquarePlus size={13} className="text-blue-600" />
                     Public Surveys
                   </label>
                   <button
                     type="button"
                     onClick={addPublicSurveyRow}
                     className="flex items-center gap-1 text-xs font-medium text-gray-600 hover:text-gray-900 transition-colors"
                   >
                     <Plus className="h-3.5 w-3.5" />
                     Add public survey
                   </button>
                 </div>

                 {(!voucherForm.publicSurveys || voucherForm.publicSurveys.length === 0) ? (
                   <p className="text-[11px] text-gray-400 bg-gray-50 border border-gray-100 rounded-lg p-2.5">
                     No public surveys attached. Click "Add public survey" to link feedback forms to this voucher.
                   </p>
                 ) : (
                   <div className="flex flex-col gap-2">
                     {voucherForm.publicSurveys.map((surveyId, index) => (
                       <div key={index} className="p-2.5 bg-blue-50/30 border border-blue-100 rounded-lg flex items-center gap-2">
                         <select
                           value={surveyId}
                           onChange={(e) => updatePublicSurveyRow(index, e.target.value)}
                           className={`${inputCls} bg-white text-xs flex-1`}
                           disabled={surveysLoading}
                         >
                           <option value="">
                             {surveysLoading ? 'Loading surveys…' : 'Select a public survey'}
                           </option>
                           {availableSurveys
                             .filter((s) => s.visibility !== 'targeted')
                             .map((s) => (
                               <option key={s._id} value={s._id}>
                                 {s.title}
                               </option>
                             ))}
                         </select>
                         <button
                           type="button"
                           onClick={() => removePublicSurveyRow(index)}
                           className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-white transition-colors shrink-0"
                           title="Remove survey"
                         >
                           <X className="h-3.5 w-3.5" />
                         </button>
                       </div>
                     ))}
                   </div>
                 )}
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
                {voucherSubmitLoading
                  ? (editingOffer ? 'Saving…' : 'Creating…')
                  : (editingOffer ? 'Save changes' : 'Create Voucher Offer')}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
