/**
 * Full coordination tests for PWA install vs OneSignal Subscribe prompts.
 * Run: node frontend/scripts/testPromptSurface.mjs
 */
import assert from 'node:assert/strict';
import {
  evaluatePwaInstallPending,
  isPwaSurfaceActive,
  markPushSlidedownOpened,
  onPwaSurfaceCleared,
  resetPromptSurfaceForTests,
  setPwaSurfaceActive,
  shouldDeferSubscribeForPwa,
  wasPushSlidedownOpened,
} from '../src/utils/promptSurface.js';

let passed = 0;
const check = (name, fn) => {
  resetPromptSurfaceForTests();
  fn();
  passed += 1;
  console.log(`  ok  ${name}`);
};

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Mirrors OneSignalBridge defer/show decision after the settle delay. */
async function runSubscribeGate({
  pwaPending,
  pwaBecomesActive = false,
  clearAfterMs = 0,
  cancelled = false,
}) {
  const events = [];
  let stopListening = null;

  const showSubscribe = async () => {
    if (cancelled) return;
    if (wasPushSlidedownOpened()) return;
    markPushSlidedownOpened();
    events.push('subscribe');
  };

  if (shouldDeferSubscribeForPwa({
    pwaPending,
    pwaActive: isPwaSurfaceActive(),
  })) {
    events.push('deferred');
    stopListening = onPwaSurfaceCleared(() => {
      wait(30).then(() => {
        if (!cancelled) showSubscribe();
      });
    });
    if (pwaBecomesActive) setPwaSurfaceActive(true);
    if (clearAfterMs > 0) {
      await wait(clearAfterMs);
      setPwaSurfaceActive(false);
      await wait(50);
    }
    if (stopListening) stopListening();
    return events;
  }

  await showSubscribe();
  return events;
}

console.log('promptSurface / soft-prompt coordination\n');

check('evaluate: eligible customer with install event → pending', () => {
  assert.equal(
    evaluatePwaInstallPending({
      hasDeferredInstall: true,
      user: { role: 'user' },
      pathname: '/profile',
    }),
    true
  );
});

check('evaluate: no install event → not pending', () => {
  assert.equal(
    evaluatePwaInstallPending({
      hasDeferredInstall: false,
      user: { role: 'user' },
      pathname: '/profile',
    }),
    false
  );
});

check('evaluate: dismissed → not pending', () => {
  assert.equal(
    evaluatePwaInstallPending({
      hasDeferredInstall: true,
      dismissed: true,
      user: { role: 'user' },
      pathname: '/profile',
    }),
    false
  );
});

check('evaluate: standalone display → not pending', () => {
  assert.equal(
    evaluatePwaInstallPending({
      hasDeferredInstall: true,
      standalone: true,
      user: { role: 'user' },
      pathname: '/profile',
    }),
    false
  );
});

check('evaluate: staff admin → not pending', () => {
  assert.equal(
    evaluatePwaInstallPending({
      hasDeferredInstall: true,
      user: { role: 'admin' },
      isStaff: true,
      pathname: '/profile',
    }),
    false
  );
});

check('evaluate: no user → not pending', () => {
  assert.equal(
    evaluatePwaInstallPending({
      hasDeferredInstall: true,
      pathname: '/profile',
    }),
    false
  );
});

check('evaluate: Android survey-complete yields to push → not pending', () => {
  assert.equal(
    evaluatePwaInstallPending({
      hasDeferredInstall: true,
      user: { role: 'user' },
      pathname: '/survey-complete',
      isAndroid: true,
    }),
    false
  );
});

check('evaluate: desktop survey-complete still allows PWA', () => {
  assert.equal(
    evaluatePwaInstallPending({
      hasDeferredInstall: true,
      user: { role: 'user' },
      pathname: '/survey-complete',
      isAndroid: false,
    }),
    true
  );
});

check('evaluate: subscribe already opened this load → not pending', () => {
  assert.equal(
    evaluatePwaInstallPending({
      hasDeferredInstall: true,
      user: { role: 'user' },
      pathname: '/profile',
      pushSlidedownOpened: true,
    }),
    false
  );
});

check('defer helper: pending or active blocks subscribe', () => {
  assert.equal(shouldDeferSubscribeForPwa({ pwaPending: true }), true);
  assert.equal(shouldDeferSubscribeForPwa({ pwaActive: true }), true);
  assert.equal(shouldDeferSubscribeForPwa({}), false);
});

check('surface: activate then clear fires listeners once', () => {
  let hits = 0;
  const stop = onPwaSurfaceCleared(() => {
    hits += 1;
  });
  setPwaSurfaceActive(true);
  assert.equal(isPwaSurfaceActive(), true);
  assert.equal(hits, 0);
  setPwaSurfaceActive(false);
  assert.equal(hits, 1);
  setPwaSurfaceActive(false);
  assert.equal(hits, 1);
  stop();
});

check('surface: mark push opened is sticky for this load', () => {
  assert.equal(wasPushSlidedownOpened(), false);
  markPushSlidedownOpened();
  assert.equal(wasPushSlidedownOpened(), true);
});

check('mutex: after subscribe marked, PWA evaluate with pushOpened is false', () => {
  markPushSlidedownOpened();
  assert.equal(
    evaluatePwaInstallPending({
      hasDeferredInstall: true,
      user: { role: 'user' },
      pathname: '/profile',
      pushSlidedownOpened: wasPushSlidedownOpened(),
    }),
    false
  );
});

const asyncCases = async () => {
  {
    resetPromptSurfaceForTests();
    const events = await runSubscribeGate({ pwaPending: false });
    assert.deepEqual(events, ['subscribe']);
    assert.equal(wasPushSlidedownOpened(), true);
    console.log('  ok  flow: no PWA → subscribe immediately');
    passed += 1;
  }

  {
    resetPromptSurfaceForTests();
    const events = await runSubscribeGate({
      pwaPending: true,
      pwaBecomesActive: true,
      clearAfterMs: 20,
    });
    assert.deepEqual(events, ['deferred', 'subscribe']);
    assert.equal(wasPushSlidedownOpened(), true);
    console.log('  ok  flow: PWA first → dismiss → subscribe (never overlapping)');
    passed += 1;
  }

  {
    resetPromptSurfaceForTests();
    const events = await runSubscribeGate({
      pwaPending: true,
      pwaBecomesActive: true,
      clearAfterMs: 0,
    });
    assert.deepEqual(events, ['deferred']);
    assert.equal(wasPushSlidedownOpened(), false);
    console.log('  ok  flow: PWA still open → subscribe stays deferred');
    passed += 1;
  }

  {
    resetPromptSurfaceForTests();
    const events = await runSubscribeGate({
      pwaPending: true,
      pwaBecomesActive: true,
      clearAfterMs: 20,
      cancelled: true,
    });
    assert.deepEqual(events, ['deferred']);
    assert.equal(wasPushSlidedownOpened(), false);
    console.log('  ok  flow: unmount/cancel while waiting → no subscribe');
    passed += 1;
  }

  {
    resetPromptSurfaceForTests();
    // Subscribe wins when PWA not pending; PWA must stay blocked afterward.
    const events = await runSubscribeGate({ pwaPending: false });
    assert.deepEqual(events, ['subscribe']);
    assert.equal(
      evaluatePwaInstallPending({
        hasDeferredInstall: true,
        user: { role: 'user' },
        pathname: '/profile',
        pushSlidedownOpened: wasPushSlidedownOpened(),
      }),
      false
    );
    console.log('  ok  flow: subscribe first → PWA blocked same load');
    passed += 1;
  }

  {
    resetPromptSurfaceForTests();
    // Overlap simulation: never allow both "visible" flags true.
    let overlap = false;
    let pwaVisible = false;
    let subscribeVisible = false;

    const setPwa = (v) => {
      pwaVisible = v;
      setPwaSurfaceActive(v);
      if (pwaVisible && subscribeVisible) overlap = true;
    };
    const setSub = (v) => {
      subscribeVisible = v;
      if (v) markPushSlidedownOpened();
      if (pwaVisible && subscribeVisible) overlap = true;
    };

    setPwa(true);
    assert.equal(shouldDeferSubscribeForPwa({ pwaPending: true, pwaActive: true }), true);
    // would-be subscribe is deferred
    setPwa(false);
    setSub(true);
    assert.equal(overlap, false);
    assert.equal(
      evaluatePwaInstallPending({
        hasDeferredInstall: true,
        user: { role: 'user' },
        pushSlidedownOpened: wasPushSlidedownOpened(),
      }),
      false
    );
    console.log('  ok  invariant: pwaVisible && subscribeVisible never both true');
    passed += 1;
  }
};

await asyncCases();

console.log(`\n${passed} passed`);
