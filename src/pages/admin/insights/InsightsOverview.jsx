import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useInsightsApi, useInsightsShell } from './insightsApiContext.jsx';

const STATS = [
  { key: 'companies', label: 'Companies', path: '/companies', hint: 'Manage companies' },
  { key: 'brands', label: 'Brands', path: '/brands', hint: 'Brand catalog' },
  { key: 'portalUsers', label: 'Portal users', path: '/users', hint: 'Accounts & invites' },
  { key: 'openInvites', label: 'Open invites', path: '/users', hint: 'Pending activates' },
  { key: 'publishedWeeks', label: 'Published weeks', path: '/weeks', hint: 'Week publish status' },
  { key: 'publishedReads', label: 'Published reads', path: '/reads', hint: 'Reads CMS' },
];

export default function InsightsOverview() {
  const adminAPI = useInsightsApi();
  const { basePath, metricsPath } = useInsightsShell();
  const [overview, setOverview] = useState(null);
  const [usage, setUsage] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    adminAPI.getInsightOverview({ skipErrorToast: true })
      .then(({ data }) => {
        if (!cancelled) setOverview(data.overview || null);
      })
      .catch(() => {
        if (!cancelled) setError('Could not load overview.');
      });

    adminAPI.getInsightUsage({ days: 7 }, { skipErrorToast: true })
      .then(({ data }) => {
        if (!cancelled) setUsage(data);
      })
      .catch(() => {
        if (!cancelled) setUsage(null);
      });

    return () => { cancelled = true; };
  }, [adminAPI]);

  const empty = overview?.needsSetup || (overview && overview.companies === 0 && overview.brands === 0);

  const checklist = [
    {
      done: (overview?.companies || 0) > 0,
      label: 'Add a company',
      to: `${basePath}/companies`,
    },
    {
      done: (overview?.brands || 0) > 0,
      label: 'Add brands to the catalog',
      to: `${basePath}/brands`,
    },
    {
      done: (overview?.portalUsers || 0) > 0 || (overview?.openInvites || 0) > 0,
      label: 'Invite a portal user',
      to: `${basePath}/users`,
    },
    {
      done: (overview?.publishedWeeks || 0) > 0,
      label: 'Publish a week',
      to: `${basePath}/weeks`,
    },
    {
      done: (overview?.publishedReads || 0) > 0,
      label: 'Publish a read',
      to: `${basePath}/reads`,
    },
  ];

  return (
    <div>
      <div className="ri-admin-toolbar">
        <h2>Overview</h2>
        <div className="ri-admin-actions">
          <Link to={`${basePath}/companies`} className="ri-admin-btn ri-admin-btn-primary">Add company</Link>
          <Link to={metricsPath} className="ri-admin-btn">Metrics viewer</Link>
          <Link to={`${basePath}/usage`} className="ri-admin-btn">Usage</Link>
        </div>
      </div>

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}

      {empty ? (
        <div className="ri-admin-card mb-4 text-sm text-gray-700">
          <p className="font-semibold text-gray-900">Nothing here yet — CMS starts empty</p>
          <p className="mt-2">
            Ruchi Insights admin is the ops layer (companies, invites, weeks, reads).
            Live chart data already lives in{' '}
            <Link className="font-semibold text-blue-700" to={metricsPath}>Metrics viewer</Link>.
          </p>
          <ol className="mt-3 list-decimal space-y-1 pl-5">
            <li>Add brands and a company.</li>
            <li>Create an activate invite for a portal user.</li>
            <li>Publish weeks and write reads when you are ready.</li>
          </ol>
          <div className="ri-admin-actions mt-4">
            <Link to={`${basePath}/companies`} className="ri-admin-btn ri-admin-btn-primary">Add company</Link>
            <Link to={`${basePath}/brands`} className="ri-admin-btn">Add brands</Link>
            <Link to={metricsPath} className="ri-admin-btn">Open metrics viewer</Link>
          </div>
        </div>
      ) : null}

      <div className="ri-admin-grid">
        {STATS.map((stat) => (
          <Link
            key={stat.key}
            to={`${basePath}${stat.path}`}
            className="ri-admin-stat ri-admin-stat-link"
          >
            <span>{stat.label}</span>
            <strong>{overview?.[stat.key] ?? '—'}</strong>
            <em>{stat.hint}</em>
          </Link>
        ))}
      </div>

      <div className="ri-admin-overview-panels">
        <div className="ri-admin-card">
          <h3 className="mb-3 text-sm font-semibold text-gray-900">Brand catalog</h3>
          <dl className="ri-admin-kv">
            <div>
              <dt>Total brands</dt>
              <dd>{overview?.brands ?? '—'}</dd>
            </div>
            <div>
              <dt>Active</dt>
              <dd>{overview?.activeBrands ?? '—'}</dd>
            </div>
            <div>
              <dt>Inactive</dt>
              <dd>{overview?.inactiveBrands ?? '—'}</dd>
            </div>
          </dl>
          <Link to={`${basePath}/brands`} className="ri-admin-btn mt-3 inline-flex">Manage brands</Link>
        </div>

        <div className="ri-admin-card">
          <h3 className="mb-3 text-sm font-semibold text-gray-900">Next steps</h3>
          <ul className="ri-admin-checklist">
            {checklist.map((item) => (
              <li key={item.label} className={item.done ? 'is-done' : undefined}>
                <span aria-hidden="true">{item.done ? '✓' : '○'}</span>
                {item.done ? (
                  <span>{item.label}</span>
                ) : (
                  <Link to={item.to}>{item.label}</Link>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div className="ri-admin-card">
          <h3 className="mb-3 text-sm font-semibold text-gray-900">Usage (7d)</h3>
          {usage?.configured ? (
            <>
              <p className="text-2xl font-semibold text-gray-900">{usage.total ?? 0}</p>
              <p className="mt-1 text-sm text-gray-500">Ruchi Insights events in PostHog</p>
              <Link to={`${basePath}/usage`} className="ri-admin-btn mt-3 inline-flex">Open usage</Link>
            </>
          ) : (
            <>
              <p className="text-sm text-gray-600">
                PostHog personal API key is not configured on the server yet.
              </p>
              <Link to={`${basePath}/usage`} className="ri-admin-btn mt-3 inline-flex">Usage setup</Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
