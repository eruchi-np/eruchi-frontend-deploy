/** Staff with the surveys permission can edit at any time. */
export const isEditable = () => true;

export const isScheduled = (startDate) => {
  if (!startDate) return false;
  return new Date(startDate) > new Date();
};

export const formatCreatedAt = (createdAt) => {
  if (!createdAt) return "—";
  return new Date(createdAt).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

export const surveyPublishDate = (survey) => survey?.startDate || survey?.createdAt || null;

export const dateKey = (value) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};
