/** Routes a limited one-tap session may use without a full login. */
const SURVEY_PATHS = [
  '/standalone-surveys',
  '/survey-complete',
  '/sec-profile',
  '/sec-profile/refresh',
];

const SN_PROFILE_PATHS = [
  '/complete-basic-info',
  '/complete-profile',
];

export const isLimitedSessionAllowedPath = (pathname, mode) => {
  if (!mode) return true;
  const path = String(pathname || '');

  if (path.startsWith('/standalone-survey/')) return true;
  if (path === '/shop' || path.startsWith('/shop/')) return true;
  if (path.startsWith('/s/')) return true;
  if (SURVEY_PATHS.some((p) => path === p || path.startsWith(`${p}/`))) return true;

  if (mode === 'sn') {
    if (SN_PROFILE_PATHS.some((p) => path === p || path.startsWith(`${p}/`))) return true;
  }

  return false;
};
