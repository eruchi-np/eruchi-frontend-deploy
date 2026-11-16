const CACHE_KEY = 'eruchi.surveyForm.cache.v1';

export const surveyCacheScope = ({ isSprint, sprintDay, surveyId }) => {
  if (isSprint) {
    return surveyId
      ? `sprint:${sprintDay || 'x'}:${surveyId}`
      : `sprint:${sprintDay || 'x'}:new`;
  }
  return surveyId ? `sep:${surveyId}` : 'sep:new';
};

export const loadSurveyFormCache = (scope) => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.scope !== scope || !parsed.formData) return null;
    return parsed;
  } catch {
    return null;
  }
};

export const saveSurveyFormCache = (scope, formData) => {
  try {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({
        scope,
        formData,
        savedAt: new Date().toISOString(),
      })
    );
  } catch (err) {
    console.warn('Failed to cache survey form:', err);
  }
};

export const clearSurveyFormCache = (scope) => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return;
    if (!scope) {
      localStorage.removeItem(CACHE_KEY);
      return;
    }
    const parsed = JSON.parse(raw);
    if (parsed?.scope === scope) localStorage.removeItem(CACHE_KEY);
  } catch (err) {
    console.warn('Failed to clear survey form cache:', err);
  }
};

export const formHasQuestionDraft = (formData) =>
  Boolean(
    formData?.questions?.some((q) => String(q?.questionText || '').trim())
    || String(formData?.title || '').trim()
    || String(formData?.description || '').trim()
  );
