import React from "react";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const EmptyState = ({ icon, text }) => (
  <div className="flex flex-col items-center justify-center py-10 px-5 text-[#6B7A8A] text-[13px] text-center gap-2.5">
    <div className="w-11 h-11 rounded-xl bg-[#F4F7FB] border border-[#EDF2F7] flex items-center justify-center">
      {icon}
    </div>
    <span>{text}</span>
  </div>
);

const SurveyRow = ({ survey }) => {
  const navigate = useNavigate();
  return (
    <div
      className="flex items-center gap-3.5 py-3.5 border-b border-[#EDF2F7] last:border-b-0 cursor-pointer hover:opacity-80"
      onClick={() => navigate(`/standalone-survey/${survey._id}`)}
    >
      <div className="w-[42px] h-[42px] rounded-xl bg-[#F4F7FB] border border-[#EDF2F7] flex items-center justify-center shrink-0">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <rect
            x="2"
            y="1"
            width="16"
            height="18"
            rx="2"
            stroke="#6B7A8A"
            strokeWidth="1.3"
          />
          <line
            x1="6"
            y1="6"
            x2="14"
            y2="6"
            stroke="#6B7A8A"
            strokeWidth="1.1"
          />
          <line
            x1="6"
            y1="10"
            x2="12"
            y2="10"
            stroke="#6B7A8A"
            strokeWidth="1.1"
          />
        </svg>
      </div>
      <div className="flex-1">
        <div className="flex gap-2 items-center mb-0.5 flex-wrap">
          <span className="text-sm font-semibold text-[#0F1A14]">
            {survey.title}
          </span>
          {survey.isMandatory && (
            <span className="bg-[#FEE2E2] text-[#c0392b] text-[10px] font-semibold px-2 py-0.5 rounded-full">
              Mandatory
            </span>
          )}
        </div>
        <div className="text-xs text-[#6B7A8A]">
          {survey.description}
          {survey.endDate && (
            <span className="ml-2">
              · Ends {new Date(survey.endDate).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path
          d="M5 3l4 4-4 4"
          stroke="#6B7A8A"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
};

const AvailableSurveys = ({ surveys = [], loading = false }) => (
  <div className="bg-white border border-[#EDF2F7] rounded-2xl overflow-hidden">
    <div className="px-5 py-3.5 border-b border-[#EDF2F7] flex items-center justify-between">
      <span className="text-2xl font-semibold text-[#0F1A14]">
        Available Surveys
      </span>
      {!loading && surveys.length > 0 && (
        <span className="bg-[#F4F7FB] text-[#6B7A8A] text-[11px] font-semibold px-[11px] py-1 rounded-full">
          {surveys.length} available
        </span>
      )}
    </div>
    <div className={loading || surveys.length === 0 ? "" : "py-2 px-5"}>
      {loading ? (
        <EmptyState
          icon={
            <Loader2
              className="w-5 h-5 text-[#3399FF]"
              style={{ animation: "spin 1s linear infinite" }}
            />
          }
          text="Loading surveys..."
        />
      ) : surveys.length === 0 ? (
        <EmptyState
          icon={
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
            >
              <rect
                x="2"
                y="1"
                width="16"
                height="18"
                rx="2"
                stroke="#6B7A8A"
                strokeWidth="1.3"
              />
              <line
                x1="6"
                y1="6"
                x2="14"
                y2="6"
                stroke="#6B7A8A"
                strokeWidth="1.1"
              />
              <line
                x1="6"
                y1="10"
                x2="12"
                y2="10"
                stroke="#6B7A8A"
                strokeWidth="1.1"
              />
            </svg>
          }
          text="No surveys available right now"
        />
      ) : (
        surveys.map((survey) => (
          <SurveyRow key={survey._id} survey={survey} />
        ))
      )}
    </div>
  </div>
);

export default AvailableSurveys;