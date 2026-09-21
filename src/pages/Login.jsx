import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import toast from "react-hot-toast";
import { getPostLoginPath, persistAuthSession } from "../utils/auth";
import { useAuth } from "../context/AuthContext";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { businessAPI } from "../services/api";
import GoogleOAuthHint from "../components/auth/GoogleOAuthHint";
import GoogleSignInButton from "../components/auth/GoogleSignInButton";
import { consumeIncompleteGoogleOAuthAttempt } from "../utils/googleOAuth";
import OnboardingShell from "../components/onboarding/OnboardingShell";
import { parseStep } from "../utils/onboardingSchemas";
import "../components/onboarding/onboarding.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const loginSchema = z.object({
  username: z
    .string()
    .min(1, "Username or Email is required")
    .max(254, "Username or Email must be less than 254 characters"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(50, "Password must be less than 50 characters"),
});

const businessLoginSchema = z.object({
  email: z.string().trim().email("Enter a valid business email"),
  password: z.string().min(1, "Password is required"),
});

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("user");
  const [loginError, setLoginError] = useState("");
  const [googleOAuthHint, setGoogleOAuthHint] = useState(false);

  useEffect(() => {
    const oauthError = searchParams.get("error");
    const bouncedBack = consumeIncompleteGoogleOAuthAttempt();
    if (oauthError === "google_auth_failed" || bouncedBack) {
      setGoogleOAuthHint(true);
    } else if (oauthError) {
      setLoginError("Sign-in failed. Please try again.");
    }
  }, [searchParams]);

  useEffect(() => {
    if (localStorage.getItem("is_business") === "true") {
      navigate("/business/dashboard", { replace: true });
      return;
    }
    if (!authLoading && user) {
      navigate(getPostLoginPath(user), { replace: true });
    }
  }, [navigate, user, authLoading]);

  const [isLoading, setIsLoading] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [attemptedEmail, setAttemptedEmail] = useState("");
  const [isResending, setIsResending] = useState(false);
  const [resendError, setResendError] = useState("");

  const [bizEmail, setBizEmail] = useState("");
  const [bizPassword, setBizPassword] = useState("");
  const [bizLoading, setBizLoading] = useState(false);
  const [bizError, setBizError] = useState("");
  const [bizFieldErrors, setBizFieldErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showBizPassword, setShowBizPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    mode: "onBlur",
    reValidateMode: "onBlur",
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    setNeedsVerification(false);
    setLoginError("");
    setAttemptedEmail(data.username);

    try {
      const response = await axios.post(
        `${API_BASE_URL}/auth/login`,
        {
          email: data.username,
          password: data.password,
        },
        { withCredentials: true }
      );

      const userData = response?.data?.data?.user;

      persistAuthSession(userData);
      toast.success("Login successful!");
      navigate(getPostLoginPath(userData), { replace: true });
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.errors?.[0]?.msg ||
        "Login failed. Please check your email and password.";

      if (errorMessage.includes("verify your email")) {
        setNeedsVerification(true);
      } else {
        setLoginError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    setResendError("");
    try {
      await axios.post(`${API_BASE_URL}/auth/resend-verification`, { email: attemptedEmail });
      toast.success("Verification email resent!");
    } catch (error) {
      setResendError(error.response?.data?.message || "Failed to resend verification email.");
    } finally {
      setIsResending(false);
    }
  };

  const handleBusinessLogin = async (e) => {
    e.preventDefault();
    const fieldErrors = parseStep(businessLoginSchema, {
      email: bizEmail,
      password: bizPassword,
    });
    if (Object.keys(fieldErrors).length) {
      setBizFieldErrors(fieldErrors);
      setBizError("");
      return;
    }

    setBizFieldErrors({});
    setBizError("");
    setBizLoading(true);
    try {
      const response = await businessAPI.login(
        { email: bizEmail, password: bizPassword },
        { skipErrorToast: true, skipAuthRedirect: true }
      );

      localStorage.setItem("is_business", "true");
      localStorage.setItem("business_name", response.data.business.name);
      window.dispatchEvent(new Event("authChange"));

      navigate("/business/dashboard");
    } catch (err) {
      setBizError(err.response?.data?.message || "Invalid credentials");
    } finally {
      setBizLoading(false);
    }
  };

  return (
    <OnboardingShell>
      <div className="onboard-card">
        <h1 className="onboard-title">Please sign in to continue</h1>
        <p className="onboard-copy">Use your personal account or a business login.</p>

        <div className="onboard-tabs">
          <button
            type="button"
            onClick={() => setActiveTab("user")}
            className={`onboard-tab ${activeTab === "user" ? "is-on" : ""}`}
          >
            Personal
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("business")}
            className={`onboard-tab ${activeTab === "business" ? "is-on" : ""}`}
          >
            Business
          </button>
        </div>

        {activeTab === "user" && (
          <>
            {googleOAuthHint && <GoogleOAuthHint />}
            <GoogleSignInButton
              className="mt-4"
              onSuccess={(userData) => {
                toast.success("Login successful!");
                navigate(getPostLoginPath(userData), { replace: true });
              }}
              onError={() => setGoogleOAuthHint(true)}
            />

            <div className="onboard-divider">
              <span>Or continue with email</span>
            </div>

            <form className="onboard-form" onSubmit={handleSubmit(onSubmit)}>
              <div className={`onboard-field ${errors.username ? "is-error" : ""}`}>
                <label htmlFor="username">Username or email</label>
                <input
                  id="username"
                  type="text"
                  placeholder="you@example.com"
                  autoComplete="username"
                  {...register("username")}
                />
                {errors.username && <p className="onboard-error">{errors.username.message}</p>}
              </div>

              <div className={`onboard-field ${errors.password ? "is-error" : ""}`}>
                <label htmlFor="password">Password</label>
                <div className="onboard-password-wrap">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    autoComplete="current-password"
                    {...register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="onboard-password-toggle"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && <p className="onboard-error">{errors.password.message}</p>}
              </div>

              {loginError && <p className="onboard-error">{loginError}</p>}

              {needsVerification && (
                <div className="onboard-verify">
                  <p className="mb-3">Please verify your email to login.</p>
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={isResending}
                    className="home-pill home-pill-sm home-pill-navy"
                  >
                    {isResending ? (
                      <span className="inline-flex items-center">
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Resending...
                      </span>
                    ) : (
                      "Resend Verification Email"
                    )}
                  </button>
                  {resendError && <p className="onboard-error">{resendError}</p>}
                </div>
              )}

              <div className="onboard-links">
                <Link to="/reset-password">Forgot password?</Link>
                <Link to="/signup">Don&apos;t have an account?</Link>
              </div>

              <div className="onboard-actions">
                <button
                  type="submit"
                  className="home-pill home-pill-lg home-pill-navy"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="inline-flex items-center">
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Loading...
                    </span>
                  ) : (
                    "Login"
                  )}
                </button>
              </div>
            </form>
          </>
        )}

        {activeTab === "business" && (
          <form className="onboard-form" onSubmit={handleBusinessLogin}>
            <div className={`onboard-field ${bizFieldErrors.email ? "is-error" : ""}`}>
              <label htmlFor="bizEmail">Business email</label>
              <input
                id="bizEmail"
                type="email"
                placeholder="business@example.com"
                value={bizEmail}
                onChange={(e) => {
                  setBizEmail(e.target.value);
                  setBizFieldErrors((prev) => ({ ...prev, email: "" }));
                }}
              />
              {bizFieldErrors.email && <p className="onboard-error">{bizFieldErrors.email}</p>}
            </div>

            <div className={`onboard-field ${bizFieldErrors.password ? "is-error" : ""}`}>
              <label htmlFor="bizPassword">Password</label>
              <div className="onboard-password-wrap">
                <input
                  id="bizPassword"
                  type={showBizPassword ? "text" : "password"}
                  placeholder="Password"
                  value={bizPassword}
                  onChange={(e) => {
                    setBizPassword(e.target.value);
                    setBizFieldErrors((prev) => ({ ...prev, password: "" }));
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowBizPassword((prev) => !prev)}
                  className="onboard-password-toggle"
                  aria-label={showBizPassword ? "Hide password" : "Show password"}
                >
                  {showBizPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {bizFieldErrors.password && <p className="onboard-error">{bizFieldErrors.password}</p>}
            </div>

            {bizError && (
              <p className="onboard-error">
                {bizError === "Account pending admin approval"
                  ? "Your account is pending admin approval. Please contact support."
                  : bizError}
              </p>
            )}

            <div className="onboard-actions">
              <button
                type="submit"
                className="home-pill home-pill-lg home-pill-navy"
                disabled={bizLoading}
              >
                {bizLoading ? (
                  <span className="inline-flex items-center">
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Loading...
                  </span>
                ) : (
                  "Login"
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </OnboardingShell>
  );
};

export default Login;
