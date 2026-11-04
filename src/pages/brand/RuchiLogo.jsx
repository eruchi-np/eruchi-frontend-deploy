import React from 'react';

/** Swap later by replacing `public/brand/ruchi-insights-logo.svg` (or .png and update SRC). */
const LOGO_SRC = '/brand/ruchi-insights-logo.svg';

export default function RuchiLogo({ className = '', alt = 'Ruchi Insights' }) {
  return (
    <img
      src={LOGO_SRC}
      alt={alt}
      className={`ri-logo-img ${className}`.trim()}
      width={180}
      height={32}
      decoding="async"
    />
  );
}
