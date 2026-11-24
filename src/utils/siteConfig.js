const trim = (value) => (typeof value === "string" ? value.trim() : "");

export const SUPPORT_EMAIL =
  trim(import.meta.env.VITE_SUPPORT_EMAIL) || "support@eruchi.com.np";

export const INSTAGRAM_URL =
  trim(import.meta.env.VITE_INSTAGRAM_URL) || "https://www.instagram.com/eruchi.np/";

export const WHATSAPP_URL =
  trim(import.meta.env.VITE_WHATSAPP_URL) || "https://wa.me/9779841580252";

export const LINKEDIN_URL =
  trim(import.meta.env.VITE_LINKEDIN_URL) || "https://www.linkedin.com/company/eruchi/";

export const LINKEDIN_JOBS_URL =
  trim(import.meta.env.VITE_LINKEDIN_JOBS_URL) || "https://www.linkedin.com/company/eruchi/jobs/";
