import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import OnboardingShell from "../components/onboarding/OnboardingShell";
import CreditRewardBadge from "../components/onboarding/CreditRewardBadge";
import { BASIC_DETAILS_CREDITS } from "../utils/onboardingCredits";
import { formatNepalPhone, phoneFormatError } from "../utils/phoneFormat";
import { trackOnboardingError, trackOnboardingSubmit, trackOnboardingView } from "../utils/healthEvents";
import { getPostLoginPath } from "../utils/auth";
import { clearStoredReferralCode, digitsOnly, readStoredReferralCode, storeReferralCode } from "../utils/referral";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const schema = z.object({
  phone: z.string().superRefine((value, ctx) => {
    const message = phoneFormatError(value);
    if (message) ctx.addIssue({ code: z.ZodIssueCode.custom, message });
  }),
  dateOfBirth: z
    .string()
    .min(1, "Date of birth is required")
    .refine((val) => {
      const birth = new Date(val);
      if (Number.isNaN(birth.getTime())) return false;
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age -= 1;
      return age >= 13;
    }, "You must be at least 13 years old"),
  gender: z
    .string()
    .min(1, "Please select your gender")
    .refine(
      (value) => ["Male", "Female", "Other", "Prefer not to say"].includes(value),
      "Please select your gender"
    ),
});

const CompleteBasicInfo = () => {
  const { user, refreshUser, loading: authLoading, logout } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);
  const storedReferral = readStoredReferralCode();
  const [hasReferral, setHasReferral] = useState(storedReferral ? "yes" : "no");
  const [referralCode, setReferralCode] = useState(storedReferral);
  const canEnterReferral = !user?.referralStatus;

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(schema),
    mode: "onBlur",
    reValidateMode: "onBlur",
    defaultValues: {
      phone: formatNepalPhone(user?.phone || ""),
      dateOfBirth: user?.dateOfBirth
        ? new Date(user.dateOfBirth).toISOString().split("T")[0]
        : "",
      gender: user?.gender || "",
    },
  });

  useEffect(() => {
    if (authLoading || !user) return;
    trackOnboardingView("step2");
  }, [authLoading, user]);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      navigate("/login", { replace: true });
      return;
    }

    if (user?.isRegistrationComplete) {
      navigate(getPostLoginPath(user), { replace: true });
    }

    reset({
      phone: formatNepalPhone(user?.phone || ""),
      dateOfBirth: user?.dateOfBirth
        ? new Date(user.dateOfBirth).toISOString().split("T")[0]
        : "",
      gender: user?.gender || "",
    });
  }, [user, authLoading, navigate, reset]);

  const onSubmit = async (data) => {
    setSubmitting(true);
    setSubmitError("");

    if (!user) {
      setSubmitError("Authentication required. Redirecting to login...");
      navigate("/login", { replace: true });
      setSubmitting(false);
      return;
    }

    const enteredCode = digitsOnly(referralCode);
    if (canEnterReferral && hasReferral === "yes" && enteredCode.length !== 6) {
      setSubmitError("Enter the 6-digit referral code.");
      setSubmitting(false);
      return;
    }

    try {
      await axios.put(
        `${API_BASE_URL}/users/me/basic-profile`,
        {
          phone: data.phone.trim(),
          dateOfBirth: data.dateOfBirth,
          gender: data.gender,
          ...(canEnterReferral && hasReferral === "yes" ? { referralCode: enteredCode } : {}),
        },
        { withCredentials: true }
      );
      clearStoredReferralCode();

      toast.success(`Saved — ${BASIC_DETAILS_CREDITS} Ruchi Credits added.`);
      trackOnboardingSubmit("step2");
      await refreshUser();
      navigate("/complete-profile", { replace: true });
    } catch (err) {
      console.error("[ERROR] Failed to update basic profile:", err);

      if (err.response?.status === 401) {
        setSubmitError("Session expired. Please log in again.");
        localStorage.removeItem("access_token");
        localStorage.removeItem("auth_method");
        navigate("/login", { replace: true });
      } else {
        setSubmitError(
          err.response?.data?.message ||
            err.response?.data?.errors?.[0]?.msg ||
            "Could not save your information. Please try again."
        );
      }
    } finally {
      setSubmitting(false);
    }
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

  if (authLoading) {
    return (
      <OnboardingShell footer={false}>
        <div className="min-h-[40vh] flex items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-[var(--navy)]" />
        </div>
      </OnboardingShell>
    );
  }

  return (
    <OnboardingShell onLogout={handleLogout} loggingOut={loggingOut || submitting}>
      <div className="onboard-card">
        <div className="onboard-kicker">
          <CreditRewardBadge amount={BASIC_DETAILS_CREDITS} />
        </div>
        <h1 className="onboard-title">Just a few more details</h1>
        <p className="onboard-copy">
          Add a few more details and we&apos;ll add {BASIC_DETAILS_CREDITS} Ruchi Credits to your
          account.
        </p>

        <form
          className="onboard-form"
          onSubmit={handleSubmit(onSubmit, (formErrors) => {
            Object.keys(formErrors).forEach((field) => trackOnboardingError("step2", field));
          })}
        >
          <div className={`onboard-field ${errors.phone ? "is-error" : ""}`}>
            <label htmlFor="phone">Phone number</label>
            <Controller
              name="phone"
              control={control}
              render={({ field }) => (
                <input
                  id="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="98XXXXXXXX"
                  value={field.value}
                  onChange={(event) => field.onChange(formatNepalPhone(event.target.value))}
                  onBlur={field.onBlur}
                  ref={field.ref}
                />
              )}
            />
            {errors.phone && <p className="onboard-error">{errors.phone.message}</p>}
          </div>

          <div className={`onboard-field ${errors.dateOfBirth ? "is-error" : ""}`}>
            <label htmlFor="dateOfBirth">Date of birth</label>
            <input id="dateOfBirth" type="date" {...register("dateOfBirth")} />
            {errors.dateOfBirth && <p className="onboard-error">{errors.dateOfBirth.message}</p>}
          </div>

          <div className={`onboard-field ${errors.gender ? "is-error" : ""}`}>
            <label htmlFor="gender">Gender</label>
            <select id="gender" {...register("gender")} defaultValue="">
              <option value="" disabled>
                Select gender
              </option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
              <option value="Prefer not to say">Prefer not to say</option>
            </select>
            {errors.gender && <p className="onboard-error">{errors.gender.message}</p>}
          </div>

          {canEnterReferral && (
            <div className="onboard-field">
              <label>Do you have a referral code?</label>
              <div className="onboard-tabs" role="group" aria-label="Do you have a referral code?">
                <button
                  type="button"
                  className={`onboard-tab ${hasReferral === "no" ? "is-on" : ""}`}
                  onClick={() => {
                    setHasReferral("no");
                    clearStoredReferralCode();
                  }}
                >
                  No
                </button>
                <button
                  type="button"
                  className={`onboard-tab ${hasReferral === "yes" ? "is-on" : ""}`}
                  onClick={() => setHasReferral("yes")}
                >
                  Yes
                </button>
              </div>
            </div>
          )}

          {canEnterReferral && hasReferral === "yes" && (
            <div className={`onboard-field ${submitError && digitsOnly(referralCode).length !== 6 ? "is-error" : ""}`}>
              <label htmlFor="referralCode">Referral code</label>
              <input
                id="referralCode"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                maxLength={6}
                placeholder="6-digit code"
                value={referralCode}
                onChange={(event) => {
                  const next = digitsOnly(event.target.value);
                  setReferralCode(next);
                  storeReferralCode(next);
                }}
              />
              <p className="onboard-hint">You get 10 extra credits with this code.</p>
            </div>
          )}

          {submitError && <p className="onboard-error">{submitError}</p>}

          <div className="onboard-actions">
            <button
              type="submit"
              className="home-pill home-pill-lg home-pill-navy"
              disabled={submitting}
            >
              {submitting ? (
                <span className="inline-flex items-center">
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Saving...
                </span>
              ) : (
                "Save & Continue"
              )}
            </button>
          </div>
        </form>
      </div>
    </OnboardingShell>
  );
};

export default CompleteBasicInfo;
