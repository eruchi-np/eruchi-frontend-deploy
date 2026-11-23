import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { sepSurveyAPI, fifteenDaySurveyAPI, clusterAPI } from '../../../services/api';
import toast from 'react-hot-toast';
import {
  SATISFACTION_SCALE,
  DEFAULT_MATRIX_ROWS,
  createEmptyFormData,
  EMPTY_POLL_QUESTION,
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
  formHasLogic,
} from './surveyFormPersist.js';
import { surveyToFormData } from './surveyToFormData.js';
import { asOptionObject, normalizeOptions, optionLabel } from './optionHelpers.js';
import { computeLogicCredits } from '../../../utils/surveyLogic';

const AUTOSAVE_MS = 15000;

const moveItem = (list, from, to) => {
  if (to < 0 || to >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
};

export default function useSepSurveyForm() {
  const navigate = useNavigate();
  const [pendingAction, setPendingAction] = useState(null);
  const loading = pendingAction != null;
  const [clusters, setClusters] = useState([]);
  const [clustersLoading, setClustersLoading] = useState(false);
  const [formData, setFormData] = useState(createEmptyFormData);
  const [autosaveLabel, setAutosaveLabel] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [savedDrafts, setSavedDrafts] = useState([]);
  const [savedDraftsLoading, setSavedDraftsLoading] = useState(false);
  const [loadingSavedId, setLoadingSavedId] = useState(null);

  const params = useParams();
  const [searchParams] = useSearchParams();
  const routeSurveyId = params.surveyId || params.id;
  const isSprint = searchParams.get('sprint') === '1';
  const sprintDay = Number(searchParams.get('day'));
  const [activeSurveyId, setActiveSurveyId] = useState(routeSurveyId || null);
  // Autosave stores an id during create. Edit mode follows the URL only,
  // so a loaded template still shows Create Survey.
  const isEditMode = Boolean(routeSurveyId);
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
    if (isSprint || routeSurveyId) {
      setSavedDrafts([]);
      return undefined;
    }
    let cancelled = false;
    const loadSavedDrafts = async () => {
      setSavedDraftsLoading(true);
      try {
        const res = await sepSurveyAPI.getAvailable({
          manage: 1,
          limit: 500,
          skipErrorToast: true,
        });
        if (cancelled) return;
        const rows = res.data?.data || [];
        setSavedDrafts(
          rows
            .filter((s) => s.status === 'draft')
            .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
        );
      } catch {
        if (!cancelled) setSavedDrafts([]);
      } finally {
        if (!cancelled) setSavedDraftsLoading(false);
      }
    };
    loadSavedDrafts();
    return () => { cancelled = true; };
  }, [isSprint, routeSurveyId]);

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
        const next = surveyToFormData(survey);

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

  const applySavedSurvey = useCallback(async (surveyId) => {
    if (!surveyId || isSprint || routeSurveyId) return;
    setLoadingSavedId(surveyId);
    try {
      const res = await sepSurveyAPI.getById(surveyId, {
        params: { manage: 1 },
        skipErrorToast: true,
      });
      const survey = res.data?.data;
      if (!survey) throw new Error('Survey not found');

      const next = {
        ...surveyToFormData(survey),
        // Template stays a draft. This copy is ready to publish and schedule.
        status: 'published',
      };

      // New copy — next Save/Create posts a new survey
      setActiveSurveyId(null);
      clearSurveyFormCache(surveyCacheScope({ isSprint, sprintDay, surveyId: null }));
      setFormData(next);
      savedSnapshotRef.current = snapshotForm(createEmptyFormData());
      setIsDirty(true);
      toast.success('Loaded saved survey into the form');
    } catch (err) {
      console.error('Failed to load saved survey', err);
      toast.error(err.response?.data?.message || 'Failed to load saved survey');
    } finally {
      setLoadingSavedId(null);
    }
  }, [isSprint, routeSurveyId, sprintDay]);

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
      const questions = buildSurveyQuestions(current.questions);

      if (isSprint) {
        const sprintPayload = {
          daySlot: sprintDay,
          title: trimmedTitle,
          hiddenName: String(current.hiddenName || '').trim(),
          description: trimmedDesc,
          status,
          credits: Number(current.credits),
          estimatedMinutes: minutes,
          questions,
          hasLogic: formHasLogic(current),
        };
        let savedId = surveyId;
        if (surveyId) {
          await fifteenDaySurveyAPI.update(surveyId, sprintPayload, { skipErrorToast: silent });
          if (!silent) {
            toast.success(asDraft ? '15-day survey saved' : (routeSurveyId ? '15-day survey updated' : '15-day survey created'));
          }
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

      const collectPublishDates = () => {
        const raw = needsWindow
          ? [
            current.publishedAt,
            ...((!routeSurveyId && !silent && Array.isArray(current.extraPublishedAts))
              ? current.extraPublishedAts
              : []),
          ]
          : [current.publishedAt || new Date().toISOString().slice(0, 16)];

        const seen = new Set();
        const dates = [];
        for (const value of raw) {
          if (value == null || value === '') continue;
          const when = new Date(value);
          if (Number.isNaN(when.getTime())) continue;
          const key = when.getTime();
          if (seen.has(key)) continue;
          seen.add(key);
          dates.push(when);
        }
        return dates.length ? dates : [new Date()];
      };

      const publishDates = collectPublishDates();
      const clusterSendAt = (() => {
        if (current.visibility !== 'targeted' || !current.clusterIds.length || !current.clusterSendAt) {
          return null;
        }
        const when = new Date(current.clusterSendAt);
        return Number.isNaN(when.getTime()) ? null : when.toISOString();
      })();

      const buildPayload = (publishedAt) => {
        const derivedEndDate = new Date(publishedAt);
        derivedEndDate.setDate(derivedEndDate.getDate() + availableDays);
        const isPoll = Boolean(current.isPoll);
        return {
          title: trimmedTitle,
          hiddenName: String(current.hiddenName || '').trim(),
          description: trimmedDesc,
          status,
          credits: Number(current.credits),
          estimatedMinutes: minutes,
          kind: isPoll ? 'normal' : (current.kind === 'daily' ? 'daily' : 'normal'),
          isPoll,
          startDate: publishedAt.toISOString(),
          endDate: needsWindow ? derivedEndDate.toISOString() : null,
          visibility: current.visibility,
          alsoPublishToOthers:
            current.visibility === 'targeted' ? Boolean(current.alsoPublishToOthers) : false,
          validityDays: Number(current.validityDays) || 7,
          clusterIds: current.visibility === 'targeted' ? current.clusterIds : [],
          clusterSendAt,
          questions,
          hasLogic: isPoll ? false : formHasLogic(current),
        };
      };

      let sends = [];
      let savedId = surveyId;
      let createdCount = 0;
      const failedDates = [];

      for (let i = 0; i < publishDates.length; i += 1) {
        const payload = buildPayload(publishDates[i]);
        const reuseExisting = i === 0 && surveyId;
        try {
          if (reuseExisting) {
            const res = await sepSurveyAPI.update(surveyId, payload, { skipErrorToast: silent });
            sends = sends.concat(res.data?.sends || []);
            savedId = surveyId;
            createdCount += 1;
          } else {
            const res = await sepSurveyAPI.create(payload, { skipErrorToast: silent });
            sends = sends.concat(res.data?.sends || []);
            const newId = res.data?.data?._id || null;
            if (i === 0 && newId) {
              savedId = newId;
              setActiveSurveyId(String(newId));
            }
            if (newId) createdCount += 1;
          }
        } catch (dateErr) {
          if (i === 0 && publishDates.length === 1) throw dateErr;
          failedDates.push(publishDates[i].toLocaleString());
          if (i === 0) throw dateErr;
        }
      }

      if (!silent) {
        if (createdCount > 1) {
          toast.success(
            asDraft
              ? `Saved ${createdCount} surveys`
              : `Created ${createdCount} surveys for the selected dates`
          );
        } else {
          toast.success(
            asDraft
              ? 'Survey saved'
              : (routeSurveyId ? 'Survey updated successfully!' : 'Standalone survey created successfully!')
          );
        }
        if (failedDates.length) {
          toast.error(
            `Could not create survey for ${failedDates.length} date${failedDates.length === 1 ? '' : 's'}: ${failedDates.join('; ')}`
          );
        }

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
  }, [isSprint, sprintDay, navigate, markClean, cacheScope, routeSurveyId]);

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

  const ensurePollQuestion = (question) => ({
    ...question,
    questionType: 'single_checkbox',
    options: normalizeOptions(
      (question.options || []).length
        ? question.options
        : EMPTY_POLL_QUESTION.options
    ),
    rows: [],
    maxSelections: 1,
    attentionCheck: false,
    attentionAnswer: '',
    show_if: null,
    end_after_if: null,
    metricTag: 'none',
  });

  const handleInputChange = (field, value) => {
    if (field === 'isPoll') {
      const enabled = Boolean(value);
      setFormData((prev) => {
        if (!enabled) return { ...prev, isPoll: false };
        const first = prev.questions[0] || { ...EMPTY_POLL_QUESTION };
        return {
          ...prev,
          isPoll: true,
          questions: [ensurePollQuestion(first)],
        };
      });
      return;
    }
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
    if (formData.isPoll && field === 'questionType' && value !== 'single_checkbox') {
      toast.error('Poll questions must be single choice');
      return;
    }
    const updated = [...formData.questions];
    const previousType = updated[index].questionType;
    updated[index][field] = value;

    if (field === 'questionType') {
      if (value === 'single_checkbox' || value === 'multiple_checkbox' || value === 'attention_check') {
        updated[index].options = updated[index].options.length
          ? normalizeOptions(updated[index].options)
          : normalizeOptions(['Option 1', 'Option 2']);
        updated[index].rows = [];
        updated[index].maxSelections = value === 'multiple_checkbox' ? 2 : 1;
      } else if (value === 'likert') {
        if (previousType !== 'likert') {
          updated[index].options = normalizeOptions(['1', '2', '3', '4', '5']);
          updated[index].rows = [];
          updated[index].maxSelections = 1;
        }
      } else if (value === 'matrix_radio') {
        updated[index].options = updated[index].options?.length
          ? normalizeOptions(updated[index].options)
          : normalizeOptions([...SATISFACTION_SCALE]);
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
      // Drop show rules that become invalid for attention / first question handled at validate time
      if (value === 'attention_check') updated[index].show_if = null;
    }

    setFormData((prev) => ({ ...prev, questions: updated }));
  };

  const handleOptionChange = (qIndex, optIndex, value) => {
    const updated = [...formData.questions];
    const previous = updated[qIndex].options[optIndex];
    const previousLabel = optionLabel(previous);
    updated[qIndex].options[optIndex] = asOptionObject(value, previous);
    if (updated[qIndex].attentionAnswer === previousLabel) {
      updated[qIndex].attentionAnswer = optionLabel(updated[qIndex].options[optIndex]);
    }
    setFormData((prev) => ({ ...prev, questions: updated }));
  };

  const addOption = (qIndex) => {
    const updated = [...formData.questions];
    const next = updated[qIndex].options.length + 1;
    const label = updated[qIndex].questionType === 'likert' ? String(next) : `Option ${next}`;
    updated[qIndex].options.push(asOptionObject(label));
    setFormData((prev) => ({ ...prev, questions: updated }));
  };

  const removeOption = (qIndex, optIndex) => {
    const updated = [...formData.questions];
    if (updated[qIndex].options.length > 1) {
      const removed = updated[qIndex].options[optIndex];
      updated[qIndex].options.splice(optIndex, 1);
      if (updated[qIndex].attentionAnswer === optionLabel(removed)) {
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
    updated[qIndex].options = normalizeOptions([...SATISFACTION_SCALE]);
    setFormData((prev) => ({ ...prev, questions: updated }));
  };

  const addQuestion = () => {
    if (formData.isPoll) {
      toast.error('A poll can only have one question');
      return;
    }
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
          show_if: null,
          end_after_if: null,
        },
      ],
    }));
  };

  const removeQuestion = (index) => {
    if (formData.isPoll) {
      toast.error('A poll can only have one question');
      return;
    }
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

  const hasLogic = formHasLogic(formData);
  const logicTextOnlyLocked = Boolean(
    isEditMode
    && formData.status === 'published'
    && hasLogic
  );
  const logicRewardSummary = hasLogic
    ? {
      early: computeLogicCredits(formData.credits, 1, formData.questions.length),
      full: Number(formData.credits) || 0,
    }
    : null;

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
    savedDrafts,
    savedDraftsLoading,
    loadingSavedId,
    applySavedSurvey,
    canLoadSavedSurvey: !isSprint && !routeSurveyId,
    questionTypes,
    metricTagOptions,
    statusOptions,
    visibilityOptions,
    kindOptions,
    hasLogic,
    logicTextOnlyLocked,
    logicRewardSummary,
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
