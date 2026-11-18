import { useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  canOpenSurveys,
  initOneSignal,
  isOneSignalConfigured,
  isPushOptedIn,
  loginOneSignalUser,
  logoutOneSignalUser,
  promptSubscribeSlidedown,
} from '../../utils/oneSignal';
import { reportPushOptIn } from '../../utils/pushOptIn';

/**
 * Boots OneSignal only for accounts that can open Surveys.
 * The Subscribe card is shown after login, because the automatic prompt
 * is dropped when the anonymous visitor becomes a known user.
 */
export default function OneSignalBridge() {
  const { user, loading } = useAuth();
  const loggedInId = useRef(null);

  useEffect(() => {
    if (!isOneSignalConfigured() || loading) return;

    if (!canOpenSurveys(user)) {
      if (loggedInId.current) {
        loggedInId.current = null;
        logoutOneSignalUser();
      }
      return;
    }

    const externalId = String(user.id || user._id || '');
    if (!externalId || loggedInId.current === externalId) return;
    loggedInId.current = externalId;

    (async () => {
      const ok = await initOneSignal();
      if (!ok || loggedInId.current !== externalId) return;
      await loginOneSignalUser(externalId);
      if (loggedInId.current !== externalId) return;
      if (await isPushOptedIn()) reportPushOptIn(true);
      if (loggedInId.current !== externalId) return;
      await promptSubscribeSlidedown();
    })();
  }, [user, loading]);

  return null;
}
