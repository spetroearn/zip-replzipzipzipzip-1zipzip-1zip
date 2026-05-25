import React, { useEffect, useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../api';

const WALLS = [
  {
    id: 'adjoe',
    name: 'adjoe',
    subtitle: 'Playtime',
    description: 'Play games, level up, and earn coins automatically per minute.',
    color: '#8b5cf6',
    bg: 'linear-gradient(145deg, #1a0e30, #221244)',
    borderColor: 'rgba(139,92,246,0.3)',
    featured: true,
    apkOnly: true,
    logo: '/logos/adjoe.png',
    url: null
  },
  {
    id: 'revu',
    name: 'Revu',
    subtitle: 'Surveys & Offers',
    description: 'Complete premium surveys, high-paying quiz tasks, and top offers.',
    color: '#0ea5e9',
    bg: 'linear-gradient(145deg, #071e2e, #0c2d42)',
    borderColor: 'rgba(14,165,233,0.4)',
    featured: false,
    logo: '/logos/revu.png',
    logoScale: 2.2,
    url: 'https://revu.net/offerwall?pub_id=YOUR_PUB_ID&user_id={USER_ID}'
  },
  {
    id: 'offery',
    name: 'Offery',
    subtitle: 'App Installs',
    description: 'Explore new apps, register accounts, and unlock fast rewards.',
    // Cyan/teal — matches Offery's own platform brand color
    color: '#06B6D4',
    bg: 'linear-gradient(145deg, #001c21, #002d35)',
    borderColor: 'rgba(6,182,212,0.28)',
    featured: false,
    logo: '/logos/offery.png',
    logoScale: 2.2,
    url: 'https://offery.io/wall?pub=YOUR_PUB_ID&uid={USER_ID}'
  },
  {
    id: 'ovnix',
    name: 'Ovnix',
    subtitle: 'CPA Offers',
    description: 'Complete high-value CPA tasks and earn big in minutes.',
    color: '#f59e0b',
    bg: 'linear-gradient(145deg, #1f1300, #2d1c00)',
    borderColor: 'rgba(245,158,11,0.3)',
    featured: false,
    logo: '/logos/ovnix.png',
    url: 'https://ovnix.com/wall?pub=YOUR_PUB_ID&uid={USER_ID}'
  },
  {
    id: 'adtowall',
    name: 'AdToWall',
    subtitle: 'Ad Rewards',
    description: 'Watch curated ads and interactive creatives to earn steady coin rewards.',
    color: '#059669',
    bg: 'linear-gradient(145deg, #031812, #052d1e)',
    borderColor: 'rgba(5,150,105,0.32)',
    featured: false,
    logo: '/logos/adtowall.png',
    url: 'https://adtowall.com/wall?pub=YOUR_PUB_ID&uid={USER_ID}'
  },
  {
    id: 'taskwall',
    name: 'TaskWall',
    subtitle: 'Task Offers',
    description: 'Complete guided tasks, registrations, and challenges for premium payouts.',
    color: '#2B6CB0',
    bg: 'linear-gradient(145deg, #07101e, #0b1e38)',
    borderColor: 'rgba(43,108,176,0.32)',
    featured: false,
    logo: '/logos/taskwall.png',
    url: 'https://taskwall.io/wall?pub=YOUR_PUB_ID&uid={USER_ID}'
  }
];

// ── Offerwall iframe modal (rendered via portal → always above everything) ─────
function OfferModal({ wall, userId, onClose }) {
  const iframeRef = useRef(null);
  const resolvedUrl = wall.url
    ? wall.url.replace('{USER_ID}', encodeURIComponent(userId || ''))
    : null;

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', handleKey);
    };
  }, [onClose]);

  const handleOpenExternal = () => {
    if (resolvedUrl) window.open(resolvedUrl, '_blank', 'noopener,noreferrer');
  };

  const modal = (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      zIndex: 999999,
      background: '#080c10',
      display: 'flex',
      flexDirection: 'column',
    }}>

      {/* ── Top bar ── */}
      <div style={{
        height: 54,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 10px',
        background: '#131c2b',
        borderBottom: '2px solid ' + wall.color,
      }}>

        {/* CLOSE */}
        <button
          onClick={onClose}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            height: 38, padding: '0 14px',
            borderRadius: 10,
            border: '1.5px solid #ef4444',
            background: '#ef444422',
            color: '#ff6b6b',
            fontWeight: 800, fontSize: 14,
            cursor: 'pointer', fontFamily: 'inherit',
            letterSpacing: '0.01em',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="3" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
          Close
        </button>

        {/* CENTER — name */}
        <div style={{
          position: 'absolute', left: '50%', transform: 'translateX(-50%)',
          display: 'flex', alignItems: 'center', gap: 7,
          pointerEvents: 'none',
        }}>
          <div style={{
            width: 9, height: 9, borderRadius: '50%',
            background: wall.color,
            boxShadow: '0 0 8px ' + wall.color,
          }} />
          <span style={{
            fontWeight: 800, fontSize: 15,
            color: '#ffffff',
            letterSpacing: '-0.01em',
          }}>
            {wall.name}
          </span>
        </div>

        {/* OPEN EXTERNALLY */}
        <button
          onClick={handleOpenExternal}
          disabled={!resolvedUrl}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            height: 38, padding: '0 12px',
            borderRadius: 10,
            border: '1.5px solid ' + (resolvedUrl ? wall.color : 'rgba(255,255,255,0.15)'),
            background: resolvedUrl ? wall.color + '22' : 'rgba(255,255,255,0.05)',
            color: resolvedUrl ? wall.color : 'rgba(255,255,255,0.3)',
            fontWeight: 800, fontSize: 13,
            cursor: resolvedUrl ? 'pointer' : 'not-allowed',
            fontFamily: 'inherit',
            letterSpacing: '0.01em',
            WebkitTapHighlightColor: 'transparent',
            whiteSpace: 'nowrap',
          }}
        >
          Open
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
            <polyline points="15 3 21 3 21 9"/>
            <line x1="10" y1="14" x2="21" y2="3"/>
          </svg>
        </button>
      </div>

      {/* ── Iframe / unconfigured state ── */}
      <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
        {resolvedUrl ? (
          <iframe
            ref={iframeRef}
            src={resolvedUrl}
            title={wall.name + ' Offerwall'}
            allow="autoplay; clipboard-write; payment"
            style={{
              position: 'absolute', inset: 0,
              width: '100%', height: '100%',
              border: 'none', display: 'block',
              background: '#fff',
            }}
          />
        ) : (
          <div style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            height: '100%', gap: 14, padding: 32, textAlign: 'center',
            background: '#080c10',
          }}>
            <div style={{ fontSize: 44 }}>⚙️</div>
            <p style={{ fontWeight: 700, fontSize: 16, color: '#f0f6fc' }}>
              Offerwall URL Not Configured
            </p>
            <p style={{ color: '#7d8fa8', fontSize: 14, maxWidth: 290, lineHeight: 1.65 }}>
              Set the publisher embed URL for{' '}
              <strong style={{ color: wall.color }}>{wall.name}</strong>{' '}
              in the admin panel under Offerwalls.
            </p>
            <button
              onClick={onClose}
              style={{
                marginTop: 4, padding: '10px 26px', borderRadius: 10,
                border: '1.5px solid rgba(255,255,255,0.15)',
                background: 'rgba(255,255,255,0.07)',
                color: '#f0f6fc', fontWeight: 700,
                fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              ← Go Back
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

// ── Locked overlay (not logged in) ────────────────────────────────────────────
function LockedOverlay({ onGoLogin, onGoRegister }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      background: 'rgba(7,15,25,0.88)',
      backdropFilter: 'blur(10px)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: 32, textAlign: 'center'
    }}>
      <div style={{ fontSize: 52, marginBottom: 16 }}>🔒</div>
      <h2 style={{ fontWeight: 800, fontSize: 22, marginBottom: 8 }}>Sign in to Earn</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: 15, lineHeight: 1.6, marginBottom: 28, maxWidth: 280 }}>
        Create a free account to access all offerwalls and start earning real rewards.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 300 }}>
        <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', fontSize: 16, padding: '13px' }} onClick={onGoRegister}>
          Get Started — It's Free
        </button>
        <button className="btn btn-outline" style={{ width: '100%', justifyContent: 'center' }} onClick={onGoLogin}>
          Sign In
        </button>
      </div>
    </div>
  );
}

// ── Inline VPN / high-risk warning banner ─────────────────────────────────────
function VPNWarningBanner({ isVpn, riskScore }) {
  const reason = isVpn ? 'VPN / Proxy Detected' : `Risk Score ${riskScore}/100`;
  return (
    <div style={{
      background: 'rgba(239,68,68,0.08)',
      border: '1px solid rgba(239,68,68,0.28)',
      borderRadius: 12,
      padding: '14px 16px',
      marginBottom: 20,
      display: 'flex', alignItems: 'flex-start', gap: 12
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 10, flexShrink: 0,
        background: 'rgba(239,68,68,0.12)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18
      }}>
        🛡️
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
          <span style={{ fontWeight: 700, fontSize: 13, color: '#ef4444' }}>
            Access Denied
          </span>
          <span style={{
            fontSize: 10, fontWeight: 700, color: '#ef4444',
            background: 'rgba(239,68,68,0.15)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 5, padding: '2px 7px',
            letterSpacing: '0.04em', textTransform: 'uppercase'
          }}>
            {reason}
          </span>
        </div>
        <p style={{
          color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.6, margin: 0
        }}>
          Your network connection security score is low. Please disable your VPN/Proxy or switch to a stable mobile connection to view offers.
        </p>
      </div>
    </div>
  );
}

// ── Individual "other" wall card ──────────────────────────────────────────────
function WallCard({ wall, vpnBlocked, userId, onOpenModal }) {
  const [hovered, setHovered] = useState(false);
  const [imgError, setImgError] = useState(false);

  const handleOpen = () => {
    if (vpnBlocked) return;
    onOpenModal(wall);
  };

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: wall.bg,
        border: `1px solid ${hovered ? wall.color + '66' : wall.borderColor}`,
        borderRadius: 14,
        padding: '16px 16px 14px',
        cursor: vpnBlocked ? 'default' : 'pointer',
        transition: 'border-color 0.2s, transform 0.18s, box-shadow 0.2s',
        transform: hovered && !vpnBlocked ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: hovered && !vpnBlocked ? `0 8px 28px ${wall.color}22` : '0 2px 8px rgba(0,0,0,0.3)',
        opacity: vpnBlocked ? 0.55 : 1
      }}
    >
      {/* Top row: logo + name + subtitle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 13, marginBottom: 10 }}>
        <div style={{
          width: 72, height: 56, borderRadius: 14,
          background: `${wall.color}1a`,
          border: `1.5px solid ${wall.color}44`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          overflow: 'hidden',
          transition: 'background 0.2s, border-color 0.2s',
          ...(hovered && !vpnBlocked ? { background: `${wall.color}28`, borderColor: `${wall.color}77` } : {})
        }}>
          {!imgError ? (
            <img
              src={wall.logo}
              alt={wall.name}
              onError={() => setImgError(true)}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                display: 'block',
                padding: 4,
                transform: wall.logoScale ? `scale(${wall.logoScale})` : undefined
              }}
            />
          ) : (
            <span style={{ fontWeight: 900, fontSize: 13, color: wall.color, letterSpacing: '-0.5px' }}>
              {wall.name.slice(0, 2).toUpperCase()}
            </span>
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontWeight: 800, fontSize: 15,
            color: hovered && !vpnBlocked ? wall.color : 'var(--text)',
            transition: 'color 0.18s',
            letterSpacing: '-0.01em'
          }}>
            {wall.name}
          </p>
          <p style={{
            color: 'var(--text-dim)', fontSize: 11, marginTop: 1,
            fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em'
          }}>
            {wall.subtitle}
          </p>
        </div>
        <div style={{
          width: 8, height: 8, borderRadius: '50%',
          background: vpnBlocked ? '#555' : wall.color,
          boxShadow: vpnBlocked ? 'none' : `0 0 6px ${wall.color}`,
          flexShrink: 0, opacity: hovered ? 1 : 0.5,
          transition: 'opacity 0.2s'
        }} />
      </div>

      {/* Description */}
      <p style={{
        color: 'var(--text-muted)', fontSize: 12.5, lineHeight: 1.55,
        marginBottom: 13, paddingLeft: 55
      }}>
        {wall.description}
      </p>

      {/* Action button */}
      <button
        onClick={handleOpen}
        disabled={vpnBlocked}
        style={{
          width: '100%',
          padding: '9px 0',
          borderRadius: 9,
          border: `1px solid ${vpnBlocked ? 'rgba(255,255,255,0.08)' : wall.color + '55'}`,
          background: vpnBlocked
            ? 'rgba(255,255,255,0.04)'
            : hovered ? `${wall.color}22` : `${wall.color}0d`,
          color: vpnBlocked ? 'var(--text-dim)' : wall.color,
          fontWeight: 700,
          fontSize: 13,
          fontFamily: 'inherit',
          cursor: vpnBlocked ? 'not-allowed' : 'pointer',
          letterSpacing: '0.02em',
          transition: 'background 0.18s, border-color 0.18s',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7
        }}
        onMouseEnter={(e) => {
          if (vpnBlocked) return;
          e.currentTarget.style.background = `${wall.color}2e`;
          e.currentTarget.style.borderColor = `${wall.color}88`;
        }}
        onMouseLeave={(e) => {
          if (vpnBlocked) return;
          e.currentTarget.style.background = hovered ? `${wall.color}22` : `${wall.color}0d`;
          e.currentTarget.style.borderColor = `${wall.color}55`;
        }}
      >
        {vpnBlocked ? (
          <>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
            </svg>
            Restricted
          </>
        ) : (
          <>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>
            </svg>
            Open Offerwall
          </>
        )}
      </button>
    </div>
  );
}

export default function Offerwalls({ user, guest, onGoLogin, onGoRegister }) {
  const [vpnBlocked, setVpnBlocked] = useState(false);
  const [vpnInfo, setVpnInfo] = useState({ isVpn: false, riskScore: 0 });
  const [vpnChecked, setVpnChecked] = useState(false);
  const [activeModal, setActiveModal] = useState(null);
  const [urlConfig, setUrlConfig] = useState({});

  useEffect(() => {
    // config shape: { [network_id]: { url: string, enabled: boolean } }
    api.offerwalls.config()
      .then(({ config }) => setUrlConfig(config || {}))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (guest) { setVpnChecked(true); return; }
    api.auth.vpnCheck()
      .then(({ blocked, isVpn, riskScore }) => {
        setVpnBlocked(!!blocked);
        setVpnInfo({ isVpn: !!isVpn, riskScore: riskScore || 0 });
        setVpnChecked(true);
      })
      .catch(() => { setVpnBlocked(false); setVpnChecked(true); });
  }, [guest]);

  // Hide any network the admin has toggled OFF.
  // If the network has no DB row yet (urlConfig entry missing), show it by default.
  const isVisible = (wallId) => {
    const entry = urlConfig[wallId];
    if (entry === undefined) return true;
    return entry.enabled !== false;
  };

  const featured = WALLS.find((w) => w.featured && isVisible(w.id));
  const others = WALLS.filter((w) => !w.featured && isVisible(w.id));

  return (
    <div className="screen fade-up" style={{ position: 'relative' }}>
      {guest && <LockedOverlay onGoLogin={onGoLogin} onGoRegister={onGoRegister} />}

      {activeModal && (
        <OfferModal
          wall={activeModal}
          userId={user?.id}
          onClose={() => setActiveModal(null)}
        />
      )}

      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800 }}>Earn Coins</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
          Complete offers and get paid instantly
        </p>
      </div>

      {/* Inline VPN warning — shown only when blocked, replaces full-screen overlay */}
      {!guest && vpnChecked && vpnBlocked && (
        <VPNWarningBanner isVpn={vpnInfo.isVpn} riskScore={vpnInfo.riskScore} />
      )}

      {/* Featured adjoe card */}
      {featured && <FeaturedWallCard wall={featured} user={user} />}

      {/* Other walls */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {others.map((wall) => (
          <WallCard
            key={wall.id}
            wall={wall}
            vpnBlocked={vpnBlocked}
            userId={user?.id}
            onOpenModal={(w) => setActiveModal({ ...w, url: urlConfig[w.id]?.url ?? w.url })}
          />
        ))}
      </div>
    </div>
  );
}

// ── Featured wall logo with onError fallback ──────────────────────────────────
function FeaturedLogo({ logo, name, color }) {
  const [err, setErr] = useState(false);
  if (err) {
    return (
      <span style={{ fontWeight: 900, fontSize: 14, color, letterSpacing: '-0.5px' }}>
        {name.slice(0, 2).toUpperCase()}
      </span>
    );
  }
  return (
    <img
      src={logo}
      alt={name}
      onError={() => setErr(true)}
      style={{ maxHeight: 36, maxWidth: 44, objectFit: 'contain', borderRadius: 6, display: 'block' }}
    />
  );
}

// Detects whether the app is running inside our Android APK via AndroidBridge.
function isNativeApp() {
  return typeof window !== 'undefined' && !!window.AndroidBridge;
}

function FeaturedWallCard({ wall, user }) {
  const [hovered, setHovered] = useState(false);
  const [adjoeStarted, setAdjoeStarted] = useState(false);
  const nativeApp = isNativeApp();
  const isLocked = wall.apkOnly && !nativeApp;

  useEffect(() => {
    if (!nativeApp || !user?.id) return;
    try {
      window.AndroidBridge.setUserId(String(user.id));
    } catch (e) {
      console.warn('AndroidBridge.setUserId failed:', e);
    }
  }, [nativeApp, user?.id]);

  const handleStartEarning = () => {
    if (!nativeApp || !user?.id) return;
    const adjoeAppHash = (window.ADJOE_APP_HASH) || '';
    try {
      window.AndroidBridge.startAdjoeSDK(String(user.id), adjoeAppHash);
      window.AndroidBridge.openAdjoeOfferwalls();
      setAdjoeStarted(true);
    } catch (e) {
      console.warn('AndroidBridge.startAdjoeSDK failed:', e);
    }
  };

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: wall.bg,
        border: `1.5px solid ${hovered ? wall.color + '55' : wall.borderColor}`,
        borderRadius: 18, padding: '22px 22px 20px',
        marginBottom: 14, cursor: 'pointer',
        transition: 'border-color 0.2s, transform 0.18s, box-shadow 0.2s',
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: hovered ? `0 10px 36px ${wall.color}28` : '0 2px 10px rgba(0,0,0,0.35)',
        position: 'relative', overflow: 'hidden'
      }}
    >
      <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
        {isLocked && (
          <span style={{ background: 'rgba(0,0,0,0.45)', border: '1px solid rgba(255,255,255,0.12)', color: 'var(--text-muted)', fontSize: 10, fontWeight: 700, borderRadius: 6, padding: '3px 8px', letterSpacing: '0.04em' }}>
            APK ONLY
          </span>
        )}
        <span style={{ background: wall.color, color: '#fff', fontSize: 10, fontWeight: 700, borderRadius: 6, padding: '3px 8px', letterSpacing: '0.05em' }}>
          FEATURED
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
        <div style={{
          width: 48, height: 48, borderRadius: 14,
          background: `${wall.color}22`, border: `1.5px solid ${wall.color}55`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          overflow: 'hidden', opacity: isLocked ? 0.6 : 1
        }}>
          <FeaturedLogo logo={wall.logo} name={wall.name} color={wall.color} />
        </div>
        <div>
          <p style={{ fontWeight: 800, fontSize: 18, color: wall.color }}>{wall.name}</p>
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>{wall.subtitle}</p>
        </div>
      </div>

      <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.6, marginBottom: 16 }}>
        {wall.description}
      </p>

      {isLocked ? (
        // ── SWAP THIS LINK for your real Google Play / APK URL before going live ──
        // eslint-disable-next-line no-undef
        /* ADJOE_DOWNLOAD_URL — replace https://google.com with your Play Store listing */
        <a
          href="https://google.com"
          target="_blank"
          rel="noopener noreferrer"
          style={{ textDecoration: 'none', display: 'block' }}
        >
          <div style={{
            background: 'rgba(139,92,246,0.09)',
            border: '1.5px solid rgba(139,92,246,0.4)',
            borderRadius: 12, padding: '14px 16px',
            display: 'flex', alignItems: 'center', gap: 14,
            cursor: 'pointer',
            transition: 'background 0.18s, border-color 0.18s',
          }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(139,92,246,0.16)';
              e.currentTarget.style.borderColor = 'rgba(139,92,246,0.65)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(139,92,246,0.09)';
              e.currentTarget.style.borderColor = 'rgba(139,92,246,0.4)';
            }}
          >
            {/* Google Play icon */}
            <div style={{
              width: 40, height: 40, borderRadius: 10, flexShrink: 0,
              background: 'rgba(139,92,246,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M3 20.5v-17c0-.83 1-.83 1.5-.5l15 8.5-15 8.5c-.5.33-1.5.33-1.5-.5z" fill={wall.color} />
              </svg>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontWeight: 700, fontSize: 13, color: wall.color, marginBottom: 3 }}>
                Download on Google Play
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: 12, lineHeight: 1.5 }}>
                Get the Spetro Earn app to unlock adjoe Playtime rewards.
              </p>
            </div>
            {/* Right arrow */}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke={wall.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, opacity: 0.7 }}>
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </div>
        </a>
      ) : (
        <button
          className="btn btn-primary"
          style={{ width: '100%', justifyContent: 'center' }}
          onClick={handleStartEarning}
        >
          {adjoeStarted ? 'Adjoe Running…' : 'Start Earning'}
        </button>
      )}
    </div>
  );
}
