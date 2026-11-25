import { useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  canOpenSurveys,
  initPush,
  isPushConfigured,
  isPushOptedIn,
  loginPushUser,
  logoutPushUser,
} from '../../utils/pushClient';
import { reportPushOptIn } from '../../utils/pushOptIn';

/**
 * Boots push (VAPID or OneSignal) for accounts that can open Surveys.
 * Does not ask for notification permission. The install card covers the
 * moment after PC1. PushPrompt asks after a survey is finished.
 */
export default function OneSignalBridge() {
  const { user, loading } = useAuth();
  const loggedInId = useRef(null);

  useEffect(() => {
    if (!isPushConfigured() || loading) return undefined;

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

    (async () => {
      const ok = await initPush();
      if (!ok || cancelled || loggedInId.current !== externalId) return;
      await loginPushUser(externalId);
      if (cancelled || loggedInId.current !== externalId) return;
      if (await isPushOptedIn()) reportPushOptIn(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [user, loading]);

  return null;
}
