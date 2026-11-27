import { useState } from 'react';
import { GitBranch, Plus, Trash2 } from 'lucide-react';
import {
  OPTIONS_FROM_SOURCE_TYPES,
  OPTIONS_FROM_TARGET_TYPES,
  allowedOperatorsFor,
  hasLogicRules,
  hasOptionsFrom,
  normalizeOptions,
  normalizeOptionsFrom,
  optionLabel,
  questionId,
} from '../../../utils/surveyLogic';
import { plainSurveyText } from '../../../utils/surveyMarkup';

const OP_LABELS = {
  is: 'is',
  is_not: 'is not',
  is_any_of: 'is any of',
  is_none_of: 'is none of',
  includes: 'includes',
  does_not_include: 'does not include',
  includes_any_of: 'includes any of',
  includes_all_of: 'includes all of',
  equals: 'equals',
  not_equals: 'not equals',
  greater_than: 'greater than',
  at_least: 'at least',
  less_than: 'less than',
  at_most: 'at most',
  between: 'between',
  was_answered: 'was answered',
  was_not_answered: 'was not answered',
  was_skipped: 'was skipped',
};

const emptyCondition = (questionIdValue) => ({
  question: questionIdValue || '',
  op: 'is',
  value: '',
});

const emptyRule = (questionIdValue) => ({
  match: 'all',
  conditions: [emptyCondition(questionIdValue)],
});

const shortLabel = (label, max = 72) => {
  const text = String(label || '');
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
};

/** Resolve a saved condition value to a known option id (id or legacy label). */
const resolveOptionValue = (options, raw) => {
  const value = String(raw ?? '').trim();
  if (!value) return '';
  if (options.some((o) => o.id === value)) return value;
  const byLabel = options.find((o) => o.label === value);
  return byLabel ? byLabel.id : value;
};

function ConditionRow({
  condition,
  sources,
  onChange,
  onRemove,
  canRemove,
}) {
  const source = sources.find((s) => String(s.id) === String(condition.question)) || sources[0];
  const ops = allowedOperatorsFor(source?.question || { questionType: 'text_short' });
  const needsValue = !['was_answered', 'was_not_answered', 'was_skipped'].includes(condition.op);
  const multi = ['is_any_of', 'is_none_of', 'includes_any_of', 'includes_all_of'].includes(condition.op);
  const isBetween = condition.op === 'between';
  const choiceOps = ['is', 'is_not', 'is_any_of', 'is_none_of', 'includes', 'does_not_include', 'includes_any_of', 'includes_all_of'];
  const useOptions = choiceOps.includes(condition.op);
  const options = normalizeOptions(source?.question?.options || []);
  const singleValue = resolveOptionValue(options, condition.value);
  const selectedIds = (Array.isArray(condition.value) ? condition.value : (condition.value ? [condition.value] : []))
    .map((v) => resolveOptionValue(options, v))
    .filter((id) => options.some((o) => o.id === id));

  const toggleOption = (id) => {
    const next = selectedIds.includes(id)
      ? selectedIds.filter((v) => v !== id)
      : [...selectedIds, id];
    onChange({ ...condition, value: next });
  };

  return (
    <div className="space-y-2 rounded-lg border border-gray-100 bg-gray-50/80 p-2.5">
      <select
        className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm bg-white"
        value={String(condition.question || source?.id || '')}
        title={source?.label}
        onChange={(e) => {
          const nextSource = sources.find((s) => String(s.id) === String(e.target.value));
          const nextOps = allowedOperatorsFor(nextSource?.question || {});
          onChange({
            ...condition,
            question: e.target.value,
            op: nextOps.includes(condition.op) ? condition.op : (nextOps[0] || 'was_answered'),
            value: '',
          });
        }}
      >
        {sources.map((s) => (
          <option key={s.id} value={s.id} title={s.label}>{shortLabel(s.label)}</option>
        ))}
      </select>
      <div className="flex flex-wrap items-center gap-2">
        <select
          className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm bg-white"
          value={condition.op}
          onChange={(e) => onChange({ ...condition, op: e.target.value, value: e.target.value === 'between' ? ['', ''] : '' })}
        >
          {ops.map((op) => (
            <option key={op} value={op}>{OP_LABELS[op] || op}</option>
          ))}
        </select>
        {needsValue && useOptions && !multi && (
          <select
            className="flex-1 min-w-[10rem] border border-gray-300 rounded-lg px-2 py-1.5 text-sm bg-white"
            value={singleValue}
            onChange={(e) => onChange({ ...condition, value: e.target.value })}
          >
            <option value="">Pick option</option>
            {options.map((o) => (
              <option key={o.id} value={o.id}>{o.label}</option>
            ))}
          </select>
        )}
        {needsValue && !useOptions && isBetween && (
          <>
            <input
              type="number"
              className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm w-20"
              value={Array.isArray(condition.value) ? condition.value[0] ?? '' : ''}
              onChange={(e) => {
                const cur = Array.isArray(condition.value) ? [...condition.value] : ['', ''];
                cur[0] = e.target.value;
                onChange({ ...condition, value: cur });
              }}
            />
            <span className="text-xs text-gray-500">and</span>
            <input
              type="number"
              className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm w-20"
              value={Array.isArray(condition.value) ? condition.value[1] ?? '' : ''}
              onChange={(e) => {
                const cur = Array.isArray(condition.value) ? [...condition.value] : ['', ''];
                cur[1] = e.target.value;
                onChange({ ...condition, value: cur });
              }}
            />
          </>
        )}
        {needsValue && !useOptions && !isBetween && (
          <input
            type="number"
            className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm w-24"
            value={condition.value ?? ''}
            onChange={(e) => onChange({ ...condition, value: e.target.value })}
          />
        )}
        {canRemove ? (
          <button type="button" className="p-1.5 text-red-600 hover:bg-red-50 rounded" onClick={onRemove}>
            <Trash2 className="h-4 w-4" />
          </button>
        ) : null}
      </div>
      {needsValue && useOptions && multi && options.length ? (
        <div className="space-y-1 rounded-lg border border-gray-300 bg-white p-2">
          {options.map((o) => (
            <label key={o.id} className="flex items-start gap-2 text-sm text-gray-800">
              <input
                type="checkbox"
                className="mt-0.5"
                checked={selectedIds.includes(o.id)}
                onChange={() => toggleOption(o.id)}
              />
              <span>{o.label}</span>
            </label>
          ))}
        </div>
      ) : null}
      {needsValue && useOptions && !options.length ? (
        <p className="text-xs text-amber-700">That question has no options to pick from.</p>
      ) : null}
    </div>
  );
}

function RuleEditor({ title, rule, onChange, onClear, sources }) {
  if (!rule) {
    return (
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-gray-600">{title}: none</p>
        <button
          type="button"
          className="text-sm font-semibold text-green-700 hover:underline"
          onClick={() => onChange(emptyRule(sources[0]?.id))}
        >
          Add rule
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-gray-900">{title}</p>
        <button type="button" className="text-xs font-semibold text-red-600 hover:underline" onClick={onClear}>
          Remove
        </button>
      </div>
      <div className="flex items-center gap-2 text-sm">
        <span className="text-gray-600">Match</span>
        <select
          className="border border-gray-300 rounded-lg px-2 py-1.5 bg-white"
          value={rule.match || 'all'}
          onChange={(e) => onChange({ ...rule, match: e.target.value })}
        >
          <option value="all">ALL conditions</option>
          <option value="any">ANY condition</option>
        </select>
      </div>
      <div className="space-y-2">
        {(rule.conditions || []).map((condition, index) => (
          <ConditionRow
            key={index}
            condition={condition}
            sources={sources}
            canRemove={(rule.conditions || []).length > 1}
            onRemove={() => {
              const next = rule.conditions.filter((_, i) => i !== index);
              onChange({ ...rule, conditions: next });
            }}
            onChange={(nextCondition) => {
              const next = [...rule.conditions];
              next[index] = nextCondition;
              onChange({ ...rule, conditions: next });
            }}
          />
        ))}
      </div>
      <button
        type="button"
        className="inline-flex items-center gap-1 text-sm font-semibold text-green-700"
        onClick={() => onChange({
          ...rule,
          conditions: [...(rule.conditions || []), emptyCondition(sources[0]?.id)],
        })}
      >
        <Plus className="h-4 w-4" />
        Add condition
      </button>
    </div>
  );
}

export default function QuestionLogicPanel({
  question,
  index,
  questions,
  onChange,
  structureLocked = false,
}) {
  const [open, setOpen] = useState(Boolean(hasLogicRules(question)));
  const qid = questionId(question, index);
  const earlier = questions.slice(0, index).map((q, i) => ({
    id: questionId(q, i),
    label: `Q${i + 1}: ${plainSurveyText(q.questionText) || 'Untitled'}`,
    question: q,
  })).filter((s) => allowedOperatorsFor(s.question).length > 0);

  const endSources = [
    ...earlier,
    {
      id: qid,
      label: `Q${index + 1}: this question`,
      question,
    },
  ].filter((s) => allowedOperatorsFor(s.question).length > 0);

  const canShow = index > 0 && question.questionType !== 'attention_check' && earlier.length > 0;
  const canEnd = endSources.length > 0 && allowedOperatorsFor(question).length > 0;
  const carrySources = questions.slice(0, index).map((q, i) => ({
    id: questionId(q, i),
    label: `Q${i + 1}: ${plainSurveyText(q.questionText) || 'Untitled'}`,
    question: q,
  })).filter((s) => OPTIONS_FROM_SOURCE_TYPES.includes(s.question?.questionType));
  const canCarry = index > 0
    && OPTIONS_FROM_TARGET_TYPES.includes(question.questionType)
    && carrySources.length > 0;
  const optionsFrom = normalizeOptionsFrom(question.options_from);

  return (
    <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4 space-y-3">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 text-left"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="inline-flex items-center gap-2 text-sm font-semibold text-gray-900">
          <GitBranch className="h-4 w-4 text-green-700" />
          Logic
          {hasLogicRules(question) ? (
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-bold text-green-800">On</span>
          ) : null}
        </span>
        <span className="text-xs text-gray-500">{open ? 'Hide' : 'Show'}</span>
      </button>
      {open ? (
        <div className="space-y-4">
          {structureLocked ? (
            <p className="text-xs text-amber-700">
              Structure is locked on this published survey. You can still edit routing rules, then save.
            </p>
          ) : null}
          {canShow ? (
            <RuleEditor
              title="Show this question only if"
              rule={question.show_if || null}
              sources={earlier}
              onClear={() => onChange('show_if', null)}
              onChange={(rule) => onChange('show_if', rule)}
            />
          ) : (
            <p className="text-xs text-gray-500">
              {index === 0
                ? 'The first question cannot have a Show rule.'
                : question.questionType === 'attention_check'
                  ? 'Attention checks are always shown.'
                  : 'Add an earlier choice/scale/text question to use a Show rule.'}
            </p>
          )}
          {canCarry ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-gray-900">Answer options from earlier question</p>
                {optionsFrom ? (
                  <button
                    type="button"
                    className="text-xs font-medium text-red-600 hover:text-red-700"
                    onClick={() => onChange('options_from', null)}
                  >
                    Clear
                  </button>
                ) : null}
              </div>
              <p className="text-xs text-gray-500">
                This question’s choices become the options the respondent picked (or didn’t pick) earlier.
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                <select
                  className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm bg-white"
                  value={optionsFrom?.question || ''}
                  onChange={(e) => {
                    const nextId = e.target.value;
                    if (!nextId) {
                      onChange('options_from', null);
                      return;
                    }
                    onChange('options_from', {
                      question: nextId,
                      mode: optionsFrom?.mode || 'selected',
                    });
                  }}
                >
                  <option value="">Off — use fixed options</option>
                  {carrySources.map((s) => (
                    <option key={s.id} value={s.id}>{s.label}</option>
                  ))}
                </select>
                <select
                  className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm bg-white"
                  disabled={!optionsFrom}
                  value={optionsFrom?.mode || 'selected'}
                  onChange={(e) => {
                    if (!optionsFrom) return;
                    onChange('options_from', {
                      question: optionsFrom.question,
                      mode: e.target.value,
                    });
                  }}
                >
                  <option value="selected">Their selected options</option>
                  <option value="unselected">Options they did not select</option>
                </select>
              </div>
              {hasOptionsFrom(question) ? (
                <p className="text-xs text-green-800 bg-green-50 border border-green-100 rounded-lg px-2.5 py-2">
                  Fixed answer options are turned off for this question. If nothing carries forward, the question is skipped.
                </p>
              ) : null}
            </div>
          ) : (
            <p className="text-xs text-gray-500">
              {index === 0
                ? 'The first question cannot carry forward options.'
                : !OPTIONS_FROM_TARGET_TYPES.includes(question.questionType)
                  ? 'Carry-forward options only work on single or multiple choice.'
                  : 'Add an earlier choice or Likert question to carry options forward.'}
            </p>
          )}
          {canEnd ? (
            <RuleEditor
              title="End the survey after this question if"
              rule={question.end_after_if || null}
              sources={endSources}
              onClear={() => onChange('end_after_if', null)}
              onChange={(rule) => onChange('end_after_if', rule)}
            />
          ) : (
            <p className="text-xs text-gray-500">This question type cannot carry an End rule.</p>
          )}
        </div>
      ) : null}
    </div>
  );
}

export function logicBadge(question) {
  return hasLogicRules(question);
}

export function optionDisplay(option) {
  return optionLabel(option);
}
