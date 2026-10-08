// Survey question list. Text, choices, matrix, slider, and attention checks.

import { AlertCircle, ChevronDown, ChevronUp, Eye, Plus, Trash2 } from 'lucide-react';
import MatrixQuestion from '../../../components/survey/MatrixQuestion';
import SurveyTextField, { SurveyRichText } from '../../../components/survey/SurveyTextField';
import { plainSurveyText } from '../../../utils/surveyMarkup';

export default function SurveyQuestions({
  addOption,
  addQuestion,
  addRow,
  applySatisfactionScale,
  formData,
  getQuestionTypeData,
  handleOptionChange,
  handleQuestionChange,
  handleRowChange,
  metricTagOptions,
  moveOption,
  moveRow,
  questionTypes,
  removeOption,
  removeQuestion,
  removeRow,
}) {
  return (
    <>
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

                        <SurveyTextField
                          value={q.questionText}
                          onChange={(next) => handleQuestionChange(idx, 'questionText', next)}
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

                      {/* Options for checkbox, Likert, and attention-check questions */}
                      {(q.questionType === 'single_checkbox' || q.questionType === 'multiple_checkbox' || q.questionType === 'likert' || q.questionType === 'attention_check') && (
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
                                {q.questionType === 'attention_check' && q.attentionAnswer === opt && (
                                  <span className="text-xs font-semibold text-green-700">Correct</span>
                                )}
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

                          {q.questionType === 'attention_check' && (
                            <div className="mt-4 pt-4 border-t border-green-100 space-y-3">
                              <label className="block text-sm font-semibold text-gray-900">
                                Correct answer
                              </label>
                              <p className="text-xs text-gray-500">
                                Respondents see these options in a random order. A wrong answer flags that response.
                              </p>
                              <select
                                value={q.attentionAnswer || ''}
                                onChange={(e) => handleQuestionChange(idx, 'attentionAnswer', e.target.value)}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-white"
                              >
                                <option value="">Correct answer</option>
                                {q.options.map((opt, optIdx) => (
                                  <option key={optIdx} value={opt}>{opt || `Option ${optIdx + 1}`}</option>
                                ))}
                              </select>
                            </div>
                          )}

                          {q.questionType === 'single_checkbox' && (
                            <div className="mt-4 pt-4 border-t border-green-100 space-y-3">
                              <label className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                                <input
                                  type="checkbox"
                                  checked={!!q.attentionCheck}
                                  onChange={(e) => handleQuestionChange(idx, 'attentionCheck', e.target.checked)}
                                />
                                Attention check
                              </label>
                              <p className="text-xs text-gray-500">
                                A wrong answer is counted on the health page. Surveys without this check are left out.
                              </p>
                              {q.attentionCheck && (
                                <select
                                  value={q.attentionAnswer || ''}
                                  onChange={(e) => handleQuestionChange(idx, 'attentionAnswer', e.target.value)}
                                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-white"
                                >
                                  <option value="">Correct answer</option>
                                  {q.options.map((opt, optIdx) => (
                                    <option key={optIdx} value={opt}>{opt || `Option ${optIdx + 1}`}</option>
                                  ))}
                                </select>
                              )}
                            </div>
                          )}

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

                        {(q.questionType === 'single_checkbox' || q.questionType === 'multiple_checkbox' || q.questionType === 'likert' || q.questionType === 'attention_check') && (
                          <div className="space-y-3">
                            {q.options.map((opt, i) => (
                              <label key={i} className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg">
                                <input
                                  type={q.questionType === 'multiple_checkbox' ? 'checkbox' : 'radio'}
                                  disabled
                                  className="h-5 w-5"
                                />
                                <span className="text-sm">{opt}</span>
                                {q.questionType === 'attention_check' && q.attentionAnswer === opt && (
                                  <span className="text-xs font-semibold text-green-700">Correct</span>
                                )}
                              </label>
                            ))}
                            {q.questionType === 'attention_check' && (
                              <p className="text-xs text-gray-500">Respondents see these options in a random order.</p>
                            )}
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
                              <SurveyRichText text={plainSurveyText(q.questionText) ? q.questionText : 'How satisfied are you with each of the following?'} />
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
    </>
  );
}
