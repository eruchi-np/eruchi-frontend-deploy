import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import DemographicsWizard from "../components/demographics/DemographicsWizard";
import WelcomeToERuchi from "../components/demographics/steps/WelcomeToERuchi";
import OnboardingShell from "../components/onboarding/OnboardingShell";
import CreditRewardBadge from "../components/onboarding/CreditRewardBadge";
import { PROFILE_COMPLETION_1_CREDITS } from "../utils/onboardingCredits";
import { useAuth } from "../context/AuthContext";

const CompleteProfile = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [profileCompleted, setProfileCompleted] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleProfileComplete = () => {
    window.dispatchEvent(new Event("profileComplete"));
    setProfileCompleted(true);
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      navigate("/login", { replace: true });
    } finally {
      setLoggingOut(false);
    }
  };

  if (profileCompleted) {
    return <WelcomeToERuchi />;
  }

  return (
    <OnboardingShell>
      <div className="onboard-card">
        <div className="onboard-kicker">
          <CreditRewardBadge amount={PROFILE_COMPLETION_1_CREDITS} />
        </div>
        <h1 className="onboard-title">Complete your profile</h1>
        <p className="onboard-copy">
          Tell us more about you — earn {PROFILE_COMPLETION_1_CREDITS} Ruchi Credits, and we&apos;ll
          match you to more relevant surveys.
        </p>
        <DemographicsWizard onComplete={handleProfileComplete} />
        <div className="onboard-links" style={{ marginTop: 24 }}>
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="bg-transparent border-0 p-0 cursor-pointer underline-offset-2 hover:underline disabled:opacity-50"
            style={{ color: "inherit", font: "inherit" }}
          >
            {loggingOut ? "Logging out…" : "Log out"}
          </button>
        </div>
      </div>
    </OnboardingShell>
  );
};

export default CompleteProfile;
