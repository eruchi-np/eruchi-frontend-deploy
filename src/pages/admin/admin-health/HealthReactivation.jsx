// Re-activation tab. Lifecycle email, WhatsApp, and push.

import { useState } from 'react';
import { Card, Mini, Missing, Status, int, num, when } from './healthUi.jsx';

const SEGMENT = {
  stalled: 'Stalled',
  at_risk: 'At risk',
  dormant: 'Dormant',
  backlog: 'Backlog',
  transactional: 'Transactional',
  none: 'None',
};

const TOUCH = {
  s1: 'S1', s2: 'S2', s3: 'S3', sw: 'SW', r1: 'R1', r2: 'R2', rw: 'RW', b1: 'B1',
  streak_save: 'Streak', voucher_5d: 'Voucher 5d', voucher_1d: 'Voucher 1d',
};

const CHANNEL = { email: 'Email', whatsapp: 'WhatsApp', push: 'Push', none: 'None' };

const ASSIGNMENT = {
  always: 'Always',
  treated: 'Treated',
  control: 'Control',
  emailed: 'Emailed',
  pushed: 'Pushed',
  holdout: 'Holdout',
  capped_out: 'Capped out',
  none: 'None',
};

const PAUSES = [
  ['global', 'Global'],
  ['stalled', 'Stalled'],
  ['atRisk', 'At risk'],
  ['dormant', 'Dormant'],
  ['backlog', 'Backlog'],
  ['whatsapp', 'WhatsApp'],
  ['push', 'Push'],
];

const FIELDS = [
  'rows', 'sent', 'delivered', 'received', 'read', 'clicked', 'bounced', 'complaint', 'consentFail',
  'outsideWindow', 'holdoutLeak', 'cappedOut', 'costUsd', 'waAttempts', 'waFailFirst',
  'surveyedKnown', 'surveyedYes', 'activatedKnown', 'activatedYes', 'clickedKnown', 'clickedSurveyed',
  'fallbackPushFailed', 'fallbackNotReceived', 'fallbackNotTapped',
];

const labelOf = (map, key) => map[key] || key;

const matches = (row, filter) => {
  if (filter.cycle !== 'all' && row.cycleId !== filter.cycle) return false;
  if (filter.segment !== 'all' && row.segment !== filter.segment) return false;
  if (filter.channel !== 'all' && row.channel !== filter.channel) return false;
  return true;
};

const blank = () => Object.fromEntries(FIELDS.map((field) => [field, 0]));

const collect = (rows, filter, accept) => {
  const total = blank();
  for (const row of rows || []) {
    if (!matches(row, filter)) continue;
    if (accept && !accept(row)) continue;
    for (const field of FIELDS) total[field] += Number(row[field]) || 0;
  }
  return total;
};

const grouped = (rows, filter, keyFn, accept) => {
  const map = new Map();
  for (const row of rows || []) {
    if (!matches(row, filter)) continue;
    if (accept && !accept(row)) continue;
    const key = keyFn(row);
    let bucket = map.get(key);
    if (!bucket) {
      bucket = { key, ...blank(), sample: row };
      map.set(key, bucket);
    }
    for (const field of FIELDS) bucket[field] += Number(row[field]) || 0;
  }
  return [...map.values()];
};

const rateText = (numerator, denominator) => {
  if (!denominator) return '–';
  const pct = Math.round((numerator / denominator) * 1000) / 10;
  return `${pct}% · ${int(numerator)} of ${int(denominator)}`;
};

const usd = (value) => {
  const amount = Number(value) || 0;
  return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const optCount = (rows, cycle, channel, reason) => (rows || []).reduce((total, row) => {
  if (cycle !== 'all' && row.cycleId !== cycle) return total;
  if (channel !== 'all' && row.channel !== channel && row.channel !== 'both') return total;
  if (row.reason !== reason) return total;
  return total + (row.n || 0);
}, 0);

const capPeople = (rows, segment, channel) => {
  const hit = (rows || []).find((row) => row.segment === segment && row.channel === channel);
  return hit?.people || 0;
};

const extraSends = (rows, filter) => (rows || []).reduce((total, row) => {
  if (filter.cycle !== 'all' && row.cycleId !== filter.cycle) return total;
  if (filter.segment !== 'all' && row.segment !== filter.segment) return total;
  if (filter.channel !== 'all' && row.channel !== filter.channel) return total;
  return total + (row.extra || 0);
}, 0);

function Select({ label, value, onChange, children }) {
  return (
    <label className="text-xs text-gray-500 flex flex-col gap-1">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900"
      >
        {children}
      </select>
    </label>
  );
}

function GuardRow({ label, status, detail }) {
  return (
    <tr className="border-t border-gray-100">
      <td className="py-2 pr-3">{label}</td>
      <td className="py-2 pr-3"><Status status={status} /></td>
      <td className="py-2">{detail}</td>
    </tr>
  );
}

function SimpleTable({ headers, rows }) {
  if (!rows.length) return <p className="text-sm text-gray-500">Nothing in this view yet.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-gray-500">
            {headers.map((header) => (
              <th key={header} className="py-2 pr-3 font-medium">{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key} className="border-t border-gray-100">
              {row.cells.map((cell, index) => (
                <td key={`${row.key}-${index}`} className="py-2 pr-3">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Reactivation({ data }) {
  const report = data?.reactivation;
  const [cycle, setCycle] = useState(report?.currentCycle || 'all');
  const [segment, setSegment] = useState('all');
  const [channel, setChannel] = useState('all');

  if (!report || report.available === false) {
    return (
      <Missing metric={{
        available: false,
        id: 'RE',
        title: 'Re-activation',
        note: report?.note || 'Lifecycle message counts are not in this health count yet.',
      }} />
    );
  }

  const filter = {
    cycle: (report.cycles || []).includes(cycle) || cycle === 'all' ? cycle : (report.currentCycle || 'all'),
    segment,
    channel,
  };
  const limits = report.limits || {};
  const cube = report.cube || [];
  const all = collect(cube, filter);
  const email = collect(cube, filter, (row) => row.channel === 'email');
  const whatsapp = collect(cube, filter, (row) => row.channel === 'whatsapp');
  const emailTracked = email.delivered + email.bounced + email.complaint > 0;
  const pauses = report.config?.pauses || {};
  const paused = PAUSES.filter(([key]) => pauses[key]);

  const waStops = optCount(report.optOuts, filter.cycle, 'whatsapp', 'unsubscribed_whatsapp');
  const emailUns = optCount(report.optOuts, filter.cycle, 'email', 'unsubscribed_email');
  const stopRate = whatsapp.sent ? waStops / whatsapp.sent : null;
  const unsubRate = email.sent ? emailUns / email.sent : null;
  const bounceRate = email.sent ? email.bounced / email.sent : null;

  const waStopStatus = !whatsapp.sent
    ? 'unavailable'
    : stopRate > limits.waStopRed
      ? 'fail'
      : stopRate > limits.waStopGreen
        ? 'warning'
        : 'pass';
  const unsubStatus = !email.sent ? 'unavailable' : unsubRate > limits.emailUnsub ? 'fail' : 'pass';
  const bounceStatus = !email.sent || !emailTracked ? 'unavailable' : bounceRate > limits.hardBounce ? 'fail' : 'pass';
  const complaintStatus = !email.sent || !emailTracked ? 'unavailable' : email.complaint > 0 ? 'fail' : 'pass';
  const peopleOverCap = capPeople(report.touchCap, filter.segment, filter.channel);
  const leaked = all.holdoutLeak;
  const dupes = extraSends(report.duplicates, filter);

  const treated = collect(cube, filter, (row) => ['treated', 'emailed', 'always'].includes(row.assignment));
  const holdout = collect(cube, filter, (row) => row.assignment === 'holdout');
  let extraReturners = null;
  if (treated.surveyedKnown && holdout.surveyedKnown) {
    const lift = (treated.surveyedYes / treated.surveyedKnown) - (holdout.surveyedYes / holdout.surveyedKnown);
    extraReturners = lift > 0 ? lift * treated.surveyedKnown : 0;
  }
  const monthCost = collect(cube, filter, (row) => row.month === report.currentMonth).costUsd;

  const seenCycles = [...new Set(cube.filter((row) => matches(row, { ...filter, cycle: 'all' })).map((row) => row.cycleId))].sort();
  const cycleIds = filter.cycle === 'all'
    ? (seenCycles.length ? seenCycles : [report.currentCycle].filter(Boolean))
    : [filter.cycle];

  const budgetRows = cycleIds.map((id) => {
    const slice = collect(cube, { ...filter, cycle: id }, (row) => row.channel === 'whatsapp');
    const status = slice.delivered >= limits.waCap
      ? 'fail'
      : slice.delivered >= limits.waAlert
        ? 'warning'
        : 'pass';
    return { id, delivered: slice.delivered, cost: slice.costUsd, status };
  });

  const returnRows = grouped(cube, filter, (row) => `${row.segment}|${row.touch}|${row.assignment}`)
    .filter((row) => row.surveyedKnown > 0)
    .sort((a, b) => a.key.localeCompare(b.key));

  const stallRows = grouped(
    cube,
    filter,
    (row) => row.touch,
    (row) => (report.stallTouches || []).includes(row.touch),
  ).sort((a, b) => a.key.localeCompare(b.key));

  const clickRows = grouped(cube, filter, (row) => row.template)
    .filter((row) => row.clicked > 0 || row.clickedKnown > 0)
    .sort((a, b) => b.clicked - a.clicked);

  const deliveryRows = grouped(cube, filter, (row) => `${row.channel}|${row.template}|${row.touch}`)
    .filter((row) => row.sent > 0)
    .sort((a, b) => b.sent - a.sent);

  const assignRows = grouped(cube, filter, (row) => `${row.segment}|${row.assignment}`)
    .filter((row) => row.rows > 0)
    .sort((a, b) => a.key.localeCompare(b.key));

  const holdoutRows = (filter.segment === 'all' ? ['stalled', 'at_risk', 'dormant', 'backlog'] : [filter.segment]).map((name) => {
    const base = collect(cube, { ...filter, segment: name }, (row) => row.assignment !== 'capped_out');
    const held = collect(cube, { ...filter, segment: name }, (row) => row.assignment === 'holdout');
    const target = limits.holdoutTargets?.[name];
    const share = base.rows ? held.rows / base.rows : null;
    let status = 'unavailable';
    if (base.rows >= 20 && share != null && target != null) {
      status = Math.abs(share - target) <= (limits.holdoutClose ?? 0.05) ? 'pass' : 'warning';
    }
    return { name, base: base.rows, held: held.rows, share, target, status };
  });

  const testBase = collect(cube, filter, (row) => row.assignment === 'treated' || row.assignment === 'control');
  const testTreated = collect(cube, filter, (row) => row.assignment === 'treated');
  const testShare = testBase.rows ? testTreated.rows / testBase.rows : null;
  const testStatus = testBase.rows >= 20 && testShare != null
    ? (Math.abs(testShare - 0.5) <= (limits.holdoutClose ?? 0.05) ? 'pass' : 'warning')
    : 'unavailable';

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Lifecycle email, WhatsApp, and browser push. The Channel tab still counts older reminder mail.
        Green, amber, and red here follow the lifecycle limits. Dry-run rows are left out. Opens are not used.
        Push-eligible versus not is descriptive only — people who allow notifications are already more engaged.
      </p>
      <div className="flex flex-wrap gap-3">
        <Select label="Cycle" value={filter.cycle} onChange={setCycle}>
          <option value="all">All cycles</option>
          {(report.cycles || []).map((id) => (
            <option key={id} value={id}>{id === report.currentCycle ? `${id} (current)` : id}</option>
          ))}
        </Select>
        <Select label="Segment" value={segment} onChange={setSegment}>
          <option value="all">All segments</option>
          {Object.entries(SEGMENT).filter(([key]) => key !== 'none').map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </Select>
        <Select label="Channel" value={channel} onChange={setChannel}>
          <option value="all">All channels</option>
          <option value="email">Email</option>
          <option value="whatsapp">WhatsApp</option>
          <option value="push">Push</option>
        </Select>
      </div>

      <Card metricId="RE1" title="Kill switches" summary="Whether the program is live, and which pauses are on right now." note="These switches are the current settings. They do not change with the cycle filter. A pause that is on stops that part of the program.">
        <div className="grid sm:grid-cols-3 gap-3 mb-3">
          <Mini label="Program" value={report.config?.programLive ? 'Live' : 'Not live'} tone={report.config?.programLive ? 'good' : 'mid'} />
          <Mini label="Dry run" value={report.config?.dryRun ? 'On' : 'Off'} tone={report.config?.dryRun ? 'mid' : 'good'} />
          <Mini label="Config" value={report.config?.version || '–'} />
        </div>
        {paused.length ? (
          <p className="text-sm text-amber-900 bg-amber-50 rounded-lg px-3 py-2 mb-3">
            Paused: {paused.map(([, label]) => label).join(', ')}.
          </p>
        ) : (
          <p className="text-sm text-gray-700 mb-3">No pause is on.</p>
        )}
        <div className="grid sm:grid-cols-3 gap-3">
          {PAUSES.map(([key, label]) => (
            <Mini key={key} label={label} value={pauses[key] ? 'Paused' : 'Running'} tone={pauses[key] ? 'bad' : 'good'} />
          ))}
        </div>
      </Card>

      <Card metricId="RE2" title="Guardrails" summary="Limits that mean stop and tell the same day when they go red." note="WhatsApp STOP taps and email unsubscribes come from the suppression list for the selected cycle, so they are not split by segment. Email bounce and complaint stay unavailable until a delivery, bounce, or complaint is stored on a lifecycle message. The 7-day touch cap is the last 7 days, not the selected cycle. Sends outside the Nepal windows, holdout leakage, consent failures, and duplicate sends come from the message log.">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-500">
              <th className="py-2 pr-3 font-medium">Check</th>
              <th className="py-2 pr-3 font-medium">Status</th>
              <th className="py-2 font-medium">Count</th>
            </tr>
          </thead>
          <tbody>
            <GuardRow label="WhatsApp STOP and unsubscribe" status={waStopStatus} detail={whatsapp.sent ? rateText(waStops, whatsapp.sent) : 'No WhatsApp sends'} />
            <GuardRow label="Email unsubscribe" status={unsubStatus} detail={email.sent ? rateText(emailUns, email.sent) : 'No email sends'} />
            <GuardRow label="Email hard bounce" status={bounceStatus} detail={!email.sent ? 'No email sends' : emailTracked ? rateText(email.bounced, email.sent) : 'Delivery events are not on these messages yet'} />
            <GuardRow label="Spam complaints" status={complaintStatus} detail={!email.sent ? 'No email sends' : emailTracked ? int(email.complaint) : 'Delivery events are not on these messages yet'} />
            <GuardRow label="More than 3 touches in 7 days" status={peopleOverCap ? 'fail' : 'pass'} detail={`${int(peopleOverCap)} people`} />
            <GuardRow label="Sent without consent" status={all.consentFail ? 'fail' : 'pass'} detail={int(all.consentFail)} />
            <GuardRow label="Sent outside the window" status={!all.sent ? 'unavailable' : all.outsideWindow ? 'fail' : 'pass'} detail={all.sent ? rateText(all.outsideWindow, all.sent) : 'No sends'} />
            <GuardRow label="Holdout leakage" status={leaked ? 'fail' : 'pass'} detail={int(leaked)} />
            <GuardRow label="Duplicate sends" status={dupes ? 'fail' : 'pass'} detail={int(dupes)} />
          </tbody>
        </table>
      </Card>

      <Card metricId="RE3" title="7-day survey return" summary="Share who finished a survey within 7 days, by segment, touch, and assignment." note="The nightly job writes this once the 7-day window has closed. Rows still inside the window are left out. Holdout rows are included.">
        <SimpleTable
          headers={['Segment', 'Touch', 'Assignment', 'Returned']}
          rows={returnRows.map((row) => {
            const [seg, touch, assignment] = row.key.split('|');
            return {
              key: row.key,
              cells: [
                labelOf(SEGMENT, seg),
                labelOf(TOUCH, touch),
                labelOf(ASSIGNMENT, assignment),
                rateText(row.surveyedYes, row.surveyedKnown),
              ],
            };
          })}
        />
      </Card>

      <Card metricId="RE4" title="Activation after S1, S2, and S3" summary="Share activated within 7 days of each stalled touch, against the holdout." note="Activated means the lifecycle steps were done inside 7 days of the send, or of the holdout's virtual time. The window has to be closed before a row is counted.">
        <SimpleTable
          headers={['Touch', 'Sent arm', 'Holdout']}
          rows={stallRows.map((row) => {
            const sentArm = collect(cube, filter, (item) => item.touch === row.key && (report.sentArms || []).includes(item.assignment));
            const held = collect(cube, filter, (item) => item.touch === row.key && item.assignment === 'holdout');
            return {
              key: row.key,
              cells: [
                labelOf(TOUCH, row.key),
                rateText(sentArm.activatedYes, sentArm.activatedKnown),
                rateText(held.activatedYes, held.activatedKnown),
              ],
            };
          })}
        />
      </Card>

      <Card metricId="RE5" title="Click, then a survey" summary="Of messages with a stored click, how many led to a survey within 7 days." note="A click is counted only when a click time is stored on the message. Email clicks arrive from the mail provider. A WhatsApp button reply stores a click when it names the message it answers. STOP is not a click.">
        <SimpleTable
          headers={['Template', 'Clicks', 'Survey after click']}
          rows={clickRows.map((row) => ({
            key: row.key,
            cells: [row.key, int(row.clicked), rateText(row.clickedSurveyed, row.clickedKnown)],
          }))}
        />
      </Card>

      <Card metricId="RE6" title="Sends and delivery" summary="Sent, delivered, read, and clicked, by channel, template, and touch." note="Delivered, read, and clicked need an event on the message. A send that is only marked sent is not counted as delivered. For push, received is the service-worker / client report.">
        <SimpleTable
          headers={['Channel', 'Template', 'Touch', 'Sent', 'Delivered', 'Received', 'Read', 'Clicked']}
          rows={deliveryRows.map((row) => {
            const [ch, template, touch] = row.key.split('|');
            return {
              key: row.key,
              cells: [
                labelOf(CHANNEL, ch),
                template,
                labelOf(TOUCH, touch),
                int(row.sent),
                int(row.delivered),
                int(row.received),
                int(row.read),
                int(row.clicked),
              ],
            };
          })}
        />
      </Card>

      <Card metricId="RE6b" title="Push funnel and fallbacks" summary="Push sent → received → tapped, who is push-eligible, and follow-up emails by reason." note="Received under half of sent for a touch is a same-day check. Fallbacks are emails (or rare WA) that went out because push failed, was not received, or was not tapped. Push-eligible share is descriptive only.">
        {filter.channel === 'email' || filter.channel === 'whatsapp' ? (
          <p className="text-sm text-gray-500">Choose Push or all channels for this card.</p>
        ) : (
          <>
            <div className="grid sm:grid-cols-3 gap-3 mb-3">
              <Mini label="Live push subscriptions" value={int(report.pushEligible?.liveSubscriptions)} />
              <Mini label="Push sent" value={int(collect(cube, filter, (row) => row.channel === 'push').sent)} />
              <Mini label="Push tapped" value={int(collect(cube, filter, (row) => row.channel === 'push').clicked)} />
            </div>
            <SimpleTable
              headers={['Segment', 'Push-eligible', 'Share']}
              rows={(report.pushEligible?.bySegment || []).map((row) => ({
                key: row.segment,
                cells: [
                  labelOf(SEGMENT, row.segment),
                  `${int(row.optedIn)} / ${int(row.total)}`,
                  row.share == null ? '–' : `${Math.round(row.share * 1000) / 10}%`,
                ],
              }))}
            />
            <div className="grid sm:grid-cols-3 gap-3 mt-3">
              <Mini label="Fallback: push failed" value={int(all.fallbackPushFailed)} />
              <Mini label="Fallback: not received" value={int(all.fallbackNotReceived)} />
              <Mini label="Fallback: not tapped" value={int(all.fallbackNotTapped)} />
            </div>
            <SimpleTable
              headers={['Touch', 'Sent', 'Received', 'Tapped', 'Survey in 7d']}
              rows={grouped(cube, filter, (row) => row.touch, (row) => row.channel === 'push')
                .filter((row) => row.sent > 0)
                .sort((a, b) => b.sent - a.sent)
                .map((row) => ({
                  key: row.key,
                  cells: [
                    labelOf(TOUCH, row.key),
                    int(row.sent),
                    int(row.received),
                    int(row.clicked),
                    rateText(row.surveyedYes, row.surveyedKnown),
                  ],
                }))}
            />
          </>
        )}
      </Card>

      <Card metricId="RE7" title="Email delivery quality" summary="Delivered, clicked, bounced, unsubscribed, and complaints on lifecycle email." note="Bounce and complaint stay blank until the mail provider writes one of those events onto a lifecycle message. Unsubscribes are new suppression-list rows in the selected cycle.">
        {filter.channel === 'whatsapp' ? (
          <p className="text-sm text-gray-500">This card is email only. Choose Email or all channels.</p>
        ) : (
          <div className="grid sm:grid-cols-3 gap-3">
            <Mini label="Delivered" value={!email.sent ? '–' : emailTracked ? rateText(email.delivered, email.sent) : 'Not on the messages yet'} />
            <Mini label="Clicked" value={int(email.clicked)} />
            <Mini label="Bounced" value={emailTracked ? rateText(email.bounced, email.sent) : 'Not on the messages yet'} />
            <Mini label="Unsubscribed" value={email.sent ? rateText(emailUns, email.sent) : '–'} />
            <Mini label="Complaints" value={emailTracked ? int(email.complaint) : 'Not on the messages yet'} />
          </div>
        )}
      </Card>

      <Card metricId="RE8" title="WhatsApp first-attempt failure" summary="First tries that failed because the number is not on WhatsApp." note="The denominator is attempts to people who were not already flagged unreachable. About 13% is expected at the start. Skipped known-unreachable numbers are left out.">
        {filter.channel === 'email' ? (
          <p className="text-sm text-gray-500">This card is WhatsApp only. Choose WhatsApp or all channels.</p>
        ) : (
          <Mini label="Not on WhatsApp" value={rateText(whatsapp.waFailFirst, whatsapp.waAttempts)} />
        )}
      </Card>

      <Card metricId="RE9" title="Cycle budget and cost" summary="Delivered WhatsApp messages against the cycle cap, and what they cost." note={`Green is under ${int(limits.waAlert)} delivered. Amber is ${int(limits.waAlert)} up to the cap. Red is ${int(limits.waCap)} or more. Cost per extra returner uses the 7-day survey rate of treated, emailed, and always, minus the holdout, once both windows have closed.`}>
        <div className="space-y-3">
          {budgetRows.map((row) => (
            <div key={row.id} className="flex flex-wrap items-center gap-3">
              <span className="text-sm text-gray-700 w-16">{row.id}</span>
              <Status status={row.status} />
              <span className="text-sm text-gray-800">{int(row.delivered)} delivered of {int(limits.waCap)}</span>
              <span className="text-sm text-gray-500">{usd(row.cost)}</span>
            </div>
          ))}
          {!budgetRows.length ? <p className="text-sm text-gray-500">No messages in this view yet.</p> : null}
          <div className="grid sm:grid-cols-3 gap-3">
            <Mini label={`Cost in ${report.currentMonth || 'this month'}`} value={usd(monthCost)} />
            <Mini label="Cost in this view" value={usd(all.costUsd)} />
            <Mini
              label="Per extra returner"
              value={extraReturners > 0 ? usd(all.costUsd / extraReturners) : '–'}
              sub={extraReturners == null ? 'Need a closed window on both arms' : `${num(extraReturners)} extra returners`}
            />
          </div>
        </div>
      </Card>

      <Card metricId="RE10" title="Send window" summary="How many sends landed inside the Nepal window (not outside)." note="Email is 7:00–7:30am and 8:00–8:45pm Nepal. WhatsApp is 8:00–8:45pm Nepal. Holdouts and skipped rows are not sends. RE2’s outside-window row uses the same counts.">
        <div className="flex items-center gap-3">
          <Status status={!all.sent ? 'unavailable' : all.outsideWindow ? 'fail' : 'pass'} />
          <span className="text-sm text-gray-800">
            {!all.sent
              ? 'No sends in this view.'
              : `${rateText(all.sent - all.outsideWindow, all.sent)} inside · ${int(all.outsideWindow)} outside`}
          </span>
        </div>
      </Card>

      <Card metricId="RE11" title="Assignments" summary="Who was placed in each arm, and whether the holdout share is near its target." note="Green means the holdout share is within 5 points of the target and there are at least 20 rows. The target is 40% for stalled, 15% for at risk and dormant, and 10% for backlog. The test arm should sit near 50:50 treated and control. This is not a chi-square test.">
        <div className="space-y-3 mb-4">
          {holdoutRows.map((row) => (
            <div key={row.name} className="flex flex-wrap items-center gap-3">
              <span className="text-sm text-gray-700 w-24">{labelOf(SEGMENT, row.name)}</span>
              <Status status={row.status} />
              <span className="text-sm text-gray-800">
                {row.share == null ? 'No rows' : `${rateText(row.held, row.base)} · target ${Math.round((row.target || 0) * 100)}%`}
              </span>
            </div>
          ))}
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-gray-700 w-24">Test arm</span>
            <Status status={testStatus} />
            <span className="text-sm text-gray-800">
              {testShare == null ? 'No treated or control rows' : `${rateText(testTreated.rows, testBase.rows)} treated`}
            </span>
          </div>
        </div>
        <SimpleTable
          headers={['Segment', 'Assignment', 'Rows']}
          rows={assignRows.map((row) => {
            const [seg, assignment] = row.key.split('|');
            return {
              key: row.key,
              cells: [labelOf(SEGMENT, seg), labelOf(ASSIGNMENT, assignment), int(row.rows)],
            };
          })}
        />
      </Card>

      <Card metricId="RE12" title="Slot fill and capped out" summary="Delivered WhatsApp messages against the cycle cap, and people who were logged capped out." note="Green once delivered WhatsApp reaches 80% of that cycle's cap. Capped out is an assignment, not a send.">
        <div className="space-y-3 mb-3">
          {budgetRows.map((row) => {
            const fill = limits.waCap ? row.delivered / limits.waCap : null;
            const status = fill == null ? 'unavailable' : fill >= (limits.slotFillGreen ?? 0.8) ? 'pass' : 'warning';
            return (
              <div key={row.id} className="flex flex-wrap items-center gap-3">
                <span className="text-sm text-gray-700 w-16">{row.id}</span>
                <Status status={status} />
                <span className="text-sm text-gray-800">{limits.waCap ? rateText(row.delivered, limits.waCap) : '–'}</span>
              </div>
            );
          })}
        </div>
        <Mini label="Capped out" value={int(all.cappedOut)} />
      </Card>

      <Card metricId="RE13" title="Change log" summary="Recorded changes to the lifecycle program." note="This list is the latest rows in the lifecycle change log. It does not follow the cycle filter.">
        {!(report.changeLog || []).length ? (
          <p className="text-sm text-gray-500">No changes logged yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500">
                  <th className="py-2 pr-3 font-medium">When</th>
                  <th className="py-2 pr-3 font-medium">What</th>
                  <th className="py-2 pr-3 font-medium">From</th>
                  <th className="py-2 pr-3 font-medium">To</th>
                  <th className="py-2 font-medium">Note</th>
                </tr>
              </thead>
              <tbody>
                {report.changeLog.map((row) => (
                  <tr key={`${row.changedAt}|${row.key}|${row.newValue}`} className="border-t border-gray-100">
                    <td className="py-2 pr-3 whitespace-nowrap">{when(row.changedAt)}</td>
                    <td className="py-2 pr-3">{row.key}</td>
                    <td className="py-2 pr-3">{row.oldValue || '–'}</td>
                    <td className="py-2 pr-3">{row.newValue || '–'}</td>
                    <td className="py-2">{row.note || row.changedBy || '–'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
