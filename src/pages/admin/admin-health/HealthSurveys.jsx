// Surveys tab. Completion, timing, streaks, the path through a survey, and where people drop off.

import { useMemo } from 'react';
import { shareOf } from './healthActivationView';
import { standardizedImpactWeights } from './healthRegression';
import {
  HorizontalRateChart,
  HybridPeopleShareChart,
  ImpactWeightChart,
  MultiSeriesHybridChart,
  SimpleBarChart,
  WeekChecklist,
  useDefaultWeekSelection,
} from './HealthChartKit.jsx';
import {
  Card,
  ClarityCard,
  int,
  latestFirst,
  Mini,
  Missing,
  NAVY,
  Notes,
  num,
  Pct,
  Share,
  shareText,
  STREAK_LABELS,
} from './healthUi.jsx';

function SurveyVolume({ data }) {
  if (!data.S1) return null;
  const latest = data.S6.weeks[data.S6.weeks.length - 1];
  const streakRows = Object.entries(STREAK_LABELS).map(([key, label]) => ({
    label,
    count: data.S14.length.buckets[key] || 0,
  }));
  const s16Weeks = (data.S16.weeks || []).map((week) => ({ week }));
  const s16Select = useDefaultWeekSelection(s16Weeks);
  const s16Clusters = useMemo(() => {
    const selected = s16Select.selected;
    const pairs = (data.S16.pairs || []).filter((pair) => !selected.size || selected.has(pair.week));
    const byCluster = new Map();
    for (const pair of pairs) {
      if (!byCluster.has(pair.clusterId)) {
        byCluster.set(pair.clusterId, {
          clusterId: pair.clusterId,
          clusterName: pair.clusterName,
          numerator: 0,
          denominator: 0,
        });
      }
      const row = byCluster.get(pair.clusterId);
      row.numerator += pair.numerator || 0;
      row.denominator += pair.denominator || 0;
    }
    return [...byCluster.values()].map((row) => ({
      ...row,
      rate: row.denominator ? row.numerator / row.denominator : null,
    })).sort((a, b) => (b.rate || 0) - (a.rate || 0));
  }, [data.S16.pairs, s16Select.selected]);

  return (
    <>
      <div className="grid sm:grid-cols-3 gap-4">
        <Mini label="Median responses per survey" value={num(data.S1.finals.median)} sub={data.S1.finals.n ? `Mean ${num(data.S1.finals.mean)} · ${int(data.S1.finals.n)} surveys` : 'No surveys'} />
        <Mini label="Depth last complete week" value={num(latest?.median)} sub={latest ? `Mean ${num(latest.mean)} · ${int(latest.n)} people` : ''} />
        <Mini label="Active streaks now" value={int(data.S14.activeNow)} sub={data.S14.length.n ? `Median length ${num(data.S14.length.median)}` : ''} />
      </div>
      <Card metricId="S1" title="Responses per survey" summary="Weekly totals for surveys published that week, with first-day and first-three-day finishes." note={data.S1.note}>
        <MultiSeriesHybridChart
          rows={data.S1.weeks || []}
          xKey="week"
          yLabel="Responses"
          yRightLabel="Early responses"
          bars={[{ key: 'total', label: 'All-time responses', axis: 'left', opacity: 0.8, color: '#7DD3FC' }]}
          lines={[
            { key: 'first24h', label: 'First 24 hours', axis: 'right', color: '#0284C7' },
            { key: 'first72h', label: 'First 72 hours', axis: 'right', color: '#059669' },
          ]}
          showWmaFor="total"
        />
      </Card>
      <Card metricId="S6" title="Surveys per person, by week" summary="How many surveys a person finished in each complete week." note={data.S6.note}>
        <MultiSeriesHybridChart
          rows={data.S6.weeks || []}
          xKey="week"
          yLabel="People and responses"
          yRightLabel="Surveys per person"
          bars={[
            { key: 'n', label: 'People', axis: 'left', opacity: 0.8, color: '#7DD3FC' },
            { key: 'totalResponses', label: 'Total responses', axis: 'left', opacity: 0.75, color: '#0EA5E9' },
          ]}
          lines={[
            { key: 'median', label: 'Median', axis: 'right', color: '#1B2A4A' },
            { key: 'mean', label: 'Mean', axis: 'right', color: '#7C3AED' },
          ]}
          showWmaFor="totalResponses"
        />
      </Card>
      <Card metricId="S14" title="Streaks" summary="How long current answer streaks are, and who reached 7, 14, and 30 days." note={data.S14.gaps?.[0]}>
        <SimpleBarChart rows={streakRows} xKey="label" yKey="count" label="People" xLabel="Streak length" yLabel="People" percentOnTop totalForPercent={data.S14.activeNow || 0} />
        <p className="text-sm text-gray-700 mt-3">Reached day 7: {shareText(data.S14.milestones.day7, false, 'people who ever streaked')}</p>
        <p className="text-sm text-gray-700">Reached day 14: {shareText(data.S14.milestones.day14, false, 'people who ever streaked')}</p>
        <p className="text-sm text-gray-700">Reached day 30: {shareText(data.S14.milestones.day30, false, 'people who ever streaked')}</p>
        <p className="text-sm text-gray-700">Streak Guard purchases: {int(data.S14.guards.purchases)} · buyers {int(data.S14.guards.buyers)}</p>
        <Notes items={data.S14.gaps.slice(1)} />
      </Card>
      <Card metricId="S16" title="Survey to the next survey" summary="Cluster-targeted survey K to survey K+1 in the same cluster." note={data.S16.note}>
        {s16Weeks.length ? (
          <WeekChecklist
            weeks={latestFirst(s16Weeks)}
            selected={s16Select.selected}
            onChange={s16Select.setSelected}
            defaultWeek={s16Select.defaultWeek}
            label="Next-survey weeks"
          />
        ) : null}
        <p className="text-sm text-gray-700 mb-3">Median across pairs: {data.S16.median == null ? '–' : <Pct rate={data.S16.median} />}</p>
        {s16Clusters.length ? (
          <HorizontalRateChart rows={s16Clusters} yKey="clusterName" rateKey="rate" label="Survey to next survey" yLabel="Cluster" xLabel="Share who took the next survey" />
        ) : (
          <p className="text-sm text-gray-500">No cluster survey pairs in the selected weeks yet.</p>
        )}
      </Card>
      <SurveyPath data={data} />
    </>
  );
}

function SurveyPath({ data }) {
  if (!data.S2 || !data.S3) return null;
  if (data.S2.available === false) return (<><Missing metric={data.S2} /><Missing metric={data.S3} /></>);
  const shown = (data.S2.surveys || []).filter((row) => !row.targeted).slice(0, 8);
  const s3Weeks = data.S3.weeks || [];
  const s3Select = useDefaultWeekSelection(s3Weeks);
  const s3Picked = s3Weeks.filter((week) => s3Select.selected.has(week.week));
  const s3Merged = useMemo(() => {
    if (!s3Picked.length) {
      return {
        viewed: data.S3.viewed,
        started: data.S3.started,
        completed: data.S3.completed,
        overall: data.S3.overall,
        startedWithoutView: data.S3.startedWithoutView,
      };
    }
    const viewed = s3Picked.reduce((sum, week) => sum + (week.viewed || 0), 0);
    const startedNum = s3Picked.reduce((sum, week) => sum + (week.started?.numerator || 0), 0);
    const startedDen = s3Picked.reduce((sum, week) => sum + (week.started?.denominator || 0), 0);
    const completedNum = s3Picked.reduce((sum, week) => sum + (week.completed?.numerator || 0), 0);
    const completedDen = s3Picked.reduce((sum, week) => sum + (week.completed?.denominator || 0), 0);
    const overallNum = s3Picked.reduce((sum, week) => sum + (week.overall?.numerator || 0), 0);
    const without = s3Picked.reduce((sum, week) => sum + (week.startedWithoutView || 0), 0);
    return {
      viewed,
      started: shareOf(startedNum, startedDen || viewed),
      completed: shareOf(completedNum, completedDen || startedNum),
      overall: shareOf(overallNum, viewed),
      startedWithoutView: without,
    };
  }, [s3Picked, data.S3]);
  return (
    <>
      <Card metricId="S2" title="Survey exposure" summary="How often a survey card was shown to someone who could answer it." note={data.S2.note}>
        <Mini label="Median exposure" value={<Pct rate={data.S2.median} />} />
        <div className="mt-3 space-y-1">
          {shown.length ? shown.map((row) => (
            <p key={row.id} className="text-sm text-gray-700">{row.title}: {shareText(row.exposure, false, 'reachable')} viewed · {int(row.reachable)} reached</p>
          )) : <p className="text-sm text-gray-500">No card views stored yet.</p>}
        </div>
      </Card>
      <Card metricId="S3" title="Survey funnel" summary="From seeing a survey, to starting it, to finishing it." note={data.S3.note}>
        {s3Weeks.length ? (
          <WeekChecklist
            weeks={latestFirst(s3Weeks)}
            selected={s3Select.selected}
            onChange={s3Select.setSelected}
            defaultWeek={s3Select.defaultWeek}
            label="Funnel weeks"
          />
        ) : null}
        <div className="grid sm:grid-cols-3 gap-3">
          <Mini label="Viewed" value={int(s3Merged.viewed)} />
          <Mini label="Started" value={shareText(s3Merged.started, false, 'viewers')} />
          <Mini label="Completed" value={shareText(s3Merged.completed, false, 'starters')} />
        </div>
        <p className="text-sm text-gray-700 mt-3">Started without a card view: {int(s3Merged.startedWithoutView)}</p>
        <p className="text-sm text-gray-700">Finished of those who viewed: {shareText(s3Merged.overall, false, 'viewers')}</p>
      </Card>
    </>
  );
}

function QuestionDropoff({ metric }) {
  if (!metric) return null;
  if (metric.available === false) return <Missing metric={metric} />;
  const shown = (metric.surveys || []).slice(0, 6);
  return (
    <Card metricId="S9" title="Question drop-off" summary="Where people stop inside a survey, question by question. Sparse until enough post-ship attempts exist." note={metric.note}>
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

function SurveyQuality({ data }) {
  if (!data.S8) return null;
  const shown = data.S8.surveys.slice(0, 12);
  const hourMax = Math.max(...data.S12.hours.map((row) => row.count), 1);
  const impact = useMemo(() => {
    const weights = standardizedImpactWeights(
      data.S8.surveys,
      ['questions', 'avgMinutes', 'credits'],
      'ratePct'
    );
    if (!weights) return null;
    const labels = {
      questions: 'Questions',
      avgMinutes: 'Avg. time taken',
      credits: 'Credits',
    };
    return weights.map((row) => ({ ...row, variable: labels[row.variable] || row.variable }));
  }, [data.S8.surveys]);
  return (
    <>
      <Card metricId="S8" title="Survey traits" summary="How response rate relates to questions, time, and credits." note={data.S8.note}>
        <div className="grid sm:grid-cols-3 gap-3 mb-4">
          {[
            ['Length', data.S8.byLength],
            ['Reward', data.S8.byReward],
            ['Days open', data.S8.byDaysOpen],
          ].map(([label, rows]) => (
            <div key={label}>
              <p className="text-xs text-gray-500 mb-1">{label}</p>
              {rows.map((row) => (
                <p key={row.id} className="text-sm text-gray-700">{row.id}: {int(row.surveys)} surveys · {num(row.median)}%</p>
              ))}
            </div>
          ))}
        </div>
        {impact ? (
          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-2">Relative Impact Weight on response rate</p>
            <ImpactWeightChart rows={impact} />
          </div>
        ) : (
          <p className="text-xs text-gray-500 mb-3">Not enough surveys with complete questions, avg time, credits, and response rate for regression yet.</p>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500">
                <th className="py-2 pr-3 font-medium">Survey</th>
                <th className="py-2 pr-3 font-medium">Questions</th>
                <th className="py-2 pr-3 font-medium">Avg time</th>
                <th className="py-2 pr-3 font-medium">Reported min</th>
                <th className="py-2 pr-3 font-medium">Credits</th>
                <th className="py-2 pr-3 font-medium">Responses</th>
                <th className="py-2 font-medium">Response %</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((row) => (
                <tr key={row.id} className="border-t border-gray-100">
                  <td className="py-2 pr-3">{row.title}{row.targeted ? ' · targeted' : ''}</td>
                  <td className="py-2 pr-3">{int(row.questions)}</td>
                  <td className="py-2 pr-3">{num(row.avgMinutes)}</td>
                  <td className="py-2 pr-3">{num(row.reportedMinutes)}</td>
                  <td className="py-2 pr-3">{int(row.credits)}</td>
                  <td className="py-2 pr-3">{int(row.responses)}</td>
                  <td className="py-2">{row.ratePct == null ? '–' : `${num(row.ratePct)}%`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data.S8.surveys.length > shown.length ? (
          <p className="text-xs text-gray-500 mt-2">Showing {shown.length} of {int(data.S8.surveys.length)} surveys.</p>
        ) : null}
      </Card>
      <Card metricId="S10" title="Response quality" summary="Finishes that were much faster than the usual time for that survey." note={data.S10.note}>
        <div className="grid sm:grid-cols-2 gap-3">
          <Mini label="Speeders" value={shareText(data.S10.speeders, true, 'completions')} />
          <Mini label="Flagged on 3 or more surveys" value={int(data.S10.repeatSpeeders)} />
          {data.S10.straightLining?.available ? (
            <Mini label="Same answer on every grid row" value={shareText(data.S10.straightLining, true, 'completions')} />
          ) : null}
          {data.S10.attentionChecks?.available ? (
            <Mini label="Wrong attention check" value={shareText(data.S10.attentionChecks, true, 'completions')} />
          ) : null}
        </div>
        <p className="text-sm text-gray-600 mt-3">{data.S10.straightLining?.note}</p>
        <p className="text-sm text-gray-600 mt-1">{data.S10.attentionChecks?.note}</p>
      </Card>
      <Card metricId="S11" title="Reward yield" summary="Credits a survey pays, and how many surveys it takes to afford the cheapest voucher." note={data.S11.note}>
        <div className="grid sm:grid-cols-4 gap-3">
          <Mini label="Median credits" value={num(data.S11.credits.median)} sub={`Mean ${num(data.S11.credits.mean)}`} />
          <Mini label="Median credits per minute" value={num(data.S11.perMinute.median)} />
          <Mini label="Weighted credits per minute" value={num(data.S11.weightedPerMinute)} />
          <Mini
            label="Surveys to first voucher"
            value={int(data.S11.surveysToFirstVoucher)}
            sub={data.S11.price == null ? '' : `Price ${int(data.S11.price)} · onboarding ${int(data.S11.onboardingCredits)}`}
          />
        </div>
      </Card>
      <Card metricId="S12" title="Timing patterns" summary="Which weekdays and hours surveys are finished." note={data.S12.note}>
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

export function Surveys({ data }) {
  const recentDays = data.S4.days.slice(-14);
  const denomLabel = data.denominator === 'effective' ? 'acquired' : 'survey-activated';
  const s5Weeks = data.S5.weeks || [];
  const s5Select = useDefaultWeekSelection(s5Weeks);
  const s5Picked = s5Weeks.filter((week) => s5Select.selected.has(week.week));
  const s5Merged = useMemo(() => {
    if (!s5Picked.length) return null;
    const buckets = { '0': 0, '1': 0, '2-4': 0, '5-9': 0, '10+': 0 };
    let topNum = 0;
    let topDen = 0;
    let zero = 0;
    let activated = 0;
    for (const week of s5Picked) {
      for (const [key, count] of Object.entries(week.buckets || {})) buckets[key] = (buckets[key] || 0) + (count || 0);
      topNum += week.top10?.numerator || 0;
      topDen += week.top10?.denominator || 0;
      zero += week.zeroInPeriod || 0;
      activated += week.surveyActivated || 0;
    }
    return {
      buckets,
      zeroInPeriod: zero,
      surveyActivated: activated,
      top10: { ...shareOf(topNum, topDen), people: s5Picked.reduce((sum, week) => sum + (week.top10?.people || 0), 0), of: s5Picked.reduce((sum, week) => sum + (week.top10?.of || 0), 0) },
    };
  }, [s5Picked]);
  const s7Weeks = data.S7.starvedWeeks || data.S7.publishedWeeks || [];
  const s7Select = useDefaultWeekSelection(s7Weeks);
  const s7Starved = (data.S7.starvedWeeks || []).filter((week) => s7Select.selected.has(week.week));
  const s7StarvedShare = useMemo(() => {
    const numerator = s7Starved.reduce((sum, week) => sum + (week.numerator || 0), 0);
    const denominator = s7Starved.reduce((sum, week) => sum + (week.denominator || 0), 0);
    return shareOf(numerator, denominator);
  }, [s7Starved]);
  const bucketMax = Math.max(...Object.values(s5Merged?.buckets || data.S5.buckets || { x: 1 }), 1);

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">Who is answering surveys, how often, and where people stop.</p>
      <div className="grid sm:grid-cols-3 gap-4">
        <Mini label="Unique responders, last 28 days" value={shareText(data.S4.rolling28, false, denomLabel)} sub={`${data.S4.rolling28.from} to ${data.S4.rolling28.to}`} />
        <Mini label="Average per complete day" value={num(data.S4.dailyAverage)} sub="Today is left out" tone="info" />
        <Mini label="This week so far" value={int(data.S4.inProgressWeek.users)} sub="In progress, not in the average" tone="info" />
      </div>
      <Card metricId="S4" title="Last 14 complete days" summary="People who finished a survey on each of the last 14 complete days." note={data.S4.gaps?.[0]}>
        <HybridPeopleShareChart
          rows={recentDays}
          xKey="day"
          peopleKey="users"
          rateKey="rate"
          peopleLabel="People who answered"
          rateLabel={`Share of ${denomLabel}`}
        />
      </Card>
      {data.S4.weeks?.length ? (
        <Card metricId="S4" title="Complete weeks" summary="People who finished a survey in each complete Nepal week. The current week is left out.">
          <HybridPeopleShareChart
            rows={data.S4.weeks}
            xKey="week"
            peopleKey="users"
            rateKey="rate"
            peopleLabel="People who answered"
            rateLabel={`Share of ${denomLabel}`}
          />
        </Card>
      ) : null}
      <Card metricId="S5" title="How answers are spread" summary="Whether a few people answer most of the surveys." note={`${data.S5.from} to ${data.S5.to}. ${data.S5.top10.note}`}>
        {s5Weeks.length ? (
          <WeekChecklist
            weeks={latestFirst(s5Weeks)}
            selected={s5Select.selected}
            onChange={s5Select.setSelected}
            defaultWeek={s5Select.defaultWeek}
            label="Answer weeks"
          />
        ) : null}
        {s5Merged ? (
          <>
            <div className="grid sm:grid-cols-3 gap-3 mb-4">
              <Mini label="Top 10% share" value={shareText(s5Merged.top10, false, 'completions')} sub={`${int(s5Merged.top10.people)} of ${int(s5Merged.top10.of)} people`} />
              <Mini label="Survey-activated with none in selected weeks" value={int(s5Merged.zeroInPeriod)} />
              <Mini label="Never survey-activated" value={int(data.S5.neverSurveyActivated)} sub={`of ${int(data.S5.effectiveAcquired)} acquired`} />
            </div>
            <SimpleBarChart
              rows={Object.entries(s5Merged.buckets).map(([label, count]) => ({ label, count }))}
              xKey="label"
              yKey="count"
              label="People"
              xLabel="Surveys finished"
              yLabel="People"
              percentOnTop
            />
          </>
        ) : (
          <p className="text-sm text-gray-500">Select one or more weeks.</p>
        )}
      </Card>
      <Card metricId="S7" title="Survey supply" summary="Surveys that are live now, and people who have nothing left they can answer." note={data.S7.gaps?.join(' ')}>
        <div className="grid sm:grid-cols-3 gap-3 mb-4">
          <Mini label="Live public surveys" value={int(data.S7.liveNow.public)} />
          <Mini label="Live targeted surveys" value={int(data.S7.liveNow.targeted)} />
          <Mini label="Published 15-day surveys" value={int(data.S7.liveNow.fifteenDayPublished)} />
        </div>
        <MultiSeriesHybridChart
          rows={data.S7.publishedWeeks || []}
          xKey="week"
          yLabel="Surveys published"
          yRightLabel="3-period average"
          bars={[{ key: 'count', label: 'Surveys published', axis: 'left', opacity: 0.85 }]}
          showWmaFor="count"
        />
        {s7Weeks.length ? (
          <div className="mt-4">
            <WeekChecklist
              weeks={latestFirst(data.S7.starvedWeeks || [])}
              selected={s7Select.selected}
              onChange={s7Select.setSelected}
              defaultWeek={s7Select.defaultWeek}
              label="Nothing-left weeks"
            />
            <p className="text-sm text-gray-700">Nothing left to answer: {s7Starved.length ? shareText(s7StarvedShare, false, 'recent responders') : (data.S7.starved.users ? shareText(data.S7.starved, false, 'recent responders') : data.S7.starved.note)}</p>
          </div>
        ) : (
          <p className="text-sm text-gray-700 mt-4">Nothing left to answer: {data.S7.starved.users ? shareText(data.S7.starved, false, 'recent responders') : data.S7.starved.note}</p>
        )}
      </Card>
      <SurveyVolume data={data} />
      <SurveyQuality data={data} />
    </div>
  );
}
