import React, { lazy, Suspense, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useBrandSession } from './BrandSessionContext';
import { trackRuchi, RuchiEvents } from './ruchiAnalytics';
import './ruchiTokens.css';

/** Heavy metrics shell — only load when staff hits /brand/dashboard. */
const BrandStaffViewer = lazy(() => import('./BrandStaffViewer'));

function RouteSpinner() {
  return (
    <div className="ruchi-insights flex min-h-screen items-center justify-center">
      <Loader2 className="h-10 w-10 animate-spin text-[var(--ink-3)]" />
    </div>
  );
}

export default function BrandProtectedRoute({ children, staffOnly = false }) {
  const { status, client, refresh } = useBrandSession();
  const location = useLocation();
  const waitingForBrand = Boolean(
    client && !client.viewer && !(client.brand && client.category),
  );

  useEffect(() => {
    if (status !== 'authed' || !client) return;
    trackRuchi(RuchiEvents.SESSION, {
      path: location.pathname,
      viewer: Boolean(client?.viewer),
    });
  }, [status, client, location.pathname]);

  // After an admin assigns a brand, pick it up without a full reload.
  useEffect(() => {
    if (!waitingForBrand) return undefined;
    const pull = () => { refresh().catch(() => {}); };
    const onVisible = () => {
      if (document.visibilityState === 'visible') pull();
    };
    const timer = window.setInterval(pull, 5000);
    window.addEventListener('focus', pull);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', pull);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [waitingForBrand, refresh]);

  if (status === 'loading') {
    return <RouteSpinner />;
  }

  if (status === 'unauthed') {
    return <Navigate to="/brand/login" state={{ from: location }} replace />;
  }

  if (staffOnly && !client?.viewer) {
    return <Navigate to="/brand/dashboard" replace />;
  }

  if (client?.viewer && location.pathname.startsWith('/brand/dashboard')) {
    return (
      <Suspense fallback={<RouteSpinner />}>
        <BrandStaffViewer client={client} />
      </Suspense>
    );
  }

  // Remount dashboard when brand is assigned so metrics reload cleanly.
  const shellKey = `${client?.id || ''}:${client?.brand || 'unassigned'}:${client?.category || ''}`;
  return (
    <React.Fragment key={shellKey}>
      {React.cloneElement(children, { client })}
    </React.Fragment>
  );
}
