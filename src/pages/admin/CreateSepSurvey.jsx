// src/pages/admin/CreateSepSurvey.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { sepSurveyAPI } from '../../services/api'; // ← Make sure this is exported in api.js
import { ArrowLeft, Plus, Trash2, Save, Type, FileText, CheckSquare,Loader2, Sliders, AlertCircle, Eye, Settings as SettingsIcon, Clock, Calendar, Award, Users, Target } from 'lucide-react';
import toast from 'react-hot-toast';

const CreateSepSurvey = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'published',
    credits: 50,
    publishedAt: new Date().toISOString().split('T')[0],
    availableDays: 7,
    estimatedMinutes: '',
    visibility: 'public',
    questions: [
      {
        questionText: '',
        questionType: 'text_short',
        options: [],
        maxSelections: 1,
        minValue: 0,
        maxValue: 5
      }
    ]
  });

  const questionTypes = [
    { value: 'text_short', label: 'Short Text', icon: Type, description: 'Brief text response' },
    { value: 'text_long', label: 'Long Text', icon: FileText, description: 'Detailed paragraph' },
    { value: 'single_checkbox', label: 'Single Choice', icon: CheckSquare, description: 'Pick one option' },
    { value: 'multiple_checkbox', label: 'Multiple Choice', icon: CheckSquare, description: 'Pick multiple' },
    { value: 'slider', label: 'Slider', icon: Sliders, description: 'Range selection' }
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
      description: 'Hidden from the public list — only shows to users specifically assigned it (e.g. merchant feedback triggered after a voucher redemption)'
    }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleQuestionChange = (index, field, value) => {
    const updated = [...formData.questions];
    updated[index][field] = value;

    if (field === 'questionType') {
      if (value === 'single_checkbox' || value === 'multiple_checkbox') {
        updated[index].options = updated[index].options.length ? updated[index].options : ['Option 1', 'Option 2'];
        updated[index].maxSelections = value === 'single_checkbox' ? 1 : 2;
      } else if (value === 'slider') {
        updated[index].minValue = 0;
        updated[index].maxValue = 5;
      } else {
        updated[index].options = [];
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

  const addQuestion = () => {
    setFormData(prev => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          questionText: '',
          questionType: 'text_short',
          options: [],
          maxSelections: 1,
          minValue: 0,
          maxValue: 5
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
    if (!formData.publishedAt) return toast.error('Published date is required');
    if (!formData.availableDays || Number(formData.availableDays) < 1) {
      return toast.error('Available days must be at least 1');
    }
    if (formData.estimatedMinutes !== '' && Number(formData.estimatedMinutes) < 1) {
      return toast.error('Estimated time must be at least 1 minute');
    }

    const emptyQuestions = formData.questions.filter(q => !q.questionText.trim());
    if (emptyQuestions.length) return toast.error('All questions must have text');

    const invalidCheckboxes = formData.questions.filter(q =>
      (q.questionType === 'single_checkbox' || q.questionType === 'multiple_checkbox') &&
      (!q.options || q.options.length === 0)
    );
    if (invalidCheckboxes.length) return toast.error('Checkbox questions need at least one option');

    setLoading(true);

    try {
      const availableDays = Number(formData.availableDays);
      const derivedEndDate = new Date(formData.publishedAt);
      derivedEndDate.setDate(derivedEndDate.getDate() + availableDays);

      const payload = {
        title: trimmedTitle,
        description: trimmedDesc,
        status: formData.status,
        credits: Number(formData.credits),
        publishedAt: formData.publishedAt,
        availableDays,
        endDate: derivedEndDate.toISOString().split('T')[0],
        estimatedMinutes: formData.estimatedMinutes !== '' ? Number(formData.estimatedMinutes) : null,
        visibility: formData.visibility,
        questions: formData.questions.map(q => {
          const base = {
            questionText: q.questionText.trim(),
            questionType: q.questionType
          };
          if (['single_checkbox', 'multiple_checkbox'].includes(q.questionType)) {
            base.options = q.options.map(o => o.trim()).filter(Boolean);
            base.maxSelections = q.maxSelections;
          }
          if (q.questionType === 'slider') {
            base.minValue = Number(q.minValue);
            base.maxValue = Number(q.maxValue);
          }
          return base;
        })
      };

      await sepSurveyAPI.create(payload); // ← Add this method in api.js (see below)
      toast.success('Standalone survey created successfully!');
      navigate('/admin');
    } catch (err) {
      console.error('Create sep survey error:', err);
      const msg = err.response?.data?.message || 'Failed to create survey';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const getMinPublishedDate = () => new Date().toISOString().split('T')[0];

  const getQuestionTypeData = (type) => questionTypes.find(qt => qt.value === type);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/admin')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Create Standalone Survey</h1>
              <p className="text-sm text-gray-500">Independent survey (not tied to a campaign)</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
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
                    This survey won't appear to anyone until it's attached to a voucher offer's feedback
                    triggers and a user redeems a matching voucher.
                  </p>
                )}
              </div>

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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Published Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
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
                </div>
              </div>

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
                        </div>

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
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
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
          <div className="bg-white rounded-2xl border border-gray-200 p-6 sticky bottom-0 shadow-lg">
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
                  onClick={() => navigate('/admin')}
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
                      Creating...
                    </>
                  ) : (
                    <>
                      <Save className="h-5 w-5" />
                      Create Survey
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