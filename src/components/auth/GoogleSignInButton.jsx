import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { persistAuthSession } from "../../utils/auth";
import { fetchGoogleClientId, renderGoogleButton } from "../../utils/googleGis";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

/**
 * Custom-looking Google button with an official GIS button overlaid on top
 * so the real Google account picker / consent flow runs (same as Matina Crafts).
 */
const GoogleSignInButton = ({
  onSuccess,
  onError,
  disabled = false,
  onDisabledClick,
  className = "",
}) => {
  const hostRef = useRef(null);
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);

  onSuccessRef.current = onSuccess;
  onErrorRef.current = onError;

  const originBlockedHint = () => {
    const origin = window.location.origin;
    return (
      `Google rejected this page origin (${origin}). ` +
      `Open Google Cloud → APIs & Services → Credentials → the Web client → ` +
      `Authorized JavaScript origins, add exactly "${origin}" and "http://localhost" (no trailing slash), Save, wait 2–5 min.`
    );
  };

  useEffect(() => {
    const host = hostRef.current;
    if (!host || disabled) {
      setReady(false);
      return undefined;
    }

    let cancelled = false;
    setError("");
    setReady(false);

    const mount = async () => {
      try {
        const clientId = await fetchGoogleClientId();
        if (!clientId) {
          throw new Error("Google sign-in is not configured.");
        }

        await renderGoogleButton(host, {
          clientId,
          text: "continue_with",
          onCredential: async (credential) => {
            if (cancelled || disabled) return;
            setBusy(true);
            setError("");
            try {
              const result = await axios.post(
                `${API_BASE_URL}/auth/google`,
                { credential },
                { withCredentials: true }
              );
              const userData = result?.data?.data?.user;
              persistAuthSession(userData);
              onSuccessRef.current?.(userData);
            } catch (err) {
              const message =
                err.response?.data?.message || "Google sign-in failed. Please try again.";
              setError(message);
              onErrorRef.current?.(message);
            } finally {
              setBusy(false);
            }
          },
          onError: (message) => {
            if (!cancelled) {
              setError(message);
              onErrorRef.current?.(message);
            }
          },
        });

        if (!cancelled) setReady(true);

        window.setTimeout(() => {
          if (cancelled) return;
          const iframe = host.querySelector("iframe");
          if (!iframe) {
            const hint = originBlockedHint();
            setError(hint);
            setReady(false);
            onErrorRef.current?.(hint);
          }
        }, 800);
      } catch (err) {
        if (!cancelled) {
          setReady(false);
          const message =
            err instanceof Error ? err.message : "Google sign-in failed to load";
          setError(message);
          onErrorRef.current?.(message);
        }
      }
    };

    void mount();

    let lastWidth = Math.floor(host.getBoundingClientRect().width || 0);
    let resizeTimer = null;
    const onResize = () => {
      if (cancelled) return;
      const next = Math.floor(host.getBoundingClientRect().width || 0);
      if (Math.abs(next - lastWidth) < 24) return;
      lastWidth = next;
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (!cancelled) void mount();
      }, 200);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelled = true;
      if (resizeTimer) clearTimeout(resizeTimer);
      window.removeEventListener("resize", onResize);
      if (host) host.innerHTML = "";
    };
  }, [disabled]);

  return (
    <div className={`w-full ${className}`}>
      <div className="relative w-full min-h-[52px] sm:min-h-[58px]">
        <div
          className={`w-full min-h-[52px] sm:min-h-[58px] p-3 sm:p-4 font-bold text-base sm:text-lg rounded-2xl border-2 border-gray-300 flex items-center justify-center gap-3 ${
            disabled || busy ? "opacity-60" : ""
          } ${disabled ? "cursor-pointer hover:border-gray-400 hover:bg-gray-50" : "pointer-events-none"}`}
          onClick={() => {
            if (disabled) onDisabledClick?.();
          }}
          aria-hidden={!disabled}
        >
          {busy ? (
            <span className="inline-block w-6 h-6 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
          ) : (
            <svg className="w-6 h-6 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
          )}
          <span className="truncate">{busy ? "Connecting…" : "Continue with Google"}</span>
        </div>

        <div
          ref={hostRef}
          className={`absolute inset-0 z-10 flex items-center justify-center overflow-hidden rounded-2xl [&>div]:!w-full [&>div]:!h-full [&_iframe]:!w-full ${
            disabled || busy || !ready ? "pointer-events-none opacity-0" : "opacity-[0.02]"
          }`}
          aria-label="Continue with Google"
        />
      </div>
      {error ? (
        <p className="mt-2 text-sm text-red-700 text-center leading-snug">{error}</p>
      ) : null}
    </div>
  );
};

export default GoogleSignInButton;
