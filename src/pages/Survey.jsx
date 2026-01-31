import React,  { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { surveyAPI, userAPI } from '../services/api';
import { ArrowLeft, Star, Loader2, Package, Clock, Type, FileText, CheckSquare, Sliders } from 'lucide-react';
import toast from 'react-hot-toast'; // ← ONLY THIS LINE ADDED

const Survey = () => {
  const { campaignId } = useParams();
  const navigate = useNavigate();
  const [survey, setSurvey] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [responses, setResponses] = useState({});
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch user data first to check campaign status
        const userResponse = await userAPI.getProfile();
        setUser(userResponse.data.data.user);

        // Check if user can access this survey
        const userCampaign = userResponse.data.data.user.activeCampaign;
        
        if (!userCampaign || userCampaign.campaign !== campaignId) {
          setError('You are not part of this campaign.');
          setLoading(false);
          return;
        }

        if (userCampaign.status !== 'delivered') {
          setError(`Your sample status is: ${userCampaign.status}. Survey will be available when status is "delivered".`);
          setLoading(false);
          return;
        }

        // If checks pass, fetch the survey
        const surveyResponse = await surveyAPI.getSurvey(campaignId);
        setSurvey(surveyResponse.data.data);

        // Initialize responses object based on question types
        const initialResponses = {};
        surveyResponse.data.data.questions.forEach(question => {
          switch (question.questionType) {
            case 'rating':
              initialResponses[question.questionText] = 0;
              break;
            case 'yes_no':
              initialResponses[question.questionText] = '';
              break;
            case 'single_checkbox':
              initialResponses[question.questionText] = '';
              break;
            case 'multiple_checkbox':
              initialResponses[question.questionText] = [];
              break;
            case 'slider':
              initialResponses[question.questionText] = question.minValue || 0;
              break;
            case 'text_short':
            case 'text_long':
            default:
              initialResponses[question.questionText] = '';
          }
        });
        setResponses(initialResponses);

      } catch (error) {
        console.error('Error fetching survey:', error);
        setError(error.response?.data?.message || 'Failed to load survey');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [campaignId]);

  const handleResponseChange = (questionText, value) => {
    setResponses(prev => ({
      ...prev,
      [questionText]: value
    }));
  };

  const handleCheckboxChange = (questionText, optionValue, isChecked) => {
    setResponses(prev => {
      const currentValues = prev[questionText] || [];
      
      if (isChecked) {
        return {
          ...prev,
          [questionText]: [...currentValues, optionValue]
        };
      } else {
        return {
          ...prev,
          [questionText]: currentValues.filter(val => val !== optionValue)
        };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Enhanced validation for all question types
    const validationErrors = [];
    
    Object.entries(responses).forEach(([questionText, value]) => {
      const question = survey.questions.find(q => q.questionText === questionText);
      
      if (!question) return;
      
      switch (question.questionType) {
        case 'rating':
          if (value === 0) {
            validationErrors.push(`Please provide a rating for: "${questionText}"`);
          }
          break;
        case 'yes_no':
        case 'single_checkbox':
          if (!value || value === '') {
            validationErrors.push(`Please select an option for: "${questionText}"`);
          }
          break;
        case 'multiple_checkbox':
          if (!value || value.length === 0) {
            validationErrors.push(`Please select at least one option for: "${questionText}"`);
          } else if (question.maxSelections && value.length > question.maxSelections) {
            validationErrors.push(`Please select no more than ${question.maxSelections} options for: "${questionText}"`);
          }
          break;
        case 'text_short':
        case 'text_long':
          if (!value || value.trim() === '') {
            validationErrors.push(`Please provide an answer for: "${questionText}"`);
          }
          break;
        case 'slider':
          // Slider always has a value (minValue default)
          break;
        default:
          if (!value || value === '') {
            validationErrors.push(`Please provide an answer for: "${questionText}"`);
          }
      }
    });
    
    if (validationErrors.length > 0) {
      toast.error(`Please complete all required fields:\n\n${validationErrors.join('\n')}`, {
        duration: 10000,
      });
      return;
    }

    setSubmitting(true);
    
    try {
      await surveyAPI.submitSurvey({ responses });
      toast.success('Survey submitted successfully!');
      navigate('/profile');
    } catch (error) {
      console.error('Error submitting survey:', error);
      const errorMessage = error.response?.data?.message || 'Failed to submit survey';
      
      if (errorMessage.includes('delivered')) {
        toast.error('Your product must be marked as delivered before you can submit the survey.');
      } else if (errorMessage.includes('Available on')) {
        toast.warn(errorMessage);
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = async () => {
    if (!survey.isMandatory) {
      toast((t) => (
        <div className="p-4 max-w-sm">
          <p className="font-medium mb-2">Are you sure you want to skip this optional survey?</p>
          <p className="text-sm text-gray-600 mb-4">You will not earn credits.</p>
          <div className="flex gap-3 justify-end">
            <button
              onClick={async () => {
                toast.dismiss(t.id);
                setSubmitting(true);
                try {
                  await surveyAPI.skipSurvey();
                  toast.success('Survey skipped successfully.');
                  navigate('/profile');
                } catch (error) {
                  toast.error(error.response?.data?.message || 'Failed to skip survey');
                } finally {
                  setSubmitting(false);
                }
              }}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm font-medium"
            >
              Yes, Skip
            </button>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      ), {
        duration: 20000,
        position: 'top-center',
      });
    } else {
      toast.error('This survey is mandatory and cannot be skipped.');
    }
  };

  const getQuestionTypeIcon = (type) => {
    const icons = {
      text_short: <Type className="h-4 w-4" />,
      text_long: <FileText className="h-4 w-4" />,
      single_checkbox: <CheckSquare className="h-4 w-4" />,
      multiple_checkbox: <CheckSquare className="h-4 w-4" />,
      slider: <Sliders className="h-4 w-4" />,
      rating: <Star className="h-4 w-4" />,
      yes_no: <CheckSquare className="h-4 w-4" />
    };
    return icons[type] || <FileText className="h-4 w-4" />;
  };

  const renderQuestionInput = (question, index) => {
    switch (question.questionType) {
      case 'rating':
        return (
          <div className="flex space-x-2 justify-center">
            {[1, 2, 3, 4, 5].map((rating) => (
              <button
                key={rating}
                type="button"
                onClick={() => handleResponseChange(question.questionText, rating)}
                className={`p-3 rounded-full transition-colors ${
                  responses[question.questionText] === rating
                    ? 'bg-yellow-400 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <Star 
                  className="h-6 w-6" 
                  fill={responses[question.questionText] >= rating ? 'currentColor' : 'none'} 
                />
                <span className="sr-only">{rating} stars</span>
              </button>
            ))}
          </div>
        );
      
      case 'yes_no':
        return (
          <div className="flex space-x-6 justify-center">
            {['Yes', 'No'].map((option) => (
              <label key={option} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name={question.questionText}
                  value={option}
                  checked={responses[question.questionText] === option}
                  onChange={(e) => handleResponseChange(question.questionText, e.target.value)}
                  className="h-5 w-5 text-blue-600"
                />
                <span className="text-lg">{option}</span>
              </label>
            ))}
          </div>
        );

      case 'single_checkbox':
        return (
          <div className="space-y-3">
            {question.options?.map((option, optionIndex) => (
              <label key={optionIndex} className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name={question.questionText}
                  value={option}
                  checked={responses[question.questionText] === option}
                  onChange={(e) => handleResponseChange(question.questionText, e.target.value)}
                  className="h-5 w-5 text-blue-600"
                />
                <span className="text-lg">{option}</span>
              </label>
            ))}
          </div>
        );

      case 'multiple_checkbox':
        return (
          <div className="space-y-3">
            {question.options?.map((option, optionIndex) => (
              <label key={optionIndex} className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  value={option}
                  checked={(responses[question.questionText] || []).includes(option)}
                  onChange={(e) => handleCheckboxChange(question.questionText, option, e.target.checked)}
                  className="h-5 w-5 text-blue-600 rounded"
                />
                <span className="text-lg">{option}</span>
              </label>
            ))}
            {question.maxSelections && question.maxSelections > 1 && (
              <p className="text-sm text-gray-500 mt-2">
                Select up to {question.maxSelections} options
                {responses[question.questionText] && (
                  <span className="ml-2">
                    ({responses[question.questionText].length} selected)
                  </span>
                )}
              </p>
            )}
          </div>
        );

      case 'slider':
        const minValue = question.minValue || 0;
        const maxValue = question.maxValue || 5;
        
        return (
          <div className="px-4 py-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-lg font-medium text-gray-700">{minValue}</span>
              <span className="text-lg font-medium text-blue-600">
                {responses[question.questionText]}
              </span>
              <span className="text-lg font-medium text-gray-700">{maxValue}</span>
            </div>
            <input
              type="range"
              min={minValue}
              max={maxValue}
              value={responses[question.questionText]}
              onChange={(e) => handleResponseChange(question.questionText, parseInt(e.target.value))}
              className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              style={{
                background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((responses[question.questionText] - minValue) / (maxValue - minValue)) * 100}%, #e5e7eb ${((responses[question.questionText] - minValue) / (maxValue - minValue)) * 100}%, #e5e7eb 100%)`
              }}
            />
            <div className="flex justify-between text-sm text-gray-500 mt-2">
              <span>Low</span>
              <span>High</span>
            </div>
          </div>
        );

      case 'text_short':
        return (
          <input
            type="text"
            value={responses[question.questionText] || ''}
            onChange={(e) => handleResponseChange(question.questionText, e.target.value)}
            placeholder="Enter your answer..."
            className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        );

      case 'text_long':
        return (
          <textarea
            value={responses[question.questionText] || ''}
            onChange={(e) => handleResponseChange(question.questionText, e.target.value)}
            placeholder="Type your detailed answer here..."
            className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
            rows={4}
          />
        );
      
      default:
        return (
          <textarea
            value={responses[question.questionText] || ''}
            onChange={(e) => handleResponseChange(question.questionText, e.target.value)}
            placeholder="Type your answer here..."
            className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
            rows={3}
          />
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-4">
          <Package className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Survey Unavailable</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="space-y-2">
            <button 
              onClick={() => navigate('/profile')}
              className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Check Profile Status
            </button>
            <button 
              onClick={() => navigate('/campaigns')}
              className="w-full border border-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-50"
            >
              Browse Campaigns
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate('/campaigns')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Campaigns
        </button>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {survey.campaign?.title || 'Survey'}
            </h1>
            <p className="text-gray-600 mb-4">
              {survey.campaign?.description || 'Please complete the following survey'}
            </p>
            
            <div className="flex flex-wrap gap-4 text-sm">
              {survey.isMandatory && (
                <div className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full">
                  Mandatory Survey
                </div>
              )}
              {survey.surveyDelayDays > 0 && (
                <div className="flex items-center text-gray-500">
                  <Clock className="h-4 w-4 mr-1" />
                  {survey.surveyDelayDays} day delay
                </div>
              )}
              <div className="flex items-center text-green-600">
                <Package className="h-4 w-4 mr-1" />
                Earn {survey.creditsToAward || 100} credits
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-8">
              {survey.questions.map((question, index) => (
                <div key={index} className="border-b border-gray-200 pb-8 last:border-b-0">
                  <div className="flex items-start justify-between mb-4">
                    <label className="block text-lg font-medium text-gray-900">
                      {index + 1}. {question.questionText}
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <div className="flex items-center text-gray-500 text-sm ml-4">
                      {getQuestionTypeIcon(question.questionType)}
                      <span className="ml-1 capitalize">
                        {question.questionType.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                  {renderQuestionInput(question, index)}
                </div>
              ))}
            </div>

            <div className="flex space-x-4 mt-8 pt-6 border-t border-gray-200">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-blue-500 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? (
                  <div className="flex items-center justify-center">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Submitting...
                  </div>
                ) : (
                  `Submit Survey & Earn ${survey.creditsToAward || 100} Credits`
                )}
              </button>
              
              {!survey.isMandatory && (
                <button
                  type="button"
                  onClick={handleSkip}
                  disabled={submitting}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  Skip Survey
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Survey;