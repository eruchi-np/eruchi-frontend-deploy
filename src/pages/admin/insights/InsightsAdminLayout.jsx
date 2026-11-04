import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { brandAPI } from '../../../services/api';
import { trackRuchi, RuchiEvents } from '../../brand/ruchiAnalytics';
import { InsightsShellProvider, useInsightsShell } from './insightsApiContext.jsx';
import './insightsAdmin.css';

function InsightsAdminChrome() {
  const navigate = useNavigate();
  const { basePath, metricsPath, backTo, backLabel, fullAdminUrl, staffPortal } = useInsightsShell();

  const links = [
    { to: basePath, end: true, label: 'Overview' },
    { to: `${basePath}/companies`, label: 'Companies' },
    { to: `${basePath}/brands`, label: 'Brands' },
    { to: `${basePath}/users`, label: 'Users / invites' },
    { to: `${basePath}/weeks`, label: 'Weeks' },
    { to: `${basePath}/reads`, label: 'Reads CMS' },
    { to: `${basePath}/usage`, label: 'Usage' },
  ];

  const logout = async () => {
    trackRuchi(RuchiEvents.LOGOUT);
    await brandAPI.logout({ skipErrorToast: true, skipAuthRedirect: true });
    navigate('/brand/login', { replace: true });
  };

  return (
    <div className="ri-admin">
      {staffPortal ? (
        <div className="ri-admin-topnav">
          <div className="ri-admin-topnav-brand">
            <strong>Ruchi Insights</strong>
            <span>CMS</span>
          </div>
          <nav className="ri-admin-topnav-links" aria-label="Staff portal">
            <NavLink to={basePath} end className={({ isActive }) => (isActive ? 'is-active' : undefined)}>
              Insights CMS
            </NavLink>
            <NavLink to={metricsPath} className={({ isActive }) => (isActive ? 'is-active' : undefined)}>
              Metrics
            </NavLink>
            {fullAdminUrl ? (
              <a href={fullAdminUrl} target="_blank" rel="noreferrer">
                Full eRuchi admin
              </a>
            ) : null}
          </nav>
          <button type="button" className="ri-admin-btn" onClick={() => navigate('/brand/account')}>
            Account
          </button>
        </div>
      ) : null}
      <div className="ri-admin-shell">
        <aside className="ri-admin-rail">
          <div>
            <h1>Ruchi Insights</h1>
            <p>{staffPortal ? 'CMS' : 'Admin'}</p>
          </div>
          <nav className="ri-admin-nav" aria-label="Insights admin">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={Boolean(link.end)}
                className={({ isActive }) => (isActive ? 'is-active' : undefined)}
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
          <div className="ri-admin-rail-footer">
            <button type="button" className="ri-admin-btn" onClick={() => navigate(backTo)}>
              {backLabel}
            </button>
            {staffPortal ? (
              <button type="button" className="ri-admin-logout" onClick={logout}>
                Logout
              </button>
            ) : null}
          </div>
        </aside>
        <main className="ri-admin-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default function InsightsAdminLayout({ shell = null }) {
  if (!shell) {
    return (
      <InsightsShellProvider>
        <InsightsAdminChrome />
      </InsightsShellProvider>
    );
  }
  return (
    <InsightsShellProvider {...shell}>
      <InsightsAdminChrome />
    </InsightsShellProvider>
  );
}
