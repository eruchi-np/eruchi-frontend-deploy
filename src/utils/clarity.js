const PROJECT_ID = import.meta.env.VITE_CLARITY_PROJECT_ID;

export const clarityProjectId = () => (typeof PROJECT_ID === 'string' ? PROJECT_ID.trim() : '');

export const clarityDashboardUrl = () => {
  const id = clarityProjectId();
  return id
    ? `https://clarity.microsoft.com/projects/view/${id}/dashboard`
    : 'https://clarity.microsoft.com/';
};

/** Load the Clarity tag once. No project id means nothing is recorded. */
export function installClarity() {
  const id = clarityProjectId();
  if (!id || typeof window === 'undefined' || window.clarity) return;
  ((c, l, a, r, i) => {
    c[a] = c[a] || function clarityQueue() {
      (c[a].q = c[a].q || []).push(arguments);
    };
    const tag = l.createElement(r);
    tag.async = 1;
    tag.src = `https://www.clarity.ms/tag/${i}`;
    const first = l.getElementsByTagName(r)[0];
    first.parentNode.insertBefore(tag, first);
  })(window, document, 'clarity', 'script', id);
}

/** Tag the session with the account id. Email is not sent. */
export function identifyClarity(userId) {
  if (!clarityProjectId() || typeof window.clarity !== 'function' || !userId) return;
  window.clarity('identify', String(userId));
}
