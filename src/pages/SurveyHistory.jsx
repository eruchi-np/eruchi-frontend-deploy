// src/pages/SurveyHistory.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { surveyAPI, sepSurveyAPI } from '../services/api';
import { 
  Loader2, ArrowLeft, Award, Calendar, AlertCircle, 
  History as HistoryIcon, Package, FileText 
} from 'lucide-react';
import toast from 'react-hot-toast';

const SurveyHistory = () => {
  const [campaignResponses, setCampaignResponses] = useState([]);
  const [standaloneResponses, setStandaloneResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const campRes = await surveyAPI.getSurveyHistory();
        setCampaignResponses(campRes.data.data || []);

        const standRes = await sepSurveyAPI.getHistory({ limit: 20 });
        setStandaloneResponses(standRes.data.data || []);
      } catch (err) {
        console.error('Failed to load survey history:', err);
        setError('Could not load your survey history.');
        toast.error('Failed to load history');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  // Combine + sort newest first
  const allResponses = [
    ...campaignResponses.map(r => ({ ...r, type: 'campaign' })),
    ...standaloneResponses.map(r => ({ ...r, type: 'standalone' }))
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600 font-medium">Loading history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
        <div className="text-center max-w-md">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-3">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button onClick={() => window.location.reload()} className="px-6 py-3 bg-blue-600 text-white rounded-lg">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-16 sm:pb-20">
      <div className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <button onClick={() => navigate(-1)} className="flex items-center text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-5 w-5 mr-2" /> Back
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Survey History</h1>
          <div className="w-10" />
        </div>

        {allResponses.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 sm:p-12 text-center">
            <HistoryIcon className="h-16 w-16 sm:h-20 sm:w-20 text-gray-400 mx-auto mb-6" />
            <h3 className="text-xl sm:text-2xl font-semibold mb-3">No surveys completed yet</h3>
            <p className="text-gray-600 mb-6">Complete a survey to see it here.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button onClick={() => navigate('/campaigns')} className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Browse Campaigns
              </button>
              <button onClick={() => navigate('/standalone-surveys')} className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                Browse Standalone Surveys
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            {allResponses.map((entry) => (
              <div
                key={entry._id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
              >
                <div className="p-5 sm:p-6">
                  {/* Badge + Title */}
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900 line-clamp-2 flex-1">
                      {entry.type === 'campaign' 
                        ? entry.campaign?.title || 'Campaign Survey'
                        : entry.survey?.title || 'Standalone Survey'}
                    </h2>

                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs whitespace-nowrap ${
                      entry.type === 'campaign' ? 'bg-blue-100 text-blue-800' : 'bg-indigo-100 text-indigo-800'
                    }`}>
                      {entry.type === 'campaign' ? <Package className="h-3.5 w-3.5" /> : <FileText className="h-3.5 w-3.5" />}
                      {entry.type === 'campaign' ? 'Campaign' : 'Standalone'}
                    </div>
                  </div>

                  {/* Date */}
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 mb-3">
                    <Calendar className="h-4 w-4" />
                    {new Date(entry.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric', month: 'long', day: 'numeric'
                    })}
                  </div>

                  {/* Credits */}
                  <div className="flex items-center gap-2 bg-green-50 text-green-800 px-4 py-2 rounded-lg text-sm">
                    <Award className="h-4 w-4" />
                    +{entry.type === 'campaign' 
                      ? (entry.survey?.creditsToAward || 100) 
                      : (entry.survey?.credits || 50)} credits earned
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SurveyHistory;