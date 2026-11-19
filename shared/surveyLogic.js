/**
 * Shared survey logic engine (browser + server).
 * Rules reference question ids and option ids. Answers may be labels or ids.
 */

export const OPS = {
  single_checkbox: ['is', 'is_not', 'is_any_of', 'is_none_of'],
  attention_check: [], // cannot trigger
  multiple_checkbox: ['includes', 'does_not_include', 'includes_any_of', 'includes_all_of'],
  likert: ['equals', 'not_equals', 'greater_than', 'at_least', 'less_than', 'at_most', 'between'],
  slider: ['equals', 'not_equals', 'greater_than', 'at_least', 'less_than', 'at_most', 'between'],
  text_short: ['was_answered', 'was_not_answered'],
  text_long: ['was_answered', 'was_not_answered'],
  matrix_radio: [], // cannot trigger
};

const OPTIONAL_OPS = ['was_answered', 'was_skipped'];

export function newOptionId() {
  return `opt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

export function optionLabel(option) {
  if (option == null) return '';
  if (typeof option === 'string') return option.trim();
  if (typeof option === 'object') return String(option.label ?? option.text ?? '').trim();
  return String(option).trim();
}

export function optionId(option) {
  if (option == null) return '';
  if (typeof option === 'string') return option.trim();
  if (typeof option === 'object' && option.id != null) return String(option.id);
  return optionLabel(option);
}

export function normalizeOptions(options) {
  if (!Array.isArray(options)) return [];
  return options.map((opt) => {
    if (opt && typeof opt === 'object' && !Array.isArray(opt)) {
      const label = optionLabel(opt);
      const id = opt.id != null && String(opt.id).trim() ? String(opt.id) : newOptionId();
      return { id, label };
    }
    const label = String(opt ?? '').trim();
    return { id: newOptionId(), label };
  }).filter((o) => o.label);
}

/** Keep existing ids when remapping labels for persistence. */
export function normalizeOptionsPreservingIds(options, previous = []) {
  const prevByLabel = new Map();
  const prevById = new Map();
  for (const opt of normalizeOptions(previous)) {
    prevByLabel.set(opt.label, opt.id);
    prevById.set(opt.id, opt);
  }
  if (!Array.isArray(options)) return [];
  return options.map((opt) => {
    if (opt && typeof opt === 'object' && !Array.isArray(opt)) {
      const label = optionLabel(opt);
      if (!label) return null;
      const id = opt.id != null && String(opt.id).trim()
        ? String(opt.id)
        : (prevByLabel.get(label) || newOptionId());
      return { id, label };
    }
    const label = String(opt ?? '').trim();
    if (!label) return null;
    return { id: prevByLabel.get(label) || newOptionId(), label };
  }).filter(Boolean);
}

export function questionId(question, index) {
  if (question?._id != null) return String(question._id);
  if (question?.id != null) return String(question.id);
  return `q_idx_${index}`;
}

export function hasLogicRules(question) {
  return Boolean(question?.show_if || question?.end_after_if);
}

export function surveyHasLogic(questions) {
  return (questions || []).some(hasLogicRules);
}

const remapRuleQuestionIds = (rule, idMap) => {
  if (!rule || !Array.isArray(rule.conditions)) return rule || null;
  return {
    match: rule.match === 'any' ? 'any' : 'all',
    conditions: rule.conditions.map((c) => ({
      ...c,
      question: idMap.get(String(c?.question || '')) || String(c?.question || ''),
    })),
  };
};

/**
 * Give every question a stable _id (same scheme as questionId) and rewrite
 * show_if / end_after_if condition.question refs so preview/engine always match.
 */
export function stabilizeLogicQuestions(questions) {
  const list = Array.isArray(questions) ? questions : [];
  const idMap = new Map();
  list.forEach((q, i) => {
    const stable = questionId(q, i);
    idMap.set(stable, stable);
    if (q?._id != null) idMap.set(String(q._id), stable);
    if (q?.id != null) idMap.set(String(q.id), stable);
    idMap.set(`q_idx_${i}`, stable);
    idMap.set(`preview_q_${i + 1}`, stable);
  });
  return list.map((q, i) => {
    const stableId = questionId(q, i);
    const next = {
      ...q,
      _id: stableId,
    };
    if (q.show_if) next.show_if = remapRuleQuestionIds(q.show_if, idMap);
    else next.show_if = null;
    if (q.end_after_if) next.end_after_if = remapRuleQuestionIds(q.end_after_if, idMap);
    else next.end_after_if = null;
    return next;
  });
}

export function computeLogicCredits(fullCredits, answeredCount, questionCount) {
  const X = Math.max(0, Number(fullCredits) || 0);
  const answered = Math.max(0, Number(answeredCount) || 0);
  const total = Math.max(0, Number(questionCount) || 0);
  if (total <= 1) return Math.ceil(X);
  if (answered >= 2) return Math.ceil(X);
  return Math.ceil(0.25 * X);
}

function isBlankAnswer(value) {
  if (value == null) return true;
  if (typeof value === 'string') return !value.trim();
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') {
    const keys = Object.keys(value);
    if (!keys.length) return true;
    return keys.every((k) => value[k] == null || value[k] === '');
  }
  return false;
}

function resolveAnswerToOptionIds(question, rawAnswer) {
  const opts = normalizeOptions(question?.options || []);
  const byLabel = new Map(opts.map((o) => [o.label, o.id]));
  const byId = new Set(opts.map((o) => o.id));

  const toId = (piece) => {
    const s = String(piece ?? '').trim();
    if (!s) return null;
    if (byId.has(s)) return s;
    if (byLabel.has(s)) return byLabel.get(s);
    // Likert answers are often "1","2",… (1-based index)
    const asNum = Number(s);
    if (Number.isFinite(asNum) && question?.questionType === 'likert') {
      const idx = asNum - 1;
      if (idx >= 0 && idx < opts.length) return opts[idx].id;
    }
    return s;
  };

  if (Array.isArray(rawAnswer)) {
    return rawAnswer.map(toId).filter(Boolean);
  }
  if (rawAnswer == null || rawAnswer === '') return [];
  const id = toId(rawAnswer);
  return id ? [id] : [];
}

function numericAnswer(question, rawAnswer) {
  if (rawAnswer == null || rawAnswer === '') return null;
  if (question?.questionType === 'likert') {
    const n = Number(rawAnswer);
    if (Number.isFinite(n)) return n;
    const opts = normalizeOptions(question.options || []);
    const ids = resolveAnswerToOptionIds(question, rawAnswer);
    if (ids.length) {
      const idx = opts.findIndex((o) => o.id === ids[0]);
      if (idx >= 0) return idx + 1;
    }
    return null;
  }
  if (question?.questionType === 'slider') {
    const n = Number(rawAnswer);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function asValueList(value) {
  if (Array.isArray(value)) return value.map((v) => String(v));
  if (value == null || value === '') return [];
  return [String(value)];
}

function evaluateCondition(condition, ctx) {
  const { questionsById, answersByQuestionId, visibleIds } = ctx;
  const sourceId = String(condition?.question || '');
  const op = condition?.op;
  const source = questionsById.get(sourceId);
  if (!source || !op) return false;

  const sourceVisible = visibleIds.has(sourceId);
  const raw = typeof answersByQuestionId?.get === 'function'
    ? answersByQuestionId.get(sourceId)
    : answersByQuestionId?.[sourceId];
  const unanswered = !sourceVisible || isBlankAnswer(raw);

  if (op === 'was_not_answered' || op === 'was_skipped') {
    return unanswered;
  }
  if (op === 'was_answered') {
    return !unanswered;
  }

  // Spec: reading from hidden/unanswered → false for all other operators
  if (!sourceVisible || unanswered) return false;

  const type = source.questionType;
  const answerIds = resolveAnswerToOptionIds(source, raw);
  const values = asValueList(condition.value);
  const num = numericAnswer(source, raw);

  switch (op) {
    case 'is': {
      const want = resolveAnswerToOptionIds(source, values[0]);
      return answerIds.length === 1 && want.length === 1 && answerIds[0] === want[0];
    }
    case 'is_not': {
      const want = resolveAnswerToOptionIds(source, values[0]);
      return !(answerIds.length === 1 && want.length === 1 && answerIds[0] === want[0]);
    }
    case 'is_any_of': {
      const want = resolveAnswerToOptionIds(source, values);
      return answerIds.some((id) => want.includes(id));
    }
    case 'is_none_of': {
      const want = resolveAnswerToOptionIds(source, values);
      return !answerIds.some((id) => want.includes(id));
    }
    case 'includes': {
      const want = resolveAnswerToOptionIds(source, values[0]);
      return want.some((id) => answerIds.includes(id));
    }
    case 'does_not_include': {
      const want = resolveAnswerToOptionIds(source, values[0]);
      return !want.some((id) => answerIds.includes(id));
    }
    case 'includes_any_of': {
      const want = resolveAnswerToOptionIds(source, values);
      return want.some((id) => answerIds.includes(id));
    }
    case 'includes_all_of': {
      const want = resolveAnswerToOptionIds(source, values);
      return want.every((id) => answerIds.includes(id));
    }
    case 'equals':
      return num != null && Number(values[0]) === num;
    case 'not_equals':
      return num != null && Number(values[0]) !== num;
    case 'greater_than':
      return num != null && num > Number(values[0]);
    case 'at_least':
      return num != null && num >= Number(values[0]);
    case 'less_than':
      return num != null && num < Number(values[0]);
    case 'at_most':
      return num != null && num <= Number(values[0]);
    case 'between': {
      if (num == null) return false;
      const a = Number(values[0]);
      const b = Number(values[1]);
      if (!Number.isFinite(a) || !Number.isFinite(b)) return false;
      const lo = Math.min(a, b);
      const hi = Math.max(a, b);
      return num >= lo && num <= hi;
    }
    default:
      return false;
  }
}

function evaluateRule(rule, ctx) {
  if (!rule || !Array.isArray(rule.conditions) || !rule.conditions.length) return false;
  const match = rule.match === 'any' ? 'any' : 'all';
  const results = rule.conditions.map((c) => evaluateCondition(c, ctx));
  return match === 'any' ? results.some(Boolean) : results.every(Boolean);
}

/**
 * Evaluate visibility top-to-bottom.
 * answers: map of questionId → raw answer (or questionText → answer; we also accept that via answersByText)
 */
export function evaluateSurveyLogic(questions, answersByQuestionId = {}) {
  const list = Array.isArray(questions) ? questions : [];
  const questionsById = new Map();
  list.forEach((q, i) => {
    const qid = questionId(q, i);
    questionsById.set(qid, q);
    // Alias keys so rules written before stabilize / preview still resolve.
    questionsById.set(`q_idx_${i}`, q);
    questionsById.set(`preview_q_${i + 1}`, q);
    if (q?._id != null) questionsById.set(String(q._id), q);
    if (q?.id != null) questionsById.set(String(q.id), q);
  });

  const visibleIds = new Set();
  const hiddenIds = new Set();
  let endedEarly = false;
  let endedAtQuestion = null;
  let endIndex = list.length - 1;

  for (let i = 0; i < list.length; i += 1) {
    const q = list[i];
    const qid = questionId(q, i);

    if (endedEarly) {
      hiddenIds.add(qid);
      continue;
    }

    const isAttention = q.questionType === 'attention_check';
    let show = true;
    if (isAttention) {
      show = true;
    } else if (i === 0) {
      show = true;
    } else if (q.show_if) {
      const ctx = { questionsById, answersByQuestionId, visibleIds };
      show = evaluateRule(q.show_if, ctx);
    }

    if (!show) {
      hiddenIds.add(qid);
      continue;
    }

    visibleIds.add(qid);

    if (q.end_after_if) {
      // End rule may reference this question and earlier ones
      const ctx = { questionsById, answersByQuestionId, visibleIds };
      if (evaluateRule(q.end_after_if, ctx)) {
        endedEarly = true;
        endedAtQuestion = qid;
        endIndex = i;
      }
    }
  }

  return {
    visibleIds: [...visibleIds],
    hiddenIds: [...hiddenIds],
    endedEarly,
    endedAtQuestion,
    endIndex,
  };
}

export function countAnsweredVisible(questions, answersByQuestionId, visibleIds) {
  const visible = new Set(visibleIds);
  let count = 0;
  (questions || []).forEach((q, i) => {
    const qid = questionId(q, i);
    if (!visible.has(qid)) return;
    if (!isBlankAnswer(answersByQuestionId[qid] ?? answersByQuestionId.get?.(qid))) count += 1;
  });
  return count;
}

/** Build answers keyed by question id from responses keyed by question text. */
export function answersByIdFromTextResponses(questions, responses) {
  const map = {};
  (questions || []).forEach((q, i) => {
    const qid = questionId(q, i);
    const text = q.questionText;
    let val;
    if (responses && typeof responses === 'object') {
      if (Object.prototype.hasOwnProperty.call(responses, text)) val = responses[text];
      else if (Object.prototype.hasOwnProperty.call(responses, qid)) val = responses[qid];
      else {
        // stored keys may use fullwidth dots
        const stored = String(text || '').replace(/\./g, '．');
        if (Object.prototype.hasOwnProperty.call(responses, stored)) val = responses[stored];
      }
    }
    map[qid] = val;
  });
  return map;
}

export function filterResponsesToVisible(questions, responses, visibleIds) {
  const visible = new Set(visibleIds);
  const out = {};
  (questions || []).forEach((q, i) => {
    const qid = questionId(q, i);
    if (!visible.has(qid)) return;
    const text = q.questionText;
    if (responses && Object.prototype.hasOwnProperty.call(responses, text)) {
      out[text] = responses[text];
    } else if (responses && Object.prototype.hasOwnProperty.call(responses, qid)) {
      out[text] = responses[qid];
    }
  });
  return out;
}

export function allowedOperatorsFor(question) {
  if (!question) return [];
  if (question.questionType === 'matrix_radio' || question.questionType === 'attention_check') {
    return [];
  }
  const base = OPS[question.questionType] || [];
  if (question.isRequired === false) {
    const extra = OPTIONAL_OPS.filter((op) => !base.includes(op));
    return [...base, ...extra];
  }
  return base;
}

export function validateLogicOnQuestions(questions) {
  const errors = [];
  const warnings = [];
  const list = Array.isArray(questions) ? questions : [];
  const ids = new Set(list.map((q, i) => questionId(q, i)));

  list.forEach((q, index) => {
    const qid = questionId(q, index);
    const earlier = list.slice(0, index);
    const earlierIds = new Set(earlier.map((eq, i) => questionId(eq, i)));

    const checkRule = (rule, kind) => {
      if (!rule) return;
      if (!Array.isArray(rule.conditions) || !rule.conditions.length) {
        errors.push(`Question ${index + 1}: ${kind} rule needs at least one condition.`);
        return;
      }
      if (rule.match !== 'all' && rule.match !== 'any') {
        errors.push(`Question ${index + 1}: ${kind} rule match must be all or any.`);
      }
      rule.conditions.forEach((c, ci) => {
        const srcId = String(c?.question || '');
        if (!srcId || !ids.has(srcId)) {
          errors.push(`Question ${index + 1}: ${kind} condition ${ci + 1} references a missing question.`);
          return;
        }
        const allowedSource = kind === 'end'
          ? (earlierIds.has(srcId) || srcId === qid)
          : earlierIds.has(srcId);
        if (!allowedSource) {
          errors.push(`Question ${index + 1}: ${kind} can only read earlier questions${kind === 'end' ? ' (or itself)' : ''}.`);
          return;
        }
        const source = list.find((sq, si) => questionId(sq, si) === srcId);
        if (!source) return;
        if (source.questionType === 'matrix_radio' || source.questionType === 'attention_check') {
          errors.push(`Question ${index + 1}: rules cannot read matrix or attention-check questions.`);
          return;
        }
        const allowed = allowedOperatorsFor(source);
        if (!allowed.includes(c.op)) {
          errors.push(`Question ${index + 1}: operator "${c.op}" is not valid for that question type.`);
          return;
        }
        if (c.op === 'was_answered' || c.op === 'was_not_answered' || c.op === 'was_skipped') return;
        if (c.op === 'between') {
          const vals = asValueList(c.value);
          if (vals.length < 2 || vals.some((v) => v === '')) {
            errors.push(`Question ${index + 1}: between needs two values.`);
          }
          return;
        }
        const needsOption = ['is', 'is_not', 'is_any_of', 'is_none_of', 'includes', 'does_not_include', 'includes_any_of', 'includes_all_of'].includes(c.op);
        if (needsOption) {
          const vals = asValueList(c.value);
          if (!vals.length) {
            errors.push(`Question ${index + 1}: condition value is empty.`);
            return;
          }
          const optIds = new Set(normalizeOptions(source.options || []).map((o) => o.id));
          if (vals.some((v) => !optIds.has(String(v)))) {
            errors.push(`Question ${index + 1}: condition references an option that no longer exists.`);
          }
        } else if (c.value == null || c.value === '') {
          errors.push(`Question ${index + 1}: condition value is empty.`);
        }
      });
    };

    if (q.show_if) {
      if (index === 0) errors.push('The first question cannot have a Show rule.');
      if (q.questionType === 'attention_check') errors.push('Attention checks cannot have a Show rule.');
      checkRule(q.show_if, 'Show');
    }
    if (q.end_after_if) {
      checkRule(q.end_after_if, 'end');
      if (index === list.length - 1) {
        warnings.push(`Question ${index + 1}: End rule on the last question does nothing.`);
      }
      if (index >= 1) {
        warnings.push(`Question ${index + 1}: End rule after Q1 still pays full credits (2+ answers).`);
      }
    }
  });

  return { ok: errors.length === 0, errors, warnings };
}
