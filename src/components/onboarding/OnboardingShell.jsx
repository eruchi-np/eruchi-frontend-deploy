import React, { useEffect, useRef } from "react";
import { Loader2, LogOut } from "lucide-react";
import HomeFooter from "../homepage/HomeFooter";
import { initOnboardingCinema } from "./onboardingCinema";
import skyBg from "../../assets/home/sky.jpg";
import "../homepage/homepage.css";
import "../profile/profile.css";
import "./onboarding.css";

export default function OnboardingShell({
  children,
  footer = true,
  onLogout,
  loggingOut = false,
}) {
  const rootRef = useRef(null);

  useEffect(() => {
    let revert = () => {};
    const frame = window.requestAnimationFrame(() => {
      revert = initOnboardingCinema(rootRef.current);
    });
    return () => {
      window.cancelAnimationFrame(frame);
      revert();
    };
  }, []);

  return (
    <div className="home-page onboard-page" ref={rootRef}>
      <div className="profile-sky onboard-sky" style={{ "--sky": `url(${skyBg})` }}>
        <div className="home-hero-sky" aria-hidden="true" />
      </div>
      <div className="home-sheet profile-sheet onboard-sheet">
        <div className="onboard-main">{children}</div>
      </div>
      {onLogout ? (
        <div className="onboard-logout">
          <button
            type="button"
            className="onboard-logout-btn"
            onClick={onLogout}
            disabled={loggingOut}
            aria-label={loggingOut ? "Logging out" : "Log out"}
          >
            {loggingOut ? <Loader2 size={22} className="animate-spin" /> : <LogOut size={22} />}
          </button>
        </div>
      ) : null}
      {footer ? <HomeFooter /> : null}
    </div>
  );
}
