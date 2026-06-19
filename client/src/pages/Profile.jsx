import React, { useState } from 'react';
import { api } from '../api';
import { useToast } from '../components/Toast';
import {
  ArrowLeftIcon, CopyIcon, LogOutIcon, GlobeIcon,
  ShieldIcon, BellIcon, ZapIcon, CoinIcon, WithdrawIcon, LockIcon, SupportIcon
} from '../components/Icons';
import Support from './Support';

const PUSH_KEY = 'spetro_push_asked_at';

const AVATAR_PALETTES = [
  ['#0ea5e9','#0369a1'],['#8b5cf6','#6d28d9'],['#10b981','#065f46'],
  ['#f59e0b','#b45309'],['#ef4444','#991b1b'],['#06b6d4','#0e7490'],
  ['#a78bfa','#7c3aed'],['#34d399','#059669'],['#fb923c','#c2410c'],
  ['#f472b6','#be185d'],['#60a5fa','#1d4ed8'],['#4ade80','#15803d'],
  ['#facc15','#a16207'],['#818cf8','#4338ca'],['#2dd4bf','#0f766e'],
  ['#fb7185','#be123c'],['#38bdf8','#0284c7'],['#a3e635','#4d7c0f'],
  ['#c084fc','#9333ea'],['#fdba74','#ea580c'],['#86efac','#16a34a'],
  ['#fda4af','#e11d48'],['#93c5fd','#2563eb'],['#6ee7b7','#047857'],
  ['#fcd34d','#d97706'],['#c4b5fd','#7c3aed'],['#5eead4','#0d9488'],
  ['#fca5a5','#dc2626'],['#7dd3fc','#0369a1'],['#bbf7d0','#15803d'],
];

function countryCodeToFlag(code) {
  if (!code || code.length !== 2) return '';
  const offset = 0x1F1E6 - 65;
  return String.fromCodePoint(code.charCodeAt(0) + offset) +
         String.fromCodePoint(code.charCodeAt(1) + offset);
}

function Avatar({ seed, name, size = 72 }) {
  const idx = ((seed || 1) - 1) % AVATAR_PALETTES.length;
  const [from, to] = AVATAR_PALETTES[idx];
  const letter = (name || 'U').charAt(0).toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.28,
      background: `linear-gradient(135deg, ${from}, ${to})`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.42, fontWeight: 900, color: '#fff', flexShrink: 0,
      boxShadow: `0 4px 20px ${from}55`, letterSpacing: '-0.02em', userSelect: 'none'
    }}>
      {letter}
    </div>
  );
}

function GuestProfile({ onGoLogin, onGoRegister, onBack }) {
  const BENEFITS = [
    { Icon: CoinIcon, color: 'var(--coin)', bg: 'rgba(245,158,11,0.1)', title: 'Earn real rewards', desc: "Complete offers and get paid via Visa, Binance, LTC, or Google Play" },
    { Icon: WithdrawIcon, color: 'var(--success)', bg: 'rgba(16,185,129,0.1)', title: 'Withdraw anytime', desc: "Cash out as soon as you hit 500 SC — that's just $0.50" },
    { Icon: ShieldIcon, color: 'var(--primary)', bg: 'rgba(14,165,233,0.1)', title: 'Secure & tamper-proof', desc: "Your balance lives on our servers — no cheats or mods can change it" },
  ];

  return (
    <div className="screen fade-up">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
        <button onClick={onBack} style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--bg-card)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <ArrowLeftIcon size={18} style={{ stroke: 'var(--text-muted)' }} />
        </button>
        <h2 style={{ fontSize: 20, fontWeight: 700 }}>Profile</h2>
      </div>

      <div style={{ background: 'linear-gradient(145deg, #0c1e32, #091525)', border: '1px solid rgba(14,165,233,0.18)', borderRadius: 20, padding: '36px 24px', textAlign: 'center', marginBottom: 16 }}>
        <div style={{ width: 72, height: 72, borderRadius: 22, background: 'var(--bg-card2)', border: '1.5px dashed var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }} className="float-y">
          <LockIcon size={28} style={{ stroke: 'var(--text-muted)' }} />
        </div>
        <p style={{ fontWeight: 800, fontSize: 19, marginBottom: 8 }}>You are not signed in</p>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
          Create a free account to track your earnings,<br />view your history, and withdraw rewards.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', gap: 8 }} onClick={onGoRegister}>
            <ZapIcon size={16} style={{ stroke: '#fff' }} />
            Create Free Account
          </button>
          <button className="btn btn-outline" style={{ width: '100%', justifyContent: 'center' }} onClick={onGoLogin}>
            Sign In to Existing Account
          </button>
        </div>
      </div>

      <div className="stagger" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {BENEFITS.map(({ Icon, color, bg, title, desc }) => (
          <div key={title} className="card slide-up" style={{ display: 'flex', gap: 14, alignItems: 'flex-start', padding: '16px 18px' }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon size={18} style={{ stroke: color }} />
            </div>
            <div>
              <p style={{ fontWeight: 700, fontSize: 14, color, marginBottom: 3 }}>{title}</p>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.5 }}>{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Profile({ user, guest, onLogout, onBack, onGoLogin, onGoRegister }) {
  const toast = useToast();
  const [loggingOut, setLoggingOut] = useState(false);
  const [section, setSection] = useState('main'); // 'main' | 'support'
  const [notifState, setNotifState] = useState(
    'Notification' in window ? Notification.permission : 'unsupported'
  );

  if (guest) {
    return <GuestProfile onGoLogin={onGoLogin} onGoRegister={onGoRegister} onBack={onBack} />;
  }

  const logout = async () => {
    setLoggingOut(true);
    try { await api.auth.logout(); } catch (_) {}
    onLogout();
  };

  const copyUID = () => {
    const uid = user.uid || 'N/A';
    if (navigator.clipboard) {
      navigator.clipboard.writeText(uid).then(() => toast.success('Account ID copied to clipboard.'));
    } else {
      toast.info(`Your ID: ${uid}`);
    }
  };

  const enableNotifications = async () => {
    if (!('Notification' in window)) return toast.info('Notifications not supported in this browser.');
    if (Notification.permission === 'granted') return toast.info('Notifications are already enabled.');
    try {
      const perm = await Notification.requestPermission();
      setNotifState(perm);
      if (perm === 'granted') {
        localStorage.setItem(PUSH_KEY, '0');
        try { await api.auth.pushSubscribe(); } catch (_) {}
        toast.success('Notifications enabled successfully.');
      } else {
        toast.info('Notifications blocked. Enable them in your browser settings.');
      }
    } catch (_) {}
  };

  const statusColor = user.status === 'banned' ? 'var(--error)' : 'var(--success)';
  const statusLabel = user.status === 'banned' ? 'Banned' : 'Active';
  const notifGranted = notifState === 'granted';
  const flag = countryCodeToFlag(user.country_code);
  const locationDisplay = user.country && user.country !== 'Unknown'
    ? `${flag ? flag + ' ' : ''}${user.country}`
    : 'Unknown';

  if (section === 'support') {
    return (
      <div className="screen fade-up">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 }}>
          <button
            onClick={() => setSection('main')}
            style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--bg-card)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'border-color 0.2s', flexShrink: 0 }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
          >
            <ArrowLeftIcon size={18} style={{ stroke: 'var(--text-muted)' }} />
          </button>
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>Support</h2>
        </div>
        <Support user={user} guest={false} embedded />
      </div>
    );
  }

  return (
    <div className="screen fade-up">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button
          onClick={onBack}
          style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--bg-card)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'border-color 0.2s', flexShrink: 0 }}
          onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
          onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
        >
          <ArrowLeftIcon size={18} style={{ stroke: 'var(--text-muted)' }} />
        </button>
        <h2 style={{ fontSize: 20, fontWeight: 700 }}>My Profile</h2>
      </div>

      {/* User identity card */}
      <div className="card" style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 16, padding: '20px' }}>
        <Avatar seed={user.avatar_seed} name={user.name} size={66} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 800, fontSize: 18, lineHeight: 1.2, marginBottom: 3 }}>{user.name}</p>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
            <span className={`badge badge-${user.status === 'banned' ? 'banned' : 'active'}`} style={{ fontSize: 10 }}>{statusLabel}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--border)' }} />
              <span style={{ color: 'var(--primary)', fontWeight: 800, fontSize: 14 }}>{(user.coins || 0).toLocaleString()} SC</span>
            </div>
          </div>
        </div>
      </div>

      {/* Account ID */}
      <div style={{ background: 'linear-gradient(145deg, #071e2e, #0a2840)', border: '1px solid rgba(14,165,233,0.3)', borderRadius: 14, padding: '18px 20px', marginBottom: 14 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Account ID</p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <code style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', fontFamily: 'monospace', letterSpacing: '0.15em', background: 'rgba(14,165,233,0.06)', padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(14,165,233,0.15)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user.uid || 'Generating...'}
          </code>
          <button onClick={copyUID} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(14,165,233,0.12)', border: '1px solid rgba(14,165,233,0.3)', borderRadius: 8, padding: '8px 14px', color: 'var(--primary)', fontWeight: 700, fontSize: 13, cursor: 'pointer', flexShrink: 0, transition: 'background 0.2s', fontFamily: 'inherit' }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(14,165,233,0.2)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(14,165,233,0.12)'}
          >
            <CopyIcon size={14} style={{ stroke: 'var(--primary)' }} />
            Copy
          </button>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 8 }}>Share this ID with support when requesting offer reviews.</p>
      </div>

      {/* Info rows */}
      <div className="card" style={{ marginBottom: 14, padding: '0 20px' }}>
        {[
          { Icon: GlobeIcon, label: 'Location', value: locationDisplay, color: user.country && user.country !== 'Unknown' ? 'var(--text)' : 'var(--text-muted)' },
          { Icon: ShieldIcon, label: 'Account Status', value: statusLabel, color: statusColor, isLast: true }
        ].map(({ Icon, label, value, color, isLast }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 0', borderBottom: isLast ? 'none' : '1px solid var(--border)' }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: 'var(--bg-card2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon size={17} style={{ stroke: 'var(--primary)' }} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ color: 'var(--text-muted)', fontSize: 12, fontWeight: 600, marginBottom: 2 }}>{label}</p>
              <p style={{ fontWeight: 700, fontSize: 14, color }}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Notifications — hidden in native app (WebView doesn't support Web Push) */}
      {!window.AndroidBridge && (
      <div className="card" style={{ marginBottom: 14, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 34, height: 34, borderRadius: 9, flexShrink: 0, background: notifGranted ? 'rgba(14,165,233,0.1)' : 'var(--bg-card2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <BellIcon size={17} style={{ stroke: notifGranted ? 'var(--primary)' : 'var(--text-muted)' }} />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontWeight: 700, fontSize: 14 }}>Push Notifications</p>
          <p style={{ color: notifGranted ? 'var(--success)' : 'var(--text-muted)', fontSize: 12, marginTop: 1 }}>
            {notifGranted ? 'Enabled — you will receive offer alerts'
              : notifState === 'denied' ? 'Blocked in browser settings'
              : notifState === 'unsupported' ? 'Not supported on this browser'
              : 'Not yet enabled'}
          </p>
        </div>
        {!notifGranted && notifState !== 'unsupported' && (
          <button className="btn btn-primary" style={{ padding: '8px 14px', fontSize: 13, flexShrink: 0 }} onClick={enableNotifications}>Enable</button>
        )}
        {notifGranted && <ShieldIcon size={18} style={{ stroke: 'var(--success)', flexShrink: 0 }} />}
      </div>
      )}

      {/* Support row */}
      <button
        onClick={() => setSection('support')}
        className="card"
        style={{ width: '100%', marginBottom: 14, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', border: '1px solid var(--border)', background: 'var(--bg-card)', textAlign: 'left', fontFamily: 'inherit', transition: 'border-color 0.2s' }}
        onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
        onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
      >
        <div style={{ width: 34, height: 34, borderRadius: 9, background: 'var(--bg-card2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <SupportIcon size={17} style={{ stroke: 'var(--primary)' }} />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontWeight: 700, fontSize: 14 }}>Support & Help</p>
          <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 1 }}>Open a ticket or check your existing requests</p>
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-dim)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>

      <button className="btn btn-danger" style={{ width: '100%', gap: 10 }} onClick={logout} disabled={loggingOut}>
        {loggingOut
          ? <span className="spinner" style={{ borderTopColor: 'var(--error)' }} />
          : <LogOutIcon size={17} style={{ stroke: 'var(--error)' }} />
        }
        Sign Out
      </button>
    </div>
  );
}
