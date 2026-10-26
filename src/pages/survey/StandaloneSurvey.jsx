import React from "react";
import {
  PROFILE_REFRESH_TITLE,
} from "../../utils/profileRefreshCopy";
import SurveySubmitConfirm from "../../components/survey/SurveySubmitConfirm";
import { SurveyRichText } from "../../components/survey/SurveyTextField";
import { plainSurveyText } from "../../utils/surveyMarkup";
import skyBg from "../../assets/home/sky.jpg";
import "../../components/survey/surveyFlow.css";
import { ArrowIcon, CheckIcon, WarnIcon } from "./surveyTake/icons";
import SliderField from "./surveyTake/SliderField";
import MatrixFlow from "./surveyTake/MatrixFlow";
import useStandaloneSurvey from "./surveyTake/useStandaloneSurvey";

export default function StandaloneSurvey() {
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
  } = useStandaloneSurvey();

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
    Number.isFinite(mins) && mins > 0 ? `About ${mins} min` : null;

  return (
    <div className="sf-page pg">
      <div className="mstrip">
        <button type="button" className="x" aria-label="Exit survey" onClick={exitSurvey}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
        <div className="cnt">
          {answeredCount} of {questions.length} <span>answered</span>
        </div>
        <span className="pill">+{survey.credits || 0}</span>
        <div
          className="mbar"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={questions.length}
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
            <span className="sr">eRuchi survey</span>
            <span aria-hidden="true" />
            <button type="button" className="hbtn" onClick={exitSurvey}>
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
              Exit survey
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
                {questions.length} question{questions.length === 1 ? "" : "s"}
              </span>
              <span className="chip tert">
                +{survey.credits || 0} Ruchi Credits on submit
              </span>
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

              return (
                <section
                  key={qId}
                  className={`q${isBad ? " bad" : ""}`}
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
                    {i + 1}
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
                          {(q.options || []).map((opt) => {
                            const on = val === opt;
                            return (
                              <label key={opt} className={`o${on ? " on" : ""}`}>
                                <input
                                  className="sr"
                                  type="radio"
                                  name={qId}
                                  checked={on}
                                  onChange={() => handleChange(q.questionText, opt)}
                                />
                                <span className="rb" />
                                <span>{opt}</span>
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
                              return (
                                <label key={stored} className={on ? "on" : undefined}>
                                  <input
                                    className="sr"
                                    type="radio"
                                    name={qId}
                                    checked={on}
                                    onChange={() =>
                                      handleChange(q.questionText, stored)
                                    }
                                  />
                                  <span>{opt}</span>
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
                              return (
                                <label
                                  key={`m-${stored}`}
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
                                  <span>{opt}</span>
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
                          {(q.options || []).map((opt) => {
                            const on = Array.isArray(val) && val.includes(opt);
                            return (
                              <label key={opt} className={`o${on ? " on" : ""}`}>
                                <input
                                  className="sr"
                                  type="checkbox"
                                  checked={on}
                                  onChange={(e) =>
                                    handleCheckbox(
                                      q.questionText,
                                      opt,
                                      e.target.checked
                                    )
                                  }
                                />
                                <span className="cb">
                                  <CheckIcon />
                                </span>
                                <span>{opt}</span>
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
                {answeredCount} of {questions.length}
              </b>{" "}
              answered
            </div>
            <div
              className="bar"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={questions.length}
              aria-valuenow={answeredCount}
              aria-label="Questions answered"
            >
              <i style={{ width: `${progressPct}%` }} />
            </div>
            <nav className="jump" aria-label="Jump to question">
              {questions.map((q, i) => {
                const done = answeredFlags[i];
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
                    key={i}
                    href={`#sf-q${i + 1}`}
                    className={className || undefined}
                    aria-label={`Question ${i + 1}${done ? ", answered" : ""}${
                      q.isRequired === false ? ", optional" : ""
                    }`}
                    aria-current={cur ? "true" : undefined}
                    onClick={(event) => {
                      event.preventDefault();
                      scrollToQuestion(i);
                    }}
                  >
                    {i + 1}
                  </a>
                );
              })}
            </nav>
            {nextUnanswered >= 0 ? (
              <a
                className="rail-link"
                href={`#sf-q${nextUnanswered + 1}`}
                onClick={(event) => {
                  event.preventDefault();
                  scrollToQuestion(nextUnanswered);
                }}
              >
                Jump to next unanswered
              </a>
            ) : null}
            <p className="rail-note">
              Your answers aren’t saved if you leave before submitting.
            </p>
          </aside>
        </div>
      </main>

      <SurveySubmitConfirm
        open={confirmOpen}
        submitting={submitting}
        answeredCount={answeredCount}
        totalCount={questions.length}
        credits={survey.credits || 0}
        onCancel={() => !submitting && setConfirmOpen(false)}
        onConfirm={handleSubmit}
      />
    </div>
  );
}
