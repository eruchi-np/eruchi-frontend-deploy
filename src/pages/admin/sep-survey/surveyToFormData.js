import { EMPTY_QUESTION } from './sepSurveyDefaults.js';

export const mapLoadedQuestions = (questions) =>
  questions?.length
    ? questions.map((q) => ({
      ...q,
      options: Array.isArray(q.options) ? q.options : [],
      rows: Array.isArray(q.rows) ? q.rows : [],
      metricTag: q.metricTag === 'cep' || q.metricTag === 'nps' ? q.metricTag : 'none',
      randomizeOptions: Boolean(q.randomizeOptions),
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
    description: survey.description || '',
    status: survey.status || 'published',
    credits: survey.credits ?? 50,
    kind: survey.kind === 'daily' ? 'daily' : 'normal',
    publishedAt: startDate.toISOString().slice(0, 16),
    availableDays,
    estimatedMinutes: survey.estimatedMinutes ?? '',
    visibility: survey.visibility || 'public',
    validityDays: survey.validityDays ?? 7,
    alsoPublishToOthers: Boolean(survey.alsoPublishToOthers),
    clusterSendAt: new Date().toISOString().slice(0, 16),
    clusterIds: [],
    questions: mapLoadedQuestions(survey.questions),
  };
};
