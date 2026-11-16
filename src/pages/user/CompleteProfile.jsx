import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import DemographicsWizard from "../../components/demographics/DemographicsWizard";
import OnboardingShell from "../../components/onboarding/OnboardingShell";
import CreditRewardBadge from "../../components/onboarding/CreditRewardBadge";
import { PROFILE_COMPLETION_1_CREDITS } from "../../utils/onboardingCredits";
import { PROFILE_REFRESH_BODY } from "../../utils/profileRefreshCopy";
import { useAuth } from "../../context/AuthContext";

const CompleteProfile = ({ mode = "registration" }) => {
  const isRefresh = mode === "refresh";
  const navigate = useNavigate();
  const { logout, user, refreshUser } = useAuth();
  const refreshPays = isRefresh && user?.profileOutdated;
  const [loggingOut, setLoggingOut] = useState(false);

  const handleProfileComplete = async () => {
    window.dispatchEvent(new Event("profileComplete"));
    await refreshUser();
    if (isRefresh) {
      navigate("/profile", { replace: true });
      return;
    }
    navigate("/standalone-surveys", { replace: true });
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

  return (
    <OnboardingShell onLogout={handleLogout} loggingOut={loggingOut}>
      <div className="onboard-card">
        {(!isRefresh || refreshPays) && (
          <div className="onboard-kicker">
            <CreditRewardBadge amount={PROFILE_COMPLETION_1_CREDITS} />
          </div>
        )}
        <h1 className="onboard-title">{isRefresh ? "Update your profile" : "Complete your profile"}</h1>
        <p className="onboard-copy">
          {refreshPays
            ? `${PROFILE_REFRESH_BODY} Your current answers are filled in. Confirm same or change each one, then submit to earn ${PROFILE_COMPLETION_1_CREDITS} Ruchi Credits.`
            : isRefresh
            ? "Your current answers are filled in. Confirm same or change each one, then submit."
            : `Tell us more about you — earn ${PROFILE_COMPLETION_1_CREDITS} Ruchi Credits, and we'll match you to more relevant surveys.`}
        </p>
        <DemographicsWizard mode={mode} onComplete={handleProfileComplete} />
      </div>
    </OnboardingShell>
  );
};

export default CompleteProfile;
