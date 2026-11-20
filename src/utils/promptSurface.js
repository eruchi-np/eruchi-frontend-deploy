/**
 * One soft-prompt at a time: PWA install vs OneSignal Subscribe.
 * PWA wins when the browser install card is eligible; Subscribe waits
 * until that card is cleared (or skips until a later visit if still pending).
 */

let pwaSurfaceActive = false;
const clearedListeners = new Set();

/** True after Subscribe slidedown is opened this page load (blocks PWA). */
let pushSlidedownOpened = false;

export function isPwaSurfaceActive() {
  return pwaSurfaceActive;
}

export function setPwaSurfaceActive(active) {
  const next = Boolean(active);
  const was = pwaSurfaceActive;
  pwaSurfaceActive = next;
  if (was && !next) {
    clearedListeners.forEach((fn) => {
      try {
        fn();
      } catch {
        // ignore listener errors
      }
    });
  }
}

export function onPwaSurfaceCleared(fn) {
  clearedListeners.add(fn);
  return () => clearedListeners.delete(fn);
}

export function markPushSlidedownOpened() {
  pushSlidedownOpened = true;
}

export function wasPushSlidedownOpened() {
  return pushSlidedownOpened;
}

/** Pure gate used by PwaPrompt + tests. */
export function evaluatePwaInstallPending({
  hasDeferredInstall = false,
  dismissed = false,
  standalone = false,
  user = null,
  isStaff = false,
  pathname = '',
  surveyCompletePath = '/survey-complete',
  isAndroid = false,
  pushSlidedownOpened: pushOpened = false,
} = {}) {
  if (!hasDeferredInstall || dismissed || standalone) return false;
  if (!user || isStaff) return false;
  if (pathname === surveyCompletePath && isAndroid) return false;
  if (pushOpened) return false;
  return true;
}

/** Subscribe should wait when install owns (or is about to own) the screen. */
export function shouldDeferSubscribeForPwa({ pwaPending = false, pwaActive = false } = {}) {
  return Boolean(pwaPending || pwaActive);
}

/** Test helper — resets module state between cases. */
export function resetPromptSurfaceForTests() {
  pwaSurfaceActive = false;
  pushSlidedownOpened = false;
  clearedListeners.clear();
}
