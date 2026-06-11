import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { userAPI, adminAPI, sepSurveyAPI } from "../../services/api";
import { Users, Package, Plus, ArrowLeft, Award, Clock, X, Building2 } from "lucide-react";
import toast from "react-hot-toast";

import StatsGrid from "./components/StatsGrid.jsx";
import SurveyExports from "./components/SurveyExports.jsx";
import UserManagement from "./components/UserManagement.jsx";

const NAVY = "#1B2A4A";

const AdminDashboard = () => {
  const navigate = useNavigate();

  // Root States
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [avgCredits, setAvgCredits] = useState(0);
  const [surveys, setSurveys] = useState([]);
  const [activeTab, setActiveTab] = useState("users");
  const pageSize = 50;

  useEffect(() => {
    const fetchSurveys = async () => {
      try {
        const res = await sepSurveyAPI.getAvailable();
        setSurveys(res.data.data || []);
      } catch (err) {
        console.error("Failed to fetch surveys", err);
      }
    };
    fetchSurveys();
  }, []);

  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        const userResponse = await userAPI.getProfile();
        const userData = userResponse.data.data.user;

        if (userData.role !== "admin") {
          navigate("/profile");
          return;
        }
        await fetchUsers("", 1);
      } catch (error) {
        console.error("Error checking admin access:", error);
        if (error.response?.status === 401 || error.response?.status === 403) {
          navigate("/profile");
        } else {
          setError("Failed to load admin dashboard");
        }
      } finally {
        setLoading(false);
      }
    };
    checkAdminAccess();
  }, [navigate]);

  const fetchUsers = async (status = "", page = 1) => {
    try {
      const params = {
        ...(status && { status }),
        page,
        limit: pageSize,
      };
      const response = await adminAPI.getUsers(params);
      setUsers(response.data.data);

      if (response.data.pagination) {
        setTotalPages(response.data.pagination.totalPages);
        setTotalUsers(response.data.pagination.totalUsers);
        setAvgCredits(response.data.pagination.avgCredits ?? 0);
      } else {
        setTotalUsers(response.data.data.length);
        setTotalPages(1);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      setError("Failed to load users data");
    }
  };

  const handleExportTimings = async (surveyId, title) => {
    try {
      const res = await sepSurveyAPI.exportTimingsCSV(surveyId);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `timings-${title || surveyId}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("CSV downloaded");
    } catch (err) {
      console.error(err);
      toast.error(
        err.response?.status === 404
          ? "No timing data found for this survey"
          : "Failed to export timings"
      );
    }
  };

  const handleUpdateStatus = async (userId, newStatus) => {
    try {
      await adminAPI.updateUserStatus(userId, { status: newStatus });
      toast.success(`User status updated to ${newStatus}`);
      fetchUsers("", currentPage);
    } catch (error) {
      console.error("Error updating user status:", error);
      toast.error(error.response?.data?.message || "Failed to update user status");
    }
  };

  const handleBulkUpdateStatus = async (userIds, newStatus) => {
    const loadingToast = toast.loading(`Updating ${userIds.length} user(s)...`);
    try {
      const updatePromises = userIds.map((userId) =>
        adminAPI.updateUserStatus(userId, { status: newStatus })
      );
      await Promise.all(updatePromises);
      toast.success(`Successfully updated ${userIds.length} user(s) to ${newStatus}`, { id: loadingToast });
      fetchUsers("", currentPage);
    } catch (error) {
      console.error("Error in bulk update:", error);
      toast.error("Some updates failed. Please try again.", { id: loadingToast });
    }
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    fetchUsers("", newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "joined": return "bg-blue-500";
      case "dispatched": return "bg-amber-500";
      case "delivered": return "bg-emerald-500";
      default: return "bg-gray-400";
    }
  };

  const stats = [
    { label: "Total Users", value: totalUsers, icon: Users },
    { label: "Active Campaigns", value: users.filter((u) => u.activeCampaign?.status).length, icon: Package },
    { label: "Avg. Credits", value: avgCredits, icon: Award },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-14 h-14 border-4 border-gray-200 rounded-full animate-spin mx-auto" style={{ borderTopColor: NAVY }}></div>
          <p className="mt-4 text-gray-500 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center bg-white rounded-2xl shadow-sm border border-gray-200 p-12 max-w-md">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <X className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h3>
          <p className="text-gray-500 mb-8">{error}</p>
          <button onClick={() => navigate("/profile")} className="text-white px-8 py-3 rounded-xl font-medium transition-colors" style={{ backgroundColor: NAVY }}>
            Back to Profile
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Header Bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button onClick={() => navigate("/profile")} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-sm text-gray-500">Admin Control Panel</p>
              </div>
            </div>

            <div className="flex items-center flex-wrap gap-3">
              <button onClick={() => navigate("/admin/create-campaign")} className="flex items-center gap-2 text-white px-5 py-2.5 rounded-xl font-medium transition-all hover:opacity-90" style={{ backgroundColor: NAVY }}>
                <Plus className="h-4 w-4" /> New Campaign
              </button>
              <button onClick={() => navigate("/admin/create-sep-survey")} className="flex items-center gap-2 bg-white border-2 px-5 py-2.5 rounded-xl font-medium transition-all hover:bg-gray-50" style={{ borderColor: NAVY, color: NAVY }}>
                <Plus className="h-4 w-4" /> New Standalone Survey
              </button>
              <button onClick={() => navigate('/admin/businesses')} className="flex items-center gap-2 bg-white border-2 px-5 py-2.5 rounded-xl font-medium transition-all hover:bg-gray-50" style={{ borderColor: NAVY, color: NAVY }}>
                <Building2 className="h-4 w-4" /> Businesses
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Analytics Summary */}
        <StatsGrid stats={stats} NAVY={NAVY} />

        {/* Dynamic Tab Selector */}
        <div className="flex gap-2 mb-8">
          <button
            onClick={() => setActiveTab("users")}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-colors shadow-sm"
            style={activeTab === "users" ? { backgroundColor: NAVY, color: "white" } : { backgroundColor: "white", color: "#4b5563", border: "1px solid #e5e7eb" }}
          >
            <Users className="h-4 w-4" /> Users
          </button>
          <button
            onClick={() => setActiveTab("survey_exports")}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-colors shadow-sm"
            style={activeTab === "survey_exports" ? { backgroundColor: NAVY, color: "white" } : { backgroundColor: "white", color: "#4b5563", border: "1px solid #e5e7eb" }}
          >
            <Clock className="h-4 w-4" /> Survey Timer Export
          </button>
        </div>

        {/* View Switch Rendering */}
        {activeTab === "users" ? (
          <UserManagement
            users={users}
            fetchUsers={fetchUsers}
            currentPage={currentPage}
            totalPages={totalPages}
            totalUsers={totalUsers}
            pageSize={pageSize}
            handlePageChange={handlePageChange}
            handleUpdateStatus={handleUpdateStatus}
            handleBulkUpdateStatus={handleBulkUpdateStatus}
            getStatusColor={getStatusColor}
            NAVY={NAVY}
          />
        ) : (
          <SurveyExports surveys={surveys} handleExportTimings={handleExportTimings} />
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;