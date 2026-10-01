import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import DemographicsWizard from "../components/demographics/DemographicsWizard";
import WelcomeToERuchi from "../components/demographics/steps/WelcomeToERuchi";
import OnboardingShell from "../components/onboarding/OnboardingShell";
import CreditRewardBadge from "../components/onboarding/CreditRewardBadge";
import { PROFILE_COMPLETION_1_CREDITS } from "../utils/onboardingCredits";
import { useAuth } from "../context/AuthContext";

const CompleteProfile = ({ mode = "registration" }) => {
  const isRefresh = mode === "refresh";
  const navigate = useNavigate();
  const { logout, user, refreshUser } = useAuth();
  const refreshPays = isRefresh && user?.profileOutdated;
  const [profileCompleted, setProfileCompleted] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleProfileComplete = async (awarded) => {
    window.dispatchEvent(new Event("profileComplete"));
    if (isRefresh) {
      await refreshUser();
      navigate("/refresh-additional-profile", {
        replace: true,
        state: { demographicsSaved: Number(awarded) > 0 },
      });
      return;
    }
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
    <OnboardingShell onLogout={handleLogout} loggingOut={loggingOut}>
      <div className="onboard-card">
        {(!isRefresh || refreshPays) && (
          <div className="onboard-kicker">
            <CreditRewardBadge amount={PROFILE_COMPLETION_1_CREDITS} />
          </div>
        )}
        <h1 className="onboard-title">Complete your profile</h1>
        <p className="onboard-copy">
          {refreshPays
            ? `Tell us more about you — earn ${PROFILE_COMPLETION_1_CREDITS} Ruchi Credits again, same as the first time.`
            : isRefresh
            ? "Tell us more about you so we can keep matching you to relevant surveys."
            : `Tell us more about you — earn ${PROFILE_COMPLETION_1_CREDITS} Ruchi Credits, and we'll match you to more relevant surveys.`}
        </p>
        <DemographicsWizard mode={mode} onComplete={handleProfileComplete} />
      </div>
    </OnboardingShell>
  );
};

export default CompleteProfile;
