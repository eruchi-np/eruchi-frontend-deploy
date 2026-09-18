import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { adminAPI, sepSurveyAPI } from "../../services/api";
import {
  Users, Package, Plus, ArrowLeft, Award, Clock, X, Building2, FileText,
  HelpCircle, CalendarDays, Ticket, ScanLine,
} from "lucide-react";
import toast from "react-hot-toast";

import StatsGrid from "./components/StatsGrid.jsx";
import SurveyExports from "./components/SurveyExports.jsx";
import UserManagement from "./components/UserManagement.jsx";
import UserDetailDrawer from "./components/UserDetailDrawer.jsx";
import SurveyManagement from "./components/SurveyManagement.jsx";
import SurveyCalendar from "./components/SurveyCalendar.jsx";
import VoucherManagement from "./components/VoucherManagement.jsx";
import ScanLogView from "./components/ScanLogView.jsx";

const NAVY = "#1B2A4A";
const TABS = [
  { id: "users", label: "Users", icon: Users },
  { id: "surveys", label: "Surveys", icon: FileText },
  { id: "calendar", label: "Calendar", icon: CalendarDays },
  { id: "vouchers", label: "Vouchers", icon: Ticket },
  { id: "scans", label: "Scan log", icon: ScanLine },
  { id: "survey_exports", label: "Timer export", icon: Clock },
];

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "users";
  const setActiveTab = (tab) => setSearchParams({ tab });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [users, setUsers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [surveys, setSurveys] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [userQuery, setUserQuery] = useState({ status: "", q: "" });
  const pageSize = 50;

  const [vouchers, setVouchers] = useState([]);
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [voucherStatusFilter, setVoucherStatusFilter] = useState("active");
  const [voucherPagination, setVoucherPagination] = useState(null);

  const [scanLogs, setScanLogs] = useState([]);
  const [scanLoading, setScanLoading] = useState(false);
  const [scanOutcome, setScanOutcome] = useState("");
  const [scanPagination, setScanPagination] = useState(null);

  const fetchStats = async () => {
    try {
      const res = await adminAPI.getStats({ skipErrorToast: true });
      setDashboardStats(res.data.data);
    } catch (err) {
      console.error("Failed to fetch admin stats", err);
    }
  };

  const fetchSurveys = async () => {
    try {
      const res = await sepSurveyAPI.getAvailable({ limit: 500, skipErrorToast: true });
      setSurveys(res.data.data || []);
    } catch (err) {
      console.error("Failed to fetch surveys", err);
    }
  };

  const fetchUsers = useCallback(async (status = "", page = 1, q = "") => {
    try {
      setCurrentPage(page);
      setUserQuery({ status, q });
      const response = await adminAPI.getUsers({
        ...(status && { status }),
        ...(q.trim() && { q: q.trim() }),
        page,
        limit: pageSize,
        skipErrorToast: true,
      });
      setUsers(response.data.data);
      if (response.data.pagination) {
        setTotalPages(response.data.pagination.totalPages);
        setTotalUsers(response.data.pagination.totalUsers);
      } else {
        setTotalUsers(response.data.data.length);
        setTotalPages(1);
      }
    } catch (err) {
      console.error("Error fetching users:", err);
      setError("Failed to load users data");
    }
  }, []);

  const fetchVouchers = async (status = voucherStatusFilter, page = 1) => {
    setVoucherLoading(true);
    try {
      const res = await adminAPI.getVouchers({ status, page, limit: 20, skipErrorToast: true });
      setVouchers(res.data.data || []);
      setVoucherPagination(res.data.pagination || null);
    } catch (err) {
      toast.error("Failed to load vouchers");
    } finally {
      setVoucherLoading(false);
    }
  };

  const fetchScans = async (outcome = scanOutcome, page = 1) => {
    setScanLoading(true);
    try {
      const res = await adminAPI.getScanLog({
        ...(outcome && { outcome }),
        page,
        limit: 50,
        skipErrorToast: true,
      });
      setScanLogs(res.data.data || []);
      setScanPagination(res.data.pagination || null);
    } catch (err) {
      toast.error("Failed to load scan log");
    } finally {
      setScanLoading(false);
    }
  };

  useEffect(() => {
    const boot = async () => {
      try {
        await Promise.all([fetchUsers("", 1), fetchSurveys(), fetchStats()]);
      } catch (err) {
        setError("Failed to load admin dashboard");
      } finally {
        setLoading(false);
      }
    };
    boot();
  }, [fetchUsers]);

  useEffect(() => {
    if (activeTab === "campaigns") {
      setActiveTab("users");
      return;
    }
    if (activeTab === "vouchers") fetchVouchers(voucherStatusFilter, 1);
    if (activeTab === "scans") fetchScans(scanOutcome, 1);
  }, [activeTab]);

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
      fetchUsers(userQuery.status, currentPage, userQuery.q);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update user status");
    }
  };

  const handleBulkUpdateStatus = async (userIds, newStatus) => {
    const loadingToast = toast.loading(`Updating ${userIds.length} user(s)...`);
    try {
      await Promise.all(userIds.map((userId) => adminAPI.updateUserStatus(userId, { status: newStatus })));
      toast.success(`Successfully updated ${userIds.length} user(s) to ${newStatus}`, { id: loadingToast });
      fetchUsers(userQuery.status, currentPage, userQuery.q);
    } catch (error) {
      toast.error("Some updates failed. Please try again.", { id: loadingToast });
    }
  };

  const handlePageChange = (newPage, status = userQuery.status, q = userQuery.q) => {
    fetchUsers(status, newPage, q);
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
    { label: "Total Users", value: dashboardStats?.totalUsers ?? totalUsers, icon: Users },
    { label: "In a campaign", value: dashboardStats?.usersInCampaign ?? 0, icon: Package },
    { label: "Live surveys", value: dashboardStats?.liveSurveys ?? 0, icon: FileText, to: "/admin?tab=surveys" },
    { label: "Avg. Credits", value: dashboardStats?.avgCredits ?? 0, icon: Award },
    { label: "Pending businesses", value: dashboardStats?.pendingBusinesses ?? 0, icon: Building2, to: "/admin/businesses" },
    { label: "Redeemed (7d)", value: dashboardStats?.vouchersRedeemedWeek ?? 0, icon: Ticket, to: "/admin?tab=vouchers" },
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
      <div className="bg-white/80 backdrop-blur-md border-b border-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <button onClick={() => navigate("/profile")} className="p-2 hover:bg-gray-100 rounded-lg transition-colors shrink-0">
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-sm text-gray-500">Admin Control Panel</p>
              </div>
            </div>

            <div className="flex items-center flex-wrap gap-2 sm:gap-3">
              <button onClick={() => navigate("/admin/create-sep-survey")} className="flex items-center gap-2 text-white px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl text-sm font-medium transition-all hover:opacity-90" style={{ backgroundColor: NAVY }}>
                <Plus className="h-4 w-4" /> <span className="hidden sm:inline">New Standalone </span>Survey
              </button>
              <button onClick={() => navigate("/admin/businesses")} className="flex items-center gap-2 bg-white border-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl text-sm font-medium transition-all hover:bg-gray-50" style={{ borderColor: NAVY, color: NAVY }}>
                <Building2 className="h-4 w-4" /> Businesses
              </button>
              <button onClick={() => navigate("/admin/faqs")} className="flex items-center gap-2 bg-white border-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl text-sm font-medium transition-all hover:bg-gray-50" style={{ borderColor: NAVY, color: NAVY }}>
                <HelpCircle className="h-4 w-4" /> FAQs
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-28">
        <StatsGrid stats={stats} NAVY={NAVY} />

        <div className="flex gap-2 mb-8 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl font-medium text-sm transition-colors shadow-sm shrink-0"
              style={activeTab === tab.id ? { backgroundColor: NAVY, color: "white" } : { backgroundColor: "white", color: "#4b5563", border: "1px solid #e5e7eb" }}
            >
              <tab.icon className="h-4 w-4" /> {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "users" && (
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
            onSelectUser={setSelectedUserId}
          />
        )}
        {activeTab === "surveys" && (
          <SurveyManagement surveys={surveys} refetchSurveys={fetchSurveys} NAVY={NAVY} />
        )}
        {activeTab === "calendar" && (
          <SurveyCalendar surveys={surveys} refetchSurveys={fetchSurveys} NAVY={NAVY} />
        )}
        {activeTab === "vouchers" && (
          <VoucherManagement
            vouchers={vouchers}
            voucherLoading={voucherLoading}
            voucherStatusFilter={voucherStatusFilter}
            handleVoucherStatusFilter={(status) => {
              setVoucherStatusFilter(status);
              fetchVouchers(status, 1);
            }}
            pagination={voucherPagination}
            onPageChange={(page) => fetchVouchers(voucherStatusFilter, page)}
            NAVY={NAVY}
          />
        )}
        {activeTab === "scans" && (
          <ScanLogView
            logs={scanLogs}
            loading={scanLoading}
            outcomeFilter={scanOutcome}
            onOutcomeFilter={(outcome) => {
              setScanOutcome(outcome);
              fetchScans(outcome, 1);
            }}
            pagination={scanPagination}
            onPageChange={(page) => fetchScans(scanOutcome, page)}
            NAVY={NAVY}
          />
        )}
        {activeTab === "survey_exports" && (
          <SurveyExports surveys={surveys} handleExportTimings={handleExportTimings} />
        )}
      </div>

      {selectedUserId && (
        <UserDetailDrawer
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
          NAVY={NAVY}
          onCreditsChanged={() => {
            fetchUsers(userQuery.status, currentPage, userQuery.q);
            fetchStats();
          }}
        />
      )}
    </div>
  );
};

export default AdminDashboard;
