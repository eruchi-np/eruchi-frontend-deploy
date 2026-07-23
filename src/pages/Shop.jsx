import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronDown,
  SearchX,
  Calendar,
  Hourglass,
} from "lucide-react";
import { userAPI, voucherAPI } from "../services/api";
import VoucherRedeemModal from "../components/widgets/VoucherRedeemModal";
import SearchBar from "../components/widgets/SearchBar";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-hot-toast";
import AnimatedContent from "../components/animations/AnimatedContent";

import vendorPoster1 from "../assets/poster-1.png";
import vendorPoster2 from "../assets/poster-2.png";
import vendorPoster3 from "../assets/poster-3.png";

const VENDOR_POSTERS = [
  { image: vendorPoster1, alt: "Vendor poster 1" },
  { image: vendorPoster2, alt: "Vendor poster 2" },
  { image: vendorPoster3, alt: "Vendor poster 3" },
];

// Matches the homepage heading style for visual cohesion
const headingStyle = {
  fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
  fontSize: "clamp(32px, 5vw, 58px)",
  fontWeight: 500,
  lineHeight: 1.1,
};

const descriptionStyle = {
  fontSize: "clamp(15px, 1.5vw, 20px)",
  fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
  fontWeight: 300,
};

// Simple Durstenfeld shuffle utility
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Vibrant ticket palettes — bg, darker accent, and soft ray color
const TICKET_PALETTES = [
  { bg: "#00704A", accent: "#005C3C", text: "#FFFFFF" }, // green
  { bg: "#E50914", accent: "#B8070F", text: "#FFFFFF" }, // red
  { bg: "#1E88E5", accent: "#1565C0", text: "#FFFFFF" }, // blue
  { bg: "#FB8C00", accent: "#EF6C00", text: "#FFFFFF" }, // orange
  { bg: "#212121", accent: "#000000", text: "#FFFFFF" }, // black
  { bg: "#EC407A", accent: "#D81B60", text: "#FFFFFF" }, // pink
  { bg: "#6A1B9A", accent: "#4A148C", text: "#FFFFFF" }, // purple
  { bg: "#00897B", accent: "#00695C", text: "#FFFFFF" }, // teal
  { bg: "#3949AB", accent: "#283593", text: "#FFFFFF" }, // indigo
  { bg: "#C62828", accent: "#8E0000", text: "#FFFFFF" }, // maroon
];

// Deterministic: same brand name → same color, always
const getBrandPalette = (brandName = "") => {
  let hash = 0;
  for (let i = 0; i < brandName.length; i++) {
    hash = (hash << 5) - hash + brandName.charCodeAt(i);
    hash |= 0;
  }
  return TICKET_PALETTES[Math.abs(hash) % TICKET_PALETTES.length];
};

function VoucherCard({ offer, onRedeem }) {
  const discountLabel =
    offer.discountType === "percentage"
      ? `${offer.discountValue}%`
      : `Rs. ${offer.discountValue}`;

  const stockInfo = useMemo(() => {
    if (offer.totalStock !== null && offer.totalStock !== undefined) {
      return {
        remaining: Math.max(0, offer.totalStock - (offer.totalRedeemed || 0)),
        isMonthly: false,
      };
    }
    if (offer.monthlyStock !== null && offer.monthlyStock !== undefined) {
      const currentLog =
        offer.monthlyRedemptionLog && offer.monthlyRedemptionLog.length > 0
          ? offer.monthlyRedemptionLog[offer.monthlyRedemptionLog.length - 1]
          : null;
      return {
        remaining: Math.max(
          0,
          offer.monthlyStock - (currentLog ? currentLog.count : 0)
        ),
        isMonthly: true,
      };
    }
    return null;
  }, [offer]);

  const formattedDeadline = useMemo(() => {
    if (!offer.validUntil) return null;
    return new Date(offer.validUntil).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }, [offer.validUntil]);

  const isOut = stockInfo !== null && stockInfo.remaining === 0;
  const isLowStock = stockInfo !== null && !isOut && stockInfo.remaining <= 10;
  const brandName =
    offer.business?.brandName || offer.business?.name || "Official Brand";
  const brandLogo = offer.business?.logo || offer.business?.logoUrl || null;
  const palette = useMemo(() => getBrandPalette(brandName), [brandName]);

  return (
    <div
      onClick={() => !isOut && onRedeem(offer)}
      role="button"
      tabIndex={isOut ? -1 : 0}
      aria-disabled={isOut}
      onKeyDown={(e) => {
        if (!isOut && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onRedeem(offer);
        }
      }}
      className={`w-full h-full bg-white flex flex-col group outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded-2xl ${
        isOut ? "cursor-not-allowed opacity-60" : "cursor-pointer"
      }`}
      >
      {/* ── Ticket-style panel ── */}
      <div
        className="relative w-full aspect-square rounded-2xl flex flex-col transition-all duration-300 group-hover:shadow-lg group-hover:-translate-y-1"
        style={{ backgroundColor: palette.bg }}
      >
        {/* Decorative sunburst rays behind the logo */}
        <div
          className="absolute top-[8%] left-1/2 -translate-x-1/2 w-3/4 aspect-square rounded-full opacity-20 pointer-events-none"
          style={{
            background: `repeating-conic-gradient(${palette.accent} 0deg 12deg, transparent 12deg 24deg)`,
          }}
        />

        {/* Top: brand + logo */}
        <div className="flex-[13] relative flex flex-col items-center justify-center gap-2 px-4">
          <span
           className="text-[8px] xs:text-[10px] sm:text-xs font-semibold tracking-[0.2em] sm:tracking-[0.25em] uppercase line-clamp-1"
            style={{ color: palette.text, opacity: 0.9 }}
          >
            {brandName}
          </span>
          <div className="w-[45%] max-w-24 aspect-square rounded-full bg-white flex items-center justify-center shadow-md transition-transform duration-300 group-hover:scale-105">
            {brandLogo ? (
              <img
                src={brandLogo}
                alt={`${brandName} logo`}
                className="max-w-[80%] max-h-[80%] object-contain"
              />
            ) : (
              <span
                className="font-semibold text-3xl sm:text-4xl tracking-tight select-none"
                style={{ color: palette.bg }}
              >
                {brandName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
        </div>

        {/* Perforation row */}
        <div className="relative flex items-center h-0 z-10">
         <span className="absolute -left-2.5 w-5 h-5 bg-white rounded-full -translate-x-1/2" />
         <span className="absolute -right-2.5 w-5 h-5 bg-white rounded-full translate-x-1/2" />
         <div className="w-full mx-3 border-t-2 border-dashed border-white/40" />
       </div>

        {/* Bottom: discount + redeem pill */}
        <div className="flex-[9] relative flex flex-col items-center justify-center gap-2 px-4">
          <div className="flex items-baseline gap-1.5">
            <span
              className="font-bold leading-none text-lg xs:text-xl sm:text-3xl"
              style={{ color: palette.text }}
            >
              {discountLabel}
            </span>
            <span
              className="text-[10px] xs:text-xs sm:text-sm tracking-widest font-medium"
              style={{ color: palette.text, opacity: 0.8 }}
            >
              OFF
            </span>
          </div>
          <span
           className="bg-white text-[10px] xs:text-xs sm:text-sm font-semibold px-3 xs:px-4 sm:px-6 py-1 sm:py-1.5 rounded-full shadow-sm max-w-full transition-transform duration-300 group-hover:scale-105"
             style={{ color: palette.accent }}
           >
            Redeem
          </span>
        </div>

        {isOut && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] flex items-center justify-center rounded-2xl z-20">
            <span className="text-white text-xs font-semibold tracking-widest uppercase">
              Sold Out
            </span>
          </div>
        )}

        {!isOut && stockInfo !== null && isLowStock && (
          <span className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 bg-white text-red-500 text-[9px] sm:text-[10px] font-semibold px-2 py-1 rounded-full shadow-sm z-10">
            {stockInfo.remaining} left
          </span>
        )}
      </div>

      {/* ── Info ── */}
      <div className="pt-3 sm:pt-4 flex flex-col gap-0.5">
        <p className="text-gray-400 text-[9px] sm:text-[11px] font-medium tracking-wide uppercase line-clamp-1">
          {brandName}
        </p>

        <h2 className="text-gray-900 line-clamp-1 text-sm sm:text-base font-medium leading-snug">
          {offer.title}
        </h2>

        <p className="text-gray-500 text-xs sm:text-sm mt-0.5">
          {offer.creditsRequired} credits{" "}
          <span className="text-gray-400">· {discountLabel} off</span>
        </p>

        <div className="flex items-center gap-1 text-gray-400 text-[10px] sm:text-[11px] mt-1.5">
          <Hourglass size={10} />
          <span>Valid {offer.expiryDays} days once claimed</span>
        </div>

        {formattedDeadline && (
          <div className="flex items-center gap-1 text-gray-400 text-[10px] sm:text-[11px]">
            <Calendar size={10} />
            <span>Ends {formattedDeadline}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Shop() {
  const { user } = useAuth();
  const [ready, setReady] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState("default");
  const [category, setCategory] = useState("all");
  const [posterIndex, setPosterIndex] = useState(0);
  const [showIsland, setShowIsland] = useState(false);

  const [voucherOffers, setVoucherOffers] = useState([]);
  const [userCredits, setUserCredits] = useState(0);

 // Trigger floating island entrance instantly on mount
  useEffect(() => {
    // A minimal 20ms delay allows the browser to register the initial hidden state before animating in
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

  // Auto-advance the spotlight deals carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setPosterIndex((prev) => (prev + 1) % VENDOR_POSTERS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    setReady(true);

    const fetchData = async () => {
      try {
        const [offersResult, profileResult] = await Promise.allSettled([
          voucherAPI.getOffers(),
          token
            ? userAPI.getProfile({ skipAuthRedirect: true })
            : Promise.resolve(null),
        ]);

        if (offersResult.status !== "fulfilled") {
          console.error("Fetch Failure:", offersResult.reason);
          setVoucherOffers([]);
          return;
        }

        const offersRes = offersResult.value;
        const responseData = offersRes.data?.data || offersRes.data;
        const targetArray = Array.isArray(responseData) ? responseData : [];

        // Randomize the voucher collection once when loaded
        const randomizedArray = shuffleArray(targetArray);

        setVoucherOffers(randomizedArray);
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
        console.error("Fetch Failure:", err);
        setVoucherOffers([]);
      }
    };
    fetchData();
  }, [user]);

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
      searchPayload: `${offer.title || ""} ${offer.business?.name || ""} ${
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

  if (!ready) return null;

  return (
    <div
      className="min-h-screen bg-white relative"
      style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}
    >

      {/* ── Spotlight deals carousel ── */}
      <div className="relative overflow-hidden" style={{ height: "520px" }}>
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
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search rewards..."
            />

            <div className="grid grid-cols-2 gap-3 w-full">
              <div className="relative">
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
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
                  onChange={(e) => setCategory(e.target.value)}
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
        {filteredCatalog.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 sm:gap-x-8 gap-y-8 sm:gap-y-12 items-stretch">
            {filteredCatalog.map((item) => (
              <div key={item.id} className="w-full">
                <VoucherCard
                  offer={item.originalData}
                  onRedeem={handleSelectOffer}
                />
              </div>
            ))}
          </div>
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
                  setSearch("");
                  setCategory("all");
                  setSortOrder("default");
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
        {filteredCatalog.length > 0 && (
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
        className={`fixed bottom-20 right-6 sm:bottom-24 sm:right-10 z-40 transition-all duration-300 ease-out ${
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