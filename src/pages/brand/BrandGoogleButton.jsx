import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../services/api';

const SCRIPT_ID = 'ri-google-gsi-en';

const loadGis = () => new Promise((resolve, reject) => {
  if (window.google?.accounts?.id) {
    resolve();
    return;
  }
  const existing = document.getElementById(SCRIPT_ID);
  if (existing) {
    existing.addEventListener('load', () => resolve());
    existing.addEventListener('error', () => reject(new Error('Google script failed')));
    return;
  }
  const script = document.createElement('script');
  script.id = SCRIPT_ID;
  script.src = 'https://accounts.google.com/gsi/client?hl=en';
  script.async = true;
  script.defer = true;
  script.onload = () => resolve();
  script.onerror = () => reject(new Error('Google script failed'));
  document.head.appendChild(script);
});

/**
 * GIS ID-token button for the brand portal (clients + analytics staff).
 */
export default function BrandGoogleButton({ onCredential, disabled = false, label = 'Continue with Google' }) {
  const hostRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const callbackRef = useRef(onCredential);
  callbackRef.current = onCredential;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await axios.get(`${API_BASE_URL}/auth/google-config`, { withCredentials: true });
        const clientId = data?.data?.clientId;
        if (!clientId || !data?.data?.enabled) {
          if (!cancelled) setError('Google sign-in is not configured');
          return;
        }
        await loadGis();
        if (cancelled || !hostRef.current || !window.google?.accounts?.id) return;
        window.google.accounts.id.initialize({
          client_id: clientId,
          locale: 'en',
          callback: (response) => {
            if (response?.credential) callbackRef.current?.(response.credential);
          },
          auto_select: false,
          cancel_on_tap_outside: true,
        });
        hostRef.current.innerHTML = '';
        window.google.accounts.id.renderButton(hostRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'pill',
          locale: 'en',
          width: hostRef.current.offsetWidth || 320,
        });
        if (!cancelled) setReady(true);
      } catch {
        if (!cancelled) setError('Could not load Google sign-in');
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="w-full">
      {error ? (
        <p className="text-sm text-[var(--ink-3)]">{error}</p>
      ) : (
        <div
          ref={hostRef}
          className={`ri-auth-google ${disabled ? 'pointer-events-none opacity-50' : ''}`}
          aria-label={label}
          aria-busy={!ready}
        />
      )}
      {!ready && !error ? (
        <button type="button" className="ri-auth-btn w-full" disabled>
          Loading Google…
        </button>
      ) : null}
    </div>
  );
}
