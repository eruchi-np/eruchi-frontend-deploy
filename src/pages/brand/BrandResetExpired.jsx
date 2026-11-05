import React from 'react';
import { Link } from 'react-router-dom';
import BrandAuthLayout from './BrandAuthLayout';

export default function BrandResetExpired() {
  return (
    <BrandAuthLayout title={null} copy={null}>
      <div className="ri-auth-msg">
        <h1>This reset link has expired</h1>
        <p className="ri-auth-sub">
          Password reset links only work for a short time. Request a new one from the sign-in page.
        </p>
        <div className="onboard-actions" style={{ justifyContent: 'center' }}>
          <Link to="/brand/forgot-password" className="ri-auth-btn ri-auth-btn-primary">Request new link</Link>
          <Link to="/brand/login" className="rounded-full px-5 py-3 text-sm font-medium text-[var(--primary-ink)]">Sign in</Link>
        </div>
      </div>
    </BrandAuthLayout>
  );
}
