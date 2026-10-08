// Shared pieces for the health tabs. Cards, percents, bars, labels, and the button that opens a user.

import React from 'react';
import { formatActivationDuration } from './healthActivationView';
import { clarityDashboardUrl, clarityProjectId } from '../../../utils/clarity';

const OpenUserContext = React.createContext(null);

const latestFirst = (rows) => [...(rows || [])].reverse();

function UserIdButton({ id, name }) {
  const openUser = React.useContext(OpenUserContext);
  if (!id) return null;
  const label = name || id;
  if (!openUser) return <span className="break-all">{label}</span>;
  return (
    <button type="button" onClick={() => openUser(String(id))} className="text-sky-800 underline break-all text-left" title={String(id)}>
      {label}
    </button>
  );
}

const NAVY = '#1B2A4A';

const SECTIONS = [
  ['activation', 'Activation'],
  ['surveys', 'Surveys'],
  ['rewards', 'Rewards'],
  ['retention', 'Retention'],
  ['channel', 'Channel'],
  ['trust', 'Trust'],
];

const BAR_LABELS = {
  registered: 'Registered',
  step2: 'Step 2',
  pc1: 'Profile 1',
  pc2: 'Profile 2',
  firstSurvey: 'First survey',
  activated: 'Activated',
};

const STAGE_LABELS = {
  eligible: 'Eligible',
  eligibleOnline: 'Ever eligible, online',
  shop: 'Shop visit',
  voucher: 'Voucher viewed',
  buyTap: 'Buy tapped',
  purchased: 'Purchased',
  redeemed: 'Redeemed',
};

const STATE_LABELS = {
  onboarding: 'Onboarding',
  stalled: 'Stalled',
  active: 'Active',
  atRisk: 'At risk',
  dormant: 'Dormant',
};

const STATE_DEFINITIONS = {
  onboarding: 'No survey yet. Signed up within the last 14 days.',
  stalled: 'No survey yet. Signed up more than 14 days ago.',
  active: 'Last survey was within the last 7 days.',
  atRisk: 'Last survey was 8 to 28 days ago.',
  dormant: 'Last survey was more than 28 days ago.',
};

const BALANCE_LABELS = {
  '0': '0',
  underHalf: 'Under half the price',
  halfToPrice: 'Half the price, under the price',
  priceToTwo: 'Price to under twice',
  twoToFour: 'Twice to under four times',
  fourOrMore: 'Four times or more',
};

const TIME_LABELS = {
  under30m: 'Under 30 minutes',
  to24h: '30 minutes to 24 hours',
  d1to3: '1 to 3 days',
  d4to7: '4 to 7 days',
  d8to14: '8 to 14 days',
  d15to30: '15 to 30 days',
  over30: 'Over 30 days',
};

const CREDIT_SHARE_LABELS = {
  '0to10': '0 to 10%',
  '11to25': '11 to 25%',
  '26to50': '26 to 50%',
  '51to75': '51 to 75%',
  '76to99': '76 to 99%',
  '100': '100%',
};

const STREAK_LABELS = {
  '1': '1 day',
  '2to3': '2 to 3',
  '4to6': '4 to 6',
  '7to13': '7 to 13',
  '14to29': '14 to 29',
  '30plus': '30 or more',
};

const VOUCHER_CHANNEL_LABELS = {
  shop_recommended: 'Shop page recommendation',
  shop: 'Shop page normal',
  survey_complete: 'Complete-survey page',
  admin_gift: 'Gifted by admin',
  merchant: 'Merchant page',
  not_recorded: 'Not recorded',
};

const PROMPT_LABELS = {
  bought: 'Bought a voucher',
  voucher: 'Opened a voucher',
  shop: 'Went to the shop',
  next_survey: 'More surveys',
  home: 'Back home',
  search: 'Searched rewards',
  none: 'No further action',
};

const KEY_LABELS = {
  slipping: 'Active to at risk',
  recovered: 'At risk to active',
  returned: 'Dormant to active',
  lateActivation: 'Stalled to active',
};

const int = (value) => {
  if (value == null || Number.isNaN(Number(value))) return '–';
  return Number(value).toLocaleString('en-US');
};

const num = (value) => {
  if (value == null || Number.isNaN(Number(value))) return '–';
  const n = Number(value);
  return Number.isInteger(n) ? int(n) : n.toLocaleString('en-US', { maximumFractionDigits: 1 });
};

const TONE = {
  good: { text: 'text-emerald-700', bar: '#059669', box: 'bg-emerald-50', ink: 'text-emerald-800' },
  mid: { text: 'text-amber-700', bar: '#d97706', box: 'bg-amber-50', ink: 'text-amber-900' },
  bad: { text: 'text-red-700', bar: '#dc2626', box: 'bg-red-50', ink: 'text-red-800' },
  neutral: { text: 'text-gray-900', bar: NAVY, box: 'bg-gray-50', ink: 'text-gray-900' },
  info: { text: 'text-sky-700', bar: '#0284c7', box: 'bg-sky-50', ink: 'text-sky-900' },
};

const STATE_TONE = {
  onboarding: 'info',
  stalled: 'mid',
  active: 'good',
  atRisk: 'mid',
  dormant: 'bad',
};

const rateTone = (rate, worse) => {
  if (rate == null || Number.isNaN(Number(rate))) return 'neutral';
  const value = Number(rate);
  if (worse) {
    if (value <= 0.02) return 'good';
    if (value <= 0.1) return 'mid';
    return 'bad';
  }
  if (value >= 0.7) return 'good';
  if (value >= 0.4) return 'mid';
  return 'bad';
};

function Share({ share, worse = false, large = false, of = '' }) {
  if (!share || share.denominator == null || !share.denominator) {
    return <span className="text-gray-400 font-normal">–</span>;
  }
  const unit = of || share.of || '';
  const counts = `${int(share.numerator)} of ${int(share.denominator)}${unit ? ` ${unit}` : ''}`;
  if (share.countsOnly || share.rate == null) {
    return <span className="text-gray-700 font-normal">{counts}</span>;
  }
  const tone = TONE[rateTone(share.rate, worse)];
  const pctLabel = `${Math.round(share.rate * 1000) / 10}%`;
  return (
    <span className="inline-flex items-baseline gap-1.5 flex-wrap font-normal">
      <span className={`font-semibold ${large ? 'text-2xl' : ''} ${tone.text}`}>{pctLabel}</span>
      <span className="text-xs text-gray-500">{counts}</span>
    </span>
  );
}

function Pct({ rate, worse = false, plain = false }) {
  if (rate == null || Number.isNaN(Number(rate))) return <span className="text-gray-400">–</span>;
  const tone = plain ? TONE.neutral : TONE[rateTone(rate, worse)];
  return <span className={`font-semibold ${tone.text}`}>{Math.round(Number(rate) * 1000) / 10}%</span>;
}

const shareText = (share, worse = false, of = '') => <Share share={share} worse={worse} of={of} />;

const when = (iso) => {
  if (!iso) return '';
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kathmandu',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
};

const duration = formatActivationDuration;

/** Compact matrix cell: percent + median surveys. Full counts sit in the title. */
const matrixCell = (cell) => {
  if (!cell?.ready) return <span className="text-gray-400">–</span>;
  const rate = cell.survey?.rate;
  const pct = rate == null || Number.isNaN(Number(rate))
    ? '–'
    : `${Math.round(Number(rate) * 1000) / 10}%`;
  const median = cell.medianSurveys == null ? null : num(cell.medianSurveys);
  const title = cell.survey?.denominator
    ? `${int(cell.survey.numerator)} of ${int(cell.survey.denominator)} signups answered${
      median == null ? '' : ` · median ${median} surveys among those who did`
    }`
    : undefined;
  return (
    <span className="block tabular-nums leading-tight" title={title}>
      <span className="font-medium text-gray-900">{pct}</span>
      {median == null ? null : <span className="text-gray-400"> · {median}</span>}
    </span>
  );
};

function Bar({ label, count, max, share, worse = false, labelWidth = '7rem' }) {
  const width = max > 0 ? Math.min(100, (Number(count) / max) * 100) : 0;
  const tone = share?.rate == null ? TONE.neutral : TONE[rateTone(share.rate, worse)];
  return (
    <div className="grid gap-3 items-center" style={{ gridTemplateColumns: `${labelWidth} minmax(0, 1fr) auto` }}>
      <span className="text-sm text-gray-700">{label}</span>
      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${width}%`, backgroundColor: tone.bar }} />
      </div>
      <span className="text-sm text-gray-900 text-right">
        {share ? shareText(share, worse) : int(count)}
      </span>
    </div>
  );
}

const windowShare = (window) => (window?.ready ? shareText(window.activated) : 'Not ready');
const windowSurvey = (window) => (window?.ready ? shareText(window.surveyActivated) : 'Not ready');

function Card({ title, children, note, summary, metricId }) {
  return (
    <section className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        {metricId ? <span className="text-[11px] font-semibold tracking-wide text-gray-400 shrink-0">{metricId}</span> : null}
      </div>
      {summary ? <p className="text-sm text-gray-600 mt-1">{summary}</p> : null}
      <div className="mt-3">{children}</div>
      {note ? (
        <details className="mt-3">
          <summary className="text-xs text-gray-500 cursor-pointer">How this is counted</summary>
          <p className="text-xs text-gray-500 mt-1">{note}</p>
        </details>
      ) : null}
    </section>
  );
}

function Notes({ items }) {
  if (!items?.length) return null;
  return (
    <ul className="mt-3 space-y-1">
      {items.filter(Boolean).map((item) => (
        <li key={item} className="text-xs text-amber-900 bg-amber-50 rounded-lg px-3 py-2">{item}</li>
      ))}
    </ul>
  );
}

function Status({ status }) {
  const styles = {
    pass: 'bg-emerald-50 text-emerald-700',
    fail: 'bg-red-50 text-red-700',
    warning: 'bg-amber-50 text-amber-800',
    unavailable: 'bg-gray-100 text-gray-600',
  };
  const labels = { pass: 'Pass', fail: 'Fail', warning: 'Warning', unavailable: 'Unavailable' };
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] || styles.unavailable}`}>
      {labels[status] || status}
    </span>
  );
}

function IdList({ count, userIds, truncated }) {
  if (!count) return null;
  return (
    <details className="mt-2">
      <summary className="text-xs text-gray-500 cursor-pointer">{int(count)} user id{count === 1 ? '' : 's'}{truncated ? ', list shortened' : ''}</summary>
      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
        {(userIds || []).map((id) => (
          <UserIdButton key={id} id={id} />
        ))}
      </div>
    </details>
  );
}

function ClarityCard({ metric }) {
  const ready = Boolean(clarityProjectId());
  return (
    <Card metricId={metric?.id} title={metric.title} summary={metric.note}>
      <a href={clarityDashboardUrl()} target="_blank" rel="noreferrer" className="text-sm font-medium text-sky-800 hover:underline">
        Open Clarity
      </a>
      <p className="text-sm text-gray-600 mt-2">
        {ready
          ? 'The script is on this site. These details stay in Clarity.'
          : 'Add VITE_CLARITY_PROJECT_ID on the site that customers use, then the script starts recording.'}
      </p>
    </Card>
  );
}

function Missing({ metric }) {
  if (!metric || metric.available !== false) return null;
  return (
    <Card metricId={metric.id} title={metric.title} summary={metric.note}>
      <p className="text-sm text-gray-500">Not available yet.</p>
    </Card>
  );
}

function Mini({ label, value, sub, tone = 'neutral' }) {
  const paint = TONE[tone] || TONE.neutral;
  const shown = React.isValidElement(value) && value.type === Share
    ? React.cloneElement(value, { large: true })
    : value;
  return (
    <div className={`${paint.box} rounded-xl p-3`}>
      <p className="text-xs text-gray-500">{label}</p>
      <div className={`text-lg font-semibold mt-1 ${paint.ink}`}>{shown}</div>
      {sub ? <p className="text-xs text-gray-500 mt-1">{sub}</p> : null}
    </div>
  );
}

function Legend() {
  return (
    <p className="text-xs text-gray-500">
      <span className="text-emerald-700 font-semibold">Green</span> is 70% or more.
      {' '}<span className="text-amber-700 font-semibold">Amber</span> is 40% up to 70%.
      {' '}<span className="text-red-700 font-semibold">Red</span> is under 40%.
      {' '}On bounces, complaints, abandonment, and failures, green means the rate is low.
    </p>
  );
}


export {
  OpenUserContext,
  latestFirst,
  UserIdButton,
  NAVY,
  SECTIONS,
  BAR_LABELS,
  STAGE_LABELS,
  STATE_LABELS,
  STATE_DEFINITIONS,
  BALANCE_LABELS,
  TIME_LABELS,
  CREDIT_SHARE_LABELS,
  STREAK_LABELS,
  VOUCHER_CHANNEL_LABELS,
  PROMPT_LABELS,
  KEY_LABELS,
  int,
  num,
  STATE_TONE,
  shareText,
  when,
  duration,
  matrixCell,
  windowShare,
  windowSurvey,
  Share,
  Pct,
  Bar,
  Card,
  Notes,
  Status,
  IdList,
  Missing,
  Mini,
  Legend,
  ClarityCard,
};
