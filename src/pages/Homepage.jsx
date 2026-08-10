import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import SurveyButton from "../components/widgets/SurveyButton";
import { ArrowRight, ArrowUpRight, Mail, Loader2, FileText, Award, Calendar, CheckSquare, AlertCircle } from "lucide-react";
import AnimatedContent from "../components/animations/AnimatedContent";
import { trackEvent } from "../utils/analytics";
import { userAPI, sepSurveyAPI } from "../services/api";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

import heroBg from "../assets/eruchi-home-bg.webp";

import ujamaa from "../assets/logo-placeholder.png";
import himalayanHoney from "../assets/himalayan-honey.png";
import grannyDelicacies from "../assets/grannys-delicacies.png";
import dalucha from "../assets/dalucha.png";
import ascend from "../assets/ascend.png";
import logoPlaceholder from "../assets/logo-placeholder.png";
import mamba from "../assets/mamba.png";

import vendorPoster1 from "../assets/poster-1.webp";
import vendorPoster2 from "../assets/poster-2.webp";
import vendorPoster3 from "../assets/poster-3.webp";

const HERO_BG = heroBg;

const PARTNER_LOGOS = [
  { name: "Ascend Climbing Gym", logo: ujamaa },
  { name: "Himalayan Java", logo: himalayanHoney },
  { name: "Wound & Catheter Care", logo: ascend },
  { name: "Chronic-Condition Monitoring", logo: grannyDelicacies },
  { name: "Chronic-Condition Monitoring", logo: dalucha },
  { name: "Chronic-Condition Monitoring", logo: mamba },
];

const VENDOR_POSTERS = [
  { image: vendorPoster1, alt: "Vendor poster 1" },
  { image: vendorPoster2, alt: "Vendor poster 2" },
  { image: vendorPoster3, alt: "Vendor poster 3" },
];

const HOW_IT_WORKS = [
  {
    number: "01",
    title: "Register Now",
    description: "Sign up and tell us a littlle about yourself.",
  },
  {
    number: "02",
    title: "Earn Credits",
    description: "Fill out short surveys and earn Ruchi Credits.",
  },
  {
    number: "03",
    title: "Get Rewards",
    description: "Explore our Rewards page and get easy, local discounts.",
  },
];

// UPDATED: Font size dynamically scales from 32px on small viewports up to 58px on desktops
const headingStyle = {
  fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
  fontSize: "clamp(32px, 5vw, 58px)",
  fontWeight: 500,
  lineHeight: 1.1,
};

export default function Homepage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(true);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [posterIndex, setPosterIndex] = useState(0);
  const [credits, setCredits] = useState(0);
  const [surveys, setSurveys] = useState([]);
  const [surveysLoading, setSurveysLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const sync = () => {
      const token = localStorage.getItem("access_token");
      const stored = localStorage.getItem("username");
      setIsLoggedIn(!!(token && stored));
      setUsername(stored || "");
    };

    sync();
    setLoading(false);
    trackEvent('page_view', '/');

    window.addEventListener("authChange", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("authChange", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  // Auto-advance the vendor poster carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setPosterIndex((prev) => (prev + 1) % VENDOR_POSTERS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Fetch credits + available surveys once the user is logged in
  useEffect(() => {
    if (!isLoggedIn) return;

    (async () => {
      try {
        const res = await userAPI.getProfile();
        const userData = res?.data?.data?.user;
        if (userData) setCredits(userData.credits ?? 0);
      } catch (err) {
        console.error('Failed to load profile credits:', err);
      }
    })();

    (async () => {
      setSurveysLoading(true);
      try {
        const res = await sepSurveyAPI.getAvailable({ limit: 4 });
        setSurveys(res.data.data || []);
      } catch (err) {
        console.error('Failed to load standalone surveys:', err);
      } finally {
        setSurveysLoading(false);
      }
    })();
  }, [isLoggedIn]);

  const handleSurveyClick = () => {
    trackEvent('cta_click', '/');
    navigate(isLoggedIn ? "/standalone-surveys" : "/shop");
  };

  const requireTerms = () => {
    if (!agreedToTerms) {
      toast.error("Please accept the Terms of Use and Privacy Policy first.");
      return false;
    }
    return true;
  };

  const handleGoogleLogin = () => {
    if (!requireTerms()) return;
    trackEvent('cta_click', '/join_google');
    window.location.href = `${API_BASE_URL}/auth/google`;
  };

  const handleAppleLogin = () => {
    if (!requireTerms()) return;
    toast("Apple sign-in is coming soon — try Google or Email for now.");
  };

  const handleEmailContinue = () => {
    if (!requireTerms()) return;
    trackEvent('cta_click', '/join_email');
    navigate("/signup");
  };

  const firstName = username.split(" ")[0];

  if (loading) return null;

  return (
    <div
      className="min-h-screen bg-white overflow-x-hidden"
      style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}
    >
      {/* ── Hero ── */}
      <div
        className="bg-cover bg-center flex flex-col justify-between pt-10 lg:pt-16 pb-0"
        style={{ backgroundImage: `url(${HERO_BG})`, minHeight: "650px" }}
      >
        <div className="max-w-[1150px] mx-auto px-4 sm:px-8 lg:px-10 w-full flex-1 flex flex-col">
          <div className="grid lg:grid-cols-[1fr_440px] gap-10 lg:gap-12 flex-1 items-end">
            {/* Left column — Vertically centered within its space */}
            <AnimatedContent direction="vertical" distance={40} duration={0.8} className="my-auto py-8 flex flex-col justify-center">
              <h1 className="text-white mb-6" style={headingStyle}>
                <span
                  className="inline-flex items-center justify-center px-4 rounded-full bg-blue-500 text-white align-middle mr-3"
                  style={{ height: "42px", fontSize: "14px", sm: { height: "58px", fontSize: "18px" }, fontWeight: 400, fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", lineHeight: 1 }}
                >
                  At eRuchi
                </span>
                Two minute daily surveys. Discounts across Kathmandu.
              </h1>

              <p
                className="text-white/80 leading-snug max-w-[540px] mb-8"
                style={{ fontSize: "clamp(15px, 1.5vw, 20px)", fontWeight: 300 }}
              >
                Fill short surveys or polls daily for Ruchi Credits that are directly redeemable for exciting rewards!{" "}
                <a href="/faqs" className="underline hover:text-white transition-colors">
                  Learn More!
                </a>
              </p>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleSurveyClick}
                  className="px-7 rounded-full bg-white text-black hover:bg-gray-100 transition-colors flex items-center justify-center"
                  style={{ height: "58px", fontSize: "18px", fontWeight: 400, fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", lineHeight: 1 }}
                >
                  {isLoggedIn ? "Explore Surveys" : "Explore Rewards"}
                </button>
                <button
                  onClick={handleSurveyClick}
                  aria-label="Explore surveys"
                  className="rounded-full bg-black text-white flex items-center justify-center hover:bg-gray-800 transition-colors"
                  style={{ height: "58px", width: "58px" }}
                >
                  <ArrowUpRight className="w-5 h-5" />
                </button>
              </div>
            </AnimatedContent>

            {/* Right column — signup / welcome card touching bottom */}
            <AnimatedContent
              direction="vertical"
              distance={40}
              duration={0.8}
              delay={0.15}
              className="w-full flex flex-col self-stretch"
            >
              <div
                className={`bg-white p-8 lg:p-10 w-full flex-1 rounded-t-3xl rounded-b-none ${
                  isLoggedIn ? "flex flex-col justify-center" : ""
                }`}
              >
                {isLoggedIn ? (
                  <div className="flex flex-col justify-between h-full py-2">
                    {/* Greeting */}
                    <div className="text-center">
                      <h2 className="text-2xl font-bold text-gray-900">
                        Welcome back{firstName ? `, ${firstName}` : ""}
                      </h2>
                      <p
                        className="text-gray-400 mt-1"
                        style={{ fontSize: "14px", fontWeight: 400 }}
                      >
                        {new Date().toLocaleDateString("en-US", {
                          weekday: "long",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>

                    {/* Credit balance */}
                    <div className="my-8 flex flex-col items-center text-center py-6">
                      <p
                        style={{
                          fontSize: "80px",
                          fontWeight: 700,
                          lineHeight: 1,
                          color: "#134074",
                        }}
                      >
                        {credits}
                      </p>
                      <p
                        className="text-gray-400 mt-2"
                        style={{ fontSize: "14px", fontWeight: 400, letterSpacing: "0.1em" }}
                      >
                        CREDITS
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="space-y-3">
                      <button
                        onClick={() => navigate("/standalone-surveys")}
                        className="w-full text-white hover:opacity-90 transition-all flex items-center justify-center rounded-full"
                        style={{
                          height: "58px",
                          fontSize: "18px",
                          fontWeight: 400,
                          fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                          backgroundColor: "#134074",
                          lineHeight: 1,
                        }}
                      >
                        Take Today's Survey
                      </button>
                      <button
                        onClick={() => navigate("/shop")}
                        className="w-full text-black border border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all flex items-center justify-center rounded-full"
                        style={{
                          height: "58px",
                          fontSize: "18px",
                          fontWeight: 400,
                          fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                          lineHeight: 1,
                        }}
                      >
                        Browse Rewards
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h2 className="text-2xl font-bold text-gray-900 text-center mb-1">
                      Join &amp; Start <span className="text-blue-600">Earning</span>
                    </h2>
                    <p className="text-center text-s tracking-wide text-gray-500 font-medium mb-6">
                      Local rewards are just a few steps away!
                    </p>

                    <div className="space-y-3">
                      <button
                        onClick={handleGoogleLogin}
                        className="w-full font-semibold rounded-2xl border border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all flex items-center justify-center gap-3"
                        style={{ height: "58px", fontSize: "18px", lineHeight: 1 }}
                      >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Continue with Google
                      </button>

                      <button
                        onClick={handleAppleLogin}
                        className="w-full font-semibold rounded-2xl border border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all flex items-center justify-center gap-3"
                        style={{ height: "58px", fontSize: "18px", lineHeight: 1 }}
                      >
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M16.365 1.43c0 1.14-.493 2.27-1.177 3.08-.744.9-1.99 1.57-2.987 1.57-.12 0-.23-.02-.3-.03-.01-.06-.04-.22-.04-.39 0-1.15.572-2.27 1.206-2.98.804-.94 2.142-1.64 3.248-1.68.03.13.05.28.05.43zm4.565 15.71c-.03.07-.463 1.58-1.518 3.12-.945 1.34-1.94 2.71-3.43 2.71-1.517 0-1.9-.88-3.63-.88-1.698 0-2.302.91-3.67.91-1.377 0-2.332-1.26-3.428-2.8-1.287-1.82-2.323-4.63-2.323-7.28 0-4.28 2.797-6.55 5.552-6.55 1.448 0 2.475.95 3.7.95 1.05 0 2.264-1.01 4.06-1.01.63 0 2.906.05 4.402 2.19-.115.075-2.63 1.53-2.63 4.67 0 3.73 3.28 4.98 3.02 4.97z" />
                        </svg>
                        Continue with Apple
                      </button>

                      <div className="relative py-1">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-gray-300" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                          <span className="px-4 bg-white text-gray-500 font-medium">OR</span>
                        </div>
                      </div>

                      <button
                        onClick={handleEmailContinue}
                        className="w-full font-semibold rounded-2xl border border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all flex items-center justify-center gap-3"
                        style={{ height: "58px", fontSize: "18px", lineHeight: 1 }}
                      >
                        <Mail className="w-5 h-5" />
                        Continue with Email
                      </button>
                    </div>

                    <div className="flex items-start gap-2 mt-5">
                      <input
                        type="checkbox"
                        id="homepage-terms"
                        checked={agreedToTerms}
                        onChange={(e) => setAgreedToTerms(e.target.checked)}
                        className="mt-1 h-4 w-4 text-black border-gray-300 rounded cursor-pointer"
                      />
                      <label htmlFor="homepage-terms" className="text-xs text-gray-500 leading-snug">
                        I agree to the{" "}
                        <a href="/terms" className="text-blue-600 hover:underline">Terms of Use</a>{" "}
                        and to receive marketing email messages from Eruchi, and I accept the{" "}
                        <a href="/privacy-policy" className="text-blue-600 hover:underline">Privacy Policy</a>.
                      </label>
                    </div>

                    <p className="text-center text-sm text-gray-500 mt-5">
                      Already have an account?{" "}
                      <a href="/login" className="text-blue-600 font-semibold hover:underline">
                        LOG IN
                      </a>
                    </p>
                  </>
                )}
              </div>
            </AnimatedContent>
          </div>
        </div>
      </div>

      {/* ── Trusted partners strip ── */}
      <div className="bg-white py-6 lg:py-8">
        <div className="max-w-[1150px] mx-auto px-4 sm:px-8 lg:px-10">
          <AnimatedContent direction="vertical" distance={30} duration={0.7}>
            <p className="text-center text-[10px] sm:text-xs tracking-[0.2em] uppercase text-gray-400 font-medium mb-4">
              Redeem your credits with our partners
            </p>
            <div className="flex flex-nowrap items-center justify-center gap-x-3 sm:gap-x-8">
              {PARTNER_LOGOS.map((partner, i) => (
                <img
                  key={i}
                  src={partner.logo}
                  alt={partner.name}
                  className="h-6 sm:h-10 w-auto object-contain min-w-0 grayscale-0 opacity-100 sm:grayscale sm:opacity-60 sm:hover:grayscale-0 sm:hover:opacity-100 transition-all duration-300"
                />
              ))}
            </div>
          </AnimatedContent>
        </div>
      </div>

      {/* ── Top deals carousel / Top surveys ── */}
      {isLoggedIn ? (
        <div className="bg-white py-16 lg:py-20">
          <div className="max-w-[1314px] mx-auto px-4 sm:px-8 lg:px-10">
            <div className="text-center mb-12">
              <h2 className="text-gray-900 mb-3" style={headingStyle}>
                Latest <span className="text-blue-600">surveys</span> right now
              </h2>
            </div>

            {surveysLoading ? (
              <div className="text-center py-10">
                <Loader2 className="w-8 h-8 mx-auto animate-spin text-gray-400" />
              </div>
            ) : surveys.length === 0 ? (
              <p className="text-center text-gray-500">No surveys available right now.</p>
            ) : (
              <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
                {surveys.map((survey) => (
                  <div
                    key={survey._id}
                    className="p-6 sm:p-8 w-full bg-white flex flex-col justify-between rounded-xl border border-neutral-200 hover:border-neutral-900 hover:shadow-sm transition-all"
                  >
                    <div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-md bg-neutral-50 border border-neutral-200 flex items-center justify-center shrink-0">
                          <FileText className="h-5 w-5 text-neutral-800" />
                        </div>
                        <h3 className="text-neutral-900 font-semibold text-[18px] sm:text-[20px] leading-tight">
                          {survey.title}
                        </h3>
                      </div>

                      <p className="text-neutral-500 text-sm sm:text-base line-clamp-2 mb-6 min-h-[40px]">
                        {survey.description}
                      </p>

                      <div className="grid grid-cols-3 gap-4 mb-6 pt-2">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5 mb-1 text-neutral-800">
                            <Award className="h-4 w-4" />
                            <span className="font-medium text-sm sm:text-base whitespace-nowrap">
                              {survey.credits} Credits
                            </span>
                          </div>
                          <span className="text-xs text-neutral-400 pl-[22px]">Reward</span>
                        </div>

                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5 mb-1 text-neutral-800">
                            {survey.isMandatory ? (
                              <AlertCircle className="h-4 w-4" />
                            ) : (
                              <CheckSquare className="h-4 w-4" />
                            )}
                            <span className="font-medium text-sm sm:text-base whitespace-nowrap">
                              {survey.isMandatory ? "Mandatory" : "Optional"}
                            </span>
                          </div>
                          <span className="text-xs text-neutral-400 pl-[22px]">Type</span>
                        </div>

                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5 mb-1 text-neutral-800">
                            <Calendar className="h-4 w-4" />
                            <span className="font-medium text-sm sm:text-base whitespace-nowrap">
                              {survey.endDate ? new Date(survey.endDate).toLocaleDateString() : "No Limit"}
                            </span>
                          </div>
                          <span className="text-xs text-neutral-400 pl-[22px]">Deadline</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end mt-2 pt-5 border-t border-neutral-100">
                      <button
                        onClick={() => navigate(`/standalone-survey/${survey._id}`)}
                        className="text-white py-3 px-6 rounded-md font-medium transition-all hover:opacity-90 active:scale-[0.98] text-sm w-full sm:w-auto"
                        style={{ backgroundColor: "#134074" }}
                      >
                        Start Survey
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="relative overflow-hidden" style={{ height: "805px" }}>
          {VENDOR_POSTERS.map((poster, i) => (
            <div
              key={i}
              className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000"
              style={{
                backgroundImage: `url(${poster.image})`,
                opacity: i === posterIndex ? 1 : 0,
              }}
            />
          ))}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

          <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10 flex items-end justify-between gap-6">
            <div className="flex gap-2">
              {VENDOR_POSTERS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPosterIndex(i)}
                  aria-label={`Show poster ${i + 1}`}
                  className={`w-2.5 h-2.5 rounded-full transition-colors ${
                    i === posterIndex ? "bg-white" : "bg-white/40"
                  }`}
                />
              ))}
            </div>

            <div className="text-right max-w-[480px]">
              <h2 className="text-white mb-2" style={headingStyle}>
                Spotlight <span className="text-blue-400">deals</span> right now
              </h2>
              <p className="text-white/80 mb-5" style={{ fontSize: "clamp(14px, 1.3vw, 18px)" }}>
                Explore our collections of various goods curated to your taste.
              </p>
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={handleSurveyClick}
                  aria-label="Explore rewards"
                  className="w-11 h-11 rounded-full bg-white text-black flex items-center justify-center hover:bg-gray-100 transition-colors"
                >
                  <ArrowRight className="w-5 h-5" />
                </button>
                <button
                  onClick={handleSurveyClick}
                  className="px-6 py-3 rounded-full bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
                >
                  Explore Rewards
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── How it works ── */}
      <div className="relative overflow-hidden flex items-center py-16 lg:py-20" style={{ minHeight: "605px" }}>
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroBg})` }}
        />
        <div className="relative max-w-[1200px] mx-auto px-4 sm:px-8 lg:px-10 w-full">
          <AnimatedContent direction="vertical" distance={30} duration={0.7}>
            <h2 className="text-white text-center mb-14" style={headingStyle}>
              How it works
            </h2>
          </AnimatedContent>

          <div className="grid sm:grid-cols-3 gap-10 sm:gap-6">
            {HOW_IT_WORKS.map((step, i) => (
              <AnimatedContent
                key={step.number}
                direction="vertical"
                distance={40}
                duration={0.7}
                delay={0.15 * i}
                className={`text-center px-4 ${i > 0 ? "sm:border-l sm:border-white/20" : ""}`}
              >
                <p className="text-white/60 font-light mb-3" style={{ fontSize: "clamp(36px, 4vw, 56px)" }}>
                  {step.number}
                </p>
                <h3 className="text-white font-semibold text-lg mb-2">{step.title}</h3>
                <p className="text-blue-100/80 text-sm leading-relaxed max-w-[280px] mx-auto">
                  {step.description}
                </p>
              </AnimatedContent>
            ))}
          </div>
        </div>
      </div>

      {/* ── Buffer clearance area for the bottom nav bar on mobile devices ── */}
      <div className="h-24 lg:hidden" />
    </div>
  );
}