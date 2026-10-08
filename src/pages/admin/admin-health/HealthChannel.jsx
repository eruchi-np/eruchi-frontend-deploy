// Channel tab. Email delivery, landing pages, and visits that arrive from a tracked link.

import {
  Card,
  ClarityCard,
  int,
  Mini,
  Missing,
  num,
  shareText,
} from './healthUi.jsx';

function LandingConversion({ metric }) {
  if (!metric || metric.available === false) return <Missing metric={metric} />;
  return (
    <Card metricId={metric.id} title={metric.title} summary="Of the people who opened a tagged landing page, how many registered within 24 hours." note={metric.note}>
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
    <Card metricId={metric.id} title={metric.title} summary="For each kind of reminder, how many were delivered and how many reached that reminder's goal." note={metric.note}>
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
    <Card metricId={metric.id} title={metric.title} summary="Signed-in visits that arrived from a channel, and how many of those people finished a survey." note={metric.note}>
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
      <Card metricId="C4" title="Reachability" summary="Who can still be emailed." note={data.C4.note}>
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
