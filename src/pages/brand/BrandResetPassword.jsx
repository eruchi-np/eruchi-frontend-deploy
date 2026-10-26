import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { brandAPI } from '../../services/api';
import BrandAuthLayout from './BrandAuthLayout';

export default function BrandResetPassword() {
  const { resetToken } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await brandAPI.resetPassword(resetToken, { password }, { skipAuthRedirect: true, skipErrorToast: true });
      navigate('/brand/login', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update password');
    } finally {
      setBusy(false);
    }
  };

  return (
    <BrandAuthLayout
      title="Choose a new password"
      copy="Pick a new password for your brand dashboard."
      footer={(
        <>
          Back to <Link to="/brand/login">sign in</Link>
        </>
      )}
    >
      <form className="onboard-form" onSubmit={onSubmit}>
        <div className="onboard-field">
          <label htmlFor="brand-reset-password">New password</label>
          <div className="onboard-password-wrap">
            <input
              id="brand-reset-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
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
          <button type="submit" className="home-pill home-pill-lg home-pill-navy" disabled={busy}>{busy ? 'Saving...' : 'Update password'}</button>
        </div>
      </form>
    </BrandAuthLayout>
  );
}
