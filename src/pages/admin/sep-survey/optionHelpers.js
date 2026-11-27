import { newOptionId, normalizeOptions, optionLabel } from '../../../utils/surveyLogic';

/** Raw label for a controlled input. optionLabel() trims, which eats a trailing space while typing. */
export function optionDraftLabel(option) {
  if (option == null) return '';
  if (typeof option === 'string') return option;
  if (typeof option === 'object') return String(option.label ?? option.text ?? '');
  return String(option);
}

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
    options_from: question.options_from || null,
  };
}

export { optionLabel, normalizeOptions, newOptionId };
