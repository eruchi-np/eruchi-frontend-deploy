import React, { createContext, useContext, useMemo } from 'react';
import { adminAPI } from '../../../services/api';

const InsightsShellContext = createContext({
  api: adminAPI,
  basePath: '/admin/insights',
  metricsPath: '/admin/brands',
  backTo: '/admin',
  backLabel: 'Back to admin',
  fullAdminUrl: null,
  staffPortal: false,
});

export function InsightsShellProvider({
  children,
  api = adminAPI,
  basePath = '/admin/insights',
  metricsPath = '/admin/brands',
  backTo = '/admin',
  backLabel = 'Back to admin',
  fullAdminUrl = null,
  staffPortal = false,
}) {
  const value = useMemo(() => ({
    api,
    basePath,
    metricsPath,
    backTo,
    backLabel,
    fullAdminUrl,
    staffPortal,
  }), [api, basePath, metricsPath, backTo, backLabel, fullAdminUrl, staffPortal]);

  return (
    <InsightsShellContext.Provider value={value}>
      {children}
    </InsightsShellContext.Provider>
  );
}

export function useInsightsShell() {
  return useContext(InsightsShellContext);
}

export function useInsightsApi() {
  return useInsightsShell().api;
}
