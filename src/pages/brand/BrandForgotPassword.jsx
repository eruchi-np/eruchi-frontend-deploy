import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { brandAPI } from '../../services/api';
import BrandAuthLayout from './BrandAuthLayout';

export default function BrandForgotPassword() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [devResetUrl, setDevResetUrl] = useState('');
  const [error, setError] = useState('');

  const onSubmit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    setDevResetUrl('');
    try {
      const { data } = await brandAPI.forgotPassword({ email }, { skipAuthRedirect: true, skipErrorToast: true });
      setDevResetUrl(data?.devResetUrl || '');
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not send reset email');
    } finally {
      setBusy(false);
    }
  };

  return (
    <BrandAuthLayout
      title="Reset brand password"
      copy="Enter the email for your brand account. If it exists, we will send a reset link."
      footer={(
        <>
          Back to <Link to="/brand/login">sign in</Link>
        </>
      )}
    >
      {done ? (
        <div className="space-y-3 text-sm text-gray-700">
          <p>If that email is registered, a password reset link is on its way. Check your inbox.</p>
          {devResetUrl ? (
            <p className="rounded-xl bg-amber-50 px-3 py-2 text-amber-950">
              Local only:{' '}
              <Link
                className="font-medium underline"
                to={(() => {
                  try {
                    return new URL(devResetUrl).pathname;
                  } catch {
                    return devResetUrl;
                  }
                })()}
              >
                open reset link
              </Link>
            </p>
          ) : null}
        </div>
      ) : (
        <form className="onboard-form" onSubmit={onSubmit}>
          <div className="onboard-field">
            <label htmlFor="brand-forgot-email">Email</label>
            <input id="brand-forgot-email" type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </div>
          {error ? <p className="onboard-error">{error}</p> : null}
          <div className="onboard-actions">
            <button type="submit" className="home-pill home-pill-lg home-pill-navy" disabled={busy}>{busy ? 'Sending...' : 'Send reset link'}</button>
          </div>
        </form>
      )}
    </BrandAuthLayout>
  );
}
