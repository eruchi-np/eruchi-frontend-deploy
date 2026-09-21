import React, { useState, useMemo, useEffect, useLayoutEffect, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ClipboardList, ChevronDown, Search, SearchX } from "lucide-react";
import { userAPI, voucherAPI } from "../services/api";
import VoucherRedeemModal from "../components/widgets/VoucherRedeemModal";
import RewardCard from "../components/shop/RewardCard";
import CreditArc, { pageWindow } from "../components/shop/CreditArc";
import HomeFooter from "../components/homepage/HomeFooter";
import { flipShopCatalog, initShopCinema, scrollShopToCatalog } from "../components/shop/shopCinema";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-hot-toast";
import { isOfferAvailable } from "../utils/pickSurveyOffers";
import { parsePage, writeSearchParams } from "../utils/searchParams";
import { trackEvent } from "../utils/visitorEvents";
import skyBg from "../assets/home/sky.jpg";
import "../components/homepage/homepage.css";
import "../components/shop/shop.css";

const SHOP_PAGE_SIZE = 6;

export default function Shop() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const pageRef = useRef(null);
  const gridRef = useRef(null);
  const rectsRef = useRef(new Map());
  const lastCatalogPage = useRef(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get("q") || "";
  const sortOrder = searchParams.get("sort") || "latest";
  const catalogPage = parsePage(searchParams.get("page"));
  const [searchDraft, setSearchDraft] = useState(search);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [voucherOffers, setVoucherOffers] = useState([]);
  const [userCredits, setUserCredits] = useState(Number(user?.credits) || 0);
  const [loadingOffers, setLoadingOffers] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [retryTick, setRetryTick] = useState(0);

  const isLoggedIn = Boolean(user);

  const setShopParams = useCallback(
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
      setShopParams({ q: searchDraft, page: 1 });
    }, 300);
    return () => clearTimeout(timer);
  }, [searchDraft, search, setShopParams]);

  useEffect(() => {
    trackEvent("page_view", "/shop");
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
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}${window.location.search}`
      );
    }
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      setLoadingOffers(true);
      setFetchError(null);
      try {
        const [offersResult, profileResult] = await Promise.allSettled([
          voucherAPI.getOffers({
            all: 1,
            skipErrorToast: true,
          }),
          userAPI.getProfile({ skipAuthRedirect: true, skipErrorToast: true }),
        ]);

        if (cancelled) return;

        if (offersResult.status !== "fulfilled") {
          console.error("Fetch Failure:", offersResult.reason);
          setVoucherOffers([]);
          setFetchError("Could not load rewards. Check your connection and try again.");
          return;
        }

        const offersRes = offersResult.value;
        const responseData = offersRes.data?.data || offersRes.data;
        setVoucherOffers(Array.isArray(responseData) ? responseData : []);

        if (profileResult.status === "fulfilled" && profileResult.value) {
          const profileRes = profileResult.value;
          setUserCredits(
            profileRes.data?.data?.user?.credits ??
              profileRes.data?.user?.credits ??
              user?.credits ??
              0
          );
        } else if (profileResult.status === "rejected") {
          setUserCredits(user?.credits || 0);
        }
      } catch (err) {
        if (cancelled) return;
        console.error("Fetch Failure:", err);
        setVoucherOffers([]);
        setFetchError("Could not load rewards. Check your connection and try again.");
      } finally {
        if (!cancelled) setLoadingOffers(false);
      }
    };

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [user, retryTick]);

  useEffect(() => {
    if (!user) {
      setUserCredits(0);
      return;
    }
    if (user.credits != null) {
      setUserCredits(Number(user.credits) || 0);
    }
  }, [user]);

  const handleSelectOffer = (offer, index = 0) => {
    if (!user) {
      toast.error("Please log in to redeem vouchers.");
      navigate("/login");
      return;
    }
    if (!user?.isProfileComplete) {
      toast.error("Complete your profile to redeem vouchers.");
      return;
    }
    setSelectedIndex(index);
    setSelectedOffer(offer);
  };

  const goCatalog = () => {
    scrollShopToCatalog(pageRef.current, { behavior: "smooth" });
  };

  const goSurveys = () => {
    trackEvent("cta_click", "/surveys");
    navigate(isLoggedIn ? "/standalone-surveys" : "/signup");
  };

  const goRewards = () => {
    trackEvent("cta_click", "/rewards");
    scrollShopToCatalog(pageRef.current, { behavior: "smooth" });
  };

  const filteredCatalog = useMemo(() => {
    const q = searchDraft.toLowerCase().replace(/\s/g, "");
    let vouchers = voucherOffers.filter((offer) => {
      if (!offer.validUntil) return true;
      return new Date(offer.validUntil) >= new Date();
    });

    if (q) {
      vouchers = vouchers.filter((offer) =>
        `${offer.title || ""} ${offer.description || ""} ${offer.business?.brandName || ""} ${
          offer.business?.name || ""
        } ${offer.creditsRequired || ""} ${offer.discountValue || ""}`
          .toLowerCase()
          .replace(/\s/g, "")
          .includes(q)
      );
    }

    if (sortOrder === "asc") {
      vouchers = [...vouchers].sort(
        (a, b) => (a.creditsRequired || 0) - (b.creditsRequired || 0)
      );
    } else if (sortOrder === "desc") {
      vouchers = [...vouchers].sort(
        (a, b) => (b.creditsRequired || 0) - (a.creditsRequired || 0)
      );
    } else if (sortOrder === "affordable") {
      const credits = Number(userCredits) || 0;
      vouchers = vouchers
        .filter(
          (offer) =>
            isOfferAvailable(offer) && (Number(offer.creditsRequired) || 0) <= credits
        )
        .sort((a, b) => (a.creditsRequired || 0) - (b.creditsRequired || 0));
    } else {
      vouchers = [...vouchers].sort((a, b) =>
        String(b.createdAt || "").localeCompare(String(a.createdAt || ""))
      );
    }

    return vouchers;
  }, [searchDraft, sortOrder, voucherOffers, userCredits]);

  const listPage = searchDraft === search ? catalogPage : 1;
  const catalogTotal = filteredCatalog.length;
  const hasLiveOffers = voucherOffers.some(
    (offer) => !offer.validUntil || new Date(offer.validUntil) >= new Date()
  );
  const affordableEmpty =
    sortOrder === "affordable" &&
    !String(searchDraft).trim() &&
    catalogTotal === 0 &&
    hasLiveOffers;
  const catalogPages = Math.max(1, Math.ceil(catalogTotal / SHOP_PAGE_SIZE) || 1);
  const safePage = Math.min(listPage, catalogPages);
  const rangeStart = catalogTotal === 0 ? 0 : (safePage - 1) * SHOP_PAGE_SIZE;
  const pagedCatalog = filteredCatalog.slice(rangeStart, rangeStart + SHOP_PAGE_SIZE);
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

  const pageIds = pagedCatalog.map((offer) => offer._id).join();
  useLayoutEffect(() => {
    if (loadingOffers) {
      rectsRef.current = new Map();
      return;
    }
    flipShopCatalog(gridRef.current, rectsRef);
  }, [loadingOffers, pageIds, fetchError]);

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
                    Rewards
                  </button>
                </div>
                <CreditArc credits={userCredits} />
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
                <h2>Rewards Shop</h2>
              </div>
              <p className="shop-head-copy">
                Made for your lunch breaks, weekends, and just because days.
              </p>
            </div>
            <label className="shop-search">
              <span className="sr-only">Search rewards</span>
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
              {loadingOffers
                ? "Loading rewards"
                : catalogTotal === 0
                ? sortOrder === "affordable"
                  ? "Showing 0 affordable rewards"
                  : "Showing 0 rewards"
                : `Showing ${rangeStart + 1}-${rangeEnd} of ${catalogTotal} rewards`}
            </p>
            <label className="shop-sort">
              <span>Sort by:</span>
              <select
                value={sortOrder === "default" ? "latest" : sortOrder}
                onChange={(event) => setShopParams({ sort: event.target.value, page: 1 })}
              >
                <option value="latest">Latest Rewards</option>
                <option value="affordable">Affordable</option>
                <option value="asc">Credits: Low to High</option>
                <option value="desc">Credits: High to Low</option>
              </select>
              <ChevronDown size={14} />
            </label>
          </div>

          {fetchError ? (
            <div className="shop-status">
              <SearchX className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3>Couldn’t load rewards</h3>
              <p>{fetchError}</p>
              <button
                type="button"
                className="home-pill home-pill-sm home-pill-navy"
                onClick={() => setRetryTick((n) => n + 1)}
              >
                Retry
              </button>
            </div>
          ) : loadingOffers ? (
            <div className="shop-spinner" aria-label="Loading rewards" />
          ) : affordableEmpty ? (
            <div className="shop-status">
              <ClipboardList className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3>Nothing you can afford yet</h3>
              <p>
                You don’t have enough credits for these rewards right now.{" "}
                <button type="button" className="shop-status-link" onClick={goSurveys}>
                  Complete a survey
                </button>{" "}
                to earn more, then they’ll show up here.
              </p>
              <button type="button" className="home-pill home-pill-sm home-pill-navy" onClick={goSurveys}>
                Take a survey
              </button>
            </div>
          ) : filteredCatalog.length > 0 ? (
            <>
              <div className="shop-grid" ref={gridRef}>
                {pagedCatalog.map((offer, idx) => (
                  <div key={offer._id} className="shop-grid-item" data-offer-id={offer._id}>
                    <RewardCard
                      offer={offer}
                      index={rangeStart + idx}
                      onRedeem={handleSelectOffer}
                      onViewStore={(businessId) => navigate(`/shop/merchant/${businessId}`)}
                    />
                  </div>
                ))}
              </div>
              <div className="shop-foot">
                <p className="shop-soon">More rewards coming soon</p>
                {catalogPages > 1 && (
                  <nav className="shop-pager" aria-label="rewards pagination">
                    <button
                      type="button"
                      className="shop-page-prev"
                      onClick={() => setShopParams({ page: safePage - 1 })}
                      disabled={safePage === 1}
                    >
                      Previous
                    </button>
                    {pageWindow(safePage, catalogPages).map((pageNum) => (
                      <button
                        key={pageNum}
                        type="button"
                        className={`shop-page-num ${safePage === pageNum ? "is-active" : ""}`}
                        onClick={() => setShopParams({ page: pageNum })}
                      >
                        {pageNum}
                      </button>
                    ))}
                    <button
                      type="button"
                      className="shop-page-next"
                      onClick={() => setShopParams({ page: safePage + 1 })}
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
              <h3>No matching vouchers found</h3>
              <p>
                Nothing matches your search or filters right now. Try clearing them to see all
                rewards.
              </p>
              <button
                type="button"
                className="home-pill home-pill-sm home-pill-navy"
                onClick={() => setShopParams({ q: "", sort: "latest", page: 1 })}
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      </div>
      </div>

      <HomeFooter />

      {selectedOffer && (
        <VoucherRedeemModal
          offer={selectedOffer}
          index={selectedIndex}
          userCredits={userCredits}
          onClose={() => setSelectedOffer(null)}
          onSuccess={() => setSelectedOffer(null)}
        />
      )}
    </div>
  );
}
