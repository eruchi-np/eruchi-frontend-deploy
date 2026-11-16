import { useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  initOneSignal,
  isOneSignalConfigured,
  loginOneSignalUser,
  logoutOneSignalUser,
} from '../../utils/oneSignal';

/**
 * Boots OneSignal when VITE_ONESIGNAL_APP_ID is set and maps auth user → External ID.
 */
export default function OneSignalBridge() {
  const { user, loading } = useAuth();
  const loggedInId = useRef(null);

  useEffect(() => {
    if (!isOneSignalConfigured()) return;
    initOneSignal();
  }, []);

  useEffect(() => {
    if (!isOneSignalConfigured() || loading) return;

    const externalId = user?.id || user?._id || null;

    if (externalId) {
      if (loggedInId.current === String(externalId)) return;
      loggedInId.current = String(externalId);
      loginOneSignalUser(externalId);
      return;
    }

    if (loggedInId.current) {
      loggedInId.current = null;
      logoutOneSignalUser();
    }
  }, [user?.id, user?._id, loading]);

  return null;
}
