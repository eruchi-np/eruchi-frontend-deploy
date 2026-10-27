import { healthAPI } from '../services/api';

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
    await healthAPI.trackVisitor({
      event,
      page,
      visitorId: getVisitorId(),
    });
  } catch (_) {
  }
};
