import React, { useState, useEffect, useLayoutEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { getPostLoginPath } from "../../utils/auth";
import { useAuth } from "../../context/AuthContext";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import GoogleOAuthHint from "../../components/auth/GoogleOAuthHint";
import GoogleSignInButton from "../../components/auth/GoogleSignInButton";
import { consumeIncompleteGoogleOAuthAttempt } from "../../utils/googleOAuth";
import OnboardingShell from "../../components/onboarding/OnboardingShell";
import { readAcquisition } from "../../utils/acquisition";
import { readVisitorId } from "../../utils/healthEvents";
import { digitsOnly, storeReferralCode } from "../../utils/referral";
import "../../components/onboarding/onboarding.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const formSchema = z
  .object({
    firstName: z.string().min(2, "First Name must be at least 2 characters").max(50),
    lastName: z.string().min(2, "Last Name must be at least 2 characters").max(50),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Za-z]/, "Password must include a letter")
      .regex(/\d/, "Password must include a number"),
    confirmPassword: z.string().min(1, "Confirm Password is required"),
    email: z.string().email("Invalid email address"),
    nationality: z.preprocess(
      (value) => (value === "" || value == null ? undefined : value),
      z.enum(["Nepali", "Other"]).optional()
    ),
    termsAccepted: z.literal(true, {
      errorMap: () => ({ message: "You must accept the terms, conditions, and privacy policy" }),
    }),
    promotionalEmails: z.boolean().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

const scrollRevealIntoView = (node) => {
  if (!node || !window.matchMedia("(max-width: 720px)").matches) return;
  const rect = node.getBoundingClientRect();
  const viewport = window.visualViewport;
  const offset = viewport?.offsetTop ?? 0;
  const height = viewport?.height ?? window.innerHeight;
  const top = rect.top - offset;
  const bottom = rect.bottom - offset;
  if (bottom > height - 16 || top < 16) {
    node.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
};

function FieldReveal({ open, children }) {
  const nodeRef = useRef(null);
  const innerRef = useRef(null);
  const wasOpen = useRef(open);

  useLayoutEffect(() => {
    const node = nodeRef.current;
    const inner = innerRef.current;
    if (!node || !inner) return;
    if (open) node.removeAttribute("inert");
    else node.setAttribute("inert", "");
    node.style.height = open ? `${inner.scrollHeight}px` : "0px";
  }, [open]);

  useEffect(() => {
    const node = nodeRef.current;
    const inner = innerRef.current;
    if (!node || !inner || !open) return undefined;
    const observer = new ResizeObserver(() => {
      const next = `${inner.scrollHeight}px`;
      if (node.style.height !== next) node.style.height = next;
    });
    observer.observe(inner);
    return () => observer.disconnect();
  }, [open]);

  useEffect(() => {
    if (!open || wasOpen.current) {
      wasOpen.current = open;
      return undefined;
    }
    wasOpen.current = open;
    const node = nodeRef.current;
    if (!node) return undefined;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      scrollRevealIntoView(node);
      return undefined;
    }
    const timer = window.setTimeout(() => scrollRevealIntoView(node), 480);
    return () => window.clearTimeout(timer);
  }, [open]);

  return (
    <div
      ref={nodeRef}
      className={`onboard-reveal${open ? " is-open" : ""}`}
      aria-hidden={open ? undefined : true}
      {...(!open ? { inert: "" } : {})}
    >
      <div className="onboard-reveal-inner" ref={innerRef}>
        <div className="onboard-reveal-stack">{children}</div>
      </div>
    </div>
  );
}

const Signup = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const codeFromUrl = digitsOnly(searchParams.get("ref"));
  const { user, loading: authLoading } = useAuth();
  const [signupError, setSignupError] = useState("");
  const [googleOAuthHint, setGoogleOAuthHint] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      navigate(getPostLoginPath(user), { replace: true });
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    const oauthError = searchParams.get("error");
    const bouncedBack = consumeIncompleteGoogleOAuthAttempt();
    if (oauthError === "google_auth_failed" || bouncedBack) {
      setGoogleOAuthHint(true);
    }
  }, [searchParams]);

  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm({
    resolver: zodResolver(formSchema),
    mode: "onBlur",
    reValidateMode: "onBlur",
    defaultValues: {
      termsAccepted: true,
      promotionalEmails: true,
    },
  });

  const termsAcceptedValue = watch("termsAccepted");
  const emailValue = watch("email") || "";
  const passwordValue = watch("password") || "";
  const confirmPasswordValue = watch("confirmPassword") || "";
  const showPasswords = emailValue.includes("@");
  const showNationality =
    showPasswords && passwordValue.length > 0 && passwordValue === confirmPasswordValue;

  useEffect(() => {
    if (codeFromUrl.length === 6) storeReferralCode(codeFromUrl);
  }, [codeFromUrl]);

  const onSubmit = async (data) => {
    setIsLoading(true);
    setSignupError("");

    const emailPrefix = data.email.split("@")[0];
    const safeUsername = emailPrefix.replace(/[^a-zA-Z0-9]/g, "").slice(0, 30).padEnd(3, "0");

    try {
      const acquisition = readAcquisition();
      const visitorId = readVisitorId();
      const payload = {
        username: safeUsername,
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        nationality: data.nationality || null,
        promotionalEmails: data.promotionalEmails === true,
        ...(acquisition ? { acquisition } : {}),
        ...(visitorId ? { visitorId } : {}),
      };

      const response = await axios.post(`${API_BASE_URL}/auth/register`, payload);
      const userEmail = response.data.data.user.email;
      toast.success("Registration successful! Please verify your email.");
      navigate(`/email-verification?email=${encodeURIComponent(userEmail)}`);
    } catch (err) {
      const errorData = err.response?.data;
      let errorMessage = "Registration failed. Please try again.";

      if (errorData?.errors) {
        errorMessage = errorData.errors.map((e) => e.msg).join(", ");
      } else if (errorData?.message) {
        errorMessage = errorData.message;
      }

      setSignupError(errorMessage);
      console.error("Signup failed:", err, errorData);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <OnboardingShell>
      <div className="onboard-card onboard-card--auth">
        <div className="onboard-auth-head">
          <h1 className="onboard-title onboard-title--signup">
            Ready to earn easy <span className="onboard-title-accent">rewards?</span>
          </h1>
          <p className="onboard-copy">First step is to create your eRuchi account.</p>
        </div>

        {googleOAuthHint && <GoogleOAuthHint />}
        <GoogleSignInButton />
        <div className="onboard-divider">
          <span>Or register with email</span>
        </div>

        <form className="onboard-form onboard-form--signup" onSubmit={handleSubmit(onSubmit)}>
          <div className="onboard-row">
            <div className={`onboard-field ${errors.firstName ? "is-error" : ""}`}>
              <label htmlFor="firstName">First name</label>
              <input id="firstName" type="text" placeholder="First name" autoComplete="given-name" {...register("firstName")} />
              {errors.firstName && <p className="onboard-error">{errors.firstName.message}</p>}
            </div>

            <div className={`onboard-field ${errors.lastName ? "is-error" : ""}`}>
              <label htmlFor="lastName">Last name</label>
              <input id="lastName" type="text" placeholder="Last name" autoComplete="family-name" {...register("lastName")} />
              {errors.lastName && <p className="onboard-error">{errors.lastName.message}</p>}
            </div>
          </div>

          <div className={`onboard-field ${errors.email ? "is-error" : ""}`}>
            <label htmlFor="email">Email address</label>
            <input id="email" type="email" placeholder="you@example.com" autoComplete="email" {...register("email")} />
            {errors.email && <p className="onboard-error">{errors.email.message}</p>}
          </div>

          <FieldReveal open={showPasswords}>
            <div className={`onboard-field ${errors.password ? "is-error" : ""}`}>
              <label htmlFor="password">Password</label>
              <div className="onboard-password-wrap">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  autoComplete="new-password"
                  tabIndex={showPasswords ? undefined : -1}
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="onboard-password-toggle"
                  tabIndex={showPasswords ? undefined : -1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && <p className="onboard-error">{errors.password.message}</p>}
            </div>

            <div className={`onboard-field ${errors.confirmPassword ? "is-error" : ""}`}>
              <label htmlFor="confirmPassword">Confirm password</label>
              <div className="onboard-password-wrap">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm password"
                  autoComplete="new-password"
                  tabIndex={showPasswords ? undefined : -1}
                  {...register("confirmPassword")}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="onboard-password-toggle"
                  tabIndex={showPasswords ? undefined : -1}
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="onboard-error">{errors.confirmPassword.message}</p>}
            </div>
          </FieldReveal>

          <FieldReveal open={showNationality}>
            <div className="onboard-field">
              <label htmlFor="nationality">Nationality</label>
              <select
                id="nationality"
                {...register("nationality")}
                defaultValue=""
                tabIndex={showNationality ? undefined : -1}
              >
                <option value="">Select nationality</option>
                <option value="Nepali">Nepali</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </FieldReveal>

          <div className="onboard-terms">
            <div className="onboard-terms-row">
              <input type="checkbox" id="termsAccepted" {...register("termsAccepted")} />
              <label htmlFor="termsAccepted">
                I agree to the{" "}
                <Link to="/terms" target="_blank" rel="noopener noreferrer">
                  Terms and Conditions
                </Link>{" "}
                &{" "}
                <Link to="/privacy-policy" target="_blank" rel="noopener noreferrer">
                  Privacy Policy
                </Link>
              </label>
            </div>
            {errors.termsAccepted && <p className="onboard-error">{errors.termsAccepted.message}</p>}
            <div className="onboard-terms-row">
              <input type="checkbox" id="promotionalEmails" {...register("promotionalEmails")} />
              <label htmlFor="promotionalEmails">
                I would like to receive promotional messages from eRuchi
              </label>
            </div>
          </div>

          <div className="onboard-links">
            <span />
            <Link to="/login">Already have an account?</Link>
          </div>

          {signupError && <p className="onboard-error">{signupError}</p>}

          <div className="onboard-actions">
            <button
              type="submit"
              className="home-pill home-pill-lg home-pill-navy"
              disabled={isLoading || !termsAcceptedValue}
            >
              {isLoading ? (
                <span className="inline-flex items-center">
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Loading...
                </span>
              ) : (
                "Register"
              )}
            </button>
          </div>
        </form>
      </div>
    </OnboardingShell>
  );
};

export default Signup;
