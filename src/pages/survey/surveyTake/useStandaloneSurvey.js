import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { fifteenDaySurveyAPI, sepSurveyAPI } from "../../../services/api";
import useSurveyTimer from "../../../hooks/userSurveyTimer";
import { healthSessionId, trackHealthEvent, useSurveyVisit } from "../../../utils/healthEvents";
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
import {
  answersByIdFromTextResponses,
  computeLogicCredits,
  countAnsweredVisible,
  evaluateSurveyLogic,
  filterResponsesToVisible,
  questionId,
  surveyHasLogic,
} from "../../../utils/surveyLogic";
import {
  isNoneExclusiveOption,
  isQuestionAnswered,
  isQuestionValid,
} from "./validation";

export default function useStandaloneSurvey({
  previewMode = false,
  previewSurvey = null,
  onExitPreview = null,
} = {}) {
  const { surveyId } = useParams();
  const [searchParams] = useSearchParams();
  const isSprint = searchParams.get("sprint") === "1";
  const sprintWave = Number(searchParams.get("wave"));
  const navigate = useNavigate();
  const { user } = useAuth();

  const [survey, setSurvey] = useState(previewMode ? previewSurvey : null);
  const [loading, setLoading] = useState(!previewMode);
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
  const markSurveySaved = useSurveyVisit(previewMode ? null : surveyId, ({ sessionId }) => {
    if (previewMode) return;
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

  // Preview: seed answers once on mount. Updating the survey definition must not wipe answers
  // (parent formData changes would otherwise reset logic mid-test).
  useEffect(() => {
    if (!previewMode || !previewSurvey) return undefined;
    setSurvey(previewSurvey);
    const initial = {};
    (previewSurvey.questions || []).forEach((q) => {
      if (q.questionType === "multiple_checkbox") initial[q.questionText] = [];
      else if (q.questionType === "slider") initial[q.questionText] = null;
      else if (q.questionType === "matrix_radio") {
        initial[q.questionText] = emptyMatrixValue(q.rows || []);
      } else initial[q.questionText] = "";
    });
    setResponses(initial);
    setLoading(false);
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only seed for preview
  }, [previewMode]);

  useEffect(() => {
    if (!previewMode || !previewSurvey) return;
    setSurvey(previewSurvey);
  }, [previewMode, previewSurvey]);

  useEffect(() => {
    if (previewMode) return undefined;

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
          ? await fifteenDaySurveyAPI.getToTake(surveyId, sprintWave, { skipErrorToast: true })
          : await sepSurveyAPI.getById(surveyId, { skipErrorToast: true });
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
          if (err.response?.data?.data?.isPoll) {
            navigate("/standalone-surveys", { replace: true });
            return;
          }
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
  }, [surveyId, isSprint, sprintWave, user?.profileSurveyBlocked, previewMode, navigate]);

  const questions = survey?.questions || [];
  const logicEnabled = Boolean(survey?.hasLogic) || surveyHasLogic(questions);

  const logicState = useMemo(() => {
    const answersById = answersByIdFromTextResponses(questions, responses);
    return evaluateSurveyLogic(questions, answersById);
  }, [questions, responses]);

  const visibleIdSet = useMemo(() => new Set(logicState.visibleIds), [logicState.visibleIds]);

  const visibleQuestions = useMemo(
    () => questions.filter((q, i) => visibleIdSet.has(questionId(q, i))),
    [questions, visibleIdSet]
  );

  const answeredFlags = useMemo(
    () =>
      visibleQuestions.map((q) => isQuestionAnswered(q, responses[q.questionText])),
    [visibleQuestions, responses]
  );
  const answeredCount = answeredFlags.filter(Boolean).length;
  const requiredLeft = visibleQuestions.filter(
    (q) => q.isRequired !== false && !isQuestionAnswered(q, responses[q.questionText])
  ).length;
  const optionalUnanswered = visibleQuestions.some(
    (q) => q.isRequired === false && !isQuestionAnswered(q, responses[q.questionText])
  );
  const progressPct =
    visibleQuestions.length === 0 ? 0 : (answeredCount / visibleQuestions.length) * 100;
  const nextUnanswered = answeredFlags.findIndex((done) => !done);

  const previewReward = useMemo(() => {
    if (!logicEnabled) return survey?.credits || 0;
    const answersById = answersByIdFromTextResponses(questions, responses);
    const answered = countAnsweredVisible(questions, answersById, logicState.visibleIds);
    return computeLogicCredits(survey?.credits || 0, answered, questions.length);
  }, [logicEnabled, survey?.credits, questions, responses, logicState.visibleIds]);

  const scrollToQuestion = (index) => {
    const el = document.getElementById(`sf-q${index + 1}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveIndex(index);
  };

  const maybeAdvanceAfter = (qText, nextResponses) => {
    const index = questions.findIndex((item) => item.questionText === qText);
    if (index < 0) return;
    const question = questions[index];
    const value = nextResponses[qText];
    if (!isQuestionAnswered(question, value)) return;

    const type = question.questionType;
    if (type === "text_short" || type === "text_long") return;
    if (type === "multiple_checkbox") {
      const max = Math.max(1, Number(question.maxSelections) || 1);
      const picked = Array.isArray(value) ? value.length : 0;
      if (picked < max) return;
    }

    const answersById = answersByIdFromTextResponses(questions, nextResponses);
    const nextLogic = evaluateSurveyLogic(questions, answersById);
    const nextVisible = new Set(nextLogic.visibleIds);

    const nextIndex = questions.findIndex(
      (item, i) =>
        i > index
        && nextVisible.has(questionId(item, i))
        && !isQuestionAnswered(item, nextResponses[item.questionText])
    );
    if (nextIndex < 0) return;
    window.setTimeout(() => scrollToQuestion(nextIndex), 180);
  };

  const handleChange = (qText, value) => {
    setResponses((prev) => {
      const next = { ...prev, [qText]: value };
      maybeAdvanceAfter(qText, next);
      return next;
    });
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
    const pickingNone = isNoneExclusiveOption(option);

    setResponses((prev) => {
      const arr = Array.isArray(prev[qText]) ? prev[qText] : [];
      let nextVal = arr;

      if (!checked) {
        nextVal = arr.filter((v) => v !== option);
      } else if (pickingNone) {
        nextVal = arr.includes(option) ? arr : [option];
      } else {
        const withoutNone = arr.filter((v) => !isNoneExclusiveOption(v));
        if (withoutNone.includes(option)) return prev;
        if (withoutNone.length >= max) {
          toast.error(
            max === 1
              ? "You can pick one option"
              : `You can pick up to ${max} options`
          );
          return prev;
        }
        nextVal = [...withoutNone, option];
      }

      const next = { ...prev, [qText]: nextVal };
      maybeAdvanceAfter(qText, next);
      return next;
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

  const requestSubmit = () => {
    if (previewMode) {
      toast.success(`Preview only — would earn ${previewReward} Ruchi Credits. Nothing was saved.`);
      return;
    }
    const nextMissed = new Set();
    visibleQuestions.forEach((q) => {
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
    if (previewMode) return;
    setSubmitting(true);
    try {
      const timingData = getTimingData();
      const previousStreak = user?.streakCount ?? 0;
      const payload = filterResponsesToVisible(
        questions,
        responses,
        logicState.visibleIds
      );
      questions.forEach((q, i) => {
        if (!visibleIdSet.has(questionId(q, i))) return;
        if (q.questionType === "slider" && (payload[q.questionText] == null || payload[q.questionText] === "")) {
          payload[q.questionText] = "";
        }
      });
      const sessionId = healthSessionId() || undefined;
      const res = isSprint
        ? await fifteenDaySurveyAPI.submit(
            surveyId,
            payload,
            timingData,
            survey.wave,
            sessionId
          )
        : await sepSurveyAPI.submit(surveyId, payload, timingData, sessionId);
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

  const exitSurvey = () => {
    if (previewMode && typeof onExitPreview === "function") {
      onExitPreview();
      return;
    }
    navigate(-1);
  };

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
    visibleQuestions,
    visibleIdSet,
    logicState,
    logicEnabled,
    previewMode,
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
  };
}
