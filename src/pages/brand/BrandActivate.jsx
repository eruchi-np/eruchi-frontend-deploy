import React, { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { brandAPI } from '../../services/api';
import BrandAuthLayout from './BrandAuthLayout';

export default function BrandActivate() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = useMemo(() => (params.get('token') || '').trim(), [params]);
  const [invite, setInvite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [invalid, setInvalid] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [title, setTitle] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState('FB');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setInvalid(true);
      setLoading(false);
      return undefined;
    }
    let cancelled = false;
    brandAPI.getActivateInvite(token, { skipAuthRedirect: true, skipErrorToast: true })
      .then(({ data }) => {
        if (cancelled) return;
        const next = data.invite || null;
        setInvite(next);
        if (next?.email) setEmail(next.email);
        if (next?.category) setCategory(next.category);
        if (next?.brand) setBrand(next.brand);
        else if (next?.brands?.length) {
          setBrand(next.brands[0].name);
          setCategory(next.brands[0].category);
        }
      })
      .catch(() => {
        if (!cancelled) setInvalid(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [token]);

  if (!token || invalid) {
    return <Navigate to="/brand/activate/invalid" replace />;
  }

  if (loading) {
    return (
      <BrandAuthLayout title="Activate your account" copy="Checking your invite…">
        <p className="text-sm text-[var(--ink-2)]">Loading…</p>
      </BrandAuthLayout>
    );
  }

  const brandOptions = (invite?.brands || []).filter((item) => (
    !category || item.category === category
  ));

  const onSubmit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await brandAPI.activate({
        token,
        name,
        email,
        title,
        password,
        brand,
        category,
      }, { skipAuthRedirect: true, skipErrorToast: true });
      navigate('/brand/dashboard', { replace: true });
    } catch (err) {
      const status = err.response?.status;
      if (status === 410) {
        navigate('/brand/activate/invalid', { replace: true });
        return;
      }
      setError(err.response?.data?.message || 'Could not activate account');
    } finally {
      setBusy(false);
    }
  };

  return (
    <BrandAuthLayout
      title="Activate your account"
      copy={invite?.companyName
        ? `Invite for ${invite.companyName}. Use your approved work email.`
        : 'Use the invite link your company shared.'}
      footer={(
        <>
          Already activated? <Link to="/brand/login">Sign in</Link>
        </>
      )}
    >
      <form className="onboard-form" onSubmit={onSubmit}>
        <div className="onboard-field">
          <label htmlFor="act-name">Full name</label>
          <input id="act-name" value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" />
        </div>
        <div className="onboard-field">
          <label htmlFor="act-email">Work email</label>
          <input
            id="act-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            readOnly={Boolean(invite?.email)}
          />
        </div>
        <div className="onboard-field">
          <label htmlFor="act-title">Title</label>
          <input id="act-title" value={title} onChange={(e) => setTitle(e.target.value)} autoComplete="organization-title" />
        </div>
        {!invite?.brand ? (
          <>
            <div className="onboard-field">
              <label htmlFor="act-category">Category</label>
              <select
                id="act-category"
                value={category}
                onChange={(e) => {
                  const next = e.target.value;
                  setCategory(next);
                  const first = (invite?.brands || []).find((item) => item.category === next);
                  setBrand(first?.name || '');
                }}
              >
                <option value="FB">Functional Beverages</option>
                <option value="PC">Personal Care</option>
              </select>
            </div>
            <div className="onboard-field">
              <label htmlFor="act-brand">Primary brand</label>
              <select
                id="act-brand"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                required
              >
                <option value="">Select…</option>
                {brandOptions.map((item) => (
                  <option key={`${item.category}-${item.name}`} value={item.name}>{item.name}</option>
                ))}
              </select>
            </div>
          </>
        ) : (
          <p className="text-sm text-[var(--ink-2)]">
            Primary brand: <strong>{invite.brand}</strong>
          </p>
        )}
        <div className="onboard-field">
          <label htmlFor="act-password">Password</label>
          <div className="onboard-password-wrap">
            <input
              id="act-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
            <button
              type="button"
              className="onboard-password-toggle"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>
        {error ? <p className="onboard-error">{error}</p> : null}
        <div className="onboard-actions">
          <button type="submit" className="ri-auth-btn ri-auth-btn-primary" disabled={busy}>
            {busy ? 'Activating…' : 'Activate account'}
          </button>
          <button type="button" className="rounded-full px-5 py-3 text-sm text-[var(--ink-2)]" onClick={() => navigate('/brand/login')}>
            Sign in instead
          </button>
        </div>
      </form>
    </BrandAuthLayout>
  );
}
