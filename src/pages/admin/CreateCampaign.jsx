import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { campaignAPI } from '../../services/api';
import { ArrowLeft, Plus, Trash2, Save, Type, FileText, CheckSquare, Sliders, AlertCircle, Eye, Settings as SettingsIcon, Clock, Timer, Award } from 'lucide-react';
import toast from 'react-hot-toast';

const CreateCampaign = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'available',
    endDate: '',
    isMandatory: false,
    surveyDelayDays: 0,
    surveyTimeoutDays: 0,
    creditsToAward: 100,
    creditsToDeduct: 50,
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
    { value: 'available', label: 'Available', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    { value: 'active', label: 'Active', color: 'bg-green-100 text-green-700 border-green-200' },
    { value: 'completed', label: 'Completed', color: 'bg-gray-100 text-gray-700 border-gray-200' },
    { value: 'archived', label: 'Archived', color: 'bg-orange-100 text-orange-700 border-orange-200' }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleQuestionChange = (index, field, value) => {
    const updatedQuestions = [...formData.questions];
    updatedQuestions[index][field] = value;
    
    if (field === 'questionType') {
      if (value === 'single_checkbox' || value === 'multiple_checkbox') {
        updatedQuestions[index].options = ['Option 1', 'Option 2'];
        updatedQuestions[index].maxSelections = value === 'single_checkbox' ? 1 : 2;
      } else if (value === 'slider') {
        updatedQuestions[index].minValue = 0;
        updatedQuestions[index].maxValue = 5;
      } else {
        updatedQuestions[index].options = [];
        updatedQuestions[index].maxSelections = 1;
        updatedQuestions[index].minValue = 0;
        updatedQuestions[index].maxValue = 5;
      }
    }
    
    setFormData(prev => ({
      ...prev,
      questions: updatedQuestions
    }));
  };

  const handleOptionChange = (questionIndex, optionIndex, value) => {
    const updatedQuestions = [...formData.questions];
    updatedQuestions[questionIndex].options[optionIndex] = value;
    setFormData(prev => ({
      ...prev,
      questions: updatedQuestions
    }));
  };

  const addOption = (questionIndex) => {
    const updatedQuestions = [...formData.questions];
    updatedQuestions[questionIndex].options.push(`Option ${updatedQuestions[questionIndex].options.length + 1}`);
    setFormData(prev => ({
      ...prev,
      questions: updatedQuestions
    }));
  };

  const removeOption = (questionIndex, optionIndex) => {
    const updatedQuestions = [...formData.questions];
    if (updatedQuestions[questionIndex].options.length > 1) {
      updatedQuestions[questionIndex].options.splice(optionIndex, 1);
      setFormData(prev => ({
        ...prev,
        questions: updatedQuestions
      }));
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
      const updatedQuestions = formData.questions.filter((_, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        questions: updatedQuestions
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const trimmedTitle = formData.title.trim();
    const trimmedDescription = formData.description.trim();
    
    if (!trimmedTitle) {
      toast.error('Please enter a campaign title');
      return;
    }

    if (!trimmedDescription) {
      toast.error('Please enter a campaign description');
      return;
    }

    if (!formData.endDate) {
      toast.error('Please select an end date for the campaign');
      return;
    }

    const emptyQuestions = formData.questions.filter(q => !q.questionText.trim());
    if (emptyQuestions.length > 0) {
      toast.error('Please fill in all question texts');
      return;
    }

    const invalidCheckboxQuestions = formData.questions.filter(q => 
      (q.questionType === 'single_checkbox' || q.questionType === 'multiple_checkbox') && 
      (!q.options || q.options.length === 0)
    );
    
    if (invalidCheckboxQuestions.length > 0) {
      toast.error('Checkbox questions must have at least one option');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        title: trimmedTitle,
        description: trimmedDescription,
        status: formData.status,
        endDate: formData.endDate,
        isMandatory: formData.isMandatory,
        surveyDelayDays: formData.surveyDelayDays,
        surveyTimeoutDays: formData.surveyTimeoutDays,
        creditsToAward: formData.creditsToAward,
        creditsToDeduct: formData.creditsToDeduct,
        questions: formData.questions.map(q => {
          const baseQuestion = {
            questionText: q.questionText.trim(),
            questionType: q.questionType
          };
          
          if (q.questionType === 'single_checkbox' || q.questionType === 'multiple_checkbox') {
            baseQuestion.options = q.options.map(opt => opt.trim()).filter(opt => opt);
            baseQuestion.maxSelections = q.maxSelections;
          } else if (q.questionType === 'slider') {
            baseQuestion.minValue = q.minValue;
            baseQuestion.maxValue = q.maxValue;
          }
          
          return baseQuestion;
        })
      };

      const response = await campaignAPI.createCampaign(payload);
      toast.success('Campaign created successfully!');
      navigate('/admin');
    } catch (error) {
      console.error('Error creating campaign:', error);
      
      if (error.response?.data?.errors) {
        const errorMessages = error.response.data.errors.map(err => 
          `${err.path}: ${err.msg}`
        ).join('\n');
        toast.error(`Validation errors:\n${errorMessages}`);
      } else if (error.response?.data?.message) {
        toast.error(`Error: ${error.response.data.message}`);
      } else {
        toast.error('Failed to create campaign. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = () => {
      setStatusDropdownOpen(false);
    };
    if (statusDropdownOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [statusDropdownOpen]);

  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const getQuestionTypeData = (type) => {
    return questionTypes.find(qt => qt.value === type);
  };

  const getCurrentStatus = () => {
    return statusOptions.find(s => s.value === formData.status);
  };

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
              <h1 className="text-2xl font-bold text-gray-900">Create Campaign</h1>
              <p className="text-sm text-gray-500">Design your sampling campaign and survey</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Campaign Info Section */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-visible">
            <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-blue-50 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">Campaign Information</h2>
              <p className="text-sm text-gray-600 mt-0.5">Basic details about your campaign</p>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Campaign Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3399ff] focus:border-transparent transition-all"
                  placeholder="e.g., Summer Product Sampling 2024"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3399ff] focus:border-transparent transition-all resize-none"
                  placeholder="Describe what users will sample and the purpose of this campaign..."
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Campaign Status
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setStatusDropdownOpen(!statusDropdownOpen);
                      }}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-left focus:outline-none focus:ring-2 focus:ring-[#3399ff] focus:border-transparent transition-all flex items-center justify-between"
                    >
                      <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-semibold border ${getCurrentStatus()?.color}`}>
                        {getCurrentStatus()?.label}
                      </span>
                      <svg className={`h-5 w-5 text-gray-400 transition-transform ${statusDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {statusDropdownOpen && (
                      <div className="absolute top-full mt-2 w-full bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
                        <div className="p-2">
                          {statusOptions.map((status) => (
                            <button
                              key={status.value}
                              type="button"
                              onClick={() => {
                                handleInputChange('status', status.value);
                                setStatusDropdownOpen(false);
                              }}
                              className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors flex items-center justify-between ${
                                formData.status === status.value ? 'bg-blue-50' : 'hover:bg-gray-50'
                              }`}
                            >
                              <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-semibold border ${status.color}`}>
                                {status.label}
                              </span>
                              {formData.status === status.value && (
                                <CheckSquare className="h-4 w-4 text-[#3399ff]" />
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    End Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => handleInputChange('endDate', e.target.value)}
                    min={getMinDate()}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#3399ff] focus:border-transparent transition-all"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Settings Section */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-purple-50 border-b border-gray-200 flex items-center gap-2">
              <SettingsIcon className="h-5 w-5 text-purple-600" />
              <div>
                <h2 className="text-lg font-bold text-gray-900">Survey Settings</h2>
                <p className="text-sm text-gray-600">Configure timing and rewards</p>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 bg-[#2ed6fd] bg-opacity-10 rounded-lg">
                      <Clock className="h-5 w-5 text-[#2ed6fd]" />
                    </div>
                    <label className="block text-sm font-semibold text-gray-900">
                      Survey Delay (Days)
                    </label>
                  </div>
                  <input
                    type="number"
                    min="0"
                    value={formData.surveyDelayDays}
                    onChange={(e) => handleInputChange('surveyDelayDays', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#3399ff] focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1.5">Days after delivery</p>
                </div>

                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 bg-[#2ed6fd] bg-opacity-10 rounded-lg">
                      <Timer className="h-5 w-5 text-[#2ed6fd]" />
                    </div>
                    <label className="block text-sm font-semibold text-gray-900">
                      Survey Timeout (Days)
                    </label>
                  </div>
                  <input
                    type="number"
                    min="0"
                    value={formData.surveyTimeoutDays}
                    onChange={(e) => handleInputChange('surveyTimeoutDays', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#3399ff] focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1.5">Deadline to complete</p>
                </div>

                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 bg-[#2ed6fd] bg-opacity-10 rounded-lg">
                      <Award className="h-5 w-5 text-[#2ed6fd]" />
                    </div>
                    <label className="block text-sm font-semibold text-gray-900">
                      Credits to Award
                    </label>
                  </div>
                  <input
                    type="number"
                    min="0"
                    value={formData.creditsToAward}
                    onChange={(e) => handleInputChange('creditsToAward', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#3399ff] focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1.5">Reward on completion</p>
                </div>
              </div>

              <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-3">
                <div className="relative flex items-center">
                  <input
                    type="checkbox"
                    id="isMandatory"
                    checked={formData.isMandatory}
                    onChange={(e) => handleInputChange('isMandatory', e.target.checked)}
                    className="peer h-5 w-5 appearance-none border-2 border-amber-300 rounded checked:bg-[#2ed6fd] checked:border-[#2ed6fd] focus:ring-2 focus:ring-[#2ed6fd] focus:ring-offset-2 transition-all cursor-pointer"
                  />
                  <CheckSquare className="h-5 w-5 text-white absolute pointer-events-none hidden peer-checked:block" />
                </div>
                <div>
                  <label htmlFor="isMandatory" className="block text-sm font-semibold text-amber-900 cursor-pointer">
                    Mandatory Survey
                  </label>
                  <p className="text-xs text-amber-700 mt-0.5">Users must complete the survey to receive rewards</p>
                </div>
              </div>
            </div>
          </div>

          {/* Survey Questions Section */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-green-50 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Survey Questions</h2>
                  <p className="text-sm text-gray-600 mt-0.5">{formData.questions.length} question{formData.questions.length !== 1 ? 's' : ''} added</p>
                </div>
                <button
                  type="button"
                  onClick={addQuestion}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Add Question
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {formData.questions.map((question, index) => {
                const typeData = getQuestionTypeData(question.questionType);
                const TypeIcon = typeData?.icon;
                
                return (
                  <div key={index} className="border-2 border-gray-200 rounded-xl overflow-hidden hover:border-gray-300 transition-colors">
                    <div className="p-5 bg-gray-50 border-b border-gray-200">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="px-2.5 py-1 bg-white border border-gray-300 rounded-lg text-xs font-bold text-gray-700">
                              Q{index + 1}
                            </span>
                            {TypeIcon && (
                              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-gray-300 rounded-lg">
                                <TypeIcon className="h-3.5 w-3.5 text-gray-600" />
                                <span className="text-xs font-medium text-gray-700">{typeData.label}</span>
                              </div>
                            )}
                          </div>
                          <input
                            type="text"
                            value={question.questionText}
                            onChange={(e) => handleQuestionChange(index, 'questionText', e.target.value)}
                            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3399ff] focus:border-transparent transition-all"
                            placeholder="Enter your question here..."
                            required
                          />
                        </div>
                        
                        {formData.questions.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeQuestion(index)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="p-5 space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                          Question Type
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                          {questionTypes.map((type) => {
                            const Icon = type.icon;
                            return (
                              <button
                                key={type.value}
                                type="button"
                                onClick={() => handleQuestionChange(index, 'questionType', type.value)}
                                className={`p-3 rounded-lg border-2 transition-all text-left ${
                                  question.questionType === type.value
                                    ? 'border-[#3399ff] bg-blue-50'
                                    : 'border-gray-200 hover:border-gray-300 bg-white'
                                }`}
                              >
                                <Icon className={`h-5 w-5 mb-1.5 ${
                                  question.questionType === type.value ? 'text-[#3399ff]' : 'text-gray-600'
                                }`} />
                                <p className={`text-xs font-semibold ${
                                  question.questionType === type.value ? 'text-[#3399ff]' : 'text-gray-900'
                                }`}>
                                  {type.label}
                                </p>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Options for checkbox questions */}
                      {(question.questionType === 'single_checkbox' || question.questionType === 'multiple_checkbox') && (
                        <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                          <div className="flex items-center justify-between mb-3">
                            <label className="text-sm font-semibold text-gray-900">
                              Answer Options
                            </label>
                            <button
                              type="button"
                              onClick={() => addOption(index)}
                              className="text-sm font-medium text-[#3399ff] hover:text-[#2a7acc]"
                            >
                              + Add Option
                            </button>
                          </div>
                          <div className="space-y-2">
                            {question.options.map((option, optionIndex) => (
                              <div key={optionIndex} className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-500 w-6">{optionIndex + 1}.</span>
                                <input
                                  type="text"
                                  value={option}
                                  onChange={(e) => handleOptionChange(index, optionIndex, e.target.value)}
                                  className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3399ff] focus:border-transparent"
                                  placeholder={`Option ${optionIndex + 1}`}
                                />
                                {question.options.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => removeOption(index, optionIndex)}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                          {question.questionType === 'multiple_checkbox' && (
                            <div className="mt-3 pt-3 border-t border-blue-200">
                              <label className="block text-sm font-semibold text-gray-900 mb-2">
                                Maximum Selections
                              </label>
                              <input
                                type="number"
                                min="1"
                                max={question.options.length}
                                value={question.maxSelections}
                                onChange={(e) => handleQuestionChange(index, 'maxSelections', parseInt(e.target.value) || 1)}
                                className="w-24 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3399ff] focus:border-transparent"
                              />
                            </div>
                          )}
                        </div>
                      )}

                      {/* Slider configuration */}
                      {question.questionType === 'slider' && (
                        <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
                          <label className="block text-sm font-semibold text-gray-900 mb-3">
                            Slider Range
                          </label>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Minimum Value
                              </label>
                              <input
                                type="number"
                                value={question.minValue}
                                onChange={(e) => handleQuestionChange(index, 'minValue', parseInt(e.target.value) || 0)}
                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3399ff] focus:border-transparent"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Maximum Value
                              </label>
                              <input
                                type="number"
                                value={question.maxValue}
                                onChange={(e) => handleQuestionChange(index, 'maxValue', parseInt(e.target.value) || 5)}
                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3399ff] focus:border-transparent"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Preview */}
                      <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                        <div className="flex items-center gap-2 mb-3">
                          <Eye className="h-4 w-4 text-gray-600" />
                          <span className="text-sm font-semibold text-gray-900">Preview</span>
                        </div>
                        <div className="text-sm text-gray-700">
                          {question.questionType === 'text_short' && (
                            <input
                              type="text"
                              disabled
                              placeholder="User's short answer will appear here..."
                              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm"
                            />
                          )}
                          {question.questionType === 'text_long' && (
                            <textarea
                              disabled
                              placeholder="User's detailed response will appear here..."
                              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm"
                              rows={3}
                            />
                          )}
                          {(question.questionType === 'single_checkbox' || question.questionType === 'multiple_checkbox') && (
                            <div className="space-y-2">
                              {question.options.map((option, optionIndex) => (
                                <label key={optionIndex} className="flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-200">
                                  <input
                                    type={question.questionType === 'single_checkbox' ? 'radio' : 'checkbox'}
                                    disabled
                                    className="h-4 w-4"
                                  />
                                  <span className="text-sm">{option}</span>
                                </label>
                              ))}
                            </div>
                          )}
                          {question.questionType === 'slider' && (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-xs font-medium text-gray-600 mb-2">
                                <span>{question.minValue}</span>
                                <span>{question.maxValue}</span>
                              </div>
                              <input
                                type="range"
                                min={question.minValue}
                                max={question.maxValue}
                                disabled
                                className="w-full"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {formData.questions.length === 0 && (
                <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-xl">
                  <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 font-medium mb-2">No questions added yet</p>
                  <button
                    type="button"
                    onClick={addQuestion}
                    className="text-[#3399ff] hover:text-[#2a7acc] text-sm font-semibold"
                  >
                    Add your first question
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Submit Section */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden sticky bottom-0 shadow-lg">
            <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-emerald-50">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Ready to Launch?</h3>
                  <p className="text-sm text-gray-600 mt-0.5">
                    Campaign with {formData.questions.length} question{formData.questions.length !== 1 ? 's' : ''} ready to create
                  </p>
                  {!formData.endDate && (
                    <div className="flex items-center gap-1.5 mt-2 text-red-600">
                      <AlertCircle className="h-4 w-4" />
                      <p className="text-sm font-medium">End date is required</p>
                    </div>
                  )}
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => navigate('/admin')}
                    className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !formData.endDate}
                    className="flex items-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-xl font-medium hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                        <span>Creating Campaign...</span>
                      </>
                    ) : (
                      <>
                        <Save className="h-5 w-5" />
                        <span>Create Campaign</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateCampaign;