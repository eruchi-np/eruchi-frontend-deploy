import React, { useState, useEffect } from "react";
import { AlertCircle, Loader2, ShieldCheck, LogOut, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { userAPI } from "../services/api";
import { clearAuth } from "../utils/auth";
import CreditsCard from "../components/profile/CreditsCard";
import VouchersCard from "../components/profile/VouchersCard";
import SurveyHistoryCard from "../components/profile/SurveyHistoryCard";
import DemographicsWizard from "../components/demographics/DemographicsWizard";
import AdditionalProfileSurvey from "../components/demographics/AdditionalProfileSurvey";
import { useAuth } from "../context/AuthContext";
import AnimatedContent from "../components/animations/AnimatedContent";

import heroBg from "../assets/eruchi-home-bg.webp";

// Shared type scale — matches Homepage.jsx / Shop.jsx
const headingStyle = {
  fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
  fontSize: "clamp(32px, 5vw, 58px)",
  fontWeight: 500,
  lineHeight: 1.1,
};

const descriptionStyle = {
  fontSize: "clamp(15px, 1.5vw, 20px)",
  fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
  fontWeight: 300,
};

const Profile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [localCredits, setLocalCredits] = useState(null);
  const navigate = useNavigate();

  const { refreshUser } = useAuth();
  const [showWizard, setShowWizard] = useState(false);
  const [showAdditionalSurvey, setShowAdditionalSurvey] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

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
        setError(err.response?.data?.message || "Failed to load profile.");
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  const handleLogout = async () => {
    await clearAuth();
    window.dispatchEvent(new Event("authChange"));
    navigate("/login");
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await userAPI.deleteAccount();
      await clearAuth();
      window.dispatchEvent(new Event("authChange"));
      navigate("/");
      toast.success(
        () => (
          <div>
            <p className="font-medium">We're sad to see you go. Your account has been successfully deleted.</p>
            <p className="text-xs text-gray-500 mt-1">
              Your data and information will be carefully removed from eRuchi as per our{" "}
              <a href="/terms" className="underline">Terms of Use</a> and{" "}
              <a href="/privacy-policy" className="underline">Privacy Policy</a>.
            </p>
          </div>
        ),
        { duration: 6000 }
      );
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete account.");
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleProfileComplete = async () => {
    await refreshUser();
    setUser((prev) => ({ ...prev, isProfileComplete: true }));
    setShowWizard(false);
  };

  const handleAdditionalProfileComplete = async () => {
    await refreshUser();
    setUser((prev) => ({ ...prev, isAdditionalProfileComplete: true }));
    setShowAdditionalSurvey(false);
  };

  if (loading)
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 mx-auto mb-4 text-blue-600 animate-spin" />
          <p
            className="text-gray-400 text-sm font-light"
            style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}
          >
            Loading your account...
          </p>
        </div>
      </div>
    );

  if (error)
    return (
      <div
        className="min-h-screen bg-white flex items-center justify-center p-4"
        style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}
      >
        <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-3xl bg-gray-50/50 max-w-2xl w-full px-6">
          <AlertCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-gray-900 text-xl font-medium mb-2">
            Failed to load your profile
          </h3>
          <p className="text-gray-500 text-sm max-w-sm mx-auto mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 text-white rounded-full text-sm font-medium transition-opacity hover:opacity-90"
            style={{ backgroundColor: "#134074" }}
          >
            Retry
          </button>
        </div>
      </div>
    );

  if (!user) return null;

  const firstName = user.firstName;
  const needsOnboarding = !user.isProfileComplete || !user.isAdditionalProfileComplete;

  return (
    <div
      className="min-h-screen bg-white overflow-x-hidden"
      style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}
    >
      {/* ── Hero — mirrors Homepage.jsx hero treatment ── */}
      <div
        className="bg-cover bg-center flex flex-col justify-between pt-10 lg:pt-16 pb-0"
        style={{ backgroundImage: `url(${heroBg})`, minHeight: "560px" }}
      >
        <div className="max-w-[1150px] mx-auto px-4 sm:px-8 lg:px-10 w-full flex-1 flex flex-col">
          <div className="grid lg:grid-cols-[1fr_440px] gap-10 lg:gap-12 flex-1 items-end">
            {/* Left — identity */}
            <AnimatedContent
              direction="vertical"
              distance={40}
              duration={0.8}
              className="my-auto py-8 flex flex-col justify-center"
            >
              <div className="order-last lg:order-first flex items-center gap-3 mb-6 lg:mb-6 mt-6 lg:mt-0">
                {user.role === "admin" && (
                  <button
                    onClick={() => navigate("/admin")}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium border border-white/30 bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/20"
                  >
                    <ShieldCheck size={15} />
                    Admin
                  </button>
                )}
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold bg-white text-gray-900 shadow-lg transition-all hover:bg-red-50 hover:text-red-600 active:scale-[0.98]"
                >
                  <LogOut size={16} />
                  Sign out
                </button>
              </div>

              <h1 className="text-white mb-6" style={headingStyle}>
                Hey, <span className="text-white">{firstName}</span>.
              </h1>

              <p
                className="text-white/80 leading-snug max-w-[480px] mb-6"
                style={descriptionStyle}
              >
                Manage your credits, vouchers, and survey activity — all in
                one place.
              </p>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm text-white/50 font-light">
                <span className="text-white/80 font-normal">{user.email}</span>
                {user.phone && (
                  <>
                    <span>·</span>
                    <span>{user.phone}</span>
                  </>
                )}
                <span>·</span>
                <span>
                  Member since{" "}
                  {new Date(user.createdAt).toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
            </AnimatedContent>

            {/* Right — credit balance card, styled like Homepage's logged-in card */}
            <AnimatedContent
              direction="vertical"
              distance={40}
              duration={0.8}
              delay={0.15}
              className="w-full flex flex-col self-stretch"
            >
              <div className="bg-white p-8 lg:p-10 w-full flex-1 rounded-t-3xl rounded-b-none flex flex-col justify-center">
                <div className="flex flex-col justify-between h-full py-2">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900">
                      Your balance
                    </h2>
                    <p
                      className="text-gray-400 mt-1"
                      style={{ fontSize: "14px", fontWeight: 400 }}
                    >
                      {new Date().toLocaleDateString("en-US", {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>

                  <div className="my-8 flex flex-col items-center text-center py-6">
                    <p
                      style={{
                        fontSize: "80px",
                        fontWeight: 700,
                        lineHeight: 1,
                        color: "#134074",
                      }}
                    >
                      {localCredits ?? 0}
                    </p>
                    <p
                      className="text-gray-400 mt-2"
                      style={{ fontSize: "14px", fontWeight: 400, letterSpacing: "0.1em" }}
                    >
                      CREDITS
                    </p>
                  </div>

                  <div className="space-y-3">
                    <button
                      onClick={() => navigate("/standalone-surveys")}
                      className="w-full text-white hover:opacity-90 transition-all flex items-center justify-center rounded-full"
                      style={{
                        height: "58px",
                        fontSize: "18px",
                        fontWeight: 400,
                        fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                        backgroundColor: "#134074",
                        lineHeight: 1,
                      }}
                    >
                      Take Today's Survey
                    </button>
                    <button
                      onClick={() => navigate("/shop")}
                      className="w-full text-black border border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all flex items-center justify-center rounded-full"
                      style={{
                        height: "58px",
                        fontSize: "18px",
                        fontWeight: 400,
                        fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                        lineHeight: 1,
                      }}
                    >
                      Browse Rewards
                    </button>
                  </div>
                </div>
              </div>
            </AnimatedContent>
          </div>
        </div>
      </div>

      <div className="max-w-[1314px] mx-auto px-4 sm:px-8 lg:px-10 pt-14 pb-28 lg:pt-20 lg:pb-16">
        {/* ── Profile completion banners ── */}
        {needsOnboarding && (
          <div className="flex flex-col gap-4 mb-14 lg:mb-16">
            {!user.isProfileComplete && (
              <AnimatedContent direction="vertical" distance={30} duration={0.6}>
                <div className="rounded-3xl border-2 border-dashed border-gray-200 bg-gray-50/50 p-6 sm:p-8">
                  {!showWizard ? (
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
                      <div>
                        <h2 className="text-gray-900 text-lg sm:text-xl font-medium mb-1">
                          Complete your{" "}
                          <span className="text-blue-600">profile</span>.
                        </h2>
                        <p className="text-gray-500 text-sm font-light max-w-md">
                          Tell us more about you! We'll use this to send you
                          surveys that are relevant to you.
                        </p>
                      </div>
                      <button
                        onClick={() => setShowWizard(true)}
                        className="shrink-0 px-6 py-3 text-white rounded-full text-sm font-medium transition-opacity hover:opacity-90"
                        style={{ backgroundColor: "#134074" }}
                      >
                        Complete profile
                      </button>
                    </div>
                  ) : (
                    <div className="w-full bg-white p-3 rounded-2xl border border-gray-100">
                      <DemographicsWizard onComplete={handleProfileComplete} />
                    </div>
                  )}
                </div>
              </AnimatedContent>
            )}

            {!user.isAdditionalProfileComplete && (
              <AnimatedContent direction="vertical" distance={30} duration={0.6} delay={0.1}>
                <div className="rounded-3xl border-2 border-dashed border-gray-200 bg-gray-50/50 p-6 sm:p-8">
                  {!showAdditionalSurvey ? (
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
                      <div>
                        <h2 className="text-gray-900 text-lg sm:text-xl font-medium mb-1">
                          A few more{" "}
                          <span className="text-blue-600">questions</span>.
                        </h2>
                        <p className="text-gray-500 text-sm font-light max-w-md">
                          Optional, but it helps us tailor surveys to you even
                          better.
                        </p>
                      </div>
                      <button
                        onClick={() => setShowAdditionalSurvey(true)}
                        className="shrink-0 px-6 py-3 rounded-full text-sm font-medium border border-gray-200 bg-white text-gray-700 transition-colors hover:border-gray-400"
                      >
                        Answer questions
                      </button>
                    </div>
                  ) : (
                    <div className="w-full bg-white p-3 rounded-2xl border border-gray-100">
                      <AdditionalProfileSurvey onComplete={handleAdditionalProfileComplete} />
                    </div>
                  )}
                </div>
              </AnimatedContent>
            )}
          </div>
        )}

        {/* ── Vouchers + Survey history, side by side ── */}
        {/* ── Stats strip (reference: "Your Overall Progress") ── */}
        <AnimatedContent direction="vertical" distance={30} duration={0.6}>
          <section className="mb-8 lg:mb-10">
            <h2 className="text-gray-900 text-xl sm:text-2xl font-medium mb-5">
              Your <span className="text-blue-600">progress</span>
            </h2>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {[
                { label: "Surveys Completed", value: user.totalSurveys ?? 0 },
                { label: "Credits Balance", value: localCredits ?? 0 },
                { label: "Active Vouchers", value: user.activeVouchers ?? 0 },
                {
                  label: "Member Since",
                  value: new Date(user.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    year: "numeric",
                  }),
                },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-2xl border border-gray-100 bg-gray-50/60 px-5 py-5 flex flex-col justify-between min-h-[104px]"
                >
                  <p className="text-2xl sm:text-[28px] font-semibold leading-none text-gray-900">
                    {s.value}
                  </p>
                  <p className="text-xs text-gray-400 mt-3 leading-tight">
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </AnimatedContent>

        {/* ── Vouchers + Activity: equal-height cards, headers inside ── */}
        <div className="grid lg:grid-cols-2 gap-6 lg:gap-8 items-stretch">
          <AnimatedContent
            direction="vertical"
            distance={30}
            duration={0.6}
            delay={0.1}
            className="h-full"
          >
            <section className="h-full rounded-3xl border border-gray-100 bg-white overflow-hidden flex flex-col">
              <div className="flex items-center justify-between px-6 sm:px-7 pt-6 pb-4 border-b border-gray-100">
                <div>
                  <h2 className="text-gray-900 text-lg font-medium">
                    Your <span className="text-blue-600">vouchers</span>
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Redeemed rewards
                  </p>
                </div>
                <button
                  onClick={() => navigate("/vouchers")}
                  className="text-sm text-blue-600 font-medium hover:opacity-70 transition-opacity shrink-0"
                >
                  View all
                </button>
              </div>
              <div className="flex-1 px-2 sm:px-3 py-2">
                <VouchersCard embedded />
              </div>
            </section>
          </AnimatedContent>

          <AnimatedContent
            direction="vertical"
            distance={30}
            duration={0.6}
            delay={0.2}
            className="h-full"
          >
            <section className="h-full rounded-3xl border border-gray-100 bg-white overflow-hidden flex flex-col">
              <div className="flex items-center justify-between px-6 sm:px-7 pt-6 pb-4 border-b border-gray-100">
                <div>
                  <h2 className="text-gray-900 text-lg font-medium">
                    Survey <span className="text-blue-600">activity</span>
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Recent completions
                  </p>
                </div>
                <button
                  onClick={() => navigate("/survey-history")}
                  className="text-sm text-blue-600 font-medium hover:opacity-70 transition-opacity shrink-0"
                >
                  View all
                </button>
              </div>
              <div className="flex-1 px-2 sm:px-3 py-2">
                <SurveyHistoryCard
                  completedCount={user.totalSurveys ?? 0}
                  embedded
                />
              </div>
            </section>
          </AnimatedContent>
        </div>
        <div className="mt-16 text-center">
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            Delete account
          </button>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-sm w-full">
            <div className="flex items-center gap-2 mb-3 text-red-600">
              <Trash2 size={18} />
              <h3 className="font-medium text-gray-900">Delete your account?</h3>
            </div>
            <p className="text-sm text-gray-500 mb-6">
              This action cannot be undone. Your account and associated data will be permanently removed.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 rounded-full text-sm font-medium border border-gray-200 text-gray-700 hover:border-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 rounded-full text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-60"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;