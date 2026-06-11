// hooks/useSurveyTimer.js
import { useRef, useCallback } from "react";

const useSurveyTimer = () => {
  const surveyStart = useRef(Date.now());
  const questionTimers = useRef({}); // { questionText: { start, total } }
  const activeQuestion = useRef(null);

  const startQuestion = useCallback((questionText) => {
    const now = Date.now();

    // Pause previous
    if (activeQuestion.current && questionTimers.current[activeQuestion.current]) {
      const prev = questionTimers.current[activeQuestion.current];
      prev.total += now - prev.start;
      prev.start = null;
    }

    // Start / resume new
    if (!questionTimers.current[questionText]) {
      questionTimers.current[questionText] = { start: now, total: 0 };
    } else {
      questionTimers.current[questionText].start = now;
    }

    activeQuestion.current = questionText;
  }, []);

  const getTimingData = useCallback(() => {
    const now = Date.now();

    // Flush active
    if (activeQuestion.current && questionTimers.current[activeQuestion.current]?.start) {
      const cur = questionTimers.current[activeQuestion.current];
      cur.total += now - cur.start;
      cur.start = null;
    }

    const questions = Object.entries(questionTimers.current).map(
      ([questionText, { total }]) => ({ questionText, durationMs: total })
    );

    return {
      totalDurationMs: now - surveyStart.current,
      questions,
    };
  }, []);

  return { startQuestion, getTimingData };
};

export default useSurveyTimer;