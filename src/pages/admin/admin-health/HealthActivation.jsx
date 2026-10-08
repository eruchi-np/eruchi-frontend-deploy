// Activation tab. Signup through the first survey, registrations by week, and where people came from.

import { useEffect, useMemo, useState } from 'react';
import { registrationsByWeek, sumWaterfallBars } from './healthActivationView';
import { StackedRegistrationsChart } from './HealthChartKit.jsx';
import {
  BAR_LABELS,
  Bar,
  Card,
  CREDIT_SHARE_LABELS,
  duration,
  IdList,
  int,
  latestFirst,
  Mini,
  Missing,
  Notes,
  num,
  Pct,
  shareText,
  Status,
  TIME_LABELS,
  when,
  windowShare,
  windowSurvey,
} from './healthUi.jsx';

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

const ONBOARD_STEPS = { step2: 'Step 2', pc1: 'Profile 1', pc2: 'Profile 2' };

function StepList({ metric, title }) {
  if (!metric) return null;
  if (metric.available === false) return <Missing metric={metric} />;
  return (
    <Card metricId={metric.id} title={title} summary="People who opened an onboarding step and did not submit it within 7 days." note={metric.note}>
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
    <Card metricId={metric.id || 'A8'} title="Field errors" summary="Fields that failed on an onboarding step, and people who left without submitting." note={metric.note}>
      {metric.rows.length ? metric.rows.slice(0, 12).map((row) => (
        <p key={`${row.step}:${row.field}`} className="text-sm text-gray-700 mb-1">
          {ONBOARD_STEPS[row.step] || row.step} · {row.field}: {shareText(row.errors, true)} · left {shareText(row.leftWithoutSubmit, true)}
        </p>
      )) : <p className="text-sm text-gray-500">No field errors stored yet.</p>}
    </Card>
  );
}

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
    <Card metricId={metric.id} title={metric.title} summary="People who signed up before the interest list was removed, against people who signed up after, both at 7 days old." note={metric.note}>
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

function RegistrationsByPeriod({ metric }) {
  const [mode, setMode] = useState('day');
  const days = metric.days || [];
  const weeks = useMemo(() => registrationsByWeek(days), [days]);
  const rows = mode === 'week' ? weeks : days;
  const xKey = mode === 'week' ? 'week' : 'day';

  return (
    <Card
      metricId="A1"
      title="Registrations by day"
      summary="New accounts each day, or rolled up by signup week, split by email signup and Google signup."
      note={metric.note}
    >
      <div className="flex gap-2 mb-3">
        {[
          ['day', 'By day'],
          ['week', 'By week'],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setMode(value)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
              mode === value
                ? 'bg-sky-50 border-sky-200 text-sky-900'
                : 'bg-white border-gray-200 text-gray-600'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <StackedRegistrationsChart rows={rows} xKey={xKey} />
      {mode === 'day' ? (
        <p className="text-xs text-gray-500 mt-2">Past month of complete Nepal days. Today is left out.</p>
      ) : (
        <p className="text-xs text-gray-500 mt-2">Same days, added into Monday-start Nepal signup weeks.</p>
      )}
    </Card>
  );
}

function SignupPace({ data }) {
  if (!data.A1) return null;
  const activated = data.A5.milestones.find((row) => row.id === 'activated');
  const bucketMax = Math.max(...Object.values(activated?.buckets || { x: 1 }), 1);
  return (
    <>
      <RegistrationsByPeriod metric={data.A1} />
      <Card metricId="A5" title="Time to activate" summary="How long people took to reach each step after they signed up." note={data.A5.note}>
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
      <Card metricId="A9" title="Onboarding share of credits earned" summary="How much of someone's earned credits came from the signup bonus and finishing the profile." note={data.A9.note}>
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
      <Card metricId="A13" title="Activation by source" summary="Whether people from each campaign finished a survey or activated within 7 days." note={data.A13.note}>
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

function FirstSurvey({ data }) {
  if (!data.A6) return null;
  return (
    <>
      <Card metricId="A6" title="First-survey speed" summary="How soon the first survey was finished after signup." note={data.A6.note}>
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

export function Activation({ data }) {
  const weeks = data.A2.weeks || [];
  const defaultWeek = data.A2.selectedWeek;
  const [selectedWeeks, setSelectedWeeks] = useState(() => new Set(defaultWeek ? [defaultWeek] : []));

  useEffect(() => {
    setSelectedWeeks(new Set(defaultWeek ? [defaultWeek] : []));
  }, [defaultWeek]);

  const picked = weeks.filter((week) => selectedWeeks.has(week.week));
  const waterfall = sumWaterfallBars(picked);
  const max = Math.max(waterfall.cohortSize, 1);
  const activatedBar = waterfall.bars.find((bar) => bar.id === 'activated');
  const activated = data.A5?.milestones?.find((row) => row.id === 'activated');
  const weekLabel = picked.length === 1
    ? `week of ${picked[0].week}`
    : picked.length
      ? `${picked.length} signup weeks`
      : 'no weeks selected';

  const toggleWeek = (week) => {
    setSelectedWeeks((current) => {
      const next = new Set(current);
      if (next.has(week)) next.delete(week);
      else next.add(week);
      return next;
    });
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">How many people finish the path from signup to a first survey.</p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Mini label="Effective acquired" value={int(data.A4.total)} sub={`As of ${when(data.A4.asOf)}`} tone="info" />
        <Mini
          label="Activated in selected weeks"
          value={shareText(activatedBar?.pctOfCohort, false, 'signups')}
          sub={picked.length ? weekLabel : 'Select a week'}
        />
        {data.A1 ? <Mini label="Registrations, last 7 days" value={int(data.A1.last7)} sub={`Previous 7 days: ${int(data.A1.previous7)}`} tone="info" /> : null}
        {activated ? <Mini label="Median time to activate" value={duration(activated.median)} sub={activated.n ? `${int(activated.n)} people` : 'Nobody activated'} tone="info" /> : null}
      </div>
      <Card metricId="A2" title={`Waterfall · ${weekLabel}`} summary="How far people from the selected signup weeks got, from registration through a first survey." note={data.A2.note}>
        <div className="mb-4">
          <p className="text-xs font-medium text-gray-600 mb-2">Signup weeks</p>
          <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto">
            {latestFirst(weeks).map((week) => {
              const checked = selectedWeeks.has(week.week);
              return (
                <label
                  key={week.week}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs border cursor-pointer ${
                    checked ? 'bg-sky-50 border-sky-200 text-sky-900' : 'bg-white border-gray-200 text-gray-600'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleWeek(week.week)}
                    className="rounded border-gray-300"
                  />
                  {week.week}
                  {week.inProgress ? ' · in progress' : ''}
                  <span className="text-gray-400">({int(week.cohortSize)})</span>
                </label>
              );
            })}
          </div>
          <div className="mt-2 flex flex-wrap gap-3 text-xs">
            <button
              type="button"
              className="text-sky-800 hover:underline"
              onClick={() => setSelectedWeeks(new Set(defaultWeek ? [defaultWeek] : []))}
            >
              Latest finished week
            </button>
            <button
              type="button"
              className="text-sky-800 hover:underline"
              onClick={() => setSelectedWeeks(new Set(weeks.map((week) => week.week)))}
            >
              All weeks
            </button>
            <button
              type="button"
              className="text-sky-800 hover:underline"
              onClick={() => setSelectedWeeks(new Set())}
            >
              Clear
            </button>
          </div>
        </div>
        <p className="text-xs text-gray-500 mb-3">{int(waterfall.cohortSize)} people in the selected week{picked.length === 1 ? '' : 's'}</p>
        {picked.length === 0 ? (
          <p className="text-sm text-gray-500">Select one or more signup weeks to see the waterfall.</p>
        ) : (
          <div className="space-y-2">
            {waterfall.bars.map((bar) => (
              <Bar key={bar.id} label={BAR_LABELS[bar.id]} count={bar.count} max={max} share={{ ...bar.pctOfCohort, of: 'signups' }} />
            ))}
          </div>
        )}
        <Notes items={data.A2.gaps} />
      </Card>
      <Card metricId="A2" title="Every signup week" summary="The same steps, counted separately for each signup week.">
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
      <Card metricId="A3" title="Activation within 1, 7, 14, and 30 days" summary="How many of each signup week activated, or finished a survey, inside each window.">
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
      <Card metricId="A4" title="Effective acquired" summary="People who verified their email and finished the profile." note={data.A4.footnote}>
        <p className="text-3xl font-semibold text-sky-900">{int(data.A4.total)}</p>
        <p className="text-xs text-gray-500 mt-1">As of {when(data.A4.asOf)}</p>
      </Card>
      <Card metricId="A12" title="Reconciliation" summary="Checks that the activation counts still match the stored records." note="This check ignores date filters.">
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
      <SignupPace data={data} />
      <FirstSurvey data={data} />
    </div>
  );
}
