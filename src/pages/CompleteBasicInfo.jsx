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
  const { user, refreshUser, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

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
    if (authLoading) return;

    if (!user) {
      navigate("/login", { replace: true });
      return;
    }

    if (user?.isRegistrationComplete) {
      if (user.isProfileComplete) {
        navigate("/", { replace: true });
      } else {
        navigate("/complete-profile", { replace: true });
      }
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

    try {
      await axios.put(
        `${API_BASE_URL}/users/me/basic-profile`,
        {
          phone: data.phone.trim(),
          dateOfBirth: data.dateOfBirth,
          gender: data.gender,
        },
        { withCredentials: true }
      );

      toast.success(`Saved — ${BASIC_DETAILS_CREDITS} Ruchi Credits added.`);
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
    <OnboardingShell>
      <div className="onboard-card">
        <div className="onboard-kicker">
          <CreditRewardBadge amount={BASIC_DETAILS_CREDITS} />
        </div>
        <h1 className="onboard-title">Just a few more details</h1>
        <p className="onboard-copy">
          Add a few more details and we&apos;ll add {BASIC_DETAILS_CREDITS} Ruchi Credits to your
          account.
        </p>

        <form className="onboard-form" onSubmit={handleSubmit(onSubmit)}>
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
