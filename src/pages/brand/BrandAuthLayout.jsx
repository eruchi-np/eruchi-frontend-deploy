import React from 'react';
import OnboardingShell from '../../components/onboarding/OnboardingShell';
import '../../components/onboarding/onboarding.css';

export default function BrandAuthLayout({ title, copy, children, footer }) {
  return (
    <OnboardingShell>
      <div className="onboard-card onboard-card--auth">
        <div className="onboard-auth-head">
          <h1 className="onboard-title">{title}</h1>
          <p className="onboard-copy">{copy}</p>
        </div>
        {children}
        {footer ? (
          <p className="onboard-copy" style={{ marginTop: 16 }}>
            {footer}
          </p>
        ) : null}
      </div>
    </OnboardingShell>
  );
}
