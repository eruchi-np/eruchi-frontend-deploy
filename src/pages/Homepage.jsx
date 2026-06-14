import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import CTAButton from "../components/widgets/CTAbutton";
import SurveyButton from "../components/widgets/SurveyButton";
import { ArrowRight } from "lucide-react";
import AnimatedContent from "../components/animations/AnimatedContent";
import { trackEvent } from "../utils/analytics";

const descriptionStyle = {
  fontSize: "clamp(15px, 1.5vw, 20px)",
  fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
  fontWeight: 300,
};

export default function Homepage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const STEP_CARDS = [
    {
      step: "2 min surveys",
      bg: "#134074",
      bottom: (
        <>
          Quick and Relevant
        </>
      ),
    },
    {
      step: "Ruchi Credits",
      bg: "#13315C",
      bottom: (
        <>
          Every opinion earns
        </>
      ),
    },
    {
      step: "Real local rewards",
      bg: "#08162B",
      top: (
        <>
          
        </>
      ),
      bottom: "Mamba, Ujamaa, and more",
    },
  ];

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

  const handleSurveyClick = () => {
      trackEvent('cta_click', '/');
      navigate(isLoggedIn ? "/standalone-surveys" : "/login");
    };

  const firstName = username.split(" ")[0];

  const description = isLoggedIn ? (
    <>
      Welcome back, {firstName}! Get free samples matched to your taste, share
      honest feedback, and help brands build products you'll actually love.{" "}
      <a
        href="/faqs"
        className="underline hover:text-gray-900 transition-colors"
      >
        Learn More!
      </a>
    </>
  ) : (
    <>
      eRuchi is Kathmandu's consumer opinion platform. Two-minute surveys 
      on the brands you use daily for Ruchi Credits you redeem at Mamba, Ujamaa, and more.{" "}
      <a
        href="/faqs"
        className="underline hover:text-gray-900 transition-colors"
      >
        Learn More!
      </a>
    </>
  );

  if (loading) return null;

  return (
    <div
      className="min-h-screen bg-white"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <div className="max-w-[1314px] mx-auto px-4 sm:px-8 lg:px-10 py-10 lg:py-14">

        {/* ── Desktop (lg+) ── */}
        <div className="hidden lg:grid lg:grid-cols-2 lg:gap-16 mb-12 items-start">
          
          {/* Left Column Animation */}
          <AnimatedContent
            direction="vertical"
            distance={40}
            duration={0.8}
            className="min-w-0"
          >
            <div className="mb-8">
              <SurveyButton onClick={handleSurveyClick} label={isLoggedIn ? "Survey" : "Join Us"} />
            </div>
            <div
              className="flex items-center gap-3 mb-5 whitespace-nowrap"
              style={{ fontSize: "clamp(24px, 2.8vw, 40px)", fontWeight: 400, lineHeight: 1.2 }}
            >
              <span className="text-gray-900">Survey</span>
              <ArrowRight className="w-10 h-10 text-black shrink-0" />
              <span className="text-gray-900">Credits</span>
              <ArrowRight className="w-10 h-10 text-black shrink-0" />
              <span className="text-gray-900">Rewards</span>
            </div>
            <p
              className="text-gray-700 leading-snug max-w-[560px]"
              style={descriptionStyle}
            >
              {description}
            </p>
          </AnimatedContent>

          {/* Right Column Animation (Slightly delayed for depth) */}
          <AnimatedContent
            direction="vertical"
            distance={40}
            duration={0.8}
            delay={0.15}
            className="min-w-0 flex flex-col items-end"
          >
            <h1
              className="text-gray-900 text-right mb-8"
              style={{ fontSize: "clamp(40px, 5vw, 50px)", fontWeight: 400, lineHeight: 1.1 }}
            >
              Your opinions,
              <br />
              worth something real
            </h1>
            <CTAButton onClick={() => navigate("/faqs")}>FAQs</CTAButton>
          </AnimatedContent>
        </div>

        {/* ── Mobile (below lg) ── */}
        <AnimatedContent
          direction="vertical"
          distance={30}
          duration={0.8}
          className="lg:hidden mb-8"
        >
          <p
            className="text-gray-900 mb-4"
            style={{
              fontSize: "clamp(16px, 5vw, 28px)",
              fontWeight: 400,
              lineHeight: 1.2,
            }}
          >
            Survey &nbsp;→&nbsp; Credits &nbsp;→&nbsp; Rewards
          </p>
          <p
            className="text-gray-700 leading-snug mb-6"
            style={descriptionStyle}
          >
            {description}
          </p>
          <h1
            className="text-gray-900 mb-6"
            style={{
              fontSize: "clamp(36px, 8vw, 56px)",
              fontWeight: 400,
              lineHeight: 1.1,
            }}
          >
            Your opinions,
            <br />
            worth something real
          </h1>
          <div className="flex items-center gap-3">
            <div className="flex-1 [&>*>*:last-child]:hidden">
              <CTAButton onClick={() => navigate("/faqs")} fluid>FAQs</CTAButton>
            </div>

            {/* Survey Button (Right - Wide Blue Pill) */}
            <div className="flex-1 [&>*>*:last-child]:hidden">
              <SurveyButton onClick={handleSurveyClick} fluid label={isLoggedIn ? "Survey" : "Join Us"} />
            </div>         
          </div>
        </AnimatedContent>

        {/* ── Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {STEP_CARDS.map(({ step, bg, top, bottom }, index) => (
            <AnimatedContent
              key={step}
              direction="vertical"
              distance={50}
              duration={0.7}
              delay={0.2 + index * 0.15}
              className={`flex ${index === 0 ? "col-span-2 lg:col-span-1" : "col-span-1"}`}
            >
              <div
                className="rounded-3xl p-8 lg:p-10 text-white w-full flex flex-col justify-between"
                style={{
                  backgroundColor: bg,
                  height: "clamp(220px, 28vw, 397px)",
                }}
              >
                {top ? (
                  <h2
                    className="text-right"
                    style={{
                      fontSize: "clamp(26px, 3vw, 48px)",
                      fontWeight: 600,
                      lineHeight: 1.15,
                    }}
                  >
                    {top}
                  </h2>
                ) : (
                  <div />
                )}
                <div>
                  <p
                    className="mb-1 opacity-75"
                    style={{
                      fontSize: "clamp(13px, 1.4vw, 20px)",
                      fontWeight: 400,
                    }}
                  >
                    {step}
                  </p>
                  <h2
                    style={{
                      fontSize: "clamp(22px, 3vw, 48px)",
                      fontWeight: 600,
                      lineHeight: 1.1,
                      minHeight: "2.2em",
                    }}
                  >
                    {bottom}
                  </h2>
                </div>
              </div>
            </AnimatedContent>
          ))}
        </div>

        {/* ── Buffer clearance area for the bottom nav bar on mobile devices ── */}
        <div className="h-24 lg:hidden" />

      </div>
    </div>
  );
}