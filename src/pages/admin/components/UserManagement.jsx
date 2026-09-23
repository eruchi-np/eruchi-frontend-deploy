import React, { useState, useEffect, useMemo } from "react";
import {
  Search,
  Filter,
  ChevronDown,
  Check,
  Users,
  Mail,
  Award,
  Clock,
  Download,
  X,
} from "lucide-react";

const ACTIVITY_OPTIONS = [
  { value: "", label: "All users", sub: "No activity filter", icon: Users },
  { value: "today", label: "Online today", sub: "Active since midnight (Nepal)", icon: Clock },
  { value: "7d", label: "Last 7 days", sub: "Seen within a week", icon: Clock },
  { value: "inactive_7d", label: "Inactive 7+ days", sub: "Quieter than a week", icon: Clock },
  { value: "inactive_30d", label: "Inactive 30+ days", sub: "Long idle", icon: Clock },
];

const BOOL_OPTIONS = [
  { value: "", label: "Any" },
  { value: "true", label: "Yes" },
  { value: "false", label: "No" },
];

const EMAIL_EXPORT_TYPES = [
  {
    value: "notifications",
    label: "In-app notification emails",
    sub: "Delivery updates, survey invites",
  },
  {
    value: "reminders",
    label: "Reminder emails",
    sub: "Survey nudges, expiry, win-back",
  },
  {
    value: "promotional",
    label: "Promotional emails",
    sub: "Marketing and announcements",
  },
];

const EMPTY_ADVANCED = {
  isVerified: "",
  isProfileComplete: "",
  isAdditionalProfileComplete: "",
  unsubscribedFromEmails: "",
  creditsMin: "",
  creditsMax: "",
  createdAtFrom: "",
  createdAtTo: "",
  dateOfBirthFrom: "",
  dateOfBirthTo: "",
  lastSurveyCompletedAtFrom: "",
  lastSurveyCompletedAtTo: "",
};

const NEPAL_TZ = "Asia/Kathmandu";

/** Format lastActiveAt in Nepal time; never invent activity from createdAt. */
const formatLastOnline = (user) => {
  if (!user.lastActiveAt) return "Never";
  const date = new Date(user.lastActiveAt);
  if (Number.isNaN(date.getTime())) return "Never";

  return date.toLocaleString("en-GB", {
    timeZone: NEPAL_TZ,
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

const countActiveAdvanced = (filters) =>
  Object.values(filters).filter((v) => v !== "" && v != null).length;

const UserManagement = ({
  users,
  fetchUsers,
  exportUserEmails,
  currentPage,
  totalPages,
  totalUsers,
  pageSize,
  handlePageChange,
  NAVY,
  onSelectUser,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activityFilter, setActivityFilter] = useState("");
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [advancedDraft, setAdvancedDraft] = useState(EMPTY_ADVANCED);
  const [advancedApplied, setAdvancedApplied] = useState(EMPTY_ADVANCED);
  const [exporting, setExporting] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportType, setExportType] = useState("promotional");

  const buildFilters = (overrides = {}) => ({
    activity: activityFilter,
    q: searchTerm,
    ...advancedApplied,
    ...overrides,
  });

  useEffect(() => {
    const t = setTimeout(() => {
      fetchUsers(buildFilters({ q: searchTerm }), 1);
    }, 300);
    return () => clearTimeout(t);
    // Intentionally only react to search; other filters call fetchUsers directly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  useEffect(() => {
    const handleClickOutside = () => setFilterDropdownOpen(false);
    if (filterDropdownOpen) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [filterDropdownOpen]);

  const handleActivityFilter = (activity) => {
    setActivityFilter(activity);
    setFilterDropdownOpen(false);
    fetchUsers(buildFilters({ activity }), 1);
  };

  const applyAdvanced = () => {
    setAdvancedApplied(advancedDraft);
    fetchUsers(
      {
        activity: activityFilter,
        q: searchTerm,
        ...advancedDraft,
      },
      1
    );
  };

  const clearAdvanced = () => {
    setAdvancedDraft(EMPTY_ADVANCED);
    setAdvancedApplied(EMPTY_ADVANCED);
    fetchUsers({ activity: activityFilter, q: searchTerm, ...EMPTY_ADVANCED }, 1);
  };

  const goToPage = (page) => {
    handlePageChange(page, buildFilters());
  };

  const handleExport = async () => {
    if (!exportType) return;
    setExporting(true);
    try {
      await exportUserEmails?.(buildFilters(), exportType);
      setExportModalOpen(false);
    } finally {
      setExporting(false);
    }
  };

  const selectedLabel =
    ACTIVITY_OPTIONS.find((opt) => opt.value === activityFilter)?.label || "All users";

  const advancedCount = useMemo(() => countActiveAdvanced(advancedApplied), [advancedApplied]);
  const hasAnyFilter = Boolean(searchTerm.trim() || activityFilter || advancedCount > 0);

  const setDraft = (key, value) => {
    setAdvancedDraft((prev) => ({ ...prev, [key]: value }));
  };

  const BoolSelect = ({ label, field }) => (
    <label className="block">
      <span className="text-xs font-medium text-gray-600">{label}</span>
      <select
        value={advancedDraft[field]}
        onChange={(e) => setDraft(field, e.target.value)}
        className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-200"
      >
        {BOOL_OPTIONS.map((opt) => (
          <option key={opt.value || "any"} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );

  const DateRange = ({ label, fromKey, toKey }) => (
    <div>
      <p className="text-xs font-medium text-gray-600 mb-1">{label}</p>
      <div className="grid grid-cols-2 gap-2">
        <input
          type="date"
          value={advancedDraft[fromKey]}
          onChange={(e) => setDraft(fromKey, e.target.value)}
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
          aria-label={`${label} from`}
        />
        <input
          type="date"
          value={advancedDraft[toKey]}
          onChange={(e) => setDraft(toKey, e.target.value)}
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
          aria-label={`${label} to`}
        />
      </div>
    </div>
  );

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="border-b border-gray-200 p-4 sm:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">User Management</h2>
              <p className="text-sm text-gray-500">
                {hasAnyFilter
                  ? `${totalUsers.toLocaleString()} user${totalUsers === 1 ? "" : "s"} match filters`
                  : "View and manage all user accounts"}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search name, email, username..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:border-transparent w-full sm:w-64"
                />
              </div>

              <div className="relative">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFilterDropdownOpen(!filterDropdownOpen);
                  }}
                  className="flex items-center gap-2 pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 font-medium focus:outline-none w-full sm:w-auto hover:bg-gray-100 transition-colors"
                >
                  <Filter className="absolute left-3 h-5 w-5 text-gray-400" />
                  <span className="flex-1 text-left">{selectedLabel}</span>
                  <ChevronDown
                    className={`h-4 w-4 text-gray-400 transition-transform ${filterDropdownOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {filterDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
                    <div className="p-2">
                      {ACTIVITY_OPTIONS.map((opt) => (
                        <button
                          key={opt.value || "all"}
                          type="button"
                          onClick={() => handleActivityFilter(opt.value)}
                          className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors flex items-center gap-3 ${activityFilter === opt.value ? "bg-gray-100 text-gray-900" : "hover:bg-gray-50 text-gray-700"}`}
                        >
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{
                              backgroundColor: activityFilter === opt.value ? `${NAVY}20` : "#f3f4f6",
                            }}
                          >
                            <opt.icon
                              className="h-4 w-4"
                              style={{ color: activityFilter === opt.value ? NAVY : "#6b7280" }}
                            />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold">{opt.label}</p>
                            <p className="text-xs text-gray-500">{opt.sub}</p>
                          </div>
                          {activityFilter === opt.value && (
                            <Check className="h-4 w-4" style={{ color: NAVY }} />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setAdvancedOpen((o) => !o)}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 hover:bg-gray-100 transition-colors"
              >
                <Filter className="h-4 w-4 text-gray-500" />
                More filters
                {advancedCount > 0 && (
                  <span
                    className="ml-1 inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full text-xs text-white"
                    style={{ backgroundColor: NAVY }}
                  >
                    {advancedCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setExportModalOpen(true)}
                disabled={exporting || totalUsers === 0}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
                style={{ backgroundColor: NAVY }}
                title="Export emails for a chosen email category"
              >
                <Download className="h-4 w-4" />
                Export emails
              </button>
            </div>
          </div>

          {advancedOpen && (
            <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <BoolSelect label="Verified" field="isVerified" />
                <BoolSelect label="Profile complete" field="isProfileComplete" />
                <BoolSelect label="Additional profile complete" field="isAdditionalProfileComplete" />
                <BoolSelect label="Unsubscribed from emails" field="unsubscribedFromEmails" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <label className="block">
                  <span className="text-xs font-medium text-gray-600">Credits min</span>
                  <input
                    type="number"
                    value={advancedDraft.creditsMin}
                    onChange={(e) => setDraft("creditsMin", e.target.value)}
                    placeholder="0"
                    className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-gray-600">Credits max</span>
                  <input
                    type="number"
                    value={advancedDraft.creditsMax}
                    onChange={(e) => setDraft("creditsMax", e.target.value)}
                    placeholder="Any"
                    className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <DateRange label="Created at (Nepal)" fromKey="createdAtFrom" toKey="createdAtTo" />
                <DateRange
                  label="Date of birth (Nepal)"
                  fromKey="dateOfBirthFrom"
                  toKey="dateOfBirthTo"
                />
                <DateRange
                  label="Last survey completed (Nepal)"
                  fromKey="lastSurveyCompletedAtFrom"
                  toKey="lastSurveyCompletedAtTo"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={applyAdvanced}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-white hover:opacity-90"
                  style={{ backgroundColor: NAVY }}
                >
                  Apply filters
                </button>
                <button
                  type="button"
                  onClick={clearAdvanced}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-gray-700 border border-gray-200 hover:bg-gray-50"
                >
                  <X className="h-4 w-4" />
                  Clear
                </button>
                <p className="text-xs text-gray-500 sm:ml-2">
                  Export asks which email type you are sending, then includes only opted-in users.
                </p>
              </div>
            </div>
          )}
        </div>

        {exportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
            <div className="w-full max-w-md rounded-2xl bg-white shadow-xl border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-1">Export emails for</h3>
              <p className="text-sm text-gray-500 mb-4">
                Choose the type of email you will send. Only users opted into that category are included.
                CSV includes an unsubscribe URL per row for mail merge.
              </p>
              <div className="space-y-2 mb-6">
                {EMAIL_EXPORT_TYPES.map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex gap-3 items-start p-3 rounded-xl border cursor-pointer ${
                      exportType === opt.value ? "border-gray-900 bg-gray-50" : "border-gray-200"
                    }`}
                  >
                    <input
                      type="radio"
                      name="exportType"
                      className="mt-1"
                      checked={exportType === opt.value}
                      onChange={() => setExportType(opt.value)}
                    />
                    <span>
                      <span className="block text-sm font-semibold text-gray-900">{opt.label}</span>
                      <span className="block text-xs text-gray-500">{opt.sub}</span>
                    </span>
                  </label>
                ))}
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setExportModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 border border-gray-200 hover:bg-gray-50"
                  disabled={exporting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExport}
                  disabled={exporting}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50"
                  style={{ backgroundColor: NAVY }}
                >
                  {exporting ? "Exporting…" : "Download CSV"}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="divide-y divide-gray-100">
          {users.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-gray-900 font-semibold mb-1">No users found</p>
              <p className="text-gray-500 text-sm">Try adjusting your search or filters</p>
            </div>
          ) : (
            users.map((user) => (
              <div key={user._id} className="p-4 sm:p-6 hover:bg-gray-50/70 transition-colors">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-white font-bold text-lg"
                      style={{ backgroundColor: NAVY }}
                    >
                      {user.firstName?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <button
                        type="button"
                        onClick={() => onSelectUser?.(user._id)}
                        className="text-left w-full"
                      >
                        <h3 className="font-semibold text-gray-900 truncate hover:underline">
                          {user.firstName} {user.lastName}
                        </h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Mail className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                          <p className="text-sm text-gray-500 truncate">{user.email}</p>
                        </div>
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 sm:gap-4 lg:gap-6 flex-wrap">
                    <div
                      className="flex items-center gap-2 text-sm text-gray-600"
                      title={user.lastActiveAt ? new Date(user.lastActiveAt).toISOString() : undefined}
                    >
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">{formatLastOnline(user)}</span>
                    </div>

                    <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg">
                      <Award className="h-4 w-4 text-amber-500" />
                      <span className="text-sm font-semibold text-gray-900">
                        {user.credits || 0}
                      </span>
                    </div>

                    {user.unsubscribedFromEmails && (
                      <span className="text-xs font-medium text-amber-800 bg-amber-50 px-2 py-1 rounded-lg">
                        Unsubscribed
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => onSelectUser?.(user._id)}
                      className="text-sm font-medium px-3 py-1.5 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
                    >
                      Details
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {(totalPages > 1 || totalUsers > 0) && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mt-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <p className="text-sm text-gray-600">
              {totalUsers === 0 ? (
                <>0 users</>
              ) : (
                <>
                  Showing{" "}
                  <span className="font-semibold text-gray-900">
                    {(currentPage - 1) * pageSize + 1}
                  </span>{" "}
                  to{" "}
                  <span className="font-semibold text-gray-900">
                    {Math.min(currentPage * pageSize, totalUsers)}
                  </span>{" "}
                  of <span className="font-semibold text-gray-900">{totalUsers}</span> users
                </>
              )}
            </p>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded-lg font-medium text-white disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
                  style={currentPage === 1 ? {} : { backgroundColor: NAVY }}
                >
                  Previous
                </button>
                <div className="flex items-center gap-1">
                  {[...Array(Math.min(5, totalPages))].map((_, idx) => {
                    let pageNum =
                      totalPages <= 5
                        ? idx + 1
                        : currentPage <= 3
                          ? idx + 1
                          : currentPage >= totalPages - 2
                            ? totalPages - 4 + idx
                            : currentPage - 2 + idx;
                    return (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => goToPage(pageNum)}
                        className="w-10 h-10 rounded-lg font-medium transition-colors"
                        style={
                          currentPage === pageNum
                            ? { backgroundColor: NAVY, color: "white" }
                            : { backgroundColor: "#f3f4f6", color: "#374151" }
                        }
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button
                  type="button"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 rounded-lg font-medium text-white disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
                  style={currentPage === totalPages ? {} : { backgroundColor: NAVY }}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default UserManagement;
