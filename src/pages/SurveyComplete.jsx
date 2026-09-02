import React, { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Loader2, SearchX } from "lucide-react";
import { userAPI, voucherAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import VoucherCard from "../components/shop/VoucherCard";
import VoucherRedeemModal from "../components/widgets/VoucherRedeemModal";
import SearchBar from "../components/widgets/SearchBar";
import StreakCelebration from "../components/survey/StreakCelebration";
import AnimatedContent from "../components/animations/AnimatedContent";
import { readSurveyCompleteState } from "../utils/surveyComplete";
import {
  isOfferAvailable,
  matchesOfferSearch,
  pickSuggestedOffers,
} from "../utils/pickSurveyOffers";

const headingStyle = {
  fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
  fontSize: "clamp(28px, 7vw, 48px)",
  fontWeight: 500,
  lineHeight: 1.15,
};

const SEARCH_LIMIT = 4;

export default function SurveyComplete() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const completion = readSurveyCompleteState(location.state);

  const [credits, setCredits] = useState(user?.credits || 0);
  const [streak, setStreak] = useState(user?.streakCount || 0);
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [retryTick, setRetryTick] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!completion) return;
      setLoading(true);
      setFetchError("");
      try {
        const [profileRes, offersRes] = await Promise.all([
          userAPI.getProfile({ skipErrorToast: true }),
          voucherAPI.getOffers({ all: 1, limit: 100, skipErrorToast: true }),
        ]);
        if (cancelled) return;

        const nextUser = profileRes.data?.data?.user;
        setCredits(nextUser?.credits ?? user?.credits ?? 0);
        setStreak(nextUser?.streakCount ?? user?.streakCount ?? 0);
        refreshUser();

        const responseData = offersRes.data?.data || offersRes.data;
        setOffers(Array.isArray(responseData) ? responseData : []);
      } catch (err) {
        if (cancelled) return;
        setFetchError(
          err.response?.data?.message || "Could not load rewards. Please try again."
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [retryTick]);

  const suggested = useMemo(
    () => pickSuggestedOffers(offers, credits, 2),
    [offers, credits]
  );

  const searchResults = useMemo(() => {
    if (!search.trim()) return [];
    return offers
      .filter(isOfferAvailable)
      .filter((offer) => matchesOfferSearch(offer, search))
      .slice(0, SEARCH_LIMIT);
  }, [offers, search]);

  const showingSearch = Boolean(search.trim());
  const displayedOffers = showingSearch ? searchResults : suggested.offers;
  const almostThere = !showingSearch && suggested.mode === "almost";

  if (!completion) {
    return <Navigate to="/standalone-surveys" replace />;
  }

  const handleSelectOffer = (offer) => {
    setSelectedOffer(offer);
  };

  const shopLink = search.trim()
    ? `/shop?q=${encodeURIComponent(search.trim())}`
    : "/shop";

  return (
    <div
      className="min-h-screen bg-white pb-28"
      style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}
    >
      <div className="max-w-[960px] mx-auto px-4 sm:px-8 lg:px-10 py-10 lg:py-16">
        <AnimatedContent direction="vertical" distance={28} duration={0.6}>
          <p className="text-[11px] font-semibold tracking-[1.5px] uppercase text-blue-600 mb-3">
            Survey complete
          </p>
          <h1 className="text-gray-900 mb-4" style={headingStyle}>
            Survey successfully completed!
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 font-light max-w-2xl">
            You have earned{" "}
            <span className="font-semibold text-gray-900">
              {completion.creditsEarned} Ruchi Credits
            </span>
            . Your balance is now {credits.toLocaleString()} credits.
          </p>
        </AnimatedContent>

        <div className="mt-10 flex justify-center sm:justify-start">
          <StreakCelebration
            from={completion.previousStreak ?? 0}
            to={streak}
          />
        </div>

        <div className="mt-14 border-t border-gray-100 pt-10">
          <div className="flex flex-col lg:flex-row lg:items-end gap-6 lg:gap-10 mb-8">
            <div className="flex-1">
              <h2 className="text-2xl sm:text-3xl font-medium text-gray-900 mb-2">
                {almostThere
                  ? "Almost there"
                  : "We think you might like these offers:"}
              </h2>
              <p className="text-gray-500 text-sm sm:text-base font-light max-w-xl">
                {almostThere
                  ? "You’re close to unlocking these rewards. A couple more surveys and they’re yours."
                  : "Redeem with the credits you just earned — no need to leave this page."}
              </p>
            </div>
            <div className="w-full lg:max-w-sm flex flex-col gap-3">
              <SearchBar
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search rewards..."
              />
              <Link
                to={shopLink}
                className="w-full text-center py-3 rounded-full text-sm font-medium text-white hover:opacity-90 transition-opacity"
                style={{ backgroundColor: "#134074" }}
              >
                View all offers
              </Link>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : fetchError ? (
            <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-3xl bg-gray-50/50 px-4">
              <SearchX className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 mb-4">{fetchError}</p>
              <button
                type="button"
                onClick={() => setRetryTick((n) => n + 1)}
                className="px-6 py-3 text-white rounded-full text-sm font-medium hover:opacity-90"
                style={{ backgroundColor: "#134074" }}
              >
                Retry
              </button>
            </div>
          ) : displayedOffers.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-3xl bg-gray-50/50 px-4">
              <SearchX className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-gray-900 text-lg font-medium mb-2">
                {showingSearch ? "No matching rewards" : "No offers right now"}
              </h3>
              <p className="text-gray-500 text-sm max-w-sm mx-auto mb-6">
                {showingSearch
                  ? "Try a different search, or browse the full rewards shop."
                  : "New partner rewards will show up here as they go live."}
              </p>
              <Link
                to="/shop"
                className="inline-block px-6 py-3 text-white rounded-full text-sm font-medium hover:opacity-90"
                style={{ backgroundColor: "#134074" }}
              >
                View all offers
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-2 gap-x-4 sm:gap-x-8 gap-y-8 max-w-2xl">
              {displayedOffers.map((offer) => {
                const shortfall = Math.max(
                  0,
                  (offer.creditsRequired || 0) - credits
                );
                return (
                  <div key={offer._id} className="w-full">
                    <VoucherCard
                      offer={offer}
                      onRedeem={handleSelectOffer}
                      onViewStore={(businessId) =>
                        navigate(`/shop/merchant/${businessId}`)
                      }
                    />
                    {shortfall > 0 && (
                      <p className="mt-2 text-xs sm:text-sm font-medium text-orange-600">
                        {shortfall} more credits to go
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-12 flex flex-wrap gap-3">
          <Link
            to="/standalone-surveys"
            className="px-6 py-3 rounded-full text-sm font-medium border border-gray-200 text-gray-700 hover:bg-gray-50"
          >
            More surveys
          </Link>
          <Link
            to="/"
            className="px-6 py-3 rounded-full text-sm font-medium text-gray-500 hover:text-gray-800"
          >
            Back home
          </Link>
        </div>
      </div>

      {selectedOffer && (
        <VoucherRedeemModal
          offer={selectedOffer}
          userCredits={credits}
          onClose={() => setSelectedOffer(null)}
          onRedeemed={() => {
            const spent = selectedOffer.creditsRequired || 0;
            setCredits((current) => Math.max(0, current - spent));
            refreshUser();
          }}
          onSuccess={() => setSelectedOffer(null)}
        />
      )}
    </div>
  );
}
