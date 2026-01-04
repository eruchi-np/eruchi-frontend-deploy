import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userAPI, adminAPI } from '../../services/api';
import { Users, Package, Plus, ArrowLeft, Settings, ChevronDown, Check, Mail, Award, Search, Filter, MoreVertical, X } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [openDropdown, setOpenDropdown] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [bulkActionOpen, setBulkActionOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [pageSize] = useState(50);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        const userResponse = await userAPI.getProfile();
        const userData = userResponse.data.data.user;
        
        if (userData.role !== 'admin') {
          navigate('/profile');
          return;
        }
        
        await fetchUsers();
      } catch (error) {
        console.error('Error checking admin access:', error);
        if (error.response?.status === 401 || error.response?.status === 403) {
          navigate('/profile');
        } else {
          setError('Failed to load admin dashboard');
        }
      } finally {
        setLoading(false);
      }
    };

    checkAdminAccess();
  }, [navigate]);

  const fetchUsers = async (status = '', page = 1) => {
    try {
      const params = { 
        ...(status && { status }),
        page,
        limit: pageSize
      };
      const response = await adminAPI.getUsers(params);
      setUsers(response.data.data);
      
      // Handle pagination data if available
      if (response.data.pagination) {
        setTotalPages(response.data.pagination.totalPages);
        setTotalUsers(response.data.pagination.totalUsers);
      } else {
        // Fallback if no pagination
        setTotalUsers(response.data.data.length);
        setTotalPages(1);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to load users data');
    }
  };

  const handleStatusFilter = (status) => {
    setStatusFilter(status);
    setFilterDropdownOpen(false);
    setSelectedUsers([]);
    setCurrentPage(1);
    fetchUsers(status, 1);
  };

  const handleUpdateStatus = async (userId, newStatus) => {
    try {
      await adminAPI.updateUserStatus(userId, { status: newStatus });
      toast.success(`User status updated to ${newStatus}`);
      fetchUsers(statusFilter, currentPage);
      setOpenDropdown(null);
    } catch (error) {
      console.error('Error updating user status:', error);
      toast.error(error.response?.data?.message || 'Failed to update user status');
    }
  };

  const handleBulkUpdateStatus = async (newStatus) => {
    if (selectedUsers.length === 0) {
      toast.error('No users selected');
      return;
    }

    const loadingToast = toast.loading(`Updating ${selectedUsers.length} user(s)...`);
    
    try {
      const updatePromises = selectedUsers.map(userId => 
        adminAPI.updateUserStatus(userId, { status: newStatus })
      );
      
      await Promise.all(updatePromises);
      
      toast.success(`Successfully updated ${selectedUsers.length} user(s) to ${newStatus}`, {
        id: loadingToast
      });
      
      setSelectedUsers([]);
      setBulkActionOpen(false);
      fetchUsers(statusFilter, currentPage);
    } catch (error) {
      console.error('Error in bulk update:', error);
      toast.error('Some updates failed. Please try again.', {
        id: loadingToast
      });
    }
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    setSelectedUsers([]);
    fetchUsers(statusFilter, newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectUser = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    const eligibleUsers = filteredUsers.filter(user => user.activeCampaign?.status);
    if (selectedUsers.length === eligibleUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(eligibleUsers.map(user => user._id));
    }
  };

  const handleCreateCampaign = () => {
    navigate('/admin/create-campaign');
  };

  const toggleDropdown = (userId) => {
    setOpenDropdown(openDropdown === userId ? null : userId);
  };

  useEffect(() => {
    const handleClickOutside = () => {
      setOpenDropdown(null);
      setFilterDropdownOpen(false);
      setBulkActionOpen(false);
    };
    if (openDropdown || filterDropdownOpen || bulkActionOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [openDropdown, filterDropdownOpen, bulkActionOpen]);

  const filteredUsers = users.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    return (
      user.firstName?.toLowerCase().includes(searchLower) ||
      user.lastName?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower)
    );
  });

  const getStatusColor = (status) => {
    switch(status) {
      case 'joined': return 'from-blue-500 to-indigo-500';
      case 'dispatched': return 'from-amber-500 to-orange-500';
      case 'delivered': return 'from-emerald-500 to-teal-500';
      default: return 'from-gray-400 to-gray-500';
    }
  };

  const stats = [
    {
      label: 'Total Users',
      value: totalUsers,
      icon: Users,
      gradient: 'from-violet-500 to-purple-600',
      bgGradient: 'from-violet-50 to-purple-50'
    },
    {
      label: 'Active Campaigns',
      value: users.filter(user => user.activeCampaign?.status).length,
      icon: Package,
      gradient: 'from-[#3399ff] to-[#2ed6fd]',
      bgGradient: 'from-blue-50 to-cyan-50'
    },
    {
      label: 'Avg. Credits',
      value: users.length > 0 ? Math.round(users.reduce((acc, u) => acc + (u.credits || 0), 0) / users.length) : 0,
      icon: Award,
      gradient: 'from-amber-500 to-orange-500',
      bgGradient: 'from-amber-50 to-orange-50'
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block relative">
            <div className="w-16 h-16 border-4 border-gray-200 border-t-[#3399ff] rounded-full animate-spin"></div>
          </div>
          <p className="mt-4 text-gray-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center bg-white rounded-3xl shadow-sm border border-gray-200 p-12 max-w-md">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h3>
          <p className="text-gray-600 mb-8">{error}</p>
          <button 
            onClick={() => navigate('/profile')}
            className="bg-gray-900 text-white px-8 py-3 rounded-xl font-medium hover:bg-gray-800 transition-colors"
          >
            Back to Profile
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40 backdrop-blur-sm bg-white/90">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/profile')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-sm text-gray-500">Admin Control Panel</p>
              </div>
            </div>
            <button
              onClick={handleCreateCampaign}
              className="flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-gray-800 transition-all"
            >
              <Plus className="h-4 w-4" />
              New Campaign
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className={`bg-gradient-to-br ${stat.bgGradient} rounded-2xl p-6 border border-gray-200`}>
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 bg-gradient-to-br ${stat.gradient} rounded-xl`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</p>
                <p className="text-sm font-medium text-gray-600">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Bulk Actions Bar */}
        {selectedUsers.length > 0 && (
          <div className="bg-[#3399ff] text-white rounded-2xl p-4 mb-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                    <Check className="h-5 w-5" />
                  </div>
                  <span className="font-semibold">{selectedUsers.length} user(s) selected</span>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setBulkActionOpen(!bulkActionOpen);
                    }}
                    className="flex items-center gap-2 bg-white text-gray-900 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors"
                  >
                    Bulk Actions
                    <ChevronDown className={`h-4 w-4 transition-transform ${bulkActionOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {bulkActionOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
                      <div className="p-2">
                        <button
                          onClick={() => handleBulkUpdateStatus('dispatched')}
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
                          onClick={() => handleBulkUpdateStatus('delivered')}
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
                
                <button
                  onClick={() => setSelectedUsers([])}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Card */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          {/* Toolbar */}
          <div className="border-b border-gray-200 p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">User Management</h2>
                <p className="text-sm text-gray-500">View and manage all user accounts</p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3399ff] focus:border-transparent w-full sm:w-64"
                  />
                </div>

                {/* Filter Dropdown */}
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setFilterDropdownOpen(!filterDropdownOpen);
                    }}
                    className="flex items-center gap-2 pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#3399ff] focus:border-transparent w-full sm:w-auto hover:bg-gray-100 transition-colors"
                  >
                    <Filter className="absolute left-3 h-5 w-5 text-gray-400" />
                    <span className="flex-1 text-left">
                      {statusFilter === '' && 'All Statuses'}
                      {statusFilter === 'joined' && 'Joined'}
                      {statusFilter === 'dispatched' && 'Dispatched'}
                      {statusFilter === 'delivered' && 'Delivered'}
                    </span>
                    <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${filterDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {filterDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
                      <div className="p-2">
                        <button
                          onClick={() => handleStatusFilter('')}
                          className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors flex items-center gap-3 ${
                            statusFilter === '' ? 'bg-blue-50 text-[#3399ff]' : 'hover:bg-gray-50 text-gray-700'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            statusFilter === '' ? 'bg-blue-100' : 'bg-gray-100'
                          }`}>
                            <Users className={`h-4 w-4 ${statusFilter === '' ? 'text-[#3399ff]' : 'text-gray-600'}`} />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold">All Statuses</p>
                            <p className="text-xs text-gray-500">Show all users</p>
                          </div>
                          {statusFilter === '' && <Check className="h-4 w-4 text-[#3399ff]" />}
                        </button>
                        
                        <button
                          onClick={() => handleStatusFilter('joined')}
                          className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors flex items-center gap-3 ${
                            statusFilter === 'joined' ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50 text-gray-700'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            statusFilter === 'joined' ? 'bg-blue-100' : 'bg-gray-100'
                          }`}>
                            <Package className={`h-4 w-4 ${statusFilter === 'joined' ? 'text-blue-600' : 'text-gray-600'}`} />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold">Joined</p>
                            <p className="text-xs text-gray-500">Campaign started</p>
                          </div>
                          {statusFilter === 'joined' && <Check className="h-4 w-4 text-blue-600" />}
                        </button>
                        
                        <button
                          onClick={() => handleStatusFilter('dispatched')}
                          className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors flex items-center gap-3 ${
                            statusFilter === 'dispatched' ? 'bg-orange-50 text-orange-700' : 'hover:bg-gray-50 text-gray-700'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            statusFilter === 'dispatched' ? 'bg-orange-100' : 'bg-gray-100'
                          }`}>
                            <Package className={`h-4 w-4 ${statusFilter === 'dispatched' ? 'text-orange-600' : 'text-gray-600'}`} />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold">Dispatched</p>
                            <p className="text-xs text-gray-500">Package shipped</p>
                          </div>
                          {statusFilter === 'dispatched' && <Check className="h-4 w-4 text-orange-600" />}
                        </button>
                        
                        <button
                          onClick={() => handleStatusFilter('delivered')}
                          className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors flex items-center gap-3 ${
                            statusFilter === 'delivered' ? 'bg-emerald-50 text-emerald-700' : 'hover:bg-gray-50 text-gray-700'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            statusFilter === 'delivered' ? 'bg-emerald-100' : 'bg-gray-100'
                          }`}>
                            <Check className={`h-4 w-4 ${statusFilter === 'delivered' ? 'text-emerald-600' : 'text-gray-600'}`} />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold">Delivered</p>
                            <p className="text-xs text-gray-500">Completed</p>
                          </div>
                          {statusFilter === 'delivered' && <Check className="h-4 w-4 text-emerald-600" />}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Select All Bar */}
          {filteredUsers.filter(user => user.activeCampaign?.status).length > 0 && (
            <div className="bg-gray-50 border-b border-gray-200 px-6 py-3">
              <button
                onClick={handleSelectAll}
                className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
              >
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                  selectedUsers.length === filteredUsers.filter(user => user.activeCampaign?.status).length
                    ? 'bg-[#3399ff] border-[#3399ff]'
                    : 'border-gray-300 bg-white'
                }`}>
                  {selectedUsers.length === filteredUsers.filter(user => user.activeCampaign?.status).length && (
                    <Check className="h-3 w-3 text-white" />
                  )}
                </div>
                Select All ({filteredUsers.filter(user => user.activeCampaign?.status).length} users)
              </button>
            </div>
          )}

          {/* Users List */}
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
                <div key={user._id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    {/* Checkbox + User Info */}
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      {user.activeCampaign?.status && (
                        <button
                          onClick={() => handleSelectUser(user._id)}
                          className="flex-shrink-0"
                        >
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                            selectedUsers.includes(user._id)
                              ? 'bg-[#3399ff] border-[#3399ff]'
                              : 'border-gray-300 bg-white hover:border-gray-400'
                          }`}>
                            {selectedUsers.includes(user._id) && (
                              <Check className="h-3 w-3 text-white" />
                            )}
                          </div>
                        </button>
                      )}
                      
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br from-[#3399ff] to-[#2ed6fd] flex items-center justify-center flex-shrink-0`}>
                        <span className="text-white font-bold text-lg">
                          {user.firstName?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {user.firstName} {user.lastName}
                        </h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Mail className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                          <p className="text-sm text-gray-500 truncate">{user.email}</p>
                        </div>
                      </div>
                    </div>

                    {/* Status & Actions */}
                    <div className="flex items-center gap-4 lg:gap-6">
                      {/* Status Badge */}
                      <div className="flex items-center gap-3">
                        {user.activeCampaign?.status ? (
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${getStatusColor(user.activeCampaign.status)}`}></div>
                            <span className="text-sm font-medium text-gray-700 capitalize">
                              {user.activeCampaign.status}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                            <span className="text-sm font-medium text-gray-500">No Campaign</span>
                          </div>
                        )}
                      </div>

                      {/* Credits */}
                      <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg">
                        <Award className="h-4 w-4 text-amber-500" />
                        <span className="text-sm font-semibold text-gray-900">{user.credits || 0}</span>
                      </div>

                      {/* Action Dropdown */}
                      {user.activeCampaign?.status && (
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleDropdown(user._id);
                            }}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <MoreVertical className="h-5 w-5 text-gray-600" />
                          </button>
                          
                          {openDropdown === user._id && (
                            <div className="absolute right-0 bottom-full mb-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
                              <div className="p-2">
                                {user.activeCampaign.status !== 'dispatched' && (
                                  <button
                                    onClick={() => handleUpdateStatus(user._id, 'dispatched')}
                                    className="w-full text-left px-3 py-2.5 hover:bg-orange-50 rounded-lg transition-colors flex items-center gap-3 group"
                                  >
                                    <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                                      <Package className="h-4 w-4 text-orange-600" />
                                    </div>
                                    <div>
                                      <p className="text-sm font-semibold text-gray-900">Mark Dispatched</p>
                                      <p className="text-xs text-gray-500">Package shipped</p>
                                    </div>
                                  </button>
                                )}
                                {user.activeCampaign.status !== 'delivered' && (
                                  <button
                                    onClick={() => handleUpdateStatus(user._id, 'delivered')}
                                    className="w-full text-left px-3 py-2.5 hover:bg-emerald-50 rounded-lg transition-colors flex items-center gap-3 group"
                                  >
                                    <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                                      <Check className="h-4 w-4 text-emerald-600" />
                                    </div>
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mt-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Showing <span className="font-semibold text-gray-900">{((currentPage - 1) * pageSize) + 1}</span> to{' '}
                <span className="font-semibold text-gray-900">{Math.min(currentPage * pageSize, totalUsers)}</span> of{' '}
                <span className="font-semibold text-gray-900">{totalUsers}</span> users
              </p>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    currentPage === 1
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-900 text-white hover:bg-gray-800'
                  }`}
                >
                  Previous
                </button>
                
                <div className="flex items-center gap-1">
                  {[...Array(Math.min(5, totalPages))].map((_, idx) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = idx + 1;
                    } else if (currentPage <= 3) {
                      pageNum = idx + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + idx;
                    } else {
                      pageNum = currentPage - 2 + idx;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                          currentPage === pageNum
                            ? 'bg-[#3399ff] text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    currentPage === totalPages
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-900 text-white hover:bg-gray-800'
                  }`}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;