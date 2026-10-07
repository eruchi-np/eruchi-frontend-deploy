import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { sepSurveyAPI, fifteenDaySurveyAPI } from "../services/api";
import {
  ArrowLeft,
  Loader2,
  Award,
} from "lucide-react";
import toast from "react-hot-toast";
import useSurveyTimer from "../hooks/userSurveyTimer";
import { trackHealthEvent, useSurveyVisit } from "../utils/healthEvents";
import { useAuth } from "../context/AuthContext";
import { PROFILE_REFRESH_BLOCKED, PROFILE_REFRESH_BODY, PROFILE_REFRESH_TITLE } from "../utils/profileRefreshCopy";
import { completionFromSubmitResponse, goToSurveyComplete } from "../utils/surveyComplete";
import SurveySubmitConfirm from "../components/survey/SurveySubmitConfirm";
import MatrixQuestion, {
  emptyMatrixValue,
  isMatrixComplete,
} from "../components/survey/MatrixQuestion";
import { SurveyRichText } from "../components/survey/SurveyTextField";
import { plainSurveyText } from "../utils/surveyMarkup";

const StandaloneSurvey = () => {
  const { surveyId } = useParams();
  const [searchParams] = useSearchParams();
  const isSprint = searchParams.get("sprint") === "1";
  const sprintWave = Number(searchParams.get("wave"));
  const navigate = useNavigate();
  const { user } = useAuth();
  const [survey, setSurvey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [responses, setResponses] = useState({});
  const [error, setError] = useState(null);
  const { startQuestion, getTimingData } = useSurveyTimer();
  const surveyRef = useRef(null);
  surveyRef.current = survey;
  const markSurveySaved = useSurveyVisit(surveyId, ({ sessionId }) => {
    const current = surveyRef.current;
    let last = null;
    for (const question of getTimingData().questions || []) {
      const position = current?.questions?.findIndex((item) => plainSurveyText(item.questionText) === question.questionText) ?? -1;
      if (position < 0 || !question.durationMs) continue;
      last = last == null ? position : Math.max(last, position);
      trackHealthEvent("survey_question_answered", {
        refId: surveyId,
        eventId: `q:${surveyId}:${position}:${sessionId}`,
        detail: { position, durationMs: Math.round(question.durationMs), sessionId },
      });
    }
    trackHealthEvent("survey_abandoned", {
      refId: surveyId,
      eventId: `abandon:${surveyId}:${sessionId}`,
      detail: last == null ? { sessionId } : { sessionId, position: last },
    });
  });

  useEffect(() => {
    let cancelled = false;
    const fetchSurvey = async () => {
      setLoading(true);
      setError(null);
      if (user?.profileSurveyBlocked) {
        if (!cancelled) {
          setError(`${PROFILE_REFRESH_BODY} ${PROFILE_REFRESH_BLOCKED}`);
          setLoading(false);
        }
        return;
      }
      try {
        const res = isSprint
          ? await fifteenDaySurveyAPI.getToTake(surveyId, sprintWave)
          : await sepSurveyAPI.getById(surveyId);
        if (cancelled) return;
        setSurvey(res.data.data);

        const initial = {};
        res.data.data.questions.forEach((q) => {
          if (q.questionType === "multiple_checkbox") {
            initial[q.questionText] = [];
          } else if (q.questionType === "slider") {
            initial[q.questionText] = Number.isFinite(Number(q.minValue)) ? Number(q.minValue) : 0;
          } else if (q.questionType === "matrix_radio") {
            initial[q.questionText] = emptyMatrixValue(q.rows || []);
          } else {
            initial[q.questionText] = "";
          }
        });
        if (!cancelled) setResponses(initial);
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || "Failed to load survey");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchSurvey();
    return () => {
      cancelled = true;
    };
  }, [surveyId, isSprint, sprintWave, user?.profileSurveyBlocked]);

  const handleChange = (qText, value) => {
    setResponses((prev) => ({ ...prev, [qText]: value }));
  };

  const handleCheckbox = (qText, option, checked) => {
    const current = Array.isArray(responses[qText]) ? responses[qText] : [];
    const question = survey?.questions?.find((item) => item.questionText === qText);
    const max = Math.max(1, Number(question?.maxSelections) || 1);
    if (checked && !current.includes(option) && current.length >= max) {
      toast.error(max === 1 ? "You can pick one option" : `You can pick up to ${max} options`);
      return;
    }
    setResponses((prev) => {
      const arr = Array.isArray(prev[qText]) ? prev[qText] : [];
      if (!checked) return { ...prev, [qText]: arr.filter((v) => v !== option) };
      if (arr.includes(option) || arr.length >= max) return prev;
      return { ...prev, [qText]: [...arr, option] };
    });
  };

  const handleQuestionFocus = (questionText) => {
    startQuestion(questionText);
  };

  const matrixTouched = (val) =>
    val &&
    typeof val === "object" &&
    !Array.isArray(val) &&
    Object.values(val).some((item) => item != null && item !== "");

  const isComplete = () => {
    return survey.questions.every((q) => {
      const val = responses[q.questionText];
      if (q.isRequired === false) {
        if (q.questionType === "matrix_radio" && matrixTouched(val)) {
          return isMatrixComplete(val, q.rows || []);
        }
        return true;
      }
      if (q.questionType === "multiple_checkbox") return Array.isArray(val) && val.length > 0;
      if (q.questionType === "single_checkbox" || q.questionType === "attention_check") {
        return typeof val === "string" && (q.options || []).includes(val);
      }
      if (q.questionType === "likert") {
        const point = Number(val);
        return Number.isInteger(point) && point >= 1 && point <= (q.options || []).length;
      }
      if (q.questionType === "slider") return true;
      if (q.questionType === "matrix_radio") {
        return isMatrixComplete(val, q.rows || []);
      }
      return val && (typeof val !== "string" || val.trim());
    });
  };

  const requestSubmit = () => {
    if (!isComplete()) {
      toast.error("Please answer all questions");
      return;
    }
    setConfirmOpen(true);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const timingData = getTimingData();
      const previousStreak = user?.streakCount ?? 0;
      const res = isSprint
        ? await fifteenDaySurveyAPI.submit(surveyId, responses, timingData, survey.wave)
        : await sepSurveyAPI.submit(surveyId, responses, timingData);
      setConfirmOpen(false);
      markSurveySaved();
      window.dispatchEvent(new Event("authChange"));
      goToSurveyComplete(
        navigate,
        completionFromSubmitResponse(res, {
          creditsEarned: survey.credits || 0,
          previousStreak,
          kind: survey.kind || "normal",
        })
      );
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-neutral-900" />
      </div>
    );
  if (error)
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center text-neutral-900 p-6 text-center gap-4">
        {user?.profileSurveyBlocked ? <h3>{PROFILE_REFRESH_TITLE}</h3> : null}
        <p>{error}</p>
        {user?.profileSurveyBlocked ? (
          <button
            type="button"
            onClick={() => navigate("/refresh-profile")}
            className="text-white py-3 px-6 rounded-md"
            style={{ backgroundColor: "#134074" }}
          >
            Update profile
          </button>
        ) : null}
      </div>
    );

  return (
    <div className="min-h-screen bg-white pb-24" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="max-w-5xl mx-auto px-4 py-8 sm:py-16">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-neutral-500 mb-8 hover:text-neutral-900 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 mr-2" /> Back
        </button>

        <div className="mb-12">
          <h1 className="text-2xl sm:text-[40px] font-light text-neutral-900 mb-4 break-words">{survey.title}</h1>
          <p className="text-neutral-600 text-lg leading-relaxed">{survey.description}</p>
          {survey.isDailySprint ? (
            <p className="mt-3 text-sm text-neutral-500">
              Daily Sprint · Day {survey.daySlot}
              {survey.wave > 1 ? ` · round ${survey.wave}` : ""}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-6 mt-8 text-sm text-neutral-500 border-t border-neutral-100 pt-6">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4" /> {survey.credits} Credits
            </div>
            {survey.kind === "daily" ? (
              <div className="text-amber-700">Daily survey · credits only, no streak</div>
            ) : null}
          </div>
        </div>

        <div className="space-y-12">
          {survey.questions.map((q, i) => (
            <div
              key={i}
              className="border-b border-neutral-100 pb-12 last:border-0"
              onPointerDown={() => handleQuestionFocus(plainSurveyText(q.questionText))}
              onFocus={() => handleQuestionFocus(plainSurveyText(q.questionText))}
            >
              <h3 className="text-lg font-medium text-neutral-900 mb-6">
                {i + 1}. <SurveyRichText text={q.questionText} />
                {q.isRequired === false && (
                  <span className="ml-2 text-sm font-normal text-neutral-400">(optional)</span>
                )}
              </h3>

              {q.questionType === "text_short" && (
                <input
                  type="text"
                  value={responses[q.questionText] || ""}
                  onChange={(e) => handleChange(q.questionText, e.target.value)}
                  className="w-full p-4 border border-neutral-200 rounded-md focus:border-neutral-900 outline-none transition-colors"
                  placeholder="Your answer..."
                />
              )}

              {q.questionType === "text_long" && (
                <textarea
                  value={responses[q.questionText] || ""}
                  onChange={(e) => handleChange(q.questionText, e.target.value)}
                  className="w-full p-4 border border-neutral-200 rounded-md min-h-[140px] focus:border-neutral-900 outline-none transition-colors"
                  placeholder="Your detailed response..."
                />
              )}

              {(q.questionType === "single_checkbox" || q.questionType === "likert" || q.questionType === "attention_check") && (
                <div className="space-y-3">
                  {q.options.map((opt, optionIndex) => {
                    const stored = q.questionType === "likert" ? String(optionIndex + 1) : opt;
                    return (
                      <label key={optionIndex} className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="radio"
                          name={q.questionText}
                          checked={responses[q.questionText] === stored}
                          onChange={() => handleChange(q.questionText, stored)}
                          className="h-4 w-4 text-neutral-900 border-neutral-300 focus:ring-0"
                        />
                        <span className="text-neutral-600 group-hover:text-neutral-900 transition-colors">{opt}</span>
                      </label>
                    );
                  })}
                </div>
              )}

              {q.questionType === "multiple_checkbox" && (
                <div className="space-y-3">
                  {q.options.map((opt) => (
                    <label key={opt} className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={Array.isArray(responses[q.questionText]) && responses[q.questionText].includes(opt)}
                        onChange={(e) => handleCheckbox(q.questionText, opt, e.target.checked)}
                        className="h-4 w-4 text-neutral-900 border-neutral-300 rounded focus:ring-0"
                      />
                      <span className="text-neutral-600 group-hover:text-neutral-900 transition-colors">{opt}</span>
                    </label>
                  ))}
                </div>
              )}

              {q.questionType === "slider" && (
                <div className="pt-2">
                  <input
                    type="range"
                    min={q.minValue}
                    max={q.maxValue}
                    value={responses[q.questionText] ?? q.minValue}
                    onChange={(e) => handleChange(q.questionText, Number(e.target.value))}
                    className="w-full h-1 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-neutral-900"
                  />
                  <div className="flex justify-between text-xs mt-3 text-neutral-400">
                    <span>{q.minValue}</span>
                    <span className="font-medium text-neutral-900">{responses[q.questionText] ?? q.minValue}</span>
                    <span>{q.maxValue}</span>
                  </div>
                </div>
              )}

              {q.questionType === "matrix_radio" && (
                <MatrixQuestion
                  rows={q.rows || []}
                  columns={q.options || []}
                  value={responses[q.questionText] || {}}
                  onChange={(next) => handleChange(q.questionText, next)}
                  namePrefix={`q-${i}`}
                />
              )}
            </div>
          ))}
        </div>

        <div className="mt-16 pt-8 border-t border-neutral-100">
          <button
            onClick={requestSubmit}
            disabled={submitting}
            className="w-full text-white py-4 px-8 rounded-md font-medium hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            style={{ backgroundColor: "#134074" }}
          >
            {submitting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              "Submit & Earn Credits"
            )}
          </button>
        </div>
      </div>

      <SurveySubmitConfirm
        open={confirmOpen}
        submitting={submitting}
        onCancel={() => !submitting && setConfirmOpen(false)}
        onConfirm={handleSubmit}
      />
    </div>
  );
};

export default StandaloneSurvey;