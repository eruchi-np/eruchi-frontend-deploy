import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  canOpenSurveys,
  initPush,
  isPushConfigured,
  isPushOptedIn,
  loginPushUser,
  logoutPushUser,
  usesNativeWebPush,
} from '../../utils/pushClient';
import { promptSubscribeSlidedown } from '../../utils/oneSignal';
import { reportPushOptIn } from '../../utils/pushOptIn';
import {
  isPwaSurfaceActive,
  markPushSlidedownOpened,
  onPwaSurfaceCleared,
  shouldDeferSubscribeForPwa,
} from '../../utils/promptSurface';
import { isPwaInstallPromptPending } from './PwaPrompt';

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Boots push (VAPID or OneSignal) for accounts that can open Surveys.
 * OneSignal Subscribe card may show after login; VAPID relies on PushPrompt.
 * Yields to the PWA install card when that prompt is eligible.
 */
export default function OneSignalBridge() {
  const { user, loading } = useAuth();
  const { pathname } = useLocation();
  const loggedInId = useRef(null);
  const promptedForId = useRef(null);
  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;

  useEffect(() => {
    if (!isPushConfigured() || loading) return;

    if (!canOpenSurveys(user)) {
      if (loggedInId.current) {
        loggedInId.current = null;
        logoutPushUser();
      }
      return undefined;
    }

    const externalId = String(user.id || user._id || '');
    if (!externalId || loggedInId.current === externalId) return undefined;
    loggedInId.current = externalId;

    let cancelled = false;
    let stopListening = null;

    const showSubscribe = async () => {
      if (cancelled || loggedInId.current !== externalId) return;
      if (promptedForId.current === externalId) return;
      if (usesNativeWebPush()) return; // soft prompt owns VAPID UX
      promptedForId.current = externalId;
      markPushSlidedownOpened();
      await promptSubscribeSlidedown();
    };

    (async () => {
      const ok = await initPush();
      if (!ok || cancelled || loggedInId.current !== externalId) return;
      await loginPushUser(externalId);
      if (cancelled || loggedInId.current !== externalId) return;
      if (await isPushOptedIn()) {
        reportPushOptIn(true);
        return;
      }
      if (cancelled || loggedInId.current !== externalId) return;

      await wait(450);
      if (cancelled || loggedInId.current !== externalId) return;

      const path = pathnameRef.current;
      const defer = shouldDeferSubscribeForPwa({
        pwaPending: isPwaInstallPromptPending({ user, pathname: path }),
        pwaActive: isPwaSurfaceActive(),
      });
      if (defer) {
        stopListening = onPwaSurfaceCleared(() => {
          wait(600).then(() => {
            if (!cancelled) showSubscribe();
          });
        });
        return;
      }

      await showSubscribe();
    })();

    return () => {
      cancelled = true;
      if (stopListening) stopListening();
    };
  }, [user, loading]);

  return null;
}
