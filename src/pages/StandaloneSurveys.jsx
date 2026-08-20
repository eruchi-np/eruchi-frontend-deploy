import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { sepSurveyAPI } from '../services/api';
import {
  Loader2,
  Award,
  AlertCircle,
  SearchX,
  ChevronDown,
  FileText,
  MessageSquare,
  Calendar,
  Clock,
  ArrowRight,
} from 'lucide-react';
import toast from 'react-hot-toast';
import AnimatedContent from '../components/animations/AnimatedContent';

const headingStyle = {
  fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
  fontSize: 'clamp(32px, 5vw, 58px)',
  fontWeight: 500,
  lineHeight: 1.1,
};

const descriptionStyle = {
  fontSize: 'clamp(15px, 1.5vw, 20px)',
  fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
  fontWeight: 300,
};

/* Same palette family as the Rewards Shop for cross-page cohesion */
const TICKET_PALETTES = [
  { bg: '#00704A', accent: '#005C3C' },
  { bg: '#1E88E5', accent: '#1565C0' },
  { bg: '#FB8C00', accent: '#EF6C00' },
  { bg: '#6A1B9A', accent: '#4A148C' },
  { bg: '#00897B', accent: '#00695C' },
  { bg: '#3949AB', accent: '#283593' },
  { bg: '#C62828', accent: '#8E0000' },
  { bg: '#EC407A', accent: '#D81B60' },
  { bg: '#212121', accent: '#000000' },
];

const getPalette = (seed = '') => {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return TICKET_PALETTES[Math.abs(hash) % TICKET_PALETTES.length];
};

const daysRemaining = (endDate) => {
  if (!endDate) return null;
  return Math.ceil((new Date(endDate) - new Date()) / (1000 * 60 * 60 * 24));
};

function MetaPill({ icon: Icon, label }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-[11px] font-medium text-neutral-700 sm:text-xs">
      <Icon className="h-3.5 w-3.5 text-neutral-500" />
      {label}
    </span>
  );
}

function SurveyCard({ survey, onStart }) {
  const palette = useMemo(
    () => getPalette(survey.feedbackBusinessName || survey.title || survey._id),
    [survey._id, survey.title, survey.feedbackBusinessName],
  );

  const left = daysRemaining(survey.endDate);
  const isExpired = left !== null && left <= 0;
  const isUrgent = left !== null && left > 0 && left <= 3;
  const Icon = survey.isMerchantFeedback ? MessageSquare : FileText;

  return (
    <div
      role="button"
      tabIndex={isExpired ? -1 : 0}
      aria-disabled={isExpired}
      onClick={() => !isExpired && onStart(survey)}
      onKeyDown={(e) => {
        if (!isExpired && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onStart(survey);
        }
      }}
      className={`group flex h-full w-full flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white outline-none transition-all duration-300 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#134074] ${
        isExpired
          ? 'cursor-not-allowed opacity-60'
          : 'cursor-pointer hover:-translate-y-1 hover:border-neutral-300 hover:shadow-lg'
      }`}
    >
      {/* ── Colored ticket header ── */}
      <div
        className="relative flex items-center gap-4 px-6 pb-8 pt-6 sm:px-8 overflow-hidden"
        style={{ backgroundColor: palette.bg }}
      >
        <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white shadow-md transition-transform duration-300 group-hover:scale-105">
          <Icon className="h-6 w-6" style={{ color: palette.bg }} />
        </div>

        <div className="relative min-w-0 flex-1">
          {survey.isMerchantFeedback && (
            <span className="mb-1.5 inline-block rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white backdrop-blur-sm">
              {survey.feedbackBusinessName
                ? `Feedback · ${survey.feedbackBusinessName}`
                : 'Feedback requested'}
            </span>
          )}
          <h2 className="line-clamp-2 text-[18px] font-semibold leading-tight text-white sm:text-[20px]">
            {survey.title}
          </h2>
        </div>

        {/* credits medallion */}
        <div className="relative flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-full bg-white shadow-md z-10">
          <span
            className="text-lg font-bold leading-none"
            style={{ color: palette.bg }}
          >
            {survey.credits}
          </span>
        </div>

        {isUrgent && (
          <span className="absolute right-4 top-3 rounded-full bg-white px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-red-500 shadow-sm z-10">
            Ending soon
          </span>
        )}
      </div>

      {/* ── Perforation ── */}
      <div className="relative z-10 flex h-0 items-center">
        <span
          className="absolute -left-2.5 h-5 w-5 -translate-x-1/2 rounded-full bg-white"
          style={{ boxShadow: 'inset 0 0 0 1px rgb(229 229 229)' }}
        />
        <span
          className="absolute -right-2.5 h-5 w-5 translate-x-1/2 rounded-full bg-white"
          style={{ boxShadow: 'inset 0 0 0 1px rgb(229 229 229)' }}
        />
        <div className="mx-3 w-full border-t-2 border-dashed border-neutral-200" />
      </div>

      {/* ── Body ── */}
      <div className="flex flex-1 flex-col justify-between px-6 pb-6 pt-7 sm:px-8">
        <div>
          <p className="mb-5 line-clamp-2 min-h-[40px] text-sm text-neutral-500 sm:text-base">
            {survey.description}
          </p>

          <div className="mb-6 flex flex-wrap gap-2">
            <MetaPill icon={Award} label={`${survey.credits} credits`} />
            <MetaPill
              icon={Calendar}
              label={
                left === null
                  ? 'No deadline'
                  : left > 0
                    ? `${left} day${left !== 1 ? 's' : ''} left`
                    : 'Expired'
              }
            />
            {survey.estimatedMinutes && (
              <MetaPill icon={Clock} label={`~${survey.estimatedMinutes} min`} />
            )}
          </div>
        </div>

        <button
          type="button"
          disabled={isExpired}
          onClick={(e) => {
            e.stopPropagation();
            onStart(survey);
          }}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-medium text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:self-end"
          style={{ backgroundColor: palette.bg }}
        >
          {isExpired ? 'Closed' : 'Start survey'}
          {!isExpired && (
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          )}
        </button>
      </div>
    </div>
  );
}

const StandaloneSurveys = () => {
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortOrder, setSortOrder] = useState('default');
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

  const sortedSurveys = useMemo(() => {
    const now = new Date();

    const items = surveys.filter((survey) => {
      if (survey.isMerchantFeedback) return true;
      if (survey.status !== 'published') return false;
      if (survey.startDate && now < new Date(survey.startDate)) return false;
      if (survey.endDate && now > new Date(survey.endDate)) return false;
      return true;
    });

    if (sortOrder === 'credits-desc') items.sort((a, b) => b.credits - a.credits);
    else if (sortOrder === 'credits-asc') items.sort((a, b) => a.credits - b.credits);

    return items;
  }, [surveys, sortOrder]);

  const totalCredits = useMemo(
    () => sortedSurveys.reduce((sum, s) => sum + (s.credits || 0), 0),
    [sortedSurveys],
  );

  if (loading) {
    return (
      <div
        className="flex min-h-screen items-center justify-center bg-white px-4"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        <AnimatedContent direction="vertical" distance={20} duration={0.6} className="text-center">
          <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-neutral-900" />
          <p className="font-medium text-neutral-600" style={descriptionStyle}>
            Loading available surveys...
          </p>
        </AnimatedContent>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="flex min-h-screen items-center justify-center bg-white px-4 py-8"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        <AnimatedContent
          direction="vertical"
          distance={30}
          duration={0.6}
          className="w-full max-w-md text-center"
        >
          <AlertCircle className="mx-auto mb-6 h-16 w-16 text-neutral-900" />
          <h2
            style={{ fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 300, lineHeight: 1.1 }}
            className="mb-4 text-neutral-900"
          >
            Oops!
          </h2>
          <p className="mb-8 text-neutral-600" style={descriptionStyle}>
            {error}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mx-auto w-full max-w-xs rounded-full px-6 py-4 font-medium text-white transition-transform hover:scale-[1.02]"
            style={{ backgroundColor: '#134074' }}
          >
            Try Again
          </button>
        </AnimatedContent>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="mx-auto max-w-[1314px] px-4 py-10 sm:px-8 lg:px-10 lg:py-16">
        {/* Header */}
        <div className="mb-12 grid items-end justify-between gap-8 border-b border-neutral-200 pb-12 lg:grid-cols-[1fr_340px]">
          <AnimatedContent direction="vertical" distance={40} duration={0.8} className="flex flex-col">
            <h1 className="mb-4 text-neutral-900" style={headingStyle}>
              Available <span className="text-blue-600">Surveys</span>.
            </h1>
            <p className="max-w-2xl leading-snug text-neutral-600" style={descriptionStyle}>
              Share your thoughts, influence brands, and earn credits. Select a
              survey below to get started and unlock your rewards.
            </p>

            {sortedSurveys.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2">
                <MetaPill icon={FileText} label={`${sortedSurveys.length} open`} />
                <MetaPill icon={Award} label={`${totalCredits} credits available`} />
              </div>
            )}
          </AnimatedContent>

          {surveys.length > 0 && (
            <AnimatedContent
              direction="vertical"
              distance={40}
              duration={0.8}
              delay={0.15}
              className="w-full"
            >
              <div className="relative">
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="w-full cursor-pointer appearance-none rounded-full border border-gray-200 bg-white py-3.5 pl-4 pr-10 text-sm text-gray-900 outline-none transition-colors focus:border-gray-300 lg:py-4 lg:pl-5 lg:text-base"
                >
                  <option value="default">Default ordering</option>
                  <option value="credits-desc">Reward: High → Low</option>
                  <option value="credits-asc">Reward: Low → High</option>
                </select>
                <ChevronDown
                  className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                  size={16}
                />
              </div>
            </AnimatedContent>
          )}
        </div>

        {/* Grid */}
        {sortedSurveys.length === 0 ? (
          <AnimatedContent direction="vertical" distance={30} duration={0.7} delay={0.2}>
            <div className="mx-auto max-w-3xl rounded-3xl border-2 border-dashed border-neutral-200 bg-neutral-50/60 p-10 text-center sm:p-16">
              <SearchX className="mx-auto mb-6 h-20 w-20 text-neutral-300" />
              <h3
                className="mb-4 text-neutral-900"
                style={{ fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 400 }}
              >
                No surveys right now
              </h3>
              <p className="mb-8 text-neutral-600" style={descriptionStyle}>
                Check back soon! New surveys tailored to your profile will appear
                here when they&apos;re published.
              </p>
              <button
                onClick={() => navigate('/profile')}
                className="rounded-full px-8 py-4 font-medium text-white transition-transform hover:scale-[1.02]"
                style={{ backgroundColor: '#134074' }}
              >
                Return to Dashboard
              </button>
            </div>
          </AnimatedContent>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-2">
            {sortedSurveys.map((survey, index) => (
              <AnimatedContent
                key={survey._id}
                direction="vertical"
                distance={40}
                duration={0.6}
                delay={0.15 + (index % 2) * 0.1}
                className="flex w-full flex-col"
              >
                <SurveyCard
                  survey={survey}
                  onStart={(s) => navigate(`/standalone-survey/${s._id}`)}
                />
              </AnimatedContent>
            ))}
          </div>
        )}

        {sortedSurveys.length > 0 && (
          <AnimatedContent direction="vertical" distance={20} duration={0.6} delay={0.4}>
            <div className="mt-12 text-center sm:mt-16">
              <p className="text-sm font-medium tracking-wide text-gray-400 sm:text-base">
                More surveys coming soon
              </p>
            </div>
          </AnimatedContent>
        )}
      </div>
    </div>
  );
};

export default StandaloneSurveys;