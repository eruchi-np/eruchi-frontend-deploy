import React, { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";
import OnboardingShell from "../components/onboarding/OnboardingShell";
import "../components/onboarding/onboarding.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const EmailVerificationPending = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const email = searchParams.get("email");
  const [isResending, setIsResending] = useState(false);

  if (!email) {
    navigate("/signup");
    return null;
  }

  const handleResend = async () => {
    setIsResending(true);
    try {
      await axios.post(`${API_BASE_URL}/auth/resend-verification`, { email });
      toast.success("Verification email resent successfully!");
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to resend verification email.";
      toast.error(errorMessage);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <OnboardingShell>
      <div className="onboard-card">
        <h1 className="onboard-title">Verify your email</h1>
        <p className="onboard-copy">
          We&apos;ve sent a verification email to <strong>{email}</strong>. Check your inbox (and
          spam folder) and click the link to verify your account.
        </p>
        <div className="onboard-actions">
          <button
            type="button"
            onClick={handleResend}
            disabled={isResending}
            className="home-pill home-pill-lg home-pill-navy"
          >
            {isResending ? (
              <span className="inline-flex items-center">
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Resending...
              </span>
            ) : (
              "Resend verification email"
            )}
          </button>
        </div>
        <p className="onboard-copy" style={{ marginTop: 24, marginBottom: 0 }}>
          Already verified? <Link to="/login">Login here</Link>
        </p>
      </div>
    </OnboardingShell>
  );
};

export default EmailVerificationPending;
