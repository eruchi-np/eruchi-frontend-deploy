/**
 * Google Identity Services (GIS) helpers for Sign in with Google (ID token).
 * Same flow as Matina Crafts: accounts.id → JWT credential → POST to the API.
 */
import axios from "axios";

const SCRIPT_ID = "google-gsi-client";
const GSI_SRC = "https://accounts.google.com/gsi/client";
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

/** GIS only allows one active initialize(); keep a single callback slot. */
let gisInitializedForClientId = null;
let gisCredentialHandler = null;
let gisErrorHandler = null;
let cachedClientId;

export const getGoogleClientIdFromEnv = () =>
  String(import.meta.env.VITE_GOOGLE_CLIENT_ID || "").trim();

export const fetchGoogleClientId = async () => {
  if (cachedClientId) return cachedClientId;

  const fromEnv = getGoogleClientIdFromEnv();
  if (fromEnv) {
    cachedClientId = fromEnv;
    return cachedClientId;
  }

  const res = await axios.get(`${API_BASE_URL}/auth/google-config`);
  cachedClientId = res?.data?.data?.clientId || "";
  return cachedClientId;
};

export const loadGoogleIdentityScript = () => {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Google sign-in is only available in the browser"));
  }
  if (window.google?.accounts?.id) {
    return Promise.resolve();
  }

  const existing = document.getElementById(SCRIPT_ID);
  if (existing) {
    return new Promise((resolve, reject) => {
      if (window.google?.accounts?.id) {
        resolve();
        return;
      }
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error("Failed to load Google sign-in")),
        { once: true }
      );
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = GSI_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google sign-in"));
    document.head.appendChild(script);
  });
};

/** Render the official Google button into `parent` (often overlaid on a custom-styled control). */
export const renderGoogleButton = async (parent, opts) => {
  await loadGoogleIdentityScript();
  if (!window.google?.accounts?.id) {
    throw new Error("Google sign-in failed to initialize");
  }

  parent.innerHTML = "";

  gisCredentialHandler = opts.onCredential;
  gisErrorHandler = opts.onError ?? null;

  if (gisInitializedForClientId !== opts.clientId) {
    window.google.accounts.id.initialize({
      client_id: opts.clientId,
      callback: (response) => {
        if (response.credential) {
          gisCredentialHandler?.(response.credential);
        } else {
          gisErrorHandler?.("Google did not return a credential");
        }
      },
      auto_select: false,
      cancel_on_tap_outside: true,
      context: opts.text === "signup_with" ? "signup" : "signin",
    });
    gisInitializedForClientId = opts.clientId;
  }

  const width = Math.max(240, Math.floor(parent.getBoundingClientRect().width || 320));

  window.google.accounts.id.renderButton(parent, {
    type: "standard",
    theme: "outline",
    size: "large",
    text: opts.text || "continue_with",
    shape: "rectangular",
    width,
  });
};
