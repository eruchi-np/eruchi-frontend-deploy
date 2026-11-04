import React from 'react';
import '../../components/onboarding/onboarding.css';
import './ruchiTokens.css';
import './ruchiAuth.css';
import RuchiLogo from './RuchiLogo';

const DEFAULT_POINTS = [
  'Awareness and purchase trends',
  'Usage occasions and sensory',
  'Switching flow and reasons',
];

export default function BrandAuthLayout({
  title,
  copy,
  children,
  footer,
  sideTitle = 'Brand tracking, week by week',
  sideCopy = 'Weekly brand tracking for your category — awareness, purchase, usage, and switching.',
  sidePoints = DEFAULT_POINTS,
  wide = false,
}) {
  return (
    <div className="ruchi-insights ri-auth">
      <aside className="ri-auth-side" aria-label="Ruchi Insights">
        <div className="ri-auth-side-brand">
          <RuchiLogo className="ri-logo-img--auth" />
          <p className="ri-auth-kicker">Ruchi Insights</p>
          {sideTitle ? <h2 className="ri-auth-side-title">{sideTitle}</h2> : null}
        </div>
        {Array.isArray(sidePoints) && sidePoints.length ? (
          <ul className="ri-auth-side-points">
            {sidePoints.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : null}
        {sideCopy ? <p className="ri-auth-side-copy">{sideCopy}</p> : null}
      </aside>
      <main className="ri-auth-main">
        <div className={`ri-auth-card${wide ? ' ri-auth-card--wide' : ''}`}>
          {title ? <h1>{title}</h1> : null}
          {copy ? <p className="ri-auth-sub">{copy}</p> : null}
          {children}
          {footer ? <p className="ri-auth-foot">{footer}</p> : null}
        </div>
      </main>
    </div>
  );
}
