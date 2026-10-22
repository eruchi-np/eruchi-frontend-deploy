import React from "react";

export const Label = ({ children }) => (
  <label className="block text-[11px] font-semibold tracking-[0.5px] text-[#6B7A8A] uppercase mb-1.5">
    {children}
  </label>
);

export const Input = ({ ...props }) => (
  <input
    {...props}
    className="w-full border border-[#D8E8F5] rounded-xl px-4 py-2.5 text-sm text-[#0F1A14] bg-white outline-none focus:border-[#3399FF] transition-colors"
    style={{ fontFamily: "inherit" }}
  />
);

export const Select = ({ children, ...props }) => (
  <select
    {...props}
    className="w-full border border-[#D8E8F5] rounded-xl px-4 py-2.5 text-sm text-[#0F1A14] bg-white outline-none focus:border-[#3399FF] transition-colors appearance-none"
    style={{ fontFamily: "inherit" }}
  >
    {children}
  </select>
);

export const SectionCard = ({ title, children }) => (
  <div className="bg-white border border-[#EDF2F7] rounded-2xl p-6 mb-5">
    {title && (
      <h3 className="text-[13px] font-bold text-[#0F1A14] tracking-[0.3px] uppercase mb-4 pb-3 border-b border-[#EDF2F7]">
        {title}
      </h3>
    )}
    {children}
  </div>
);
