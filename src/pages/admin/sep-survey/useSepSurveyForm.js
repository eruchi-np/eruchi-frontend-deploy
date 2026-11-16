import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { sepSurveyAPI, fifteenDaySurveyAPI, clusterAPI } from '../../../services/api';
import toast from 'react-hot-toast';
import {
  SATISFACTION_SCALE,
  DEFAULT_MATRIX_ROWS,
  EMPTY_QUESTION,
  createEmptyFormData,
  questionTypes,
  metricTagOptions,
  statusOptions,
  visibilityOptions,
  kindOptions,
} from './sepSurveyDefaults.js';
import {
  surveyCacheScope,
  loadSurveyFormCache,
  saveSurveyFormCache,
  clearSurveyFormCache,
  formHasQuestionDraft,
} from './surveyFormCache.js';
import {
  snapshotForm,
  validateSurveyForm,
  buildSurveyQuestions,
} from './surveyFormPersist.js';

const AUTOSAVE_MS = 15000;

const moveItem = (list, from, to) => {
  if (to < 0 || to >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
};

const mapLoadedQuestions = (questions) =>
  questions?.length
    ? questions.map((q) => ({
      ...q,
      options: Array.isArray(q.options) ? q.options : [],
      rows: Array.isArray(q.rows) ? q.rows : [],
      metricTag: q.metricTag === 'cep' || q.metricTag === 'nps' ? q.metricTag : 'none',
      randomizeOptions: Boolean(q.randomizeOptions),
    }))
    : [{ ...EMPTY_QUESTION }];

export default function useSepSurveyForm() {
  const navigate = useNavigate();
  const [pendingAction, setPendingAction] = useState(null);
  const loading = pendingAction != null;
  const [clusters, setClusters] = useState([]);
  const [clustersLoading, setClustersLoading] = useState(false);
  const [formData, setFormData] = useState(createEmptyFormData);
  const [autosaveLabel, setAutosaveLabel] = useState('');
  const [isDirty, setIsDirty] = useState(false);

  const params = useParams();
  const [searchParams] = useSearchParams();
  const routeSurveyId = params.surveyId || params.id;
  const isSprint = searchParams.get('sprint') === '1';
  const sprintDay = Number(searchParams.get('day'));
  const [activeSurveyId, setActiveSurveyId] = useState(routeSurveyId || null);
  const isEditMode = Boolean(activeSurveyId);
  const [initialLoading, setInitialLoading] = useState(Boolean(routeSurveyId));
  const backTo = isSprint ? '/admin/15-day-survey' : '/admin';

  const savedSnapshotRef = useRef(null);
  const formDataRef = useRef(formData);
  const activeSurveyIdRef = useRef(activeSurveyId);
  const pendingActionRef = useRef(pendingAction);
  const isDirtyRef = useRef(isDirty);
  const autosavingRef = useRef(false);
  const allowLeaveRef = useRef(false);

  formDataRef.current = formData;
  activeSurveyIdRef.current = activeSurveyId;
  pendingActionRef.current = pendingAction;
  isDirtyRef.current = isDirty;

  const cacheScope = surveyCacheScope({
    isSprint,
    sprintDay,
    surveyId: activeSurveyId || routeSurveyId,
  });

  const needsPublicWindow =
    !isSprint && (
      formData.visibility === 'public'
      || (formData.visibility === 'targeted' && formData.alsoPublishToOthers)
    );

  const markClean = useCallback((nextForm = formDataRef.current) => {
    savedSnapshotRef.current = snapshotForm(nextForm);
    setIsDirty(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadClusters = async () => {
      if (isSprint) return;
      setClustersLoading(true);
      try {
        const res = await clusterAPI.list({ skipErrorToast: true, limit: 100 });
        if (!cancelled) setClusters(res.data?.data || []);
      } catch {
        if (!cancelled) setClusters([]);
      } finally {
        if (!cancelled) setClustersLoading(false);
      }
    };
    loadClusters();
    return () => { cancelled = true; };
  }, [isSprint]);

  useEffect(() => {
    if (!routeSurveyId) {
      const createScope = surveyCacheScope({ isSprint, sprintDay, surveyId: null });
      const cached = loadSurveyFormCache(createScope);
      if (cached?.formData && formHasQuestionDraft(cached.formData)) {
        setFormData(cached.formData);
        markClean(cached.formData);
        toast.success('Restored your draft from this browser');
      } else {
        const empty = createEmptyFormData();
        setFormData(empty);
        markClean(empty);
      }
      setInitialLoading(false);
      return undefined;
    }

    let cancelled = false;
    const fetchSurvey = async () => {
      try {
        const res = isSprint
          ? await fifteenDaySurveyAPI.getById(routeSurveyId, { skipErrorToast: true })
          : await sepSurveyAPI.getById(routeSurveyId, {
            params: { manage: 1 },
            skipErrorToast: true,
          });
        if (cancelled) return;
        const survey = res.data.data;

        const startDate = survey.startDate ? new Date(survey.startDate) : new Date();
        const endDate = survey.endDate ? new Date(survey.endDate) : null;
        const availableDays = endDate
          ? Math.max(1, Math.round((endDate - startDate) / (1000 * 60 * 60 * 24)))
          : 7;

        const next = {
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

        const editScope = surveyCacheScope({ isSprint, sprintDay, surveyId: routeSurveyId });
        const cached = loadSurveyFormCache(editScope);
        if (cached?.formData && formHasQuestionDraft(cached.formData)) {
          setFormData(cached.formData);
          savedSnapshotRef.current = snapshotForm(next);
          setIsDirty(snapshotForm(cached.formData) !== savedSnapshotRef.current);
          toast.success('Restored unsaved edits from this browser');
        } else {
          setFormData(next);
          markClean(next);
        }
        setActiveSurveyId(routeSurveyId);
      } catch (err) {
        console.error('Failed to load survey for editing', err);
        toast.error('Failed to load survey');
        navigate(isSprint ? '/admin/15-day-survey' : '/admin');
      } finally {
        if (!cancelled) setInitialLoading(false);
      }
    };

    fetchSurvey();
    return () => { cancelled = true; };
  }, [routeSurveyId, isSprint, sprintDay, navigate, markClean]);

  useEffect(() => {
    if (initialLoading) return;
    if (savedSnapshotRef.current == null) {
      savedSnapshotRef.current = snapshotForm(formData);
      return;
    }
    setIsDirty(snapshotForm(formData) !== savedSnapshotRef.current);
  }, [formData, initialLoading]);

  useEffect(() => {
    if (initialLoading) return;
    if (!formHasQuestionDraft(formData)) return;
    const timer = setTimeout(() => {
      saveSurveyFormCache(cacheScope, formData);
    }, 400);
    return () => clearTimeout(timer);
  }, [formData, cacheScope, initialLoading]);

  const persistSurvey = useCallback(async ({
    asDraft = false,
    silent = false,
    stay = false,
  } = {}) => {
    const current = formDataRef.current;
    const surveyId = activeSurveyIdRef.current;
    const needsWindow =
      !isSprint && (
        current.visibility === 'public'
        || (current.visibility === 'targeted' && current.alsoPublishToOthers)
      );

    const checked = validateSurveyForm(current, {
      asDraft,
      isSprint,
      sprintDay,
      needsPublicWindow: needsWindow,
      silent,
    });
    if (!checked.ok) {
      if (!silent && checked.message) toast.error(checked.message);
      return { ok: false };
    }

    const { trimmedTitle, trimmedDesc, status, minutes } = checked;
    if (!silent) setPendingAction(asDraft ? 'save' : 'publish');

    try {
      const availableDays = Number(current.availableDays) || 7;
      const publishedAt = current.publishedAt
        ? new Date(current.publishedAt)
        : new Date();
      const derivedEndDate = new Date(publishedAt);
      derivedEndDate.setDate(derivedEndDate.getDate() + availableDays);
      const questions = buildSurveyQuestions(current.questions);

      if (isSprint) {
        const sprintPayload = {
          daySlot: sprintDay,
          title: trimmedTitle,
          description: trimmedDesc,
          status,
          credits: Number(current.credits),
          estimatedMinutes: minutes,
          questions,
        };
        let savedId = surveyId;
        if (surveyId) {
          await fifteenDaySurveyAPI.update(surveyId, sprintPayload, { skipErrorToast: silent });
          if (!silent) toast.success(asDraft ? '15-day survey saved' : '15-day survey updated');
        } else {
          const res = await fifteenDaySurveyAPI.create(sprintPayload, { skipErrorToast: silent });
          savedId = res.data?.data?._id || null;
          if (savedId) setActiveSurveyId(String(savedId));
          if (!silent) toast.success(asDraft ? '15-day survey saved' : '15-day survey created');
        }
        markClean(current);
        clearSurveyFormCache(cacheScope);
        if (savedId) {
          clearSurveyFormCache(surveyCacheScope({ isSprint, sprintDay, surveyId: savedId }));
        }
        if (!stay) {
          allowLeaveRef.current = true;
          navigate('/admin/15-day-survey');
        } else if (silent) {
          setAutosaveLabel(`Draft saved ${new Date().toLocaleTimeString()}`);
        }
        return { ok: true, id: savedId };
      }

      const payload = {
        title: trimmedTitle,
        description: trimmedDesc,
        status,
        credits: Number(current.credits),
        estimatedMinutes: minutes,
        kind: current.kind === 'daily' ? 'daily' : 'normal',
        startDate: publishedAt.toISOString(),
        endDate: needsWindow ? derivedEndDate.toISOString() : null,
        visibility: current.visibility,
        alsoPublishToOthers:
          current.visibility === 'targeted' ? Boolean(current.alsoPublishToOthers) : false,
        validityDays: Number(current.validityDays) || 7,
        clusterIds:
          current.visibility === 'targeted' && status === 'published'
            ? current.clusterIds
            : [],
        clusterSendAt:
          current.visibility === 'targeted'
          && status === 'published'
          && current.clusterIds.length > 0
            ? new Date(current.clusterSendAt).toISOString()
            : undefined,
        questions,
      };

      let sends = [];
      let savedId = surveyId;
      if (surveyId) {
        const res = await sepSurveyAPI.update(surveyId, payload, { skipErrorToast: silent });
        sends = res.data?.sends || [];
        if (!silent) toast.success(asDraft ? 'Survey saved' : 'Survey updated successfully!');
      } else {
        const res = await sepSurveyAPI.create(payload, { skipErrorToast: silent });
        sends = res.data?.sends || [];
        savedId = res.data?.data?._id || null;
        if (savedId) setActiveSurveyId(String(savedId));
        if (!silent) toast.success(asDraft ? 'Survey saved' : 'Standalone survey created successfully!');
      }

      if (!silent) {
        const failedSends = sends.filter((s) => !s.ok);
        const okSends = sends.filter((s) => s.ok);
        if (okSends.length) {
          const firstWhen = okSends.find((s) => s.scheduledFor)?.scheduledFor;
          const scheduledDate = firstWhen ? new Date(firstWhen) : null;
          const future =
            scheduledDate
            && !Number.isNaN(scheduledDate.getTime())
            && scheduledDate.getTime() > Date.now();
          toast.success(
            future
              ? `Scheduled send to ${okSends.length} cluster${okSends.length === 1 ? '' : 's'} for ${scheduledDate.toLocaleString()}`
              : `Queued send to ${okSends.length} cluster${okSends.length === 1 ? '' : 's'}`
          );
        }
        if (failedSends.length) {
          toast.error(
            `Could not send to ${failedSends.length} cluster${failedSends.length === 1 ? '' : 's'}: ${
              failedSends.map((s) => s.message).join('; ')
            }`
          );
        }
      }

      markClean(current);
      clearSurveyFormCache(cacheScope);
      if (savedId) {
        clearSurveyFormCache(surveyCacheScope({ isSprint, sprintDay, surveyId: savedId }));
      }
      if (!stay) {
        allowLeaveRef.current = true;
        navigate('/admin');
      } else if (silent) {
        setAutosaveLabel(`Draft saved ${new Date().toLocaleTimeString()}`);
      }
      return { ok: true, id: savedId };
    } catch (err) {
      console.error('Create sep survey error:', err);
      if (!silent) {
        const data = err.response?.data;
        const detail =
          Array.isArray(data?.errors) && data.errors.length
            ? data.errors.join('. ')
            : null;
        const msg =
          detail
          || data?.message
          || (surveyId ? 'Failed to update survey' : 'Failed to create survey');
        toast.error(msg);
      }
      return { ok: false };
    } finally {
      if (!silent) setPendingAction(null);
    }
  }, [isSprint, sprintDay, navigate, markClean, cacheScope]);

  useEffect(() => {
    if (initialLoading) return undefined;
    const timer = setInterval(async () => {
      if (autosavingRef.current) return;
      if (pendingActionRef.current) return;
      if (!isDirtyRef.current) return;
      if (!formHasQuestionDraft(formDataRef.current)) return;

      autosavingRef.current = true;
      try {
        await persistSurvey({ asDraft: true, silent: true, stay: true });
      } finally {
        autosavingRef.current = false;
      }
    }, AUTOSAVE_MS);
    return () => clearInterval(timer);
  }, [initialLoading, persistSurvey]);

  useEffect(() => {
    const onBeforeUnload = (event) => {
      if (allowLeaveRef.current || !isDirtyRef.current) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, []);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleCluster = (clusterId) => {
    setFormData((prev) => {
      const id = String(clusterId);
      const has = prev.clusterIds.includes(id);
      return {
        ...prev,
        clusterIds: has
          ? prev.clusterIds.filter((c) => c !== id)
          : [...prev.clusterIds, id],
      };
    });
  };

  const handleQuestionChange = (index, field, value) => {
    const updated = [...formData.questions];
    const previousType = updated[index].questionType;
    updated[index][field] = value;

    if (field === 'questionType') {
      if (value === 'single_checkbox' || value === 'multiple_checkbox' || value === 'attention_check') {
        updated[index].options = updated[index].options.length ? updated[index].options : ['Option 1', 'Option 2'];
        updated[index].rows = [];
        updated[index].maxSelections = value === 'multiple_checkbox' ? 2 : 1;
      } else if (value === 'likert') {
        if (previousType !== 'likert') {
          updated[index].options = ['1', '2', '3', '4', '5'];
          updated[index].rows = [];
          updated[index].maxSelections = 1;
        }
      } else if (value === 'matrix_radio') {
        updated[index].options = updated[index].options?.length
          ? updated[index].options
          : [...SATISFACTION_SCALE];
        updated[index].rows = updated[index].rows?.length
          ? updated[index].rows
          : [...DEFAULT_MATRIX_ROWS];
        updated[index].maxSelections = 1;
      } else if (value === 'slider') {
        updated[index].minValue = 0;
        updated[index].maxValue = 5;
        updated[index].options = [];
        updated[index].rows = [];
      } else {
        updated[index].options = [];
        updated[index].rows = [];
        updated[index].maxSelections = 1;
        updated[index].minValue = 0;
        updated[index].maxValue = 5;
      }
      if (value === 'attention_check') {
        updated[index].attentionCheck = true;
      } else if (value === 'single_checkbox' && previousType === 'attention_check') {
        updated[index].attentionCheck = false;
        updated[index].attentionAnswer = '';
      } else if (value !== 'single_checkbox') {
        updated[index].attentionCheck = false;
        updated[index].attentionAnswer = '';
      }
    }

    setFormData((prev) => ({ ...prev, questions: updated }));
  };

  const handleOptionChange = (qIndex, optIndex, value) => {
    const updated = [...formData.questions];
    const previous = updated[qIndex].options[optIndex];
    updated[qIndex].options[optIndex] = value;
    if (updated[qIndex].attentionAnswer === previous) {
      updated[qIndex].attentionAnswer = value;
    }
    setFormData((prev) => ({ ...prev, questions: updated }));
  };

  const addOption = (qIndex) => {
    const updated = [...formData.questions];
    const next = updated[qIndex].options.length + 1;
    const label = updated[qIndex].questionType === 'likert' ? String(next) : `Option ${next}`;
    updated[qIndex].options.push(label);
    setFormData((prev) => ({ ...prev, questions: updated }));
  };

  const removeOption = (qIndex, optIndex) => {
    const updated = [...formData.questions];
    if (updated[qIndex].options.length > 1) {
      const removed = updated[qIndex].options[optIndex];
      updated[qIndex].options.splice(optIndex, 1);
      if (updated[qIndex].attentionAnswer === removed) {
        updated[qIndex].attentionAnswer = '';
      }
      setFormData((prev) => ({ ...prev, questions: updated }));
    }
  };

  const handleRowChange = (qIndex, rowIndex, value) => {
    const updated = [...formData.questions];
    if (!Array.isArray(updated[qIndex].rows)) updated[qIndex].rows = [];
    updated[qIndex].rows[rowIndex] = value;
    setFormData((prev) => ({ ...prev, questions: updated }));
  };

  const addRow = (qIndex) => {
    const updated = [...formData.questions];
    if (!Array.isArray(updated[qIndex].rows)) updated[qIndex].rows = [];
    updated[qIndex].rows.push(`Aspect ${updated[qIndex].rows.length + 1}`);
    setFormData((prev) => ({ ...prev, questions: updated }));
  };

  const removeRow = (qIndex, rowIndex) => {
    const updated = [...formData.questions];
    if ((updated[qIndex].rows || []).length > 1) {
      updated[qIndex].rows.splice(rowIndex, 1);
      setFormData((prev) => ({ ...prev, questions: updated }));
    }
  };

  const moveRow = (qIndex, from, to) => {
    const updated = [...formData.questions];
    updated[qIndex].rows = moveItem(updated[qIndex].rows || [], from, to);
    setFormData((prev) => ({ ...prev, questions: updated }));
  };

  const moveOption = (qIndex, from, to) => {
    const updated = [...formData.questions];
    updated[qIndex].options = moveItem(updated[qIndex].options || [], from, to);
    setFormData((prev) => ({ ...prev, questions: updated }));
  };

  const applySatisfactionScale = (qIndex) => {
    const updated = [...formData.questions];
    updated[qIndex].options = [...SATISFACTION_SCALE];
    setFormData((prev) => ({ ...prev, questions: updated }));
  };

  const addQuestion = () => {
    setFormData((prev) => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          questionText: '',
          questionType: 'text_short',
          options: [],
          rows: [],
          maxSelections: 1,
          minValue: 0,
          maxValue: 5,
          isRequired: true,
          attentionCheck: false,
          attentionAnswer: '',
          metricTag: 'none',
        },
      ],
    }));
  };

  const removeQuestion = (index) => {
    if (formData.questions.length > 1) {
      const updated = formData.questions.filter((_, i) => i !== index);
      setFormData((prev) => ({ ...prev, questions: updated }));
    }
  };

  const handleSubmit = async (e, { asDraft = false } = {}) => {
    e.preventDefault();
    await persistSurvey({ asDraft, silent: false, stay: false });
  };

  const leaveWithoutSaving = () => {
    allowLeaveRef.current = true;
    if (formHasQuestionDraft(formDataRef.current)) {
      saveSurveyFormCache(cacheScope, formDataRef.current);
    }
    navigate(backTo);
  };

  const getMinPublishedDate = () => new Date().toISOString().slice(0, 16);

  const getQuestionTypeData = (type) => questionTypes.find((qt) => qt.value === type);

  return {
    loading,
    pendingAction,
    autosaveLabel,
    isDirty,
    clusters,
    clustersLoading,
    formData,
    isSprint,
    sprintDay,
    isEditMode,
    initialLoading,
    backTo,
    navigate,
    questionTypes,
    metricTagOptions,
    statusOptions,
    visibilityOptions,
    kindOptions,
    handleInputChange,
    toggleCluster,
    needsPublicWindow,
    handleQuestionChange,
    handleOptionChange,
    addOption,
    removeOption,
    handleRowChange,
    addRow,
    removeRow,
    moveRow,
    moveOption,
    applySatisfactionScale,
    addQuestion,
    removeQuestion,
    handleSubmit,
    leaveWithoutSaving,
    getMinPublishedDate,
    getQuestionTypeData,
  };
}
