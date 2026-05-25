import React from 'react';
import logoImg from '../assets/logo.png';

const props = { viewBox: '0 0 24 24', fill: 'none', strokeWidth: 1.75, strokeLinecap: 'round', strokeLinejoin: 'round' };

// ── Spetro logo mark — uses the uploaded logo PNG ─────────────────────────────
export const SpetroMark = ({ size = 28, style, className }) => (
  <img
    src={logoImg}
    width={size}
    height={size}
    alt="Spetro"
    style={{ display: 'inline-block', objectFit: 'contain', ...style }}
    className={className}
  />
);

export const HomeIcon = ({ size = 22, ...rest }) => (
  <svg {...props} width={size} height={size} {...rest}>
    <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" stroke="currentColor" />
    <path d="M9 21V12h6v9" stroke="currentColor" />
  </svg>
);

export const EarnIcon = ({ size = 22, ...rest }) => (
  <svg {...props} width={size} height={size} {...rest}>
    <circle cx="12" cy="12" r="9" stroke="currentColor" />
    <path d="M12 7v10M9.5 9.5C9.5 8.12 10.62 7 12 7s2.5 1.12 2.5 2.5c0 1.93-2.5 3-2.5 3s-2.5 1.07-2.5 3c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5" stroke="currentColor" />
  </svg>
);

export const WithdrawIcon = ({ size = 22, ...rest }) => (
  <svg {...props} width={size} height={size} {...rest}>
    <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" />
    <path d="M2 10h20" stroke="currentColor" />
    <circle cx="7" cy="15" r="1" fill="currentColor" stroke="none" />
  </svg>
);

export const ProfileIcon = ({ size = 22, ...rest }) => (
  <svg {...props} width={size} height={size} {...rest}>
    <circle cx="12" cy="8" r="4" stroke="currentColor" />
    <path d="M4 20c0-4 3.58-7 8-7s8 3 8 7" stroke="currentColor" />
  </svg>
);

export const ArrowLeftIcon = ({ size = 20, ...rest }) => (
  <svg {...props} width={size} height={size} {...rest}>
    <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" />
  </svg>
);

export const CopyIcon = ({ size = 16, ...rest }) => (
  <svg {...props} width={size} height={size} {...rest}>
    <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" />
    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="currentColor" />
  </svg>
);

export const LogOutIcon = ({ size = 18, ...rest }) => (
  <svg {...props} width={size} height={size} {...rest}>
    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" />
  </svg>
);

export const CheckIcon = ({ size = 14, ...rest }) => (
  <svg {...props} width={size} height={size} {...rest}>
    <polyline points="20 6 9 17 4 12" stroke="currentColor" strokeWidth={2.5} />
  </svg>
);

export const BellIcon = ({ size = 22, ...rest }) => (
  <svg {...props} width={size} height={size} {...rest}>
    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" stroke="currentColor" />
  </svg>
);

// Premium neon gem token — SVG-only, no external assets required.
// Renders a faceted hexagonal crystal with inner highlight lines,
// giving a high-tech "digital reward token" appearance.
export const CoinIcon = ({ size = 18, style, className, color }) => {
  const c = color || 'var(--coin, #38bdf8)';
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
    >
      {/* Outer hexagon body */}
      <polygon
        points="12,2 20.5,7 20.5,17 12,22 3.5,17 3.5,7"
        fill={c}
        fillOpacity="0.18"
        stroke={c}
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      {/* Top facet highlight */}
      <polygon
        points="12,2 20.5,7 12,10 3.5,7"
        fill={c}
        fillOpacity="0.30"
        stroke="none"
      />
      {/* Inner center diamond */}
      <polygon
        points="12,8 16,12 12,16 8,12"
        fill={c}
        fillOpacity="0.55"
        stroke={c}
        strokeWidth="0.8"
      />
      {/* Bright top shine */}
      <line x1="12" y1="2" x2="12" y2="10" stroke={c} strokeWidth="0.7" strokeOpacity="0.5" />
      <line x1="3.5" y1="7" x2="8" y2="12" stroke={c} strokeWidth="0.7" strokeOpacity="0.3" />
      <line x1="20.5" y1="7" x2="16" y2="12" stroke={c} strokeWidth="0.7" strokeOpacity="0.3" />
    </svg>
  );
};

export const ShieldIcon = ({ size = 20, ...rest }) => (
  <svg {...props} width={size} height={size} {...rest}>
    <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.35C17.25 22.15 21 17.25 21 12V7l-9-5z" stroke="currentColor" />
    <polyline points="9 12 11 14 15 10" stroke="currentColor" strokeWidth={2} />
  </svg>
);

export const GlobeIcon = ({ size = 18, ...rest }) => (
  <svg {...props} width={size} height={size} {...rest}>
    <circle cx="12" cy="12" r="10" stroke="currentColor" />
    <path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20" stroke="currentColor" />
  </svg>
);

export const VisaIcon = ({ size = 32 }) => (
  <img
    src="/logos/visa.svg"
    alt="Visa"
    style={{ width: size * 1.55, height: size, objectFit: 'contain', display: 'block', borderRadius: 6 }}
  />
);

export const BinanceIcon = ({ size = 32 }) => (
  <img
    src="/logos/binance.svg"
    alt="Binance"
    style={{ width: size, height: size, objectFit: 'contain', display: 'block', borderRadius: '50%' }}
  />
);

export const LitecoinIcon = ({ size = 32 }) => (
  <img
    src="/logos/litecoin.svg"
    alt="Litecoin"
    style={{ width: size, height: size, objectFit: 'contain', display: 'block', borderRadius: '50%' }}
  />
);

export const GooglePlayIcon = ({ size = 32 }) => (
  <img
    src="/logos/googleplay.svg"
    alt="Google Play"
    style={{ width: size, height: size, objectFit: 'contain', display: 'block', borderRadius: 6 }}
  />
);

export const SupportIcon = ({ size = 18, ...rest }) => (
  <svg {...props} width={size} height={size} {...rest}>
    <circle cx="12" cy="12" r="10" stroke="currentColor" />
    <path d="M12 16v-4M12 8h.01" stroke="currentColor" strokeWidth={2} />
  </svg>
);

export const ZapIcon = ({ size = 18, ...rest }) => (
  <svg {...props} width={size} height={size} {...rest}>
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" stroke="currentColor" fill="none" />
  </svg>
);

export const TrendingUpIcon = ({ size = 18, ...rest }) => (
  <svg {...props} width={size} height={size} {...rest}>
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" stroke="currentColor" />
    <polyline points="17 6 23 6 23 12" stroke="currentColor" />
  </svg>
);

export const ClockIcon = ({ size = 18, ...rest }) => (
  <svg {...props} width={size} height={size} {...rest}>
    <circle cx="12" cy="12" r="10" stroke="currentColor" />
    <polyline points="12 6 12 12 16 14" stroke="currentColor" />
  </svg>
);

export const XIcon = ({ size = 18, ...rest }) => (
  <svg {...props} width={size} height={size} {...rest}>
    <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth={2} />
    <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth={2} />
  </svg>
);

export const LockIcon = ({ size = 22, ...rest }) => (
  <svg {...props} width={size} height={size} {...rest}>
    <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" />
    <path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" />
  </svg>
);

export const UsersIcon = ({ size = 22, ...rest }) => (
  <svg {...props} width={size} height={size} {...rest}>
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" />
    <circle cx="9" cy="7" r="4" stroke="currentColor" />
    <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" />
  </svg>
);

export const BarChartIcon = ({ size = 22, ...rest }) => (
  <svg {...props} width={size} height={size} {...rest}>
    <line x1="18" y1="20" x2="18" y2="10" stroke="currentColor" />
    <line x1="12" y1="20" x2="12" y2="4" stroke="currentColor" />
    <line x1="6" y1="20" x2="6" y2="14" stroke="currentColor" />
  </svg>
);
