import React from "react";
import ChevronRight from "./ChevronRight";
import {ArrowUpRight} from "lucide-react";


const SurveyButton = ({ onClick, label = "Survey", fluid = false }) => (
  <div className={`flex items-center ${fluid ? "flex-1" : ""}`}>
    <button
      onClick={onClick}
      className="text-white rounded-full transition-opacity hover:opacity-85 flex items-center justify-center flex-shrink-0"
      style={{
        backgroundColor: "#3399FF",
        fontFamily: "'Inter', sans-serif",
        fontWeight: 500,
        fontSize: fluid ? "clamp(18px, 4vw, 28px)" : "32px",
        height: "64px",
        width: fluid ? "100%" : "295px",
        paddingInline: "32px",
      }}
    >
      {label}
    </button>
    <button
      onClick={onClick}
      className="w-16 h-16 rounded-full bg-[#0F1A14] flex items-center justify-center hover:opacity-80 transition-opacity shrink-0"
    >
      <ArrowUpRight className="w-10 h-10 text-white" />
    </button>
  </div>
);

export default SurveyButton;