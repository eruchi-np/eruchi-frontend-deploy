import React, { useEffect, useRef } from 'react';
import '../../components/onboarding/onboarding.css';
import './ruchiTokens.css';
import './ruchiAuth.css';
import RuchiLogo from './RuchiLogo';
import { initRuchiAuthCinema } from './ruchiAuthCinema';

export default function BrandAuthLayout({
  title,
  copy,
  children,
  footer,
  sideTitle = 'Weekly brand tracking for your category',
  sideCopy = 'Awareness, purchase, usage, and switching — updated every week.',
  sidePoints = null,
  wide = false,
  brandOnForm = false,
}) {
  const points = Array.isArray(sidePoints) ? sidePoints : null;
  const sideRef = useRef(null);

  useEffect(() => initRuchiAuthCinema(sideRef.current), []);

  return (
    <div className="ruchi-insights ri-auth">
      <aside className="ri-auth-side" aria-label="Ruchi Insights" ref={sideRef}>
        <div className="ri-auth-side-glow" aria-hidden="true" />
        <div className="ri-auth-side-glow ri-auth-side-glow--alt" aria-hidden="true" />
        <div className="ri-auth-side-motif" aria-hidden="true">
          <span className="ri-auth-bar ri-auth-bar-1" />
          <span className="ri-auth-bar ri-auth-bar-2" />
          <span className="ri-auth-bar ri-auth-bar-3" />
          <span className="ri-auth-bar ri-auth-bar-4" />
          <span className="ri-auth-bar ri-auth-bar-5" />
        </div>
        <div className="ri-auth-side-top">
          <div className="ri-auth-side-logo">
            <RuchiLogo className="ri-logo-img--auth" onDark />
          </div>
          <div className="ri-auth-side-brand">
            {sideTitle ? <h2 className="ri-auth-side-title">{sideTitle}</h2> : null}
            {sideCopy ? <p className="ri-auth-side-lede">{sideCopy}</p> : null}
            {points?.length ? (
              <ul className="ri-auth-side-points">
                {points.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      </aside>
      <main className="ri-auth-main">
        <div className={`ri-auth-panel${wide ? ' ri-auth-panel--wide' : ''}`}>
          {brandOnForm ? (
            <div className="ri-auth-form-brand">
              <RuchiLogo className="ri-logo-img--form" />
            </div>
          ) : null}
          {title ? <h1 className={brandOnForm ? 'ri-auth-title-secondary' : undefined}>{title}</h1> : null}
          {copy ? <p className="ri-auth-sub">{copy}</p> : null}
          {children}
          {footer ? <p className="ri-auth-foot">{footer}</p> : null}
        </div>
      </main>
    </div>
  );
}
