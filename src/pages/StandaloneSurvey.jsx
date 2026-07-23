import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { sepSurveyAPI } from "../services/api";
import {
  ArrowLeft,
  Loader2,
  Award,
} from "lucide-react";
import toast from "react-hot-toast";
import useSurveyTimer from "../hooks/userSurveyTimer";

const StandaloneSurvey = () => {
  const { surveyId } = useParams();
  const navigate = useNavigate();
  const [survey, setSurvey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [responses, setResponses] = useState({});
  const [error, setError] = useState(null);
  const { startQuestion, getTimingData } = useSurveyTimer();

  useEffect(() => {
    const fetchSurvey = async () => {
      try {
        const res = await sepSurveyAPI.getById(surveyId);
        setSurvey(res.data.data);

        const initial = {};
        res.data.data.questions.forEach((q) => {
          initial[q.questionText] =
            q.questionType === "multiple_checkbox"
              ? []
              : q.questionType === "slider"
                ? q.minValue || 0
                : "";
        });
        setResponses(initial);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load survey");
      } finally {
        setLoading(false);
      }
    };

    fetchSurvey();
  }, [surveyId]);

  const handleChange = (qText, value) => {
    setResponses((prev) => ({ ...prev, [qText]: value }));
  };

  const handleCheckbox = (qText, option, checked) => {
    setResponses((prev) => {
      const arr = prev[qText] || [];
      return {
        ...prev,
        [qText]: checked ? [...arr, option] : arr.filter((v) => v !== option),
      };
    });
  };

  const handleQuestionFocus = (questionText) => {
    startQuestion(questionText);
  };

  const isComplete = () => {
    return survey.questions.every((q) => {
      const val = responses[q.questionText];
      if (q.questionType === "multiple_checkbox") return val?.length > 0;
      if (q.questionType === "slider") return true;
      return val && (typeof val !== "string" || val.trim());
    });
  };

  const redirectAfterSurvey = async () => {
    try {
      const res = await sepSurveyAPI.getAll();
      const allSurveys = res.data?.data || res.data || [];
      const remainingSurveys = allSurveys.filter(
        (s) => (s._id || s.id) !== surveyId
      );

      if (remainingSurveys.length > 0) {
        navigate("/surveys");
      } else {
        navigate("/profile");
      }
    } catch (err) {
      navigate("/profile");
    }
  };

  const handleSubmit = async () => {
    if (!isComplete()) {
      toast.error("Please answer all questions");
      return;
    }

    setSubmitting(true);
    try {
      const timingData = getTimingData();
      await sepSurveyAPI.submit(surveyId, responses, timingData);
      toast.success(`Completed! +${survey.credits} credits added`);
      await redirectAfterSurvey();
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
      <div className="min-h-screen bg-white flex items-center justify-center text-neutral-900 p-6">
        {error}
      </div>
    );

  return (
    <div className="min-h-screen bg-white pb-24" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="max-w-3xl mx-auto px-4 py-16">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-neutral-500 mb-8 hover:text-neutral-900 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 mr-2" /> Back
        </button>

        <div className="mb-12">
          <h1 className="text-[40px] font-light text-neutral-900 mb-4">{survey.title}</h1>
          <p className="text-neutral-600 text-lg leading-relaxed">{survey.description}</p>

          <div className="flex flex-wrap gap-6 mt-8 text-sm text-neutral-500 border-t border-neutral-100 pt-6">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4" /> {survey.credits} Credits
            </div>
          </div>
        </div>

        <div className="space-y-12">
          {survey.questions.map((q, i) => (
            <div
              key={i}
              className="border-b border-neutral-100 pb-12 last:border-0"
              onPointerDown={() => handleQuestionFocus(q.questionText)}
              onFocus={() => handleQuestionFocus(q.questionText)}
            >
              <h3 className="text-lg font-medium text-neutral-900 mb-6">
                {i + 1}. {q.questionText}
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

              {q.questionType === "single_checkbox" && (
                <div className="space-y-3">
                  {q.options.map((opt) => (
                    <label key={opt} className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="radio"
                        name={q.questionText}
                        checked={responses[q.questionText] === opt}
                        onChange={() => handleChange(q.questionText, opt)}
                        className="h-4 w-4 text-neutral-900 border-neutral-300 focus:ring-0"
                      />
                      <span className="text-neutral-600 group-hover:text-neutral-900 transition-colors">{opt}</span>
                    </label>
                  ))}
                </div>
              )}

              {q.questionType === "multiple_checkbox" && (
                <div className="space-y-3">
                  {q.options.map((opt) => (
                    <label key={opt} className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={(responses[q.questionText] || []).includes(opt)}
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
                    value={responses[q.questionText] || q.minValue}
                    onChange={(e) => handleChange(q.questionText, Number(e.target.value))}
                    className="w-full h-1 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-neutral-900"
                  />
                  <div className="flex justify-between text-xs mt-3 text-neutral-400">
                    <span>{q.minValue}</span>
                    <span className="font-medium text-neutral-900">{responses[q.questionText] || q.minValue}</span>
                    <span>{q.maxValue}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-16 pt-8 border-t border-neutral-100">
          <button
            onClick={handleSubmit}
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
    </div>
  );
};

export default StandaloneSurvey;