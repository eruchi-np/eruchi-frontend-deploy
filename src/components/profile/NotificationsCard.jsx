// src/components/profile/NotificationsCard.jsx
import React from "react";

const NotificationsCard = () => (
  <div className="bg-white border border-[#EDF2F7] rounded-2xl overflow-hidden">
    <div className="px-5 py-3.5 border-b border-[#EDF2F7] flex items-center justify-between">
      <span className="text-2xl font-semibold text-[#0F1A14]">
        Notifications
      </span>
      <span className="text-[13px] text-[#6B7A8A]">Last 7 days</span>
    </div>
    <div className="p-5">
      <div className="bg-white border border-[#EDF2F7] rounded-xl py-4 px-[18px]">
        <div className="text-[15px] font-bold text-[#0F1A14] mb-1">
          Welcome to eRuchi!
        </div>
        <div className="text-xs text-[#6B7A8A] mb-2">
          {new Date().toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </div>
        <div className="text-[13px] text-[#6B7A8A] leading-relaxed">
          Start exploring campaigns and earn credits.
        </div>
      </div>
    </div>
  </div>
);

export default NotificationsCard;