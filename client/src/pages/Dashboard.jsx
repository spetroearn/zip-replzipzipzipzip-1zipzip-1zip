import React, { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../api';
import { useToast } from '../components/Toast';
import {
  CoinIcon, ZapIcon, WithdrawIcon, CheckIcon, BellIcon,
  ClockIcon, XIcon, ShieldIcon, TrendingUpIcon, LockIcon, SpetroMark
} from '../components/Icons';

function getLevel(coins) {
  return Math.min(Math.floor((coins || 0) / 100) + 1, 10);
}

function LevelBar({ coins }) {
  const level = getLevel(coins);
  const isMax = level >= 10;
  const progress = isMax ? 100 : ((coins % 100) / 100) * 100;
  const toNext = isMax ? 0 : 100 - (coins % 100);
  const COLORS = ['#0ea5e9','#22c55e','#f59e0b','#f97316','#ef4444','#a855f7','#ec4899','#06b6d4','#84cc16','#f59e0b'];
  const color = COLORS[(level - 1) % COLORS.length];
  return (
    <div style={{ marginTop: 14, marginBottom: 2 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <div style={{
            background: color + '22', border: `1px solid ${color}55`,
            borderRadius: 7, padding: '2px 9px',
            fontWeight: 800, fontSize: 11, color, letterSpacing: '0.06em'
          }}>
            LEVEL {level}
          </div>
          {isMax && (
            <span style={{ fontSize: 10, color: color, fontWeight: 700 }}>MAX</span>
          )}
        </div>
        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>
          {isMax ? 'Max level reached' : `${toNext} SC to Level ${level + 1}`}
        </span>
      </div>
      <div style={{ height: 5, borderRadius: 99, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 99,
          width: `${progress}%`,
          background: `linear-gradient(90deg, ${color}cc, ${color})`,
          transition: 'width 0.5s ease',
          boxShadow: `0 0 8px ${color}66`
        }} />
      </div>
    </div>
  );
}

// ── Push helpers ──────────────────────────────────────────────────────────────
const PUSH_KEY = 'spetro_push_asked_at';
const PUSH_RETRY_MS = 5 * 60 * 1000;

function shouldShowPushBanner() {
  if (!('Notification' in window)) return false;
  if (Notification.permission !== 'default') return false;
  const last = localStorage.getItem(PUSH_KEY);
  if (!last) return true;
  return Date.now() - parseInt(last) > PUSH_RETRY_MS;
}

// ── Push banner ───────────────────────────────────────────────────────────────
function PushBanner({ onDismiss }) {
  const toast = useToast();
  const [asking, setAsking] = useState(false);

  const requestPush = async () => {
    setAsking(true);
    try {
      const perm = await Notification.requestPermission();
      if (perm === 'granted') {
        try { await api.auth.pushSubscribe(); } catch (_) {}
        toast.success('Notifications enabled — you will be alerted on offer credits.');
      }
    } catch (_) {}
    onDismiss();
    setAsking(false);
  };

  return (
    <div className="push-banner">
      <div style={{
        width: 40, height: 40, borderRadius: 12, flexShrink: 0,
        background: 'rgba(14,165,233,0.12)', border: '1px solid rgba(14,165,233,0.28)',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <BellIcon size={20} style={{ stroke: 'var(--primary)' }} />
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>Enable Notifications</p>
        <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>
          Get instant alerts when offer coins are credited.
        </p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
        <button
          className="btn btn-primary"
          style={{ padding: '7px 14px', fontSize: 12 }}
          onClick={requestPush}
          disabled={asking}
        >
          {asking ? <span className="spinner" style={{ width: 14, height: 14 }} /> : 'Enable'}
        </button>
        <button
          style={{ padding: 4, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={onDismiss}
        >
          <XIcon size={14} style={{ stroke: 'var(--text-muted)' }} />
        </button>
      </div>
    </div>
  );
}

// ── Locked top offers (guest) ──────────────────────────────────────────────────
function LockedTopOffers() {
  const goGoogle = () => { window.location.href = '/api/auth/google'; };
  const OFFERS = [
    { logo: '/logos/coinmaster.png', name: 'Coin Master', task: 'Reach Village 3 to Earn', reward: '+1,200' },
    { logo: '/logos/tiktok.png', name: 'TikTok', task: 'Install & Watch Videos for 10 Mins to Earn', reward: '+800' },
    { logo: '/logos/monopolygo.jpg', name: 'Monopoly GO', task: 'Reach Board 5 to Earn', reward: '+2,500' },
    { logo: '/logos/riseofkingdoms.png', name: 'Rise of Kingdoms', task: 'Upgrade City Hall to Level 10 to Earn', reward: '+5,000' },
  ];
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <p className="section-title" style={{ margin: 0 }}>Top Offers</p>
        <span style={{
          fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase',
          color: 'var(--coin)', background: 'rgba(245,158,11,0.12)',
          border: '1px solid rgba(245,158,11,0.28)', borderRadius: 7, padding: '3px 9px'
        }}>Premium</span>
      </div>
      <div className="locked-offers-grid">
        {OFFERS.map((o) => (
          <button key={o.name} className="locked-offer-card" onClick={goGoogle}>
            <img src={o.logo} alt={o.name} className="locked-offer-logo" />
            <p className="locked-offer-name">{o.name}</p>
            <p className="locked-offer-task">{o.task}</p>
            <span className="locked-offer-reward">
              <CoinIcon size={14} /> {o.reward} SC
            </span>
            <div className="locked-offer-overlay">
              <div className="locked-offer-lock">
                <LockIcon size={20} style={{ stroke: 'var(--primary)' }} />
              </div>
              <span className="unlock-btn">
                <LockIcon size={13} style={{ stroke: '#fff' }} /> Unlock Offer
              </span>
            </div>
          </button>
        ))}
      </div>
    </>
  );
}

// ── Partner offerwalls grid (guest) ─────────────────────────────────────────────
function PartnerOfferwalls() {
  const PARTNERS = [
    { logo: '/logos/adjoe.png', name: 'adjoe' },
    { logo: '/logos/revu.png', name: 'Revu' },
    { logo: '/logos/offery.png', name: 'Offery' },
    { logo: '/logos/ovnix.png', name: 'Ovnix' },
    { logo: '/logos/adtowall.png', name: 'AdToWall' },
    { logo: '/logos/taskwall.png', name: 'TaskWall' },
    { logo: '/logos/torox.svg', name: 'Torox' },
    { logo: '/logos/mychips.svg', name: 'MyChips' },
  ];
  return (
    <>
      <p className="section-title">Our Offerwalls</p>
      <div className="partner-grid">
        {PARTNERS.map((p) => (
          <div key={p.name} className="partner-cell">
            <img src={p.logo} alt={p.name} />
          </div>
        ))}
      </div>
      <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 12.5, lineHeight: 1.6, marginBottom: 8 }}>
        Sign in to unlock access to all our trusted rewards networks.
      </p>
    </>
  );
}

// ── Guest landing ─────────────────────────────────────────────────────────────
function GuestLanding({ onGoLogin, onGoRegister }) {
  const FEATURES = [
    {
      Icon: ZapIcon,
      color: 'var(--primary)',
      bg: 'rgba(14,165,233,0.1)',
      title: 'Complete Offers',
      desc: 'Browse offerwalls and earn SpetroCoins by installing apps, completing surveys, or playing games.'
    },
    {
      Icon: CoinIcon,
      color: 'var(--coin)',
      bg: 'rgba(245,158,11,0.1)',
      title: 'Earn SpetroCoins',
      desc: 'Every action credits coins to your account instantly. 1,000 SC equals $1.00 in real money.'
    },
    {
      Icon: WithdrawIcon,
      color: 'var(--success)',
      bg: 'rgba(16,185,129,0.1)',
      title: 'Withdraw Real Money',
      desc: 'Cash out via Visa card, Binance, Litecoin, or a Google Play gift card — processed in 1-3 days.'
    },
    {
      Icon: ShieldIcon,
      color: '#8b5cf6',
      bg: 'rgba(139,92,246,0.1)',
      title: 'Tamper-Proof Balance',
      desc: 'Your coin balance is stored server-side. No client-side hacks, mods, or cheats can touch it.'
    }
  ];

  return (
    <div className="fade-up">
      {/* Hero card */}
      <div style={{
        background: 'linear-gradient(145deg, #0c1e32, #091525)',
        border: '1px solid rgba(14,165,233,0.2)',
        borderRadius: 20, padding: '28px 22px',
        marginBottom: 18, overflow: 'hidden', position: 'relative'
      }}
        className="border-pulse"
      >
        {/* Decorative glow */}
        <div style={{
          position: 'absolute', top: -60, right: -60, width: 200, height: 200,
          borderRadius: '50%', background: 'radial-gradient(circle, rgba(14,165,233,0.12) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
          <SpetroMark size={52} className="float-y" style={{ flexShrink: 0, borderRadius: 15 }} />
          <div>
            <p style={{ fontWeight: 900, fontSize: 22, letterSpacing: '-0.02em' }}>Spetro Earn</p>
            <p style={{ color: 'var(--primary)', fontSize: 13, fontWeight: 600, marginTop: 2 }}>
              Complete Offers · Earn Real Rewards
            </p>
          </div>
        </div>

        <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.7, marginBottom: 22 }}>
          Spetro Earn is a reward platform where you complete simple tasks from our
          partner offerwalls and get paid in <strong style={{ color: 'var(--text)' }}>real money</strong>.
          Your earnings are stored securely on our servers — immune to any tampering.
        </p>

        {/* Mini stat bar */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 22, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)' }}>
          {[
            { label: 'Rate', value: '1,000 SC = $1' },
            { label: 'Min. Withdraw', value: '500 SC' },
            { label: 'Processing', value: '1-3 days' }
          ].map((s, i) => (
            <div key={s.label} style={{
              flex: 1, padding: '10px 8px', textAlign: 'center',
              background: 'var(--bg-card2)',
              borderRight: i < 2 ? '1px solid var(--border)' : 'none'
            }}>
              <p style={{ color: 'var(--text-muted)', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>{s.label}</p>
              <p style={{ fontWeight: 800, fontSize: 12, color: 'var(--primary)' }}>{s.value}</p>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            className="btn btn-primary"
            style={{ flex: 1, justifyContent: 'center', gap: 8 }}
            onClick={onGoRegister}
          >
            <ZapIcon size={16} style={{ stroke: '#fff' }} />
            Get Started — Free
          </button>
          <button
            className="btn btn-outline"
            style={{ flex: 1, justifyContent: 'center' }}
            onClick={onGoLogin}
          >
            Sign In
          </button>
        </div>
      </div>

      {/* Locked top offers */}
      <LockedTopOffers />

      {/* Partner offerwalls */}
      <PartnerOfferwalls />

      {/* Locked balance preview */}
      <div style={{ position: 'relative', marginBottom: 18 }}>
        {/* Blurred preview */}
        <div style={{
          background: 'linear-gradient(145deg, #0c1e32, #091525)',
          border: '1px solid rgba(14,165,233,0.12)',
          borderRadius: 18, padding: '24px 22px',
          filter: 'blur(3px)', userSelect: 'none', pointerEvents: 'none'
        }}>
          <p style={{ color: 'var(--text-muted)', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Your Balance</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <CoinIcon size={44} />
            <span style={{ fontSize: 36, fontWeight: 900 }}>0</span>
            <span style={{ color: 'var(--text-muted)', fontSize: 14, fontWeight: 600 }}>SC</span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>$0.00 USD · 1,000 SC = $1.00</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 20 }}>
            <div style={{ height: 46, borderRadius: 10, background: 'var(--bg-card2)' }} />
            <div style={{ height: 46, borderRadius: 10, background: 'var(--bg-card2)' }} />
          </div>
        </div>
        {/* Overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: 'var(--bg-card)', border: '1px solid var(--border-light)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <LockIcon size={22} style={{ stroke: 'var(--text-muted)' }} />
          </div>
          <p style={{ fontWeight: 700, fontSize: 15 }}>Sign in to see your balance</p>
          <button
            className="btn btn-primary"
            style={{ padding: '9px 22px', fontSize: 13 }}
            onClick={onGoRegister}
          >
            Create Free Account
          </button>
        </div>
      </div>

      {/* How it works */}
      <p className="section-title">How It Works</p>
      <div className="stagger" style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 8 }}>
        {FEATURES.map(({ Icon, color, bg, title, desc }) => (
          <div key={title} className="card slide-up" style={{ display: 'flex', gap: 16, alignItems: 'flex-start', padding: '16px 18px' }}>
            <div style={{
              width: 42, height: 42, borderRadius: 12, flexShrink: 0,
              background: bg,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Icon size={20} style={{ stroke: color }} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 700, fontSize: 14, color, marginBottom: 4 }}>{title}</p>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.55 }}>{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Logged-in balance card ────────────────────────────────────────────────────
function BalanceCard({ coins, onEarn, onWithdraw }) {
  const usdValue = (coins / 1000).toFixed(2);
  return (
    <div style={{
      background: 'linear-gradient(145deg, #0c1e32 0%, #091525 100%)',
      border: '1px solid rgba(14,165,233,0.2)',
      borderRadius: 18, padding: '28px 24px 24px',
      marginBottom: 16, position: 'relative', overflow: 'hidden'
    }}>
      <div style={{ position: 'absolute', top: -40, right: -40, width: 140, height: 140, borderRadius: '50%', background: 'radial-gradient(circle, rgba(14,165,233,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <p style={{ color: 'var(--text-muted)', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Your Balance</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
        <CoinIcon size={48} />
        <span style={{ fontSize: 38, fontWeight: 900, color: 'var(--text)', lineHeight: 1 }}>{coins.toLocaleString()}</span>
        <span style={{ color: 'var(--text-muted)', fontSize: 14, fontWeight: 600, marginTop: 8 }}>SC</span>
      </div>
      <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
        <span style={{ color: 'var(--success)', fontWeight: 700 }}>${usdValue} USD</span>
        <span style={{ marginLeft: 6 }}>· 1,000 SC = $1.00</span>
      </p>
      <LevelBar coins={coins} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 18 }}>
        <button className="btn btn-primary" style={{ width: '100%', gap: 10, justifyContent: 'center' }} onClick={onEarn}>
          <ZapIcon size={17} style={{ stroke: '#fff' }} />
          Earn Coins
        </button>
        <button className="btn btn-outline" style={{ width: '100%', gap: 10, justifyContent: 'center' }} onClick={onWithdraw}>
          <WithdrawIcon size={17} style={{ stroke: 'var(--primary)' }} />
          Withdraw
        </button>
      </div>
    </div>
  );
}

// ── Week streak ───────────────────────────────────────────────────────────────
function WeekStreak({ streak, lastCheckin, onClaim, loading }) {
  const today = new Date().toISOString().split('T')[0];
  const lastDate = lastCheckin ? new Date(lastCheckin).toISOString().split('T')[0] : null;
  const claimedToday = lastDate === today;
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const cur = streak || 0;

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <p style={{ fontWeight: 700, fontSize: 15 }}>Daily Check-in</p>
          <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 2 }}>+5 SC per day · Streak bonus on Day 7</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ color: 'var(--primary)', fontWeight: 800, fontSize: 16 }}>{cur}/7</p>
          <p style={{ color: 'var(--text-muted)', fontSize: 11 }}>streak</p>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 18 }}>
        {days.map((d, i) => {
          const n = i + 1;
          const claimed = n <= cur;
          const isToday = n === cur + 1 && !claimedToday;
          const isClaimedToday = n === cur && claimedToday;
          return (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
              <div style={{
                width: '100%', aspectRatio: '1', borderRadius: 10,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: claimed || isClaimedToday
                  ? 'linear-gradient(135deg, var(--primary), var(--primary-dark))'
                  : isToday ? 'rgba(14,165,233,0.1)' : 'var(--bg-card2)',
                border: isToday ? '1.5px solid var(--primary)'
                  : claimed || isClaimedToday ? 'none' : '1px solid var(--border)',
                boxShadow: isToday ? 'var(--shadow-primary)' : 'none',
                transition: 'all 0.22s', position: 'relative'
              }}>
                {claimed || isClaimedToday
                  ? <CheckIcon size={13} style={{ stroke: '#fff', strokeWidth: 2.5 }} />
                  : <span style={{ fontSize: 10, fontWeight: 700, color: isToday ? 'var(--primary)' : 'var(--text-dim)' }}>+5</span>
                }
                {n === 7 && (
                  <div style={{ position: 'absolute', top: -5, right: -3, background: 'var(--warning)', borderRadius: 4, width: 14, height: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <TrendingUpIcon size={8} style={{ stroke: '#000' }} />
                  </div>
                )}
              </div>
              <span style={{ fontSize: 10, fontWeight: 600, color: claimed || isClaimedToday ? 'var(--primary)' : 'var(--text-dim)' }}>{d}</span>
            </div>
          );
        })}
      </div>
      <button
        className="btn btn-primary"
        style={{ width: '100%', opacity: claimedToday ? 0.5 : 1 }}
        onClick={onClaim}
        disabled={loading || claimedToday}
      >
        {loading ? <span className="spinner" />
          : claimedToday ? 'Claimed Today — Come Back Tomorrow'
          : `Claim Day ${cur + 1} (+5 SC)`}
      </button>
    </div>
  );
}

// ── Transaction row ───────────────────────────────────────────────────────────
function TxRow({ tx }) {
  const icons = {
    welcome_bonus: <ZapIcon size={16} style={{ stroke: 'var(--warning)' }} />,
    daily_checkin: <ClockIcon size={16} style={{ stroke: 'var(--primary)' }} />,
    withdrawal: <WithdrawIcon size={16} style={{ stroke: 'var(--error)' }} />,
    adjoy_offer: <CoinIcon size={22} />,
    revu_offer: <CoinIcon size={22} />,
    offery_offer: <CoinIcon size={22} />,
    ovnix_offer: <CoinIcon size={22} />,
  };
  const labels = {
    welcome_bonus: 'Welcome Bonus',
    daily_checkin: 'Daily Check-in',
    withdrawal: 'Withdrawal',
    adjoy_offer: 'adjoe Offer',
    revu_offer: 'Revu Offer',
    offery_offer: 'Offery Offer',
    ovnix_offer: 'Ovnix Offer',
    admin_adjustment: 'Admin Adjustment',
  };
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '13px 0', borderBottom: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--bg-card2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid var(--border)' }}>
          {icons[tx.type] || <CoinIcon size={16} />}
        </div>
        <div>
          <p style={{ fontWeight: 600, fontSize: 14 }}>{labels[tx.type] || tx.type}</p>
          <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 1 }}>
            {new Date(tx.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>
      <span style={{ fontWeight: 800, fontSize: 15, color: tx.amount > 0 ? 'var(--success)' : 'var(--error)', whiteSpace: 'nowrap' }}>
        {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()} SC
      </span>
    </div>
  );
}

// ── Social banner (Telegram / YouTube) ─────────────────────────────────────────
function SocialBanner({ href, gradient, borderColor, iconBg, accent, title, desc, icon }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 14,
        background: gradient,
        border: `1px solid ${borderColor}`,
        borderRadius: 16, padding: '16px 18px', marginBottom: 12,
      }}
    >
      <div style={{
        width: 44, height: 44, borderRadius: 12, flexShrink: 0,
        background: iconBg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', marginBottom: 2 }}>
          {title}
        </p>
        <p style={{ color: 'var(--text-muted)', fontSize: 12, lineHeight: 1.5 }}>
          {desc}
        </p>
      </div>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke={accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, opacity: 0.8 }}>
        <path d="M9 18l6-6-6-6"/>
      </svg>
    </a>
  );
}

function TelegramBanner() {
  return (
    <SocialBanner
      href="https://t.me/spetroearn"
      gradient="linear-gradient(135deg, #0a2a44, #0a1f33)"
      borderColor="rgba(34,158,217,0.35)"
      iconBg="rgba(34,158,217,0.18)"
      accent="#229ED9"
      title="Follow us on Telegram"
      desc="Join our channel for news, payout proofs, and bonus drops."
      icon={
        <svg width="24" height="24" viewBox="0 0 24 24" fill="#229ED9">
          <path d="M21.95 4.32 18.7 19.66c-.24 1.08-.88 1.35-1.78.84l-4.92-3.63-2.37 2.28c-.26.26-.48.48-.99.48l.35-5.02 9.13-8.25c.4-.35-.09-.55-.62-.2L5.2 13.04l-4.86-1.52c-1.06-.33-1.08-1.06.22-1.57L20.58 2.8c.88-.33 1.65.2 1.37 1.52Z"/>
        </svg>
      }
    />
  );
}

function YouTubeBanner() {
  return (
    <SocialBanner
      href="https://www.youtube.com/@SpetroEarn"
      gradient="linear-gradient(135deg, #2e0d10, #1f0b0d)"
      borderColor="rgba(255,0,0,0.32)"
      iconBg="rgba(255,0,0,0.16)"
      accent="#FF0000"
      title="Follow us on YouTube"
      desc="Watch tutorials, payout proofs, and earning tips."
      icon={
        <svg width="26" height="26" viewBox="0 0 24 24" fill="#FF0000">
          <path d="M23.5 6.2a3.02 3.02 0 0 0-2.12-2.14C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.38.51A3.02 3.02 0 0 0 .5 6.2C0 8.07 0 12 0 12s0 3.93.5 5.8a3.02 3.02 0 0 0 2.12 2.14c1.88.51 9.38.51 9.38.51s7.5 0 9.38-.51a3.02 3.02 0 0 0 2.12-2.14C24 15.93 24 12 24 12s0-3.93-.5-5.8ZM9.6 15.6V8.4l6.27 3.6L9.6 15.6Z"/>
        </svg>
      }
    />
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function Dashboard({ user, guest, onUserUpdate, onNavigate, onGoLogin, onGoRegister }) {
  const toast = useToast();
  const [transactions, setTransactions] = useState([]);
  const [claimingDaily, setClaimingDaily] = useState(false);
  const [showPushBanner, setShowPushBanner] = useState(false);
  const retryTimer = useRef(null);
  const secretCount = useRef(0);
  const secretTimer = useRef(null);

  useEffect(() => {
    if (!guest) {
      api.coins.history().then((d) => setTransactions(d.transactions)).catch(() => {});
    }

    const checkPush = () => {
      if (shouldShowPushBanner()) {
        setShowPushBanner(true);
      } else if ('Notification' in window && Notification.permission === 'default') {
        const last = parseInt(localStorage.getItem(PUSH_KEY) || '0');
        const wait = PUSH_RETRY_MS - (Date.now() - last);
        if (wait > 0) {
          retryTimer.current = setTimeout(() => setShowPushBanner(true), wait);
        }
      }
    };

    const t = setTimeout(checkPush, 1800);
    return () => {
      clearTimeout(t);
      if (retryTimer.current) clearTimeout(retryTimer.current);
    };
  }, [guest]);

  const claimDaily = useCallback(async () => {
    setClaimingDaily(true);
    try {
      const data = await api.coins.claimDaily();
      toast.success(data.message);
      onUserUpdate({ ...user, coins: data.coins, last_checkin: new Date().toISOString(), checkin_streak: data.checkin_streak });
      setTransactions((prev) => [{
        id: Date.now(), amount: 5, type: 'daily_checkin',
        description: `Daily check-in (Day ${data.checkin_streak})`,
        created_at: new Date().toISOString()
      }, ...prev]);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setClaimingDaily(false);
    }
  }, [user, onUserUpdate, toast]);

  const dismissPush = () => {
    setShowPushBanner(false);
    localStorage.setItem(PUSH_KEY, String(Date.now()));
    retryTimer.current = setTimeout(() => {
      if (shouldShowPushBanner()) setShowPushBanner(true);
    }, PUSH_RETRY_MS);
  };

  const handleSecretTap = () => {
    secretCount.current += 1;
    clearTimeout(secretTimer.current);
    if (secretCount.current >= 3) {
      secretCount.current = 0;
      sessionStorage.setItem('secret_adtowall', '1');
      onNavigate('offerwalls');
    }
    secretTimer.current = setTimeout(() => { secretCount.current = 0; }, 2000);
  };

  // ── Guest view ────────────────────────────────────────────────────────────
  if (guest) {
    return (
      <div className="screen">
        {showPushBanner && <PushBanner onDismiss={dismissPush} />}
        <GuestLanding onGoLogin={onGoLogin} onGoRegister={onGoRegister} />
      </div>
    );
  }

  // ── Logged-in view ────────────────────────────────────────────────────────
  return (
    <div className="screen fade-up">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <p
            onClick={handleSecretTap}
            style={{ color: 'var(--text-muted)', fontSize: 13, cursor: 'default', userSelect: 'none' }}
          >
            {user?.welcome_bonus_claimed ? 'Welcome back,' : 'Welcome,'}
          </p>
          <h2 style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.2 }}>{user?.name}</h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20, padding: '5px 12px' }}>
          <CoinIcon size={24} />
          <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--coin)' }}>{(user?.coins || 0).toLocaleString()}</span>
        </div>
      </div>

      {showPushBanner && <PushBanner onDismiss={dismissPush} />}

      <div className="dash-grid">
        <div className="dash-col">
          <BalanceCard
            coins={user?.coins || 0}
            onEarn={() => onNavigate('offerwalls')}
            onWithdraw={() => onNavigate('withdraw')}
          />

          <TelegramBanner />
          <YouTubeBanner />
        </div>

        <div className="dash-col">
          <WeekStreak
            streak={user?.checkin_streak || 0}
            lastCheckin={user?.last_checkin}
            onClaim={claimDaily}
            loading={claimingDaily}
          />

          <div>
            <p className="section-title">Recent Activity</p>
            {transactions.length === 0 ? (
              <div className="empty-state">
                <CoinIcon size={60} />
                <p style={{ marginTop: 12, fontWeight: 600 }}>No transactions yet</p>
                <p style={{ fontSize: 13, marginTop: 4 }}>Start earning by completing offers</p>
              </div>
            ) : (
              <div className="card" style={{ padding: '0 18px' }}>
                {transactions.slice(0, 10).map((tx) => <TxRow key={tx.id} tx={tx} />)}
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
