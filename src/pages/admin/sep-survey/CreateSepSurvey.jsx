// Create or edit a standalone survey. Settings, questions, and publish.

import React, { useMemo, useState } from 'react';
import { ArrowLeft, Eye, Save, Loader2 } from 'lucide-react';
import SurveySettings from './SurveySettings.jsx';
import SurveyQuestions from './SurveyQuestions.jsx';
import useSepSurveyForm from './useSepSurveyForm.js';
import StandaloneSurvey from '../../survey/StandaloneSurvey.jsx';
import { buildPreviewSurvey } from './previewSurvey.js';

export { SATISFACTION_SCALE } from './sepSurveyDefaults.js';

const CreateSepSurvey = () => {
  const {
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
    questionTypes,
    metricTagOptions,
    statusOptions,
    visibilityOptions,
    kindOptions,
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
    savedDrafts,
    savedDraftsLoading,
    loadingSavedId,
    applySavedSurvey,
    canLoadSavedSurvey,
  } = useSepSurveyForm();

  const [leaveOpen, setLeaveOpen] = useState(false);
  const [selectedSavedId, setSelectedSavedId] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);

  const previewSurvey = useMemo(() => buildPreviewSurvey(formData), [formData]);

  const requestLeave = () => {
    if (!isDirty) {
      leaveWithoutSaving();
      return;
    }
    setLeaveOpen(true);
  };

  const kindLabel = kindOptions.find((o) => o.value === formData.kind)?.label || formData.kind;
  const visibilityLabel = visibilityOptions.find((o) => o.value === formData.visibility)?.label || formData.visibility;
  const statusLabel = statusOptions.find((o) => o.value === formData.status)?.label || formData.status;
  const selectedClusters = clusters.filter((c) => formData.clusterIds.includes(String(c._id)));
  const descriptionPreview = formData.description?.trim()
    ? (formData.description.trim().length > 120
      ? `${formData.description.trim().slice(0, 120)}…`
      : formData.description.trim())
    : '—';
  const formatDateTime = (value) => {
    if (!value) return '—';
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? value : d.toLocaleString();
  };

  const summaryItems = [
    { label: 'Title', value: formData.title?.trim() || '—' },
    { label: 'Description', value: descriptionPreview },
    ...(!isSprint ? [{ label: 'Survey type', value: kindLabel }] : []),
    ...(isSprint ? [{ label: 'Format', value: formData.isPoll ? 'Quick poll' : 'Survey' }] : []),
    ...(!isSprint ? [{ label: 'Visibility', value: visibilityLabel }] : []),
    { label: 'Status', value: statusLabel },
    { label: 'Credits', value: String(formData.credits ?? 0) },
    { label: 'Estimated time', value: formData.estimatedMinutes ? `${formData.estimatedMinutes} min` : '—' },
    ...(!isSprint && formData.visibility === 'targeted'
      ? [
          { label: 'Validity after send', value: `${formData.validityDays} day${formData.validityDays !== 1 ? 's' : ''}` },
          {
            label: 'Clusters',
            value: selectedClusters.length
              ? selectedClusters.map((c) => c.name).join(', ')
              : 'None selected',
          },
          ...(formData.clusterIds.length > 0
            ? [{ label: 'Send to clusters on', value: formatDateTime(formData.clusterSendAt) }]
            : []),
          {
            label: 'Also publish to others',
            value: formData.alsoPublishToOthers ? 'Yes' : 'No',
          },
        ]
      : []),
    ...(needsPublicWindow
      ? [
          {
            label: formData.visibility === 'targeted' ? 'Publish to others on' : 'Published date',
            value: (() => {
              const dates = [
                formData.publishedAt,
                ...((!isEditMode && Array.isArray(formData.extraPublishedAts))
                  ? formData.extraPublishedAts
                  : []),
              ].filter(Boolean);
              if (!dates.length) return '—';
              return dates.map((value) => formatDateTime(value)).join(' · ');
            })(),
          },
          {
            label: 'Available for',
            value: `${formData.availableDays} day${formData.availableDays !== 1 ? 's' : ''}`,
          },
        ]
      : []),
  ];

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
              onClick={requestLeave}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors shrink-0"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div className="min-w-0 flex-1">
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
              {autosaveLabel ? (
                <p className="text-xs text-gray-400 mt-1">{autosaveLabel}</p>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-28">
        <form onSubmit={handleSubmit} className="space-y-6">
          {canLoadSavedSurvey ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5">
              <label htmlFor="saved-survey-template" className="block text-sm font-medium text-gray-900">
                Load saved survey
              </label>
              <p className="text-sm text-gray-500 mt-1">
                Pick a draft to fill this form. Create Survey publishes a new copy and uses its saved clusters and send time.
              </p>
              <div className="mt-3 flex flex-col sm:flex-row gap-3 sm:items-center">
                <select
                  id="saved-survey-template"
                  value={selectedSavedId}
                  disabled={savedDraftsLoading || Boolean(loadingSavedId) || loading}
                  onChange={async (event) => {
                    const id = event.target.value;
                    setSelectedSavedId(id);
                    if (id) await applySavedSurvey(id);
                  }}
                  className="w-full sm:max-w-md rounded-xl border border-gray-300 px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50 disabled:text-gray-400"
                >
                  <option value="">
                    {savedDraftsLoading
                      ? 'Loading saved surveys…'
                      : savedDrafts.length
                        ? 'Select a saved survey…'
                        : 'No saved surveys yet'}
                  </option>
                  {savedDrafts.map((draft) => (
                    <option key={draft._id} value={draft._id}>
                      {draft.title?.trim() || 'Untitled draft'}
                    </option>
                  ))}
                </select>
                {loadingSavedId ? (
                  <span className="inline-flex items-center gap-2 text-sm text-gray-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading…
                  </span>
                ) : null}
              </div>
            </div>
          ) : null}

          <SurveySettings
            clusters={clusters}
            clustersLoading={clustersLoading}
            formData={formData}
            getMinPublishedDate={getMinPublishedDate}
            handleInputChange={handleInputChange}
            isEditMode={isEditMode}
            isSprint={isSprint}
            kindOptions={kindOptions}
            needsPublicWindow={needsPublicWindow}
            statusOptions={statusOptions}
            toggleCluster={toggleCluster}
            visibilityOptions={visibilityOptions}
            structureLocked={logicTextOnlyLocked}
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
            logicTextOnlyLocked={logicTextOnlyLocked}
            logicRewardSummary={logicRewardSummary}
            onPreview={() => setPreviewOpen(true)}
          />

          {/* Submit Bar */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 sticky bottom-16 md:bottom-0 shadow-lg">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    Ready to Publish?
                  </h3>
                  <p className="text-sm text-gray-600">
                    Survey with {formData.questions.length} question{formData.questions.length !== 1 ? 's' : ''}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Save keeps a private draft, including the clusters and send time. The send is queued when you create or publish it. Drafts also autosave every 15 seconds when ready.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => setPreviewOpen(true)}
                    className="flex items-center justify-center gap-2 px-8 py-3 border-2 border-gray-300 text-gray-800 rounded-xl font-medium hover:bg-gray-50 transition-all"
                  >
                    <Eye className="h-5 w-5" />
                    Test this survey
                  </button>

                  <button
                    type="button"
                    onClick={requestLeave}
                    className="px-8 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={(event) => handleSubmit(event, { asDraft: true })}
                    disabled={loading}
                    className="flex items-center justify-center gap-2 px-8 py-3 border-2 border-indigo-600 text-indigo-700 rounded-xl font-medium hover:bg-indigo-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {pendingAction === 'save' ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-5 w-5" />
                        Save
                      </>
                    )}
                  </button>

                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center justify-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
                  >
                    {pendingAction === 'publish' ? (
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

              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">
                  Survey information
                </p>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                  {summaryItems.map((item) => (
                    <div key={item.label} className="min-w-0">
                      <dt className="text-xs text-gray-500">{item.label}</dt>
                      <dd className="text-sm text-gray-900 break-words">{item.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          </div>
        </form>
      </div>

      {leaveOpen ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/40">
          <div
            className="bg-white w-full max-w-md rounded-2xl shadow-xl p-5 sm:p-6"
            role="dialog"
            aria-labelledby="leave-survey-title"
          >
            <h2 id="leave-survey-title" className="text-lg font-bold text-gray-900">
              Leave without saving?
            </h2>
            <p className="text-sm text-gray-600 mt-2">
              Your questions stay in this browser so you can come back. A server draft only updates when the form is complete enough to autosave.
            </p>
            <div className="mt-5 flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
              <button
                type="button"
                onClick={() => setLeaveOpen(false)}
                className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50"
              >
                Stay
              </button>
              <button
                type="button"
                onClick={() => {
                  setLeaveOpen(false);
                  leaveWithoutSaving();
                }}
                className="px-5 py-2.5 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700"
              >
                Leave
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {previewOpen ? (
        <div className="fixed inset-0 z-[90] bg-white overflow-auto">
          <StandaloneSurvey
            key="logic-preview"
            previewMode
            previewSurvey={previewSurvey}
            onExitPreview={() => setPreviewOpen(false)}
          />
        </div>
      ) : null}
    </div>
  );
};

export default CreateSepSurvey;
