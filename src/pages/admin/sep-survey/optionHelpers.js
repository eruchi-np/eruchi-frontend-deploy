import { newOptionId, normalizeOptions, optionLabel } from '../../../utils/surveyLogic';

export function asOptionObject(value, previous) {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return {
      id: value.id || previous?.id || newOptionId(),
      label: optionLabel(value),
    };
  }
  return {
    id: previous?.id || newOptionId(),
    label: String(value ?? ''),
  };
}

export function ensureQuestionOptions(question) {
  if (!question) return question;
  return {
    ...question,
    options: normalizeOptions(question.options || []),
    show_if: question.show_if || null,
    end_after_if: question.end_after_if || null,
  };
}

export { optionLabel, normalizeOptions, newOptionId };
