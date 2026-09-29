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
  const { logout } = useAuth();
  const [profileCompleted, setProfileCompleted] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleProfileComplete = () => {
    window.dispatchEvent(new Event("profileComplete"));
    if (isRefresh) {
      navigate("/refresh-additional-profile", { replace: true });
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
        {!isRefresh && (
          <div className="onboard-kicker">
            <CreditRewardBadge amount={PROFILE_COMPLETION_1_CREDITS} />
          </div>
        )}
        <h1 className="onboard-title">Complete your profile</h1>
        <p className="onboard-copy">
          {isRefresh
            ? "Tell us more about you so we can keep matching you to relevant surveys."
            : `Tell us more about you — earn ${PROFILE_COMPLETION_1_CREDITS} Ruchi Credits, and we'll match you to more relevant surveys.`}
        </p>
        <DemographicsWizard mode={mode} onComplete={handleProfileComplete} />
      </div>
    </OnboardingShell>
  );
};

export default CompleteProfile;
