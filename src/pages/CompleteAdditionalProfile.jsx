import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import AdditionalProfileSurvey from "../components/demographics/AdditionalProfileSurvey";
import OnboardingShell from "../components/onboarding/OnboardingShell";
import CreditRewardBadge from "../components/onboarding/CreditRewardBadge";
import { PROFILE_COMPLETION_2_CREDITS, PROFILE_COMPLETION_2_QUESTION_COUNT } from "../utils/onboardingCredits";
import { useAuth } from "../context/AuthContext";

const CompleteAdditionalProfile = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleComplete = () => {
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

export default CompleteAdditionalProfile;
