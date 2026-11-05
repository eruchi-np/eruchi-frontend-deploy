import React from 'react';
import { Link } from 'react-router-dom';
import BrandAuthLayout from './BrandAuthLayout';

export default function BrandActivateInvalid() {
  return (
    <BrandAuthLayout title={null} copy={null}>
      <div className="ri-auth-msg">
        <h1>This invite link no longer works</h1>
        <p className="ri-auth-sub">
          It may have expired, been revoked, or already used. Ask your company contact for a new invite, or sign in if you already activated.
        </p>
        <div className="onboard-actions" style={{ justifyContent: 'center' }}>
          <Link to="/brand/login" className="ri-auth-btn ri-auth-btn-primary">Sign in</Link>
        </div>
      </div>
    </BrandAuthLayout>
  );
}
