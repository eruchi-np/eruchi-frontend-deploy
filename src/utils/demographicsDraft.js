const STORAGE_KEY = 'demographics_draft_v2';
const LEGACY_STORAGE_KEY = 'demographics_draft_v1';

export const initialFormData = {
  firstLanguage: '',
  education: '',
  maritalStatus: '',
  occupation: '',
  municipality: '',
  wardNumber: '',
  durableGoods: [],
  mainHouseholdEarner: '',
  earnerEducation: '',
};

export const initialCompletedSteps = {
  step1: false,
  step2: false,
  step3: false,
};

const TEXT_FIELDS = [
  'firstLanguage',
  'education',
  'maritalStatus',
  'occupation',
  'municipality',
  'wardNumber',
  'mainHouseholdEarner',
  'earnerEducation',
];

/** True if the user has entered anything worth restoring later. */
export const hasDraftProgress = (formData = {}, completedSteps = {}, currentStep = 1) => {
  if (currentStep > 1) return true;
  if (Object.values(completedSteps).some(Boolean)) return true;

  for (const field of TEXT_FIELDS) {
    const value = formData[field];
    // null is a valid choice for firstLanguage ("Other")
    if (value === null) return true;
    if (typeof value === 'string' && value.trim() !== '') return true;
    if (typeof value === 'number' && !Number.isNaN(value)) return true;
  }

  if (Array.isArray(formData.durableGoods) && formData.durableGoods.length > 0) return true;
  return false;
};

export const normalizeFormData = (raw = {}) => {
  const next = { ...initialFormData, ...raw };
  delete next.selectedInterests;
  if (!Array.isArray(next.durableGoods)) next.durableGoods = [];

  for (const field of TEXT_FIELDS) {
    if (next[field] === undefined) next[field] = '';
  }

  return next;
};

export const saveDraft = (formData, completedSteps, currentStep) => {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ formData, completedSteps, currentStep })
    );
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch (err) {
    console.warn('Failed to save demographics draft:', err);
  }
};

export const clearDemographicsDraft = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch (err) {
    console.warn('Failed to clear demographics draft:', err);
  }
};

/**
 * Load a draft only when it has real progress.
 * Empty / junk drafts are cleared so selects stay blank by default.
 */
export const loadDraft = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.formData?.selectedInterests) {
      delete parsed.formData.selectedInterests;
    }
    if (parsed?.completedSteps?.step4) {
      delete parsed.completedSteps.step4;
    }
    if (parsed?.currentStep > 3) parsed.currentStep = 3;

    const formData = normalizeFormData(parsed?.formData);
    const completedSteps = {
      ...initialCompletedSteps,
      ...(parsed?.completedSteps || {}),
    };
    const currentStep = Math.min(Math.max(parsed?.currentStep || 1, 1), 3);

    if (!hasDraftProgress(formData, completedSteps, currentStep)) {
      clearDemographicsDraft();
      return null;
    }

    return { formData, completedSteps, currentStep };
  } catch (err) {
    console.warn('Failed to parse saved demographics draft, ignoring it:', err);
    return null;
  }
};

export const demographicsDraftStorage = {
  STORAGE_KEY,
  LEGACY_STORAGE_KEY,
};
