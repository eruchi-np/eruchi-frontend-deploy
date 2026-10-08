// Create or edit a standalone survey. Settings, questions, and publish.

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { sepSurveyAPI, fifteenDaySurveyAPI, clusterAPI } from '../../../services/api';
import { ArrowLeft, Save, Type, FileText, CheckSquare, ListOrdered, Loader2, Sliders, Users, Target, Table2, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';
import { plainSurveyText, sanitizeSurveyMarkup } from '../../../utils/surveyMarkup';
import SurveySettings from './SurveySettings.jsx';
import SurveyQuestions from './SurveyQuestions.jsx';

export const SATISFACTION_SCALE = [
  'Completely satisfied',
  'Very satisfied',
  'Moderately satisfied',
  'Slightly satisfied',
  'Not at all satisfied',
  'Not applicable',
];

const DEFAULT_MATRIX_ROWS = ['Sales process', 'Onboarding', 'Product support'];

const moveItem = (list, from, to) => {
  if (to < 0 || to >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
};

const CreateSepSurvey = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [clusters, setClusters] = useState([]);
  const [clustersLoading, setClustersLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'published',
    credits: 50,
    kind: 'normal',
    publishedAt: new Date().toISOString().slice(0, 16),
    availableDays: 7,
    estimatedMinutes: '',
    visibility: 'public',
    validityDays: 7,
    alsoPublishToOthers: false,
    clusterSendAt: new Date().toISOString().slice(0, 16),
    clusterIds: [],
    questions: [
      {
        questionText: '',
        questionType: 'text_short',
        options: [],
        rows: [],
        maxSelections: 1,
        minValue: 0,
        maxValue: 5,
        isRequired: true,
        metricTag: 'none',
        attentionCheck: false,
        attentionAnswer: ''
      }
    ]
  });

  const params = useParams();
  const [searchParams] = useSearchParams();
  const surveyId = params.surveyId || params.id;
  const isSprint = searchParams.get('sprint') === '1';
  const sprintDay = Number(searchParams.get('day'));
  const isEditMode = Boolean(surveyId);
  const [initialLoading, setInitialLoading] = useState(isEditMode);
  const backTo = isSprint ? '/admin/15-day-survey' : '/admin';

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
    if (!isEditMode) return;

    const fetchSurvey = async () => {
      try {
        const res = isSprint
          ? await fifteenDaySurveyAPI.getById(surveyId, { skipErrorToast: true })
          : await sepSurveyAPI.getById(surveyId, {
              params: { manage: 1 },
              skipErrorToast: true,
            });
        const survey = res.data.data;

        const startDate = survey.startDate ? new Date(survey.startDate) : new Date();
        const endDate = survey.endDate ? new Date(survey.endDate) : null;
        const availableDays = endDate
          ? Math.max(1, Math.round((endDate - startDate) / (1000 * 60 * 60 * 24)))
          : 7;

        setFormData({
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
          questions: survey.questions?.length ? survey.questions.map((q) => ({
            ...q,
            options: Array.isArray(q.options) ? q.options : [],
            rows: Array.isArray(q.rows) ? q.rows : [],
            metricTag: q.metricTag === 'cep' || q.metricTag === 'nps' ? q.metricTag : 'none'
          })) : [
            { questionText: '', questionType: 'text_short', options: [], rows: [], maxSelections: 1, minValue: 0, maxValue: 5, isRequired: true, metricTag: 'none', attentionCheck: false, attentionAnswer: '' }
          ]
        });
      } catch (err) {
        console.error('Failed to load survey for editing', err);
        toast.error('Failed to load survey');
        navigate(isSprint ? '/admin/15-day-survey' : '/admin');
      } finally {
        setInitialLoading(false);
      }
    };

    fetchSurvey();
  }, [isEditMode, isSprint, surveyId, navigate]);

  const questionTypes = [
    { value: 'text_short', label: 'Short Text', icon: Type, description: 'Brief text response' },
    { value: 'text_long', label: 'Long Text', icon: FileText, description: 'Detailed paragraph' },
    { value: 'single_checkbox', label: 'Single Choice', icon: CheckSquare, description: 'Pick one option' },
    { value: 'attention_check', label: 'Attention Check', icon: ShieldAlert, description: 'Pick one, with a correct answer' },
    { value: 'likert', label: 'Likert Scale', icon: ListOrdered, description: 'Pick one on a scale' },
    { value: 'multiple_checkbox', label: 'Multiple Choice', icon: CheckSquare, description: 'Pick multiple' },
    { value: 'slider', label: 'Slider', icon: Sliders, description: 'Range selection' },
    { value: 'matrix_radio', label: 'Matrix', icon: Table2, description: 'One choice per row' }
  ];

  const metricTagOptions = [
    { value: 'none', label: 'None', description: 'Normal question' },
    { value: 'cep', label: 'CEP', description: 'Category entry point' },
    { value: 'nps', label: 'NPS', description: 'Net promoter score' }
  ];

  const statusOptions = [
    { value: 'draft', label: 'Draft', color: 'bg-gray-100 text-gray-700 border-gray-200' },
    { value: 'published', label: 'Published', color: 'bg-green-100 text-green-700 border-green-200' },
    { value: 'archived', label: 'Archived', color: 'bg-orange-100 text-orange-700 border-orange-200' }
  ];

  const visibilityOptions = [
    {
      value: 'public',
      label: 'Public',
      icon: Users,
      description: 'Shows up for every eligible user in the general survey list'
    },
    {
      value: 'targeted',
      label: 'Targeted',
      icon: Target,
      description: 'Sent to selected clusters (and/or merchant feedback). Hidden from others unless you enable dual publish.'
    }
  ];

  const kindOptions = [
    {
      value: 'normal',
      label: 'Normal survey',
      description: 'Full survey — awards credits and counts toward streak'
    },
    {
      value: 'daily',
      label: 'Daily survey',
      description: 'Shorter bonus survey — awards credits only, no streak'
    }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleCluster = (clusterId) => {
    setFormData((prev) => {
      const id = String(clusterId);
      const has = prev.clusterIds.includes(id);
      return {
        ...prev,
        clusterIds: has
          ? prev.clusterIds.filter((c) => c !== id)
          : [...prev.clusterIds, id]
      };
    });
  };

  const needsPublicWindow =
    !isSprint && (
      formData.visibility === 'public' ||
      (formData.visibility === 'targeted' && formData.alsoPublishToOthers)
    );

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

    setFormData(prev => ({ ...prev, questions: updated }));
  };

  const handleOptionChange = (qIndex, optIndex, value) => {
    const updated = [...formData.questions];
    const previous = updated[qIndex].options[optIndex];
    updated[qIndex].options[optIndex] = value;
    if (updated[qIndex].attentionAnswer === previous) {
      updated[qIndex].attentionAnswer = value;
    }
    setFormData(prev => ({ ...prev, questions: updated }));
  };

  const addOption = (qIndex) => {
    const updated = [...formData.questions];
    const next = updated[qIndex].options.length + 1;
    const label = updated[qIndex].questionType === 'likert' ? String(next) : `Option ${next}`;
    updated[qIndex].options.push(label);
    setFormData(prev => ({ ...prev, questions: updated }));
  };

  const removeOption = (qIndex, optIndex) => {
    const updated = [...formData.questions];
    if (updated[qIndex].options.length > 1) {
      const removed = updated[qIndex].options[optIndex];
      updated[qIndex].options.splice(optIndex, 1);
      if (updated[qIndex].attentionAnswer === removed) {
        updated[qIndex].attentionAnswer = '';
      }
      setFormData(prev => ({ ...prev, questions: updated }));
    }
  };

  const handleRowChange = (qIndex, rowIndex, value) => {
    const updated = [...formData.questions];
    if (!Array.isArray(updated[qIndex].rows)) updated[qIndex].rows = [];
    updated[qIndex].rows[rowIndex] = value;
    setFormData(prev => ({ ...prev, questions: updated }));
  };

  const addRow = (qIndex) => {
    const updated = [...formData.questions];
    if (!Array.isArray(updated[qIndex].rows)) updated[qIndex].rows = [];
    updated[qIndex].rows.push(`Aspect ${updated[qIndex].rows.length + 1}`);
    setFormData(prev => ({ ...prev, questions: updated }));
  };

  const removeRow = (qIndex, rowIndex) => {
    const updated = [...formData.questions];
    if ((updated[qIndex].rows || []).length > 1) {
      updated[qIndex].rows.splice(rowIndex, 1);
      setFormData(prev => ({ ...prev, questions: updated }));
    }
  };

  const moveRow = (qIndex, from, to) => {
    const updated = [...formData.questions];
    updated[qIndex].rows = moveItem(updated[qIndex].rows || [], from, to);
    setFormData(prev => ({ ...prev, questions: updated }));
  };

  const moveOption = (qIndex, from, to) => {
    const updated = [...formData.questions];
    updated[qIndex].options = moveItem(updated[qIndex].options || [], from, to);
    setFormData(prev => ({ ...prev, questions: updated }));
  };

  const applySatisfactionScale = (qIndex) => {
    const updated = [...formData.questions];
    updated[qIndex].options = [...SATISFACTION_SCALE];
    setFormData(prev => ({ ...prev, questions: updated }));
  };

  const addQuestion = () => {
    setFormData(prev => ({
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
          metricTag: 'none'
        }
      ]
    }));
  };

  const removeQuestion = (index) => {
    if (formData.questions.length > 1) {
      const updated = formData.questions.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, questions: updated }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const trimmedTitle = formData.title.trim();
    const trimmedDesc = formData.description.trim();

    if (!trimmedTitle) return toast.error('Survey title is required');
    if (!trimmedDesc) return toast.error('Description is required');

    if (isSprint && (!Number.isInteger(sprintDay) || sprintDay < 1 || sprintDay > 15)) {
      return toast.error('Pick a day from 1 to 15');
    }

    if (!isSprint && needsPublicWindow) {
      if (!formData.publishedAt) return toast.error('Published date is required');
      if (!formData.availableDays || Number(formData.availableDays) < 1) {
        return toast.error('Available days must be at least 1');
      }
    }

    if (formData.estimatedMinutes !== '' && formData.estimatedMinutes != null) {
      const minutes = Number(formData.estimatedMinutes);
      if (!Number.isFinite(minutes) || minutes < 1) {
        return toast.error('Estimated time must be at least 1 minute');
      }
    }

    if (!Number.isFinite(Number(formData.credits)) || Number(formData.credits) < 0) {
      return toast.error('Credits must be zero or more');
    }

    if (!isSprint && formData.visibility === 'targeted' && (!formData.validityDays || Number(formData.validityDays) < 1)) {
      return toast.error('Validity days must be at least 1');
    }

    if (
      !isSprint &&
      formData.visibility === 'targeted' &&
      formData.status === 'published' &&
      formData.clusterIds.length > 0 &&
      !formData.clusterSendAt
    ) {
      return toast.error('Cluster send date/time is required');
    }

    const questionTexts = formData.questions.map((q) => plainSurveyText(q.questionText));
    if (questionTexts.some((text) => !text)) return toast.error('All questions must have text');
    if (questionTexts.some((text) => text.length > 200)) {
      return toast.error('Question text must be 200 characters or less');
    }
    if (new Set(questionTexts).size !== questionTexts.length) {
      return toast.error('Each question needs its own wording');
    }

    const invalidCheckboxes = formData.questions.filter(q =>
      (q.questionType === 'single_checkbox' || q.questionType === 'multiple_checkbox' || q.questionType === 'attention_check') &&
      !(q.options || []).map((option) => option.trim()).filter(Boolean).length
    );
    if (invalidCheckboxes.length) return toast.error('Checkbox questions need at least one option');

    const blankLikert = formData.questions.some((q) =>
      q.questionType === 'likert' &&
      (!(q.options || []).length || (q.options || []).some((option) => !String(option).trim()))
    );
    if (blankLikert) return toast.error('Each Likert option needs text');

    const invalidMatrices = formData.questions.filter(q =>
      q.questionType === 'matrix_radio' &&
      (!(q.rows || []).map(r => r.trim()).filter(Boolean).length ||
        !(q.options || []).map(o => o.trim()).filter(Boolean).length)
    );
    if (invalidMatrices.length) {
      return toast.error('Matrix questions need at least one row and one column option');
    }

    const duplicateLabels = formData.questions.some((q) => {
      if (!['single_checkbox', 'multiple_checkbox', 'attention_check', 'likert', 'matrix_radio'].includes(q.questionType)) return false;
      const options = (q.options || []).map((option) => option.trim()).filter(Boolean);
      if (new Set(options).size !== options.length) return true;
      if (q.questionType !== 'matrix_radio') return false;
      const rows = (q.rows || []).map((row) => row.trim()).filter(Boolean);
      return new Set(rows).size !== rows.length;
    });
    if (duplicateLabels) return toast.error('Options and matrix rows must be unique');

    const invalidSliders = formData.questions.filter((q) => {
      if (q.questionType !== 'slider') return false;
      const min = Number(q.minValue);
      const max = Number(q.maxValue);
      return !Number.isFinite(min) || !Number.isFinite(max) || max <= min;
    });
    if (invalidSliders.length) return toast.error('Slider max must be greater than min');

    const badAttention = formData.questions.some((q) => {
      const marked = q.questionType === 'attention_check' || (q.questionType === 'single_checkbox' && q.attentionCheck);
      if (!marked) return false;
      const options = (q.options || []).map((option) => option.trim()).filter(Boolean);
      return !options.includes(String(q.attentionAnswer || '').trim());
    });
    if (badAttention) return toast.error('An attention check needs its correct option');

    setLoading(true);

    try {
      const availableDays = Number(formData.availableDays) || 7;
      const publishedAt = formData.publishedAt
        ? new Date(formData.publishedAt)
        : new Date();
      const derivedEndDate = new Date(publishedAt);
      derivedEndDate.setDate(derivedEndDate.getDate() + availableDays);

      const questions = formData.questions.map(q => {
          const base = {
            questionText: sanitizeSurveyMarkup(q.questionText),
            questionType: q.questionType,
            isRequired: q.isRequired !== false,
            metricTag: q.metricTag === 'cep' || q.metricTag === 'nps' ? q.metricTag : 'none'
          };
          if (['single_checkbox', 'multiple_checkbox', 'attention_check'].includes(q.questionType)) {
            base.options = q.options.map(o => o.trim()).filter(Boolean);
            base.maxSelections = q.questionType === 'multiple_checkbox' ? q.maxSelections : 1;
          }
          if (q.questionType === 'attention_check') {
            base.attentionCheck = true;
            base.attentionAnswer = String(q.attentionAnswer || '').trim();
          }
          if (q.questionType === 'likert') {
            base.options = q.options.map(o => o.trim());
            base.maxSelections = 1;
          }
          if (q.questionType === 'single_checkbox' && q.attentionCheck) {
            base.attentionCheck = true;
            base.attentionAnswer = String(q.attentionAnswer || '').trim();
          }
          if (q.questionType === 'matrix_radio') {
            base.options = (q.options || []).map(o => o.trim()).filter(Boolean);
            base.rows = (q.rows || []).map(r => r.trim()).filter(Boolean);
            base.maxSelections = 1;
          }
          if (q.questionType === 'slider') {
            base.minValue = Number(q.minValue);
            base.maxValue = Number(q.maxValue);
          }
          return base;
        });

      if (isSprint) {
        const sprintPayload = {
          daySlot: sprintDay,
          title: trimmedTitle,
          description: trimmedDesc,
          status: formData.status,
          credits: Number(formData.credits),
          questions
        };
        if (formData.estimatedMinutes !== '' && formData.estimatedMinutes != null) {
          sprintPayload.estimatedMinutes = Number(formData.estimatedMinutes);
        }
        if (isEditMode) {
          await fifteenDaySurveyAPI.update(surveyId, sprintPayload);
          toast.success('15-day survey updated');
        } else {
          await fifteenDaySurveyAPI.create(sprintPayload);
          toast.success('15-day survey saved');
        }
        navigate('/admin/15-day-survey');
        return;
      }

      const payload = {
        title: trimmedTitle,
        description: trimmedDesc,
        status: formData.status,
        credits: Number(formData.credits),
        kind: formData.kind === 'daily' ? 'daily' : 'normal',
        startDate: publishedAt.toISOString(),
        endDate: needsPublicWindow ? derivedEndDate.toISOString() : null,
        visibility: formData.visibility,
        alsoPublishToOthers:
          formData.visibility === 'targeted' ? Boolean(formData.alsoPublishToOthers) : false,
        validityDays: Number(formData.validityDays) || 7,
        clusterIds:
          formData.visibility === 'targeted' && formData.status === 'published'
            ? formData.clusterIds
            : [],
        clusterSendAt:
          formData.visibility === 'targeted' &&
          formData.status === 'published' &&
          formData.clusterIds.length > 0
            ? new Date(formData.clusterSendAt).toISOString()
            : undefined,
        questions
      };
      if (formData.estimatedMinutes !== '' && formData.estimatedMinutes != null) {
        payload.estimatedMinutes = Number(formData.estimatedMinutes);
      }

      let sends = [];
      if (isEditMode) {
        const res = await sepSurveyAPI.update(surveyId, payload);
        sends = res.data?.sends || [];
        toast.success('Survey updated successfully!');
      } else {
        const res = await sepSurveyAPI.create(payload);
        sends = res.data?.sends || [];
        toast.success('Standalone survey created successfully!');
      }

      const failedSends = sends.filter((s) => !s.ok);
      const okSends = sends.filter((s) => s.ok);
      if (okSends.length) {
        const firstWhen = okSends.find((s) => s.scheduledFor)?.scheduledFor;
        const scheduledDate = firstWhen ? new Date(firstWhen) : null;
        const future =
          scheduledDate && !Number.isNaN(scheduledDate.getTime()) && scheduledDate.getTime() > Date.now();
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

      navigate('/admin');
    } catch (err) {
      console.error('Create sep survey error:', err);
      const data = err.response?.data;
      const detail =
        Array.isArray(data?.errors) && data.errors.length
          ? data.errors.join('. ')
          : null;
      const msg =
        detail ||
        data?.message ||
        (isEditMode ? 'Failed to update survey' : 'Failed to create survey');
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const getMinPublishedDate = () => new Date().toISOString().slice(0, 16);

  const getQuestionTypeData = (type) => questionTypes.find(qt => qt.value === type);

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <button
              type="button"
              onClick={() => navigate(backTo)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors shrink-0"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                {isSprint
                  ? `${isEditMode ? 'Edit' : 'Create'} 15-day survey · Day ${sprintDay}`
                  : (isEditMode ? 'Edit Standalone Survey' : 'Create Standalone Survey')}
              </h1>
              <p className="text-sm text-gray-500">
                {isSprint
                  ? 'This preset stays on Daily Sprint until the user finishes it'
                  : (isEditMode ? 'Admins and customer admins can edit questions, rows, and scale labels any time' : 'Independent survey (not tied to a campaign)')}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-28">
        <form onSubmit={handleSubmit} className="space-y-6">
          <SurveySettings
            clusters={clusters}
            clustersLoading={clustersLoading}
            formData={formData}
            getMinPublishedDate={getMinPublishedDate}
            handleInputChange={handleInputChange}
            isSprint={isSprint}
            kindOptions={kindOptions}
            needsPublicWindow={needsPublicWindow}
            statusOptions={statusOptions}
            toggleCluster={toggleCluster}
            visibilityOptions={visibilityOptions}
          />

          <SurveyQuestions
            addOption={addOption}
            addQuestion={addQuestion}
            addRow={addRow}
            applySatisfactionScale={applySatisfactionScale}
            formData={formData}
            getQuestionTypeData={getQuestionTypeData}
            handleOptionChange={handleOptionChange}
            handleQuestionChange={handleQuestionChange}
            handleRowChange={handleRowChange}
            metricTagOptions={metricTagOptions}
            moveOption={moveOption}
            moveRow={moveRow}
            questionTypes={questionTypes}
            removeOption={removeOption}
            removeQuestion={removeQuestion}
            removeRow={removeRow}
          />

          {/* Submit Bar */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 sticky bottom-16 md:bottom-0 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Ready to Publish?
                </h3>
                <p className="text-sm text-gray-600">
                  Survey with {formData.questions.length} question{formData.questions.length !== 1 ? 's' : ''}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => navigate(backTo)}
                  className="px-8 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center justify-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      {isEditMode ? 'Saving...' : 'Creating...'}
                    </>
                  ) : (
                    <>
                      <Save className="h-5 w-5" />
                      {isEditMode ? 'Save Changes' : 'Create Survey'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateSepSurvey;