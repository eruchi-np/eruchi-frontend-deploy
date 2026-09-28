import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getOnboardingRedirectPath } from "../../utils/onboardingGate";

const OnboardingGate = () => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading || !user) return null;
  if (typeof window !== "undefined" && localStorage.getItem("is_business") === "true") {
    return null;
  }

  const to = getOnboardingRedirectPath(user, location.pathname);
  if (!to) return null;

  return <Navigate to={to} replace />;
};

export default OnboardingGate;
