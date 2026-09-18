import React from "react";
import { BASIC_DETAILS_CREDITS } from "../../utils/onboardingCredits";

export default function CreditRewardBadge({ amount = BASIC_DETAILS_CREDITS, className = "" }) {
  return (
    <span className={`credit-reward-badge ${className}`.trim()}>
      +{amount} Ruchi Credits
    </span>
  );
}
