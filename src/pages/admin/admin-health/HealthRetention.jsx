// Retention tab. Who comes back to survey or visit, and who is active, at risk, or dormant.

import { useMemo } from 'react';
import { afterRetentionCutoff } from './healthChartMath';
import { HybridPeopleShareChart, MultiSeriesHybridChart } from './HealthChartKit.jsx';
import {
  Card,
  int,
  KEY_LABELS,
  latestFirst,
  matrixCell,
  Mini,
  Missing,
  num,
  Pct,
  Share,
  shareText,
  STATE_DEFINITIONS,
  STATE_LABELS,
  STATE_TONE,
} from './healthUi.jsx';

function ReturnVisits({ data }) {
  if (!data.L5) return null;
  const latest = data.L3.latest;
  return (
    <>
      <div className="grid sm:grid-cols-3 gap-4">
        <Mini label="Core panel" value={int(data.L5.count)} sub={shareText(data.L5.ofAcquired)} />
        <Mini label="Still core from four weeks ago" value={shareText(data.L5.retained)} />
        <Mini label="Weekly stickiness" value={latest ? shareText(latest.weekly) : '–'} sub={latest ? <span>Daily ratio {latest.daily == null ? '–' : <Pct rate={latest.daily} />}</span> : ''} />
      </div>
      <Card metricId="L2" title="Cohort matrix" summary="Full signup-week by later-week grid. Same retention rule as L1, for every week 0–12." note={data.L2.note}>
        <p className="text-xs text-gray-500 mb-3">
          Unlike L1, this shows every later week, not only 1/2/4/8. Each cell is <span className="font-medium text-gray-600">answer % · median surveys</span> among those who answered. Hover a cell for the exact counts. Signup weeks on or before 2026-06-18 are left out.
        </p>
        <div className="overflow-x-auto">
          <table className="text-sm border-separate border-spacing-0 min-w-max">
            <thead>
              <tr className="text-left text-xs text-gray-500">
                <th className="py-2 pr-3 pl-0 font-medium sticky left-0 z-20 bg-white w-[7.5rem] min-w-[7.5rem]">Signup week</th>
                <th className="py-2 pr-3 font-medium sticky left-[7.5rem] z-20 bg-white w-14 min-w-14 shadow-[2px_0_0_0_#e5e7eb]">People</th>
                {Array.from({ length: 13 }, (_, week) => (
                  <th key={week} className="py-2 px-2 font-medium min-w-[4.25rem] text-center">{week}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {latestFirst(data.L2.cohorts.filter((cohort) => afterRetentionCutoff(cohort.week))).map((cohort) => (
                <tr key={cohort.week} className="border-t border-gray-100">
                  <td className="py-2 pr-3 pl-0 whitespace-nowrap sticky left-0 z-10 bg-white w-[7.5rem] min-w-[7.5rem]">{cohort.week}</td>
                  <td className="py-2 pr-3 tabular-nums sticky left-[7.5rem] z-10 bg-white w-14 min-w-14 shadow-[2px_0_0_0_#e5e7eb]">{int(cohort.cohortSize)}</td>
                  {cohort.cells.map((cell) => (
                    <td key={cell.week} className="py-2 px-2 text-xs text-center align-middle">
                      {matrixCell(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <Card metricId="L3" title="Survey stickiness" summary="Weekly survey-active people against the prior 28-day active set, with a daily-to-weekly ratio." note={data.L3.note}>
        <HybridPeopleShareChart
          rows={(data.L3.weeks || []).map((row) => ({
            week: row.week,
            users: row.weekUsers,
            rate: row.weekly?.rate ?? null,
          }))}
          xKey="week"
          peopleLabel="Weekly survey-active"
          rateLabel="Weekly stickiness"
        />
      </Card>
      <Card metricId="L5" title="Core panel by week" summary="People who finished a survey in at least 3 of the last 4 complete weeks." note={data.L5.note}>
        <HybridPeopleShareChart
          rows={(data.L5.series || []).map((row) => ({
            week: row.week,
            users: row.count,
            rate: row.ofAcquired?.rate ?? null,
          }))}
          xKey="week"
          peopleLabel="Core panel"
          rateLabel="Share of acquired"
        />
      </Card>
    </>
  );
}

function LastAction({ metric }) {
  if (!metric) return null;
  if (metric.available === false) return <Missing metric={metric} />;
  return (
    <Card metricId="L6" title="Last action" summary="The last thing recorded before someone churned." note={metric.note}>
      {metric.groups.map((row) => (
        <p key={row.id} className="text-sm text-gray-700 mb-1">{row.id}: {shareText(row)}</p>
      ))}
    </Card>
  );
}

function WhoLeft({ data }) {
  if (!data.L6) return null;
  return (
    <>
      <Card metricId="L6" title="Churn" summary="People who stopped, and how many days that took." note={data.L6.note}>
        <div className="grid sm:grid-cols-2 gap-3">
          <Mini label="Churned" value={int(data.L6.churned)} />
          <Mini label="Median days to churn" value={num(data.L6.timeToChurn.median)} sub={`Mean ${num(data.L6.timeToChurn.mean)} · ${int(data.L6.timeToChurn.n)} people`} />
        </div>
      </Card>
      <LastAction metric={data.L6.lastAction} />
      {data.L7 ? (
        <Card metricId="L7" title="Referral" summary="Accounts that signed up with a referral code, and how many of those people activated within 7 days." note={data.L7.note}>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <Mini label="Signups with a code" value={int(data.L7.signups)} />
            <Mini label="Completed" value={int(data.L7.completed)} />
            <Mini label="Still pending" value={int(data.L7.pending)} />
            <Mini label="Expired" value={int(data.L7.expired)} />
          </div>
          {data.L7.signups > 0 ? (
            <>
              <p className="text-sm text-gray-700 mb-3">Completed: {shareText(data.L7.conversion, false, 'referral signups')}</p>
              <p className="text-sm text-gray-700 mb-3">Survey within 7 days: {data.L7.surveyActivated ? shareText(data.L7.surveyActivated) : 'None of these signups are 7 days old yet'}</p>
              <p className="text-sm text-gray-700 mb-4">Activated within 7 days: {data.L7.activated ? shareText(data.L7.activated) : 'None of these signups are 7 days old yet'}</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-gray-500">
                      <th className="py-2 pr-3 font-medium">Referrer signup week</th>
                      <th className="py-2 pr-3 font-medium">Signups</th>
                      <th className="py-2 pr-3 font-medium">Completed</th>
                      <th className="py-2 pr-3 font-medium">Pending</th>
                      <th className="py-2 pr-3 font-medium">Expired</th>
                      <th className="py-2 font-medium">Survey within 7 days</th>
                    </tr>
                  </thead>
                  <tbody>
                    {latestFirst(data.L7.cohorts.filter((row) => row.cohort !== '(unknown)'))
                      .concat(data.L7.cohorts.filter((row) => row.cohort === '(unknown)'))
                      .map((row) => (
                      <tr key={row.cohort} className="border-t border-gray-100">
                        <td className="py-2 pr-3">{row.cohort}</td>
                        <td className="py-2 pr-3">{int(row.signups)}</td>
                        <td className="py-2 pr-3">{int(row.completed)}</td>
                        <td className="py-2 pr-3">{int(row.pending)}</td>
                        <td className="py-2 pr-3">{int(row.expired)}</td>
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

export function Retention({ data }) {
  const tiles = [
    ['week1', 'Week 1', 1],
    ['week2', 'Week 2', 2],
    ['week4', 'Week 4', 4],
    ['week8', 'Week 8', 8],
  ];
  const l1Chart = useMemo(() => (data.L1.cohorts || [])
    .filter((cohort) => afterRetentionCutoff(cohort.week))
    .map((cohort) => {
      const point = (weekN) => cohort.points.find((row) => row.week === weekN);
      return {
        week: cohort.week,
        people: cohort.cohortSize,
        week1: point(1)?.survey?.rate == null ? null : point(1).survey.rate * 100,
        week2: point(2)?.survey?.rate == null ? null : point(2).survey.rate * 100,
        week4: point(4)?.survey?.rate == null ? null : point(4).survey.rate * 100,
        week8: point(8)?.survey?.rate == null ? null : point(8).survey.rate * 100,
      };
    }), [data.L1.cohorts]);
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
              value={point?.survey ? shareText(point.survey, false, 'signups') : 'Not ready'}
              sub={tile ? `Week of ${tile.week} · ${int(tile.cohortSize)} people` : 'No cohort is old enough'}
            />
          );
        })}
      </div>
      <Card metricId="L1" title="Survey retention by signup week" summary="Of each signup week, who finished a survey in week 1, week 2, week 4, and week 8." note={(data.L1.gaps || []).join(' ')}>
        <p className="text-xs text-gray-500 mb-3">
          Checkpoint view only. The cohort matrix below is the same rule for every later week 0–12. Signup weeks on or before 2026-06-18 are left out.
        </p>
        <MultiSeriesHybridChart
          rows={l1Chart}
          xKey="week"
          yLabel="People"
          yRightLabel="Share who answered"
          yRightUnit="%"
          bars={[{ key: 'people', label: 'People', axis: 'left', opacity: 0.75 }]}
          lines={[
            { key: 'week1', label: 'Week 1 %', axis: 'right', color: '#1B2A4A' },
            { key: 'week2', label: 'Week 2 %', axis: 'right', color: '#0284C7' },
            { key: 'week4', label: 'Week 4 %', axis: 'right', color: '#059669' },
            { key: 'week8', label: 'Week 8 %', axis: 'right', color: '#7C3AED' },
          ]}
          showWmaFor="week1"
        />
        <div className="overflow-x-auto mt-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500">
                <th className="py-2 pr-3 font-medium">Week</th>
                <th className="py-2 pr-3 font-medium">People</th>
                {[1, 2, 4, 8].map((week) => <th key={week} className="py-2 pr-3 font-medium">Week {week}</th>)}
              </tr>
            </thead>
            <tbody>
              {latestFirst(data.L1.cohorts.filter((cohort) => afterRetentionCutoff(cohort.week))).map((cohort) => (
                <tr key={cohort.week} className="border-t border-gray-100">
                  <td className="py-2 pr-3">{cohort.week}</td>
                  <td className="py-2 pr-3">{int(cohort.cohortSize)}</td>
                  {[1, 2, 4, 8].map((week) => {
                    const point = cohort.points.find((row) => row.week === week);
                    return <td key={week} className="py-2 pr-3">{point?.ready ? shareText(point.survey, false, 'signups') : '–'}</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <Card metricId="L4" title="Lifecycle" summary="How many people are onboarding, active, at risk, or dormant, and who changed since the earlier Sunday." note={`Change from ${data.L4.transition.from} to ${data.L4.transition.to}. ${data.L4.gaps?.[0] || ''}`}>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {Object.entries(STATE_LABELS).map(([key, label]) => (
            <Mini key={key} label={label} value={int(data.L4.current.counts[key])} sub={STATE_DEFINITIONS[key]} tone={STATE_TONE[key]} />
          ))}
        </div>
        <div className="grid sm:grid-cols-2 gap-2 mt-4">
          {Object.entries(KEY_LABELS).map(([key, label]) => (
            <p key={key} className="text-sm text-gray-700">{label}: {int(data.L4.transition.keyCells[key])}</p>
          ))}
          <p className="text-sm text-gray-700">New since the earlier Sunday: {int(data.L4.transition.newUsers)}</p>
        </div>
      </Card>
      <ReturnVisits data={data} />
      <WhoLeft data={data} />
    </div>
  );
}
