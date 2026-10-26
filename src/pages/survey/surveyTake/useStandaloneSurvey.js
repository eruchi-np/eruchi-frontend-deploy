import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { fifteenDaySurveyAPI, sepSurveyAPI } from "../../../services/api";
import useSurveyTimer from "../../../hooks/userSurveyTimer";
import { trackHealthEvent, useSurveyVisit } from "../../../utils/healthEvents";
import { useAuth } from "../../../context/AuthContext";
import {
  PROFILE_REFRESH_BLOCKED,
  PROFILE_REFRESH_BODY,
} from "../../../utils/profileRefreshCopy";
import {
  completionFromSubmitResponse,
  goToSurveyComplete,
} from "../../../utils/surveyComplete";
import { emptyMatrixValue } from "../../../components/survey/MatrixQuestion";
import { plainSurveyText } from "../../../utils/surveyMarkup";
import { isQuestionAnswered, isQuestionValid } from "./validation";

export default function useStandaloneSurvey() {
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
  const [missed, setMissed] = useState(() => new Set());
  const [showBanner, setShowBanner] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const { startQuestion, getTimingData } = useSurveyTimer();
  const surveyRef = useRef(null);
  surveyRef.current = survey;
  const markSurveySaved = useSurveyVisit(surveyId, ({ sessionId }) => {
    const current = surveyRef.current;
    let last = null;
    for (const question of getTimingData().questions || []) {
      const position =
        current?.questions?.findIndex(
          (item) => plainSurveyText(item.questionText) === question.questionText
        ) ?? -1;
      if (position < 0 || !question.durationMs) continue;
      last = last == null ? position : Math.max(last, position);
      trackHealthEvent("survey_question_answered", {
        refId: surveyId,
        eventId: `q:${surveyId}:${position}:${sessionId}`,
        detail: {
          position,
          durationMs: Math.round(question.durationMs),
          sessionId,
        },
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
            initial[q.questionText] = null;
          } else if (q.questionType === "matrix_radio") {
            initial[q.questionText] = emptyMatrixValue(q.rows || []);
          } else {
            initial[q.questionText] = "";
          }
        });
        if (!cancelled) setResponses(initial);
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.message || "Couldn’t load this survey.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchSurvey();
    return () => {
      cancelled = true;
    };
  }, [surveyId, isSprint, sprintWave, user?.profileSurveyBlocked]);

  const questions = survey?.questions || [];

  const answeredFlags = useMemo(
    () => questions.map((q) => isQuestionAnswered(q, responses[q.questionText])),
    [questions, responses]
  );
  const answeredCount = answeredFlags.filter(Boolean).length;
  const requiredLeft = questions.filter(
    (q) => q.isRequired !== false && !isQuestionAnswered(q, responses[q.questionText])
  ).length;
  const optionalUnanswered = questions.some(
    (q) => q.isRequired === false && !isQuestionAnswered(q, responses[q.questionText])
  );
  const progressPct =
    questions.length === 0 ? 0 : (answeredCount / questions.length) * 100;
  const nextUnanswered = answeredFlags.findIndex((done) => !done);

  const handleChange = (qText, value) => {
    setResponses((prev) => ({ ...prev, [qText]: value }));
    setMissed((prev) => {
      if (!prev.has(qText)) return prev;
      const next = new Set(prev);
      next.delete(qText);
      return next;
    });
  };

  const handleCheckbox = (qText, option, checked) => {
    const question = questions.find((item) => item.questionText === qText);
    const max = Math.max(1, Number(question?.maxSelections) || 1);
    const current = Array.isArray(responses[qText]) ? responses[qText] : [];
    if (checked && !current.includes(option) && current.length >= max) {
      toast.error(
        max === 1 ? "You can pick one option" : `You can pick up to ${max} options`
      );
      return;
    }
    setResponses((prev) => {
      const arr = Array.isArray(prev[qText]) ? prev[qText] : [];
      if (!checked) return { ...prev, [qText]: arr.filter((v) => v !== option) };
      if (arr.includes(option) || arr.length >= max) return prev;
      return { ...prev, [qText]: [...arr, option] };
    });
    setMissed((prev) => {
      if (!prev.has(qText)) return prev;
      const next = new Set(prev);
      next.delete(qText);
      return next;
    });
  };

  const handleQuestionFocus = (questionText, index) => {
    startQuestion(questionText);
    setActiveIndex(index);
  };

  const scrollToQuestion = (index) => {
    const el = document.getElementById(`sf-q${index + 1}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveIndex(index);
  };

  const requestSubmit = () => {
    const nextMissed = new Set();
    questions.forEach((q) => {
      if (!isQuestionValid(q, responses[q.questionText])) {
        nextMissed.add(q.questionText);
      }
    });
    setMissed(nextMissed);
    if (nextMissed.size > 0) {
      setShowBanner(true);
      const first = questions.findIndex((q) => nextMissed.has(q.questionText));
      if (first >= 0) scrollToQuestion(first);
      return;
    }
    setShowBanner(false);
    setConfirmOpen(true);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const timingData = getTimingData();
      const previousStreak = user?.streakCount ?? 0;
      const payload = { ...responses };
      questions.forEach((q) => {
        if (q.questionType === "slider" && (payload[q.questionText] == null || payload[q.questionText] === "")) {
          // Should not reach here for required; optional untouched stays empty string for API.
          payload[q.questionText] = "";
        }
      });
      const res = isSprint
        ? await fifteenDaySurveyAPI.submit(
            surveyId,
            payload,
            timingData,
            survey.wave
          )
        : await sepSurveyAPI.submit(surveyId, payload, timingData);
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

  const exitSurvey = () => navigate(-1);

  return {
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
  };
}
