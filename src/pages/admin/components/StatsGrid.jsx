import React from "react";
import { useNavigate } from "react-router-dom";

const StatsGrid = ({ stats, NAVY }) => {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
      {stats.map((stat) => {
        const content = (
          <>
            <div className="flex items-start justify-between mb-3">
              <div className="p-2.5 bg-white/15 rounded-xl">
                <stat.icon className="h-5 w-5 text-white" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-white mb-1">{stat.value}</p>
            <p className="text-sm font-medium text-white/70">{stat.label}</p>
          </>
        );

        if (stat.to) {
          return (
            <button
              key={stat.label}
              type="button"
              onClick={() => navigate(stat.to)}
              className="rounded-2xl p-5 text-left text-white shadow-sm hover:scale-[1.01] transition-transform"
              style={{ backgroundColor: NAVY }}
            >
              {content}
            </button>
          );
        }

        return (
          <div
            key={stat.label}
            className="rounded-2xl p-5 text-white shadow-sm"
            style={{ backgroundColor: NAVY }}
          >
            {content}
          </div>
        );
      })}
    </div>
  );
};

export default StatsGrid;
