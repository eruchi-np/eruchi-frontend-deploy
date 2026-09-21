const trim = (value) => (typeof value === "string" ? value.trim() : "");

export const SUPPORT_EMAIL =
  trim(import.meta.env.VITE_SUPPORT_EMAIL) || "support@eruchi.com.np";

export const INSTAGRAM_URL =
  trim(import.meta.env.VITE_INSTAGRAM_URL) || "https://www.instagram.com/eruchi.np/";

export const LINKEDIN_URL =
  trim(import.meta.env.VITE_LINKEDIN_URL) || "https://www.linkedin.com/company/eruchi/";
