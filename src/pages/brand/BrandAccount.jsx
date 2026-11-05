import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { brandAPI } from '../../services/api';
import RuchiLogo from './RuchiLogo';
import { trackRuchi, RuchiEvents } from './ruchiAnalytics';
import './ruchiTokens.css';
import './ruchiShell.css';
import './ruchiAuth.css';

export default function BrandAccount({ client }) {
  const navigate = useNavigate();
  const isStaff = Boolean(client?.viewer);
  const [name, setName] = useState(client?.name || '');
  const [title, setTitle] = useState(client?.title || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [busy, setBusy] = useState(false);
  const [profileBusy, setProfileBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const logout = async () => {
    trackRuchi(RuchiEvents.LOGOUT);
    await brandAPI.logout({ skipErrorToast: true, skipAuthRedirect: true });
    navigate('/brand/login', { replace: true });
  };

  const onSaveProfile = async (event) => {
    event.preventDefault();
    setProfileBusy(true);
    setError('');
    setMessage('');
    try {
      await brandAPI.updateProfile({ name, title }, { skipAuthRedirect: true, skipErrorToast: true });
      setMessage('Profile updated.');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update profile');
    } finally {
      setProfileBusy(false);
    }
  };

  const onChangePassword = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await brandAPI.changePassword(
        { currentPassword, password },
        { skipAuthRedirect: true, skipErrorToast: true },
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
    <div className="ruchi-insights ri-account-page">
      <aside className="ri-account-rail" aria-label="Account navigation">
        <button type="button" className="ri-account-logo" onClick={() => navigate('/brand/dashboard')}>
          <RuchiLogo />
        </button>
        <nav className="ri-account-rail-nav">
          <button type="button" className="is-active">Account</button>
          <button type="button" onClick={() => navigate('/brand/dashboard')}>Dashboard</button>
          {isStaff ? (
            <>
              <button type="button" onClick={() => navigate('/brand/insights')}>Insights CMS</button>
              <button type="button" onClick={() => navigate('/brand/dashboard')}>Metrics</button>
              <a className="ri-account-ext" href="https://eruchi.com.np/login" target="_blank" rel="noreferrer">
                Full eRuchi admin
              </a>
            </>
          ) : null}
        </nav>
        <button type="button" className="ri-account-logout" onClick={logout}>
          Logout
        </button>
      </aside>

      <main className="ri-account-main">
        <header className="ri-account-header">
          <div>
            <p className="ri-rail-label">{isStaff ? 'Staff' : 'Brand portal'}</p>
            <h1>Account</h1>
            <p className="ri-account-lead">
              {isStaff
                ? 'Read-only metrics and insights access for your eRuchi admin login.'
                : 'Update your profile details and password for this brand login.'}
            </p>
          </div>
          {!isStaff && (client?.brand || client?.categoryLabel) ? (
            <div className="ri-account-chips">
              {client?.brand ? <span className="ri-account-chip">{client.brand}</span> : null}
              {client?.categoryLabel || client?.category ? (
                <span className="ri-account-chip">{client.categoryLabel || client.category}</span>
              ) : null}
            </div>
          ) : null}
        </header>

        {error ? <p className="ri-account-banner ri-account-banner-bad" role="alert">{error}</p> : null}
        {message ? <p className="ri-account-banner ri-account-banner-ok" role="status">{message}</p> : null}

        <section className="ri-account-panel">
          <h2>Signed in as</h2>
          <dl className="ri-account-facts">
            <div>
              <dt>Email</dt>
              <dd>{client?.email || '—'}</dd>
            </div>
            {isStaff ? (
              <div>
                <dt>Access</dt>
                <dd>Metrics & insights viewer</dd>
              </div>
            ) : (
              <>
                <div>
                  <dt>Brand</dt>
                  <dd>{client?.brand || '—'}</dd>
                </div>
                <div>
                  <dt>Category</dt>
                  <dd>{client?.categoryLabel || client?.category || '—'}</dd>
                </div>
              </>
            )}
          </dl>
        </section>

        {isStaff ? (
          <section className="ri-account-panel">
            <h2>Quick links</h2>
            <div className="ri-account-quick">
              <button type="button" className="ri-auth-btn ri-auth-btn-primary" onClick={() => navigate('/brand/dashboard')}>
                Metrics
              </button>
              <button type="button" className="ri-auth-btn" onClick={() => navigate('/brand/insights')}>
                Insights CMS
              </button>
              <a className="ri-auth-btn" href="https://eruchi.com.np/login" target="_blank" rel="noreferrer">
                Full eRuchi admin
              </a>
            </div>
          </section>
        ) : (
          <>
            <section className="ri-account-panel">
              <h2>Profile</h2>
              <form className="ri-account-form" onSubmit={onSaveProfile}>
                <label>
                  Name
                  <input
                    id="brand-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                    placeholder="Your name"
                  />
                </label>
                <label>
                  Title
                  <input
                    id="brand-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    autoComplete="organization-title"
                    placeholder="e.g. Brand manager"
                  />
                </label>
                <button type="submit" className="ri-auth-btn ri-auth-btn-primary" disabled={profileBusy}>
                  {profileBusy ? 'Saving…' : 'Save profile'}
                </button>
              </form>
            </section>

            <section className="ri-account-panel">
              <h2>Password</h2>
              <form className="ri-account-form" onSubmit={onChangePassword}>
                <label>
                  Current password
                  <div className="onboard-password-wrap">
                    <input
                      id="brand-current-password"
                      type={showCurrent ? 'text' : 'password'}
                      autoComplete="current-password"
                      value={currentPassword}
                      onChange={(event) => setCurrentPassword(event.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="onboard-password-toggle"
                      onClick={() => setShowCurrent((value) => !value)}
                      aria-label={showCurrent ? 'Hide password' : 'Show password'}
                    >
                      {showCurrent ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </label>
                <label>
                  New password
                  <div className="onboard-password-wrap">
                    <input
                      id="brand-new-password"
                      type={showNext ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      className="onboard-password-toggle"
                      onClick={() => setShowNext((value) => !value)}
                      aria-label={showNext ? 'Hide password' : 'Show password'}
                    >
                      {showNext ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </label>
                <button type="submit" className="ri-auth-btn ri-auth-btn-primary" disabled={busy}>
                  {busy ? 'Saving…' : 'Update password'}
                </button>
              </form>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
