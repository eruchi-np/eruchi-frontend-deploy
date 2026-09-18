const PRODUCTION_ORIGIN = "https://eruchi.com.np";

/** Public site origin with no trailing slash. Prefer VITE_SITE_ORIGIN, else the current host. */
export const getSiteOrigin = () => {
  const fromEnv = import.meta.env.VITE_SITE_ORIGIN;
  if (typeof fromEnv === "string" && fromEnv.trim()) {
    return fromEnv.trim().replace(/\/$/, "");
  }
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin.replace(/\/$/, "");
  }
  return PRODUCTION_ORIGIN;
};

export { PRODUCTION_ORIGIN };
