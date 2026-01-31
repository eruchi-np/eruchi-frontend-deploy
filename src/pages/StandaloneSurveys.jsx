import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { sepSurveyAPI } from '../services/api';
import { 
  Loader2, 
  ArrowLeft, 
  Award, 
  Clock, 
  AlertCircle, 
  CheckCircle 
} from 'lucide-react';
import toast from 'react-hot-toast';

const StandaloneSurveys = () => {
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSurveys = async () => {
      try {
        const res = await sepSurveyAPI.getAvailable({ limit: 20 });
        setSurveys(res.data.data || []);
      } catch (err) {
        console.error('Failed to load standalone surveys:', err);
        setError('Could not load available surveys. Please try again later.');
        toast.error('Failed to load surveys');
      } finally {
        setLoading(false);
      }
    };

    fetchSurveys();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600 font-medium">Loading surveys...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
        <div className="text-center max-w-md w-full">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">Oops!</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full max-w-xs mx-auto px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-16 sm:pb-20">
      <div className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-gray-900 text-sm sm:text-base"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Standalone Surveys</h1>
          <div className="w-10" /> {/* Spacer for alignment */}
        </div>

        {/* Empty State */}
        {surveys.length === 0 ? (
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm p-8 sm:p-12 text-center">
            <Award className="h-16 w-16 sm:h-20 sm:w-20 text-gray-400 mx-auto mb-4 sm:mb-6" />
            <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-3">
              No surveys available right now
            </h3>
            <p className="text-gray-600 text-sm sm:text-base mb-6 sm:mb-8">
              New standalone surveys will appear here when published.
            </p>
            <button
              onClick={() => navigate('/profile')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm sm:text-base"
            >
              Back to Profile
            </button>
          </div>
        ) : (
          /* Survey Cards – Responsive Grid */
          <div className="grid gap-5 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
            {surveys.map((survey) => (
              <div
                key={survey._id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-200"
              >
                <div className="p-5 sm:p-6">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                    {survey.title}
                  </h2>
                  <p className="text-gray-600 text-sm sm:text-base mb-4 line-clamp-3">
                    {survey.description}
                  </p>

                  {/* Badges – Wrap nicely on small screens */}
                  <div className="flex flex-wrap gap-3 text-xs sm:text-sm mb-5 sm:mb-6">
                    <div className="flex items-center gap-1.5 bg-green-100 text-green-800 px-3 py-1 rounded-full">
                      <Award className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      {survey.credits} credits
                    </div>

                    {survey.isMandatory && (
                      <div className="flex items-center gap-1.5 bg-red-100 text-red-800 px-3 py-1 rounded-full">
                        <AlertCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        Mandatory
                      </div>
                    )}

                    {survey.endDate && (
                      <div className="flex items-center gap-1.5 text-gray-600">
                        <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        Ends {new Date(survey.endDate).toLocaleDateString()}
                      </div>
                    )}
                  </div>

                  {/* Start Button – Full width on mobile */}
                  <button
                    onClick={() => navigate(`/standalone-survey/${survey._id}`)}
                    className="w-full bg-blue-600 text-white py-3 px-5 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base min-h-[48px]"
                  >
                    <CheckCircle className="h-5 w-5" />
                    Start Survey
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StandaloneSurveys;