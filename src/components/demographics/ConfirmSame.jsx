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
  return (
    <button
      type="button"
      onClick={onConfirm}
      disabled={confirmed}
      className="mt-2 text-sm font-medium text-[var(--navy)] underline disabled:no-underline disabled:text-[var(--muted)]"
    >
      {confirmed ? 'Same confirmed' : 'Confirm same'}
    </button>
  );
};

export default ConfirmSame;
