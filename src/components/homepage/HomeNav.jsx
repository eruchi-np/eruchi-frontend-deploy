import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import ProfileCompletionBar from "../layout/ProfileCompletionBar";
import { useAuth } from "../../context/AuthContext";
import { trackEvent } from "../../utils/visitorEvents";
import "./homepage.css";

export default function HomeNav({ variant = "page" }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user, loading } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const waitingOnSession =
    loading && typeof window !== "undefined" && Boolean(localStorage.getItem("access_token"));
  const isLoggedIn = Boolean(user) || waitingOnSession;
  const isAdmin = user?.role === "admin";
  const isOverlay = variant === "overlay";
  const isBusiness = variant === "business";
  const lightNav = isOverlay && !scrolled && !menuOpen;
  const linkColor = lightNav ? "#fff" : "#0c1520";

  useEffect(() => {
    if (!isOverlay) {
      setScrolled(false);
      return undefined;
    }
    const onScroll = () => {
      // Auth/onboarding skies are short (~160–240px). Using the home hero
      // threshold (~62vh) leaves the transparent overlay nav floating over
      // the white form after the sky has scrolled away.
      const shortSkyPaths = new Set([
        "/signup",
        "/login",
        "/email-verification",
        "/complete-basic-info",
        "/complete-profile",
        "/additional-profile",
        "/profile",
      ]);
      const threshold = shortSkyPaths.has(pathname) ? 120 : window.innerHeight * 0.62;
      setScrolled(window.scrollY > threshold);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isOverlay, pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const goStarted = () => {
    trackEvent("cta_click", "/get_started");
    navigate("/signup");
  };

  const goLogin = () => {
    trackEvent("cta_click", "/login");
    navigate("/login");
  };

  const goProfile = () => {
    trackEvent("cta_click", "/profile");
    navigate(isBusiness ? "/business/profile" : "/profile");
  };

  const goSurveys = () => {
    trackEvent("cta_click", "/surveys");
    navigate(isLoggedIn ? "/standalone-surveys" : "/signup");
  };

  const headerClass = [
    "home-nav",
    isOverlay ? "home-nav-overlay" : "home-nav-page",
    isOverlay && scrolled ? "is-scrolled" : "",
    menuOpen ? "is-open" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const ctaLabel = isLoggedIn || isBusiness ? "Profile" : "Get Started";
  const onCta = isLoggedIn || isBusiness ? goProfile : goStarted;
  const avatarLetter = (
    user?.firstName ||
    user?.username ||
    (typeof window !== "undefined" ? localStorage.getItem("business_name") : "") ||
    (typeof window !== "undefined" ? localStorage.getItem("username") : "") ||
    "U"
  )
    .trim()
    .charAt(0)
    .toUpperCase() || "U";

  return (
    <>
      <header className={headerClass}>
        <ProfileCompletionBar />
        <div className="home-nav-inner">
          <Link to={isBusiness ? "/business/dashboard" : "/"} className="justify-self-start">
            <img
              src="/logo-mark.png"
              alt="eRuchi"
              className={`home-logo ${lightNav ? "home-logo-light" : ""}`}
            />
          </Link>

          <nav className="home-nav-links">
            {isBusiness ? (
              <>
                <Link to="/business/dashboard" style={{ color: linkColor }}>
                  Dashboard
                </Link>
                <Link to="/business/scan" style={{ color: linkColor }}>
                  Scan
                </Link>
                <Link to="/business/profile" style={{ color: linkColor }}>
                  Profile
                </Link>
              </>
            ) : (
              <>
                <Link to="/" style={{ color: linkColor }}>
                  Home
                </Link>
                <Link to="/shop" onClick={() => window.scrollTo(0, 0)} style={{ color: linkColor }}>
                  Rewards
                </Link>
                <button
                  type="button"
                  onClick={goSurveys}
                  style={{ color: linkColor }}
                  className="uppercase tracking-[0.16em] text-[12px] font-semibold"
                >
                  Survey
                </button>
                {isAdmin && (
                  <Link to="/admin" style={{ color: linkColor }}>
                    Admin
                  </Link>
                )}
              </>
            )}
          </nav>

          <div className="home-nav-end">
            {isLoggedIn || isBusiness ? (
              <button
                type="button"
                onClick={onCta}
                className={`home-nav-avatar ${lightNav ? "home-nav-avatar-light" : "home-nav-avatar-dark"}`}
                aria-label="Profile"
              >
                <span className="home-nav-avatar-letter">{avatarLetter}</span>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={onCta}
                  className={`home-pill home-pill-sm ${lightNav ? "home-pill-white" : "home-pill-navy"}`}
                >
                  Get Started
                </button>
                <button
                  type="button"
                  onClick={goLogin}
                  className={`home-pill home-pill-sm ${lightNav ? "home-pill-ghost-light" : "home-pill-ghost"}`}
                >
                  Login
                </button>
              </>
            )}
            <button
              type="button"
              className="home-menu-btn"
              aria-label="Open menu"
              onClick={() => setMenuOpen(true)}
              style={{ color: linkColor }}
            >
              <Menu size={26} />
            </button>
          </div>
        </div>
      </header>

      {menuOpen && (
        <div className="home-drawer">
          <div className="flex items-center justify-between mb-6">
            <img src="/logo-mark.png" alt="eRuchi" className="h-8 w-auto" />
            <button type="button" aria-label="Close menu" onClick={() => setMenuOpen(false)}>
              <X size={26} />
            </button>
          </div>
          {isBusiness ? (
            <>
              <Link to="/business/dashboard" onClick={() => setMenuOpen(false)}>
                Dashboard
              </Link>
              <Link to="/business/scan" onClick={() => setMenuOpen(false)}>
                Scan
              </Link>
              <Link to="/business/profile" onClick={() => setMenuOpen(false)}>
                Profile
              </Link>
            </>
          ) : (
            <>
              <Link to="/" onClick={() => setMenuOpen(false)}>
                Home
              </Link>
              <Link to="/shop" onClick={() => { setMenuOpen(false); window.scrollTo(0, 0); }}>
                Rewards
              </Link>
              <button
                type="button"
                className="text-left py-3.5 border-b border-[#f1f3f5] font-semibold tracking-[0.12em] uppercase text-sm"
                onClick={() => {
                  setMenuOpen(false);
                  goSurveys();
                }}
              >
                Survey
              </button>
              {isAdmin && (
                <Link to="/admin" onClick={() => setMenuOpen(false)}>
                  Admin
                </Link>
              )}
            </>
          )}
          <button
            type="button"
            className="home-pill home-pill-lg home-pill-lime mt-8 w-full"
            onClick={() => {
              setMenuOpen(false);
              onCta();
            }}
          >
            {ctaLabel}
          </button>
          {!isLoggedIn && !isBusiness && (
            <button
              type="button"
              className="home-pill home-pill-lg home-pill-ghost mt-3 w-full"
              onClick={() => {
                setMenuOpen(false);
                goLogin();
              }}
            >
              Login
            </button>
          )}
        </div>
      )}
    </>
  );
}
