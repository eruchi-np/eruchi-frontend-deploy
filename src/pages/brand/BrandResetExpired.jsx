import React from 'react';
import { Link } from 'react-router-dom';
import BrandAuthLayout from './BrandAuthLayout';

export default function BrandResetExpired() {
  return (
    <BrandAuthLayout
      brandOnForm
      title="This reset link has expired"
      copy="Password reset links only work for a short time."
      footer={(
        <>
          Back to <Link to="/brand/login">sign in</Link>
        </>
      )}
    >
      <div className="space-y-4 text-sm text-[var(--ink-2)]">
        <p>
          Reach out to your contact at Ruchi Insights to request a new reset link.
        </p>
        <div className="onboard-actions">
          <Link to="/brand/forgot-password" className="ri-auth-btn ri-auth-btn-primary">
            How to request a reset
          </Link>
          <Link to="/brand/login" className="ri-auth-btn">
            Sign in
          </Link>
        </div>
      </div>
    </BrandAuthLayout>
  );
}
