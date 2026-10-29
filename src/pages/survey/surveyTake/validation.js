import { isMatrixComplete } from "../../../components/survey/MatrixQuestion";

export function matrixTouched(val) {
  return (
    val &&
    typeof val === "object" &&
    !Array.isArray(val) &&
    Object.values(val).some((item) => item != null && item !== "")
  );
}

export function toMatrixItem(item, index) {
  if (item && typeof item === "object" && (item.id != null || item.label != null)) {
    const label = String(item.label ?? item.id ?? "");
    const id = String(item.id ?? item.label ?? index);
    return { id, label };
  }
  const label = String(item ?? "");
  return { id: label, label };
}

/** Multi-select options that clear every other choice (and are cleared if another is picked). */
export function isNoneExclusiveOption(label) {
  const s = String(label || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
  if (!s) return false;
  if (
    s === "none" ||
    s === "n/a" ||
    s === "na" ||
    s === "nothing" ||
    s === "not applicable" ||
    s === "none of the above" ||
    s === "none of these" ||
    s === "none of the below" ||
    s === "none of the options"
  ) {
    return true;
  }
  return /^none of\b/.test(s);
}

export function isQuestionAnswered(q, val) {
  if (q.questionType === "multiple_checkbox") {
    return Array.isArray(val) && val.length > 0;
  }
  if (q.questionType === "single_checkbox" || q.questionType === "attention_check") {
    return typeof val === "string" && (q.options || []).includes(val);
  }
  if (q.questionType === "likert") {
    const point = Number(val);
    return Number.isInteger(point) && point >= 1 && point <= (q.options || []).length;
  }
  if (q.questionType === "slider") {
    return val != null && val !== "" && Number.isFinite(Number(val));
  }
  if (q.questionType === "matrix_radio") {
    return isMatrixComplete(val, q.rows || []);
  }
  return Boolean(val && (typeof val !== "string" || val.trim()));
}

export function isQuestionValid(q, val) {
  if (q.isRequired === false) {
    if (q.questionType === "matrix_radio" && matrixTouched(val)) {
      return isMatrixComplete(val, q.rows || []);
    }
    return true;
  }
  return isQuestionAnswered(q, val);
}
