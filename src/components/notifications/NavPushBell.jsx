import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, BellOff, X } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  clearPushPromptDismiss,
  isOneSignalConfigured,
  isPushOptedIn,
  isPushPilotEligible,
  requestPushSubscription,
} from '../../utils/oneSignal';
import { healthSessionId, trackHealthEvent } from '../../utils/healthEvents';
import { userAPI } from '../../services/api';
import './pushPrompt.css';

function formatWhen(iso) {
  if (!iso) return '';
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return '';
  }
}

/**
 * Android-only top-bar bell:
 * - Not subscribed → ask to enable push
 * - Subscribed → show survey reminder history
 */
export default function NavPushBell({ light = false }) {
  const navigate = useNavigate();
  const rootRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [optedIn, setOptedIn] = useState(false);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [items, setItems] = useState([]);
  const [loadingList, setLoadingList] = useState(false);

  const refreshOptIn = useCallback(async () => {
    if (!isOneSignalConfigured() || !isPushPilotEligible()) {
      setReady(true);
      setOptedIn(false);
      return;
    }
    const opt = await isPushOptedIn();
    setOptedIn(opt);
    setReady(true);
  }, []);

  useEffect(() => {
    refreshOptIn();
  }, [refreshOptIn]);

  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const loadList = useCallback(async () => {
    setLoadingList(true);
    try {
      const res = await userAPI.getNotifications({ limit: 20, skipErrorToast: true });
      const rows = res?.data?.data || res?.data || [];
      setItems(Array.isArray(rows) ? rows : []);
    } catch {
      setItems([]);
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    if (open && optedIn) loadList();
  }, [open, optedIn, loadList]);

  if (!ready || !isOneSignalConfigured() || !isPushPilotEligible()) return null;

  const onBellClick = () => setOpen((v) => !v);

  const onEnable = async () => {
    setBusy(true);
    try {
      clearPushPromptDismiss();
      const result = await requestPushSubscription();
      if (result.ok) {
        trackHealthEvent('push_prompt_accepted', {
          detail: {
            sessionId: healthSessionId(),
            platform: 'android',
            source: 'nav_bell',
          },
        });
        setOptedIn(true);
        toast.success('Notifications enabled');
        loadList();
        return;
      }
      if (result.reason === 'denied' || result.reason === 'declined') {
        toast.error('Permission was not granted');
        return;
      }
      toast.error('Could not enable notifications');
    } finally {
      setBusy(false);
      refreshOptIn();
    }
  };

  const openItem = (href) => {
    setOpen(false);
    navigate(href || '/standalone-surveys');
  };

  return (
    <div className="home-nav-push-wrap" ref={rootRef}>
      <button
        type="button"
        className={`home-nav-push ${light ? 'home-nav-push-light' : 'home-nav-push-dark'}`}
        aria-label={optedIn ? 'Survey reminders' : 'Enable notifications'}
        aria-expanded={open}
        onClick={onBellClick}
      >
        {optedIn ? <Bell size={20} strokeWidth={2.2} /> : <BellOff size={20} strokeWidth={2.2} />}
      </button>

      {open ? (
        <div className="nav-push-panel" role="dialog" aria-label="Notifications">
          <div className="nav-push-panel-head">
            <strong>{optedIn ? 'Reminders' : 'Notifications'}</strong>
            <button
              type="button"
              className="nav-push-panel-close"
              aria-label="Close"
              onClick={() => setOpen(false)}
            >
              <X size={16} />
            </button>
          </div>

          {!optedIn ? (
            <div className="nav-push-enable">
              <p>
                Turn on push to get survey reminders on this phone — even when
                you&apos;re not on the site.
              </p>
              <div className="nav-push-enable-actions">
                <button
                  type="button"
                  className="push-prompt-secondary"
                  onClick={() => setOpen(false)}
                  disabled={busy}
                >
                  Not now
                </button>
                <button
                  type="button"
                  className="push-prompt-primary"
                  onClick={onEnable}
                  disabled={busy}
                >
                  {busy ? 'Working…' : 'Enable'}
                </button>
              </div>
              <button
                type="button"
                className="nav-push-profile-link"
                onClick={() => {
                  setOpen(false);
                  navigate('/profile#push-notifications');
                }}
              >
                Manage in Profile
              </button>
            </div>
          ) : (
            <div className="nav-push-list">
              {loadingList ? (
                <p className="nav-push-empty">Loading…</p>
              ) : items.length === 0 ? (
                <p className="nav-push-empty">
                  No survey reminders yet. When we send one, it will show up here.
                </p>
              ) : (
                <ul>
                  {items.map((item) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        className="nav-push-item"
                        onClick={() => openItem(item.href)}
                      >
                        <span className="nav-push-item-title">{item.title}</span>
                        <span className="nav-push-item-body">{item.body}</span>
                        <span className="nav-push-item-meta">{formatWhen(item.sentAt)}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
