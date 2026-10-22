import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { brandAPI } from '../../services/api';
import BrandAuthLayout from './BrandAuthLayout';

export default function BrandLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const onSubmit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await brandAPI.login({ email, password }, { skipAuthRedirect: true, skipErrorToast: true });
      navigate('/brand/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Could not sign in');
    } finally {
      setBusy(false);
    }
  };

  return (
    <BrandAuthLayout
      title="Brand sign in"
      copy="Email and password for your brand dashboard."
      footer={(
        <>
          New brand account? <Link to="/brand/signup">Sign up</Link>
        </>
      )}
    >
      <form className="onboard-form" onSubmit={onSubmit}>
        <div className="onboard-field">
          <label htmlFor="brand-email">Email</label>
          <input id="brand-email" type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required />
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
            <button type="button" className="onboard-password-toggle" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>
        {error ? <p className="onboard-error">{error}</p> : null}
        <div className="onboard-actions">
          <button type="submit" className="home-pill home-pill-lg home-pill-navy" disabled={busy}>{busy ? 'Signing in...' : 'Sign in'}</button>
        </div>
      </form>
    </BrandAuthLayout>
  );
}
