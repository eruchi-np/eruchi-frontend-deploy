import React from "react";
import { useNavigate } from "react-router-dom";
import AdditionalProfileSurvey from "../components/demographics/AdditionalProfileSurvey";
import OnboardingShell from "../components/onboarding/OnboardingShell";
import CreditRewardBadge from "../components/onboarding/CreditRewardBadge";
import { PROFILE_COMPLETION_2_CREDITS, PROFILE_COMPLETION_2_QUESTION_COUNT } from "../utils/onboardingCredits";

const CompleteAdditionalProfile = () => {
  const navigate = useNavigate();

  const handleComplete = () => {
    navigate("/");
  };

  return (
    <OnboardingShell>
      <div className="onboard-card">
        <div className="onboard-kicker">
          <CreditRewardBadge amount={PROFILE_COMPLETION_2_CREDITS} />
        </div>
        <h1 className="onboard-title">A few more questions</h1>
        <p className="onboard-copy">
          Earn {PROFILE_COMPLETION_2_CREDITS} Ruchi Credits — {PROFILE_COMPLETION_2_QUESTION_COUNT}{" "}
          quick questions about your daily life. Takes about 2 minutes.
        </p>
        <AdditionalProfileSurvey onComplete={handleComplete} />
      </div>
    </OnboardingShell>
  );
};

export default CompleteAdditionalProfile;
