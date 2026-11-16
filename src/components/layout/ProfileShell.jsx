import React from 'react';
import skyBg from '../../assets/home/sky.jpg';
import '../homepage/homepage.css';
import '../profile/profile.css';

export default function ProfileShell({ children, footer, shellRef }) {
  return (
    <div className="home-page profile-page" ref={shellRef}>
      <div className="profile-sky" style={{ '--sky': `url(${skyBg})` }}>
        <div className="home-hero-sky" aria-hidden="true" />
      </div>
      <div className="home-sheet profile-sheet">{children}</div>
      {footer}
    </div>
  );
}
