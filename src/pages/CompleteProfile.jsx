import React, { useState } from "react";
import DemographicsWizard from "../components/demographics/DemographicsWizard";
import WelcomeToERuchi from "../components/demographics/steps/WelcomeToERuchi";
import OnboardingShell from "../components/onboarding/OnboardingShell";
import CreditRewardBadge from "../components/onboarding/CreditRewardBadge";
import { PROFILE_COMPLETION_1_CREDITS } from "../utils/onboardingCredits";

const CompleteProfile = () => {
  const [profileCompleted, setProfileCompleted] = useState(false);

  const handleProfileComplete = () => {
    window.dispatchEvent(new Event("profileComplete"));
    setProfileCompleted(true);
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
      </div>
    </OnboardingShell>
  );
};

export default CompleteProfile;
