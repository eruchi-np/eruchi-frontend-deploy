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
      <div className="min-h-screen flex items-center justify-center bg-white px-4">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#3399FF] mx-auto" />
          <p className="mt-3 text-gray-400 text-xs tracking-wide font-medium">Loading history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-4">
        <div className="text-center max-w-sm">
          <AlertCircle className="h-10 w-10 text-red-400 mx-auto mb-3" />
          <h2 className="text-base font-bold text-gray-900 mb-2">Something went wrong</h2>
          <p className="text-gray-500 text-xs mb-5">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 bg-[#102A43] text-white text-xs font-bold rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-['Inter']">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-6 pb-28 sm:pb-10">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg border border-gray-100 bg-gray-50 text-gray-400 hover:text-gray-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <span className="text-[10px] uppercase tracking-widest font-bold text-[#3399FF] block">
              Activity
            </span>
            <h1 className="text-xl font-light text-gray-900 tracking-tight leading-tight">
              Survey History
            </h1>
          </div>
        </div>

        {allResponses.length === 0 ? (
          /* ── Empty State ── */
          <div className="flex flex-col items-center justify-center text-center py-16 px-6">
            <div className="w-16 h-16 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mb-5">
              <HistoryIcon className="h-7 w-7 text-gray-300" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">No surveys completed yet</h3>
            <p className="text-xs text-gray-400 mb-7 max-w-[220px] leading-relaxed">
              Complete a survey to see it here.
            </p>
            <button
              onClick={() => navigate('/standalone-surveys')}
              className="px-6 py-3 bg-[#102A43] text-white text-xs font-bold tracking-wide rounded-lg hover:opacity-90 transition-opacity"
            >
              Browse Surveys
            </button>
          </div>
        ) : (
          /* ── Response List ── */
          <>
            {/* Count summary */}
            <div className="flex items-baseline gap-2 pb-4 mb-4 border-b border-gray-100">
              <span className="text-3xl font-light text-gray-900 tracking-tight">{allResponses.length}</span>
              <span className="text-xs text-gray-400 tracking-wide">
                {allResponses.length === 1 ? 'Survey Completed' : 'Surveys Completed'}
              </span>
            </div>

            <div className="flex flex-col gap-3">
              {allResponses.map((entry) => {
                const title = entry.type === 'campaign'
                  ? entry.campaign?.title || 'Campaign Survey'
                  : entry.survey?.title || 'Standalone Survey';
                const credits = entry.type === 'campaign'
                  ? (entry.survey?.creditsToAward || 100)
                  : (entry.survey?.credits || 50);
                const date = new Date(entry.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric', month: 'short', day: 'numeric',
                });

                return (
                  <div
                    key={entry._id}
                    className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 bg-white"
                  >
                    {/* Icon */}
                    <div className="w-9 h-9 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
                      {entry.type === 'campaign'
                        ? <Package className="w-4 h-4 text-gray-400" />
                        : <FileText className="w-4 h-4 text-gray-400" />}
                    </div>

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-800 truncate">{title}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Calendar className="w-3 h-3 text-gray-300" />
                        <p className="text-[11px] text-gray-400">{date}</p>
                      </div>
                    </div>

                    {/* Credits + Badge */}
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <div className="flex items-center gap-1 text-emerald-600">
                        <Award className="w-3.5 h-3.5" />
                        <span className="text-xs font-bold">+{credits}</span>
                      </div>
                      {entry.type === 'campaign' && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-blue-50 text-blue-600">
                          Campaign
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SurveyHistory;