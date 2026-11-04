import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { brandAPI } from '../../services/api';
import BrandAuthLayout from './BrandAuthLayout';
import BrandGoogleButton from './BrandGoogleButton';
import { identifyBrandClient, trackRuchi, RuchiEvents } from './ruchiAnalytics';

export default function BrandLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const finishLogin = (client) => {
    identifyBrandClient(client);
    trackRuchi(RuchiEvents.LOGIN, {
      brand: client?.brand || null,
      category: client?.category || null,
      viewer: Boolean(client?.viewer),
    });
    navigate('/brand/dashboard', { replace: true });
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const { data } = await brandAPI.login({ email, password }, { skipAuthRedirect: true, skipErrorToast: true });
      finishLogin(data?.client);
    } catch (err) {
      trackRuchi(RuchiEvents.ERROR, { where: 'login', message: err.response?.data?.message || 'login_failed' });
      setError(err.response?.data?.message || 'Could not sign in');
    } finally {
      setBusy(false);
    }
  };

  const onGoogle = async (credential) => {
    setBusy(true);
    setError('');
    try {
      const { data } = await brandAPI.googleLogin({ credential }, { skipAuthRedirect: true, skipErrorToast: true });
      finishLogin(data?.client);
    } catch (err) {
      trackRuchi(RuchiEvents.ERROR, { where: 'google_login', message: err.response?.data?.message || 'google_failed' });
      setError(err.response?.data?.message || 'Google sign-in failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <BrandAuthLayout
      title="Sign in"
      copy="Brand clients and eRuchi analytics admins can sign in here."
      sideTitle="Your category, every week"
      sideCopy="Clients see their brand. Admins get a read-only metrics and insights viewer."
      footer={(
        <>
          New here? Open the invite link your company shared to activate.
          {' '}
          <span className="text-[var(--ink-3)]">Self-serve signup may still be open — </span>
          <Link to="/brand/signup">create an account</Link>.
        </>
      )}
    >
      <div className="mb-4">
        <BrandGoogleButton onCredential={onGoogle} disabled={busy} />
      </div>
      <div className="ri-auth-or mb-4 flex items-center gap-3 text-xs font-semibold uppercase tracking-wide text-[var(--ink-3)]">
        <span className="h-px flex-1 bg-[var(--line)]" />
        or email
        <span className="h-px flex-1 bg-[var(--line)]" />
      </div>
      <form className="onboard-form" onSubmit={onSubmit}>
        <div className="onboard-field">
          <label htmlFor="brand-email">Email</label>
          <input
            id="brand-email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@company.com"
            required
          />
        </div>
        <div className="onboard-field">
          <label htmlFor="brand-password">Password</label>
          <div className="onboard-password-wrap">
            <input
              id="brand-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            <button
              type="button"
              className="onboard-password-toggle"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          <p className="mt-1 text-sm">
            <Link to="/brand/forgot-password" className="ri-auth-link">Forgot password?</Link>
          </p>
        </div>
        {error ? <p className="onboard-error" role="alert">{error}</p> : null}
        <div className="onboard-actions">
          <button type="submit" className="ri-auth-btn ri-auth-btn-primary" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </div>
      </form>
    </BrandAuthLayout>
  );
}
