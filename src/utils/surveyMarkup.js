const NAMED_ENTITIES = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: '\u00a0',
};

const OPEN_OR_CLOSE = /^<\/?(?:b|i|u)>$/;

export function decodeSurveyEntities(value) {
  return String(value ?? '').replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (entity, body) => {
    const lower = body.toLowerCase();
    if (lower[0] !== '#') {
      return Object.prototype.hasOwnProperty.call(NAMED_ENTITIES, lower) ? NAMED_ENTITIES[lower] : entity;
    }
    const code = lower[1] === 'x' ? Number.parseInt(lower.slice(2), 16) : Number.parseInt(lower.slice(1), 10);
    if (!Number.isFinite(code) || code < 0 || code > 0x10ffff || (code >= 0xd800 && code <= 0xdfff)) return '';
    return String.fromCodePoint(code);
  });
}

// Words respondents see. Tags and edge space do not count.
export function plainSurveyText(value) {
  return decodeSurveyEntities(String(value ?? '').replace(/<[^>]*>/g, ''))
    .replace(/\u00a0/g, ' ')
    .trim();
}

function normalizeTags(input) {
  let s = String(input ?? '')
    .replace(/\u0000/g, '')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '');
  for (let pass = 0; pass < 4; pass += 1) {
    const next = s.replace(/<span\b([^>]*)>([\s\S]*?)<\/span>/gi, (_, attrs, inner) => {
      const style = /style\s*=\s*(?:"([^"]*)"|'([^']*)')/i.exec(attrs);
      const css = (style?.[1] || style?.[2] || '').toLowerCase();
      let wrapped = inner;
      if (/font-weight\s*:\s*(bold|[6-9]00)/.test(css)) wrapped = `<b>${wrapped}</b>`;
      if (/font-style\s*:\s*italic/.test(css)) wrapped = `<i>${wrapped}</i>`;
      if (/text-decoration(?:-line)?\s*:[^;]*underline/.test(css)) wrapped = `<u>${wrapped}</u>`;
      return wrapped;
    });
    if (next === s) break;
    s = next;
  }
  s = s
    .replace(/<\s*(\/?)\s*strong\b[^>]*>/gi, '<$1b>')
    .replace(/<\s*(\/?)\s*em\b[^>]*>/gi, '<$1i>')
    .replace(/<\s*(\/?)\s*(b|i|u)\b[^>]*>/gi, (_, slash, tag) => `<${slash}${tag.toLowerCase()}>`);
  s = s.replace(/<\/?[a-z!][^>]*>/gi, (tag) => (OPEN_OR_CLOSE.test(tag.toLowerCase()) ? tag.toLowerCase() : ''));
  s = s.replace(/<(?!\/?(?:b|i|u)>)/gi, '&lt;');
  return s;
}

// Keeps <b>, <i>, and <u>. Anything else is removed. Plain questions stay plain text.
export function sanitizeSurveyMarkup(input) {
  const normalized = normalizeTags(input).replace(/&nbsp;/gi, ' ').replace(/\u00a0/g, ' ');
  if (!/<\/?(?:b|i|u)>/.test(normalized)) return plainSurveyText(normalized);
  return normalized.replace(/^(?:\s|&nbsp;)+/i, '').replace(/(?:\s|&nbsp;)+$/i, '');
}
