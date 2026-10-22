// Create or edit a standalone survey. Settings, questions, and publish.

import React from 'react';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import SurveySettings from './SurveySettings.jsx';
import SurveyQuestions from './SurveyQuestions.jsx';
import useSepSurveyForm from './useSepSurveyForm.js';

export { SATISFACTION_SCALE } from './sepSurveyDefaults.js';

const CreateSepSurvey = () => {
  const {
    loading,
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
    getMinPublishedDate,
    getQuestionTypeData,
  } = useSepSurveyForm();

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
