/**
 * Ruchi Insights client analytics via PostHog.
 * No-ops when VITE_PUBLIC_POSTHOG_KEY is unset.
 */
import posthog from 'posthog-js';

const KEY = String(import.meta.env.VITE_PUBLIC_POSTHOG_KEY || '').trim();
const HOST = String(import.meta.env.VITE_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com').trim();

let ready = false;

export function initRuchiAnalytics() {
  if (ready || !KEY || typeof window === 'undefined') return;
  posthog.init(KEY, {
    api_host: HOST,
    person_profiles: 'identified_only',
    capture_pageview: false,
    persistence: 'localStorage+cookie',
  });
  ready = true;
}

export function identifyBrandClient(client) {
  if (!KEY || !client?.id) return;
  initRuchiAnalytics();
  posthog.identify(String(client.id), {
    email: client.email,
    brand: client.brand,
    category: client.category,
    name: client.name || undefined,
  });
}

export function trackRuchi(event, props = {}) {
  if (!KEY) return;
  initRuchiAnalytics();
  posthog.capture(event, {
    product: 'ruchi_insights',
    ...props,
  });
}

/** Event names used across the brand client. */
export const RuchiEvents = {
  SESSION: 'ri_session',
  LOGIN: 'ri_login',
  LOGOUT: 'ri_logout',
  SECTION: 'ri_section_view',
  WEEK: 'ri_week_change',
  COMPARE: 'ri_compare_change',
  INSIGHTS_TOGGLE: 'ri_insights_toggle',
  CHART_CLICK: 'ri_chart_brand_click',
  PDF_EXPORT: 'ri_pdf_export',
  ERROR: 'ri_error',
};
