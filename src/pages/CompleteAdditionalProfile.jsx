import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AdditionalProfileSurvey from "../components/demographics/AdditionalProfileSurvey";
import OnboardingShell from "../components/onboarding/OnboardingShell";
import CreditRewardBadge from "../components/onboarding/CreditRewardBadge";
import { PROFILE_COMPLETION_2_CREDITS, PROFILE_COMPLETION_2_QUESTION_COUNT } from "../utils/onboardingCredits";
import { useAuth } from "../context/AuthContext";

const CompleteAdditionalProfile = ({ mode = "registration" }) => {
  const isRefresh = mode === "refresh";
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();
  const justSavedDemographics = location.state?.demographicsSaved === true;
  const refreshPays = isRefresh && (justSavedDemographics || user?.profileRefreshDemographicsDone === true);
  const sendToDemographics = isRefresh
    && !justSavedDemographics
    && !!user?.profileOutdated
    && user?.profileRefreshDemographicsDone === false;
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    if (sendToDemographics) navigate("/refresh-profile", { replace: true });
  }, [sendToDemographics, navigate]);

  const handleComplete = () => {
    if (isRefresh) {
      window.dispatchEvent(new Event("profileComplete"));
      navigate("/profile", { replace: true });
      return;
    }
    navigate("/");
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

  if (sendToDemographics) return null;

  return (
    <OnboardingShell onLogout={handleLogout} loggingOut={loggingOut}>
      <div className="onboard-card">
        {(!isRefresh || refreshPays) && (
          <div className="onboard-kicker">
            <CreditRewardBadge amount={PROFILE_COMPLETION_2_CREDITS} />
          </div>
        )}
        <h1 className="onboard-title">A few more questions</h1>
        <p className="onboard-copy">
          {refreshPays
            ? `Earn ${PROFILE_COMPLETION_2_CREDITS} Ruchi Credits again — ${PROFILE_COMPLETION_2_QUESTION_COUNT} quick questions about your daily life. Takes about 2 minutes.`
            : isRefresh
            ? `${PROFILE_COMPLETION_2_QUESTION_COUNT} quick questions about your daily life. Takes about 2 minutes.`
            : `Earn ${PROFILE_COMPLETION_2_CREDITS} Ruchi Credits — ${PROFILE_COMPLETION_2_QUESTION_COUNT} quick questions about your daily life. Takes about 2 minutes.`}
        </p>
        <AdditionalProfileSurvey mode={mode} onComplete={handleComplete} />
      </div>
    </OnboardingShell>
  );
};

export default CompleteAdditionalProfile;
