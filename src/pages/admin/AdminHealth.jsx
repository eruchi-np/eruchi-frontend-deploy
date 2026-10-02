import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { adminAPI } from '../../services/api';
import { clarityDashboardUrl, clarityProjectId } from '../../utils/clarity';
import UserDetailDrawer from './components/UserDetailDrawer.jsx';

const OpenUserContext = React.createContext(null);

const latestFirst = (rows) => [...(rows || [])].reverse();

function UserIdButton({ id }) {
  const openUser = React.useContext(OpenUserContext);
  if (!id) return null;
  if (!openUser) return <span className="break-all">{id}</span>;
  return (
    <button type="button" onClick={() => openUser(String(id))} className="text-sky-800 underline break-all text-left">
      {id}
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

function Share({ share, worse = false, large = false }) {
  if (!share || share.denominator == null || !share.denominator) {
    return <span className="text-gray-400 font-normal">–</span>;
  }
  const counts = `${int(share.numerator)} of ${int(share.denominator)}`;
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

const shareText = (share, worse = false) => <Share share={share} worse={worse} />;

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

const duration = (ms) => {
  if (ms == null || Number.isNaN(Number(ms))) return '–';
  const hours = Number(ms) / 3600000;
  if (hours < 48) return `${num(hours)} hours`;
  return `${num(hours / 24)} days`;
};

const cellText = (cell) => {
  if (!cell?.ready) return '–';
  if (cell.medianSurveys == null) return shareText(cell.survey);
  return <span>{shareText(cell.survey)} · {num(cell.medianSurveys)}</span>;
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

function Card({ title, children, note, summary }) {
  return (
    <section className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5">
      <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
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

function LandingConversion({ metric }) {
  if (!metric || metric.available === false) return <Missing metric={metric} />;
  return (
    <Card title={metric.title} summary="Of the people who opened a tagged landing page, how many registered within 24 hours." note={metric.note}>
      {!metric.visitors ? (
        <p className="text-sm text-gray-500">No landing visits stored yet.</p>
      ) : (
        <>
          <p className="text-sm text-gray-800 mb-3">Registered within 24 hours · {shareText(metric.converted)}</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500">
                  <th className="py-2 pr-3 font-medium">Source</th>
                  <th className="py-2 pr-3 font-medium">Medium</th>
                  <th className="py-2 pr-3 font-medium">Campaign</th>
                  <th className="py-2 pr-3 font-medium">Visitors</th>
                  <th className="py-2 font-medium">Registered within 24 hours</th>
                </tr>
              </thead>
              <tbody>
                {metric.groups.map((group) => (
                  <tr key={`${group.source}|${group.medium}|${group.campaign}`} className="border-t border-gray-100">
                    <td className="py-2 pr-3">{group.source}</td>
                    <td className="py-2 pr-3">{group.medium}</td>
                    <td className="py-2 pr-3">{group.campaign}</td>
                    <td className="py-2 pr-3">{int(group.visitors)}</td>
                    <td className="py-2">{shareText(group.converted)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </Card>
  );
}

const CHANNEL_LABELS = {
  email: 'Email',
  social: 'Social',
  messaging: 'Messaging',
  direct: 'Direct',
  other: 'Other',
};

function EmailPerformance({ metric }) {
  if (!metric || metric.available === false) return <Missing metric={metric} />;
  return (
    <Card title={metric.title} summary="For each kind of reminder, how many were delivered and how many reached that reminder's goal." note={metric.note}>
      {!metric.sends ? (
        <p className="text-sm text-gray-500">No tracked sends yet.</p>
      ) : (
        <>
          <p className="text-sm text-gray-800 mb-3">
            Delivered {shareText(metric.delivered)} · reached the goal {shareText(metric.returned)} · opened {shareText(metric.opened)} · complaints {int(metric.complaints)}
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500">
                  <th className="py-2 pr-3 font-medium">Type</th>
                  <th className="py-2 pr-3 font-medium">Send</th>
                  <th className="py-2 pr-3 font-medium">Sent</th>
                  <th className="py-2 pr-3 font-medium">Delivered</th>
                  <th className="py-2 pr-3 font-medium">Permanent bounces</th>
                  <th className="py-2 pr-3 font-medium">Reached the goal</th>
                  <th className="py-2 font-medium">Opened</th>
                </tr>
              </thead>
              <tbody>
                {metric.groups.map((group) => (
                  <tr key={`${group.emailType}|${group.sequence}`} className="border-t border-gray-100">
                    <td className="py-2 pr-3">{group.label}</td>
                    <td className="py-2 pr-3">{group.sequence}</td>
                    <td className="py-2 pr-3">{int(group.sent)}</td>
                    <td className="py-2 pr-3">{shareText(group.delivered)}</td>
                    <td className="py-2 pr-3">{shareText(group.bounced, true)}</td>
                    <td className="py-2 pr-3">{shareText(group.returned)}</td>
                    <td className="py-2">{shareText(group.opened)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {metric.windowOpen ? (
            <p className="text-xs text-gray-500 mt-3">{int(metric.windowOpen)} still inside the goal window, so they are left out of the goal rate.</p>
          ) : null}
        </>
      )}
    </Card>
  );
}

function ReturnTriggers({ metric }) {
  if (!metric || metric.available === false) return <Missing metric={metric} />;
  return (
    <Card title={metric.title} summary="Signed-in visits that arrived from a channel, and how many of those people finished a survey." note={metric.note}>
      {!metric.sessions ? (
        <p className="text-sm text-gray-500">No tagged sessions stored yet.</p>
      ) : (
        <>
          <p className="text-sm text-gray-800 mb-3">Finished a survey {shareText(metric.withSurvey)}</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500">
                  <th className="py-2 pr-3 font-medium">Channel</th>
                  <th className="py-2 pr-3 font-medium">Sessions</th>
                  <th className="py-2 font-medium">Finished a survey</th>
                </tr>
              </thead>
              <tbody>
                {metric.groups.map((group) => (
                  <tr key={group.channel} className="border-t border-gray-100">
                    <td className="py-2 pr-3">{CHANNEL_LABELS[group.channel] || group.channel}</td>
                    <td className="py-2 pr-3">{int(group.sessions)}</td>
                    <td className="py-2">{shareText(group.withSurvey)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </Card>
  );
}

function EmailLoad({ metric }) {
  if (!metric || metric.available === false) return <Missing metric={metric} />;
  if (!metric.delivered) {
    return (
      <Card title={metric.title} summary="How much tracked mail one person receives in a week." note={metric.note}>
        <p className="text-sm text-gray-500">No delivered mail stored yet.</p>
      </Card>
    );
  }
  return (
    <Card title={metric.title} summary="How much tracked mail one person receives in a week." note={metric.note}>
      <div className="grid sm:grid-cols-3 gap-3">
        <Mini label="Delivered" value={int(metric.delivered)} />
        <Mini label="Per person, per week" value={num(metric.perUserWeek)} sub={`${int(metric.userWeeks)} person-weeks`} />
        <Mini label="4 or more in a week" value={shareText(metric.fourOrMore, true)} />
        <Mini label="2 or more on one day" value={shareText(metric.sameDay, true)} />
        <Mini label="Complaints per 1,000 delivered" value={metric.complaintsPerThousand == null ? '–' : num(metric.complaintsPerThousand)} />
      </div>
    </Card>
  );
}

function Deliverability({ metric }) {
  if (!metric || metric.available === false) return <Missing metric={metric} />;
  if (!metric.sends) {
    return (
      <Card title={metric.title} summary="Delivery, permanent bounces, and complaints over the last 7 and 30 days." note={metric.note}>
        <p className="text-sm text-gray-500">No tracked sends yet.</p>
      </Card>
    );
  }
  const windowLine = (label, row) => (
    <div key={label}>
      <p className="text-xs text-gray-500 mb-2">{label} · {int(row.sends)} sent</p>
      <div className="grid sm:grid-cols-2 gap-3">
        <Mini label="Delivered" value={shareText(row.delivered)} />
        <Mini label="Permanent bounces" value={shareText(row.permanentBounces, true)} />
        <Mini label="Complaints" value={shareText(row.complaints, true)} />
        <Mini label="Delayed" value={int(row.delayed)} sub={`Rendering failures ${int(row.rendering)}`} />
      </div>
    </div>
  );
  return (
    <Card title={metric.title} summary="Delivery, permanent bounces, and complaints over the last 7 and 30 days." note={metric.note}>
      <div className="space-y-4">
        {windowLine('Last 7 days', metric.days7)}
        {windowLine('Last 30 days', metric.days30)}
      </div>
    </Card>
  );
}

function ClarityCard({ metric }) {
  const ready = Boolean(clarityProjectId());
  return (
    <Card title={metric.title} summary={metric.note}>
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
    <Card title={metric.title} summary={metric.note}>
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

function Activation({ data }) {
  const max = Math.max(data.A2.cohortSize, 1);
  const activatedBar = data.A2.bars.find((bar) => bar.id === 'activated');
  const activated = data.A5?.milestones?.find((row) => row.id === 'activated');
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">How many people finish the path from signup to a first survey.</p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Mini label="Effective acquired" value={int(data.A4.total)} sub={`As of ${when(data.A4.asOf)}`} tone="info" />
        <Mini label="Activated this signup week" value={shareText(activatedBar?.pctOfCohort)} sub={data.A2.selectedWeek || ''} />
        {data.A1 ? <Mini label="Registrations, last 7 days" value={int(data.A1.last7)} sub={`Previous 7 days: ${int(data.A1.previous7)}`} tone="info" /> : null}
        {activated ? <Mini label="Median time to activate" value={duration(activated.median)} sub={activated.n ? `${int(activated.n)} people` : 'Nobody activated'} tone="info" /> : null}
      </div>
      <Card title={`Waterfall · week of ${data.A2.selectedWeek || '–'}`} summary="How far people from this signup week got, from registration through a first survey." note={data.A2.note}>
        <p className="text-xs text-gray-500 mb-3">{int(data.A2.cohortSize)} people in this signup week</p>
        <div className="space-y-2">
          {data.A2.bars.map((bar) => (
            <Bar key={bar.id} label={BAR_LABELS[bar.id]} count={bar.count} max={max} share={bar.pctOfCohort} />
          ))}
        </div>
        <Notes items={data.A2.gaps} />
      </Card>
      <Card title="Every signup week" summary="The same steps, counted separately for each signup week.">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500">
                <th className="py-2 pr-3 font-medium">Week</th>
                {Object.values(BAR_LABELS).map((label) => <th key={label} className="py-2 pr-3 font-medium">{label}</th>)}
              </tr>
            </thead>
            <tbody>
              {latestFirst(data.A2.weeks).map((week) => (
                <tr key={week.week} className="border-t border-gray-100">
                  <td className="py-2 pr-3">{week.week}{week.inProgress ? ' · in progress' : ''}</td>
                  {week.bars.map((bar) => <td key={bar.id} className="py-2 pr-3">{int(bar.count)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <Card title="Activation within 1, 7, 14, and 30 days" summary="How many of each signup week activated, or finished a survey, inside each window.">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500">
                <th className="py-2 pr-3 font-medium">Week</th>
                <th className="py-2 pr-3 font-medium">People</th>
                {['1', '7', '14', '30'].map((days) => (
                  <th key={days} className="py-2 pr-3 font-medium">{days}d activated / surveyed</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {latestFirst(data.A3.cohorts).map((cohort) => (
                <tr key={cohort.week} className="border-t border-gray-100 align-top">
                  <td className="py-2 pr-3">{cohort.week}</td>
                  <td className="py-2 pr-3">{int(cohort.cohortSize)}{cohort.lowConfidence ? ' · low' : ''}</td>
                  {['1', '7', '14', '30'].map((days) => (
                    <td key={days} className="py-2 pr-3">{windowShare(cohort.windows[days])} / {windowSurvey(cohort.windows[days])}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Notes items={data.A3.gaps} />
      </Card>
      <Card title="Effective acquired" summary="People who verified their email and finished the profile." note={data.A4.footnote}>
        <p className="text-3xl font-semibold text-sky-900">{int(data.A4.total)}</p>
        <p className="text-xs text-gray-500 mt-1">As of {when(data.A4.asOf)}</p>
      </Card>
      <Card title="Reconciliation" summary="Checks that the activation counts still match the stored records." note="This check ignores date filters.">
          <div className="space-y-3">
            {data.A12.checks.map((row) => (
              <div key={row.id}>
                <div className="flex items-center gap-2">
                  <Status status={row.status} />
                  <span className="text-sm text-gray-800">{row.name}</span>
                </div>
                {row.note ? <p className="text-xs text-gray-500 mt-1">{row.note}</p> : null}
                <IdList count={row.count} userIds={row.userIds} truncated={row.truncated} />
              </div>
            ))}
          </div>
        </Card>
      <ActivationPhase2 data={data} />
      <ActivationPhase3 data={data} />
    </div>
  );
}

function Surveys({ data }) {
  const recentDays = data.S4.days.slice(-14);
  const bucketMax = Math.max(...Object.values(data.S5.buckets), 1);
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">Who is answering surveys, how often, and where people stop.</p>
      <div className="grid sm:grid-cols-3 gap-4">
        <Mini label="Unique responders, last 28 days" value={shareText(data.S4.rolling28)} sub={`${data.S4.rolling28.from} to ${data.S4.rolling28.to}`} />
        <Mini label="Average per complete day" value={num(data.S4.dailyAverage)} sub="Today is left out" tone="info" />
        <Mini label="This week so far" value={int(data.S4.inProgressWeek.users)} sub="In progress, not in the average" tone="info" />
      </div>
      <Card title="Last 14 complete days" summary="People who finished a survey on each of the last 14 complete days." note={data.S4.gaps?.[0]}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500">
                <th className="py-2 pr-3 font-medium">Day</th>
                <th className="py-2 pr-3 font-medium">People</th>
                <th className="py-2 font-medium">Share of {data.denominator === 'effective' ? 'acquired' : 'survey-activated'}</th>
              </tr>
            </thead>
            <tbody>
              {latestFirst(recentDays).map((day) => (
                <tr key={day.day} className="border-t border-gray-100">
                  <td className="py-2 pr-3">{day.day}</td>
                  <td className="py-2 pr-3">{int(day.users)}</td>
                  <td className="py-2">{shareText(day)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      {data.S4.weeks?.length ? (
        <Card title="Complete weeks" summary="People who finished a survey in each complete Nepal week. The current week is left out.">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <tbody>
                {latestFirst(data.S4.weeks).map((week) => (
                  <tr key={week.week} className="border-t border-gray-100">
                    <td className="py-2 pr-3">{week.week}</td>
                    <td className="py-2 pr-3">{int(week.users)}</td>
                    <td className="py-2">{shareText(week)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : null}
      <Card title="How answers are spread" summary="Whether a few people answer most of the surveys." note={`${data.S5.from} to ${data.S5.to}. ${data.S5.top10.note}`}>
        <div className="grid sm:grid-cols-3 gap-3 mb-4">
          <Mini label="Top 10% share" value={shareText(data.S5.top10)} sub={`${int(data.S5.top10.people)} of ${int(data.S5.top10.of)} people`} />
          <Mini label="Survey-activated with none in this period" value={int(data.S5.zeroInPeriod)} />
          <Mini label="Never survey-activated" value={int(data.S5.neverSurveyActivated)} sub={`of ${int(data.S5.effectiveAcquired)} acquired`} />
        </div>
        <div className="space-y-2">
          {Object.entries(data.S5.buckets).map(([label, count]) => (
            <Bar key={label} label={label} count={count} max={bucketMax} labelWidth="4rem" />
          ))}
        </div>
      </Card>
      <Card title="Survey supply" summary="Surveys that are live now, and people who have nothing left they can answer.">
        <div className="grid sm:grid-cols-3 gap-3">
          <Mini label="Live public surveys" value={int(data.S7.liveNow.public)} />
          <Mini label="Live targeted surveys" value={int(data.S7.liveNow.targeted)} />
          <Mini label="Published 15-day surveys" value={int(data.S7.liveNow.fifteenDayPublished)} />
        </div>
        <p className="text-sm text-gray-700 mt-4">Nothing left to answer: {data.S7.starved.users ? shareText(data.S7.starved) : data.S7.starved.note}</p>
        <Notes items={data.S7.gaps} />
      </Card>
      <SurveysPhase2 data={data} />
      <SurveysPhase3 data={data} />
    </div>
  );
}

function Rewards({ data }) {
  const bucketMax = data.R2.available ? Math.max(...Object.values(data.R2.buckets), 1) : 1;
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">Credits, vouchers, and whether people redeem what they buy.</p>
      {data.R2.available ? (
        <>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Mini label="Median balance" value={num(data.R2.median)} sub={`Mean ${num(data.R2.mean)} · price ${int(data.R2.price)}`} tone="info" />
        <Mini label="Eligible now" value={shareText(data.R2.eligibleNow)} />
        <Mini label="Ever eligible" value={shareText(data.R2.everEligible)} />
        <Mini label="Reached eligibility" value={int(data.R3.eligible)} sub={data.R3.approximate ? 'Approximate' : ''} />
      </div>
      <Card title="Balance versus the cheapest voucher" summary="How people's credit balances compare with the cheapest voucher.">
        <div className="space-y-2">
          {Object.entries(data.R2.buckets).map(([key, count]) => (
            <Bar key={key} label={BALANCE_LABELS[key]} count={count} max={bucketMax} labelWidth="11rem" />
          ))}
        </div>
        <Notes items={data.R2.gaps} />
      </Card>
      <Card title="Surveys finished when someone could first afford a voucher" summary="How many surveys someone had finished at the moment a voucher first became affordable." note={data.R3.note}>
        <div className="flex flex-wrap gap-2">
          {Object.keys(data.R3.histogram).length === 0 ? <p className="text-sm text-gray-500">Nobody has been stamped yet.</p> : null}
          {Object.entries(data.R3.histogram).map(([surveys, count]) => (
            <span key={surveys} className="bg-gray-50 rounded-lg px-3 py-2 text-sm">{surveys === '0' ? 'No survey' : `${surveys} surveys`} · {int(count)}</span>
          ))}
        </div>
        <p className="text-sm text-gray-700 mt-3">Never eligible after 30 days: {int(data.R3.neverEligible?.count)}</p>
      </Card>
        </>
      ) : (
        <Card title="Balance and eligibility" summary="Credit balances compared with the cheapest voucher."><p className="text-sm text-gray-600">{data.R2.note}</p></Card>
      )}
      <Card title="Reward funnel" summary="From being able to afford a voucher, through the shop and a purchase, to redeeming it. Each share is of the previous step.">
        <div className="space-y-2">
          {data.R4.stages.map((stage) => (
            <Bar
              key={stage.id}
              label={STAGE_LABELS[stage.id]}
              count={stage.count}
              max={Math.max(...data.R4.stages.map((row) => row.count), 1)}
              share={stage.ofPrevious?.denominator ? stage.ofPrevious : null}
            />
          ))}
        </div>
        <Notes items={data.R4.gaps} />
        {data.R4.months?.length ? (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500">
                  <th className="py-2 pr-3 font-medium">Month first eligible</th>
                  <th className="py-2 pr-3 font-medium">Still in window</th>
                  <th className="py-2 pr-3 font-medium">Shop</th>
                  <th className="py-2 pr-3 font-medium">Purchased</th>
                  <th className="py-2 font-medium">Redeemed</th>
                </tr>
              </thead>
              <tbody>
                {latestFirst(data.R4.months).map((month) => (
                  <tr key={month.month} className="border-t border-gray-100">
                    <td className="py-2 pr-3">{month.month}</td>
                    <td className="py-2 pr-3">{int(month.stillInsideWindow)}</td>
                    <td className="py-2 pr-3">{shareText(month.shop)}</td>
                    <td className="py-2 pr-3">{shareText(month.purchased)}</td>
                    <td className="py-2">{shareText(month.redeemed)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </Card>
      <div className="grid sm:grid-cols-2 gap-4">
        <Card title="Voucher pipeline" summary="Vouchers that are still active, already redeemed, expired, or cancelled.">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Mini label="Active" value={int(data.R7.counts.active)} tone="info" />
            <Mini label="Redeemed" value={int(data.R7.counts.redeemed)} tone="good" />
            <Mini label="Expired" value={int(data.R7.counts.expired)} tone="bad" />
            <Mini label="Cancelled" value={int(data.R7.counts?.cancelled)} />
          </div>
          <Notes items={data.R7.gaps} />
          {data.R7.active?.length ? (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500">
                    <th className="py-2 pr-3 font-medium">User</th>
                    <th className="py-2 pr-3 font-medium">Days left</th>
                    <th className="py-2 font-medium">Age</th>
                  </tr>
                </thead>
                <tbody>
                  {data.R7.active.slice(0, 20).map((row) => (
                    <tr key={row.voucherId} className="border-t border-gray-100">
                      <td className="py-2 pr-3"><UserIdButton id={row.userId} /></td>
                      <td className="py-2 pr-3">{int(row.daysToExpiry)}</td>
                      <td className="py-2">{int(row.ageDays)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </Card>
        <Card title="Redemption" summary="How soon a purchased voucher was redeemed, by the week it was bought.">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500">
                  <th className="py-2 pr-3 font-medium">Cohort</th>
                  <th className="py-2 pr-3 font-medium">7 days</th>
                  <th className="py-2 pr-3 font-medium">14 days</th>
                  <th className="py-2 font-medium">By expiry</th>
                </tr>
              </thead>
              <tbody>
                {latestFirst(data.R8.cohorts).map((row) => (
                  <tr key={row.cohort} className="border-t border-gray-100">
                    <td className="py-2 pr-3">{row.cohort} · {int(row.vouchers)}</td>
                    <td className="py-2 pr-3">{shareText(row.day7)}</td>
                    <td className="py-2 pr-3">{shareText(row.day14)}</td>
                    <td className="py-2">{shareText(row.final)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-500 mt-3">
            {data.R8.hours.note || `Median ${num(data.R8.hours.median)} hours · mean ${num(data.R8.hours.mean)}`}
          </p>
        </Card>
      </div>
      <RewardsPhase2 data={data} />
      <RewardsPhase3 data={data} />
    </div>
  );
}

function Retention({ data }) {
  const tiles = [
    ['week1', 'Week 1', 1],
    ['week2', 'Week 2', 2],
    ['week4', 'Week 4', 4],
    ['week8', 'Week 8', 8],
  ];
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">Who comes back to finish another survey, and who has gone quiet.</p>
      <div className="grid sm:grid-cols-4 gap-4">
        {tiles.map(([key, label, weekN]) => {
          const tile = data.L1.tiles[key];
          const point = tile?.points?.find((row) => row.week === weekN);
          return (
            <Mini
              key={key}
              label={label}
              value={point?.survey ? shareText(point.survey) : 'Not ready'}
              sub={tile ? `Week of ${tile.week} · ${int(tile.cohortSize)} people` : 'No cohort is old enough'}
            />
          );
        })}
      </div>
      <Card title="Survey retention by signup week" summary="Of each signup week, who finished a survey in week 1, week 2, week 4, and week 8." note={data.L1.gaps?.[0]}>
        <p className="text-xs text-gray-500 mb-3">
          {int(data.L1.smallCohorts.users)} people are in signup weeks under 20. {data.L1.smallCohorts.draw ? 'Those weeks are drawn together.' : 'Those weeks are too small to draw as their own line.'}
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500">
                <th className="py-2 pr-3 font-medium">Week</th>
                <th className="py-2 pr-3 font-medium">People</th>
                {[1, 2, 4, 8].map((week) => <th key={week} className="py-2 pr-3 font-medium">Week {week}</th>)}
              </tr>
            </thead>
            <tbody>
              {latestFirst(data.L1.cohorts).map((cohort) => (
                <tr key={cohort.week} className="border-t border-gray-100">
                  <td className="py-2 pr-3">{cohort.week}</td>
                  <td className="py-2 pr-3">{int(cohort.cohortSize)}</td>
                  {[1, 2, 4, 8].map((week) => {
                    const point = cohort.points.find((row) => row.week === week);
                    return <td key={week} className="py-2 pr-3">{point?.ready ? shareText(point.survey) : '–'}</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <Card title="Lifecycle" summary="How many people are onboarding, active, at risk, or dormant, and who changed since the earlier Sunday." note={`Change from ${data.L4.transition.from} to ${data.L4.transition.to}. ${data.L4.gaps?.[0] || ''}`}>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {Object.entries(STATE_LABELS).map(([key, label]) => (
            <Mini key={key} label={label} value={int(data.L4.current.counts[key])} sub="Now" tone={STATE_TONE[key]} />
          ))}
        </div>
        <div className="grid sm:grid-cols-2 gap-2 mt-4">
          {Object.entries(KEY_LABELS).map(([key, label]) => (
            <p key={key} className="text-sm text-gray-700">{label}: {int(data.L4.transition.keyCells[key])}</p>
          ))}
          <p className="text-sm text-gray-700">New since the earlier Sunday: {int(data.L4.transition.newUsers)}</p>
        </div>
      </Card>
      <RetentionPhase2 data={data} />
      <RetentionPhase3 data={data} />
    </div>
  );
}

function Trust({ data }) {
  const checkCounts = data.Q2.checks.reduce((counts, row) => {
    const key = counts[row.status] == null ? 'unavailable' : row.status;
    return { ...counts, [key]: counts[key] + 1 };
  }, { pass: 0, fail: 0, warning: 0, unavailable: 0 });
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">Whether the stored records still agree with each other.</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Mini label="Checks passed" value={int(checkCounts.pass)} tone="good" />
        <Mini label="Checks failed" value={int(checkCounts.fail)} tone={checkCounts.fail ? 'bad' : 'good'} />
        <Mini label="Warnings" value={int(checkCounts.warning)} tone={checkCounts.warning ? 'mid' : 'neutral'} />
        <Mini label="Unavailable" value={int(checkCounts.unavailable)} />
      </div>
      <Card title="Credit and purchase checks" summary="Whether credit balances and purchases still match the ledger.">
        <div className="space-y-3">
          {data.Q2.checks.map((row) => (
            <div key={row.id}>
              <div className="flex items-center gap-2">
                <Status status={row.status} />
                <span className="text-sm text-gray-800">{row.name}</span>
              </div>
              {row.note ? <p className="text-xs text-gray-500 mt-1">{row.note}</p> : null}
              {row.purchaseFailed?.note ? <p className="text-xs text-gray-500 mt-1">{row.purchaseFailed.note}</p> : null}
              <IdList count={row.count} userIds={row.userIds} truncated={row.truncated} />
            </div>
          ))}
        </div>
      </Card>
      <Card title="Freshness" summary="When these numbers were counted, and which feeds are still missing.">
        <p className="text-sm text-gray-700">Counted {when(data.Q5.computedAt)} Nepal time.</p>
        <ul className="mt-3 space-y-1 text-xs text-gray-500">
          <li>{data.Q5.snapshot.note}</li>
          <li>{data.Q5.clarity.note}</li>
          <li>{data.Q5.emailDelivery.note}</li>
        </ul>
      </Card>
      <TrustPhase2 data={data} />
      <ClarityCard metric={data.Q3} />
    </div>
  );
}

const rangeText = (wilson) => {
  if (!wilson) return '';
  const pct = (n) => `${Math.round(n * 1000) / 10}%`;
  return `${pct(wilson.low)}–${pct(wilson.high)}`;
};

const pointsText = (value) => {
  if (value == null || Number.isNaN(Number(value))) return '–';
  const rounded = Math.round(Number(value) * 10) / 10;
  if (rounded === 0) return '0 points';
  return `${rounded > 0 ? '+' : ''}${rounded} points`;
};

function OnboardingChange({ metric }) {
  const column = (group) => (
    <div key={group.id} className="space-y-2">
      <p className="text-sm font-medium text-gray-800">{group.label}</p>
      <Mini label="People at least 7 days old" value={int(group.people)} sub={group.youngerThan7 ? `${int(group.youngerThan7)} younger, left out` : 'None younger were left out'} />
      <p className="text-sm text-gray-700">Survey within 7 days: {shareText(group.surveyActivated)} <span className="text-xs text-gray-500">{rangeText(group.surveyActivated?.wilson)}</span></p>
      <p className="text-sm text-gray-700">Activated within 7 days: {shareText(group.activated)} <span className="text-xs text-gray-500">{rangeText(group.activated?.wilson)}</span></p>
    </div>
  );
  return (
    <Card title={metric.title} summary="People who signed up before the interest list was removed, against people who signed up after, both at 7 days old." note={metric.note}>
      <div className="grid sm:grid-cols-2 gap-4 mb-4">
        {column(metric.before)}
        {column(metric.after)}
      </div>
      <p className="text-sm text-gray-700 mb-4">
        After minus before: survey {pointsText(metric.difference?.surveyActivated)}, activated {pointsText(metric.difference?.activated)}.
      </p>
      <div className="overflow-x-auto mb-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-500">
              <th className="py-2 pr-3 font-medium">Step by day 7</th>
              <th className="py-2 pr-3 font-medium">Before</th>
              <th className="py-2 pr-3 font-medium">After</th>
              <th className="py-2 font-medium">Difference</th>
            </tr>
          </thead>
          <tbody>
            {metric.before.steps.map((step) => {
              const other = metric.after.steps.find((row) => row.id === step.id);
              const gap = metric.difference.steps.find((row) => row.id === step.id);
              return (
                <tr key={step.id} className="border-t border-gray-100">
                  <td className="py-2 pr-3">{BAR_LABELS[step.id]}</td>
                  <td className="py-2 pr-3">{shareText(step)}</td>
                  <td className="py-2 pr-3">{shareText(other)}</td>
                  <td className="py-2">{pointsText(gap?.points)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-500">
              <th className="py-2 pr-3 font-medium">Source</th>
              <th className="py-2 pr-3 font-medium">Before</th>
              <th className="py-2 font-medium">After</th>
            </tr>
          </thead>
          <tbody>
            {metric.before.sources.map((row) => {
              const other = metric.after.sources.find((item) => item.source === row.source);
              return (
                <tr key={row.source} className="border-t border-gray-100">
                  <td className="py-2 pr-3">{row.source}</td>
                  <td className="py-2 pr-3">{shareText(row)}</td>
                  <td className="py-2">{shareText(other)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function ActivationPhase2({ data }) {
  if (!data.A1) return null;
  const activated = data.A5.milestones.find((row) => row.id === 'activated');
  const bucketMax = Math.max(...Object.values(activated?.buckets || { x: 1 }), 1);
  return (
    <>
      <Card title="Registrations by day" summary="New accounts each day, split by email signup and Google signup." note={data.A1.note}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500">
                <th className="py-2 pr-3 font-medium">Day</th>
                <th className="py-2 pr-3 font-medium">Total</th>
                <th className="py-2 pr-3 font-medium">Email</th>
                <th className="py-2 font-medium">Google</th>
              </tr>
            </thead>
            <tbody>
              {latestFirst(data.A1.days.slice(-14)).map((day) => (
                <tr key={day.day} className="border-t border-gray-100">
                  <td className="py-2 pr-3">{day.day}</td>
                  <td className="py-2 pr-3">{int(day.total)}</td>
                  <td className="py-2 pr-3">{int(day.email)}</td>
                  <td className="py-2">{int(day.google)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <Card title="Time to activate" summary="How long people took to reach each step after they signed up." note={data.A5.note}>
        <div className="space-y-2 mb-4">
          {Object.entries(TIME_LABELS).map(([key, label]) => (
            <Bar key={key} label={label} count={activated?.buckets?.[key] || 0} max={bucketMax} labelWidth="11rem" />
          ))}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500">
                <th className="py-2 pr-3 font-medium">Milestone</th>
                <th className="py-2 pr-3 font-medium">People</th>
                <th className="py-2 font-medium">Median</th>
              </tr>
            </thead>
            <tbody>
              {data.A5.milestones.map((row) => (
                <tr key={row.id} className="border-t border-gray-100">
                  <td className="py-2 pr-3">{BAR_LABELS[row.id]}</td>
                  <td className="py-2 pr-3">{int(row.n)}</td>
                  <td className="py-2">{duration(row.median)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data.A5.sessions?.milestones ? (
          <div className="mt-4">
            <p className="text-sm text-gray-800 mb-2">Sessions up to that step</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500">
                    <th className="py-2 pr-3 font-medium">Milestone</th>
                    <th className="py-2 pr-3 font-medium">People</th>
                    <th className="py-2 font-medium">Median sessions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.A5.sessions.milestones.map((row) => (
                    <tr key={row.id} className="border-t border-gray-100">
                      <td className="py-2 pr-3">{BAR_LABELS[row.id]}</td>
                      <td className="py-2 pr-3">{int(row.n)}</td>
                      <td className="py-2">{num(row.median)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
        <p className="text-xs text-gray-500 mt-3">{data.A5.sessions?.note}</p>
      </Card>
      <Card title="Onboarding share of credits earned" summary="How much of someone's earned credits came from the signup bonus and finishing the profile." note={data.A9.note}>
        <div className="grid sm:grid-cols-2 gap-3 mb-4">
          <Mini label="Median share" value={data.A9.share.n ? <Pct rate={data.A9.share.median / 100} plain /> : '–'} sub={data.A9.share.n ? <span>Mean <Pct rate={data.A9.share.mean / 100} plain /> · {int(data.A9.share.n)} people</span> : 'No earns yet'} />
          <Mini label="Profile only, 14 days or older" value={shareText(data.A9.profileOnly, true)} />
        </div>
        <div className="flex flex-wrap gap-2">
          {Object.entries(CREDIT_SHARE_LABELS).map(([key, label]) => (
            <span key={key} className="bg-gray-50 rounded-lg px-3 py-2 text-sm">{label} · {int(data.A9.buckets[key])}</span>
          ))}
        </div>
      </Card>
      <Card title="Activation by source" summary="Whether people from each campaign finished a survey or activated within 7 days." note={data.A13.note}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500">
                <th className="py-2 pr-3 font-medium">Source</th>
                <th className="py-2 pr-3 font-medium">Medium</th>
                <th className="py-2 pr-3 font-medium">Campaign</th>
                <th className="py-2 pr-3 font-medium">Registered</th>
                <th className="py-2 pr-3 font-medium">Surveyed in 7 days</th>
                <th className="py-2 font-medium">Activated in 7 days</th>
              </tr>
            </thead>
            <tbody>
              {data.A13.groups.map((group) => (
                <tr key={`${group.source}|${group.medium}|${group.campaign}`} className="border-t border-gray-100">
                  <td className="py-2 pr-3">{group.source}</td>
                  <td className="py-2 pr-3">{group.medium}</td>
                  <td className="py-2 pr-3">{group.campaign}</td>
                  <td className="py-2 pr-3">{int(group.registrations)}</td>
                  <td className="py-2 pr-3">{group.surveyActivated7 ? shareText(group.surveyActivated7) : `n under 30 · ${int(group.aged7)} old enough`}</td>
                  <td className="py-2">{group.activated7 ? shareText(group.activated7) : 'n under 30'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <StepList metric={data.A7} title="Onboarding abandonment" />
      {data.A11?.available ? <OnboardingChange metric={data.A11} /> : <Missing metric={data.A11} />}
    </>
  );
}

function SurveysPhase2({ data }) {
  if (!data.S1) return null;
  const latest = data.S6.weeks[data.S6.weeks.length - 1];
  return (
    <>
      <div className="grid sm:grid-cols-3 gap-4">
        <Mini label="Median responses per survey" value={num(data.S1.finals.median)} sub={data.S1.finals.n ? `Mean ${num(data.S1.finals.mean)} · ${int(data.S1.finals.n)} surveys` : 'No surveys'} />
        <Mini label="Depth last complete week" value={num(latest?.median)} sub={latest ? `Mean ${num(latest.mean)} · ${int(latest.n)} people` : ''} />
        <Mini label="Active streaks now" value={int(data.S14.activeNow)} sub={data.S14.length.n ? `Median length ${num(data.S14.length.median)}` : ''} />
      </div>
      <Card title="Responses per survey" summary="How many finishes each survey has in the first day, the first three days, and in total." note={data.S1.note}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500">
                <th className="py-2 pr-3 font-medium">Survey</th>
                <th className="py-2 pr-3 font-medium">First 24 hours</th>
                <th className="py-2 pr-3 font-medium">First 72 hours</th>
                <th className="py-2 font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {data.S1.surveys.slice(0, 20).map((survey) => (
                <tr key={survey.id} className="border-t border-gray-100">
                  <td className="py-2 pr-3">{survey.title}</td>
                  <td className="py-2 pr-3">{int(survey.first24h)}</td>
                  <td className="py-2 pr-3">{int(survey.first72h)}</td>
                  <td className="py-2">{int(survey.final)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <Card title="Surveys per person, by week" summary="How many surveys a person finished in each complete week." note={data.S6.note}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <tbody>
              {latestFirst(data.S6.weeks).map((week) => (
                <tr key={week.week} className="border-t border-gray-100">
                  <td className="py-2 pr-3">{week.week}</td>
                  <td className="py-2 pr-3">{int(week.n)} people</td>
                  <td className="py-2">median {num(week.median)} · mean {num(week.mean)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <Card title="Streaks" summary="How long current answer streaks are, and who reached 7, 14, and 30 days." note={data.S14.gaps?.[0]}>
        <div className="flex flex-wrap gap-2 mb-3">
          {Object.entries(STREAK_LABELS).map(([key, label]) => (
            <span key={key} className="bg-gray-50 rounded-lg px-3 py-2 text-sm">{label} · {int(data.S14.length.buckets[key])}</span>
          ))}
        </div>
        <p className="text-sm text-gray-700">Reached day 7: {shareText(data.S14.milestones.day7)}</p>
        <p className="text-sm text-gray-700">Reached day 14: {shareText(data.S14.milestones.day14)}</p>
        <p className="text-sm text-gray-700">Reached day 30: {shareText(data.S14.milestones.day30)}</p>
        <p className="text-sm text-gray-700">Streak Guard purchases: {int(data.S14.guards.purchases)} · buyers {int(data.S14.guards.buyers)}</p>
        <Notes items={data.S14.gaps.slice(1)} />
      </Card>
      <Card title="Survey to the next survey" summary="Of the people who finished one survey, how many finished the next one." note={data.S16.note}>
        <p className="text-sm text-gray-700 mb-3">Median across pairs: {data.S16.median == null ? '–' : <Pct rate={data.S16.median} />}</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <tbody>
              {latestFirst(data.S16.pairs.slice(-12)).map((pair) => (
                <tr key={`${pair.from}-${pair.to}`} className="border-t border-gray-100">
                  <td className="py-2 pr-3">{pair.from} → {pair.to}</td>
                  <td className="py-2">{shareText(pair)}{pair.lowConfidence ? ' · low' : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <SurveyPath data={data} />
    </>
  );
}

function RewardsPhase2({ data }) {
  if (!data.R1) return null;
  return (
    <>
      <div className="grid sm:grid-cols-3 gap-4">
        <Mini label="Credits outstanding" value={int(data.R1.outstanding)} sub={data.R1.equivalents == null ? 'No voucher price' : `${num(data.R1.equivalents)} cheapest vouchers`} />
        <Mini label="Buyers" value={int(data.R6.buyers)} sub={<span>{int(data.R6.purchases)} purchases · repeat {shareText(data.R6.repeatBuyers)}</span>} />
        <Mini label="Buyers among ever eligible" value={shareText(data.R6.amongEligible)} />
      </div>
      <Card title="Credits issued and spent" summary="Credits added and credits spent in each week. Opening balances are not new earns." note={data.R1.note}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500">
                <th className="py-2 pr-3 font-medium">Week</th>
                <th className="py-2 pr-3 font-medium">Issued</th>
                <th className="py-2 pr-3 font-medium">Spent</th>
                <th className="py-2 font-medium">Net</th>
              </tr>
            </thead>
            <tbody>
              {latestFirst(data.R1.weeks).map((week) => (
                <tr key={week.week} className="border-t border-gray-100">
                  <td className="py-2 pr-3">{week.week}</td>
                  <td className="py-2 pr-3">{int(week.issuedTotal)}</td>
                  <td className="py-2 pr-3">{int(week.spentTotal)}</td>
                  <td className="py-2">{int(week.net)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <Card title="Purchases" summary="Who bought a voucher, and how often the same person bought again." note={data.R6.note}>
        <p className="text-sm text-gray-700 mb-2">Of the selected denominator: {shareText(data.R6.ofDenominator)}</p>
        <p className="text-sm text-gray-700">Credits per purchase: median {num(data.R6.credits.median)} · mean {num(data.R6.credits.mean)}</p>
        <div className="flex flex-wrap gap-2 mt-3">
          {data.R6.byVoucher.map((row) => (
            <span key={row.title} className="bg-gray-50 rounded-lg px-3 py-2 text-sm">{row.title} · {int(row.count)}</span>
          ))}
        </div>
      </Card>
      <Card title="After the first redemption" summary="Whether people finished more surveys, or bought again, after redeeming a voucher." note={data.R10.note}>
        <p className="text-sm text-gray-700">People with a first redemption at least 30 days ago: {int(data.R10.redeemers)}</p>
        <p className="text-sm text-gray-700">Median change in surveys, 14 days after minus 14 days before: {num(data.R10.difference.median)}</p>
        <p className="text-sm text-gray-700">Bought again within 30 days: {shareText(data.R10.repeatPurchase)}</p>
        {data.R10.people?.length ? (
          <div className="overflow-x-auto mt-3">
            <table className="w-full text-sm">
              <tbody>
                {data.R10.people.map((person) => (
                  <tr key={person.userId} className="border-t border-gray-100">
                    <td className="py-2 pr-3"><UserIdButton id={person.userId} /></td>
                    <td className="py-2 pr-3">{int(person.before)} before</td>
                    <td className="py-2 pr-3">{int(person.after)} after</td>
                    <td className="py-2">{person.repeatPurchase ? 'Bought again' : 'No second purchase'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </Card>
      <Card title="Merchants" summary="Vouchers listed, bought, and redeemed for each merchant." note={data.R11.note}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500">
                <th className="py-2 pr-3 font-medium">Merchant</th>
                <th className="py-2 pr-3 font-medium">Listed</th>
                <th className="py-2 pr-3 font-medium">Purchased</th>
                <th className="py-2 font-medium">Redeemed</th>
              </tr>
            </thead>
            <tbody>
              {data.R11.merchants.map((row) => (
                <tr key={row.id || row.merchant} className="border-t border-gray-100">
                  <td className="py-2 pr-3">{row.merchant}</td>
                  <td className="py-2 pr-3">{int(row.listed)}</td>
                  <td className="py-2 pr-3">{int(row.purchases)}</td>
                  <td className="py-2">{shareText(row.redemption)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <ShopAndScans data={data} />
    </>
  );
}

function RetentionPhase2({ data }) {
  if (!data.L5) return null;
  const latest = data.L3.latest;
  return (
    <>
      <div className="grid sm:grid-cols-3 gap-4">
        <Mini label="Core panel" value={int(data.L5.count)} sub={shareText(data.L5.ofAcquired)} />
        <Mini label="Still core from four weeks ago" value={shareText(data.L5.retained)} />
        <Mini label="Weekly stickiness" value={latest ? shareText(latest.weekly) : '–'} sub={latest ? <span>Daily ratio {latest.daily == null ? '–' : <Pct rate={latest.daily} />}</span> : ''} />
      </div>
      <Card title="Cohort matrix" summary="For each signup week, the share who finished a survey in each later week." note={data.L2.note}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500">
                <th className="py-2 pr-3 font-medium">Signup week</th>
                <th className="py-2 pr-3 font-medium">People</th>
                {Array.from({ length: 13 }, (_, week) => <th key={week} className="py-2 pr-3 font-medium">{week}</th>)}
              </tr>
            </thead>
            <tbody>
              {latestFirst(data.L2.cohorts).map((cohort) => (
                <tr key={cohort.week} className="border-t border-gray-100">
                  <td className="py-2 pr-3 whitespace-nowrap">{cohort.week}</td>
                  <td className="py-2 pr-3">{int(cohort.cohortSize)}</td>
                  {cohort.cells.map((cell) => <td key={cell.week} className="py-2 pr-3 whitespace-nowrap">{cellText(cell)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <Card title="Core panel by week" summary="People who finished a survey in at least 3 of the last 4 complete weeks." note={data.L5.note}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <tbody>
              {latestFirst(data.L5.series).map((row) => (
                <tr key={row.week} className="border-t border-gray-100">
                  <td className="py-2 pr-3">{row.week}</td>
                  <td className="py-2 pr-3">{int(row.count)}</td>
                  <td className="py-2">{shareText(row.ofAcquired)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}

function Channel({ data }) {
  if (!data.C4) return null;
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">Who can be reached, and whether tracked mail is delivered and brings people back.</p>
      <div className="grid sm:grid-cols-3 gap-4">
        <Mini label="Verified email" value={shareText(data.C4.verified)} sub={`${int(data.C4.base)} acquired`} />
        <Mini label="Not unsubscribed" value={shareText(data.C4.notUnsubscribed)} />
        <Mini label="Phone captured" value={shareText(data.C4.phone)} />
      </div>
      <Card title="Reachability" summary="Who can still be emailed." note={data.C4.note}>
        <div className="grid sm:grid-cols-2 gap-3">
          <Mini label="Hard bounce" value={shareText(data.C4.hardBounce, true)} />
          <Mini label="Reachable by email" value={shareText(data.C4.reachable)} />
        </div>
      </Card>
      <EmailPerformance metric={data.C1} />
      <ReturnTriggers metric={data.C2} />
      <EmailLoad metric={data.C7} />
      <Deliverability metric={data.C8} />
      <ClarityCard metric={data.C3} />
      <LandingConversion metric={data.C6} />
    </div>
  );
}

function TrustPhase2({ data }) {
  if (!data.Q1) return null;
  return (
    <Card title="Account integrity" summary="Staff accounts, possible duplicate people, and surveys finished unusually fast." note={data.Q1.note}>
      <div className="grid sm:grid-cols-3 gap-3 mb-4">
        <Mini label="Internal accounts" value={int(data.Q1.internal)} />
        <Mini label="Suspected duplicates" value={int(data.Q1.duplicates)} />
        <Mini label="Credits held by duplicates" value={shareText(data.Q1.credits, true)} sub={`${int(data.Q1.purchases)} purchases`} />
      </div>
      <p className="text-sm text-gray-600 mb-3">
        {data.Q1.farming.available ? `Suspected farming: ${int(data.Q1.farming.count)}. Credits held: ${int(data.Q1.farming.credits)}. ` : ''}
        {data.Q1.farming.note}
      </p>
      {data.Q1.flagged?.length ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500">
                <th className="py-2 pr-3 font-medium">User</th>
                <th className="py-2 pr-3 font-medium">Flag</th>
                <th className="py-2 pr-3 font-medium">Credits</th>
                <th className="py-2 font-medium">Surveys</th>
              </tr>
            </thead>
            <tbody>
              {data.Q1.flagged.slice(0, 20).map((row) => (
                <tr key={row.userId} className="border-t border-gray-100">
                  <td className="py-2 pr-3"><UserIdButton id={row.userId} /></td>
                  <td className="py-2 pr-3">{row.reason}</td>
                  <td className="py-2 pr-3">{int(row.credits)}</td>
                  <td className="py-2">{int(row.surveys)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      {data.Q1.truncated ? <p className="text-xs text-gray-500 mt-2">The list is shortened.</p> : null}
    </Card>
  );
}

const SINK_LABELS = {
  voucher_redemption: 'Vouchers',
  streak_guard: 'Streak guards',
  survey_timeout: 'Survey timeout',
  admin_adjustment: 'Admin adjustment',
  other: 'Other',
};

const ONBOARD_STEPS = { step2: 'Step 2', pc1: 'Profile 1', pc2: 'Profile 2' };

function StepList({ metric, title }) {
  if (!metric) return null;
  if (metric.available === false) return <Missing metric={metric} />;
  return (
    <Card title={title} summary="People who opened an onboarding step and did not submit it within 7 days." note={metric.note}>
      {metric.steps.map((row) => (
        <p key={row.step} className="text-sm text-gray-700 mb-1">
          {ONBOARD_STEPS[row.step] || row.step}: {int(row.viewed)} viewed · {shareText(row.submitted)} submitted
          {row.abandonment == null ? '' : <> · <Pct rate={row.abandonment} worse /> left</>}
        </p>
      ))}
    </Card>
  );
}

function FieldErrors({ metric }) {
  if (!metric) return null;
  if (metric.available === false) return <Missing metric={metric} />;
  return (
    <Card title="Field errors" summary="Fields that failed on an onboarding step, and people who left without submitting." note={metric.note}>
      {metric.rows.length ? metric.rows.slice(0, 12).map((row) => (
        <p key={`${row.step}:${row.field}`} className="text-sm text-gray-700 mb-1">
          {ONBOARD_STEPS[row.step] || row.step} · {row.field}: {shareText(row.errors, true)} · left {shareText(row.leftWithoutSubmit, true)}
        </p>
      )) : <p className="text-sm text-gray-500">No field errors stored yet.</p>}
    </Card>
  );
}

function SurveyPath({ data }) {
  if (!data.S2 || !data.S3) return null;
  if (data.S2.available === false) return (<><Missing metric={data.S2} /><Missing metric={data.S3} /></>);
  const shown = (data.S2.surveys || []).filter((row) => !row.targeted).slice(0, 8);
  return (
    <>
      <Card title="Survey exposure" summary="How often a survey card was shown to someone who could answer it." note={data.S2.note}>
        <Mini label="Median exposure" value={<Pct rate={data.S2.median} />} />
        <div className="mt-3 space-y-1">
          {shown.length ? shown.map((row) => (
            <p key={row.id} className="text-sm text-gray-700">{row.title}: {shareText(row.exposure)} viewed · {int(row.reachable)} reached</p>
          )) : <p className="text-sm text-gray-500">No card views stored yet.</p>}
        </div>
      </Card>
      <Card title="Survey funnel" summary="From seeing a survey, to starting it, to finishing it." note={data.S3.note}>
        <div className="grid sm:grid-cols-3 gap-3">
          <Mini label="Viewed" value={int(data.S3.viewed)} />
          <Mini label="Started" value={shareText(data.S3.started)} />
          <Mini label="Completed" value={shareText(data.S3.completed)} />
        </div>
        <p className="text-sm text-gray-700 mt-3">Started without a card view: {int(data.S3.startedWithoutView)}</p>
        <p className="text-sm text-gray-700">Finished of those who viewed: {shareText(data.S3.overall)}</p>
      </Card>
    </>
  );
}

function QuestionDropoff({ metric }) {
  if (!metric) return null;
  if (metric.available === false) return <Missing metric={metric} />;
  const shown = (metric.surveys || []).slice(0, 6);
  return (
    <Card title="Question drop-off" summary="Where people stop inside a survey, question by question." note={metric.note}>
      {shown.length ? shown.map((survey) => (
        <div key={survey.id} className="mb-3">
          <p className="text-sm font-medium text-gray-800">{int(survey.started)} started</p>
          {survey.questions.map((row) => (
            <p key={row.position} className="text-sm text-gray-700">Question {row.position + 1}: {shareText(row.answered)} · median {num(row.time.median == null ? null : row.time.median / 1000)}s</p>
          ))}
        </div>
      )) : <p className="text-sm text-gray-500">No question timing stored yet.</p>}
    </Card>
  );
}

function ShopAndScans({ data }) {
  if (!data.R5 || !data.R9) return null;
  if (data.R5.available === false) return (<><Missing metric={data.R5} /><Missing metric={data.R9} /></>);
  return (
    <>
      <Card title="Shop behaviour" summary="What people did on shop visits, including visits where nothing was affordable." note={data.R5.note}>
        <div className="grid sm:grid-cols-2 gap-3">
          <Mini label="Visits per person" value={num(data.R5.visitsPerUser.median)} sub={`Mean ${num(data.R5.visitsPerUser.mean)}`} />
          <Mini label="Empty visits" value={shareText(data.R5.emptyVisits, true)} />
          <Mini label="Could not afford" value={shareText(data.R5.cannotAfford, true)} />
          <Mini label="Median shortfall" value={num(data.R5.shortfall.median)} sub="credits" />
        </div>
      </Card>
      <Card title="Redemption friction" summary="Scans that failed, and vouchers that were opened but not approved." note={data.R9.note}>
        <div className="grid sm:grid-cols-3 gap-3 mb-3">
          <Mini label="Opens" value={int(data.R9.opens)} />
          <Mini label="Scan attempts" value={int(data.R9.attempts)} />
          <Mini label="Opened, not approved in 24 hours" value={shareText(data.R9.openedNotRedeemed, true)} />
        </div>
        <p className="text-sm text-gray-700">Failures: {shareText(data.R9.failureRate, true)}</p>
        <p className="text-sm text-gray-700">Rejections: {shareText(data.R9.rejectionRate, true)}</p>
        {(data.R9.failures || []).map((row) => (
          <p key={`f-${row.reason}`} className="text-sm text-gray-600">{row.reason}: {int(row.count)}</p>
        ))}
        {(data.R9.rejections || []).map((row) => (
          <p key={`r-${row.reason}`} className="text-sm text-gray-600">{row.reason}: {int(row.count)}</p>
        ))}
      </Card>
    </>
  );
}

function LastAction({ metric }) {
  if (!metric) return null;
  if (metric.available === false) return <Missing metric={metric} />;
  return (
    <Card title="Last action" summary="The last thing recorded before someone churned." note={metric.note}>
      {metric.groups.map((row) => (
        <p key={row.id} className="text-sm text-gray-700 mb-1">{row.id}: {shareText(row)}</p>
      ))}
    </Card>
  );
}

function ActivationPhase3({ data }) {
  if (!data.A6) return null;
  return (
    <>
      <Card title="First-survey speed" summary="How soon the first survey was finished after signup." note={data.A6.note}>
        <div className="grid sm:grid-cols-4 gap-3">
          <Mini label="Within 30 minutes" value={shareText(data.A6.windows['30min'])} />
          <Mini label="Within 24 hours" value={shareText(data.A6.windows['24h'])} />
          <Mini label="Within 7 days" value={shareText(data.A6.windows['7d'])} />
          <Mini label="Median to first survey" value={duration(data.A6.median)} sub={`${int(data.A6.n)} people`} />
        </div>
      </Card>
      <FieldErrors metric={data.A8} />
    </>
  );
}

function SurveysPhase3({ data }) {
  if (!data.S8) return null;
  const shown = data.S8.surveys.slice(0, 12);
  const hourMax = Math.max(...data.S12.hours.map((row) => row.count), 1);
  return (
    <>
      <Card title="Survey traits" summary="How long surveys are, and how many questions they ask." note={data.S8.note}>
        <div className="grid sm:grid-cols-3 gap-3 mb-4">
          {[
            ['Length', data.S8.byLength],
            ['Reward', data.S8.byReward],
            ['Days open', data.S8.byDaysOpen],
          ].map(([label, rows]) => (
            <div key={label}>
              <p className="text-xs text-gray-500 mb-1">{label}</p>
              {rows.map((row) => (
                <p key={row.id} className="text-sm text-gray-700">{row.id}: {int(row.surveys)} surveys · {num(row.median)} per 100</p>
              ))}
            </div>
          ))}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500">
                <th className="py-2 pr-3 font-medium">Survey</th>
                <th className="py-2 pr-3 font-medium">Questions</th>
                <th className="py-2 pr-3 font-medium">Minutes</th>
                <th className="py-2 pr-3 font-medium">Credits</th>
                <th className="py-2 pr-3 font-medium">Responses</th>
                <th className="py-2 font-medium">Per 100</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((row) => (
                <tr key={row.id} className="border-t border-gray-100">
                  <td className="py-2 pr-3">{row.title}</td>
                  <td className="py-2 pr-3">{int(row.questions)}</td>
                  <td className="py-2 pr-3">{num(row.minutes)}{row.minutesSource === 'estimate' ? ' est.' : ''}</td>
                  <td className="py-2 pr-3">{int(row.credits)}</td>
                  <td className="py-2 pr-3">{int(row.responses)}</td>
                  <td className="py-2">{row.targeted ? 'Targeted' : num(row.per100)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data.S8.surveys.length > shown.length ? (
          <p className="text-xs text-gray-500 mt-2">Showing {shown.length} of {int(data.S8.surveys.length)} surveys.</p>
        ) : null}
      </Card>
      <Card title="Response quality" summary="Finishes that were much faster than the usual time for that survey." note={data.S10.note}>
        <div className="grid sm:grid-cols-2 gap-3">
          <Mini label="Speeders" value={shareText(data.S10.speeders, true)} />
          <Mini label="Flagged on 3 or more surveys" value={int(data.S10.repeatSpeeders)} />
          {data.S10.straightLining?.available ? (
            <Mini label="Same answer on every grid row" value={shareText(data.S10.straightLining, true)} />
          ) : null}
          {data.S10.attentionChecks?.available ? (
            <Mini label="Wrong attention check" value={shareText(data.S10.attentionChecks, true)} />
          ) : null}
        </div>
        <p className="text-sm text-gray-600 mt-3">{data.S10.straightLining?.note}</p>
        <p className="text-sm text-gray-600 mt-1">{data.S10.attentionChecks?.note}</p>
      </Card>
      <Card title="Reward yield" summary="Credits a survey pays, and how many surveys it takes to afford the cheapest voucher." note={data.S11.note}>
        <div className="grid sm:grid-cols-4 gap-3">
          <Mini label="Median credits" value={num(data.S11.credits.median)} sub={`Mean ${num(data.S11.credits.mean)}`} />
          <Mini label="Median credits per minute" value={num(data.S11.perMinute.median)} />
          <Mini label="Weighted credits per minute" value={num(data.S11.weightedPerMinute)} />
          <Mini label="Surveys to first voucher" value={int(data.S11.surveysToFirstVoucher)} sub={data.S11.price == null ? '' : `Price ${int(data.S11.price)}`} />
        </div>
      </Card>
      <Card title="Timing patterns" summary="Which weekdays and hours surveys are finished." note={data.S12.note}>
        <div className="overflow-x-auto mb-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500">
                <th className="py-2 pr-3 font-medium">Published</th>
                <th className="py-2 pr-3 font-medium">Within 24 hours</th>
                <th className="py-2 font-medium">All finishes, last 8 weeks</th>
              </tr>
            </thead>
            <tbody>
              {data.S12.weekdays.map((row) => {
                const soon = data.S12.within24h.find((item) => item.weekday === row.weekday);
                return (
                  <tr key={row.weekday} className="border-t border-gray-100">
                    <td className="py-2 pr-3">{row.weekday}</td>
                    <td className="py-2 pr-3">{shareText(soon)}</td>
                    <td className="py-2">{int(row.count)} · <Pct rate={row.share} plain /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="grid grid-cols-8 sm:grid-cols-12 gap-1">
          {data.S12.hours.map((row) => (
            <div key={row.hour} className="text-center">
              <div className="h-10 bg-gray-100 rounded flex items-end overflow-hidden">
                <div className="w-full" style={{ height: `${(row.count / hourMax) * 100}%`, backgroundColor: NAVY }} />
              </div>
              <p className="text-[10px] text-gray-500">{row.hour}</p>
            </div>
          ))}
        </div>
      </Card>
      <QuestionDropoff metric={data.S9} />
      <ClarityCard metric={data.S13} />
    </>
  );
}

function RewardsPhase3({ data }) {
  if (!data.R14) return null;
  return (
    <>
      <Card title="Credit sinks" summary="Where spent credits went: vouchers, streak guards, and other spends." note={data.R14.note}>
        <div className="grid sm:grid-cols-2 gap-3 mb-4">
          <Mini label="People who spent" value={int(data.R14.spenders)} />
          <Mini label="Bought a voucher and used a guard" value={shareText(data.R14.boughtBoth)} />
          <Mini label="First spend was a guard" value={shareText(data.R14.firstSpendGuard, true)} />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500">
                <th className="py-2 pr-3 font-medium">Sink</th>
                <th className="py-2 pr-3 font-medium">Credits</th>
                <th className="py-2 pr-3 font-medium">Share</th>
                <th className="py-2 font-medium">Spenders</th>
              </tr>
            </thead>
            <tbody>
              {data.R14.sinks.map((row) => (
                <tr key={row.reason} className="border-t border-gray-100">
                  <td className="py-2 pr-3">{SINK_LABELS[row.reason] || row.reason}</td>
                  <td className="py-2 pr-3">{int(row.credits)}</td>
                  <td className="py-2 pr-3"><Pct rate={row.share} plain /></td>
                  <td className="py-2">{int(row.spenders)} · median {num(row.perSpender.median)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <Card title="Catalog fit" summary="Which voucher categories and prices people buy and open." note={data.R12.views.note}>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500 mb-1">Purchases by category</p>
            {data.R12.byCategory.map((row) => (
              <p key={row.id} className="text-sm text-gray-700">{row.id}: {int(row.count)} · <Pct rate={row.share} plain /></p>
            ))}
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Purchases by price</p>
            {data.R12.byPrice.map((row) => (
              <p key={row.id} className="text-sm text-gray-700">{row.id}: {int(row.count)} · <Pct rate={row.share} plain /></p>
            ))}
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Views by category</p>
            {data.R12.views.byCategory.length ? data.R12.views.byCategory.map((row) => (
              <p key={row.id} className="text-sm text-gray-700">{row.id}: {int(row.count)} · <Pct rate={row.share} plain /></p>
            )) : <p className="text-sm text-gray-500">No voucher views stored yet.</p>}
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Merchants opened</p>
            <p className="text-sm text-gray-700">Median {num(data.R12.views.merchantsViewed.median)} · 2 or more {shareText(data.R12.views.twoMerchants)}</p>
          </div>
        </div>
        <div className="mt-4">
          <p className="text-xs text-gray-500 mb-1">Views by voucher</p>
          {data.R12.views.vouchers?.length ? data.R12.views.vouchers.map((row) => (
            <p key={row.id} className="text-sm text-gray-700">{row.title}: {int(row.count)} · <Pct rate={row.share} plain /></p>
          )) : <p className="text-sm text-gray-500">No voucher views stored yet.</p>}
        </div>
        <p className="text-sm text-gray-700 mt-3">Same municipality: {shareText(data.R12.locality)}</p>
        <p className="text-xs text-gray-500 mt-1">{data.R12.locality.note}</p>
      </Card>
      <Card title={data.R13.title} summary="What people do on the page right after a survey: buy a voucher there, open the shop, or take another survey." note={data.R13.note}>
        {!data.R13.shown ? (
          <p className="text-sm text-gray-500">No survey-complete visits stored yet.</p>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 gap-3 mb-4">
              <Mini label="Survey-complete visits" value={int(data.R13.shown)} tone="info" />
              <Mini label="Bought within 30 minutes" value={shareText(data.R13.bought)} />
            </div>
            <div className="space-y-1">
              {data.R13.actions.map((row) => (
                <p key={row.id} className="text-sm text-gray-700">{PROMPT_LABELS[row.id] || row.id}: {shareText(row)}</p>
              ))}
            </div>
          </>
        )}
      </Card>
    </>
  );
}

function RetentionPhase3({ data }) {
  if (!data.L6) return null;
  return (
    <>
      <Card title="Churn" summary="People who stopped, and how many days that took." note={data.L6.note}>
        <div className="grid sm:grid-cols-2 gap-3">
          <Mini label="Churned" value={int(data.L6.churned)} />
          <Mini label="Median days to churn" value={num(data.L6.timeToChurn.median)} sub={`Mean ${num(data.L6.timeToChurn.mean)} · ${int(data.L6.timeToChurn.n)} people`} />
        </div>
      </Card>
      <LastAction metric={data.L6.lastAction} />
      {data.L7 ? (
        <Card title="Referral" summary="Invites sent, signups from those invites, and how many of those people activated within 7 days." note={data.L7.note}>
          <div className="grid sm:grid-cols-3 gap-3 mb-4">
            <Mini label="Invites sent" value={int(data.L7.invites)} />
            <Mini label="Signups from invites" value={int(data.L7.signups)} />
            <Mini label="Invite to signup" value={shareText(data.L7.conversion)} />
          </div>
          {data.L7.invites > 0 ? (
            <>
              <p className="text-sm text-gray-700 mb-3">Survey within 7 days: {data.L7.surveyActivated ? shareText(data.L7.surveyActivated) : 'None of these signups are 7 days old yet'}</p>
              <p className="text-sm text-gray-700 mb-4">Activated within 7 days: {data.L7.activated ? shareText(data.L7.activated) : 'None of these signups are 7 days old yet'}</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-gray-500">
                      <th className="py-2 pr-3 font-medium">Referrer signup week</th>
                      <th className="py-2 pr-3 font-medium">Invites</th>
                      <th className="py-2 pr-3 font-medium">Signups</th>
                      <th className="py-2 pr-3 font-medium">Invite to signup</th>
                      <th className="py-2 font-medium">Survey within 7 days</th>
                    </tr>
                  </thead>
                  <tbody>
                    {latestFirst(data.L7.cohorts.filter((row) => row.cohort !== '(unknown)'))
                      .concat(data.L7.cohorts.filter((row) => row.cohort === '(unknown)'))
                      .map((row) => (
                      <tr key={row.cohort} className="border-t border-gray-100">
                        <td className="py-2 pr-3">{row.cohort}</td>
                        <td className="py-2 pr-3">{int(row.invites)}</td>
                        <td className="py-2 pr-3">{int(row.signups)}</td>
                        <td className="py-2 pr-3">{shareText(row.conversion)}</td>
                        <td className="py-2">{row.surveyActivated ? shareText(row.surveyActivated) : '–'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : null}
        </Card>
      ) : null}
    </>
  );
}

export default function AdminHealth() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [section, setSection] = useState('activation');
  const [selectedUserId, setSelectedUserId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    let timer = null;
    let hasData = false;
    const load = () => {
      adminAPI.getPhase1Health({ skipErrorToast: true })
        .then((response) => {
          if (cancelled) return;
          setData(response.data.data);
          setError('');
          hasData = true;
          if (response.data.refreshing) {
            setRefreshing(true);
            timer = setTimeout(load, 2000);
          } else {
            setRefreshing(false);
          }
        })
        .catch((err) => {
          if (cancelled) return;
          setRefreshing(false);
          if (err.response?.status === 401 || err.response?.status === 403) {
            navigate('/admin');
            return;
          }
          if (!hasData) setError('The health counts could not be loaded.');
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    };
    load();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [navigate]);

  return (
    <OpenUserContext.Provider value={setSelectedUserId}>
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => navigate('/admin')} className="p-2 hover:bg-gray-100 rounded-lg" aria-label="Back to admin">
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Platform health</h1>
              <p className="text-sm text-gray-500">Separate from the operations dashboard. {data ? `Counted ${when(data.computedAt)}.` : 'Counts are read when this page opens.'}{refreshing ? ' Updating the count.' : ''}</p>
              <div className="mt-2"><Legend /></div>
            </div>
          </div>
          <div className="flex gap-2 mt-4 overflow-x-auto">
            {SECTIONS.map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setSection(id)}
                className="px-4 py-2 rounded-xl text-sm font-medium shrink-0"
                style={section === id ? { backgroundColor: NAVY, color: 'white' } : { backgroundColor: 'white', color: '#4b5563', border: '1px solid #e5e7eb' }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {loading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : null}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {data?.phaseBlocked ? (
          <p className="mb-4 rounded-xl bg-red-50 text-red-800 text-sm px-4 py-3">A credit ledger does not match the stored balance. That blocks this phase. Balances were not changed.</p>
        ) : null}
        {data && section === 'activation' ? <Activation data={data} /> : null}
        {data && section === 'surveys' ? <Surveys data={data} /> : null}
        {data && section === 'rewards' ? <Rewards data={data} /> : null}
        {data && section === 'retention' ? <Retention data={data} /> : null}
        {data && section === 'channel' ? <Channel data={data} /> : null}
        {data && section === 'trust' ? <Trust data={data} /> : null}
      </div>
      {selectedUserId ? (
        <UserDetailDrawer
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
          NAVY={NAVY}
        />
      ) : null}
    </div>
    </OpenUserContext.Provider>
  );
}
