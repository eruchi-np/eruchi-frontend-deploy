import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ChevronDown, Search, SearchX } from "lucide-react";
import toast from "react-hot-toast";
import { sepSurveyAPI, userAPI } from "../services/api";
import { StreakArc, pageWindow } from "../components/shop/CreditArc";
import HomeFooter from "../components/homepage/HomeFooter";
import { flipShopCatalog, initShopCinema, scrollShopToCatalog } from "../components/shop/shopCinema";
import { useAuth } from "../context/AuthContext";
import { parsePage, writeSearchParams } from "../utils/searchParams";
import { trackEvent } from "../utils/visitorEvents";
import skyBg from "../assets/home/sky.jpg";
import "../components/homepage/homepage.css";
import "../components/shop/shop.css";

const SURVEY_PAGE_SIZE = 8;

function isSurveyOpen(survey) {
  const now = new Date();
  if (survey.isMerchantFeedback) return true;
  if (survey.status !== "published") return false;
  if (survey.startDate && now < new Date(survey.startDate)) return false;
  if (survey.endDate && now > new Date(survey.endDate)) return false;
  return true;
}

function minutesLabel(survey) {
  const mins = Number(survey.estimatedMinutes);
  if (!Number.isFinite(mins) || mins <= 0) return "—";
  return `${mins}Min`;
}

function SurveyRow({ survey, onView }) {
  const expired = !isSurveyOpen(survey);

  return (
    <article
      className={`surveys-row ${expired ? "is-expired" : ""}`}
      data-survey-id={survey._id}
      onClick={() => !expired && onView(survey)}
    >
      <span className="surveys-row-icon" aria-hidden="true" />
      <div className="surveys-row-copy">
        <h3>
          {survey.title}
          {survey.isMerchantFeedback ? (
            <span className="surveys-row-tag">
              {survey.feedbackBusinessName ? `Feedback · ${survey.feedbackBusinessName}` : "Feedback"}
            </span>
          ) : null}
          {survey.kind === "daily" ? (
            <span className="surveys-row-tag">Daily</span>
          ) : null}
        </h3>
        <p>{survey.description}</p>
      </div>
      <div className="surveys-row-meta">
        <span className="surveys-row-time">{minutesLabel(survey)}</span>
        <span className="surveys-row-credits">{survey.credits || 0}</span>
      </div>
      <button
        type="button"
        className="surveys-row-view"
        disabled={expired}
        onClick={() => onView(survey)}
      >
        {expired ? "closed" : "view"}
      </button>
    </article>
  );
}

function sortSurveys(items, sortOrder) {
  if (sortOrder === "credits-desc") {
    return [...items].sort((a, b) => (b.credits || 0) - (a.credits || 0));
  }
  if (sortOrder === "credits-asc") {
    return [...items].sort((a, b) => (a.credits || 0) - (b.credits || 0));
  }
  return [...items].sort((a, b) =>
    String(b.createdAt || "").localeCompare(String(a.createdAt || ""))
  );
}

export default function StandaloneSurveys() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const pageRef = useRef(null);
  const listRef = useRef(null);
  const rectsRef = useRef(new Map());
  const lastCatalogPage = useRef(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get("q") || "";
  const sortOrder = searchParams.get("sort") || "latest";
  const catalogPage = parsePage(searchParams.get("page"));
  const [searchDraft, setSearchDraft] = useState(search);
  const [surveys, setSurveys] = useState([]);
  const [streak, setStreak] = useState(Number(user?.streakCount) || 0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryTick, setRetryTick] = useState(0);

  const setListParams = useCallback(
    (patch) =>
      writeSearchParams(setSearchParams, patch, {
        q: "",
        sort: "latest",
        page: 1,
      }),
    [setSearchParams]
  );

  useEffect(() => {
    setSearchDraft(search);
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchDraft === search) return;
      setListParams({ q: searchDraft, page: 1 });
    }, 300);
    return () => clearTimeout(timer);
  }, [searchDraft, search, setListParams]);

  useEffect(() => {
    trackEvent("page_view", "/standalone-surveys");
    const html = document.documentElement;
    const prevHtmlOverflow = html.style.overflowX;
    const prevBodyOverflow = document.body.style.overflowX;
    const rootEl = document.getElementById("root");
    const prevRootOverflow = rootEl ? rootEl.style.overflowX : "";
    html.style.overflowX = "clip";
    document.body.style.overflowX = "clip";
    if (rootEl) rootEl.style.overflowX = "clip";

    const revert = initShopCinema(pageRef.current);
    return () => {
      revert();
      html.style.overflowX = prevHtmlOverflow;
      document.body.style.overflowX = prevBodyOverflow;
      if (rootEl) rootEl.style.overflowX = prevRootOverflow;
    };
  }, []);

  useLayoutEffect(() => {
    if (window.location.hash) {
      window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
    }
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [surveysResult, profileResult] = await Promise.allSettled([
          sepSurveyAPI.getAvailable({
            page: 1,
            limit: 200,
            skipErrorToast: true,
          }),
          userAPI.getProfile({ skipAuthRedirect: true, skipErrorToast: true }),
        ]);

        if (cancelled) return;

        if (surveysResult.status !== "fulfilled") {
          setSurveys([]);
          setError("Could not load available surveys. Please try again later.");
          toast.error("Failed to load surveys");
          return;
        }

        const res = surveysResult.value;
        setSurveys(res.data.data || []);

        if (profileResult.status === "fulfilled" && profileResult.value) {
          const nextUser =
            profileResult.value.data?.data?.user || profileResult.value.data?.user;
          setStreak(nextUser?.streakCount ?? user?.streakCount ?? 0);
        } else {
          setStreak(user?.streakCount || 0);
        }
      } catch (err) {
        if (cancelled) return;
        console.error("Failed to load standalone surveys:", err);
        setSurveys([]);
        setError("Could not load available surveys. Please try again later.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [user, retryTick]);

  const filteredCatalog = useMemo(() => {
    const q = searchDraft.toLowerCase().replace(/\s/g, "");
    let items = surveys.filter(isSurveyOpen).filter((survey) => survey.kind !== "daily");

    if (q) {
      items = items.filter((survey) =>
        `${survey.title || ""} ${survey.description || ""} ${survey.credits || ""} ${
          survey.estimatedMinutes || ""
        } ${survey.feedbackBusinessName || ""}`
          .toLowerCase()
          .replace(/\s/g, "")
          .includes(q)
      );
    }

    return sortSurveys(items, sortOrder);
  }, [searchDraft, sortOrder, surveys]);

  const dailyCatalog = useMemo(() => {
    const q = searchDraft.toLowerCase().replace(/\s/g, "");
    let items = surveys.filter(isSurveyOpen).filter((survey) => survey.kind === "daily");

    if (q) {
      items = items.filter((survey) =>
        `${survey.title || ""} ${survey.description || ""} ${survey.credits || ""} ${
          survey.estimatedMinutes || ""
        }`
          .toLowerCase()
          .replace(/\s/g, "")
          .includes(q)
      );
    }

    return sortSurveys(items, sortOrder);
  }, [searchDraft, sortOrder, surveys]);

  const listPage = searchDraft === search ? catalogPage : 1;
  const catalogTotal = filteredCatalog.length;
  const catalogPages = Math.max(1, Math.ceil(catalogTotal / SURVEY_PAGE_SIZE) || 1);
  const safePage = Math.min(listPage, catalogPages);
  const rangeStart = catalogTotal === 0 ? 0 : (safePage - 1) * SURVEY_PAGE_SIZE;
  const pagedCatalog = filteredCatalog.slice(rangeStart, rangeStart + SURVEY_PAGE_SIZE);
  const rangeEnd = rangeStart + pagedCatalog.length;

  useEffect(() => {
    if (lastCatalogPage.current == null) {
      lastCatalogPage.current = catalogPage;
      return;
    }
    if (lastCatalogPage.current === catalogPage) return;
    lastCatalogPage.current = catalogPage;
    scrollShopToCatalog(pageRef.current, { behavior: "smooth" });
  }, [catalogPage]);

  const pageIds = pagedCatalog.map((survey) => survey._id).join();
  useLayoutEffect(() => {
    if (loading) {
      rectsRef.current = new Map();
      return;
    }
    flipShopCatalog(listRef.current, rectsRef);
  }, [loading, pageIds, error, searchDraft, sortOrder]);

  const goCatalog = () => {
    scrollShopToCatalog(pageRef.current, { behavior: "smooth" });
  };

  const openSurvey = (survey) => {
    if (!isSurveyOpen(survey)) return;
    navigate(`/standalone-survey/${survey._id}`);
  };

  return (
    <div className="home-page shop-page" ref={pageRef}>
      <div className="home-stage">
        <div className="home-hero-pin">
          <section className="home-hero shop-hero" style={{ "--sky": `url(${skyBg})` }}>
            <div className="home-hero-sky" aria-hidden="true" />
            <div className="home-hero-motion shop-hero-motion">
              <div className="shop-hero-inner">
                <div className="shop-hero-copy">
                  <h1>
                    <span className="shop-hero-line-wrap">
                      <span className="shop-hero-line">Your next favourite.</span>
                    </span>
                    <span className="shop-hero-line-wrap">
                      <span className="shop-hero-line">Already earned.</span>
                    </span>
                  </h1>
                  <p>
                    A coffee on your way. A climb after work. Turn your everyday opinions into a
                    little more of what you love.
                  </p>
                  <button type="button" className="home-pill home-pill-lg home-pill-white" onClick={goCatalog}>
                    Surveys
                  </button>
                </div>
                <StreakArc streak={streak} />
              </div>
            </div>
          </section>
        </div>

        <div className="home-sheet shop-sheet">
          <div className="shop-catalog">
            <div className="shop-head">
              <div>
                <div className="shop-title-row">
                  <span className="shop-dots" aria-hidden="true">
                    {Array.from({ length: 16 }, (_, i) => (
                      <i key={i} style={{ "--i": i }} />
                    ))}
                  </span>
                  <h2>Available Surveys</h2>
                </div>
                <p className="shop-head-copy">
                  Every survey you have been a part of, all in one place.
                </p>
              </div>
              <label className="shop-search">
                <span className="sr-only">Search surveys</span>
                <input
                  value={searchDraft}
                  onChange={(event) => setSearchDraft(event.target.value)}
                  placeholder="Upark, restaurant, cafe..."
                />
                <Search size={16} />
              </label>
            </div>

            <div className="shop-toolbar">
              <p className="shop-showing">
                {loading
                  ? "Loading surveys"
                  : catalogTotal === 0
                    ? "Showing 0 surveys"
                    : `Showing ${rangeStart + 1}-${rangeEnd} of ${catalogTotal} surveys`}
              </p>
              <label className="shop-sort">
                <span>Sort by:</span>
                <select
                  value={sortOrder === "default" ? "latest" : sortOrder}
                  onChange={(event) => setListParams({ sort: event.target.value, page: 1 })}
                >
                  <option value="latest">Latest surveys</option>
                  <option value="credits-desc">Credits: High to Low</option>
                  <option value="credits-asc">Credits: Low to High</option>
                </select>
                <ChevronDown size={14} />
              </label>
            </div>

            {error ? (
              <div className="shop-status">
                <SearchX className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3>Couldn’t load surveys</h3>
                <p>{error}</p>
                <button
                  type="button"
                  className="home-pill home-pill-sm home-pill-navy"
                  onClick={() => setRetryTick((n) => n + 1)}
                >
                  Retry
                </button>
              </div>
            ) : loading ? (
              <div className="shop-spinner" aria-label="Loading surveys" />
            ) : filteredCatalog.length > 0 ? (
              <>
                <div className="surveys-list" ref={listRef}>
                  {pagedCatalog.map((survey) => (
                    <SurveyRow key={survey._id} survey={survey} onView={openSurvey} />
                  ))}
                </div>
                <div className="shop-foot">
                  <p className="shop-soon">More surveys coming soon</p>
                  {catalogPages > 1 && (
                    <nav className="shop-pager" aria-label="surveys pagination">
                      <button
                        type="button"
                        className="shop-page-prev"
                        onClick={() => setListParams({ page: safePage - 1 })}
                        disabled={safePage === 1}
                      >
                        Previous
                      </button>
                      {pageWindow(safePage, catalogPages).map((pageNum) => (
                        <button
                          key={pageNum}
                          type="button"
                          className={`shop-page-num ${safePage === pageNum ? "is-active" : ""}`}
                          onClick={() => setListParams({ page: pageNum })}
                        >
                          {pageNum}
                        </button>
                      ))}
                      <button
                        type="button"
                        className="shop-page-next"
                        onClick={() => setListParams({ page: safePage + 1 })}
                        disabled={safePage === catalogPages}
                      >
                        Next
                      </button>
                    </nav>
                  )}
                </div>
              </>
            ) : (
              <div className="shop-status">
                <SearchX className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3>No surveys right now</h3>
                <p>
                  {searchDraft.trim()
                    ? "Nothing matches your search. Try clearing it to see all surveys."
                    : dailyCatalog.length > 0
                      ? "No regular surveys right now — check daily surveys below for extra credits."
                      : "New surveys tailored to your profile will appear here when they’re published."}
                </p>
                {searchDraft.trim() ? (
                  <button
                    type="button"
                    className="home-pill home-pill-sm home-pill-navy"
                    onClick={() => setListParams({ q: "", sort: "latest", page: 1 })}
                  >
                    Clear search
                  </button>
                ) : (
                  <button
                    type="button"
                    className="home-pill home-pill-sm home-pill-navy"
                    onClick={() => navigate("/profile")}
                  >
                    Return to profile
                  </button>
                )}
              </div>
            )}

            {!loading && !error && dailyCatalog.length > 0 ? (
              <div className="mt-12 pt-10 border-t border-gray-200">
                <div className="shop-head mb-6">
                  <div>
                    <div className="shop-title-row">
                      <span className="shop-dots" aria-hidden="true">
                        {Array.from({ length: 16 }, (_, i) => (
                          <i key={i} style={{ "--i": i }} />
                        ))}
                      </span>
                      <h2>Want to earn more credits?</h2>
                    </div>
                    <p className="shop-head-copy">
                      Quick daily surveys — credits only, no streak.
                    </p>
                  </div>
                </div>
                <div className="surveys-list">
                  {dailyCatalog.map((survey) => (
                    <SurveyRow key={survey._id} survey={survey} onView={openSurvey} />
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <HomeFooter />
    </div>
  );
}
