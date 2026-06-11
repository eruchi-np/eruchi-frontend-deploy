const getVisitorId = () => {
  let id = localStorage.getItem('eruchi_vid');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('eruchi_vid', id);
  }
  return id;
};

export const trackEvent = async (event, page) => {
  try {
    await fetch(`${import.meta.env.VITE_API_BASE_URL}/analytics/event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, page, visitorId: getVisitorId() }),
    });
  } catch (_) {
  }
};