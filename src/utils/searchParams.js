export function parsePage(value) {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

export function writeSearchParams(setSearchParams, patch, defaults = {}) {
  setSearchParams((prev) => {
    const next = new URLSearchParams(prev);
    Object.entries(patch).forEach(([key, value]) => {
      const fallback = defaults[key];
      const isDefault =
        value === undefined ||
        value === null ||
        value === '' ||
        value === fallback ||
        (key === 'page' && Number(value) === 1);
      if (isDefault) next.delete(key);
      else next.set(key, String(value));
    });
    return next;
  }, { replace: true });
}
