import React from "react";

const EmptyState = ({ icon, text }) => (
  <div className="flex flex-col items-center justify-center py-10 px-5 text-[#6B7A8A] text-[13px] text-center gap-2.5">
    <div className="w-11 h-11 rounded-xl bg-[#F4F7FB] border border-[#EDF2F7] flex items-center justify-center">
      {icon}
    </div>
    <span>{text}</span>
  </div>
);

const RedemptionHistory = ({ items = [] }) => (
  <div className="bg-white border border-[#EDF2F7] rounded-2xl overflow-hidden flex-1">
    <div className="px-5 py-3.5 border-b border-[#EDF2F7]">
      <span className="text-2xl font-semibold text-[#0F1A14]">
        Redemption History
      </span>
    </div>
    {items.length === 0 ? (
      <EmptyState
        icon={
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <rect x="1" y="5" width="18" height="12" rx="2" stroke="#6B7A8A" strokeWidth="1.3" />
            <line x1="1" y1="9" x2="19" y2="9" stroke="#6B7A8A" strokeWidth="1.2" />
          </svg>
        }
        text="No redemptions yet"
      />
    ) : (
      <div className="py-2 px-5">
        {items.map((item) => (
          <div
            key={item._id}
            className="flex items-center justify-between py-3.5 border-b border-[#EDF2F7] last:border-b-0"
          >
            <div>
              <p className="text-sm font-semibold text-[#0F1A14]">{item.label}</p>
              <p className="text-xs text-[#6B7A8A]">{item.date}</p>
            </div>
            <span className="text-sm font-bold text-[#E8472A]">
              -{item.credits} pts
            </span>
          </div>
        ))}
      </div>
    )}
  </div>
);

export default RedemptionHistory;