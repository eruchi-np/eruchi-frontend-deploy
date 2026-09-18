import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Camera,
  ChevronLeft,
  ChevronRight,
  Coffee,
  Gift,
  Heart,
  Music,
  Shield,
  Smile,
  Star,
  Wallet,
  Zap,
} from "lucide-react";
import HomeStreakBadge from "../components/homepage/HomeStreakBadge";
import HomeStreakBonus from "../components/homepage/HomeStreakBonus";
import HomeBlob from "../components/homepage/HomeBlob";
import HomeDots from "../components/homepage/HomeDots";
import HomeFooter from "../components/homepage/HomeFooter";
import { initHomeCinema } from "../components/homepage/homeCinema";
import { useAuth } from "../context/AuthContext";
import { trackEvent } from "../utils/visitorEvents";
import skyBg from "../assets/home/sky.jpg";
import climbImg from "../assets/home/climb.jpg";
import productsImg from "../assets/home/products.jpg";
import bottleImg from "../assets/home/bottle.jpg";
import barImg from "../assets/home/bar.jpg";
import opinionsLogo from "../assets/home/features/opinions.png";
import creditsLogo from "../assets/home/features/credits.png";
import rewardsLogo from "../assets/home/features/rewards.png";
import trustedLogo from "../assets/home/features/trusted.png";
import "../components/homepage/homepage.css";

const STRIP_ICONS = [Heart, Zap, Coffee, Camera, Wallet, Gift, Smile, Music, Shield, Star];

const REWARDS = [
  {
    id: "ascend",
    featured: true,
    image: climbImg,
    title: "15% off Day pass",
    venue: "Ascend Climbing Gym",
    earned: 21,
    needed: 30,
  },
  { id: "goods", image: productsImg, title: "Market picks", venue: "Local grocers" },
  { id: "wine", image: bottleImg, title: "Wine night", venue: "Partner venues" },
  { id: "dining", image: barImg, title: "Dining out", venue: "Cafes & bars" },
];

export default function Homepage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [scrollPct, setScrollPct] = useState(0);
  const [thumbW, setThumbW] = useState(32);
  const [activeReward, setActiveReward] = useState(REWARDS[0].id);
  const scrollerRef = useRef(null);
  const pageRef = useRef(null);

  const isLoggedIn = Boolean(user);
  const streak = Number(user?.streakCount) || 0;
  const credits = Number(user?.credits) || 0;

  useEffect(() => {
    trackEvent("page_view", "/");
    const html = document.documentElement;
    const prevHtmlOverflow = html.style.overflowX;
    const prevBodyOverflow = document.body.style.overflowX;
    const rootEl = document.getElementById("root");
    const prevRootOverflow = rootEl ? rootEl.style.overflowX : "";
    html.style.overflowX = "clip";
    document.body.style.overflowX = "clip";
    if (rootEl) rootEl.style.overflowX = "clip";

    const root = pageRef.current;
    const revert = initHomeCinema(root);

    return () => {
      revert();
      html.style.overflowX = prevHtmlOverflow;
      document.body.style.overflowX = prevBodyOverflow;
      if (rootEl) rootEl.style.overflowX = prevRootOverflow;
    };
  }, [isLoggedIn]);

  const syncCarousel = () => {
    const el = scrollerRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setScrollPct(max > 0 ? el.scrollLeft / max : 0);
    setThumbW(Math.max(22, (el.clientWidth / el.scrollWidth) * 100));
  };

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    syncCarousel();
    el.addEventListener("scroll", syncCarousel, { passive: true });
    window.addEventListener("resize", syncCarousel);
    return () => {
      el.removeEventListener("scroll", syncCarousel);
      window.removeEventListener("resize", syncCarousel);
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(syncCarousel, 560);
    return () => clearTimeout(timer);
  }, [activeReward]);

  const goRewards = () => {
    trackEvent("cta_click", "/rewards");
    navigate("/shop");
  };

  const goSurveys = () => {
    trackEvent("cta_click", "/surveys");
    navigate(isLoggedIn ? "/standalone-surveys" : "/signup");
  };

  const scrollCarousel = (dir) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.min(420, el.clientWidth * 0.7), behavior: "smooth" });
  };

  return (
    <div className="home-page" ref={pageRef}>
      <div className="home-stage">
        <div className="home-hero-pin">
          <section className="home-hero" style={{ "--sky": `url(${skyBg})` }}>
            <div className="home-hero-sky" aria-hidden="true" />
            <div className="home-hero-motion">
              <div className="home-hero-copy">
                <h1>
                  <span className="home-line">You share the opinion.</span>
                  <span className="home-line">
                    We spread the <em>reward.</em>
                  </span>
                </h1>
                <p className="home-hero-sub">
                  Fill short surveys or polls daily for Ruchi Credits that are directly redeemable for
                  exciting rewards!{" "}
                  <Link to="/faqs">Learn More</Link>
                </p>
                <div className="home-hero-ctas">
                  <button type="button" className="home-pill home-pill-lg home-pill-lime" onClick={goRewards}>
                    Rewards
                  </button>
                  <button type="button" className="home-pill home-pill-lg home-pill-white" onClick={goSurveys}>
                    Surveys
                  </button>
                </div>
                {isLoggedIn && (
                  <HomeStreakBonus streak={streak} credits={credits} />
                )}
              </div>
            </div>
            {isLoggedIn && (
              <HomeStreakBadge streak={streak} onClick={goSurveys} />
            )}
          </section>
        </div>

        <div className="home-sheet">
        <div className="home-icons" aria-hidden="true">
          {STRIP_ICONS.map((Icon, i) => (
            <Icon key={i} />
          ))}
        </div>

        <section className="home-section home-meet" id="meet">
          <HomeDots />

          <div className="home-meet-copy">
            <p>
              eRuchi is a community of everyday people sharing honest feedback with the brands
              around them. Short surveys. Real rewards. A better way to spend your opinions.
            </p>
            <h2>Meet your new favourite rewards platform</h2>
          </div>
        </section>

        <section className="home-section home-features">
          <div className="home-feature-col">
            <Feature
              icon={opinionsLogo}
              title="Share Your Opinions"
              body="Take short surveys and polls that help local businesses understand what people like you actually want."
            />
            <Feature
              icon={rewardsLogo}
              title="Unlock Real Rewards"
              body="Redeem credits for discounts at cafés, gyms, shops and experiences right around you."
            />
          </div>

          <HomeBlob />

          <div className="home-feature-col">
            <Feature
              icon={creditsLogo}
              title="Earn Ruchi Credits"
              body="Every completed survey adds credits to your wallet — ready to spend on rewards you actually use."
            />
            <Feature
              icon={trustedLogo}
              title="Safe & Trusted"
              body="Your data stays private. We only share aggregated insights, never your personal answers."
            />
          </div>
        </section>

        <section className="home-section home-discover">
          <div className="home-discover-head">
            <h2>
              Discover what everyone is <em>redeeming</em>
            </h2>
            <p>
              Don&apos;t let those credits sit idle. See what the community is redeeming and grab it
              before it&apos;s gone.
            </p>
            <div className="home-arrows">
              <button type="button" className="home-arrow" aria-label="Previous rewards" onClick={() => scrollCarousel(-1)}>
                <ChevronLeft size={18} />
              </button>
              <button type="button" className="home-arrow" aria-label="Next rewards" onClick={() => scrollCarousel(1)}>
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          <div
            className="home-carousel"
            ref={scrollerRef}
            onMouseLeave={() => setActiveReward(REWARDS[0].id)}
          >
            {REWARDS.map((card) => {
              const expanded = activeReward === card.id;
              return (
                <article
                  key={card.id}
                  className={`home-card ${expanded ? "is-wide" : ""}`}
                  onClick={goRewards}
                  onMouseEnter={() => setActiveReward(card.id)}
                  onFocus={() => setActiveReward(card.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      goRewards();
                    }
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <img src={card.image} alt={card.title} />
                  <div className="home-card-overlay" />
                  <div className="home-card-copy">
                    <strong>{card.title}</strong>
                    <span>{card.venue}</span>
                  </div>
                  {card.earned != null && (
                    <div className="home-credit-ring">
                      <CreditRing earned={card.earned} needed={card.needed} />
                      <div className="home-credit-label">
                        <b>
                          {card.earned} out of
                          <br />
                          {card.needed}
                        </b>
                        <small>credits</small>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>

          <div className="home-carousel-ui">
            <div className="home-scroll-track" aria-hidden="true">
              <span
                className="home-scroll-thumb"
                style={{
                  width: `${thumbW}%`,
                  left: `${scrollPct * (100 - thumbW)}%`,
                }}
              />
            </div>
            <button type="button" className="home-pill home-pill-lg home-pill-lime" onClick={goRewards}>
              View All Rewards
            </button>
          </div>
        </section>
        </div>
      </div>

      <HomeFooter />
    </div>
  );
}

function Feature({ icon, title, body }) {
  return (
    <div className="home-feature">
      <div className="home-feature-icon">
        <img src={icon} alt="" />
      </div>
      <div>
        <h3>{title}</h3>
        <p>{body}</p>
      </div>
    </div>
  );
}

function CreditRing({ earned, needed }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  const pct = Math.min(1, earned / needed);
  return (
    <svg viewBox="0 0 88 88" fill="none">
      <circle cx="44" cy="44" r={r} stroke="rgba(255,255,255,0.22)" strokeWidth="6" />
      <circle
        cx="44"
        cy="44"
        r={r}
        stroke="#c8f53a"
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - pct)}
        transform="rotate(-90 44 44)"
      />
    </svg>
  );
}

