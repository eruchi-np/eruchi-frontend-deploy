const DRAFT_KEY = 'sec_pc2_draft_v1';

export function draftKeyFor(mode = 'first') {
  return `${DRAFT_KEY}:${mode}`;
}

export function loadSecDraft(mode = 'first') {
  try {
    const raw = localStorage.getItem(draftKeyFor(mode));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    if (!parsed.answers || typeof parsed.answers !== 'object') return null;
    if (!Object.keys(parsed.answers).length) return null;
    return {
      answers: parsed.answers,
      startedAt: parsed.startedAt || null,
      instrument_version: parsed.instrument_version || null,
      editCursor: Number(parsed.editCursor) || 0,
    };
  } catch {
    return null;
  }
}

export function saveSecDraft(mode, { answers, startedAt, instrument_version, editCursor }) {
  try {
    if (!answers || !Object.keys(answers).length) {
      clearSecDraft(mode);
      return;
    }
    localStorage.setItem(
      draftKeyFor(mode),
      JSON.stringify({
        answers,
        startedAt: startedAt || new Date().toISOString(),
        instrument_version: instrument_version || null,
        editCursor: editCursor || 0,
        savedAt: new Date().toISOString(),
      })
    );
  } catch (err) {
    console.warn('Failed to save SEC draft:', err);
  }
}

export function clearSecDraft(mode = 'first') {
  try {
    localStorage.removeItem(draftKeyFor(mode));
  } catch (err) {
    console.warn('Failed to clear SEC draft:', err);
  }
}
