import React from 'react';

/** Swap later by replacing files under `public/brand/`. */
const LOGO_SRC = '/brand/ruchi-insights-logo.svg';
const LOGO_ON_DARK_SRC = '/brand/ruchi-insights-logo-on-dark.svg';

export default function RuchiLogo({ className = '', alt = 'Ruchi Insights', onDark = false }) {
  return (
    <img
      src={onDark ? LOGO_ON_DARK_SRC : LOGO_SRC}
      alt={alt}
      className={`ri-logo-img ${className}`.trim()}
      width={180}
      height={32}
      decoding="async"
    />
  );
}
