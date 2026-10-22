import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { brandAPI } from '../../services/api';
import BrandAuthLayout from './BrandAuthLayout';

export default function BrandSignup() {
  const navigate = useNavigate();
  const [catalog, setCatalog] = useState([]);
  const [category, setCategory] = useState('FB');
  const [brand, setBrand] = useState('Red Bull');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    brandAPI.catalog({ skipAuthRedirect: true, skipErrorToast: true }).then(({ data }) => {
      setCatalog(data.categories || []);
    }).catch(() => setError('Could not load the brand list'));
  }, []);

  const brands = catalog.find((entry) => entry.category === category)?.brands || [];

  const onCategory = (value) => {
    setCategory(value);
    const next = catalog.find((entry) => entry.category === value)?.brands || [];
    setBrand(next[0] || '');
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await brandAPI.signup({ email, password, category, brand }, { skipAuthRedirect: true, skipErrorToast: true });
      navigate('/brand/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create the account');
    } finally {
      setBusy(false);
    }
  };

  return (
    <BrandAuthLayout
      title="Brand sign up"
      copy="One account per brand. You only see that category."
      footer={(
        <>
          Already have an account? <Link to="/brand/login">Sign in</Link>
        </>
      )}
    >
      <form className="onboard-form" onSubmit={onSubmit}>
        <div className="onboard-field">
          <label htmlFor="brand-category">Category</label>
          <select id="brand-category" value={category} onChange={(event) => onCategory(event.target.value)}>
            {catalog.map((entry) => (
              <option key={entry.category} value={entry.category}>{entry.label}</option>
            ))}
          </select>
        </div>
        <div className="onboard-field">
          <label htmlFor="brand-name">Brand</label>
          <select id="brand-name" value={brand} onChange={(event) => setBrand(event.target.value)}>
            {brands.map((name) => <option key={name} value={name}>{name}</option>)}
          </select>
        </div>
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
          <button type="submit" className="home-pill home-pill-lg home-pill-navy" disabled={busy || !brand}>{busy ? 'Creating...' : 'Create account'}</button>
        </div>
      </form>
    </BrandAuthLayout>
  );
}
