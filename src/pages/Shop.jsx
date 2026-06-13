import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, Ticket, SearchX, Calendar, Hourglass } from "lucide-react";
import { userAPI, voucherAPI } from "../services/api";
import VoucherRedeemModal from "../components/widgets/VoucherRedeemModal";
import SearchBar from "../components/widgets/SearchBar";
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import AnimatedContent from "../components/animations/AnimatedContent";

const descriptionStyle = {
  fontSize: "clamp(16px, 1.5vw, 20px)",
  fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
  fontWeight: 300,
};

function VoucherCard({ offer, onRedeem }) {
  const discountLabel =
    offer.discountType === "percentage"
      ? `${offer.discountValue}%`
      : `Rs. ${offer.discountValue}`;

  // Calculates exact stock remaining and determines context constraints
  const stockInfo = useMemo(() => {
    if (offer.totalStock !== null && offer.totalStock !== undefined) {
      return {
        remaining: Math.max(0, offer.totalStock - (offer.totalRedeemed || 0)),
        isMonthly: false,
      };
    }
    
    if (offer.monthlyStock !== null && offer.monthlyStock !== undefined) {
      const currentLog = offer.monthlyRedemptionLog && offer.monthlyRedemptionLog.length > 0
        ? offer.monthlyRedemptionLog[offer.monthlyRedemptionLog.length - 1]
        : null;
      const redeemedThisMonth = currentLog ? currentLog.count : 0;
      
      return {
        remaining: Math.max(0, offer.monthlyStock - redeemedThisMonth),
        isMonthly: true,
      };
    }

    return null;
  }, [offer]);

  // Formats date formats elegantly for visualization block interfaces
  const formattedDeadline = useMemo(() => {
    if (!offer.validUntil) return null;
    return new Date(offer.validUntil).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }, [offer.validUntil]);

  const isOut = stockInfo !== null && stockInfo.remaining === 0;
  const isLowStock = stockInfo !== null && stockInfo.remaining <= 10;

  return (
    <div className="w-full h-full cursor-pointer border border-gray-100 bg-white rounded-[16px] sm:rounded-[24px] shadow-sm hover:shadow-md transition-shadow duration-300 p-3 sm:p-5 flex flex-col justify-between group">
      <div>
        {/* Uniform Minimalist Ticket Token Visual Frame */}
        <div className="rounded-xl sm:rounded-2xl mb-3 sm:mb-5 flex flex-col items-center justify-between p-3 sm:p-5 relative w-full overflow-hidden border border-gray-100/60 bg-gray-50/60 h-[110px] sm:h-[160px]">
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-gray-300/40 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-gray-300/40 to-transparent" />
          
          <div className="w-full flex items-center justify-between z-10">
            <Ticket className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 opacity-60" strokeWidth={1.5} />
          </div>

          <div className="text-center z-10 my-auto flex flex-col items-center">
            <span className="text-gray-800 font-medium tracking-wide text-2xl sm:text-[36px] leading-none">
              {offer.creditsRequired}
            </span>
            <span className="text-gray-400 text-[9px] sm:text-xs tracking-wider font-normal mt-1">
              credits
            </span>
          </div>

          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-4 sm:w-3 sm:h-6 bg-white border-r border-gray-100 rounded-r-full" />
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-4 sm:w-3 sm:h-6 bg-white border-l border-gray-100 rounded-l-full" />
        </div>

        {/* Descriptive Typography Info Block */}
        <div className="px-1 mb-4 sm:mb-5 flex flex-col gap-1.5">
          <h2 className="text-gray-800 line-clamp-2 sm:line-clamp-1 group-hover:text-black transition-colors text-sm sm:text-[18px] font-medium leading-snug">
            {offer.title}
          </h2>
          
          <p className="text-gray-500 text-[10px] sm:text-xs font-normal">
            {discountLabel} off
          </p>
          
          <p className="text-gray-400 text-[9px] sm:text-[11px] font-normal line-clamp-1">
            Via {offer.business?.name || "Official Brand"}
          </p>

          <hr className="border-gray-100 my-0.5" />

          {/* Active Structural Expiry Indicators */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1 text-gray-500 text-[9px] sm:text-[11px]">
              <Hourglass size={11} className="text-gray-400" />
              <span>Valid for {offer.expiryDays} days once claimed</span>
            </div>

            {formattedDeadline && (
              <div className="flex items-center gap-1 text-amber-600 text-[9px] sm:text-[11px] font-medium">
                <Calendar size={11} className="text-amber-500" />
                <span>Offer ends: {formattedDeadline}</span>
              </div>
            )}
          </div>

          {/* Live Scarcity Counter Block */}
          {stockInfo !== null && (
            <div className="mt-1 flex items-center gap-1.5">
              <span className="relative flex h-1.5 w-1.5">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isLowStock ? 'bg-red-400' : 'bg-emerald-400'}`}></span>
                <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${isLowStock ? 'bg-red-500' : 'bg-emerald-500'}`}></span>
              </span>
              <span className={`text-[10px] font-semibold tracking-wide ${isLowStock ? 'text-red-500' : 'text-emerald-600'}`}>
                {isOut 
                  ? (stockInfo.isMonthly ? 'Sold out this month' : 'Sold out')
                  : `${stockInfo.remaining} ${stockInfo.remaining === 1 ? 'voucher' : 'vouchers'} left${stockInfo.isMonthly ? ' this month' : ''}`}
              </span>
            </div>
          )}
        </div>
      </div>

      <button
        onClick={() => !isOut && onRedeem(offer)}
        disabled={isOut}
        className={`w-full text-white rounded-full py-2.5 sm:py-3.5 transition-transform font-medium text-[10px] sm:text-xs tracking-wide shadow-sm ${
          isOut 
            ? "bg-gray-300 cursor-not-allowed opacity-80" 
            : "hover:scale-[1.01] active:scale-95"
        }`}
        style={isOut ? {} : { backgroundColor: "#134074" }}
      >
        {isOut ? "Sold Out" : "Redeem Reward"}
      </button>
    </div>
  );
}

export default function Shop() {
  const { user } = useAuth();
  const [ready, setReady] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState("default");
  const [creditRange, setCreditRange] = useState("all");

  const [voucherOffers, setVoucherOffers] = useState([]);
  const [userCredits, setUserCredits] = useState(0);

  const navigate = useNavigate();

  const handleSelectOffer = (offer) => {
    if (!user?.isProfileComplete) {
      toast.error('Complete your profile to redeem vouchers.');
      return;
    }
    setSelectedOffer(offer);
  };

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const storedUser = localStorage.getItem("username");
    if (!token || !storedUser) {
      navigate("/login");
      return;
    }
    setReady(true);

    const fetchData = async () => {
      try {
        const [offersRes, profileRes] = await Promise.all([
          voucherAPI.getOffers(),
          userAPI.getProfile(),
        ]);
        
        const responseData = offersRes.data?.data || offersRes.data;
        const targetArray = Array.isArray(responseData) ? responseData : [];
        
        setVoucherOffers(targetArray);
        setUserCredits(profileRes.data?.data?.user?.credits ?? profileRes.data?.user?.credits ?? 0);
      } catch (err) {
        console.error("Fetch Failure:", err);
      }
    };
    fetchData();
  }, [navigate]);

  const filteredCatalog = useMemo(() => {
    const q = search.toLowerCase().replace(/\s/g, "");

    let vouchers = voucherOffers.map((offer, idx) => ({
      id: offer._id,
      credits: offer.creditsRequired,
      searchPayload: `${offer.title || ""} ${offer.business?.name || ""} ${offer.creditsRequired || ""} ${offer.discountValue || ""}`.toLowerCase().replace(/\s/g, ""),
      originalData: offer,
      index: idx
    }));

    if (q) vouchers = vouchers.filter(item => item.searchPayload.includes(q));

    if (creditRange === "under100") {
      vouchers = vouchers.filter(item => item.credits < 100);
    } else if (creditRange === "100-500") {
      vouchers = vouchers.filter(item => item.credits >= 100 && item.credits <= 500);
    } else if (creditRange === "over500") {
      vouchers = vouchers.filter(item => item.credits > 500);
    }

    if (sortOrder === "asc") vouchers.sort((a, b) => a.credits - b.credits);
    if (sortOrder === "desc") vouchers.sort((a, b) => b.credits - a.credits);

    return vouchers;
  }, [search, sortOrder, creditRange, voucherOffers]);

  if (!ready) return null;

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="max-w-[1314px] mx-auto px-4 sm:px-8 lg:px-10 py-10 lg:py-16">

        {/* Header Block Section */}
        <div className="grid lg:grid-cols-[1fr_460px] gap-8 lg:gap-12 items-start justify-between border-b border-gray-100 pb-10 mb-10 lg:pb-12 lg:mb-12">
          
          <AnimatedContent direction="vertical" distance={40} duration={0.8} className="flex flex-col">
            <h1
              className="text-gray-900 mb-4"
              style={{
                fontSize: "clamp(36px, 5vw, 64px)",
                fontWeight: 300,
                lineHeight: 1.1,
              }}
            >
              Rewards Shop.
            </h1>
            <p
              className="text-gray-700 leading-snug text-justify max-w-xl"
              style={descriptionStyle}
            >
              Exchange your earned credits for vouchers instantly. Complete surveys, build up your balance, and save securely on your favorite spots.
            </p>
          </AnimatedContent>

          <AnimatedContent direction="vertical" distance={40} duration={0.8} delay={0.15} className="flex flex-col gap-4 w-full">
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
                  <option value="default">Ordering</option>
                  <option value="asc">Low → High</option>
                  <option value="desc">High → Low</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
              </div>

              <div className="relative">
                <select
                  value={creditRange}
                  onChange={(e) => setCreditRange(e.target.value)}
                  className="w-full pl-4 lg:pl-5 pr-10 py-3.5 lg:py-4 border border-gray-200 rounded-full text-sm lg:text-base text-gray-900 outline-none transition-colors focus:border-gray-300 bg-white appearance-none cursor-pointer"
                >
                  <option value="all">All Tiers</option>
                  <option value="under100">&lt; 100</option>
                  <option value="100-500">100 — 500</option>
                  <option value="over500">&gt; 500</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
              </div>
            </div>
          </AnimatedContent>
        </div>

        {/* Catalog Layout Core Grid View */}
        {filteredCatalog.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6 items-stretch">
            {filteredCatalog.map((item, index) => (
              <AnimatedContent
                key={item.id}
                direction="vertical"
                distance={30}
                duration={0.6}
                delay={0.1 + (index % 4) * 0.08}
                className="w-full"
              >
                <VoucherCard
                  offer={item.originalData}
                  onRedeem={handleSelectOffer}
                />
              </AnimatedContent>
            ))}
          </div>
        ) : (
          <AnimatedContent direction="vertical" distance={30} duration={0.6}>
            <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-3xl bg-gray-50/50 max-w-2xl mx-auto px-4">
              <SearchX className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-gray-900 text-xl font-medium mb-2">No matching vouchers found</h3>
              <p className="text-gray-500 text-sm max-w-sm mx-auto mb-6">
                No active rewards align with your selected keywords or filtering restrictions. Try modifying parameters.
              </p>
              <button
                onClick={() => {
                  setSearch("");
                  setCreditRange("all");
                  setSortOrder("default");
                }}
                className="px-6 py-3 text-white rounded-full text-xs font-medium transition-transform hover:scale-105"
                style={{ backgroundColor: "#134074" }}
              >
                Reset Filter Settings
              </button>
            </div>
          </AnimatedContent>
        )}

        {/* More Coming Soon Indicator */}
        {filteredCatalog.length > 0 && (
          <AnimatedContent direction="vertical" distance={20} duration={0.6} delay={0.4}>
            <div className="mt-12 sm:mt-16 text-center">
              <p className="text-gray-400 font-medium tracking-wide text-sm sm:text-base">
                More coming soon
              </p>
            </div>
          </AnimatedContent>
        )}

        {/* Global Technical Footer Node */}
        <div className="mt-10 lg:mt-16 border-t border-gray-100 pt-8 text-center">
          <p
            className="text-gray-400 tracking-wide"
            style={{ fontSize: "11px", fontWeight: 300 }}
          >
            Credits are allocated through automated activity confirmation. Redemption processing windows span 3–5 operational cycles.
          </p>
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