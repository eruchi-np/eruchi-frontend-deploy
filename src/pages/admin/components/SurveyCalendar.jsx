import React, { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { dateKey, surveyPublishDate } from "./surveyListUtils";
import { SurveyDetailModal } from "./SurveyDetailBody.jsx";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const startOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1);

const addMonths = (date, delta) => new Date(date.getFullYear(), date.getMonth() + delta, 1);

const monthLabel = (date) =>
  date.toLocaleDateString(undefined, { month: "long", year: "numeric" });

function monthCells(cursor) {
  const first = startOfMonth(cursor);
  const startOffset = first.getDay();
  const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startOffset; i += 1) cells.push(null);
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(cursor.getFullYear(), cursor.getMonth(), day));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export default function SurveyCalendar({ surveys, refetchSurveys, NAVY }) {
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));
  const [selected, setSelected] = useState(null);
  const todayKey = dateKey(new Date());

  const byDay = useMemo(() => {
    const map = new Map();
    (surveys || []).forEach((survey) => {
      const key = dateKey(surveyPublishDate(survey));
      if (!key) return;
      const list = map.get(key) || [];
      list.push(survey);
      map.set(key, list);
    });
    return map;
  }, [surveys]);

  const cells = monthCells(cursor);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="px-4 sm:px-6 py-4 border-b border-gray-200 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Survey calendar</h2>
          <p className="text-sm text-gray-500">Published dates — past and upcoming</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCursor((d) => addMonths(d, -1))}
            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <p className="min-w-[9.5rem] text-center text-sm font-semibold text-gray-900">{monthLabel(cursor)}</p>
          <button
            type="button"
            onClick={() => setCursor((d) => addMonths(d, 1))}
            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50"
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setCursor(startOfMonth(new Date()))}
            className="ml-1 px-3 py-2 rounded-lg text-sm font-medium border border-gray-200 hover:bg-gray-50"
          >
            Today
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 border-b border-gray-100">
        {WEEKDAYS.map((day) => (
          <div key={day} className="px-2 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-gray-400">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {cells.map((day, index) => {
          if (!day) {
            return <div key={`empty-${index}`} className="min-h-[104px] bg-gray-50/60 border-t border-r border-gray-100" />;
          }
          const key = dateKey(day);
          const items = byDay.get(key) || [];
          const isToday = key === todayKey;
          const isPast = key < todayKey;
          return (
            <div
              key={key}
              className={`min-h-[104px] p-1.5 border-t border-r border-gray-100 ${isPast ? "bg-gray-50/40" : "bg-white"}`}
            >
              <div
                className={`w-7 h-7 mb-1 flex items-center justify-center rounded-full text-xs font-semibold ${
                  isToday ? "text-white" : "text-gray-600"
                }`}
                style={isToday ? { backgroundColor: NAVY } : undefined}
              >
                {day.getDate()}
              </div>
              <div className="flex flex-col gap-1">
                {items.map((survey) => (
                  <button
                    key={survey._id}
                    type="button"
                    onClick={() => setSelected(survey)}
                    className="w-full text-left px-1.5 py-1 rounded-md text-[11px] font-medium leading-tight truncate hover:opacity-90"
                    style={{ backgroundColor: "#eef2f7", color: NAVY }}
                    title={survey.title}
                  >
                    {survey.title}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <SurveyDetailModal
        survey={selected}
        NAVY={NAVY}
        refetchSurveys={refetchSurveys}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}
