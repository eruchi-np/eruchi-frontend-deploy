// Survey title, credits, visibility, clusters, and when it goes live.

import { AlertCircle, Clock, Loader2 } from 'lucide-react';

export default function SurveySettings({
  clusters,
  clustersLoading,
  formData,
  getMinPublishedDate,
  handleInputChange,
  isSprint,
  kindOptions,
  needsPublicWindow,
  statusOptions,
  toggleCluster,
  visibilityOptions,
}) {
  return (
    <>
          {/* Basic Info */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-indigo-50 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">Survey Information</h2>
              <p className="text-sm text-gray-600 mt-0.5">Title, description and visibility</p>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Survey Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={e => handleInputChange('title', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g., Customer Feedback – January 2026"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={e => handleInputChange('description', e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  placeholder="Explain the purpose of this survey..."
                  required
                />
              </div>

              {!isSprint && (
              <>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Survey type
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {kindOptions.map((opt) => {
                    const selected = formData.kind === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => handleInputChange('kind', opt.value)}
                        className={`text-left p-4 rounded-xl border-2 transition-all ${
                          selected
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                        }`}
                      >
                        <p className={`font-semibold text-sm ${selected ? 'text-indigo-900' : 'text-gray-900'}`}>
                          {opt.label}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">{opt.description}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Visibility selector */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Visibility
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {visibilityOptions.map(opt => {
                    const Icon = opt.icon;
                    const isActive = formData.visibility === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => handleInputChange('visibility', opt.value)}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${
                          isActive
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <Icon className={`h-4 w-4 ${isActive ? 'text-indigo-600' : 'text-gray-500'}`} />
                          <span className={`text-sm font-semibold ${isActive ? 'text-indigo-700' : 'text-gray-900'}`}>
                            {opt.label}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 leading-snug">{opt.description}</p>
                      </button>
                    );
                  })}
                </div>
                {formData.visibility === 'targeted' && (
                  <p className="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 flex items-start gap-1.5">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                    Targeted surveys stay hidden from the public list unless you enable &quot;Also publish to other users&quot;.
                    Select clusters below to send now, or send later from Cluster Management / voucher feedback triggers.
                  </p>
                )}
              </div>

              {formData.visibility === 'targeted' && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Validity After Being Sent (days) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.validityDays}
                      onChange={e => handleInputChange('validityDays', Number(e.target.value))}
                      className="w-full max-w-[200px] px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1.5">
                      For cluster / merchant-assigned users, the timer starts when they become eligible.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Send to clusters
                    </label>
                    <p className="text-xs text-gray-500 mb-3">
                      Select one or more clusters. If status is Published, membership is snapshotted and those users become eligible at the send time below.
                    </p>
                    {clustersLoading ? (
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Loader2 className="h-4 w-4 animate-spin" /> Loading clusters…
                      </div>
                    ) : clusters.length === 0 ? (
                      <p className="text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                        No clusters yet. Create one under Clusters, or leave this empty and send later.
                      </p>
                    ) : (
                      <div className="max-h-56 overflow-y-auto border border-gray-200 rounded-xl divide-y divide-gray-100">
                        {clusters.map((c) => {
                          const id = String(c._id);
                          const checked = formData.clusterIds.includes(id);
                          return (
                            <label
                              key={id}
                              className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 ${
                                checked ? 'bg-indigo-50/60' : 'bg-white'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleCluster(id)}
                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                              />
                              <span className="flex-1 min-w-0">
                                <span className="block text-sm font-medium text-gray-900 truncate">{c.name}</span>
                                <span className="block text-xs text-gray-500">
                                  {c.memberCount ?? 0} member{(c.memberCount ?? 0) === 1 ? '' : 's'}
                                </span>
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                    {formData.clusterIds.length > 0 && (
                      <div className="mt-4">
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                          Send to clusters on <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="datetime-local"
                          value={formData.clusterSendAt}
                          onChange={(e) => handleInputChange('clusterSendAt', e.target.value)}
                          min={getMinPublishedDate()}
                          className="w-full max-w-md px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          required
                        />
                        <p className="text-xs text-gray-500 mt-1.5">
                          Membership is snapshotted and users become eligible at this time (same as now if you leave it as the current time).
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="rounded-xl border border-gray-200 p-4">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.alsoPublishToOthers}
                        onChange={(e) => handleInputChange('alsoPublishToOthers', e.target.checked)}
                        className="mt-1 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>
                        <span className="block text-sm font-semibold text-gray-900">
                          Also publish to other users
                        </span>
                        <span className="block text-xs text-gray-500 mt-0.5">
                          Non-cluster users can take this survey after a separate publish date (same survey, different schedule).
                        </span>
                      </span>
                    </label>
                  </div>
                </>
              )}
              </>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={e => handleInputChange('status', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {statusOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Credits to Award <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.credits}
                    onChange={e => handleInputChange('credits', Number(e.target.value))}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              {needsPublicWindow && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      {formData.visibility === 'targeted'
                        ? 'Publish to other users on'
                        : 'Published Date'}{' '}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.publishedAt}
                      onChange={e => handleInputChange('publishedAt', e.target.value)}
                      min={getMinPublishedDate()}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Available for (in days) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.availableDays}
                      onChange={e => handleInputChange('availableDays', Number(e.target.value))}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="e.g., 7, 14, 30"
                      required
                    />
                    {formData.visibility === 'targeted' && (
                      <p className="text-xs text-gray-500 mt-1.5">
                        Only applies to non-targeted users. Cluster members still use validity days from send time.
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2 flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-gray-500" />
                  Estimated Time to Complete (minutes)
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.estimatedMinutes}
                  onChange={e => handleInputChange('estimatedMinutes', e.target.value)}
                  className="w-full max-w-[200px] px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g., 3"
                />
                <p className="text-xs text-gray-500 mt-1.5">
                  Shown to users on the survey card (e.g. "~3 min") so they know what they're signing up for.
                  Leave blank if unsure.
                </p>
              </div>
            </div>
          </div>
    </>
  );
}
