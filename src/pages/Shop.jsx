import React, { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ChevronDown,
  SearchX,
} from "lucide-react";
import { userAPI, voucherAPI } from "../services/api";
import VoucherRedeemModal from "../components/widgets/VoucherRedeemModal";
import VoucherCard from "../components/shop/VoucherCard";
import SearchBar from "../components/widgets/SearchBar";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-hot-toast";
import AnimatedContent from "../components/animations/AnimatedContent";
import Pagination from "../components/ui/Pagination";
import { parsePage, writeSearchParams } from "../utils/searchParams";

import vendorPoster1 from "../assets/poster-1.webp";
import vendorPoster2 from "../assets/poster-2.webp";
import vendorPoster3 from "../assets/poster-3.webp";

const VENDOR_POSTERS = [
  { image: vendorPoster1, alt: "Vendor poster 1" },
  { image: vendorPoster2, alt: "Vendor poster 2" },
  { image: vendorPoster3, alt: "Vendor poster 3" },
];

// Matches the homepage heading style for visual cohesion
const headingStyle = {
  fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
  fontSize: "clamp(28px, 8vw, 58px)",
  fontWeight: 500,
  lineHeight: 1.15,
};

const descriptionStyle = {
  fontSize: "clamp(15px, 1.5vw, 20px)",
  fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
  fontWeight: 300,
};

const SHOP_PAGE_SIZE = 12;

export default function Shop() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get("q") || "";
  const sortOrder = searchParams.get("sort") || "default";
  const category = searchParams.get("category") || "all";
  const catalogPage = parsePage(searchParams.get("page"));
  const hasClientFilters =
    Boolean(search) || category !== "all" || sortOrder !== "default";

  const setShopParams = (patch) =>
    writeSearchParams(setSearchParams, patch, {
      q: "",
      sort: "default",
      category: "all",
      page: 1,
    });

  const [ready, setReady] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [posterIndex, setPosterIndex] = useState(0);
  const [showIsland, setShowIsland] = useState(false);

  const [voucherOffers, setVoucherOffers] = useState([]);
  const [userCredits, setUserCredits] = useState(0);
  const [loadingOffers, setLoadingOffers] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [retryTick, setRetryTick] = useState(0);
  const [apiTotal, setApiTotal] = useState(0);
  const [apiTotalPages, setApiTotalPages] = useState(1);
  const skipCatalogScroll = useRef(true);

  const fetchPage = hasClientFilters ? 1 : catalogPage;

  useEffect(() => {
    const timer = setTimeout(() => setShowIsland(true), 500);
    return () => clearTimeout(timer);
  }, []);

  const navigate = useNavigate();

  const handleSelectOffer = (offer) => {
    if (!user) {
      toast.error("Please log in to redeem vouchers.");
      navigate("/login");
      return;
    }
    if (!user?.isProfileComplete) {
      toast.error("Complete your profile to redeem vouchers.");
      return;
    }
    setSelectedOffer(offer);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setPosterIndex((prev) => (prev + 1) % VENDOR_POSTERS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    setReady(true);
    let cancelled = false;

    const fetchData = async () => {
      setLoadingOffers(true);
      setFetchError(null);
      try {
        const [offersResult, profileResult] = await Promise.allSettled([
          voucherAPI.getOffers({
            page: fetchPage,
            limit: hasClientFilters ? 100 : SHOP_PAGE_SIZE,
            skipErrorToast: true,
          }),
          token
            ? userAPI.getProfile({ skipAuthRedirect: true, skipErrorToast: true })
            : Promise.resolve(null),
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
        const targetArray = Array.isArray(responseData) ? responseData : [];
        const pagination = offersRes.data?.pagination;

        setVoucherOffers(targetArray);
        setApiTotal(pagination?.total ?? targetArray.length);
        setApiTotalPages(Math.max(1, pagination?.totalPages || 1));

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
          console.warn("Profile fetch failed, continuing with context state.");
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
  }, [user, fetchPage, hasClientFilters, retryTick]);

  const categories = useMemo(() => {
    const found = new Set();
    voucherOffers.forEach((offer) => {
      if (offer.business?.category) found.add(offer.business.category);
    });
    return Array.from(found).sort();
  }, [voucherOffers]);

  const filteredCatalog = useMemo(() => {
    const q = search.toLowerCase().replace(/\s/g, "");

    let vouchers = voucherOffers.map((offer, idx) => ({
      id: offer._id,
      credits: offer.creditsRequired,
      searchPayload: `${offer.title || ""} ${offer.business?.brandName || ""} ${
        offer.creditsRequired || ""
      } ${offer.discountValue || ""}`
        .toLowerCase()
        .replace(/\s/g, ""),
      originalData: offer,
      index: idx,
    }));

    vouchers = vouchers.filter((item) => {
      const validUntil = item.originalData.validUntil;
      if (!validUntil) return true;
      return new Date(validUntil) >= new Date();
    });

    if (q) vouchers = vouchers.filter((item) => item.searchPayload.includes(q));

    if (category !== "all") {
      vouchers = vouchers.filter(
        (item) => item.originalData.business?.category === category
      );
    }

    if (sortOrder === "asc") vouchers.sort((a, b) => a.credits - b.credits);
    if (sortOrder === "desc") vouchers.sort((a, b) => b.credits - a.credits);

    return vouchers;
  }, [search, sortOrder, category, voucherOffers]);

  const catalogPages = hasClientFilters
    ? Math.max(1, Math.ceil(filteredCatalog.length / SHOP_PAGE_SIZE))
    : apiTotalPages;
  const catalogTotal = hasClientFilters ? filteredCatalog.length : apiTotal;
  const pagedCatalog = useMemo(() => {
    if (!hasClientFilters) return filteredCatalog;
    const start = (catalogPage - 1) * SHOP_PAGE_SIZE;
    return filteredCatalog.slice(start, start + SHOP_PAGE_SIZE);
  }, [filteredCatalog, catalogPage, hasClientFilters]);

  useEffect(() => {
    if (skipCatalogScroll.current) {
      skipCatalogScroll.current = false;
      return;
    }
    document.getElementById("rewards-catalog")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, [catalogPage]);

  if (!ready) return null;

  return (
    <div
      className="min-h-screen bg-white relative overflow-x-hidden"
      style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}
    >

      {/* ── Spotlight deals carousel ── */}
      <div className="relative overflow-hidden h-[280px] sm:h-[400px] lg:h-[520px]">
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

        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-10 flex flex-col-reverse sm:flex-row sm:items-end justify-between gap-3 sm:gap-6">
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

          <div className="text-left sm:text-right max-w-full sm:max-w-[480px]">
            <h2 className="text-white mb-2" style={headingStyle}>
              Spotlight <span className="text-blue-400">deals</span> right now
            </h2>
            <p className="text-white/80 mb-5" style={descriptionStyle}>
              Explore our collections of various goods curated to your taste.
            </p>
          </div>
        </div>
      </div>

      <div
        id="rewards-catalog"
        className="max-w-[1314px] mx-auto px-4 sm:px-8 lg:px-10 py-10 lg:py-16"
      >
        {/* Header Block Section */}
        <div className="grid lg:grid-cols-[1fr_460px] gap-8 lg:gap-12 items-start justify-between border-b border-gray-100 pb-10 mb-10 lg:pb-12 lg:mb-12">
          <AnimatedContent
            direction="vertical"
            distance={40}
            duration={0.8}
            className="flex flex-col"
          >
            <h1 className="text-gray-900 mb-4" style={headingStyle}>
              Rewards <span className="text-blue-600">Shop</span>.
            </h1>
            <p
              className="text-gray-700 leading-snug max-w-xl"
              style={descriptionStyle}
            >
              Exchange your earned credits for vouchers instantly. Complete
              surveys, build up your balance, and save securely on your
              favorite spots.
            </p>
          </AnimatedContent>

          <AnimatedContent
            direction="vertical"
            distance={40}
            duration={0.8}
            delay={0.15}
            className="flex flex-col gap-4 w-full"
          >
            <SearchBar
              value={search}
              onChange={(e) => setShopParams({ q: e.target.value, page: 1 })}
              placeholder="Search rewards..."
            />

            <div className="grid grid-cols-2 gap-3 w-full">
              <div className="relative">
                <select
                  value={sortOrder}
                  onChange={(e) => setShopParams({ sort: e.target.value, page: 1 })}
                  className="w-full pl-4 lg:pl-5 pr-10 py-3.5 lg:py-4 border border-gray-200 rounded-full text-sm lg:text-base text-gray-900 outline-none transition-colors focus:border-gray-300 bg-white appearance-none cursor-pointer"
                >
                  <option value="default">Sort by</option>
                  <option value="asc">Credits: Low to High</option>
                  <option value="desc">Credits: High to Low</option>
                </select>
                <ChevronDown
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  size={16}
                />
              </div>

              <div className="relative">
                <select
                  value={category}
                  onChange={(e) => setShopParams({ category: e.target.value, page: 1 })}
                  className="w-full pl-4 lg:pl-5 pr-10 py-3.5 lg:py-4 border border-gray-200 rounded-full text-sm lg:text-base text-gray-900 outline-none transition-colors focus:border-gray-300 bg-white appearance-none cursor-pointer"
                >
                  <option value="all">All categories</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  size={16}
                />
              </div>
            </div>
          </AnimatedContent>
        </div>

        {/* Catalog Layout Core Grid View */}
        {fetchError ? (
          <AnimatedContent direction="vertical" distance={30} duration={0.6}>
            <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-3xl bg-gray-50/50 max-w-2xl mx-auto px-4">
              <SearchX className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-gray-900 text-xl font-medium mb-2">
                Couldn’t load rewards
              </h3>
              <p className="text-gray-500 text-sm max-w-sm mx-auto mb-6">
                {fetchError}
              </p>
              <button
                onClick={() => setRetryTick((n) => n + 1)}
                className="px-6 py-3 text-white rounded-full text-sm font-medium transition-opacity hover:opacity-90"
                style={{ backgroundColor: "#134074" }}
              >
                Retry
              </button>
            </div>
          </AnimatedContent>
        ) : loadingOffers ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
          </div>
        ) : filteredCatalog.length > 0 ? (
          <>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 sm:gap-x-8 gap-y-8 sm:gap-y-12 items-stretch">
            {pagedCatalog.map((item) => (
              <div key={item.id} className="w-full">
                <VoucherCard
                  offer={item.originalData}
                  onRedeem={handleSelectOffer}
                  onViewStore={(businessId) => navigate(`/shop/merchant/${businessId}`)}
                />
              </div>
            ))}
          </div>
          <Pagination
            page={catalogPage}
            totalPages={catalogPages}
            total={catalogTotal}
            pageSize={SHOP_PAGE_SIZE}
            onChange={(nextPage) => setShopParams({ page: nextPage })}
            label="rewards"
          />
          </>
        ) : (
          <AnimatedContent direction="vertical" distance={30} duration={0.6}>
            <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-3xl bg-gray-50/50 max-w-2xl mx-auto px-4">
              <SearchX className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-gray-900 text-xl font-medium mb-2">
                No matching vouchers found
              </h3>
              <p className="text-gray-500 text-sm max-w-sm mx-auto mb-6">
                Nothing matches your search or filters right now. Try
                clearing them to see all rewards.
              </p>
              <button
                onClick={() => {
                  setShopParams({ q: "", category: "all", sort: "default", page: 1 });
                }}
                className="px-6 py-3 text-white rounded-full text-sm font-medium transition-opacity hover:opacity-90"
                style={{ backgroundColor: "#134074" }}
              >
                Clear filters
              </button>
            </div>
          </AnimatedContent>
        )}

        {/* More Coming Soon Indicator */}
        {!fetchError && !loadingOffers && filteredCatalog.length > 0 && (
          <AnimatedContent
            direction="vertical"
            distance={20}
            duration={0.6}
            delay={0.4}
          >
            <div className="mt-12 sm:mt-16 text-center">
              <p className="text-gray-400 font-medium tracking-wide text-sm sm:text-base">
                More coming soon
              </p>
            </div>
          </AnimatedContent>
        )}

        {/* Global Technical Footer Node */}
        <div className="mt-10 lg:mt-16 border-t border-gray-100 pt-8 text-center">
        </div>
      </div>

      {/* ── Floating Island Widget ── */}
      <div 
        onClick={() => {
          if (!user) navigate("/login");
        }}
        className={`fixed bottom-24 right-4 sm:bottom-24 sm:right-10 z-40 transition-all duration-300 ease-out ${
          !user ? "cursor-pointer" : ""
        }`}
        style={{
          opacity: showIsland ? 1 : 0,
          transform: showIsland ? "translateY(0) scale(1)" : "translateY(24px) scale(0.92)",
          pointerEvents: showIsland ? "auto" : "none",
        }}
      >
        <div 
          className="flex flex-col items-center justify-center min-w-[110px] sm:min-w-[130px] px-6 py-3.5 rounded-full shadow-2xl transition-transform duration-300 hover:scale-[1.04]"
          style={{ backgroundColor: "rgb(19, 64, 116)" }}
        >
          <span className="text-xl sm:text-2xl tracking-tight text-[#ffffff] leading-none mb-1">
            {user ? userCredits : "LOGIN"}
          </span>
          <span className="text-[10px] sm:text-[11px] tracking-widest text-gray-300 uppercase leading-none">
            {user ? "CREDITS" : "TO CLAIM"}
          </span>
        </div>
      </div>

      {selectedOffer && (
        <VoucherRedeemModal
          offer={selectedOffer}
          userCredits={userCredits}
          onClose={() => setSelectedOffer(null)}
          onSuccess={() => setSelectedOffer(null)}
        />
      )}
    </div>
  );
}