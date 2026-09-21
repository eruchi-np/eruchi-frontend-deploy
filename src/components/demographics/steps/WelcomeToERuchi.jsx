import React from "react";
import { useNavigate } from "react-router-dom";
import OnboardingShell from "../../onboarding/OnboardingShell";

const WelcomeToERuchi = () => {
  const navigate = useNavigate();

  return (
    <OnboardingShell>
      <div className="onboard-card onboard-welcome-copy">
        <h1 className="onboard-title">You&apos;re in.</h1>
        <p className="onboard-copy">
          Thanks for telling us a little more about you. We&apos;ll use this to match you with
          surveys that actually fit your life.
        </p>
        <p className="onboard-copy">Your first survey is ready — it takes under 2 minutes.</p>
        <div className="onboard-actions">
          <button type="button" className="home-pill home-pill-lg home-pill-lime" onClick={() => navigate("/")}>
            Start exploring
          </button>
        </div>
      </div>
    </OnboardingShell>
  );
};

export default WelcomeToERuchi;
