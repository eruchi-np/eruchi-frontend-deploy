import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import toast, { Toaster } from 'react-hot-toast';
import { isAuthenticated, redirectToProfile } from "../utils/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { Loader2 } from 'lucide-react';
import Cookies from "js-cookie";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Schema for login form validation
const loginSchema = z.object({
  username: z
    .string()
    .min(1, "Username or Email is required")
    .max(50, "Username or Email must be less than 50 characters"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(50, "Password must be less than 50 characters"),
});

const Login = () => {
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [attemptedEmail, setAttemptedEmail] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false); // Prevents loop

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    // Skip if already in redirect process
    if (isRedirecting) return;

    const checkAuthAndRedirect = async () => {
      // Logout lock check
      const logoutLock = localStorage.getItem('logout_lock');
      if (logoutLock) {
        const timestamp = parseInt(logoutLock, 10);
        if (Date.now() - timestamp < 15 * 60 * 1000) {
          console.log('[Login] Skipping auth check - recent logout lock active');
          return;
        }
        localStorage.removeItem('logout_lock');
      }

      console.log('[Login] Checking authentication...');

      try {
        const isAuth = await isAuthenticated();
        if (isAuth) {
          console.log('[Login] Already authenticated → redirecting');
          toast.error("You're already logged in!");
          setIsRedirecting(true);

          // Hard redirect helps in production with cookie timing issues
          setTimeout(() => {
            window.location.href = '/'; // ← change to '/dashboard' or '/profile' if that's your target
          }, 700);
        }
      } catch (err) {
        console.warn('[Login] Auth check failed (likely transient):', err?.message);
        // Do not redirect on failure – stay on login page
      }
    };

    checkAuthAndRedirect();
  }, [isRedirecting]);

  const onSubmit = async (data) => {
    setIsLoading(true);
    setNeedsVerification(false);
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

      if (!userData) {
        throw new Error('Invalid login response - no user data received');
      }

      localStorage.setItem('email', userData.email);
      localStorage.setItem('username', `${userData.firstName} ${userData.lastName}`);
      localStorage.setItem('user_id', userData.id);
      localStorage.setItem('auth_method', 'cookie');

      window.dispatchEvent(new Event('authChange'));

      await new Promise(resolve => setTimeout(resolve, 400));

      if (!userData.isProfileComplete) {
        toast.success("Welcome back! Please complete your profile to continue.");
        navigate('/complete-profile');
      } else {
        toast.success("Login successful! Welcome back!");
        // Hard redirect after success – helps stabilize in prod
        window.location.href = '/';
      }

    } catch (error) {
      console.error('Login failed:', error);

      let errorMessage =
        error.response?.data?.message ||
        error.response?.data?.errors?.[0]?.msg ||
        'Login failed. Please check your email and password.';

      if (errorMessage.toLowerCase().includes('verify your email')) {
        setNeedsVerification(true);
        toast.error("Please verify your email to continue.");
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    try {
      await axios.post(
        `${API_BASE_URL}/auth/resend-verification`,
        { email: attemptedEmail },
        { withCredentials: true }
      );
      toast.success('Verification email resent! Check your inbox.');
    } catch (error) {
      toast.error('Failed to resend verification email. Try again later.');
    } finally {
      setIsResending(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${API_BASE_URL}/auth/google`;
  };

  return (
    <>
      <section className="py-20 bg-white text-black">
        <div className="flex justify-center items-center">
          <div className="flex w-full rounded-lg lg:w-[600px] mx-5 space-y-12 flex-wrap flex-col">
            <h1 className="text-[40px] lg:text-4xl font-bold leading-tight">
              Welcome Back!
              <br />
              <span className="text-[38px] lg:text-4xl font-bold text-black">
                Please sign in to continue
              </span>
            </h1>

            {localStorage.getItem('logout_lock') && (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-5 mb-6 rounded-r-lg">
                <p className="text-yellow-800 font-bold text-lg mb-2">
                  You have been logged out.
                </p>
                <p className="text-yellow-700">
                  For full session termination (especially on shared devices), 
                  please <strong>close all open browser tabs and windows</strong>.
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full p-4 font-bold text-lg rounded-2xl border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all duration-200 flex items-center justify-center gap-3"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500 font-medium">Or continue with email</span>
              </div>
            </div>

            <form className="grid grid-cols-1 space-y-7" onSubmit={handleSubmit(onSubmit)}>
              <div className="grid grid-cols-1 space-y-6">
                <div>
                  <input
                    type="text"
                    placeholder="Username/Email Address"
                    {...register("username")}
                    className={`w-full text-lg font-medium outline-none p-4 border-b-2 bg-transparent transition-all duration-200 placeholder:text-gray-400 ${
                      errors.username ? "border-red-500" : "border-gray-300 focus:border-black"
                    }`}
                  />
                  {errors.username && (
                    <p className="text-sm text-red-500 mt-2 font-medium">{errors.username.message}</p>
                  )}
                </div>

                <div>
                  <input
                    type="password"
                    placeholder="Password"
                    {...register("password")}
                    className={`w-full outline-none text-lg font-medium p-4 border-b-2 bg-transparent transition-all duration-200 placeholder:text-gray-400 ${
                      errors.password ? "border-red-500" : "border-gray-300 focus:border-black"
                    }`}
                  />
                  {errors.password && (
                    <p className="text-sm text-red-500 mt-2 font-medium">{errors.password.message}</p>
                  )}
                </div>
              </div>

              {needsVerification && (
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <p className="text-yellow-700 mb-2">Please verify your email to login.</p>
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={isResending}
                    className={`w-full py-2 px-4 rounded-lg font-medium transition-all ${
                      isResending ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {isResending ? (
                      <div className="flex items-center justify-center">
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Resending...
                      </div>
                    ) : (
                      'Resend Verification Email'
                    )}
                  </button>
                </div>
              )}

              <div className="w-full flex justify-between text-gray-600 flex-wrap gap-2">
                <Link
                  to="/reset-password"
                  className="font-semibold hover:text-black transition-colors duration-200 underline decoration-gray-400 hover:decoration-black"
                >
                  Forgot password?
                </Link>
                <Link
                  to="/signup"
                  className="font-semibold hover:text-black transition-colors duration-200 underline decoration-gray-400 hover:decoration-black"
                >
                  Don't have an account?
                </Link>
              </div>

              <button
                type="submit"
                className={`w-full mt-4 p-4 font-bold text-lg rounded-2xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-all duration-200 ${
                  isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-black hover:bg-gray-800 hover:shadow-lg transform hover:scale-[1.02]'
                } text-white`}
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex justify-center items-center">
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Loading...
                  </div>
                ) : (
                  'Login'
                )}
              </button>
            </form>
          </div>
          <Toaster />
        </div>
      </section>
    </>
  );
};

export default Login;