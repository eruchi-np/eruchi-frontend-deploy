import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { History as HistoryIcon, ArrowRight, Loader2, Award, Flame } from 'lucide-react';
import { userAPI } from '../../services/api';

const SurveyHistoryCard = () => {
  const navigate = useNavigate();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await userAPI.getActivity({ limit: 50, skipErrorToast: true });
        setActivities(res.data.data || []);
      } catch {
        setActivities([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const preview = activities.slice(0, 3);

  return (
    <div className="flex flex-col gap-3">
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 text-gray-300 animate-spin" />
        </div>
      ) : activities.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
          <HistoryIcon className="w-7 h-7 text-gray-200 mb-1" />
          <p className="text-xs text-gray-400">No activity yet.</p>
          <p className="text-[11px] text-gray-300 leading-relaxed max-w-[200px]">
            Surveys, vouchers, and streak events will appear here.
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-baseline gap-2 pb-3 border-b border-gray-100">
            <span className="text-2xl font-light text-gray-900 tracking-tight">{activities.length}</span>
            <span className="text-[11px] text-gray-400 tracking-wide">
              {activities.length === 1 ? 'Activity' : 'Activities'}
            </span>
          </div>

          <div className="flex flex-col divide-y divide-gray-50">
            {preview.map((entry) => {
              const date = new Date(entry.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              });

              return (
                <div key={entry._id} className="flex items-center gap-3 py-2.5">
                  <div className="w-7 h-7 rounded-md bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
                    <HistoryIcon className="w-3.5 h-3.5 text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-700 truncate">{entry.title}</p>
                    <p className="text-[11px] text-gray-400">{date}</p>
                  </div>
                  <div className="flex flex-col items-end gap-0.5 shrink-0">
                    {entry.creditsDelta != null && entry.creditsDelta !== 0 && (
                      <div className={`flex items-center gap-1 ${entry.creditsDelta > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        <Award className="w-3 h-3" />
                        <span className="text-[11px] font-semibold">
                          {entry.creditsDelta > 0 ? '+' : '−'}{Math.abs(entry.creditsDelta)}
                        </span>
                      </div>
                    )}
                    {entry.type === 'survey_completed' && entry.streakAfter != null && (
                      <span className="text-[10px] text-orange-500 flex items-center gap-0.5">
                        <Flame className="w-3 h-3" />
                        {entry.streakAfter}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {activities.length > 3 && (
            <p className="text-[11px] text-gray-300 text-center">
              +{activities.length - 3} more
            </p>
          )}
        </>
      )}

      <div className="pt-1 border-t border-gray-100">
        <button
          type="button"
          onClick={() => navigate('/survey-history')}
          className="flex items-center justify-between w-full text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors group pt-3"
        >
          <span>View Full Activity</span>
          <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
};

export default SurveyHistoryCard;
