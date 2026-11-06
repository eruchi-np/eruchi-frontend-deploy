import React from 'react';
import { Link } from 'react-router-dom';
import BrandAuthLayout from './BrandAuthLayout';

export default function BrandForgotPassword() {
  return (
    <BrandAuthLayout
      brandOnForm
      title="Request a reset link"
      copy="Password resets are issued by Ruchi Insights — not self-serve."
      sideTitle="Need a new password?"
      sideCopy="Your Ruchi Insights contact can send you a one-time reset link from the admin panel."
      footer={(
        <>
          Back to <Link to="/brand/login">sign in</Link>
        </>
      )}
    >
      <div className="space-y-4 text-sm text-[var(--ink-2)]">
        <p>
          Reach out to your contact at Ruchi Insights to update your password.
          Ask them to send a reset link for your allowlisted email.
        </p>
        <div className="onboard-actions">
          <Link to="/brand/login" className="ri-auth-btn ri-auth-btn-primary">
            Back to sign in
          </Link>
        </div>
      </div>
    </BrandAuthLayout>
  );
}
