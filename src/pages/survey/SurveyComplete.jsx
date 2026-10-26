import React, { useEffect } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import VoucherRedeemModal from "../../components/widgets/VoucherRedeemModal";
import SearchBar from "../../components/widgets/SearchBar";
import SurveyRow from "../../components/survey/SurveyRow";
import { readSurveyCompleteState } from "../../utils/surveyComplete";
import { trackHealthEvent } from "../../utils/healthEvents";
import skyBg from "../../assets/home/sky.jpg";
import CreditArc from "./surveyComplete/CreditArc.jsx";
import StreakChip from "./surveyComplete/StreakChip.jsx";
import CompleteRewardCard from "./surveyComplete/CompleteRewardCard.jsx";
import useSurveyCompleteOffers from "./surveyComplete/useSurveyCompleteOffers.js";
import "../../components/survey/surveyFlow.css";
import "../../components/shop/shop.css";

export default function SurveyComplete() {
  const location = useLocation();
  const completion = readSurveyCompleteState(location.state);

  const {
    credits,
    loading,
    fetchError,
    search,
    selectedOffer,
    setSelectedOffer,
    nextSurvey,
    showingSearch,
    displayedOffers,
    almostThere,
    shopLink,
    trackAction,
    handleSelectOffer,
    openNextSurvey,
    handleSearchChange,
    handleRedeemed,
    retry,
  } = useSurveyCompleteOffers(completion);

  const streakIncreased =
    completion?.kind !== "daily" &&
    Number(completion?.streakCount) > Number(completion?.previousStreak ?? 0);

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

  return (
    <div className="sf-page pg is-complete">
      <header className="band">
        <img className="sky" src={skyBg} alt="" />
        <div className="veil" />
        <div className="band-in">
          <div className="cp-hero sf-enter">
            <div className="cp-l">
              <div className="hero-h">
                <span className="dots" aria-hidden="true" />
                <h1>Survey complete</h1>
              </div>
              <p>
                Thanks, your answers are in. {earned} Ruchi Credits have been
                added to your balance
                {completion.streakBonus > 0
                  ? ` (including a ${completion.streakBonus} Ruchi Credit streak bonus)`
                  : ""}
                .
              </p>
              {streakIncreased ? (
                <div className="cp-strk">
                  <StreakChip
                    from={completion.previousStreak ?? 0}
                    to={completion.streakCount ?? 0}
                  />
                </div>
              ) : null}
              {completion.kind === "daily" ? (
                <p style={{ marginTop: 16, fontSize: 15, opacity: 0.9 }}>
                  Daily surveys award Ruchi Credits only — they don’t count toward
                  your streak.
                </p>
              ) : null}
              {nextSurvey ? (
                <div className="sf-next">
                  <SurveyRow
                    survey={nextSurvey}
                    onView={openNextSurvey}
                    actionLabel="Next survey"
                  />
                </div>
              ) : (
                <div className="cp-act">
                  <Link
                    to="/standalone-surveys"
                    state={{ scrollToCatalog: true }}
                    onClick={() => trackAction("next_survey")}
                    className="btn wline"
                  >
                    Back to surveys
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                  </Link>
                </div>
              )}
            </div>
            <CreditArc amount={earned} />
          </div>
        </div>
      </header>

      <main className="sheet" style={{ paddingTop: 56, paddingBottom: 96 }}>
        <div className="band-in">
          <div className="rw-h">
            <div>
              <div className="hero-h">
                <span className="dots dk" aria-hidden="true" />
                <h2>
                  {showingSearch
                    ? "Search rewards"
                    : almostThere
                      ? "Almost there"
                      : "Rewards you can claim now"}
                </h2>
              </div>
              <p>
                {showingSearch ? (
                  "Redeem any matching offer right here."
                ) : almostThere ? (
                  "You’re close to unlocking these rewards."
                ) : (
                  <>
                    You have{" "}
                    <b className="tn">{credits.toLocaleString()} Ruchi Credits</b>
                    . Pick any of these.
                  </>
                )}
              </p>
            </div>
            <div className="flex flex-col gap-3 w-full sm:w-auto sm:min-w-[240px]">
              <SearchBar
                value={search}
                onChange={handleSearchChange}
                placeholder="Search rewards..."
              />
              <Link
                to={shopLink}
                onClick={() => trackAction("shop")}
                className="btn ghost"
                style={{ height: 48, padding: "0 24px", fontSize: 16 }}
              >
                See all rewards
              </Link>
            </div>
          </div>

          {loading ? (
            <div className="rw-grid" style={{ marginTop: 28 }}>
              {[0, 1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="rc"
                  style={{
                    background: "var(--surf2)",
                    minHeight: 232,
                    animation: "sf-rise .6s ease both",
                    animationDelay: `${n * 0.05}s`,
                    opacity: 0.5,
                  }}
                />
              ))}
            </div>
          ) : fetchError ? (
            <div className="sf-status" style={{ marginTop: 40 }}>
              <h3>Couldn’t load rewards</h3>
              <p>{fetchError}</p>
              <button
                type="button"
                className="btn navy"
                onClick={retry}
              >
                Retry
              </button>
            </div>
          ) : displayedOffers.length === 0 ? (
            <div className="sf-status" style={{ marginTop: 40 }}>
              <h3>
                {showingSearch ? "No matching rewards" : "No offers right now"}
              </h3>
              <p>
                {showingSearch
                  ? "Try a different search, or browse the full rewards shop."
                  : "New partner rewards will show up here as they go live."}
              </p>
              <Link to="/shop" className="btn navy" onClick={() => trackAction("shop")}>
                See all rewards
              </Link>
            </div>
          ) : (
            <>
              <div className="rw-grid">
                {displayedOffers.map((offer, index) => (
                  <CompleteRewardCard
                    key={offer._id}
                    offer={offer}
                    index={index}
                    userCredits={credits}
                    onRedeem={handleSelectOffer}
                  />
                ))}
              </div>
              <div className="rw-scroll">
                {displayedOffers.map((offer, index) => (
                  <CompleteRewardCard
                    key={`m-${offer._id}`}
                    offer={offer}
                    index={index}
                    userCredits={credits}
                    onRedeem={handleSelectOffer}
                  />
                ))}
              </div>
            </>
          )}

          <div className="cp-end">
            <Link
              to="/"
              onClick={() => trackAction("home")}
              className="btn ghost"
              style={{ height: 48, fontSize: 16 }}
            >
              Back home
            </Link>
          </div>
        </div>
      </main>

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
