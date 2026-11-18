import { userAPI } from '../services/api';

/** Tell the API this account should or should not get the new-survey push. */
export function reportPushOptIn(optedIn) {
  return userAPI
    .setPushOptIn(Boolean(optedIn), { skipErrorToast: true })
    .catch((err) => {
      console.warn('[push] opt-in sync failed', err);
    });
}
