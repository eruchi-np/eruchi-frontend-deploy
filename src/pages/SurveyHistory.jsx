// src/pages/SurveyHistory.jsx — activity feed (route kept as /survey-history)
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userAPI } from '../services/api';
import {
  Loader2, ArrowLeft, Award, Calendar, AlertCircle,
  History as HistoryIcon, Package, FileText, Ticket,
  Flame, Shield, Gift,
} from 'lucide-react';
import toast from 'react-hot-toast';

const TYPE_META = {
  survey_completed: { label: 'Survey', Icon: FileText, tone: 'blue' },
  voucher_purchased: { label: 'Voucher bought', Icon: Ticket, tone: 'amber' },
  voucher_redeemed: { label: 'Voucher redeemed', Icon: Package, tone: 'green' },
  streak_reward: { label: 'Streak reward', Icon: Gift, tone: 'orange' },
  streak_lost: { label: 'Streak lost', Icon: Flame, tone: 'red' },
  streak_guard: { label: 'Streak Guard', Icon: Shield, tone: 'navy' },
};

const toneClass = {
  blue: 'bg-blue-50 text-blue-600',
  amber: 'bg-amber-50 text-amber-700',
  green: 'bg-emerald-50 text-emerald-700',
  orange: 'bg-orange-50 text-orange-600',
  red: 'bg-red-50 text-red-600',
  navy: 'bg-slate-100 text-slate-700',
};

const SurveyHistory = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await userAPI.getActivity({ limit: 100, skipErrorToast: true });
        setActivities(res.data.data || []);
      } catch (err) {
        console.error('Failed to load activity:', err);
        setError('Could not load your activity.');
        toast.error('Failed to load activity');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-4">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#3399FF] mx-auto" />
          <p className="mt-3 text-gray-400 text-xs tracking-wide font-medium">Loading activity...</p>
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
            type="button"
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
        <div className="flex items-center gap-3 mb-6">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg border border-gray-100 bg-gray-50 text-gray-400 hover:text-gray-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <span className="text-[10px] uppercase tracking-widest font-bold text-[#3399FF] block">
              Profile
            </span>
            <h1 className="text-xl font-light text-gray-900 tracking-tight leading-tight">
              Activity
            </h1>
          </div>
        </div>

        {activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-16 px-6">
            <div className="w-16 h-16 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mb-5">
              <HistoryIcon className="h-7 w-7 text-gray-300" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">No activity yet</h3>
            <p className="text-xs text-gray-400 mb-7 max-w-[240px] leading-relaxed">
              Surveys, vouchers, and streak events will show up here.
            </p>
            <button
              type="button"
              onClick={() => navigate('/standalone-surveys')}
              className="px-6 py-3 bg-[#102A43] text-white text-xs font-bold tracking-wide rounded-lg hover:opacity-90 transition-opacity"
            >
              Browse Surveys
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-baseline gap-2 pb-4 mb-4 border-b border-gray-100">
              <span className="text-3xl font-light text-gray-900 tracking-tight">{activities.length}</span>
              <span className="text-xs text-gray-400 tracking-wide">
                {activities.length === 1 ? 'Activity' : 'Activities'}
              </span>
            </div>

            <div className="flex flex-col gap-3">
              {activities.map((entry) => {
                const meta = TYPE_META[entry.type] || {
                  label: entry.type,
                  Icon: HistoryIcon,
                  tone: 'navy',
                };
                const Icon = meta.Icon;
                const date = new Date(entry.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric', month: 'short', day: 'numeric',
                });
                const credits = entry.creditsDelta;
                const showStreak =
                  entry.streakAfter != null &&
                  (entry.type === 'survey_completed' ||
                    entry.type === 'streak_reward' ||
                    entry.type === 'streak_lost');

                return (
                  <div
                    key={entry._id}
                    className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 bg-white"
                  >
                    <div className="w-9 h-9 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-gray-400" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-800 truncate">{entry.title}</p>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        <Calendar className="w-3 h-3 text-gray-300" />
                        <p className="text-[11px] text-gray-400">{date}</p>
                        {entry.description ? (
                          <p className="text-[11px] text-gray-400 truncate">· {entry.description}</p>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      {credits != null && credits !== 0 && (
                        <div className={`flex items-center gap-1 ${credits > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                          <Award className="w-3.5 h-3.5" />
                          <span className="text-xs font-bold">
                            {credits > 0 ? '+' : '−'}{Math.abs(credits)}
                          </span>
                        </div>
                      )}
                      {showStreak && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-orange-50 text-orange-600 flex items-center gap-1">
                          <Flame className="w-3 h-3" />
                          Streak {entry.streakAfter}
                        </span>
                      )}
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${toneClass[meta.tone]}`}>
                        {meta.label}
                      </span>
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
