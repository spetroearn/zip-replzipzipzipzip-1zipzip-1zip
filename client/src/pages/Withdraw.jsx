import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useToast } from '../components/Toast';
import { VisaIcon, BinanceIcon, LitecoinIcon, GooglePlayIcon, CoinIcon, LockIcon, XIcon } from '../components/Icons';

const MIN_COINS = 500;

const FIXED_TIERS = [
  { usd: 1, coins: 1000 },
  { usd: 2, coins: 2000 },
  { usd: 3, coins: 3000 },
  { usd: 5, coins: 5000 },
];

const METHODS = [
  {
    key: 'visa',
    label: 'Visa Card',
    subtitle: 'Real Visa credentials',
    Icon: VisaIcon,
    placeholder: 'Cardholder name (as on card)',
    fieldLabel: 'Card Holder Name',
    hint: 'Processing time: 1-3 business days',
    fixedTiers: true
  },
  {
    key: 'binance_usdt',
    label: 'Binance',
    subtitle: 'Crypto exchange',
    Icon: BinanceIcon,
    placeholder: 'Binance UID or USDT wallet address',
    fieldLabel: 'Binance UID / USDT Address',
    hint: 'Processing time: 1-3 business days',
    fixedTiers: false
  },
  {
    key: 'litecoin',
    label: 'Litecoin (LTC)',
    subtitle: 'Crypto payment',
    Icon: LitecoinIcon,
    placeholder: 'LTC wallet address (L...)',
    fieldLabel: 'LTC Wallet Address',
    hint: 'Litecoin mainnet only',
    fixedTiers: false
  },
  {
    key: 'google_play',
    label: 'Google Play',
    subtitle: 'Gift card via email',
    Icon: GooglePlayIcon,
    placeholder: 'your@gmail.com',
    fieldLabel: 'Google Account Email',
    hint: 'Gift card sent to your email within 24h',
    fixedTiers: true
  }
];

const methodShortLabel = {
  visa: 'Visa',
  binance_usdt: 'Binance',
  litecoin: 'LTC',
  google_play: 'Google Play'
};

// ── Sign-in required modal (shown to guests when they click a method) ────────
function SignInModal({ method, onClose, onGoLogin, onGoRegister }) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center'
      }}
      onClick={onClose}
    >
      <div
        className="scale-in"
        style={{
          width: '100%', maxWidth: 480,
          background: 'var(--bg-card)',
          borderTop: '1px solid var(--border)',
          borderRadius: '20px 20px 0 0',
          padding: '28px 24px 40px'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 42, height: 42, borderRadius: 12,
              background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <LockIcon size={20} style={{ stroke: 'var(--primary)' }} />
            </div>
            <div>
              <p style={{ fontWeight: 700, fontSize: 16 }}>Sign in required</p>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 1 }}>
                To withdraw via {method?.label}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6 }}
          >
            <XIcon size={18} style={{ stroke: 'var(--text-muted)' }} />
          </button>
        </div>

        <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.65, marginBottom: 22 }}>
          Create a free account to start earning and withdraw your coins to {method?.label}.
          Your balance is stored securely on our servers.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', fontSize: 15 }} onClick={onGoRegister}>
            Create Free Account
          </button>
          <button className="btn btn-outline" style={{ width: '100%', justifyContent: 'center' }} onClick={onGoLogin}>
            Sign In
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Withdraw ─────────────────────────────────────────────────────────────
export default function Withdraw({ user, guest, onUserUpdate, onGoLogin, onGoRegister }) {
  const toast = useToast();
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [destination, setDestination] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedTier, setSelectedTier] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [signInModal, setSignInModal] = useState(null);

  useEffect(() => {
    if (!guest) {
      api.withdraw.myWithdrawals().then((d) => setHistory(d.withdrawals)).catch(() => {});
    }
  }, [guest]);

  const method = METHODS.find((m) => m.key === selectedMethod);
  const useFixedTiers = method?.fixedTiers;
  const finalCoins = useFixedTiers ? (selectedTier ? selectedTier.coins : 0) : parseInt(amount) || 0;

  const handleMethodClick = (key) => {
    if (guest) {
      setSignInModal(METHODS.find((m) => m.key === key));
      return;
    }
    setSelectedMethod(key);
    setDestination('');
    setAmount('');
    setSelectedTier(null);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!selectedMethod) return toast.error('Please select a withdrawal method.');
    if (finalCoins < MIN_COINS) return toast.error(`Minimum withdrawal is ${MIN_COINS} SC.`);
    if (finalCoins > user.coins) return toast.error('Insufficient balance.');
    if (!destination.trim()) return toast.error(`Please enter your ${method?.fieldLabel}.`);

    setLoading(true);
    try {
      const data = await api.withdraw.submit({
        amount: finalCoins,
        method: selectedMethod,
        wallet_address: destination.trim()
      });
      toast.success(data.message);
      onUserUpdate({ ...user, coins: data.coins });
      setAmount('');
      setDestination('');
      setSelectedTier(null);
      api.withdraw.myWithdrawals().then((d) => setHistory(d.withdrawals)).catch(() => {});
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="screen fade-up">

      {/* Sign-in modal for guests */}
      {signInModal && (
        <SignInModal
          method={signInModal}
          onClose={() => setSignInModal(null)}
          onGoLogin={onGoLogin}
          onGoRegister={onGoRegister}
        />
      )}

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800 }}>Withdraw</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
          Minimum {MIN_COINS} SC · 1,000 SC = $1.00
        </p>
      </div>

      {/* Balance pill — only for logged-in */}
      {!guest && (
        <div className="card" style={{
          marginBottom: 20,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'linear-gradient(145deg, #0c1e32, #091525)',
          border: '1px solid rgba(14,165,233,0.15)'
        }}>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: 4 }}>
              Available Balance
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <CoinIcon size={22} />
              <span style={{ fontWeight: 900, fontSize: 24 }}>{(user.coins || 0).toLocaleString()}</span>
              <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>SC</span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 4 }}>Cash Value</p>
            <p style={{ fontWeight: 800, fontSize: 20, color: 'var(--success)' }}>
              ${((user.coins || 0) / 1000).toFixed(2)}
            </p>
          </div>
        </div>
      )}

      {/* Method selector */}
      <div className="card" style={{ marginBottom: 16 }}>
        <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>
          {guest ? 'Available Payout Methods' : 'Select Payout Method'}
        </p>
        <div className="stagger" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {METHODS.map((m) => {
            const active = !guest && selectedMethod === m.key;
            return (
              <button
                key={m.key}
                onClick={() => handleMethodClick(m.key)}
                className="slide-up"
                style={{
                  background: active ? 'rgba(14,165,233,0.08)' : 'var(--bg-card2)',
                  border: `1.5px solid ${active ? 'var(--primary)' : 'var(--border)'}`,
                  borderRadius: 12,
                  padding: '14px 12px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.18s',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  boxShadow: active ? 'var(--shadow-primary)' : 'none',
                  fontFamily: 'inherit',
                  position: 'relative'
                }}
              >
                {guest && (
                  <div style={{
                    position: 'absolute', top: 8, right: 8,
                    opacity: 0.5
                  }}>
                    <LockIcon size={13} style={{ stroke: 'var(--text-muted)' }} />
                  </div>
                )}
                <m.Icon size={30} />
                <div>
                  <p style={{ fontWeight: 700, fontSize: 13, color: active ? 'var(--primary)' : 'var(--text)' }}>
                    {m.label}
                  </p>
                  <p style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 1 }}>{m.subtitle}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Guest hint below methods */}
        {guest && (
          <div style={{
            marginTop: 14, padding: '12px 16px',
            background: 'rgba(14,165,233,0.05)',
            border: '1px solid rgba(14,165,233,0.15)',
            borderRadius: 10, textAlign: 'center'
          }}>
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
              Sign in to select a method and submit a withdrawal request.
            </p>
          </div>
        )}
      </div>

      {/* Details form — logged-in users only */}
      {!guest && selectedMethod && (
        <div className="card fade-up" style={{ marginBottom: 20 }}>
          <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 18 }}>Withdrawal Details</p>
          <form onSubmit={submit}>
            {useFixedTiers ? (
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 8 }}>
                  Select Amount
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                  {FIXED_TIERS.map((tier) => {
                    const active = selectedTier?.usd === tier.usd;
                    const canAfford = user.coins >= tier.coins;
                    return (
                      <button
                        key={tier.usd}
                        type="button"
                        onClick={() => canAfford && setSelectedTier(tier)}
                        style={{
                          padding: '10px 6px', borderRadius: 10,
                          border: `1.5px solid ${active ? 'var(--primary)' : 'var(--border)'}`,
                          background: active ? 'rgba(14,165,233,0.1)' : 'var(--bg-card2)',
                          color: active ? 'var(--primary)' : canAfford ? 'var(--text)' : 'var(--text-dim)',
                          fontWeight: 700, fontSize: 15, cursor: canAfford ? 'pointer' : 'not-allowed',
                          opacity: canAfford ? 1 : 0.4, transition: 'all 0.15s',
                          fontFamily: 'inherit', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2
                        }}
                      >
                        <span>${tier.usd}</span>
                        <span style={{ fontSize: 10, fontWeight: 600, color: active ? 'var(--primary-light)' : 'var(--text-muted)' }}>
                          {tier.coins.toLocaleString()} SC
                        </span>
                      </button>
                    );
                  })}
                </div>
                {selectedTier && (
                  <div style={{ marginTop: 10, padding: '10px 14px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 10 }}>
                    <p style={{ color: 'var(--success)', fontSize: 13, fontWeight: 600 }}>
                      You will receive <strong>${selectedTier.usd}.00 USD</strong> via {method.label}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="input-group">
                <label>Amount (SC)</label>
                <input
                  type="number" min={MIN_COINS} max={user.coins}
                  placeholder={`Min. ${MIN_COINS} SC`}
                  value={amount} onChange={(e) => setAmount(e.target.value)} required
                />
                {amount && !isNaN(parseInt(amount)) && parseInt(amount) >= MIN_COINS && (
                  <div style={{ marginTop: 8, padding: '10px 14px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 10 }}>
                    <p style={{ color: 'var(--success)', fontSize: 13, fontWeight: 600 }}>
                      Approximately <strong>${(parseInt(amount) / 1000).toFixed(2)} USD</strong> via {method.label}
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="input-group" style={{ marginTop: 14 }}>
              <label>{method.fieldLabel}</label>
              <input
                type={method.key === 'google_play' ? 'email' : 'text'}
                placeholder={method.placeholder}
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                required
              />
            </div>

            <p style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 18 }}>{method.hint}</p>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%' }}
              disabled={loading || user.coins < MIN_COINS || (useFixedTiers && !selectedTier)}
            >
              {loading
                ? <span className="spinner" />
                : user.coins < MIN_COINS
                  ? `Need ${MIN_COINS - user.coins} more SC`
                  : `Submit Withdrawal — ${methodShortLabel[selectedMethod]}`
              }
            </button>
          </form>
        </div>
      )}

      {/* History — logged-in users only */}
      {!guest && history.length > 0 && (
        <div>
          <p className="section-title">Withdrawal History</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {history.map((w) => (
              <div key={w.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '14px 18px' }}>
                <div>
                  <p style={{ fontWeight: 700, fontSize: 14 }}>{w.amount.toLocaleString()} SC</p>
                  <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 2 }}>
                    {methodShortLabel[w.method] || w.method} · {w.wallet_address}
                  </p>
                  <p style={{ color: 'var(--text-dim)', fontSize: 11, marginTop: 3 }}>
                    {new Date(w.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span className={`badge badge-${w.status}`}>{w.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
