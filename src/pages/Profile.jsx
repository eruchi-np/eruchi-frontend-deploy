import React, { useState, useEffect } from "react";
import {
  AlertCircle,
  Loader2,
  ShieldCheck,
  LogOut,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { userAPI } from "../services/api";
import { clearAuth } from "../utils/auth";
import CreditsCard from "../components/profile/CreditsCard";
import VouchersCard from "../components/profile/VouchersCard";
import NotificationsCard from "../components/profile/NotificationsCard";
import SurveyHistoryCard from "../components/profile/SurveyHistoryCard";
import DemographicsWizard from '../components/demographics/DemographicsWizard';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [localCredits, setLocalCredits] = useState(null);
  const navigate = useNavigate();

  const { refreshUser } = useAuth();
  const [showWizard, setShowWizard] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await userAPI.getProfile();
        const userData = res?.data?.data?.user;
        if (!userData) throw new Error("Invalid user data");
        setUser(userData);
        setLocalCredits(userData.credits ?? 0);
      } catch (err) {
        if (err.response?.status === 401) {
          navigate("/login");
          return;
        }
        setError(
          err.response?.data?.message || "Failed to load profile."
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  const handleLogout = () => {
    clearAuth();
    window.dispatchEvent(new Event("authChange"));
    navigate("/login");
  };

  const handleProfileComplete = async () => {
    await refreshUser();
    setUser(prev => ({ ...prev, isProfileComplete: true }));
    setShowWizard(false);
  };

  if (loading)
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 mx-auto mb-4 text-[#3399FF] animate-spin" />
          <p className="text-gray-400 text-xs tracking-wide font-medium">Loading Account Console...</p>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center max-w-[400px]">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4 block" />
          <h3 className="text-base font-bold mb-2 text-gray-900 tracking-tight">
            Failed to Synchronize Profile
          </h3>
          <p className="text-gray-500 text-xs mb-6 leading-relaxed">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-[#102A43] text-white border-none py-3 px-6 rounded-full text-xs font-bold tracking-wide cursor-pointer mb-3 transition-opacity hover:opacity-90"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );

  if (!user) return null;

  return (
    <div className="min-h-screen bg-white text-gray-900 text-sm font-['Inter'] antialiased">
      {/* Main Structural Linear Container */}
      {/* pb-28 on mobile gives clearance above the fixed bottom nav bar */}
      <div className="max-w-[940px] mx-auto px-6 pt-12 pb-28 lg:py-16 space-y-14">
        
        {/* Identity Row */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-gray-100 pb-8 gap-6">
          <div>
            <span className="text-[10px] uppercase tracking-widest font-bold text-[#3399FF] block mb-1">
              Account Console
            </span>
            <h1 className="text-gray-900 font-light text-4xl tracking-tight mb-2">
              {user.firstName} {user.lastName}
            </h1>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-400">
              <span className="font-medium text-gray-600">{user.email}</span>
              {user.phone && (
                <>
                  <span>•</span>
                  <span>{user.phone}</span>
                </>
              )}
              <span>•</span>
              <span>
                Member since {new Date(user.createdAt).toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>

          {/* Action Header Nodes */}
          <div className="flex items-center gap-2.5 w-full md:w-auto">
            {user.role === "admin" && (
              <button
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold border border-gray-200 bg-white text-gray-700 transition-all hover:border-gray-900"
                onClick={() => navigate("/admin")}
              >
                <ShieldCheck size={13} />
                Admin
              </button>
            )}
            <button
              className="p-2.5 rounded-lg border border-gray-100 bg-gray-50/50 text-gray-400 transition-all hover:text-red-500 hover:bg-red-50/50"
              onClick={handleLogout}
              title="Sign Out"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>

        {/* Dynamic Demographics Action Banner */}
        {!user.isProfileComplete && (
          <div className="rounded-xl border border-blue-100 bg-blue-50/20 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {!showWizard ? (
              <>
                <div>
                  <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                    Complete Your Profile
                  </h2>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                    Tell us more about you! We'll use this to send you surveys that are relevant to you.
                  </p>
                </div>
                <button
                  onClick={() => setShowWizard(true)}
                  className="shrink-0 bg-[#102A43] text-white text-xs font-bold tracking-wide px-4 py-2.5 rounded-lg hover:opacity-95 transition-opacity"
                >
                  Complete Profile
                </button>
              </>
            ) : (
              <div className="w-full bg-white p-2 rounded-lg border border-gray-100">
                <DemographicsWizard onComplete={handleProfileComplete} />
              </div>
            )}
          </div>
        )}

        {/* TIER 1: Available Credit Ledger */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
          </div>
          <div className="pt-1">
            <CreditsCard credits={localCredits ?? 0} hideRedeem hideValue />
          </div>
        </div>

        {/* TIER 2: Voucher Assets */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
          </div>
          <div className="pt-1">
            <VouchersCard />
          </div>
        </div>

        {/* TIERS 3 & 4: Sub-Feeds Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-4">
          
          {/* TIER 3: Notifications Segment */}
          <div className="space-y-4">
            <div className="border-b border-gray-100 pb-2">
            </div>
            <NotificationsCard />
          </div>

          {/* TIER 4: Survey Activity Logs */}
          <div className="space-y-4">
            <div className="border-b border-gray-100 pb-2">
            </div>
            <SurveyHistoryCard completedCount={user.totalSurveys ?? 0} />
          </div>

        </div>

      </div>
    </div>
  );
};

export default Profile;