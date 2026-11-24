import React from "react";
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
  const { user, refreshUser } = useAuth();
  const refreshPays = isRefresh && user?.profileOutdated;

  const handleProfileComplete = async () => {
    window.dispatchEvent(new Event("profileComplete"));
    await refreshUser();
    if (isRefresh) {
      navigate("/profile", { replace: true });
      return;
    }
    navigate("/standalone-surveys", { replace: true });
  };

  return (
    <OnboardingShell footer={false}>
      <div className="onboard-card">
        {(!isRefresh || refreshPays) && (
          <div className="onboard-kicker">
            <CreditRewardBadge amount={PROFILE_COMPLETION_1_CREDITS} />
          </div>
        )}
        {isRefresh && (
          <>
            <h1 className="onboard-title">Update your profile</h1>
            <p className="onboard-copy">
              {refreshPays
                ? `${PROFILE_REFRESH_BODY} Your current answers are filled in. Confirm same or change each one, then submit to earn ${PROFILE_COMPLETION_1_CREDITS} Ruchi Credits.`
                : "Your current answers are filled in. Confirm same or change each one, then submit."}
            </p>
          </>
        )}
        <DemographicsWizard mode={mode} onComplete={handleProfileComplete} />
      </div>
    </OnboardingShell>
  );
};

export default CompleteProfile;
