import { EMPTY_QUESTION } from './sepSurveyDefaults.js';
import { ensureQuestionOptions } from './optionHelpers.js';

/** datetime-local value in the viewer's local time. */
export const toDateTimeLocal = (value) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (part) => String(part).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

export const mapLoadedQuestions = (questions) =>
  questions?.length
    ? questions.map((q) => ensureQuestionOptions({
      ...q,
      options: Array.isArray(q.options) ? q.options : [],
      rows: Array.isArray(q.rows) ? q.rows : [],
      metricTag: q.metricTag === 'cep' || q.metricTag === 'nps' ? q.metricTag : 'none',
      randomizeOptions: Boolean(q.randomizeOptions),
      show_if: q.show_if || null,
      end_after_if: q.end_after_if || null,
    }))
    : [{ ...EMPTY_QUESTION }];

/** Map a saved/admin survey document into create/edit form state. */
export const surveyToFormData = (survey) => {
  const startDate = survey.startDate ? new Date(survey.startDate) : new Date();
  const endDate = survey.endDate ? new Date(survey.endDate) : null;
  const availableDays = endDate
    ? Math.max(1, Math.round((endDate - startDate) / (1000 * 60 * 60 * 24)))
    : 7;

  return {
    title: survey.title || '',
    hiddenName: survey.hiddenName || '',
    description: survey.description || '',
    status: survey.status || 'published',
    credits: survey.credits ?? 50,
    kind: survey.kind === 'daily' ? 'daily' : 'normal',
    isPoll: Boolean(survey.isPoll),
    publishedAt: toDateTimeLocal(startDate) || toDateTimeLocal(new Date()),
    extraPublishedAts: [],
    availableDays,
    estimatedMinutes: survey.estimatedMinutes ?? '',
    visibility: survey.visibility || 'public',
    validityDays: survey.validityDays ?? 7,
    alsoPublishToOthers: Boolean(survey.alsoPublishToOthers),
    clusterSendAt: toDateTimeLocal(survey.clusterSendAt) || toDateTimeLocal(new Date()),
    clusterIds: Array.isArray(survey.clusterIds)
      ? survey.clusterIds.map((id) => String(id?._id || id))
      : [],
    questions: mapLoadedQuestions(survey.questions),
  };
};
