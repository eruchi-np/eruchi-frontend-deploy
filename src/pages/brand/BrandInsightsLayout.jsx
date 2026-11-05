import React from 'react';
import InsightsAdminLayout from '../admin/insights/InsightsAdminLayout.jsx';
import { brandStaffInsightsAPI } from '../../services/api';

const FULL_ADMIN_URL = 'https://eruchi.com.np/login';

/** Insights CMS inside the brand staff Google session (no second admin login). */
export default function BrandInsightsLayout() {
  return (
    <InsightsAdminLayout
      shell={{
        api: brandStaffInsightsAPI,
        basePath: '/brand/insights',
        metricsPath: '/brand/dashboard',
        backTo: '/brand/dashboard',
        backLabel: 'Back to metrics',
        fullAdminUrl: FULL_ADMIN_URL,
        staffPortal: true,
      }}
    />
  );
}
