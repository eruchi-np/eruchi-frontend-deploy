import React from "react";
import { useNavigate } from "react-router-dom";

const CreditsCard = ({ credits = 0 }) => {
  const navigate = useNavigate();
  return (
    <div
      className="rounded-2xl overflow-hidden p-10 flex flex-col items-center justify-center text-center min-h-[320px]"
      style={{ background: "#134074" }}
    >
      <p className="text-[11px] font-semibold tracking-[1.5px] uppercase text-white/70 mb-4">
        Available Credits
      </p>
      <p
        className="text-[80px] font-extrabold text-white leading-none tracking-[-4px] mb-6"
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        {credits.toLocaleString()}
      </p>
      <button
        onClick={() => navigate("/standalone-surveys")}
        className="px-8 py-3 bg-white/10 backdrop-blur text-white rounded-full text-sm font-medium cursor-pointer border border-white/20 transition-all hover:bg-white/20"
        style={{ fontFamily: "inherit" }}
      >
        Earn Credits
      </button>
    </div>
  );
};

export default CreditsCard;