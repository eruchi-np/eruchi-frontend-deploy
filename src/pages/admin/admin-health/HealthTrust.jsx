// Trust tab. Credit ledger checks, duplicate accounts, and the link to Clarity.

import { displayName } from './healthChartMath';
import {
  Card,
  ClarityCard,
  IdList,
  int,
  Mini,
  shareText,
  Status,
  UserIdButton,
  when,
} from './healthUi.jsx';

function DuplicateAccounts({ data }) {
  if (!data.Q1) return null;
  return (
    <Card metricId="Q1" title="Account integrity" summary="Staff accounts, possible duplicate people, and surveys finished unusually fast." note={data.Q1.note}>
      <div className="grid sm:grid-cols-3 gap-3 mb-4">
        <Mini label="Internal accounts" value={int(data.Q1.internal)} />
        <Mini label="Suspected duplicates" value={int(data.Q1.duplicates)} />
        <Mini label="Credits held by duplicates" value={shareText(data.Q1.credits, true, 'outstanding credits')} sub={`${int(data.Q1.purchases)} purchases`} />
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
                  <td className="py-2 pr-3"><UserIdButton id={row.userId} name={row.name || displayName(row)} /></td>
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

export function Trust({ data }) {
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
      <Card metricId="Q2" title="Credit and purchase checks" summary="Whether credit balances and purchases still match the ledger.">
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
      <Card metricId="Q5" title="Freshness" summary="When these numbers were counted, and which feeds are still missing.">
        <p className="text-sm text-gray-700">Counted {when(data.Q5.computedAt)} Nepal time.</p>
        <ul className="mt-3 space-y-1 text-xs text-gray-500">
          <li>{data.Q5.snapshot.note}</li>
          <li>{data.Q5.clarity.note}</li>
          <li>{data.Q5.emailDelivery.note}</li>
        </ul>
      </Card>
      <DuplicateAccounts data={data} />
      <ClarityCard metric={data.Q3} />
    </div>
  );
}
