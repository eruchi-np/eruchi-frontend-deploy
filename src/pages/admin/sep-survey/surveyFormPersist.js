import { plainSurveyText, sanitizeSurveyMarkup } from '../../../utils/surveyMarkup';

export const snapshotForm = (formData) => JSON.stringify(formData);

export const validateSurveyForm = (
  formData,
  { asDraft, isSprint, sprintDay, needsPublicWindow, silent = false }
) => {
  const fail = (message) => {
    if (silent) return { ok: false };
    return { ok: false, message };
  };

  const trimmedTitle = formData.title.trim();
  const trimmedDesc = formData.description.trim();
  const status = asDraft ? 'draft' : formData.status;

  if (!trimmedTitle) return fail('Survey title is required');
  if (!trimmedDesc) return fail('Description is required');

  if (isSprint && (!Number.isInteger(sprintDay) || sprintDay < 1 || sprintDay > 15)) {
    return fail('Pick a day from 1 to 15');
  }

  if (!isSprint && status === 'published' && needsPublicWindow) {
    if (!formData.publishedAt) return fail('Published date is required');
    if (!formData.availableDays || Number(formData.availableDays) < 1) {
      return fail('Available days must be at least 1');
    }
  }

  const minutes = Number(formData.estimatedMinutes);
  if (
    formData.estimatedMinutes === ''
    || formData.estimatedMinutes == null
    || !Number.isFinite(minutes)
    || minutes < 1
  ) {
    return fail('Estimated time must be at least 1 minute');
  }

  if (!Number.isFinite(Number(formData.credits)) || Number(formData.credits) < 0) {
    return fail('Credits must be zero or more');
  }

  if (
    !isSprint
    && formData.visibility === 'targeted'
    && (!formData.validityDays || Number(formData.validityDays) < 1)
  ) {
    return fail('Validity days must be at least 1');
  }

  if (
    !isSprint
    && formData.visibility === 'targeted'
    && status === 'published'
    && formData.clusterIds.length > 0
    && !formData.clusterSendAt
  ) {
    return fail('Cluster send date/time is required');
  }

  const questionTexts = formData.questions.map((q) => plainSurveyText(q.questionText));
  if (questionTexts.some((text) => !text)) return fail('All questions must have text');
  if (questionTexts.some((text) => text.length > 200)) {
    return fail('Question text must be 200 characters or less');
  }
  if (new Set(questionTexts).size !== questionTexts.length) {
    return fail('Each question needs its own wording');
  }

  const invalidCheckboxes = formData.questions.filter((q) =>
    (q.questionType === 'single_checkbox' || q.questionType === 'multiple_checkbox' || q.questionType === 'attention_check')
    && !(q.options || []).map((option) => option.trim()).filter(Boolean).length
  );
  if (invalidCheckboxes.length) return fail('Checkbox questions need at least one option');

  const blankLikert = formData.questions.some((q) =>
    q.questionType === 'likert'
    && (!(q.options || []).length || (q.options || []).some((option) => !String(option).trim()))
  );
  if (blankLikert) return fail('Each Likert option needs text');

  const invalidMatrices = formData.questions.filter((q) =>
    q.questionType === 'matrix_radio'
    && (
      !(q.rows || []).map((r) => r.trim()).filter(Boolean).length
      || !(q.options || []).map((o) => o.trim()).filter(Boolean).length
    )
  );
  if (invalidMatrices.length) {
    return fail('Matrix questions need at least one row and one column option');
  }

  const duplicateLabels = formData.questions.some((q) => {
    if (!['single_checkbox', 'multiple_checkbox', 'attention_check', 'likert', 'matrix_radio'].includes(q.questionType)) {
      return false;
    }
    const options = (q.options || []).map((option) => option.trim()).filter(Boolean);
    if (new Set(options).size !== options.length) return true;
    if (q.questionType !== 'matrix_radio') return false;
    const rows = (q.rows || []).map((row) => row.trim()).filter(Boolean);
    return new Set(rows).size !== rows.length;
  });
  if (duplicateLabels) return fail('Options and matrix rows must be unique');

  const invalidSliders = formData.questions.filter((q) => {
    if (q.questionType !== 'slider') return false;
    const min = Number(q.minValue);
    const max = Number(q.maxValue);
    return !Number.isFinite(min) || !Number.isFinite(max) || max <= min;
  });
  if (invalidSliders.length) return fail('Slider max must be greater than min');

  const badAttention = formData.questions.some((q) => {
    const marked = q.questionType === 'attention_check'
      || (q.questionType === 'single_checkbox' && q.attentionCheck);
    if (!marked) return false;
    const options = (q.options || []).map((option) => option.trim()).filter(Boolean);
    return !options.includes(String(q.attentionAnswer || '').trim());
  });
  if (badAttention) return fail('An attention check needs its correct option');

  return { ok: true, trimmedTitle, trimmedDesc, status, minutes };
};

export const buildSurveyQuestions = (questions) =>
  questions.map((q) => {
    const base = {
      questionText: sanitizeSurveyMarkup(q.questionText),
      questionType: q.questionType,
      isRequired: q.isRequired !== false,
      metricTag: q.metricTag === 'cep' || q.metricTag === 'nps' ? q.metricTag : 'none',
    };
    if (['single_checkbox', 'multiple_checkbox', 'attention_check'].includes(q.questionType)) {
      base.options = q.options.map((o) => o.trim()).filter(Boolean);
      base.maxSelections = q.questionType === 'multiple_checkbox' ? q.maxSelections : 1;
    }
    if (q.questionType === 'attention_check') {
      base.attentionCheck = true;
      base.attentionAnswer = String(q.attentionAnswer || '').trim();
    }
    if (q.questionType === 'likert') {
      base.options = q.options.map((o) => o.trim());
      base.maxSelections = 1;
    }
    if (q.questionType === 'single_checkbox' && q.attentionCheck) {
      base.attentionCheck = true;
      base.attentionAnswer = String(q.attentionAnswer || '').trim();
    }
    if (q.questionType === 'matrix_radio') {
      base.options = (q.options || []).map((o) => o.trim()).filter(Boolean);
      base.rows = (q.rows || []).map((r) => r.trim()).filter(Boolean);
      base.maxSelections = 1;
    }
    if (
      q.questionType === 'single_checkbox'
      || q.questionType === 'multiple_checkbox'
      || q.questionType === 'matrix_radio'
    ) {
      base.randomizeOptions = Boolean(q.randomizeOptions);
    }
    if (q.questionType === 'slider') {
      base.minValue = Number(q.minValue);
      base.maxValue = Number(q.maxValue);
    }
    return base;
  });
