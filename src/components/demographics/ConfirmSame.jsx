const norm = (value) => {
  if (Array.isArray(value)) return [...value].map(String).sort().join('\u0001');
  if (value === null) return '\0null';
  if (value === undefined) return '';
  return String(value);
};

export const valuesMatch = (saved, current) => norm(saved) === norm(current);

export const hasSavedValue = (value) => {
  if (Array.isArray(value)) return value.length > 0;
  if (value === null) return true;
  return value !== undefined && String(value).trim() !== '';
};

const ConfirmSame = ({ saved, value, confirmed, onConfirm }) => {
  if (!hasSavedValue(saved)) return null;
  if (!valuesMatch(saved, value)) {
    return <p className="text-sm text-[var(--muted)] mt-2">Updated</p>;
  }
  if (confirmed) {
    return <p className="confirm-same-done">Same confirmed</p>;
  }
  return (
    <button
      type="button"
      onClick={onConfirm}
      className="home-pill home-pill-sm home-pill-blue confirm-same"
    >
      Confirm same
    </button>
  );
};

export default ConfirmSame;
