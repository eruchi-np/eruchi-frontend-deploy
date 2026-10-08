// Rewards tab. Credits, voucher buys, redemptions, shop visits, and scans.

import { useMemo } from 'react';
import { shareOf } from './healthActivationView';
import { displayName } from './healthChartMath';
import {
  HybridPeopleShareChart,
  MultiSeriesHybridChart,
  SimpleBarChart,
  WeekChecklist,
  useDefaultWeekSelection,
} from './HealthChartKit.jsx';
import {
  BALANCE_LABELS,
  Bar,
  Card,
  int,
  latestFirst,
  Mini,
  Missing,
  NAVY,
  Notes,
  num,
  Pct,
  PROMPT_LABELS,
  Share,
  shareText,
  STAGE_LABELS,
  UserIdButton,
  VOUCHER_CHANNEL_LABELS,
  when,
} from './healthUi.jsx';

function CreditFlow({ data }) {
  if (!data.R1) return null;
  return (
    <>
      <div className="grid sm:grid-cols-3 gap-4">
        <Mini label="Credits outstanding" value={int(data.R1.outstanding)} sub={data.R1.equivalents == null ? 'No voucher price' : `${num(data.R1.equivalents)} cheapest vouchers`} />
        <Mini label="Buyers" value={int(data.R6.buyers)} sub={<span>{int(data.R6.purchases)} purchases · repeat {shareText(data.R6.repeatBuyers)}</span>} />
        <Mini label="Buyers among ever eligible" value={shareText(data.R6.amongEligible)} />
      </div>
      <Card metricId="R1" title="Credits issued and spent" summary="Credits added and credits spent in each week. Opening balances are not new earns." note={data.R1.note}>
        <MultiSeriesHybridChart
          rows={data.R1.weeks || []}
          xKey="week"
          yLabel="Credits"
          yRightLabel="Net credits"
          bars={[
            { key: 'issuedTotal', label: 'Issued', axis: 'left', opacity: 0.85, color: '#38BDF8' },
            { key: 'spentTotal', label: 'Spent', axis: 'left', opacity: 0.85, color: '#1B2A4A' },
          ]}
          lines={[{ key: 'net', label: 'Net', axis: 'right', color: '#D97706' }]}
          showWmaFor="net"
        />
      </Card>
      <Card metricId="R6" title="Purchases" summary="Who bought a voucher, and how often the same person bought again." note={data.R6.note}>
        <p className="text-sm text-gray-700 mb-2">Of the selected denominator: {shareText(data.R6.ofDenominator, false, 'denominator')}</p>
        <p className="text-sm text-gray-700">Credits per purchase: median {num(data.R6.credits.median)} · mean {num(data.R6.credits.mean)}</p>
        <div className="flex flex-wrap gap-2 mt-3">
          {data.R6.byVoucher.map((row) => (
            <span key={row.title} className="bg-gray-50 rounded-lg px-3 py-2 text-sm">{row.title} · {int(row.count)}</span>
          ))}
        </div>
      </Card>
      <Card metricId="R10" title="After the first redemption" summary="Whether people finished more surveys, or bought again, after redeeming a voucher." note={data.R10.note}>
        <p className="text-sm text-gray-700">People with a first redemption at least 30 days ago: {int(data.R10.redeemers)}</p>
        <p className="text-sm text-gray-700">Median change in surveys, 14 days after minus 14 days before: {num(data.R10.difference.median)}</p>
        <p className="text-sm text-gray-700">Bought again within 30 days: {shareText(data.R10.repeatPurchase, false, 'redeemers with 30+ days')}</p>
        <p className="text-sm text-gray-700">Survey-active in days 8–28 after first eligibility · redeemers: {shareText(data.R10.surveyActiveAfterEligibility?.redeemers, false, 'redeemers')}</p>
        <p className="text-sm text-gray-700">Same window · non-redeemers: {shareText(data.R10.surveyActiveAfterEligibility?.others, false, 'non-redeemers')}</p>
        {data.R10.people?.length ? (
          <div className="overflow-x-auto mt-3">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500">
                  <th className="py-2 pr-3 font-medium">Person</th>
                  <th className="py-2 pr-3 font-medium">14 days before</th>
                  <th className="py-2 pr-3 font-medium">14 days after</th>
                  <th className="py-2 font-medium">Bought again</th>
                </tr>
              </thead>
              <tbody>
                {data.R10.people.map((person) => (
                  <tr key={person.userId} className="border-t border-gray-100">
                    <td className="py-2 pr-3"><UserIdButton id={person.userId} name={person.name || displayName(person)} /></td>
                    <td className="py-2 pr-3">{int(person.before)}</td>
                    <td className="py-2 pr-3">{int(person.after)}</td>
                    <td className="py-2">{person.repeatPurchase ? 'Yes' : 'No'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </Card>
      <Card metricId="R11" title="Merchants" summary="Vouchers listed, bought, and redeemed for each merchant." note={data.R11.note}>
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

const SINK_LABELS = {
  voucher_redemption: 'Vouchers',
  streak_guard: 'Streak guards',
  survey_timeout: 'Survey timeout',
  admin_adjustment: 'Admin adjustment',
  other: 'Other',
};

function ShopAndScans({ data }) {
  if (!data.R5 || !data.R9) return null;
  if (data.R5.available === false) return (<><Missing metric={data.R5} /><Missing metric={data.R9} /></>);
  return (
    <>
      <Card metricId="R5" title="Shop behaviour" summary="What people did on shop visits, including visits where nothing was affordable." note={data.R5.note}>
        <div className="grid sm:grid-cols-2 gap-3">
          <Mini label="Visits per person" value={num(data.R5.visitsPerUser.median)} sub={`Mean ${num(data.R5.visitsPerUser.mean)}`} />
          <Mini label="Empty visits" value={shareText(data.R5.emptyVisits, true)} />
          <Mini label="Could not afford" value={shareText(data.R5.cannotAfford, true)} />
          <Mini label="Median shortfall" value={num(data.R5.shortfall.median)} sub="credits" />
        </div>
      </Card>
      <Card metricId="R9" title="Redemption friction" summary="Scans that failed, and vouchers that were opened but not approved." note={data.R9.note}>
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

function Distribution({ title, rows, labelOf = (row) => row.id, empty, split = false }) {
  const list = rows || [];
  const max = Math.max(1, ...list.map((row) => Number(row.count) || 0));
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400 mb-3">{title}</p>
      {list.length === 0 ? (
        <p className="text-sm text-gray-500">{empty}</p>
      ) : (
        <div className={split ? 'grid lg:grid-cols-2 gap-x-8 gap-y-3' : 'space-y-3'}>
          {list.map((row) => {
            const width = Math.max(4, Math.min(100, ((Number(row.count) || 0) / max) * 100));
            return (
              <div key={row.id}>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-sm text-gray-800 min-w-0 break-words">{labelOf(row)}</span>
                  <span className="text-sm text-gray-900 shrink-0 tabular-nums">
                    {int(row.count)}
                    <span className="text-gray-300"> · </span>
                    <Pct rate={row.share} plain />
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${width}%`, backgroundColor: NAVY }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const counted = (share, unit) => (
  share?.denominator ? `${int(share.numerator)} of ${int(share.denominator)}${unit ? ` ${unit}` : ''}` : ''
);

function VoucherChannels({ metric }) {
  const rows = (metric.channels || []).map((row) => ({
    label: VOUCHER_CHANNEL_LABELS[row.id] || row.id,
    count: row.count || 0,
  }));
  return (
    <Card metricId="R15" title="Voucher reception channel" summary="Where each voucher was received: the shop recommendation row, the rest of the shop, the page after a survey, a merchant page, or an admin gift." note={metric.note}>
      {!metric.total ? (
        <p className="text-sm text-gray-500">No vouchers yet.</p>
      ) : (
        <SimpleBarChart
          rows={rows}
          xKey="label"
          yKey="count"
          label="Vouchers"
          yLabel="Channel"
          horizontal
          percentOnTop
          totalForPercent={metric.total}
        />
      )}
    </Card>
  );
}

function CreditUse({ data }) {
  if (!data.R14) return null;
  const fit = data.R12;
  return (
    <>
      <Card metricId="R14" title="Credit sinks" summary="Where spent credits went: vouchers, streak guards, and other spends." note={data.R14.note}>
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
      <Card metricId="R12" title="Catalog fit" summary="Which voucher categories and prices people buy and open." note={fit.views.note}>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Mini label="Purchases" value={int(fit.purchases)} />
          <Mini label="Same municipality" value={<Pct rate={fit.locality.rate} plain />} sub={counted(fit.locality, 'purchases')} />
          <Mini label="Merchants opened" value={num(fit.views.merchantsViewed.median)} sub="Median per person" />
          <Mini label="Opened 2 or more" value={<Pct rate={fit.views.twoMerchants.rate} plain />} sub={counted(fit.views.twoMerchants, 'eligible')} />
        </div>
        <p className="text-xs text-gray-500 mt-2">{fit.locality.note}</p>
        <div className="grid lg:grid-cols-2 gap-6 mt-5">
          <Distribution title="Purchases by category" rows={fit.byCategory} />
          <Distribution title="Views by category" rows={fit.views.byCategory} empty="No voucher views stored yet." />
        </div>
        <div className="mt-6">
          <Distribution
            title="Purchases by price"
            rows={fit.byPrice}
            split
            labelOf={(row) => (row.id === 'unknown' ? 'Unknown' : `${row.id} credits`)}
          />
        </div>
        <div className="mt-6">
          <Distribution
            title="Views by voucher"
            rows={fit.views.vouchers}
            labelOf={(row) => row.title}
            empty="No voucher views stored yet."
          />
        </div>
      </Card>
      <Card metricId="R13" title={data.R13.title} summary="What people do on the page right after a survey: buy a voucher there, open the shop, or take another survey." note={data.R13.note}>
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

export function Rewards({ data }) {
  const bucketMax = data.R2.available ? Math.max(...Object.values(data.R2.buckets), 1) : 1;
  const r4Weeks = data.R4.weeks || [];
  const r4Select = useDefaultWeekSelection(r4Weeks);
  const r4Picked = r4Weeks.filter((week) => r4Select.selected.has(week.week));
  const r4Stages = useMemo(() => {
    if (!r4Picked.length) return data.R4.stages || [];
    const ids = ['eligible', 'eligibleOnline', 'shop', 'voucher', 'buyTap', 'purchased', 'redeemed'];
    const counts = Object.fromEntries(ids.map((id) => [id, 0]));
    for (const week of r4Picked) {
      for (const stage of week.stages || []) counts[stage.id] = (counts[stage.id] || 0) + (stage.count || 0);
    }
    // Eligible should not be summed across weeks; use max/end-of-range style: take last selected week's eligible, sum activity stages.
    const last = r4Picked[r4Picked.length - 1];
    const eligible = last?.stages?.find((stage) => stage.id === 'eligible')?.count ?? counts.eligible;
    const online = counts.eligibleOnline;
    const ordered = [
      ['eligible', eligible],
      ['eligibleOnline', online],
      ['shop', counts.shop],
      ['voucher', counts.voucher],
      ['buyTap', counts.buyTap],
      ['purchased', counts.purchased],
      ['redeemed', counts.redeemed],
    ];
    return ordered.map(([id, count], index, all) => ({
      id,
      count,
      ofPrevious: index === 0 ? null : shareOf(count, all[index - 1][1]),
    }));
  }, [r4Picked, data.R4.stages]);
  const priceLabel = data.R2.available
    ? `${int(data.R2.price)} credits${data.R2.priceTitle ? ` · ${data.R2.priceTitle}` : ''}${data.R2.priceBusiness ? ` (${data.R2.priceBusiness})` : ''}`
    : null;

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">Credits, vouchers, and whether people redeem what they buy.</p>
      {data.R2.available ? (
        <>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Mini label="Median balance" value={num(data.R2.median)} sub={`Mean ${num(data.R2.mean)}`} tone="info" />
        <Mini label="Eligible now" value={shareText(data.R2.eligibleNow, false, 'survey-activated')} />
        <Mini label="Ever eligible" value={shareText(data.R2.everEligible, false, 'survey-activated')} />
        <Mini label="Reached eligibility" value={int(data.R3.eligible)} sub={`${data.R3.approximate ? 'Approximate · ' : ''}stamped accounts`} />
      </div>
      <Card metricId="R2" title="Balance versus the cheapest voucher" summary="How people's credit balances compare with the cheapest voucher.">
        <p className="text-sm text-gray-700 mb-3">Cheapest price now: {priceLabel}</p>
        <div className="space-y-2">
          {Object.entries(data.R2.buckets).map(([key, count]) => (
            <Bar key={key} label={BALANCE_LABELS[key]} count={count} max={bucketMax} labelWidth="11rem" />
          ))}
        </div>
        <Notes items={data.R2.gaps} />
      </Card>
      <Card metricId="R3" title="Surveys finished when someone could first afford a voucher" summary="How many surveys someone had finished at the moment a voucher first became affordable." note={data.R3.note}>
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
        <Card metricId="R2" title="Balance and eligibility" summary="Credit balances compared with the cheapest voucher."><p className="text-sm text-gray-600">{data.R2.note}</p></Card>
      )}
      <Card metricId="R4" title="Reward funnel" summary="From being able to afford a voucher, through the shop and a purchase, to redeeming it. Each share is of the previous step." note={data.R4.gaps?.join(' ')}>
        {r4Weeks.length ? (
          <WeekChecklist
            weeks={latestFirst(r4Weeks)}
            selected={r4Select.selected}
            onChange={r4Select.setSelected}
            defaultWeek={r4Select.defaultWeek}
            label="Activity weeks"
          />
        ) : null}
        <div className="space-y-2">
          {r4Stages.map((stage) => (
            <Bar
              key={stage.id}
              label={STAGE_LABELS[stage.id] || stage.id}
              count={stage.count}
              max={Math.max(...r4Stages.map((row) => row.count), 1)}
              share={stage.ofPrevious?.denominator ? { ...stage.ofPrevious, of: 'previous step' } : null}
            />
          ))}
        </div>
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
                    <td className="py-2 pr-3">{shareText(month.shop, false, 'closed cohort')}</td>
                    <td className="py-2 pr-3">{shareText(month.purchased, false, 'closed cohort')}</td>
                    <td className="py-2">{shareText(month.redeemed, false, 'closed cohort')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </Card>
      <div className="grid sm:grid-cols-2 gap-4">
        <Card metricId="R7" title="Voucher pipeline" summary="Vouchers that are still active, already redeemed, expired, or cancelled.">
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
                      <td className="py-2 pr-3"><UserIdButton id={row.userId} name={row.name} /></td>
                      <td className="py-2 pr-3">{int(row.daysToExpiry)}</td>
                      <td className="py-2">{int(row.ageDays)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </Card>
        <Card metricId="R8" title="Redemption" summary="How soon a purchased voucher was redeemed, by the week it was bought.">
          <HybridPeopleShareChart
            rows={(data.R8.cohorts || []).map((row) => ({
              week: row.cohort,
              users: row.vouchers,
              rate: row.day7?.rate ?? null,
            }))}
            xKey="week"
            peopleLabel="Vouchers purchased"
            rateLabel="Redeemed within 7 days"
          />
          <div className="overflow-x-auto mt-4">
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
      <CreditFlow data={data} />
      {data.R15 ? <VoucherChannels metric={data.R15} /> : null}
      <CreditUse data={data} />
    </div>
  );
}
