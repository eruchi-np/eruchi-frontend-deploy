// Channel tab. Email delivery, landing pages, and visits that arrive from a tracked link.

import { useMemo } from 'react';
import { shareOf } from './healthActivationView';
import {
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
  num,
  shareText,
} from './healthUi.jsx';

const CHANNEL_LABELS = {
  email: 'Email',
  social: 'Social',
  messaging: 'Messaging',
  direct: 'Direct',
  other: 'Other',
};

const addShare = (into, share) => {
  into.numerator += share?.numerator || 0;
  into.denominator += share?.denominator || 0;
};

const toShare = ({ numerator, denominator }) => shareOf(numerator, denominator);

const mergePerfWeeks = (weeks) => {
  let sends = 0;
  let windowOpen = 0;
  let complaints = 0;
  const delivered = { numerator: 0, denominator: 0 };
  const bounced = { numerator: 0, denominator: 0 };
  const returned = { numerator: 0, denominator: 0 };
  const opened = { numerator: 0, denominator: 0 };
  const groups = new Map();

  for (const week of weeks) {
    sends += week.sends || 0;
    windowOpen += week.windowOpen || 0;
    complaints += week.complaints || 0;
    addShare(delivered, week.delivered);
    addShare(bounced, week.bounced);
    addShare(returned, week.returned);
    addShare(opened, week.opened);
    for (const group of week.groups || []) {
      const key = `${group.emailType}\u0000${group.sequence}`;
      if (!groups.has(key)) {
        groups.set(key, {
          emailType: group.emailType,
          label: group.label,
          sequence: group.sequence,
          sent: 0,
          delivered: { numerator: 0, denominator: 0 },
          bounced: { numerator: 0, denominator: 0 },
          complaints: 0,
          returned: { numerator: 0, denominator: 0 },
          opened: { numerator: 0, denominator: 0 },
        });
      }
      const row = groups.get(key);
      row.sent += group.sent || 0;
      row.complaints += group.complaints || 0;
      addShare(row.delivered, group.delivered);
      addShare(row.bounced, group.bounced);
      addShare(row.returned, group.returned);
      addShare(row.opened, group.opened);
    }
  }

  return {
    sends,
    windowOpen,
    complaints,
    delivered: toShare(delivered),
    bounced: toShare(bounced),
    returned: toShare(returned),
    opened: toShare(opened),
    groups: [...groups.values()]
      .map((row) => ({
        ...row,
        delivered: toShare(row.delivered),
        bounced: toShare(row.bounced),
        returned: toShare(row.returned),
        opened: toShare(row.opened),
      }))
      .sort((a, b) => b.sent - a.sent || a.label.localeCompare(b.label) || a.sequence.localeCompare(b.sequence)),
  };
};

const mergeReturnWeeks = (weeks) => {
  let sessions = 0;
  const withSurvey = { numerator: 0, denominator: 0 };
  const groups = new Map();
  for (const week of weeks) {
    sessions += week.sessions || 0;
    addShare(withSurvey, week.withSurvey);
    for (const group of week.groups || []) {
      if (!groups.has(group.channel)) {
        groups.set(group.channel, {
          channel: group.channel,
          sessions: 0,
          withSurvey: { numerator: 0, denominator: 0 },
        });
      }
      const row = groups.get(group.channel);
      row.sessions += group.sessions || 0;
      addShare(row.withSurvey, group.withSurvey);
    }
  }
  return {
    sessions,
    withSurvey: toShare(withSurvey),
    groups: [...groups.values()]
      .map((row) => ({ ...row, withSurvey: toShare(row.withSurvey) }))
      .sort((a, b) => b.sessions - a.sessions || a.channel.localeCompare(b.channel)),
  };
};

const mergeLandingWeeks = (weeks) => {
  let visitors = 0;
  let linked = 0;
  const converted = { numerator: 0, denominator: 0 };
  const engaged = {
    survey: { numerator: 0, denominator: 0 },
    voucherPurchase: { numerator: 0, denominator: 0 },
    referral: { numerator: 0, denominator: 0 },
    voucherRedeem: { numerator: 0, denominator: 0 },
    any: { numerator: 0, denominator: 0 },
  };
  const groups = new Map();

  for (const week of weeks) {
    visitors += week.visitors || 0;
    linked += week.linked || 0;
    addShare(converted, week.converted);
    addShare(engaged.survey, week.engaged?.survey);
    addShare(engaged.voucherPurchase, week.engaged?.voucherPurchase);
    addShare(engaged.referral, week.engaged?.referral);
    addShare(engaged.voucherRedeem, week.engaged?.voucherRedeem);
    addShare(engaged.any, week.engaged?.any);
    for (const group of week.groups || []) {
      const key = `${group.source}|${group.medium}|${group.campaign}|${group.content}|${group.term}`;
      if (!groups.has(key)) {
        groups.set(key, {
          source: group.source,
          medium: group.medium,
          campaign: group.campaign,
          content: group.content,
          term: group.term,
          visitors: 0,
          linked: 0,
          converted: { numerator: 0, denominator: 0 },
          engaged: {
            survey: { numerator: 0, denominator: 0 },
            voucherPurchase: { numerator: 0, denominator: 0 },
            referral: { numerator: 0, denominator: 0 },
            voucherRedeem: { numerator: 0, denominator: 0 },
            any: { numerator: 0, denominator: 0 },
          },
        });
      }
      const row = groups.get(key);
      row.visitors += group.visitors || 0;
      row.linked += group.linked || 0;
      addShare(row.converted, group.converted);
      addShare(row.engaged.survey, group.engaged?.survey);
      addShare(row.engaged.voucherPurchase, group.engaged?.voucherPurchase);
      addShare(row.engaged.referral, group.engaged?.referral);
      addShare(row.engaged.voucherRedeem, group.engaged?.voucherRedeem);
      addShare(row.engaged.any, group.engaged?.any);
    }
  }

  return {
    visitors,
    linked,
    converted: toShare(converted),
    engaged: {
      survey: toShare(engaged.survey),
      voucherPurchase: toShare(engaged.voucherPurchase),
      referral: toShare(engaged.referral),
      voucherRedeem: toShare(engaged.voucherRedeem),
      any: toShare(engaged.any),
    },
    groups: [...groups.values()]
      .map((row) => ({
        ...row,
        converted: toShare(row.converted),
        engaged: {
          survey: toShare(row.engaged.survey),
          voucherPurchase: toShare(row.engaged.voucherPurchase),
          referral: toShare(row.engaged.referral),
          voucherRedeem: toShare(row.engaged.voucherRedeem),
          any: toShare(row.engaged.any),
        },
      }))
      .sort((a, b) => (
        b.visitors - a.visitors
        || a.source.localeCompare(b.source)
        || a.medium.localeCompare(b.medium)
        || a.campaign.localeCompare(b.campaign)
        || a.content.localeCompare(b.content)
        || a.term.localeCompare(b.term)
      )),
  };
};

function LandingConversion({ metric }) {
  const weeks = metric?.weeks || [];
  const select = useDefaultWeekSelection(weeks);
  const picked = useMemo(
    () => weeks.filter((week) => select.selected.has(week.week)),
    [weeks, select.selected]
  );
  const view = useMemo(() => {
    if (!metric) return null;
    if (!picked.length) {
      return {
        visitors: metric.visitors,
        converted: metric.converted,
        linked: metric.linked,
        engaged: metric.engaged,
        groups: metric.groups || [],
      };
    }
    return mergeLandingWeeks(picked);
  }, [picked, metric]);
  if (!metric || metric.available === false) return <Missing metric={metric} />;

  return (
    <Card metricId={metric.id} title={metric.title} summary="Of tagged landing visits, how many registered within 24 hours — and among linked customers, who surveyed, bought, referred, or redeemed." note={metric.note}>
      {weeks.length ? (
        <WeekChecklist
          weeks={latestFirst(weeks)}
          selected={select.selected}
          onChange={select.setSelected}
          defaultWeek={select.defaultWeek}
          label="Visit weeks"
        />
      ) : null}
      {!view.visitors ? (
        <p className="text-sm text-gray-500">No landing visits stored yet.</p>
      ) : (
        <>
          <p className="text-sm text-gray-800 mb-3">Registered within 24 hours · {shareText(view.converted)}</p>
          {view.linked ? (
            <div className="grid sm:grid-cols-2 gap-3 mb-3">
              <Mini label="Linked customers" value={int(view.linked)} />
              <Mini label="Any engagement (24h)" value={shareText(view.engaged?.any)} />
              <Mini label="Survey" value={shareText(view.engaged?.survey)} />
              <Mini label="Voucher purchase" value={shareText(view.engaged?.voucherPurchase)} />
              <Mini label="Referral" value={shareText(view.engaged?.referral)} />
              <Mini label="Voucher redeem" value={shareText(view.engaged?.voucherRedeem)} />
            </div>
          ) : null}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500">
                  <th className="py-2 pr-3 font-medium">Source</th>
                  <th className="py-2 pr-3 font-medium">Medium</th>
                  <th className="py-2 pr-3 font-medium">Campaign</th>
                  <th className="py-2 pr-3 font-medium">Content</th>
                  <th className="py-2 pr-3 font-medium">Term</th>
                  <th className="py-2 pr-3 font-medium">Visitors</th>
                  <th className="py-2 pr-3 font-medium">Registered</th>
                  <th className="py-2 pr-3 font-medium">Linked</th>
                  <th className="py-2 font-medium">Engaged</th>
                </tr>
              </thead>
              <tbody>
                {view.groups.map((group) => (
                  <tr key={`${group.source}|${group.medium}|${group.campaign}|${group.content}|${group.term}`} className="border-t border-gray-100">
                    <td className="py-2 pr-3">{group.source}</td>
                    <td className="py-2 pr-3">{group.medium}</td>
                    <td className="py-2 pr-3">{group.campaign}</td>
                    <td className="py-2 pr-3">{group.content}</td>
                    <td className="py-2 pr-3">{group.term}</td>
                    <td className="py-2 pr-3">{int(group.visitors)}</td>
                    <td className="py-2 pr-3">{shareText(group.converted)}</td>
                    <td className="py-2 pr-3">{int(group.linked)}</td>
                    <td className="py-2">{shareText(group.engaged?.any)}</td>
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

function EmailPerformance({ metric }) {
  const weeks = metric?.weeks || [];
  const select = useDefaultWeekSelection(weeks);
  const picked = useMemo(
    () => weeks.filter((week) => select.selected.has(week.week)),
    [weeks, select.selected]
  );
  const view = useMemo(() => {
    if (!metric) return null;
    if (!picked.length) {
      return {
        sends: metric.sends,
        delivered: metric.delivered,
        returned: metric.returned,
        opened: metric.opened,
        complaints: metric.complaints,
        windowOpen: metric.windowOpen,
        groups: metric.groups || [],
      };
    }
    return mergePerfWeeks(picked);
  }, [picked, metric]);
  if (!metric || metric.available === false) return <Missing metric={metric} />;

  return (
    <Card metricId={metric.id} title={metric.title} summary="For each kind of reminder, how many were delivered and how many reached that reminder's goal." note={metric.note}>
      {weeks.length ? (
        <WeekChecklist
          weeks={latestFirst(weeks)}
          selected={select.selected}
          onChange={select.setSelected}
          defaultWeek={select.defaultWeek}
          label="Send weeks"
        />
      ) : null}
      {!view.sends ? (
        <p className="text-sm text-gray-500">No tracked sends yet.</p>
      ) : (
        <>
          <p className="text-sm text-gray-800 mb-3">
            Delivered {shareText(view.delivered)} · reached the goal {shareText(view.returned)} · opened {shareText(view.opened)} · complaints {int(view.complaints)}
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
                {view.groups.map((group) => (
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
          {view.windowOpen ? (
            <p className="text-xs text-gray-500 mt-3">{int(view.windowOpen)} still inside the goal window, so they are left out of the goal rate.</p>
          ) : null}
        </>
      )}
    </Card>
  );
}

function ReturnTriggers({ metric }) {
  const weeks = metric?.weeks || [];
  const select = useDefaultWeekSelection(weeks);
  const picked = useMemo(
    () => weeks.filter((week) => select.selected.has(week.week)),
    [weeks, select.selected]
  );
  const view = useMemo(() => {
    if (!metric) return null;
    if (!picked.length) {
      return {
        sessions: metric.sessions,
        withSurvey: metric.withSurvey,
        groups: metric.groups || [],
      };
    }
    return mergeReturnWeeks(picked);
  }, [picked, metric]);
  if (!metric || metric.available === false) return <Missing metric={metric} />;

  return (
    <Card metricId={metric.id} title={metric.title} summary="Signed-in visits that arrived from a channel, and how many of those people finished a survey." note={metric.note}>
      {weeks.length ? (
        <WeekChecklist
          weeks={latestFirst(weeks)}
          selected={select.selected}
          onChange={select.setSelected}
          defaultWeek={select.defaultWeek}
          label="Session weeks"
        />
      ) : null}
      {!view.sessions ? (
        <p className="text-sm text-gray-500">No tagged sessions stored yet.</p>
      ) : (
        <>
          <p className="text-sm text-gray-800 mb-3">Finished a survey {shareText(view.withSurvey)}</p>
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
                {view.groups.map((group) => (
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
      <Card metricId={metric.id} title={metric.title} summary="How much tracked mail one person receives in a week." note={metric.note}>
        <p className="text-sm text-gray-500">No delivered mail stored yet.</p>
      </Card>
    );
  }
  return (
    <Card metricId={metric.id} title={metric.title} summary="How much tracked mail one person receives in a week." note={metric.note}>
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

function PromptAcceptance({ metric }) {
  if (!metric || metric.available === false) return <Missing metric={metric} />;
  const tile = (label, row) => (
    <Mini
      label={label}
      value={shareText(row?.accepted)}
      sub={row?.prompted ? 'Team accounts are left out.' : 'No one prompted yet'}
    />
  );
  return (
    <Card
      metricId={metric.id}
      title={metric.title}
      summary="Of the people shown a prompt, how many accepted it."
      note={metric.note}
    >
      <div className="grid sm:grid-cols-2 gap-3">
        {tile('App install', metric.pwa)}
        {tile('Notifications', metric.notifications)}
      </div>
    </Card>
  );
}

function Deliverability({ metric }) {
  if (!metric || metric.available === false) return <Missing metric={metric} />;
  if (!metric.sends) {
    return (
      <Card metricId={metric.id} title={metric.title} summary="Delivery, permanent bounces, and complaints over the last 7 and 30 days." note={metric.note}>
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
    <Card metricId={metric.id} title={metric.title} summary="Delivery, permanent bounces, and complaints over the last 7 and 30 days." note={metric.note}>
      <div className="space-y-4">
        {windowLine('Last 7 days', metric.days7)}
        {windowLine('Last 30 days', metric.days30)}
      </div>
    </Card>
  );
}

export function Channel({ data }) {
  if (!data.C4) return null;
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">Who can be reached, and whether tracked mail is delivered and brings people back.</p>
      <div className="grid sm:grid-cols-3 gap-4">
        <Mini label="Verified email" value={shareText(data.C4.verified)} sub={`${int(data.C4.base)} acquired`} />
        <Mini label="Not unsubscribed" value={shareText(data.C4.notUnsubscribed)} />
        <Mini label="Phone captured" value={shareText(data.C4.phone)} />
      </div>
      <Card metricId="C4" title="Reachability" summary="Who can still be emailed." note={`${data.C4.note || ''} This check ignores week filters.`.trim()}>
        <div className="grid sm:grid-cols-2 gap-3">
          <Mini label="Hard bounce" value={shareText(data.C4.hardBounce, true)} />
          <Mini label="Reachable by email" value={shareText(data.C4.reachable)} />
        </div>
      </Card>
      <PromptAcceptance metric={data.C9} />
      <EmailPerformance metric={data.C1} />
      <ReturnTriggers metric={data.C2} />
      <EmailLoad metric={data.C7} />
      <Deliverability metric={data.C8} />
      <ClarityCard metric={data.C3} />
      <LandingConversion metric={data.C6} />
    </div>
  );
}
