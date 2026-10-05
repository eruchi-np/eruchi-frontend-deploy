import React, { useState, useEffect, useCallback, useMemo, useRef, lazy, Suspense } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { adminAPI, sepSurveyAPI } from "../../services/api";
import {
  Users, Plus, ArrowLeft, Award, Clock, Building2, FileText,
  HelpCircle, CalendarDays, Ticket, Sparkles, ScanLine, Layers, Shield, BarChart3, Activity,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import {
  businessRedeemedVouchersPath,
  defaultAdminTab,
  hasPermission,
  roleLabel,
  TAB_PERMISSIONS,
} from "../../utils/adminRoles";

import StatsGrid from "./components/StatsGrid.jsx";

const UserManagement = lazy(() => import("./components/UserManagement.jsx"));
const UserDetailDrawer = lazy(() => import("./components/UserDetailDrawer.jsx"));
const StaffManagement = lazy(() => import("./components/StaffManagement.jsx"));
const ClusterManagement = lazy(() => import("./components/ClusterManagement.jsx"));
const SurveyManagement = lazy(() => import("./components/SurveyManagement.jsx"));
const MetricInsights = lazy(() => import("./components/MetricInsights.jsx"));
const SurveyCalendar = lazy(() => import("./components/SurveyCalendar.jsx"));
const VoucherManagement = lazy(() => import("./components/VoucherManagement.jsx"));
const RecommendationManagement = lazy(() => import("./components/RecommendationManagement.jsx"));
const ScanLogView = lazy(() => import("./components/ScanLogView.jsx"));
const SurveyExports = lazy(() => import("./components/SurveyExports.jsx"));

const TabFallback = () => (
  <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
    <p className="text-sm text-gray-500">Loading...</p>
  </div>
);

const NAVY = "#1B2A4A";
const TABS = [
  { id: "users", label: "Users", icon: Users },
  { id: "staff", label: "Staff", icon: Shield },
  { id: "clusters", label: "Clusters", icon: Layers },
  { id: "surveys", label: "Surveys", icon: FileText },
  { id: "metrics", label: "CEP / NPS", icon: BarChart3 },
  { id: "calendar", label: "Calendar", icon: CalendarDays },
  { id: "vouchers", label: "Vouchers", icon: Ticket },
  { id: "recommendations", label: "Recommendations", icon: Sparkles },
  { id: "scans", label: "Scan log", icon: ScanLine },
  { id: "survey_exports", label: "Timer export", icon: Clock },
];

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const role = user?.role;
  const can = useCallback((permission) => hasPermission(role, permission), [role]);
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get("tab") || defaultAdminTab(role);
  const visibleTabs = useMemo(
    () => TABS.filter((tab) => can(TAB_PERMISSIONS[tab.id])),
    [can]
  );
  const activeTab = visibleTabs.some((t) => t.id === requestedTab)
    ? requestedTab
    : (visibleTabs[0]?.id || defaultAdminTab(role));
  const setActiveTab = (tab) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams();
      next.set("tab", tab);
      if (tab === "vouchers") {
        const status = prev.get("status");
        const from = prev.get("from");
        const to = prev.get("to");
        if (status) next.set("status", status);
        if (from) next.set("from", from);
        if (to) next.set("to", to);
      }
      return next;
    });
  };

  const redeemedDeepLink =
    role === "business_admin" &&
    requestedTab === "vouchers" &&
    searchParams.get("status") === "used" &&
    Boolean(searchParams.get("from") || searchParams.get("to"));

  useEffect(() => {
    if (!redeemedDeepLink) return;
    navigate(
      businessRedeemedVouchersPath(searchParams.get("from") || "", searchParams.get("to") || ""),
      { replace: true }
    );
  }, [redeemedDeepLink, navigate, searchParams]);

  useEffect(() => {
    if (redeemedDeepLink) return;
    if (requestedTab !== activeTab) {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set("tab", activeTab);
        return next;
      }, { replace: true });
    }
  }, [requestedTab, activeTab, setSearchParams, redeemedDeepLink]);

  const [users, setUsers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [surveys, setSurveys] = useState([]);
  const [surveysLoading, setSurveysLoading] = useState(false);
  const surveysLoadedRef = useRef(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [userQuery, setUserQuery] = useState({});
  const pageSize = 50;

  const voucherStatusParam = searchParams.get("status");
  const initialVoucherStatus = ["active", "used", "expired", "cancelled"].includes(voucherStatusParam)
    ? voucherStatusParam
    : "active";
  const [vouchers, setVouchers] = useState([]);
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [voucherStatusFilter, setVoucherStatusFilter] = useState(initialVoucherStatus);
  const [voucherPagination, setVoucherPagination] = useState(null);
  const [voucherDateFrom, setVoucherDateFrom] = useState(searchParams.get("from") || "");
  const [voucherDateTo, setVoucherDateTo] = useState(searchParams.get("to") || "");
  const [voucherStatusCounts, setVoucherStatusCounts] = useState({
    active: 0,
    used: 0,
    expired: 0,
  });
  const [voucherRedeemedInRange, setVoucherRedeemedInRange] = useState(null);

  const [scanLogs, setScanLogs] = useState([]);
  const [scanLoading, setScanLoading] = useState(false);
  const [scanOutcome, setScanOutcome] = useState("");
  const [scanPagination, setScanPagination] = useState(null);

  const fetchStats = useCallback(async () => {
    if (!can("stats")) return;
    try {
      const res = await adminAPI.getStats({ skipErrorToast: true });
      setDashboardStats(res.data.data);
    } catch (err) {
      console.error("Failed to fetch admin stats", err);
    }
  }, [can]);

  const fetchSurveys = useCallback(async () => {
    try {
      const res = await sepSurveyAPI.getAvailable({
        limit: 500,
        manage: 1,
        skipErrorToast: true,
      });
      setSurveys(res.data.data || []);
      return true;
    } catch (err) {
      console.error("Failed to fetch surveys", err);
      return false;
    }
  }, []);

  const buildUserListParams = (filters = {}) => {
    const params = {};
    const setIf = (key, value) => {
      if (value === undefined || value === null || value === "") return;
      params[key] = value;
    };
    setIf("activity", filters.activity);
    if (filters.q?.trim()) params.q = filters.q.trim();
    setIf("isVerified", filters.isVerified);
    setIf("isProfileComplete", filters.isProfileComplete);
    setIf("isAdditionalProfileComplete", filters.isAdditionalProfileComplete);
    setIf("unsubscribedFromEmails", filters.unsubscribedFromEmails);
    setIf("creditsMin", filters.creditsMin);
    setIf("creditsMax", filters.creditsMax);
    setIf("createdAtFrom", filters.createdAtFrom);
    setIf("createdAtTo", filters.createdAtTo);
    setIf("dateOfBirthFrom", filters.dateOfBirthFrom);
    setIf("dateOfBirthTo", filters.dateOfBirthTo);
    setIf("lastSurveyCompletedAtFrom", filters.lastSurveyCompletedAtFrom);
    setIf("lastSurveyCompletedAtTo", filters.lastSurveyCompletedAtTo);
    if (Array.isArray(filters.addresses) && filters.addresses.length > 0) {
      params.addresses = filters.addresses
        .map((item) => `${item.municipality}|${item.ward}`)
        .join(",");
    }
    return params;
  };

  const fetchUsers = useCallback(async (filters = {}, page = 1) => {
    try {
      setCurrentPage(page);
      setUserQuery(filters);
      const response = await adminAPI.getUsers({
        ...buildUserListParams(filters),
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
      toast.error("Failed to load users");
    }
  }, []);

  const exportUserEmails = useCallback(async (filters = {}, emailType) => {
    try {
      const res = await adminAPI.exportUserEmailsCsv({
        ...buildUserListParams(filters),
        emailType,
        skipErrorToast: true,
      });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: "text/csv" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `user-emails-${emailType}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Eligible emails exported");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to export emails");
    }
  }, []);

  const fetchVoucherStats = async (from = voucherDateFrom, to = voucherDateTo) => {
    try {
      const res = await adminAPI.getVoucherStats({
        ...(from && { from }),
        ...(to && { to }),
        skipErrorToast: true,
      });
      const data = res.data.data || {};
      // When a range is applied, button badges show in-range counts for all three statuses
      if (from || to) {
        setVoucherStatusCounts(data.inRangeByStatus || { active: 0, used: 0, expired: 0 });
        setVoucherRedeemedInRange(data.redeemedInRange ?? 0);
      } else {
        setVoucherStatusCounts(data.byStatus || { active: 0, used: 0, expired: 0 });
        setVoucherRedeemedInRange(null);
      }
    } catch (err) {
      console.error("Failed to load voucher stats", err);
    }
  };

  const fetchVouchers = async (
    status = voucherStatusFilter,
    page = 1,
    from = voucherDateFrom,
    to = voucherDateTo
  ) => {
    setVoucherLoading(true);
    try {
      const res = await adminAPI.getVouchers({
        status,
        page,
        limit: 20,
        ...(from && { from }),
        ...(to && { to }),
        skipErrorToast: true,
      });
      setVouchers(res.data.data || []);
      setVoucherPagination(res.data.pagination || null);
      await fetchVoucherStats(from, to);
    } catch (err) {
      toast.error("Failed to load vouchers");
    } finally {
      setVoucherLoading(false);
    }
  };

  const handleVoucherDateRangeChange = ({ from, to }) => {
    const nextFrom = from || "";
    const nextTo = to || "";
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("tab", "vouchers");
      next.set("status", voucherStatusFilter);
      if (nextFrom) next.set("from", nextFrom);
      else next.delete("from");
      if (nextTo) next.set("to", nextTo);
      else next.delete("to");
      return next;
    });
  };

  const handleVoucherStatusFilter = (status) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("tab", "vouchers");
      next.set("status", status);
      if (voucherDateFrom) next.set("from", voucherDateFrom);
      else next.delete("from");
      if (voucherDateTo) next.set("to", voucherDateTo);
      else next.delete("to");
      return next;
    });
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
    fetchStats();
  }, [fetchStats]);

  const needsSurveyCatalog =
    activeTab === "surveys" || activeTab === "calendar" || activeTab === "survey_exports";

  useEffect(() => {
    if (!needsSurveyCatalog || !can("surveys") || surveysLoadedRef.current) return;
    let cancelled = false;
    setSurveysLoading(true);
    fetchSurveys().then((ok) => {
      if (cancelled) return;
      if (ok) surveysLoadedRef.current = true;
      setSurveysLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [needsSurveyCatalog, can, fetchSurveys]);

  const voucherFromParam = searchParams.get("from") || "";
  const voucherToParam = searchParams.get("to") || "";

  useEffect(() => {
    if (activeTab !== "vouchers") return;
    const status = ["active", "used", "expired", "cancelled"].includes(voucherStatusParam)
      ? voucherStatusParam
      : "active";
    setVoucherStatusFilter(status);
    setVoucherDateFrom(voucherFromParam);
    setVoucherDateTo(voucherToParam);
    fetchVouchers(status, 1, voucherFromParam, voucherToParam);
  }, [activeTab, voucherStatusParam, voucherFromParam, voucherToParam]);

  useEffect(() => {
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

  const handlePageChange = (newPage, filters = userQuery) => {
    fetchUsers(filters, newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const nepalYmd = (date = new Date()) =>
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kathmandu",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);
  const redeemedFrom = nepalYmd(new Date(Date.now() - 6 * 24 * 60 * 60 * 1000));
  const redeemedTo = nepalYmd();

  const statValue = (value) => (dashboardStats ? value : "—");

  const stats = [
    can("stats") && { label: "Total Users", value: statValue(dashboardStats?.totalUsers ?? 0), icon: Users },
    can("surveys") && { label: "Live surveys", value: statValue(dashboardStats?.liveSurveys ?? 0), icon: FileText, to: "/admin?tab=surveys" },
    can("users") && { label: "Avg. Credits", value: statValue(dashboardStats?.avgCredits ?? 0), icon: Award },
    can("businesses") && {
      label: "Pending businesses",
      value: statValue(dashboardStats?.pendingBusinesses ?? 0),
      icon: Building2,
      to: "/admin/businesses?verified=pending",
    },
    can("vouchers") && {
      label: "Redeemed (7d)",
      value: statValue(dashboardStats?.vouchersRedeemedWeek ?? 0),
      icon: Ticket,
      to: role === "business_admin"
        ? businessRedeemedVouchersPath(redeemedFrom, redeemedTo)
        : `/admin?tab=vouchers&status=used&from=${redeemedFrom}&to=${redeemedTo}`,
    },
  ].filter(Boolean);

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
                <p className="text-sm text-gray-500">{roleLabel(role)} control panel</p>
              </div>
            </div>

            <div className="flex items-center flex-wrap gap-2 sm:gap-3">
              {can("analytics") && (
                <button onClick={() => navigate("/admin/health")} className="flex items-center gap-2 bg-white border-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl text-sm font-medium transition-all hover:bg-gray-50" style={{ borderColor: NAVY, color: NAVY }}>
                  <Activity className="h-4 w-4" /> Health
                </button>
              )}
              {can("surveys") && (
                <button onClick={() => navigate("/admin/15-day-survey")} className="flex items-center gap-2 bg-white border-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl text-sm font-medium transition-all hover:bg-gray-50" style={{ borderColor: NAVY, color: NAVY }}>
                  <CalendarDays className="h-4 w-4" /> 15-day survey
                </button>
              )}
              {can("surveys") && (
                <button onClick={() => navigate("/admin/create-sep-survey")} className="flex items-center gap-2 text-white px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl text-sm font-medium transition-all hover:opacity-90" style={{ backgroundColor: NAVY }}>
                  <Plus className="h-4 w-4" /> <span className="hidden sm:inline">New Standalone </span>Survey
                </button>
              )}
              {can("businesses") && (
                <button onClick={() => navigate("/admin/businesses")} className="flex items-center gap-2 bg-white border-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl text-sm font-medium transition-all hover:bg-gray-50" style={{ borderColor: NAVY, color: NAVY }}>
                  <Building2 className="h-4 w-4" /> Businesses
                </button>
              )}
              {can("faqs") && (
                <button onClick={() => navigate("/admin/faqs")} className="flex items-center gap-2 bg-white border-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl text-sm font-medium transition-all hover:bg-gray-50" style={{ borderColor: NAVY, color: NAVY }}>
                  <HelpCircle className="h-4 w-4" /> FAQs
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-28">
        <StatsGrid stats={stats} NAVY={NAVY} />

        <div className="flex gap-2 mb-8 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">
          {visibleTabs.map((tab) => (
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

        <Suspense fallback={<TabFallback />}>
          {activeTab === "users" && (
            <UserManagement
              users={users}
              fetchUsers={fetchUsers}
              exportUserEmails={exportUserEmails}
              currentPage={currentPage}
              totalPages={totalPages}
              totalUsers={totalUsers}
              pageSize={pageSize}
              handlePageChange={handlePageChange}
              NAVY={NAVY}
              onSelectUser={setSelectedUserId}
            />
          )}
          {activeTab === "staff" && (
            <StaffManagement NAVY={NAVY} currentUserId={user?.id || user?._id} />
          )}
          {activeTab === "clusters" && <ClusterManagement NAVY={NAVY} />}
          {activeTab === "surveys" && (
            <SurveyManagement surveys={surveys} surveysLoading={surveysLoading} refetchSurveys={fetchSurveys} NAVY={NAVY} />
          )}
          {activeTab === "metrics" && <MetricInsights NAVY={NAVY} />}
          {activeTab === "calendar" && (
            <SurveyCalendar surveys={surveys} surveysLoading={surveysLoading} refetchSurveys={fetchSurveys} NAVY={NAVY} />
          )}
          {activeTab === "vouchers" && (
            <VoucherManagement
              vouchers={vouchers}
              voucherLoading={voucherLoading}
              voucherStatusFilter={voucherStatusFilter}
              handleVoucherStatusFilter={handleVoucherStatusFilter}
              pagination={voucherPagination}
              onPageChange={(page) => fetchVouchers(voucherStatusFilter, page)}
              dateFrom={voucherDateFrom}
              dateTo={voucherDateTo}
              onDateRangeChange={handleVoucherDateRangeChange}
              statusCounts={voucherStatusCounts}
              redeemedInRange={voucherRedeemedInRange}
              NAVY={NAVY}
            />
          )}
          {activeTab === "recommendations" && <RecommendationManagement NAVY={NAVY} />}
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
            <SurveyExports surveys={surveys} surveysLoading={surveysLoading} handleExportTimings={handleExportTimings} />
          )}
        </Suspense>
      </div>

      {selectedUserId && (
        <Suspense fallback={null}>
          <UserDetailDrawer
            userId={selectedUserId}
            onClose={() => setSelectedUserId(null)}
            NAVY={NAVY}
            onCreditsChanged={() => {
              fetchUsers(userQuery, currentPage);
              fetchStats();
            }}
          />
        </Suspense>
      )}
    </div>
  );
};

export default AdminDashboard;
