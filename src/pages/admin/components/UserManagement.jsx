import React, { useState, useEffect } from "react";
import {
  Search,
  Filter,
  ChevronDown,
  Check,
  Users,
  Package,
  Mail,
  Award,
  MoreVertical,
  X,
} from "lucide-react";

const UserManagement = ({
  users,
  fetchUsers,
  currentPage,
  totalPages,
  totalUsers,
  pageSize,
  handlePageChange,
  handleUpdateStatus,
  handleBulkUpdateStatus,
  getStatusColor,
  NAVY,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [bulkActionOpen, setBulkActionOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = () => {
      setOpenDropdown(null);
      setFilterDropdownOpen(false);
      setBulkActionOpen(false);
    };
    if (openDropdown || filterDropdownOpen || bulkActionOpen) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [openDropdown, filterDropdownOpen, bulkActionOpen]);

  const handleStatusFilter = (status) => {
    setStatusFilter(status);
    setFilterDropdownOpen(false);
    setSelectedUsers([]);
    fetchUsers(status, 1);
  };

  const filteredUsers = users.filter((user) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      user.firstName?.toLowerCase().includes(searchLower) ||
      user.lastName?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower)
    );
  });

  const handleSelectUser = (userId) => {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    const eligibleUsers = filteredUsers.filter((user) => user.activeCampaign?.status);
    if (selectedUsers.length === eligibleUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(eligibleUsers.map((user) => user._id));
    }
  };

  const triggerBulkAction = async (status) => {
    await handleBulkUpdateStatus(selectedUsers, status);
    setSelectedUsers([]);
    setBulkActionOpen(false);
  };

  return (
    <>
      {selectedUsers.length > 0 && (
        <div className="text-white rounded-2xl p-4 mb-6 shadow-lg animate-in fade-in slide-in-from-top-4 duration-200" style={{ backgroundColor: NAVY }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <Check className="h-5 w-5" />
              </div>
              <span className="font-semibold">{selectedUsers.length} user(s) selected</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <button
                  onClick={(e) => { e.stopPropagation(); setBulkActionOpen(!bulkActionOpen); }}
                  className="flex items-center gap-2 bg-white text-gray-900 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors"
                >
                  Bulk Actions
                  <ChevronDown className={`h-4 w-4 transition-transform ${bulkActionOpen ? "rotate-180" : ""}`} />
                </button>

                {bulkActionOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
                    <div className="p-2">
                      <button
                        onClick={() => triggerBulkAction("dispatched")}
                        className="w-full text-left px-3 py-2.5 hover:bg-orange-50 rounded-lg transition-colors flex items-center gap-3"
                      >
                        <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                          <Package className="h-4 w-4 text-orange-600" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">Mark Dispatched</p>
                          <p className="text-xs text-gray-500">Update selected</p>
                        </div>
                      </button>
                      <button
                        onClick={() => triggerBulkAction("delivered")}
                        className="w-full text-left px-3 py-2.5 hover:bg-emerald-50 rounded-lg transition-colors flex items-center gap-3"
                      >
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                          <Check className="h-4 w-4 text-emerald-600" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">Mark Delivered</p>
                          <p className="text-xs text-gray-500">Update selected</p>
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <button onClick={() => setSelectedUsers([])} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="border-b border-gray-200 p-6">
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
                  placeholder="Search users..."
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
                  <span className="flex-1 text-left">
                    {statusFilter === "" && "All Statuses"}
                    {statusFilter === "joined" && "Joined"}
                    {statusFilter === "dispatched" && "Dispatched"}
                    {statusFilter === "delivered" && "Delivered"}
                  </span>
                  <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${filterDropdownOpen ? "rotate-180" : ""}`} />
                </button>

                {filterDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
                    <div className="p-2">
                      {[
                        { value: "", label: "All Statuses", sub: "Show all users", icon: Users },
                        { value: "joined", label: "Joined", sub: "Campaign started", icon: Package },
                        { value: "dispatched", label: "Dispatched", sub: "Package shipped", icon: Package },
                        { value: "delivered", label: "Delivered", sub: "Completed", icon: Check },
                      ].map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => handleStatusFilter(opt.value)}
                          className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors flex items-center gap-3 ${statusFilter === opt.value ? "bg-gray-100 text-gray-900" : "hover:bg-gray-50 text-gray-700"}`}
                        >
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: statusFilter === opt.value ? `${NAVY}20` : "#f3f4f6" }}>
                            <opt.icon className="h-4 w-4" style={{ color: statusFilter === opt.value ? NAVY : "#6b7280" }} />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold">{opt.label}</p>
                            <p className="text-xs text-gray-500">{opt.sub}</p>
                          </div>
                          {statusFilter === opt.value && <Check className="h-4 w-4" style={{ color: NAVY }} />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {filteredUsers.filter((u) => u.activeCampaign?.status).length > 0 && (
          <div className="bg-gray-50 border-b border-gray-200 px-6 py-3">
            <button onClick={handleSelectAll} className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors">
              <div className="w-5 h-5 rounded border-2 flex items-center justify-center transition-colors" style={selectedUsers.length === filteredUsers.filter((u) => u.activeCampaign?.status).length ? { backgroundColor: NAVY, borderColor: NAVY } : { borderColor: "#d1d5db", backgroundColor: "white" }}>
                {selectedUsers.length === filteredUsers.filter((u) => u.activeCampaign?.status).length && <Check className="h-3 w-3 text-white" />}
              </div>
              Select All ({filteredUsers.filter((u) => u.activeCampaign?.status).length} users)
            </button>
          </div>
        )}

        <div className="divide-y divide-gray-100">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-gray-900 font-semibold mb-1">No users found</p>
              <p className="text-gray-500 text-sm">Try adjusting your search or filters</p>
            </div>
          ) : (
            filteredUsers.map((user) => (
              <div key={user._id} className="p-6 hover:bg-gray-50/70 transition-colors">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    {user.activeCampaign?.status && (
                      <button onClick={() => handleSelectUser(user._id)} className="flex-shrink-0">
                        <div className="w-5 h-5 rounded border-2 flex items-center justify-center transition-colors" style={selectedUsers.includes(user._id) ? { backgroundColor: NAVY, borderColor: NAVY } : { borderColor: "#d1d5db", backgroundColor: "white" }}>
                          {selectedUsers.includes(user._id) && <Check className="h-3 w-3 text-white" />}
                        </div>
                      </button>
                    )}
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-white font-bold text-lg" style={{ backgroundColor: NAVY }}>
                      {user.firstName?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{user.firstName} {user.lastName}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Mail className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                        <p className="text-sm text-gray-500 truncate">{user.email}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 lg:gap-6">
                    <div className="flex items-center gap-3">
                      {user.activeCampaign?.status ? (
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${getStatusColor(user.activeCampaign.status)}`}></div>
                          <span className="text-sm font-medium text-gray-700 capitalize">{user.activeCampaign.status}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                          <span className="text-sm font-medium text-gray-500">No Campaign</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg">
                      <Award className="h-4 w-4 text-amber-500" />
                      <span className="text-sm font-semibold text-gray-900">{user.credits || 0}</span>
                    </div>

                    {user.activeCampaign?.status && (
                      <div className="relative">
                        <button onClick={(e) => { e.stopPropagation(); toggleDropdown(user._id); }} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                          <MoreVertical className="h-5 w-5 text-gray-600" />
                        </button>
                        {openDropdown === user._id && (
                          <div className="absolute right-0 bottom-full mb-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
                            <div className="p-2">
                              {user.activeCampaign.status !== "dispatched" && (
                                <button onClick={() => { handleUpdateStatus(user._id, "dispatched"); setOpenDropdown(null); }} className="w-full text-left px-3 py-2.5 hover:bg-orange-50 rounded-lg transition-colors flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center"><Package className="h-4 w-4 text-orange-600" /></div>
                                  <div>
                                    <p className="text-sm font-semibold text-gray-900">Mark Dispatched</p>
                                    <p className="text-xs text-gray-500">Package shipped</p>
                                  </div>
                                </button>
                              )}
                              {user.activeCampaign.status !== "delivered" && (
                                <button onClick={() => { handleUpdateStatus(user._id, "delivered"); setOpenDropdown(null); }} className="w-full text-left px-3 py-2.5 hover:bg-emerald-50 rounded-lg transition-colors flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center"><Check className="h-4 w-4 text-emerald-600" /></div>
                                  <div>
                                    <p className="text-sm font-semibold text-gray-900">Mark Delivered</p>
                                    <p className="text-xs text-gray-500">Completed</p>
                                  </div>
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
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
              <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="px-4 py-2 rounded-lg font-medium text-white disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed" style={currentPage === 1 ? {} : { backgroundColor: NAVY }}>Previous</button>
              <div className="flex items-center gap-1">
                {[...Array(Math.min(5, totalPages))].map((_, idx) => {
                  let pageNum = totalPages <= 5 ? idx + 1 : currentPage <= 3 ? idx + 1 : currentPage >= totalPages - 2 ? totalPages - 4 + idx : currentPage - 2 + idx;
                  return (
                    <button key={pageNum} onClick={() => handlePageChange(pageNum)} className="w-10 h-10 rounded-lg font-medium transition-colors" style={currentPage === pageNum ? { backgroundColor: NAVY, color: "white" } : { backgroundColor: "#f3f4f6", color: "#374151" }}>{pageNum}</button>
                  );
                })}
              </div>
              <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="px-4 py-2 rounded-lg font-medium text-white disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed" style={currentPage === totalPages ? {} : { backgroundColor: NAVY }}>Next</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default UserManagement;