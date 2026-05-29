import React, { useState, useEffect } from 'react';

const COOKIE_KEY = 'spetro_cookie_consent';

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const choice = localStorage.getItem(COOKIE_KEY);
    if (!choice) {
      const t = setTimeout(() => setVisible(true), 600);
      return () => clearTimeout(t);
    }
  }, []);

  const decide = (value) => {
    localStorage.setItem(COOKIE_KEY, value);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="cookie-banner">
      <div className="cookie-banner-inner">
        <p className="cookie-banner-text">
          We use cookies to keep you signed in, remember your preferences, and improve your
          experience. You can accept or decline non-essential cookies.
        </p>
        <div className="cookie-banner-actions">
          <button className="btn btn-outline cookie-btn" onClick={() => decide('declined')}>
            Decline
          </button>
          <button className="btn btn-primary cookie-btn" onClick={() => decide('accepted')}>
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
