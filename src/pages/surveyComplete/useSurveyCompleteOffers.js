import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fifteenDaySurveyAPI, sepSurveyAPI, userAPI, voucherAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { isSurveyOpen } from "../../components/survey/SurveyRow";
import {
  isOfferAvailable,
  matchesOfferSearch,
  pickSuggestedOffers,
} from "../../utils/pickSurveyOffers";
import { trackHealthEvent } from "../../utils/healthEvents";

const SEARCH_LIMIT = 8;

async function lookupNextSurvey() {
  const [surveysResult, sprintResult] = await Promise.allSettled([
    sepSurveyAPI.getAvailable({ page: 1, limit: 200, skipErrorToast: true }),
    fifteenDaySurveyAPI.getMine({ skipErrorToast: true }),
  ]);

  const sprints =
    sprintResult.status === "fulfilled"
      ? sprintResult.value.data?.data || []
      : [];
  if (sprints.length > 0) {
    const ordered = [...sprints].sort(
      (a, b) =>
        (Number(a.daySlot) || 0) - (Number(b.daySlot) || 0) ||
        String(a.createdAt || "").localeCompare(String(b.createdAt || ""))
    );
    return ordered[0];
  }

  const surveys =
    surveysResult.status === "fulfilled"
      ? surveysResult.value.data?.data || []
      : [];
  const open = surveys.filter(isSurveyOpen);
  const regular = open
    .filter((s) => s.kind !== "daily")
    .sort((a, b) =>
      String(a.createdAt || "").localeCompare(String(b.createdAt || ""))
    );
  if (regular.length > 0) return regular[0];

  const daily = open
    .filter((s) => s.kind === "daily")
    .sort((a, b) =>
      String(a.createdAt || "").localeCompare(String(b.createdAt || ""))
    );
  return daily[0] || null;
}

export default function useSurveyCompleteOffers(completion) {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();

  const [credits, setCredits] = useState(
    completion?.credits ?? user?.credits ?? 0
  );
  const [offers, setOffers] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [retryTick, setRetryTick] = useState(0);
  const [nextSurvey, setNextSurvey] = useState(null);
  const searched = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!completion) return;
      setLoading(true);
      setFetchError("");
      try {
        const blocked = user?.profileSurveyBlocked || user?.profileOutdated;
        const [profileRes, offersRes, recommendedRes, next] =
          await Promise.all([
            userAPI.getProfile({ skipErrorToast: true }),
            voucherAPI.getOffers({ all: 1, skipErrorToast: true }),
            voucherAPI.getRecommended({ skipErrorToast: true }).catch(() => null),
            blocked ? Promise.resolve(null) : lookupNextSurvey(),
          ]);
        if (cancelled) return;

        const nextUser = profileRes.data?.data?.user;
        setCredits(
          nextUser?.credits ?? completion?.credits ?? user?.credits ?? 0
        );
        refreshUser();

        const responseData = offersRes.data?.data || offersRes.data;
        setOffers(Array.isArray(responseData) ? responseData : []);
        const recommendedData = recommendedRes?.data?.data;
        setRecommended(Array.isArray(recommendedData) ? recommendedData : []);
        setNextSurvey(next);
      } catch (err) {
        if (cancelled) return;
        setFetchError(
          err.response?.data?.message ||
            "Couldn’t load rewards. Please try again."
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

  const suggested = useMemo(() => {
    const fromRecommendations = recommended.slice(0, 4);
    if (fromRecommendations.length > 0) {
      return { mode: "recommended", offers: fromRecommendations };
    }
    return pickSuggestedOffers(offers, credits, 4);
  }, [recommended, offers, credits]);

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

  const trackAction = (action, refId) => {
    if (!completion?.promptId) return;
    trackHealthEvent("reward_prompt_action", {
      eventId: `${action}:${completion.promptId}${refId ? `:${refId}` : ""}`,
      refId,
      detail: { action },
    });
  };

  const handleSelectOffer = (offer) => {
    trackAction("voucher", offer?._id);
    setSelectedOffer(offer);
  };

  const openNextSurvey = (survey) => {
    trackAction("next_survey", survey?._id);
    if (survey.isDailySprint) {
      const wave = Number(survey.wave) >= 1 ? Number(survey.wave) : 1;
      navigate(`/standalone-survey/${survey._id}?sprint=1&wave=${wave}`);
      return;
    }
    navigate(`/standalone-survey/${survey._id}`);
  };

  const handleSearchChange = (e) => {
    const next = e.target.value;
    setSearch(next);
    if (!searched.current && next.trim()) {
      searched.current = true;
      trackAction("search");
    }
  };

  const handleRedeemed = () => {
    const spent = selectedOffer.creditsRequired || 0;
    const redeemedId = selectedOffer._id;
    setCredits((current) => Math.max(0, current - spent));
    setOffers((current) =>
      current.map((offer) =>
        offer._id === redeemedId
          ? {
              ...offer,
              totalRedeemed: (offer.totalRedeemed || 0) + 1,
            }
          : offer
      )
    );
    voucherAPI
      .getRecommended({ skipErrorToast: true })
      .then((res) => {
        const data = res.data?.data;
        setRecommended(Array.isArray(data) ? data : []);
      })
      .catch(() => {});
    refreshUser();
  };

  const shopLink = search.trim()
    ? `/shop?q=${encodeURIComponent(search.trim())}`
    : "/shop";

  return {
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
    retry: () => setRetryTick((n) => n + 1),
  };
}
