import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { brandAPI } from '../../services/api';
import BrandAuthLayout from './BrandAuthLayout';

export default function BrandAccount({ client }) {
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const logout = async () => {
    await brandAPI.logout({ skipErrorToast: true, skipAuthRedirect: true });
    navigate('/brand/login', { replace: true });
  };

  const onChangePassword = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await brandAPI.changePassword(
        { currentPassword, password },
        { skipAuthRedirect: true, skipErrorToast: true }
      );
      setCurrentPassword('');
      setPassword('');
      setMessage('Password updated.');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update password');
    } finally {
      setBusy(false);
    }
  };

  return (
    <BrandAuthLayout
      title="Brand account"
      copy="These details are locked to your brand login."
      footer={(
        <>
          <Link to="/brand/dashboard">Back to dashboard</Link>
        </>
      )}
    >
      <dl className="space-y-4 text-sm text-gray-800">
        <div>
          <dt className="text-xs uppercase tracking-wide text-gray-500">Email</dt>
          <dd className="mt-1 font-medium">{client?.email}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-gray-500">Brand</dt>
          <dd className="mt-1 font-medium">{client?.brand}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-gray-500">Category</dt>
          <dd className="mt-1 font-medium">{client?.categoryLabel || client?.category}</dd>
        </div>
      </dl>

      <form className="onboard-form mt-8" onSubmit={onChangePassword}>
        <h2 className="text-base font-semibold text-gray-900">Change password</h2>
        <div className="onboard-field">
          <label htmlFor="brand-current-password">Current password</label>
          <div className="onboard-password-wrap">
            <input
              id="brand-current-password"
              type={showCurrent ? 'text' : 'password'}
              autoComplete="current-password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              required
            />
            <button type="button" className="onboard-password-toggle" onClick={() => setShowCurrent((value) => !value)} aria-label={showCurrent ? 'Hide password' : 'Show password'}>
              {showCurrent ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>
        <div className="onboard-field">
          <label htmlFor="brand-new-password">New password</label>
          <div className="onboard-password-wrap">
            <input
              id="brand-new-password"
              type={showNext ? 'text' : 'password'}
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            <button type="button" className="onboard-password-toggle" onClick={() => setShowNext((value) => !value)} aria-label={showNext ? 'Hide password' : 'Show password'}>
              {showNext ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>
        {error ? <p className="onboard-error">{error}</p> : null}
        {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
        <div className="onboard-actions">
          <button type="submit" className="home-pill home-pill-lg home-pill-navy" disabled={busy}>
            {busy ? 'Saving...' : 'Update password'}
          </button>
        </div>
      </form>

      <div className="onboard-actions mt-8">
        <button type="button" className="home-pill home-pill-lg home-pill-navy" onClick={() => navigate('/brand/dashboard')}>Dashboard</button>
        <button type="button" className="rounded-full px-5 py-3 text-sm font-medium text-rose-600 hover:bg-rose-50" onClick={logout}>Logout</button>
      </div>
    </BrandAuthLayout>
  );
}
