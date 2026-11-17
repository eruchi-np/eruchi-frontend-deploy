/** Client-side PC2 SEC routing helpers (mirrors backend/sec/secEngine.js). */

export function ev(expr, a) {
  if (expr == null) return true;
  if (expr.all) return expr.all.every((e) => ev(e, a));
  if (expr.any) return expr.any.some((e) => ev(e, a));
  if (expr.not) return !ev(expr.not, a);
  const v = a[expr.q];
  if ('eq' in expr) return v != null && v === expr.eq;
  if ('ne' in expr) return v != null && v !== expr.ne;
  if ('in' in expr) return expr.in.includes(v);
  if ('includes' in expr) return Array.isArray(v) && v.includes(expr.includes);
  if ('excludes' in expr) return !(Array.isArray(v) && v.includes(expr.excludes));
  return false;
}

export function questionById(spec, id) {
  return (spec.questions || []).find((q) => q.id === id);
}

export function order(spec) {
  return (spec.questions || []).map((q) => q.id);
}

export function isShown(spec, qid, a) {
  const q = questionById(spec, qid);
  return q ? ev(q.show_if, a) : false;
}

export function visibleIds(spec, a) {
  return order(spec).filter((id) => isShown(spec, id, a));
}

export function nextQuestion(spec, a) {
  for (const id of visibleIds(spec, a)) {
    const v = a[id];
    if (v == null || v === '' || (Array.isArray(v) && v.length === 0)) return id;
  }
  return null;
}

export function questionText(spec, qid, a, field = 'text') {
  const q = questionById(spec, qid);
  if (!q) return '';
  const who = (spec.who_phrases || {})[a.EARN1] || 'this person';
  for (const variant of q[field] || []) {
    if (ev(variant.when, a)) return String(variant.text || '').replace(/\{who\}/g, who);
  }
  return '';
}

export function visibleOptions(spec, qid, a) {
  const q = questionById(spec, qid);
  return (q?.options || []).filter((o) => !(o.hide_if && ev(o.hide_if, a)));
}

function deepEqual(x, y) {
  return JSON.stringify(x) === JSON.stringify(y);
}

const CONFIRM_DEPS = {
  HH1: [],
  EARN1: ['HH1'],
  EARN_LOC: ['EARN1'],
  REMIT: ['EARN_LOC'],
  OCC: ['EARN1'],
  OCC_OTHER_TEXT: ['OCC'],
  OCC_CLOSEST: ['OCC'],
  BIZ_SIZE: ['OCC', 'OCC_CLOSEST'],
  ADULTS: ['HH1'],
  YOUNG_M: ['ADULTS'],
  YOUNG_F: ['ADULTS'],
  EDU_M: ['ADULTS', 'YOUNG_M'],
  EDU_F: ['ADULTS', 'YOUNG_F'],
};

export function confirmSameOffer(spec, qid, prev, a) {
  if (!prev || !(qid in prev) || !isShown(spec, qid, a)) return null;
  const deps = CONFIRM_DEPS[qid] || [];
  if (deps.some((d) => !deepEqual(prev[d], a[d]))) return null;
  const v = prev[qid];
  const q = questionById(spec, qid);
  if (q.type === 'text') {
    const ok = typeof v === 'string'
      && v.trim().length >= (q.min_len || 0)
      && v.trim().length <= (q.max_len || 9999);
    return ok ? v : null;
  }
  const allowed = new Set(visibleOptions(spec, qid, a).map((o) => o.code));
  const vals = q.type === 'multi' ? v : [v];
  const ok = Array.isArray(vals) && vals.length > 0 && vals.every((x) => allowed.has(x));
  return ok ? v : null;
}

export function pruneAnswers(spec, a) {
  const shown = new Set(visibleIds(spec, a));
  const next = {};
  for (const [k, v] of Object.entries(a)) {
    if (shown.has(k)) next[k] = v;
  }
  return next;
}

export function effectiveOcc(a) {
  if (!a.EARN1 || a.EARN1 === 'NOBODY') return null;
  return a.OCC === 'OTHER' ? a.OCC_CLOSEST : a.OCC;
}

export function needsProfessionalSoftCheck(a) {
  const occ = effectiveOcc(a);
  if (occ !== 'PROFESSIONAL') return false;
  const levels = { NONE: 1, UPTO_5: 2, C6_9: 3, C10_14: 4, DEG_REG: 5, DEG_PRO: 6 };
  const vals = [a.EDU_M, a.EDU_F].map((c) => levels[c]).filter((n) => n != null);
  const best = vals.length ? Math.max(...vals) : 0;
  return best < 5;
}

/** OCC_OTHER_TEXT and OCC_CLOSEST share one screen. */
export function screenIdsFor(qid) {
  if (qid === 'OCC_OTHER_TEXT' || qid === 'OCC_CLOSEST') return ['OCC_OTHER_TEXT', 'OCC_CLOSEST'];
  return [qid];
}

export function screenList(spec, a) {
  const unique = [];
  for (const id of visibleIds(spec, a)) {
    const screen = screenIdsFor(id)[0];
    if (!unique.includes(screen)) unique.push(screen);
  }
  return unique;
}

/** First unanswered screen, or the last screen when a draft is already complete. */
export function initialScreenId(spec, a) {
  const first = nextQuestion(spec, a);
  if (first) return screenIdsFor(first)[0];
  const screens = screenList(spec, a);
  return screens.length ? screens[screens.length - 1] : null;
}

export function progressFraction(spec, a) {
  const ids = visibleIds(spec, a);
  if (!ids.length) return 1;
  let answered = 0;
  for (const id of ids) {
    const v = a[id];
    if (v != null && v !== '' && !(Array.isArray(v) && !v.length)) answered += 1;
  }
  return answered / ids.length;
}
