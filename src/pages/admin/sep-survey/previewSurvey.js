import { buildSurveyQuestions, formHasLogic } from './surveyFormPersist.js';
import { stabilizeLogicQuestions } from '../../../utils/surveyLogic';

/** Build a respondent-shaped survey from the admin form for live logic preview. */
export function buildPreviewSurvey(formData) {
  const built = buildSurveyQuestions(formData?.questions || []);
  const questions = stabilizeLogicQuestions(built);
  return {
    _id: 'preview',
    title: formData?.title || 'Untitled survey',
    description: formData?.description || '',
    credits: Number(formData?.credits) || 0,
    estimatedMinutes: Number(formData?.estimatedMinutes) || null,
    kind: formData?.kind || 'normal',
    hasLogic: formHasLogic(formData) || questions.some((q) => q.show_if || q.end_after_if),
    questions,
  };
}
