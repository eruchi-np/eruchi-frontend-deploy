import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { History as HistoryIcon, ArrowRight, Loader2, Package, FileText, Award } from 'lucide-react';
import { surveyAPI, sepSurveyAPI } from '../../services/api';

const SurveyHistoryCard = () => {
  const navigate = useNavigate();
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [campRes, standRes] = await Promise.all([
          surveyAPI.getSurveyHistory(),
          sepSurveyAPI.getHistory({ limit: 100 }),
        ]);
        const combined = [
          ...(campRes.data.data || []).map(r => ({ ...r, type: 'campaign' })),
          ...(standRes.data.data || []).map(r => ({ ...r, type: 'standalone' })),
        ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setResponses(combined);
      } catch {
        setResponses([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const preview = responses.slice(0, 3);

  return (
    <div className="flex flex-col gap-3">
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 text-gray-300 animate-spin" />
        </div>
      ) : responses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
          <HistoryIcon className="w-7 h-7 text-gray-200 mb-1" />
          <p className="text-xs text-gray-400">No surveys completed yet.</p>
          <p className="text-[11px] text-gray-300 leading-relaxed max-w-[200px]">
            Completed surveys will appear here.
          </p>
        </div>
      ) : (
        <>
          {/* Count row */}
          <div className="flex items-baseline gap-2 pb-3 border-b border-gray-100">
            <span className="text-2xl font-light text-gray-900 tracking-tight">{responses.length}</span>
            <span className="text-[11px] text-gray-400 tracking-wide">
              {responses.length === 1 ? 'Survey Completed' : 'Surveys Completed'}
            </span>
          </div>

          {/* Survey entries */}
          <div className="flex flex-col divide-y divide-gray-50">
            {preview.map((entry) => {
              const title = entry.type === 'campaign'
                ? entry.campaign?.title || 'Campaign Survey'
                : entry.survey?.title || 'Standalone Survey';
              const credits = entry.type === 'campaign'
                ? (entry.survey?.creditsToAward || 100)
                : (entry.survey?.credits || 50);
              const date = new Date(entry.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              });

              return (
                <div key={entry._id} className="flex items-center gap-3 py-2.5">
                  <div className="w-7 h-7 rounded-md bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
                    {entry.type === 'campaign'
                      ? <Package className="w-3.5 h-3.5 text-gray-400" />
                      : <FileText className="w-3.5 h-3.5 text-gray-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-700 truncate">{title}</p>
                    <p className="text-[11px] text-gray-400">{date}</p>
                  </div>
                  <div className="flex items-center gap-1 text-emerald-600 shrink-0">
                    <Award className="w-3 h-3" />
                    <span className="text-[11px] font-semibold">+{credits}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {responses.length > 3 && (
            <p className="text-[11px] text-gray-300 text-center">
              +{responses.length - 3} more
            </p>
          )}
        </>
      )}

      <div className="pt-1 border-t border-gray-100">
        <button
          onClick={() => navigate('/survey-history')}
          className="flex items-center justify-between w-full text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors group pt-3"
        >
          <span>View Full History</span>
          <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
};

export default SurveyHistoryCard;