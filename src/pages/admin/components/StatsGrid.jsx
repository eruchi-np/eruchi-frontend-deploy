import React from "react";

const StatsGrid = ({ stats, NAVY }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {stats.map((stat, index) => (
        <div
          key={index}
          className="rounded-2xl p-6 text-white shadow-sm transition-transform hover:scale-[1.01]"
          style={{ backgroundColor: NAVY }}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-white/15 rounded-xl">
              <stat.icon className="h-6 w-6 text-white" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-bold text-white mb-1">
              {stat.value}
            </p>
            <p className="text-sm font-medium text-white/70">
              {stat.label}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsGrid;