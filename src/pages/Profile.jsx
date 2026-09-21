import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, Check, Loader2, Shield, ShieldCheck } from "lucide-react";
import { sepSurveyAPI, surveyAPI, userAPI, voucherAPI } from "../services/api";
import { getNextStreakBonus } from "../utils/streakBonus";
import { useAuth } from "../context/AuthContext";
import HomeFooter from "../components/homepage/HomeFooter";
import StreakGuardModal from "../components/profile/StreakGuardModal";
import { initProfileCinema } from "../components/profile/profileCinema";
import sectionIcon from "../assets/home/features/opinions.png";
import skyBg from "../assets/home/sky.jpg";
import "../components/homepage/homepage.css";
import "../components/profile/profile.css";
import { adminHomePath, isStaffAdmin } from "../utils/adminRoles";

const WEEK_LABELS = ["S", "M", "T", "W", "T", "F", "S"];
const VOUCHER_COLORS = ["#16365c", "#e91e63", "#f5a623", "#16365c"];

function nepalParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kathmandu",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  }).formatToParts(date);
  const get = (type) => parts.find((part) => part.type === type)?.value;
  const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday"));
  const year = Number(get("year"));
  const month = Number(get("month"));
  const day = Number(get("day"));
  return {
    year,
    month,
    day,
    weekday: weekday < 0 ? 0 : weekday,
    key: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
  };
}

function shiftCivilDate(parts, delta) {
  const shifted = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + delta));
  const year = shifted.getUTCFullYear();
  const month = shifted.getUTCMonth() + 1;
  const day = shifted.getUTCDate();
  return {
    year,
    month,
    day,
    weekday: (((parts.weekday + delta) % 7) + 7) % 7,
    key: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
  };
}

function nepalWeekDays(now = new Date()) {
  const today = nepalParts(now);
  const sunday = shiftCivilDate(today, -today.weekday);
  return Array.from({ length: 7 }, (_, i) => shiftCivilDate(sunday, i));
}

function creditGoal(credits) {
  const caps = [50, 100, 200, 300, 400, 500, 750, 1000, 1500, 2000, 5000];
  return caps.find((cap) => credits <= cap) || credits;
}

function mapSurvey(entry, type) {
  if (type === "campaign") {
    return {
      id: entry._id,
      title: entry.campaign?.title || "Campaign Survey",
      description: entry.campaign?.description || "Campaign survey you completed.",
      minutes: entry.survey?.estimatedMinutes || null,
      credits: entry.survey?.creditsToAward || 100,
      createdAt: entry.createdAt,
    };
  }
  return {
    id: entry._id,
    title: entry.survey?.title || "Survey",
    description: entry.survey?.description || "Standalone survey you completed.",
    minutes: entry.survey?.estimatedMinutes || null,
    credits: entry.survey?.credits || 50,
    createdAt: entry.createdAt,
  };
}

function easeOutCubic(t) {
  return 1 - (1 - t) ** 3;
}

function useCountUp(target, { duration = 2600, delay = 420 } = {}) {
  const end = Math.max(0, Number(target) || 0);
  const [amount, setAmount] = useState(0);

  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setAmount(end);
      return undefined;
    }

    setAmount(0);
    let raf = 0;
    let start = null;
    const timeout = window.setTimeout(() => {
      const tick = (now) => {
        if (start == null) start = now;
        const t = Math.min(1, (now - start) / duration);
        setAmount(end * easeOutCubic(t));
        if (t < 1) raf = window.requestAnimationFrame(tick);
      };
      raf = window.requestAnimationFrame(tick);
    }, delay);

    return () => {
      window.clearTimeout(timeout);
      window.cancelAnimationFrame(raf);
    };
  }, [end, duration, delay]);

  return amount;
}

function StatRing({ value, max, color, label, unit, children, delay = 420 }) {
  const r = 62;
  const c = 2 * Math.PI * r;
  const end = Math.max(0, Number(value) || 0);
  const amount = useCountUp(end, { delay });
  const pct = Math.min(1, amount / Math.max(max, 1));
  return (
    <div className="profile-ring">
      <svg viewBox="0 0 160 160" fill="none">
        <circle cx="80" cy="80" r={r} stroke="#eef1f4" strokeWidth="10" />
        <circle
          className="profile-ring-arc"
          cx="80"
          cy="80"
          r={r}
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          transform="rotate(-90 80 80)"
        />
      </svg>
      <div className="profile-ring-inner">
        <p className="profile-ring-label">{label}</p>
        <p className="profile-ring-value">{Math.round(amount).toLocaleString()}</p>
        {unit ? <p className="profile-ring-unit">{unit}</p> : children}
      </div>
    </div>
  );
}

function ProfileShell({ children, footer, shellRef }) {
  return (
    <div className="home-page profile-page" ref={shellRef}>
      <div className="profile-sky" style={{ "--sky": `url(${skyBg})` }}>
        <div className="home-hero-sky" aria-hidden="true" />
      </div>
      <div className="home-sheet profile-sheet">{children}</div>
      {footer}
    </div>
  );
}

export default function Profile() {
  const navigate = useNavigate();
  const { refreshUser, logout, user: authUser } = useAuth();
  const scrollerRef = useRef(null);
  const pageRef = useRef(null);
  const [user, setUser] = useState(null);
  const [vouchers, setVouchers] = useState([]);
  const [surveys, setSurveys] = useState([]);
  const [weekDone, setWeekDone] = useState(() => WEEK_LABELS.map(() => false));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [scrollPct, setScrollPct] = useState(0);
  const [thumbW, setThumbW] = useState(32);
  const [showStreakGuard, setShowStreakGuard] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [profileRes, voucherRes, campRes, standRes] = await Promise.all([
          userAPI.getProfile(),
          voucherAPI.getMyVouchers({ status: "active", skipErrorToast: true }),
          surveyAPI.getSurveyHistory({ skipErrorToast: true }),
          sepSurveyAPI.getHistory({ limit: 100, skipErrorToast: true }),
        ]);

        const userData = profileRes?.data?.data?.user;
        if (!userData) throw new Error("Invalid user data");

        if (!userData.isProfileComplete) {
          navigate("/complete-profile", { replace: true });
          return;
        }
        if (!userData.isAdditionalProfileComplete) {
          navigate("/additional-profile", { replace: true });
          return;
        }

        setUser(userData);

        const nextVouchers = voucherRes?.data?.data || [];
        setVouchers(nextVouchers);

        const nextSurveys = [
          ...(campRes?.data?.data || []).map((row) => mapSurvey(row, "campaign")),
          ...(standRes?.data?.data || []).map((row) => mapSurvey(row, "standalone")),
        ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setSurveys(nextSurveys);

        const done = new Set(nextSurveys.map((row) => nepalParts(new Date(row.createdAt)).key));
        const streak = Number(userData.streakCount) || 0;
        if (userData.lastStreakDate && streak > 0) {
          const last = nepalParts(new Date(userData.lastStreakDate));
          for (let i = 0; i < Math.min(streak, 7); i += 1) {
            done.add(shiftCivilDate(last, -i).key);
          }
        }
        setWeekDone(nepalWeekDays().map((day) => done.has(day.key)));
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

  const syncCarousel = () => {
    const el = scrollerRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setScrollPct(max > 0 ? el.scrollLeft / max : 0);
    setThumbW(Math.max(22, (el.clientWidth / Math.max(el.scrollWidth, 1)) * 100));
  };

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return undefined;
    syncCarousel();
    el.addEventListener("scroll", syncCarousel, { passive: true });
    window.addEventListener("resize", syncCarousel);
    return () => {
      el.removeEventListener("scroll", syncCarousel);
      window.removeEventListener("resize", syncCarousel);
    };
  }, [vouchers.length, loading]);

  useEffect(() => {
    if (loading || !user) return undefined;
    let revert = () => {};
    let inner = 0;
    const outer = window.requestAnimationFrame(() => {
      inner = window.requestAnimationFrame(() => {
        revert = initProfileCinema(pageRef.current);
      });
    });
    return () => {
      window.cancelAnimationFrame(outer);
      window.cancelAnimationFrame(inner);
      revert();
    };
  }, [loading, user?.id]);

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const handleLoadRetry = () => {
    if (authUser && !authUser.isProfileComplete) {
      navigate("/complete-profile", { replace: true });
      return;
    }
    if (authUser && !authUser.isAdditionalProfileComplete) {
      navigate("/additional-profile", { replace: true });
      return;
    }
    window.location.reload();
  };

  if (loading) {
    return (
      <ProfileShell shellRef={pageRef}>
        <div className="min-h-[50vh] flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 mx-auto mb-4 text-blue-600 animate-spin" />
            <p className="text-gray-400 text-sm">Loading your account...</p>
          </div>
        </div>
      </ProfileShell>
    );
  }

  if (error) {
    return (
      <ProfileShell>
        <div className="min-h-[50vh] flex items-center justify-center p-4">
          <div className="text-center py-20 max-w-xl">
            <AlertCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium mb-2">Failed to load your profile</h3>
            <p className="text-gray-500 text-sm mb-6">{error}</p>
            <button type="button" className="home-pill home-pill-sm home-pill-navy" onClick={handleLoadRetry}>
              {authUser && !authUser.isProfileComplete ? "Complete profile" : "Retry"}
            </button>
          </div>
        </div>
      </ProfileShell>
    );
  }

  if (!user) return null;

  const firstName = user.firstName || user.username || "there";
  const streak = Number(user.streakCount) || 0;
  const credits = Number(user.credits) || 0;
  const nextBonus = getNextStreakBonus(streak);
  const streakGoal = nextBonus.rewardCounter + nextBonus.remaining;
  const previewSurveys = surveys.slice(0, 4);

  const handleGuardPurchased = (data) => {
    setUser((prev) => ({
      ...prev,
      credits: data.credits ?? prev.credits,
      streakCount: data.streakCount ?? prev.streakCount,
      lastStreakDate: data.lastStreakDate ?? prev.lastStreakDate,
      streakGuardDays: data.streakGuardDays ?? prev.streakGuardDays,
      canPurchaseStreakGuard: data.canPurchaseStreakGuard,
      streakGuardCooldownDays: data.streakGuardCooldownDays ?? 0,
    }));
    refreshUser();
  };

  return (
    <ProfileShell footer={<HomeFooter />} shellRef={pageRef}>
      <main className="profile-main">
        <section className="profile-hero">
          <div>
            <div className="profile-hero-name">
              <h1>Hi, {firstName}.</h1>
              <button
                type="button"
                className="profile-guard-btn"
                onClick={() => setShowStreakGuard(true)}
              >
                <Shield size={15} />
                Streak Guard
                {Number(user.streakGuardDays) > 0 ? (
                  <span>{user.streakGuardDays}d</span>
                ) : null}
              </button>
            </div>
            <p className="profile-hero-copy">
              A few credits at a time, it adds up. Here&apos;s everything you&apos;ve earned and claimed so far.
            </p>
            <div className="profile-hero-actions">
              <button type="button" className="profile-btn profile-btn-outline" onClick={() => navigate("/edit-profile")}>
                Edit Profile
              </button>
              <button type="button" className="profile-btn profile-btn-logout" onClick={handleLogout}>
                Logout
              </button>
              {isStaffAdmin(user.role) && (
                <button type="button" className="profile-btn profile-btn-outline" onClick={() => navigate(adminHomePath(user.role))}>
                  <ShieldCheck size={14} className="mr-2" />
                  Admin
                </button>
              )}
            </div>
          </div>

          <div className="profile-stats">
            <div className="profile-stat">
              <StatRing
                value={streak}
                max={streakGoal}
                color="#7bd13a"
                label="Day Streak"
                unit={streak === 1 ? "Day in a row" : "Days in a row"}
                delay={480}
              />
              <div className="profile-week" aria-label="Surveys completed this week">
                {WEEK_LABELS.map((label, i) => (
                  <div className="profile-week-day" key={`${label}-${i}`}>
                    <span>{label}</span>
                    <div className={`profile-week-dot ${weekDone[i] ? "is-on" : ""}`}>
                      {weekDone[i] && <Check size={11} strokeWidth={3} />}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="profile-stat">
              <StatRing
                value={credits}
                max={creditGoal(credits)}
                color="#5ba8e8"
                label="Total Credits"
                unit="Credits"
                delay={640}
              />
              <p className="profile-stat-note">
                You&apos;ve earned {credits} total credits from all your activities.
              </p>
            </div>
          </div>
        </section>

        <section className="profile-section">
          <div className="profile-section-head">
            <div className="profile-section-title">
              <img src={sectionIcon} alt="" />
              <div>
                <h2>Your Vouchers</h2>
                <p>Every reward you&apos;ve picked up, all in one place.</p>
              </div>
            </div>
            <button type="button" className="home-pill home-pill-lime profile-view-all" onClick={() => navigate("/vouchers")}>
              View All
            </button>
          </div>

          {vouchers.length === 0 ? (
            <div className="profile-empty">No vouchers yet. Redeem credits in Rewards to see them here.</div>
          ) : (
            <>
              <div className="profile-voucher-row" ref={scrollerRef}>
                {vouchers.map((voucher, i) => {
                  const snap = voucher.offerSnapshot || {};
                  const logo = snap.imageUrl || snap.brandLogo;
                  const brand = snap.brandName || snap.businessName || "Reward";
                  return (
                    <button
                      key={voucher._id}
                      type="button"
                      className="profile-voucher"
                      style={{ background: VOUCHER_COLORS[i % VOUCHER_COLORS.length] }}
                      onClick={() => navigate(`/vouchers/${voucher._id}`)}
                    >
                      <div className="profile-voucher-cap">
                        {logo ? (
                          <img src={logo} alt={brand} />
                        ) : (
                          <span className="profile-voucher-initial">{brand.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <p className="profile-voucher-credits">{voucher.creditsSpent ?? 0} CREDITS</p>
                      <p className="profile-voucher-title">{snap.title || brand}</p>
                    </button>
                  );
                })}
              </div>
              <div className="profile-voucher-scroll" aria-hidden="true">
                <div className="home-scroll-track">
                  <span
                    className="home-scroll-thumb"
                    style={{
                      width: `${thumbW}%`,
                      left: `${scrollPct * (100 - thumbW)}%`,
                    }}
                  />
                </div>
              </div>
            </>
          )}

          <div className="profile-section-cta">
            <button type="button" className="home-pill home-pill-lg home-pill-navy" onClick={() => navigate("/shop")}>
              Redeem Vouchers
            </button>
          </div>
        </section>

        <section className="profile-section">
          <div className="profile-section-head">
            <div className="profile-section-title">
              <img src={sectionIcon} alt="" />
              <div>
                <h2>Survey History</h2>
                <p>Every survey you have been a part of, all in one place.</p>
              </div>
            </div>
            <button type="button" className="home-pill home-pill-lime profile-view-all" onClick={() => navigate("/survey-history")}>
              View All
            </button>
          </div>

          {previewSurveys.length === 0 ? (
            <div className="profile-empty">No surveys completed yet. Take a survey to see it here.</div>
          ) : (
            <div className="profile-surveys">
              {previewSurveys.map((survey) => (
                <div className="profile-survey" key={survey.id}>
                  <div className="profile-survey-icon" aria-hidden="true" />
                  <div className="profile-survey-copy">
                    <h3>{survey.title}</h3>
                    <p>{survey.description}</p>
                  </div>
                  <div className="profile-survey-meta">
                    <span>{survey.minutes ? `${survey.minutes} Min` : "—"}</span>
                    <span>{survey.credits} credits</span>
                  </div>
                  <button
                    type="button"
                    className="profile-btn profile-btn-outline profile-survey-view"
                    onClick={() => navigate("/survey-history")}
                  >
                    View
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
      {showStreakGuard && (
        <StreakGuardModal
          credits={credits}
          streakGuardDays={Number(user.streakGuardDays) || 0}
          canPurchase={user.canPurchaseStreakGuard !== false}
          cooldownDays={Number(user.streakGuardCooldownDays) || 0}
          onClose={() => setShowStreakGuard(false)}
          onPurchased={handleGuardPurchased}
        />
      )}
    </ProfileShell>
  );
}
