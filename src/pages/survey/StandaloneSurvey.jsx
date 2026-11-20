import React from "react";
import {
  PROFILE_REFRESH_TITLE,
} from "../../utils/profileRefreshCopy";
import SurveySubmitConfirm from "../../components/survey/SurveySubmitConfirm";
import { SurveyRichText } from "../../components/survey/SurveyTextField";
import { plainSurveyText } from "../../utils/surveyMarkup";
import skyBg from "../../assets/home/sky.jpg";
import eruchiLogo from "../../assets/eruchi-logo-horizontal.png";
import "../../components/survey/surveyFlow.css";
import { ArrowIcon, CheckIcon, WarnIcon } from "./surveyTake/icons";
import SliderField from "./surveyTake/SliderField";
import MatrixFlow from "./surveyTake/MatrixFlow";
import useStandaloneSurvey from "./surveyTake/useStandaloneSurvey";
import { choiceLabel } from "./surveyTake/validation";
import { questionId } from "../../utils/surveyLogic";

export default function StandaloneSurvey({ previewMode = false, previewSurvey = null, onExitPreview = null }) {
  const {
    user,
    navigate,
    survey,
    loading,
    error,
    submitting,
    confirmOpen,
    setConfirmOpen,
    responses,
    missed,
    showBanner,
    activeIndex,
    questions,
    visibleIdSet,
    logicEnabled,
    previewReward,
    answeredFlags,
    answeredCount,
    requiredLeft,
    optionalUnanswered,
    progressPct,
    nextUnanswered,
    handleChange,
    handleCheckbox,
    handleQuestionFocus,
    scrollToQuestion,
    requestSubmit,
    handleSubmit,
    exitSurvey,
  } = useStandaloneSurvey({ previewMode, previewSurvey, onExitPreview });

  if (loading) {
    return (
      <div className="sf-page min-h-screen flex items-center justify-center bg-white">
        <span className="spin" aria-label="Loading survey" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="sf-page min-h-screen bg-white">
        <div className="sf-status sf-enter">
          <h3>{user?.profileSurveyBlocked ? PROFILE_REFRESH_TITLE : "Couldn’t load survey"}</h3>
          <p>{error}</p>
          {user?.profileSurveyBlocked ? (
            <button
              type="button"
              className="btn navy"
              onClick={() => navigate("/refresh-profile")}
            >
              Update profile
            </button>
          ) : (
            <button type="button" className="btn navy" onClick={() => navigate(-1)}>
              Go back
            </button>
          )}
        </div>
      </div>
    );
  }

  const mins = Number(survey.estimatedMinutes);
  const minutesChip =
    Number.isFinite(mins) && mins > 0
      ? (logicEnabled ? `Up to ${mins} min` : `About ${mins} min`)
      : null;
  const visibleCount = [...visibleIdSet].length;
  const creditLabel = logicEnabled
    ? (previewMode ? previewReward : survey.credits || 0)
    : (survey.credits || 0);
  const creditChip = logicEnabled && !previewMode
    ? `Up to +${survey.credits || 0}`
    : `+${creditLabel}`;

  return (
    <div className="sf-page pg">
      <div className="mstrip">
        <button
          type="button"
          className="x"
          aria-label={previewMode ? "Close preview" : "Exit survey"}
          onClick={exitSurvey}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
        <div className="cnt">
          {answeredCount} of {visibleCount} <span>answered</span>
        </div>
        <span className="pill">{creditChip}</span>
        <div
          className="mbar"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={visibleCount}
          aria-valuenow={answeredCount}
          aria-label="Questions answered"
        >
          <i style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      <header className="band">
        <img className="sky" src={skyBg} alt="" />
        <div className="veil" />
        <div className="band-in">
          <div className="hdr">
            <img src={eruchiLogo} alt="eRuchi" />
            <button
              type="button"
              className="hbtn"
              onClick={exitSurvey}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
              {previewMode ? "Back to editor" : "Exit survey"}
            </button>
          </div>
          <div className="hero sf-enter">
            <div className="hero-h">
              <span className="dots" aria-hidden="true" />
              <h1>{survey.title}</h1>
            </div>
            {survey.description ? <p>{survey.description}</p> : null}
            <div className="chips">
              {survey.isDailySprint ? (
                <span className="chip">
                  Daily Sprint
                  {survey.daySlot != null ? ` · Day ${survey.daySlot}` : ""}
                </span>
              ) : null}
              {survey.kind === "daily" ? <span className="chip">Daily</span> : null}
              {minutesChip ? <span className="chip">{minutesChip}</span> : null}
              <span className="chip">
                {visibleCount} question{visibleCount === 1 ? "" : "s"}
              </span>
              <span className="chip tert">
                {logicEnabled
                  ? `Up to +${survey.credits || 0} Ruchi Credits`
                  : `+${survey.credits || 0} Ruchi Credits on submit`}
              </span>
              {previewMode ? <span className="chip">Preview — nothing is saved</span> : null}
            </div>
          </div>
        </div>
      </header>

      <main className="sheet">
        <div className="sv-wrap">
          <div className="qs">
            {showBanner && missed.size > 0 ? (
              <div className="banner" role="alert">
                <WarnIcon />
                <div>
                  <b>
                    {missed.size} question{missed.size === 1 ? "" : "s"} still need
                    an answer.
                  </b>{" "}
                  <a
                    href={`#sf-q${questions.findIndex((q) => missed.has(q.questionText)) + 1}`}
                    onClick={(event) => {
                      event.preventDefault();
                      const first = questions.findIndex((q) =>
                        missed.has(q.questionText)
                      );
                      if (first >= 0) scrollToQuestion(first);
                    }}
                  >
                    Jump to the first one
                  </a>
                </div>
              </div>
            ) : null}

            {questions.map((q, i) => {
              const qId = `sf-q${i + 1}`;
              const titleId = `${qId}t`;
              const val = responses[q.questionText];
              const isBad = missed.has(q.questionText);
              const optional = q.isRequired === false;
              const isVisible = visibleIdSet.has(questionId(q, i));
              if (!isVisible) return null;
              const visibleNumber = questions
                .slice(0, i + 1)
                .filter((item, idx) => visibleIdSet.has(questionId(item, idx))).length;

              return (
                <section
                  key={q._id || qId}
                  className={`q sf-logic-q${isBad ? " bad" : ""}${
                    q.questionType === "matrix_radio" ? " q-matrix" : ""
                  }`}
                  id={qId}
                  aria-labelledby={titleId}
                  onPointerDown={() =>
                    handleQuestionFocus(plainSurveyText(q.questionText), i)
                  }
                  onFocus={() =>
                    handleQuestionFocus(plainSurveyText(q.questionText), i)
                  }
                >
                  <span className="q-n" aria-hidden="true">
                    {visibleNumber}
                  </span>
                  <div>
                    <h2 className="q-t" id={titleId}>
                      <SurveyRichText text={q.questionText} />
                      {optional ? <span className="tag">Optional</span> : null}
                    </h2>

                    {q.questionType === "multiple_checkbox" ? (
                      <p className="q-h">
                        Choose up to {Math.max(1, Number(q.maxSelections) || 1)}
                        {Array.isArray(val) && val.length > 0 ? (
                          <>
                            {" "}
                            · <b>{val.length} selected</b>
                          </>
                        ) : null}
                      </p>
                    ) : null}

                    <div className="q-b">
                      {(q.questionType === "single_checkbox" ||
                        q.questionType === "attention_check") && (
                        <div className="opts" role="radiogroup" aria-labelledby={titleId}>
                          {(q.options || []).map((opt, optIdx) => {
                            const label = choiceLabel(opt);
                            const on = val === label;
                            return (
                              <label key={opt?.id || `${label}-${optIdx}`} className={`o${on ? " on" : ""}`}>
                                <input
                                  className="sr"
                                  type="radio"
                                  name={qId}
                                  checked={on}
                                  onChange={() => handleChange(q.questionText, label)}
                                />
                                <span className="rb" />
                                <span>{label}</span>
                              </label>
                            );
                          })}
                        </div>
                      )}

                      {q.questionType === "likert" && (
                        <>
                          <div
                            className="lk"
                            role="radiogroup"
                            aria-labelledby={titleId}
                            style={{
                              gridTemplateColumns: `repeat(${Math.max(
                                (q.options || []).length,
                                1
                              )}, minmax(0, 1fr))`,
                            }}
                          >
                            {(q.options || []).map((opt, optionIndex) => {
                              const stored = String(optionIndex + 1);
                              const on = val === stored;
                              const label = choiceLabel(opt);
                              return (
                                <label key={opt?.id || stored} className={on ? "on" : undefined}>
                                  <input
                                    className="sr"
                                    type="radio"
                                    name={qId}
                                    checked={on}
                                    onChange={() =>
                                      handleChange(q.questionText, stored)
                                    }
                                  />
                                  <span>{label}</span>
                                </label>
                              );
                            })}
                          </div>
                          <div
                            className="opts lk-mobile"
                            role="radiogroup"
                            aria-labelledby={titleId}
                          >
                            {(q.options || []).map((opt, optionIndex) => {
                              const stored = String(optionIndex + 1);
                              const on = val === stored;
                              const label = choiceLabel(opt);
                              return (
                                <label
                                  key={`m-${opt?.id || stored}`}
                                  className={`o${on ? " on" : ""}`}
                                >
                                  <input
                                    className="sr"
                                    type="radio"
                                    name={`${qId}-m`}
                                    checked={on}
                                    onChange={() =>
                                      handleChange(q.questionText, stored)
                                    }
                                  />
                                  <span className="rb" />
                                  <span>{label}</span>
                                </label>
                              );
                            })}
                          </div>
                        </>
                      )}

                      {q.questionType === "multiple_checkbox" && (
                        <div
                          className={`opts${(q.options || []).length > 4 ? " two" : ""}`}
                          role="group"
                          aria-labelledby={titleId}
                        >
                          {(q.options || []).map((opt, optIdx) => {
                            const label = choiceLabel(opt);
                            const on = Array.isArray(val) && val.includes(label);
                            return (
                              <label key={opt?.id || `${label}-${optIdx}`} className={`o${on ? " on" : ""}`}>
                                <input
                                  className="sr"
                                  type="checkbox"
                                  checked={on}
                                  onChange={(e) =>
                                    handleCheckbox(
                                      q.questionText,
                                      label,
                                      e.target.checked
                                    )
                                  }
                                />
                                <span className="cb">
                                  <CheckIcon />
                                </span>
                                <span>{label}</span>
                              </label>
                            );
                          })}
                        </div>
                      )}

                      {q.questionType === "slider" && (
                        <SliderField
                          question={q}
                          value={val}
                          labelledBy={titleId}
                          onChange={(next) => handleChange(q.questionText, next)}
                        />
                      )}

                      {q.questionType === "text_short" && (
                        <input
                          className={`tx${isBad ? " bad" : ""}`}
                          type="text"
                          value={val || ""}
                          onChange={(e) =>
                            handleChange(q.questionText, e.target.value)
                          }
                          placeholder="Type your answer"
                          aria-labelledby={titleId}
                        />
                      )}

                      {q.questionType === "text_long" && (
                        <textarea
                          className={`tx${isBad ? " bad" : ""}`}
                          value={val || ""}
                          onChange={(e) =>
                            handleChange(q.questionText, e.target.value)
                          }
                          placeholder="Type your answer"
                          aria-labelledby={titleId}
                        />
                      )}

                      {q.questionType === "matrix_radio" && (
                        <MatrixFlow
                          rows={q.rows || []}
                          columns={q.options || []}
                          value={val || {}}
                          namePrefix={qId}
                          onChange={(next) => handleChange(q.questionText, next)}
                        />
                      )}

                      {isBad ? (
                        <div className="err" role="alert">
                          <WarnIcon />
                          <span>Please answer this question.</span>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </section>
              );
            })}

            <div className="sub">
              <p className="sub-t">
                {requiredLeft > 0 ? (
                  <>
                    <b>
                      {requiredLeft} required question
                      {requiredLeft === 1 ? "" : "s"} left.
                    </b>
                    {optionalUnanswered ? (
                      <>
                        <br />
                        Some optional questions are still open.
                      </>
                    ) : null}
                  </>
                ) : (
                  <b>All required questions answered.</b>
                )}
              </p>
              <button
                type="button"
                className="btn pri"
                onClick={requestSubmit}
                disabled={submitting}
              >
                Submit survey
                <ArrowIcon />
              </button>
            </div>
          </div>

          <aside className="rail" aria-label="Survey progress">
            <h2>Your progress</h2>
            <div className="rail-n">
              <b>
                {answeredCount} of {visibleCount}
              </b>{" "}
              answered
            </div>
            <div
              className="bar"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={visibleCount}
              aria-valuenow={answeredCount}
              aria-label="Questions answered"
            >
              <i style={{ width: `${progressPct}%` }} />
            </div>
            <nav className="jump" aria-label="Jump to question">
              {questions.map((q, i) => {
                if (!visibleIdSet.has(questionId(q, i))) return null;
                const visibleNumber = questions
                  .slice(0, i + 1)
                  .filter((item, idx) => visibleIdSet.has(questionId(item, idx))).length;
                const done = answeredFlags[visibleNumber - 1];
                const bad = missed.has(q.questionText);
                const cur = activeIndex === i;
                const className = [
                  done ? "done" : "",
                  cur ? "cur" : "",
                  bad ? "bad" : "",
                ]
                  .filter(Boolean)
                  .join(" ");
                return (
                  <a
                    key={q._id || i}
                    href={`#sf-q${i + 1}`}
                    className={className || undefined}
                    aria-label={`Question ${visibleNumber}${done ? ", answered" : ""}${
                      q.isRequired === false ? ", optional" : ""
                    }`}
                    aria-current={cur ? "true" : undefined}
                    onClick={(event) => {
                      event.preventDefault();
                      scrollToQuestion(i);
                    }}
                  >
                    {visibleNumber}
                  </a>
                );
              })}
            </nav>
            {nextUnanswered >= 0 ? (
              <a
                className="rail-link"
                href={`#sf-q${(() => {
                  let n = 0;
                  for (let i = 0; i < questions.length; i += 1) {
                    if (!visibleIdSet.has(questionId(questions[i], i))) continue;
                    if (n === nextUnanswered) return i + 1;
                    n += 1;
                  }
                  return 1;
                })()}`}
                onClick={(event) => {
                  event.preventDefault();
                  let n = 0;
                  for (let i = 0; i < questions.length; i += 1) {
                    if (!visibleIdSet.has(questionId(questions[i], i))) continue;
                    if (n === nextUnanswered) {
                      scrollToQuestion(i);
                      return;
                    }
                    n += 1;
                  }
                }}
              >
                Jump to next unanswered
              </a>
            ) : null}
            <p className="rail-note">
              {previewMode
                ? "Preview mode — answers are not saved."
                : "Your answers aren’t saved if you leave before submitting."}
            </p>
            {previewMode && logicEnabled ? (
              <p className="rail-note">
                Reward if submitted now: <b>{previewReward} Ruchi Credits</b>
              </p>
            ) : null}
          </aside>
        </div>
      </main>

      <SurveySubmitConfirm
        open={confirmOpen}
        submitting={submitting}
        answeredCount={answeredCount}
        totalCount={visibleCount}
        credits={logicEnabled ? previewReward : (survey.credits || 0)}
        onCancel={() => !submitting && setConfirmOpen(false)}
        onConfirm={handleSubmit}
      />
    </div>
  );
}
