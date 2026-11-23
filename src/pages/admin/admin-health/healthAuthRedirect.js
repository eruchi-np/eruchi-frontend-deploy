/** Where Platform Health should send the browser after a failed snapshot load. */
export function healthLoadFailureRedirect(status) {
  if (status === 401) {
    return {
      to: '/login',
      remember: '/admin/health',
      state: { from: { pathname: '/admin/health' } },
    };
  }
  if (status === 403) {
    return { to: '/admin', remember: null, state: null };
  }
  return null;
}
