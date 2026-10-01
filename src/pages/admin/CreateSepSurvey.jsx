// src/pages/admin/CreateSepSurvey.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { sepSurveyAPI, fifteenDaySurveyAPI, clusterAPI } from '../../services/api';
import { ArrowLeft, Plus, Trash2, Save, Type, FileText, CheckSquare, Loader2, Sliders, AlertCircle, Eye, Settings as SettingsIcon, Clock, Calendar, Award, Users, Target, Table2, ChevronUp, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import MatrixQuestion from '../../components/survey/MatrixQuestion';

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
        metricTag: 'none'
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
          : await sepSurveyAPI.getById(surveyId, { skipErrorToast: true });
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
            { questionText: '', questionType: 'text_short', options: [], rows: [], maxSelections: 1, minValue: 0, maxValue: 5, isRequired: true, metricTag: 'none' }
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
    updated[index][field] = value;

    if (field === 'questionType') {
      if (value === 'single_checkbox' || value === 'multiple_checkbox') {
        updated[index].options = updated[index].options.length ? updated[index].options : ['Option 1', 'Option 2'];
        updated[index].rows = [];
        updated[index].maxSelections = value === 'single_checkbox' ? 1 : 2;
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
    }

    setFormData(prev => ({ ...prev, questions: updated }));
  };

  const handleOptionChange = (qIndex, optIndex, value) => {
    const updated = [...formData.questions];
    updated[qIndex].options[optIndex] = value;
    setFormData(prev => ({ ...prev, questions: updated }));
  };

  const addOption = (qIndex) => {
    const updated = [...formData.questions];
    updated[qIndex].options.push(`Option ${updated[qIndex].options.length + 1}`);
    setFormData(prev => ({ ...prev, questions: updated }));
  };

  const removeOption = (qIndex, optIndex) => {
    const updated = [...formData.questions];
    if (updated[qIndex].options.length > 1) {
      updated[qIndex].options.splice(optIndex, 1);
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

    if (formData.estimatedMinutes !== '' && Number(formData.estimatedMinutes) < 1) {
      return toast.error('Estimated time must be at least 1 minute');
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

    const emptyQuestions = formData.questions.filter(q => !q.questionText.trim());
    if (emptyQuestions.length) return toast.error('All questions must have text');

    const invalidCheckboxes = formData.questions.filter(q =>
      (q.questionType === 'single_checkbox' || q.questionType === 'multiple_checkbox') &&
      (!q.options || q.options.length === 0)
    );
    if (invalidCheckboxes.length) return toast.error('Checkbox questions need at least one option');

    const invalidMatrices = formData.questions.filter(q =>
      q.questionType === 'matrix_radio' &&
      (!(q.rows || []).map(r => r.trim()).filter(Boolean).length ||
        !(q.options || []).map(o => o.trim()).filter(Boolean).length)
    );
    if (invalidMatrices.length) {
      return toast.error('Matrix questions need at least one row and one column option');
    }

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
            questionText: q.questionText.trim(),
            questionType: q.questionType,
            isRequired: q.isRequired !== false,
            metricTag: q.metricTag === 'cep' || q.metricTag === 'nps' ? q.metricTag : 'none'
          };
          if (['single_checkbox', 'multiple_checkbox'].includes(q.questionType)) {
            base.options = q.options.map(o => o.trim()).filter(Boolean);
            base.maxSelections = q.maxSelections;
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
          {/* Basic Info */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-indigo-50 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">Survey Information</h2>
              <p className="text-sm text-gray-600 mt-0.5">Title, description and visibility</p>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Survey Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={e => handleInputChange('title', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g., Customer Feedback – January 2026"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={e => handleInputChange('description', e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  placeholder="Explain the purpose of this survey..."
                  required
                />
              </div>

              {!isSprint && (
              <>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Survey type
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {kindOptions.map((opt) => {
                    const selected = formData.kind === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => handleInputChange('kind', opt.value)}
                        className={`text-left p-4 rounded-xl border-2 transition-all ${
                          selected
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                        }`}
                      >
                        <p className={`font-semibold text-sm ${selected ? 'text-indigo-900' : 'text-gray-900'}`}>
                          {opt.label}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">{opt.description}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Visibility selector */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Visibility
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {visibilityOptions.map(opt => {
                    const Icon = opt.icon;
                    const isActive = formData.visibility === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => handleInputChange('visibility', opt.value)}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${
                          isActive
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <Icon className={`h-4 w-4 ${isActive ? 'text-indigo-600' : 'text-gray-500'}`} />
                          <span className={`text-sm font-semibold ${isActive ? 'text-indigo-700' : 'text-gray-900'}`}>
                            {opt.label}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 leading-snug">{opt.description}</p>
                      </button>
                    );
                  })}
                </div>
                {formData.visibility === 'targeted' && (
                  <p className="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 flex items-start gap-1.5">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                    Targeted surveys stay hidden from the public list unless you enable &quot;Also publish to other users&quot;.
                    Select clusters below to send now, or send later from Cluster Management / voucher feedback triggers.
                  </p>
                )}
              </div>

              {formData.visibility === 'targeted' && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Validity After Being Sent (days) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.validityDays}
                      onChange={e => handleInputChange('validityDays', Number(e.target.value))}
                      className="w-full max-w-[200px] px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1.5">
                      For cluster / merchant-assigned users, the timer starts when the survey email is sent.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Send to clusters
                    </label>
                    <p className="text-xs text-gray-500 mb-3">
                      Select one or more clusters. If status is Published, membership is snapshotted and emails are queued at the send time below.
                    </p>
                    {clustersLoading ? (
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Loader2 className="h-4 w-4 animate-spin" /> Loading clusters…
                      </div>
                    ) : clusters.length === 0 ? (
                      <p className="text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                        No clusters yet. Create one under Clusters, or leave this empty and send later.
                      </p>
                    ) : (
                      <div className="max-h-56 overflow-y-auto border border-gray-200 rounded-xl divide-y divide-gray-100">
                        {clusters.map((c) => {
                          const id = String(c._id);
                          const checked = formData.clusterIds.includes(id);
                          return (
                            <label
                              key={id}
                              className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 ${
                                checked ? 'bg-indigo-50/60' : 'bg-white'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleCluster(id)}
                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                              />
                              <span className="flex-1 min-w-0">
                                <span className="block text-sm font-medium text-gray-900 truncate">{c.name}</span>
                                <span className="block text-xs text-gray-500">
                                  {c.memberCount ?? 0} member{(c.memberCount ?? 0) === 1 ? '' : 's'}
                                </span>
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                    {formData.clusterIds.length > 0 && (
                      <div className="mt-4">
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                          Send to clusters on <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="datetime-local"
                          value={formData.clusterSendAt}
                          onChange={(e) => handleInputChange('clusterSendAt', e.target.value)}
                          min={getMinPublishedDate()}
                          className="w-full max-w-md px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          required
                        />
                        <p className="text-xs text-gray-500 mt-1.5">
                          Membership is snapshotted and emails go out at this time (same as now if you leave it as the current time).
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="rounded-xl border border-gray-200 p-4">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.alsoPublishToOthers}
                        onChange={(e) => handleInputChange('alsoPublishToOthers', e.target.checked)}
                        className="mt-1 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>
                        <span className="block text-sm font-semibold text-gray-900">
                          Also publish to other users
                        </span>
                        <span className="block text-xs text-gray-500 mt-0.5">
                          Non-cluster users can take this survey after a separate publish date (same survey, different schedule).
                        </span>
                      </span>
                    </label>
                  </div>
                </>
              )}
              </>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={e => handleInputChange('status', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {statusOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Credits to Award <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.credits}
                    onChange={e => handleInputChange('credits', Number(e.target.value))}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              {needsPublicWindow && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      {formData.visibility === 'targeted'
                        ? 'Publish to other users on'
                        : 'Published Date'}{' '}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.publishedAt}
                      onChange={e => handleInputChange('publishedAt', e.target.value)}
                      min={getMinPublishedDate()}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Available for (in days) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.availableDays}
                      onChange={e => handleInputChange('availableDays', Number(e.target.value))}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="e.g., 7, 14, 30"
                      required
                    />
                    {formData.visibility === 'targeted' && (
                      <p className="text-xs text-gray-500 mt-1.5">
                        Only applies to non-targeted users. Cluster members still use validity days from send time.
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2 flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-gray-500" />
                  Estimated Time to Complete (minutes)
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.estimatedMinutes}
                  onChange={e => handleInputChange('estimatedMinutes', e.target.value)}
                  className="w-full max-w-[200px] px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g., 3"
                />
                <p className="text-xs text-gray-500 mt-1.5">
                  Shown to users on the survey card (e.g. "~3 min") so they know what they're signing up for.
                  Leave blank if unsure.
                </p>
              </div>
            </div>
          </div>

          {/* Questions Builder */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-green-50 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Survey Questions</h2>
                <p className="text-sm text-gray-600">{formData.questions.length} question{formData.questions.length !== 1 ? 's' : ''}</p>
              </div>
              <button
                type="button"
                onClick={addQuestion}
                className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add Question
              </button>
            </div>

            <div className="p-6 space-y-6">
              {formData.questions.map((q, idx) => {
                const typeData = getQuestionTypeData(q.questionType);
                const Icon = typeData?.icon;

                return (
                  <div key={idx} className="border border-gray-200 rounded-xl overflow-hidden bg-white">
                    <div className="p-5 bg-gray-50 border-b border-gray-200 flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-4">
                          <span className="px-3 py-1 bg-white border border-gray-300 rounded-lg text-sm font-bold text-gray-700">
                            Q{idx + 1}
                          </span>
                          {Icon && (
                            <div className="flex items-center gap-2 px-3 py-1 bg-white border border-gray-300 rounded-lg">
                              <Icon className="h-4 w-4 text-gray-600" />
                              <span className="text-sm font-medium">{typeData.label}</span>
                            </div>
                          )}
                          {(q.metricTag === 'cep' || q.metricTag === 'nps') && (
                            <span
                              className={`px-3 py-1 rounded-lg text-xs font-bold border ${
                                q.metricTag === 'nps'
                                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                                  : 'bg-amber-50 border-amber-200 text-amber-700'
                              }`}
                            >
                              {q.metricTag.toUpperCase()}
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleQuestionChange(idx, 'isRequired', q.isRequired === false)}
                          className={`inline-flex items-center px-3 py-1 rounded-lg border text-xs font-semibold mb-4 transition-colors ${
                            q.isRequired === false
                              ? 'bg-gray-50 border-gray-200 text-gray-500'
                              : 'bg-red-50 border-red-200 text-red-700'
                          }`}
                        >
                          {q.isRequired === false ? 'Optional' : 'Required'}
                        </button>

                        <input
                          type="text"
                          value={q.questionText}
                          onChange={e => handleQuestionChange(idx, 'questionText', e.target.value)}
                          placeholder="Enter question text..."
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                          required
                        />
                      </div>

                      {formData.questions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeQuestion(idx)}
                          className="p-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      )}
                    </div>

                    <div className="p-6 space-y-6">
                      {/* Question Type Selector */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-3">
                          Question Type
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                          {questionTypes.map(t => {
                            const Icon = t.icon;
                            const isActive = q.questionType === t.value;
                            return (
                              <button
                                key={t.value}
                                type="button"
                                onClick={() => handleQuestionChange(idx, 'questionType', t.value)}
                                className={`p-4 rounded-xl border-2 transition-all text-center ${
                                  isActive
                                    ? 'border-green-500 bg-green-50'
                                    : 'border-gray-200 hover:border-gray-300 bg-white'
                                }`}
                              >
                                <Icon className={`h-6 w-6 mx-auto mb-2 ${isActive ? 'text-green-600' : 'text-gray-600'}`} />
                                <p className={`text-sm font-medium ${isActive ? 'text-green-700' : 'text-gray-900'}`}>
                                  {t.label}
                                </p>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Metric tag: None / CEP / NPS */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-3">
                          Metric tag
                        </label>
                        <p className="text-xs text-gray-500 mb-3">
                          Tag CEP or NPS questions for analytics collections. Leave as None for normal questions.
                        </p>
                        <div className="grid grid-cols-3 gap-3">
                          {metricTagOptions.map((opt) => {
                            const isActive = (q.metricTag || 'none') === opt.value;
                            return (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => handleQuestionChange(idx, 'metricTag', opt.value)}
                                className={`p-3 rounded-xl border-2 transition-all text-center ${
                                  isActive
                                    ? opt.value === 'nps'
                                      ? 'border-indigo-500 bg-indigo-50'
                                      : opt.value === 'cep'
                                        ? 'border-amber-500 bg-amber-50'
                                        : 'border-green-500 bg-green-50'
                                    : 'border-gray-200 hover:border-gray-300 bg-white'
                                }`}
                              >
                                <p className={`text-sm font-semibold ${
                                  isActive
                                    ? opt.value === 'nps'
                                      ? 'text-indigo-700'
                                      : opt.value === 'cep'
                                        ? 'text-amber-700'
                                        : 'text-green-700'
                                    : 'text-gray-900'
                                }`}>
                                  {opt.label}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">{opt.description}</p>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Options for checkbox questions */}
                      {(q.questionType === 'single_checkbox' || q.questionType === 'multiple_checkbox') && (
                        <div className="p-5 bg-green-50 rounded-xl border border-green-100">
                          <div className="flex justify-between items-center mb-4">
                            <label className="text-sm font-semibold text-gray-900">
                              Answer Options
                            </label>
                            <button
                              type="button"
                              onClick={() => addOption(idx)}
                              className="text-sm font-medium text-green-700 hover:text-green-800"
                            >
                              + Add Option
                            </button>
                          </div>

                          <div className="space-y-3">
                            {q.options.map((opt, optIdx) => (
                              <div key={optIdx} className="flex items-center gap-3">
                                <span className="text-sm font-medium text-gray-500 w-8">{optIdx + 1}.</span>
                                <input
                                  type="text"
                                  value={opt}
                                  onChange={e => handleOptionChange(idx, optIdx, e.target.value)}
                                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                  placeholder={`Option ${optIdx + 1}`}
                                />
                                {q.options.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => removeOption(idx, optIdx)}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                  >
                                    <Trash2 className="h-5 w-5" />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>

                          {q.questionType === 'multiple_checkbox' && (
                            <div className="mt-4 pt-4 border-t border-green-100">
                              <label className="block text-sm font-semibold text-gray-900 mb-2">
                                Max Selections Allowed
                              </label>
                              <input
                                type="number"
                                min="1"
                                max={q.options.length || 10}
                                value={q.maxSelections}
                                onChange={e => handleQuestionChange(idx, 'maxSelections', Number(e.target.value))}
                                className="w-24 px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                              />
                            </div>
                          )}
                        </div>
                      )}

                      {/* Matrix rows + column options */}
                      {q.questionType === 'matrix_radio' && (
                        <div className="space-y-4">
                          <p className="text-xs text-gray-500">
                            Edit every row label and every scale column (Completely satisfied, Not applicable, and the rest). Respondents see this grid as-is.
                          </p>
                          <div className="p-5 bg-sky-50 rounded-xl border border-sky-100">
                            <div className="flex justify-between items-center mb-4 gap-3">
                              <label className="text-sm font-semibold text-gray-900">
                                Row items (aspects)
                              </label>
                              <button
                                type="button"
                                onClick={() => addRow(idx)}
                                className="text-sm font-medium text-sky-700 hover:text-sky-800"
                              >
                                + Add Row
                              </button>
                            </div>
                            <div className="space-y-3">
                              {(q.rows || []).map((row, rowIdx) => (
                                <div key={rowIdx} className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-gray-500 w-8 shrink-0">{rowIdx + 1}.</span>
                                  <input
                                    type="text"
                                    value={row}
                                    onChange={e => handleRowChange(idx, rowIdx, e.target.value)}
                                    className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                                    placeholder={`Row ${rowIdx + 1}`}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => moveRow(idx, rowIdx, rowIdx - 1)}
                                    disabled={rowIdx === 0}
                                    className="p-2 text-gray-500 hover:bg-white rounded-lg disabled:opacity-30"
                                    aria-label="Move row up"
                                  >
                                    <ChevronUp className="h-4 w-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => moveRow(idx, rowIdx, rowIdx + 1)}
                                    disabled={rowIdx === (q.rows || []).length - 1}
                                    className="p-2 text-gray-500 hover:bg-white rounded-lg disabled:opacity-30"
                                    aria-label="Move row down"
                                  >
                                    <ChevronDown className="h-4 w-4" />
                                  </button>
                                  {(q.rows || []).length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => removeRow(idx, rowIdx)}
                                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                    >
                                      <Trash2 className="h-5 w-5" />
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="p-5 bg-green-50 rounded-xl border border-green-100">
                            <div className="flex justify-between items-center mb-2 gap-3 flex-wrap">
                              <label className="text-sm font-semibold text-gray-900">
                                Scale columns (shared across rows)
                              </label>
                              <div className="flex items-center gap-3">
                                <button
                                  type="button"
                                  onClick={() => applySatisfactionScale(idx)}
                                  className="text-sm font-medium text-green-800 hover:text-green-900"
                                >
                                  Use satisfaction scale
                                </button>
                                <button
                                  type="button"
                                  onClick={() => addOption(idx)}
                                  className="text-sm font-medium text-green-700 hover:text-green-800"
                                >
                                  + Add Column
                                </button>
                              </div>
                            </div>
                            <p className="text-xs text-gray-500 mb-4">
                              These are the radio labels across the top — e.g. Completely satisfied through Not applicable. Change any of them.
                            </p>
                            <div className="space-y-3">
                              {(q.options || []).map((opt, optIdx) => (
                                <div key={optIdx} className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-gray-500 w-8 shrink-0">{optIdx + 1}.</span>
                                  <input
                                    type="text"
                                    value={opt}
                                    onChange={e => handleOptionChange(idx, optIdx, e.target.value)}
                                    className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                    placeholder={`Column ${optIdx + 1}`}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => moveOption(idx, optIdx, optIdx - 1)}
                                    disabled={optIdx === 0}
                                    className="p-2 text-gray-500 hover:bg-white rounded-lg disabled:opacity-30"
                                    aria-label="Move column left"
                                  >
                                    <ChevronUp className="h-4 w-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => moveOption(idx, optIdx, optIdx + 1)}
                                    disabled={optIdx === (q.options || []).length - 1}
                                    className="p-2 text-gray-500 hover:bg-white rounded-lg disabled:opacity-30"
                                    aria-label="Move column right"
                                  >
                                    <ChevronDown className="h-4 w-4" />
                                  </button>
                                  {(q.options || []).length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => removeOption(idx, optIdx)}
                                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                    >
                                      <Trash2 className="h-5 w-5" />
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Slider Settings */}
                      {q.questionType === 'slider' && (
                        <div className="p-5 bg-purple-50 rounded-xl border border-purple-100">
                          <label className="block text-sm font-semibold text-gray-900 mb-4">
                            Slider Range Settings
                          </label>
                          <div className="grid grid-cols-2 gap-6">
                            <div>
                              <label className="block text-sm text-gray-700 mb-2">Minimum Value</label>
                              <input
                                type="number"
                                value={q.minValue}
                                onChange={e => handleQuestionChange(idx, 'minValue', Number(e.target.value))}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm text-gray-700 mb-2">Maximum Value</label>
                              <input
                                type="number"
                                value={q.maxValue}
                                onChange={e => handleQuestionChange(idx, 'maxValue', Number(e.target.value))}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Live Preview */}
                      <div className="p-5 bg-gray-50 rounded-xl border border-gray-200">
                        <div className="flex items-center gap-3 mb-4">
                          <Eye className="h-5 w-5 text-gray-600" />
                          <span className="text-sm font-semibold text-gray-900">Live Preview</span>
                          {q.questionType === 'matrix_radio' && (
                            <span className="text-xs text-gray-500">(skeleton — how respondents will see it)</span>
                          )}
                        </div>

                        {q.questionType === 'text_short' && (
                          <input
                            type="text"
                            disabled
                            placeholder="Short answer preview..."
                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm"
                          />
                        )}

                        {q.questionType === 'text_long' && (
                          <textarea
                            disabled
                            placeholder="Long answer preview..."
                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm min-h-[100px]"
                          />
                        )}

                        {(q.questionType === 'single_checkbox' || q.questionType === 'multiple_checkbox') && (
                          <div className="space-y-3">
                            {q.options.map((opt, i) => (
                              <label key={i} className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg">
                                <input
                                  type={q.questionType === 'single_checkbox' ? 'radio' : 'checkbox'}
                                  disabled
                                  className="h-5 w-5"
                                />
                                <span className="text-sm">{opt}</span>
                              </label>
                            ))}
                          </div>
                        )}

                        {q.questionType === 'slider' && (
                          <div className="px-4 py-6">
                            <input
                              type="range"
                              min={q.minValue}
                              max={q.maxValue}
                              disabled
                              className="w-full h-2 bg-gray-200 rounded-lg"
                            />
                            <div className="flex justify-between text-xs text-gray-600 mt-3">
                              <span>{q.minValue}</span>
                              <span>{q.maxValue}</span>
                            </div>
                          </div>
                        )}

                        {q.questionType === 'matrix_radio' && (
                          <div className="bg-white border border-dashed border-gray-300 rounded-lg p-4 opacity-90">
                            <p className="text-sm font-medium text-gray-800 mb-4">
                              {q.questionText.trim() || 'How satisfied are you with each of the following?'}
                            </p>
                            <MatrixQuestion
                              preview
                              rows={q.rows || []}
                              columns={q.options || []}
                              value={{}}
                              namePrefix={`preview-${idx}`}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {formData.questions.length === 0 && (
                <div className="text-center py-16 border-2 border-dashed border-gray-300 rounded-xl">
                  <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-700 font-medium mb-3">No questions added yet</p>
                  <button
                    type="button"
                    onClick={addQuestion}
                    className="text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    + Add your first question
                  </button>
                </div>
              )}
            </div>
          </div>

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