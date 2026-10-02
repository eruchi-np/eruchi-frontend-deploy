import { useEffect, useRef } from 'react';
import { healthAPI } from '../services/api';
import { getCsrfToken } from './csrf';
import { readAcquisition } from './acquisition';
import { mailClickFromSearch, planSessionArrival } from './mailClick';

const recent = new Map();
const SESSION_KEY = 'eruchi_session_event';
const MAIL_CLICK = 'eruchi_mail_click';
const MAIL_POSTED = 'eruchi_mail_posted';

const postEvent = (event, eventId, refId, detail) => {
  healthAPI.track({
    event,
    eventId,
    refId: refId || undefined,
    detail: detail && Object.keys(detail).length ? detail : undefined,
  }).catch(() => {});
};

/** One row per eventId. A second call with the same id is ignored by the server. */
export function trackHealthEvent(event, { refId, eventId, detail } = {}) {
  const key = `${event}:${refId || ''}:${detail?.field || ''}`;
  const now = Date.now();
  const last = recent.get(key);
  if (!eventId && last && now - last < 1500) return;
  recent.set(key, now);
  const id = eventId || crypto.randomUUID();
  postEvent(event, id, refId, detail);
}

export function healthSessionId() {
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return '';
  }
}

export function trackOnboardingView(step) {
  const sessionId = healthSessionId();
  trackHealthEvent('onboarding_step_viewed', {
    eventId: `view:${step}:${sessionId}`,
    detail: { step, sessionId },
  });
}

export function trackOnboardingSubmit(step) {
  const sessionId = healthSessionId();
  trackHealthEvent('onboarding_step_submitted', {
    eventId: `submit:${step}:${sessionId}`,
    detail: { step, sessionId },
  });
}

export function trackOnboardingError(step, field) {
  const sessionId = healthSessionId();
  trackHealthEvent('onboarding_step_error', {
    eventId: `error:${step}:${field}:${sessionId}`,
    detail: { step, field, sessionId },
  });
}

export function trackSurveyCards(surveys) {
  const sessionId = healthSessionId();
  for (const survey of surveys || []) {
    if (!survey?._id) continue;
    trackHealthEvent('survey_card_viewed', {
      refId: survey._id,
      eventId: `card:${survey._id}${survey.wave ? `:${survey.wave}` : ''}:${sessionId}`,
      detail: { sessionId },
    });
  }
}

/** Starts after the first paint, so a strict-mode remount does not count as leaving. */
export function useSurveyVisit(surveyId, onLeave) {
  const onLeaveRef = useRef(onLeave);
  onLeaveRef.current = onLeave;
  const submitted = useRef(false);
  useEffect(() => {
    if (!surveyId) return undefined;
    let started = false;
    const timer = setTimeout(() => {
      started = true;
      const sessionId = healthSessionId();
      trackHealthEvent('survey_started', {
        refId: surveyId,
        eventId: `start:${surveyId}:${sessionId}`,
        detail: { sessionId },
      });
    }, 0);
    return () => {
      clearTimeout(timer);
      if (!started || submitted.current) return;
      const token = getCsrfToken();
      const sessionId = healthSessionId();
      onLeaveRef.current?.({ sessionId, token });
    };
  }, [surveyId]);
  return () => {
    submitted.current = true;
  };
}

const readSavedClick = () => {
  try {
    const raw = sessionStorage.getItem(MAIL_CLICK);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const postedSendIds = () => {
  try {
    const raw = sessionStorage.getItem(MAIL_POSTED);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
};

const claimSend = (sendId) => {
  const list = postedSendIds();
  if (list.includes(sendId)) return false;
  list.push(sendId);
  sessionStorage.setItem(MAIL_POSTED, JSON.stringify(list));
  return true;
};

const detailFromClick = (click) => {
  const detail = { arrival: true };
  if (click?.source) detail.source = click.source;
  if (click?.medium) detail.medium = click.medium;
  if (click?.sendId) detail.sendId = click.sendId;
  return detail;
};

const sessionPosted = () => {
  try {
    return Boolean(sessionStorage.getItem(`${SESSION_KEY}_posted`));
  } catch {
    return false;
  }
};

/** Keep a mail send id as soon as the tagged page opens, before login changes the address. */
export function rememberMailClick(search = '') {
  try {
    const click = mailClickFromSearch(search);
    if (!click) return;
    sessionStorage.setItem(MAIL_CLICK, JSON.stringify(click));
    const plan = planSessionArrival({
      search,
      saved: click,
      sessionPosted: sessionPosted(),
      postedSendIds: postedSendIds(),
    });
    if (plan.kind !== 'mail' || !plan.click?.sendId || !claimSend(plan.click.sendId)) return;
    trackHealthEvent('session_start', {
      eventId: `mail:${plan.click.sendId}`,
      detail: detailFromClick(plan.click),
    });
  } catch {
    // private mode can block sessionStorage; skip rather than break navigation
  }
}

/** One session per browser tab. A refresh reuses the same id. A later mail link records its own arrival. */
export function trackSessionStart() {
  try {
    const eventId = healthSessionId();
    if (!eventId) return;
    const search = window.location.search;
    const posted = sessionPosted();
    const plan = planSessionArrival({
      search,
      saved: readSavedClick(),
      sessionPosted: posted,
      postedSendIds: postedSendIds(),
    });
    if (!posted) {
      sessionStorage.setItem(`${SESSION_KEY}_posted`, '1');
      if (plan.click?.sendId) claimSend(plan.click.sendId);
      trackHealthEvent('session_start', { eventId, detail: detailFromClick(plan.click) });
      return;
    }
    if (plan.kind !== 'mail' || !plan.click?.sendId || !claimSend(plan.click.sendId)) return;
    trackHealthEvent('session_start', {
      eventId: `mail:${plan.click.sendId}`,
      detail: detailFromClick(plan.click),
    });
  } catch {
    // private mode can block sessionStorage; skip rather than break login
  }
}

export function clearHealthSession() {
  try {
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(`${SESSION_KEY}_posted`);
    sessionStorage.removeItem(MAIL_CLICK);
    sessionStorage.removeItem(MAIL_POSTED);
  } catch {
    // ignore
  }
}

const VISITOR_KEY = 'eruchi_visitor';
const VISIT_POSTED = 'eruchi_visit_posted';
const VISIT_TAGGED = 'eruchi_visit_tagged';
let visitInFlight = false;

export function readVisitorId() {
  try {
    return localStorage.getItem(VISITOR_KEY);
  } catch {
    return null;
  }
}

function visitorId() {
  try {
    let id = localStorage.getItem(VISITOR_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
  } catch {
    return '';
  }
}

function postLandingVisit(pathname, acquisition) {
  const id = visitorId();
  if (!id) return;
  visitInFlight = true;
  healthAPI.visit({
    visitorId: id,
    path: pathname || '/',
    ...(acquisition ? { acquisition } : {}),
  }).then(() => {
    localStorage.setItem(VISIT_POSTED, '1');
    visitInFlight = false;
    if (acquisition) localStorage.setItem(VISIT_TAGGED, '1');
    const latest = readAcquisition();
    if (!localStorage.getItem(VISIT_TAGGED) && latest) postLandingVisit(pathname, latest);
  }).catch(() => {
    visitInFlight = false;
  });
}

/**
 * First page of a logged-out browser. A later page does not replace it.
 * A first real campaign tag can still be written onto a visit that has none.
 */
export function rememberLandingVisit(pathname) {
  try {
    if (localStorage.getItem('access_token')) {
      localStorage.setItem(VISIT_POSTED, '1');
      localStorage.setItem(VISIT_TAGGED, '1');
      return;
    }
    const acquisition = readAcquisition();
    if (localStorage.getItem(VISIT_POSTED)) {
      if (!acquisition || localStorage.getItem(VISIT_TAGGED) || visitInFlight) return;
      postLandingVisit(pathname, acquisition);
      return;
    }
    if (visitInFlight) return;
    postLandingVisit(pathname, acquisition);
  } catch {
    visitInFlight = false;
  }
}
