import React from 'react';
import { HomeIcon, EarnIcon, WithdrawIcon, ProfileIcon } from './Icons';

function LockBadge() {
  return (
    <div style={{
      position: 'absolute', top: 0, right: '50%', transform: 'translateX(10px)',
      width: 12, height: 12, borderRadius: '50%',
      background: 'var(--bg-card2)', border: '1.5px solid var(--border)',
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <svg width="7" height="7" viewBox="0 0 7 7" fill="none">
        <rect x="1.5" y="3" width="4" height="3" rx="0.8" fill="var(--text-dim)" />
        <path d="M2.5 3V2a1 1 0 012 0v1" stroke="var(--text-dim)" strokeWidth="0.8" strokeLinecap="round" fill="none" />
      </svg>
    </div>
  );
}

const items = [
  { key: 'dashboard', label: 'Home', Icon: HomeIcon, lockable: false },
  { key: 'offerwalls', label: 'Earn', Icon: EarnIcon, lockable: true },
  { key: 'withdraw', label: 'Withdraw', Icon: WithdrawIcon, lockable: true },
  { key: 'profile', label: 'Profile', Icon: ProfileIcon, lockable: false }
];

export default function BottomNav({ active, onChange, guest }) {
  return (
    <nav className="bottom-nav">
      {items.map(({ key, label, Icon, lockable }) => (
        <button
          key={key}
          className={`nav-item${active === key ? ' active' : ''}`}
          onClick={() => onChange(key)}
          style={{ position: 'relative' }}
        >
          <Icon size={22} />
          {label}
          {guest && lockable && <LockBadge />}
        </button>
      ))}
    </nav>
  );
}
