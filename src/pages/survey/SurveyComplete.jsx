import React, { useEffect } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import VoucherRedeemModal from "../../components/widgets/VoucherRedeemModal";
import HomeFooter from "../../components/homepage/HomeFooter";
import RewardCard from "../../components/shop/RewardCard";
import SurveyRow from "../../components/survey/SurveyRow";
import { useAuth } from "../../context/AuthContext";
import { readSurveyCompleteState } from "../../utils/surveyComplete";
import { trackHealthEvent } from "../../utils/healthEvents";
import skyBg from "../../assets/home/sky.jpg";
import CreditArc from "./surveyComplete/CreditArc.jsx";
import StreakChip from "./surveyComplete/StreakChip.jsx";
import useSurveyCompleteOffers from "./surveyComplete/useSurveyCompleteOffers.js";
import "../../components/homepage/homepage.css";
import "../../components/shop/shop.css";

function ShopDots() {
  return (
    <span className="shop-dots" aria-hidden="true">
      {Array.from({ length: 16 }, (_, i) => (
        <i key={i} style={{ "--i": i }} />
      ))}
    </span>
  );
}

export default function SurveyComplete() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const completion = readSurveyCompleteState(location.state);

  const {
    credits,
    loading,
    fetchError,
    selectedOffer,
    setSelectedOffer,
    nextSurvey,
    displayedOffers,
    almostThere,
    shopLink,
    trackAction,
    handleSelectOffer,
    openNextSurvey,
    handleRedeemed,
    retry,
  } = useSurveyCompleteOffers(completion);

  const streakCount = Number(completion?.streakCount ?? user?.streakCount);
  const previousStreak = Number(
    completion?.previousStreak ?? user?.streakCount ?? 0
  );
  const streakIncreased =
    completion?.streakIncreased === true ||
    (Number.isFinite(streakCount) &&
      Number.isFinite(previousStreak) &&
      streakCount > previousStreak);
  const showStreak =
    Number.isFinite(streakCount) && (streakIncreased || streakCount > 0);

  useEffect(() => {
    if (!completion?.promptId) return undefined;
    try {
      sessionStorage.setItem("eruchi_reward_prompt", completion.promptId);
    } catch {
      // ignore
    }
    trackHealthEvent("reward_prompt_shown", { eventId: completion.promptId });
    return () => {
      try {
        sessionStorage.removeItem("eruchi_reward_prompt");
      } catch {
        // ignore
      }
    };
  }, [completion?.promptId]);

  if (!completion) {
    return <Navigate to="/standalone-surveys" replace />;
  }

  const earned = completion.creditsEarned || 0;
  const surveysDone = !loading && !nextSurvey;
  const bonusNote =
    completion.streakBonus > 0
      ? ` (including a ${completion.streakBonus} Ruchi Credit streak bonus)`
      : "";

  return (
    <div className="home-page shop-page">
      <div className="home-stage">
        <div className="home-hero-pin">
          <section
            className="home-hero shop-hero"
            style={{ "--sky": `url(${skyBg})` }}
          >
            <div className="home-hero-sky" aria-hidden="true" />
            <div className="home-hero-motion shop-hero-motion">
              <div className="shop-hero-inner">
                <div className="shop-hero-copy">
                  <h1>
                    <span className="shop-hero-line-wrap">
                      <span className="shop-hero-line">Survey complete</span>
                    </span>
                  </h1>
                  <p>
                    Thanks, your answers are in. {earned} Ruchi Credits{" "}
                    <span className="hidden md:inline">
                      have been added to your balance
                    </span>
                    <span className="inline md:hidden">
                      are now in your balance
                    </span>
                    {bonusNote}.
                  </p>
                  {showStreak ? (
                    <StreakChip
                      from={streakIncreased ? previousStreak : streakCount}
                      to={streakCount}
                    />
                  ) : null}
                </div>
                <CreditArc amount={earned} />
              </div>
            </div>
          </section>
        </div>

        <div className="home-sheet shop-sheet">
          <div className="shop-catalog">
            {nextSurvey ? (
              <section className="mb-12" aria-labelledby="nx-h">
                <div className="shop-head mb-6">
                  <div>
                    <div className="shop-title-row">
                      <ShopDots />
                      <h2 id="nx-h">Up next</h2>
                    </div>
                    <p className="shop-head-copy">
                      Each survey brings your next reward closer.
                    </p>
                  </div>
                </div>
                <div className="surveys-list">
                  <SurveyRow
                    survey={nextSurvey}
                    onView={openNextSurvey}
                    actionLabel="Next survey"
                  />
                </div>
              </section>
            ) : null}

            {surveysDone ? (
              <section className="mb-16" aria-labelledby="ad-h">
                <div className="shop-head mb-0">
                  <div>
                    <div className="shop-title-row">
                      <ShopDots />
                      <h2 id="ad-h">You completed all your surveys!</h2>
                    </div>
                    <p className="shop-head-copy !max-w-none">
                      Come back tomorrow for more surveys. New ones are added
                      every day!
                    </p>
                    <p className="shop-head-copy !max-w-none">
                      In the meantime, check out the rewards picked for you
                      below, or{" "}
                      <Link
                        to={shopLink}
                        className="font-semibold text-[#0c1520] underline decoration-[rgba(12,21,32,.35)] underline-offset-3 hover:decoration-[#0c1520]"
                        onClick={() => trackAction("shop")}
                      >
                        browse all rewards
                      </Link>
                      .
                    </p>
                  </div>
                </div>
              </section>
            ) : null}

            <section className="shop-recommended" aria-labelledby="rw-h">
              <div className="shop-title-row">
                <ShopDots />
                <h2 id="rw-h">
                  {almostThere ? "Almost there" : "Rewards you can claim now"}
                </h2>
              </div>
              <p className="shop-head-copy shop-recommended-copy">
                {almostThere ? (
                  <>
                    You have{" "}
                    <b className="font-semibold tabular-nums text-[#0c1520]">
                      {credits.toLocaleString()} Ruchi Credits
                    </b>
                    . These are the closest.
                  </>
                ) : (
                  <>
                    You have{" "}
                    <b className="font-semibold tabular-nums text-[#0c1520]">
                      {credits.toLocaleString()} Ruchi Credits
                    </b>
                    . Pick any of these.
                  </>
                )}
              </p>

              {loading ? (
                <div
                  className="shop-grid shop-recommended-grid"
                  aria-busy="true"
                >
                  {[0, 1, 2, 3].map((n) => (
                    <div
                      key={n}
                      className="shop-grid-item sc-skel min-h-[316px] rounded-[28px] bg-[#eceff2]"
                    />
                  ))}
                </div>
              ) : fetchError ? (
                <div className="shop-status">
                  <h3>We couldn’t load rewards right now</h3>
                  <p>
                    Your {earned} Ruchi Credits are safe. Try again, or browse
                    them in the shop.
                  </p>
                  <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
                    <Link
                      to={shopLink}
                      className="home-pill home-pill-sm home-pill-navy"
                      onClick={() => trackAction("shop")}
                    >
                      See all rewards
                    </Link>
                    <button
                      type="button"
                      className="home-pill home-pill-sm home-pill-ghost"
                      onClick={retry}
                    >
                      Try again
                    </button>
                  </div>
                </div>
              ) : displayedOffers.length === 0 ? (
                <div className="shop-status">
                  <h3>No offers right now</h3>
                  <p>New partner rewards will show up here as they go live.</p>
                  <Link
                    to={shopLink}
                    className="home-pill home-pill-sm home-pill-navy"
                    onClick={() => trackAction("shop")}
                  >
                    See all rewards
                  </Link>
                </div>
              ) : (
                <div className="shop-grid shop-recommended-grid">
                  {displayedOffers.map((offer, index) => (
                    <div key={offer._id} className="shop-grid-item">
                      <RewardCard
                        offer={offer}
                        index={index}
                        onRedeem={handleSelectOffer}
                        onViewStore={(businessId) =>
                          navigate(`/shop/merchant/${businessId}`)
                        }
                      />
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-8 flex justify-center">
                <Link
                  to={shopLink}
                  onClick={() => trackAction("shop")}
                  className="home-pill home-pill-sm home-pill-navy"
                >
                  See all rewards
                </Link>
              </div>
            </section>
          </div>
        </div>
      </div>

      <HomeFooter />

      {selectedOffer && (
        <VoucherRedeemModal
          offer={selectedOffer}
          receivedVia="survey_complete"
          userCredits={credits}
          onClose={() => setSelectedOffer(null)}
          onRedeemed={handleRedeemed}
          onSuccess={() => setSelectedOffer(null)}
        />
      )}
    </div>
  );
}
