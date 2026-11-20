/**
 * Static + network probe for OneSignal wiring (no secrets beyond public App ID).
 * Usage: node scripts/probeOneSignal.mjs
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dir = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dir, '..');
const APP_ID = '982e9c81-32b7-4dea-b6a0-d0c5499b9c9c';
const site = 'https://www.eruchi.com.np';

const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok: Boolean(ok), detail });
  const mark = ok ? 'PASS' : 'FAIL';
  console.log(`${mark}  ${name}${detail ? ` — ${detail}` : ''}`);
};

// Local files
const envPath = resolve(root, '.env');
const env = existsSync(envPath) ? readFileSync(envPath, 'utf8') : '';
check('local .env has VITE_ONESIGNAL_APP_ID', /VITE_ONESIGNAL_APP_ID=\s*\S+/.test(env), env.includes(APP_ID) ? 'matches dashboard App ID' : 'value present but may differ');
check('local OneSignalSDKWorker.js', existsSync(resolve(root, 'public/OneSignalSDKWorker.js')));
check('local oneSignal.js', existsSync(resolve(root, 'src/utils/oneSignal.js')));
check('local PushPrompt.jsx', existsSync(resolve(root, 'src/components/notifications/PushPrompt.jsx')));
check('local OneSignalBridge.jsx', existsSync(resolve(root, 'src/components/notifications/OneSignalBridge.jsx')));

const swLocal = existsSync(resolve(root, 'public/OneSignalSDKWorker.js'))
  ? readFileSync(resolve(root, 'public/OneSignalSDKWorker.js'), 'utf8')
  : '';
check(
  'local SW imports v16 SDK',
  swLocal.includes('OneSignalSDK.sw.js'),
  swLocal.trim().slice(0, 80)
);

const appJsx = readFileSync(resolve(root, 'src/App.jsx'), 'utf8');
check('App mounts OneSignalBridge + PushPrompt', /OneSignalBridge/.test(appJsx) && /PushPrompt/.test(appJsx));

const util = readFileSync(resolve(root, 'src/utils/oneSignal.js'), 'utf8');
check('pilot is Android-only', /isPushPilotEligible[\s\S]*isAndroidDevice/.test(util));
check('autoPrompt disabled', /autoPrompt:\s*false/.test(util));
check('welcome notification disabled', /welcomeNotification:[\s\S]*disable:\s*true/.test(util));

// Production probes
async function fetchText(url) {
  const res = await fetch(url, { redirect: 'follow' });
  const text = await res.text();
  return { res, text };
}

const swProd = await fetchText(`${site}/OneSignalSDKWorker.js`);
check('prod SW HTTP 200', swProd.res.ok, `status=${swProd.res.status}`);
check('prod SW body correct', swProd.text.includes('OneSignalSDK.sw.js'), swProd.text.trim().slice(0, 80));

const home = await fetchText(site);
const jsMatch = home.text.match(/\/assets\/[^"']+\.js/);
check('prod index has JS bundle', Boolean(jsMatch), jsMatch?.[0] || 'none');

if (jsMatch) {
  const bundle = await fetchText(new URL(jsMatch[0], site).href);
  const hasAppId = bundle.text.includes(APP_ID);
  const hasOneSignal = /OneSignal|onesignal|Stay in the loop|OneSignalSDKWorker/.test(bundle.text);
  check('prod bundle includes App ID', hasAppId, hasAppId ? 'baked in' : 'NOT deployed — rebuild with VITE_ONESIGNAL_APP_ID');
  check('prod bundle includes OneSignal UI/SDK wiring', hasOneSignal, hasOneSignal ? 'present' : 'OneSignal source not in live build');
}

const cdn = await fetch('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js');
check('OneSignal CDN reachable', cdn.ok, `status=${cdn.status}`);

const failed = results.filter((r) => !r.ok);
console.log('\n---');
console.log(`Passed ${results.length - failed.length}/${results.length}`);
if (failed.length) {
  console.log('Failed:');
  for (const f of failed) console.log(`  - ${f.name}: ${f.detail}`);
  process.exitCode = 1;
} else {
  console.log('All probes passed.');
}
