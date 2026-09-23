import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Loader2 } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const CATEGORIES = [
  {
    key: 'notifications',
    label: 'In-app notification emails',
    description: 'Product delivery, survey invites, and other activity updates.',
  },
  {
    key: 'reminders',
    label: 'Reminder emails',
    description: 'Survey reminders, profile nudges, expiry warnings, and win-back messages.',
  },
  {
    key: 'promotional',
    label: 'Promotional emails',
    description: 'News, offers, and other marketing from eRuchi.',
  },
];

const Unsubscribe = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [status, setStatus] = useState('loading'); // loading | ready | saving | done | error
  const [email, setEmail] = useState('');
  const [prefs, setPrefs] = useState({
    notifications: true,
    reminders: true,
    promotional: false,
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setError('This unsubscribe link is missing or invalid. Open the link from your email.');
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/auth/email-preferences`, {
          params: { token },
        });
        if (cancelled) return;
        setEmail(res.data.data.email);
        setPrefs(res.data.data.preferences);
        setStatus('ready');
      } catch (err) {
        if (cancelled) return;
        setStatus('error');
        setError(err.response?.data?.message || 'Could not load email preferences.');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const toggle = (key) => {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const onConfirm = async (e) => {
    e.preventDefault();
    setStatus('saving');
    setError('');
    try {
      const res = await axios.put(`${API_BASE_URL}/auth/email-preferences`, {
        token,
        ...prefs,
      });
      setPrefs(res.data.data.preferences);
      setMessage(res.data.message);
      setStatus('done');
    } catch (err) {
      setStatus('ready');
      setError(err.response?.data?.message || 'Could not save preferences.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Email preferences</h1>
        <p className="text-sm text-gray-500 mb-6">
          Choose which emails you want from eRuchi.
          {email ? (
            <>
              {' '}
              Managing <span className="font-medium text-gray-700">{email}</span>.
            </>
          ) : null}
        </p>

        {status === 'loading' && (
          <div className="flex flex-col items-center py-8 text-gray-600">
            <Loader2 className="w-10 h-10 animate-spin text-[#00c4cc] mb-3" />
            <p>Loading your preferences…</p>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center py-4">
            <p className="text-red-600 mb-4">{error}</p>
            <Link to="/" className="text-[#00c4cc] hover:underline text-sm">
              Back to eRuchi
            </Link>
          </div>
        )}

        {(status === 'ready' || status === 'saving') && (
          <form onSubmit={onConfirm} className="space-y-4">
            {CATEGORIES.map((cat) => (
              <label
                key={cat.key}
                className="flex gap-3 items-start p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4"
                  checked={Boolean(prefs[cat.key])}
                  onChange={() => toggle(cat.key)}
                  disabled={status === 'saving'}
                />
                <span>
                  <span className="block text-sm font-semibold text-gray-900">{cat.label}</span>
                  <span className="block text-xs text-gray-500 mt-0.5">{cat.description}</span>
                </span>
              </label>
            ))}

            {error && <p className="text-sm text-red-600">{error}</p>}

            <p className="text-sm text-gray-600">
              Confirm you want to update which emails you receive.
            </p>

            <button
              type="submit"
              disabled={status === 'saving'}
              className="w-full py-3 rounded-full bg-[#0e1b10] text-white font-semibold text-sm disabled:opacity-60"
            >
              {status === 'saving' ? (
                <span className="inline-flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving…
                </span>
              ) : (
                'Confirm preferences'
              )}
            </button>
          </form>
        )}

        {status === 'done' && (
          <div className="text-center py-2">
            <p className="text-gray-700 mb-6">{message}</p>
            <Link to="/" className="text-[#00c4cc] hover:underline text-sm font-medium">
              Back to eRuchi
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Unsubscribe;
