import React, { useState, useEffect } from "react";
import {
  Search,
  Filter,
  ChevronDown,
  Check,
  Users,
  Mail,
  Award,
  Clock,
} from "lucide-react";

const ACTIVITY_OPTIONS = [
  { value: "", label: "All users", sub: "No activity filter", icon: Users },
  { value: "today", label: "Online today", sub: "Active since midnight (Nepal)", icon: Clock },
  { value: "7d", label: "Last 7 days", sub: "Seen within a week", icon: Clock },
  { value: "inactive_7d", label: "Inactive 7+ days", sub: "Quieter than a week", icon: Clock },
  { value: "inactive_30d", label: "Inactive 30+ days", sub: "Long idle", icon: Clock },
];

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

const UserManagement = ({
  users,
  fetchUsers,
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

  useEffect(() => {
    const t = setTimeout(() => {
      fetchUsers(activityFilter, 1, searchTerm);
    }, 300);
    return () => clearTimeout(t);
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
    fetchUsers(activity, 1, searchTerm);
  };

  const goToPage = (page) => {
    handlePageChange(page, activityFilter, searchTerm);
  };

  const selectedLabel =
    ACTIVITY_OPTIONS.find((opt) => opt.value === activityFilter)?.label || "All users";

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="border-b border-gray-200 p-4 sm:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">User Management</h2>
              <p className="text-sm text-gray-500">View and manage all user accounts</p>
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
                  onClick={(e) => { e.stopPropagation(); setFilterDropdownOpen(!filterDropdownOpen); }}
                  className="flex items-center gap-2 pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 font-medium focus:outline-none w-full sm:w-auto hover:bg-gray-100 transition-colors"
                >
                  <Filter className="absolute left-3 h-5 w-5 text-gray-400" />
                  <span className="flex-1 text-left">{selectedLabel}</span>
                  <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${filterDropdownOpen ? "rotate-180" : ""}`} />
                </button>

                {filterDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
                    <div className="p-2">
                      {ACTIVITY_OPTIONS.map((opt) => (
                        <button
                          key={opt.value || "all"}
                          onClick={() => handleActivityFilter(opt.value)}
                          className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors flex items-center gap-3 ${activityFilter === opt.value ? "bg-gray-100 text-gray-900" : "hover:bg-gray-50 text-gray-700"}`}
                        >
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: activityFilter === opt.value ? `${NAVY}20` : "#f3f4f6" }}>
                            <opt.icon className="h-4 w-4" style={{ color: activityFilter === opt.value ? NAVY : "#6b7280" }} />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold">{opt.label}</p>
                            <p className="text-xs text-gray-500">{opt.sub}</p>
                          </div>
                          {activityFilter === opt.value && <Check className="h-4 w-4" style={{ color: NAVY }} />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

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
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-white font-bold text-lg" style={{ backgroundColor: NAVY }}>
                      {user.firstName?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <button
                        type="button"
                        onClick={() => onSelectUser?.(user._id)}
                        className="text-left w-full"
                      >
                        <h3 className="font-semibold text-gray-900 truncate hover:underline">{user.firstName} {user.lastName}</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Mail className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                          <p className="text-sm text-gray-500 truncate">{user.email}</p>
                        </div>
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 sm:gap-4 lg:gap-6 flex-wrap">
                    <div className="flex items-center gap-2 text-sm text-gray-600" title={user.lastActiveAt ? new Date(user.lastActiveAt).toISOString() : undefined}>
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">{formatLastOnline(user)}</span>
                    </div>

                    <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg">
                      <Award className="h-4 w-4 text-amber-500" />
                      <span className="text-sm font-semibold text-gray-900">{user.credits || 0}</span>
                    </div>

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

      {totalPages > 1 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mt-6 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing <span className="font-semibold text-gray-900">{(currentPage - 1) * pageSize + 1}</span> to{" "}
              <span className="font-semibold text-gray-900">{Math.min(currentPage * pageSize, totalUsers)}</span> of{" "}
              <span className="font-semibold text-gray-900">{totalUsers}</span> users
            </p>
            <div className="flex items-center gap-2">
              <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} className="px-4 py-2 rounded-lg font-medium text-white disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed" style={currentPage === 1 ? {} : { backgroundColor: NAVY }}>Previous</button>
              <div className="flex items-center gap-1">
                {[...Array(Math.min(5, totalPages))].map((_, idx) => {
                  let pageNum = totalPages <= 5 ? idx + 1 : currentPage <= 3 ? idx + 1 : currentPage >= totalPages - 2 ? totalPages - 4 + idx : currentPage - 2 + idx;
                  return (
                    <button key={pageNum} onClick={() => goToPage(pageNum)} className="w-10 h-10 rounded-lg font-medium transition-colors" style={currentPage === pageNum ? { backgroundColor: NAVY, color: "white" } : { backgroundColor: "#f3f4f6", color: "#374151" }}>{pageNum}</button>
                  );
                })}
              </div>
              <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages} className="px-4 py-2 rounded-lg font-medium text-white disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed" style={currentPage === totalPages ? {} : { backgroundColor: NAVY }}>Next</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default UserManagement;
