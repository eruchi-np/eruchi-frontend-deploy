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
  const { status, client } = useBrandSession();
  const location = useLocation();

  useEffect(() => {
    if (status !== 'authed' || !client) return;
    trackRuchi(RuchiEvents.SESSION, {
      path: location.pathname,
      viewer: Boolean(client?.viewer),
    });
  }, [status, client, location.pathname]);

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

  return React.cloneElement(children, { client });
}
