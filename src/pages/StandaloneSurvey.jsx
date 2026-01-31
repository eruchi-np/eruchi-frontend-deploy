import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { sepSurveyAPI } from '../services/api';
import { ArrowLeft, Loader2, Award, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const StandaloneSurvey = () => {
  const { surveyId } = useParams();
  const navigate = useNavigate();
  const [survey, setSurvey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [responses, setResponses] = useState({});
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSurvey = async () => {
      try {
        const res = await sepSurveyAPI.getById(surveyId);
        setSurvey(res.data.data);

        // Initialize empty responses
        const initial = {};
        res.data.data.questions.forEach(q => {
          initial[q.questionText] = 
            q.questionType === 'multiple_checkbox' ? [] :
            q.questionType === 'slider' ? q.minValue || 0 : '';
        });
        setResponses(initial);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load survey');
      } finally {
        setLoading(false);
      }
    };

    fetchSurvey();
  }, [surveyId]);

  const handleChange = (qText, value) => {
    setResponses(prev => ({ ...prev, [qText]: value }));
  };

  const handleCheckbox = (qText, option, checked) => {
    setResponses(prev => {
      const arr = prev[qText] || [];
      return {
        ...prev,
        [qText]: checked ? [...arr, option] : arr.filter(v => v !== option)
      };
    });
  };

  const isComplete = () => {
    return survey.questions.every(q => {
      const val = responses[q.questionText];
      if (q.questionType === 'multiple_checkbox') return val?.length > 0;
      if (q.questionType === 'slider') return true;
      return val && (typeof val !== 'string' || val.trim());
    });
  };

  const handleSubmit = async () => {
    if (!isComplete()) {
      toast.error('Please answer all questions');
      return;
    }

    setSubmitting(true);
    try {
      await sepSurveyAPI.submit(surveyId, responses);
      toast.success(`Completed! +${survey.credits} credits added`);
      navigate('/profile'); // or /profile
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = async () => {
    if (survey.isMandatory) {
      toast.error('This survey is mandatory');
      return;
    }
    if (!confirm('Skip this optional survey? No credits awarded.')) return;

    try {
      await sepSurveyAPI.skip(surveyId);
      toast.success('Survey skipped');
      navigate('/profile');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to skip');
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-12 w-12 animate-spin" /></div>;
  if (error) return <div className="min-h-screen flex items-center justify-center text-red-600 p-6">{error}</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <button onClick={() => navigate('/standalone-surveys')} className="flex items-center text-gray-600 mb-6 hover:text-gray-900">
          <ArrowLeft className="h-5 w-5 mr-2" /> Back to Surveys
        </button>

        <div className="bg-white rounded-2xl shadow-sm border p-6 md:p-8">
          <h1 className="text-2xl md:text-3xl font-bold mb-3">{survey.title}</h1>
          <p className="text-gray-600 mb-6">{survey.description}</p>

          <div className="flex flex-wrap gap-4 mb-8 text-sm">
            <div className="flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full">
              <Award className="h-5 w-5" /> {survey.credits} credits
            </div>
            {survey.isMandatory && (
              <div className="flex items-center gap-2 bg-red-100 text-red-800 px-4 py-2 rounded-full">
                <AlertCircle className="h-5 w-5" /> Mandatory
              </div>
            )}
            {survey.endDate && (
              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="h-5 w-5" /> Ends {new Date(survey.endDate).toLocaleDateString()}
              </div>
            )}
          </div>

          <div className="space-y-10">
            {survey.questions.map((q, i) => (
              <div key={i} className="border-b pb-10 last:border-b-0">
                <h3 className="text-lg font-semibold mb-4">
                  {i + 1}. {q.questionText} <span className="text-red-500">*</span>
                </h3>

                {q.questionType === 'text_short' && (
                  <input
                    type="text"
                    value={responses[q.questionText] || ''}
                    onChange={e => handleChange(q.questionText, e.target.value)}
                    className="w-full p-4 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Your answer..."
                  />
                )}

                {q.questionType === 'text_long' && (
                  <textarea
                    value={responses[q.questionText] || ''}
                    onChange={e => handleChange(q.questionText, e.target.value)}
                    className="w-full p-4 border rounded-lg min-h-[140px] focus:ring-2 focus:ring-blue-500"
                    placeholder="Your detailed response..."
                  />
                )}

                {q.questionType === 'single_checkbox' && (
                  <div className="space-y-4">
                    {q.options.map(opt => (
                      <label key={opt} className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="radio"
                          name={q.questionText}
                          checked={responses[q.questionText] === opt}
                          onChange={() => handleChange(q.questionText, opt)}
                          className="h-5 w-5 text-blue-600"
                        />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>
                )}

                {q.questionType === 'multiple_checkbox' && (
                  <div className="space-y-4">
                    {q.options.map(opt => (
                      <label key={opt} className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={(responses[q.questionText] || []).includes(opt)}
                          onChange={e => handleCheckbox(q.questionText, opt, e.target.checked)}
                          className="h-5 w-5 text-blue-600 rounded"
                        />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>
                )}

                {q.questionType === 'slider' && (
                  <div className="px-4 py-6">
                    <input
                      type="range"
                      min={q.minValue}
                      max={q.maxValue}
                      value={responses[q.questionText] || q.minValue}
                      onChange={e => handleChange(q.questionText, Number(e.target.value))}
                      className="w-full h-3 bg-gray-200 rounded-lg cursor-pointer"
                    />
                    <div className="flex justify-between text-sm mt-3 text-gray-600">
                      <span>{q.minValue}</span>
                      <span className="font-medium text-blue-600">
                        {responses[q.questionText] || q.minValue}
                      </span>
                      <span>{q.maxValue}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mt-12">
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 bg-blue-600 text-white py-4 px-8 rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-md"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5" />
                  Submit & Earn {survey.credits} Credits
                </>
              )}
            </button>

            {!survey.isMandatory && (
              <button
                onClick={handleSkip}
                disabled={submitting}
                className="px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 disabled:opacity-50 transition-all"
              >
                Skip Survey
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StandaloneSurvey;