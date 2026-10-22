import React from "react";

function isSurveyOpen(survey) {
  const now = new Date();
  if (survey.isMerchantFeedback) return true;
  if (survey.status !== "published") return false;
  if (survey.startDate && now < new Date(survey.startDate)) return false;
  if (survey.endDate && now > new Date(survey.endDate)) return false;
  return true;
}

function minutesLabel(survey) {
  const mins = Number(survey.estimatedMinutes);
  if (!Number.isFinite(mins) || mins <= 0) return "—";
  return `${mins}Min`;
}

export { isSurveyOpen, minutesLabel };

export default function SurveyRow({ survey, onView, actionLabel }) {
  const expired = !isSurveyOpen(survey);
  const label = actionLabel || (expired ? "closed" : "view");

  return (
    <article
      className={`surveys-row ${expired ? "is-expired" : ""}`}
      data-survey-id={survey._id}
      onClick={() => !expired && onView(survey)}
    >
      <span className="surveys-row-icon" aria-hidden="true" />
      <div className="surveys-row-copy">
        <h3>
          {survey.title}
          {survey.isMerchantFeedback ? (
            <span className="surveys-row-tag">
              {survey.feedbackBusinessName
                ? `Feedback · ${survey.feedbackBusinessName}`
                : "Feedback"}
            </span>
          ) : null}
          {survey.isDailySprint ? (
            <span className="surveys-row-tag">
              Day {survey.daySlot}
              {survey.wave > 1 ? ` · round ${survey.wave}` : ""}
            </span>
          ) : null}
          {survey.kind === "daily" ? (
            <span className="surveys-row-tag">Daily</span>
          ) : null}
        </h3>
        <p>{survey.description}</p>
      </div>
      <div className="surveys-row-meta">
        <span className="surveys-row-time">{minutesLabel(survey)}</span>
        <span className="surveys-row-credits">
          {survey.credits || 0} Ruchi Credits
        </span>
      </div>
      <button
        type="button"
        className="surveys-row-view"
        disabled={expired}
        onClick={(event) => {
          event.stopPropagation();
          onView(survey);
        }}
      >
        {label}
      </button>
    </article>
  );
}
