import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useToast } from '../components/Toast';
import { CoinIcon, LockIcon, XIcon, CheckIcon } from '../components/Icons';

const MIN_COINS = 500;

const FIXED_TIERS = [
  { usd: 1,  coins: 1000  },
  { usd: 2,  coins: 2000  },
  { usd: 3,  coins: 3000  },
  { usd: 5,  coins: 5000  },
  { usd: 10, coins: 10000 },
];

const METHODS = [
  {
    key: 'visa',
    label: 'Visa Card',
    subtitle: 'Virtual gift card · Email delivery',
    logo: '/logos/visa.svg',
    logoBg: 'linear-gradient(135deg,#1a1f5e,#0f1340)',
    accent: '#1a56db',
    glow: 'rgba(26,86,219,0.35)',
    placeholder: 'your@email.com',
    fieldLabel: 'Email Address',
    hint: 'Virtual Visa gift card sent within 24 hours',
    inputType: 'email',
    fixedTiers: true,
  },
  {
    key: 'binance_usdt',
    label: 'Binance USDT',
    subtitle: 'Crypto · Binance Pay or wallet',
    logo: '/logos/binance.svg',
    logoBg: 'linear-gradient(135deg,#2a1e00,#3d2c00)',
    accent: '#f0b90b',
    glow: 'rgba(240,185,11,0.3)',
    placeholder: 'Binance UID or USDT wallet address',
    fieldLabel: 'Binance UID / USDT Address',
    hint: 'Processed within 1–3 business days',
    fixedTiers: false,
  },
  {
    key: 'litecoin',
    label: 'Litecoin',
    subtitle: 'Crypto · LTC mainnet',
    logo: '/logos/litecoin.svg',
    logoBg: 'linear-gradient(135deg,#0d1f2d,#122a40)',
    accent: '#a5a9b8',
    glow: 'rgba(165,169,184,0.25)',
    placeholder: 'LTC wallet address (L...)',
    fieldLabel: 'LTC Wallet Address',
    hint: 'Litecoin mainnet only — double check your address',
    fixedTiers: false,
  },
  {
    key: 'google_play',
    label: 'Google Play',
    subtitle: 'Gift card · Email delivery',
    logo: '/logos/googleplay.svg',
    logoBg: 'linear-gradient(135deg,#041a10,#062a1a)',
    accent: '#34a853',
    glow: 'rgba(52,168,83,0.3)',
    placeholder: 'your@gmail.com',
    fieldLabel: 'Google Account Email',
    hint: 'Google Play gift card sent within 24 hours',
    inputType: 'email',
    fixedTiers: true,
  },
];

function SignInModal({ method, onClose, onGoLogin, onGoRegister }) {
  return (
    <div
      style={{ position:'fixed',inset:0,zIndex:200,background:'rgba(0,0,0,0.72)',backdropFilter:'blur(8px)',display:'flex',alignItems:'flex-end',justifyContent:'center' }}
      onClick={onClose}
    >
      <div
        className="scale-in"
        style={{ width:'100%',maxWidth:480,background:'var(--bg-card)',borderTop:'1px solid var(--border-light)',borderRadius:'24px 24px 0 0',padding:'28px 24px 44px' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20 }}>
          <div style={{ display:'flex',alignItems:'center',gap:14 }}>
            <div style={{ width:48,height:48,borderRadius:14,background:method?.logoBg,border:'1px solid rgba(255,255,255,0.08)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
              <img src={method?.logo} alt={method?.label} style={{ width:28,height:28,objectFit:'contain' }} />
            </div>
            <div>
              <p style={{ fontWeight:800,fontSize:16 }}>Sign in required</p>
              <p style={{ color:'var(--text-muted)',fontSize:13,marginTop:1 }}>To withdraw via {method?.label}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background:'none',border:'none',cursor:'pointer',padding:6 }}>
            <XIcon size={18} style={{ stroke:'var(--text-muted)' }} />
          </button>
        </div>
        <p style={{ color:'var(--text-muted)',fontSize:14,lineHeight:1.65,marginBottom:22 }}>
          Create a free account to start earning and withdraw your coins to {method?.label}. Your balance is stored securely on our servers.
        </p>
        <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
          <button className="btn btn-primary" style={{ width:'100%',justifyContent:'center',fontSize:15 }} onClick={onGoRegister}>Create Free Account</button>
          <button className="btn btn-outline" style={{ width:'100%',justifyContent:'center' }} onClick={onGoLogin}>Sign In</button>
        </div>
      </div>
    </div>
  );
}

function MethodCard({ m, selected, disabled, onClick, coins }) {
  const active = selected;
  const [imgErr, setImgErr] = React.useState(false);
  const abbr = m.key === 'binance_usdt' ? 'BNB' : m.key === 'google_play' ? 'GP' : m.key.slice(0, 3).toUpperCase();
  return (
    <button
      onClick={onClick}
      style={{
        position:'relative',
        background: active
          ? `linear-gradient(145deg, ${m.accent}14, ${m.accent}0a)`
          : 'var(--bg-card2)',
        border: `2px solid ${active ? m.accent : 'var(--border)'}`,
        borderRadius: 16,
        padding: '16px 14px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        textAlign: 'left',
        fontFamily: 'inherit',
        transition: 'all 0.2s',
        boxShadow: active ? `0 0 20px ${m.glow}` : 'none',
        opacity: disabled ? 0.45 : 1,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      {active && (
        <div style={{ position:'absolute',top:10,right:10,width:20,height:20,borderRadius:'50%',background:m.accent,display:'flex',alignItems:'center',justifyContent:'center' }}>
          <CheckIcon size={11} style={{ stroke:'#fff',strokeWidth:3 }} />
        </div>
      )}
      {disabled && (
        <div style={{ position:'absolute',top:10,right:10 }}>
          <LockIcon size={13} style={{ stroke:'var(--text-dim)' }} />
        </div>
      )}
      <div style={{ width:48,height:36,borderRadius:10,background:m.logoBg,border:'1px solid rgba(255,255,255,0.07)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
        {!imgErr
          ? <img src={m.logo} alt={m.label} style={{ width:'80%',height:'80%',objectFit:'contain' }} onError={() => setImgErr(true)} />
          : <span style={{ fontWeight:900,fontSize:11,color:m.accent,letterSpacing:'0.04em' }}>{abbr}</span>
        }
      </div>
      <div>
        <p style={{ fontWeight:800,fontSize:13,color: active ? m.accent : 'var(--text)',transition:'color 0.2s',lineHeight:1.2 }}>{m.label}</p>
        <p style={{ color:'var(--text-muted)',fontSize:10.5,marginTop:3,lineHeight:1.4 }}>{m.subtitle}</p>
      </div>
    </button>
  );
}

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
    if (!guest) api.withdraw.myWithdrawals().then(d => setHistory(d.withdrawals)).catch(() => {});
  }, [guest]);

  const method = METHODS.find(m => m.key === selectedMethod);
  const useFixedTiers = method?.fixedTiers;
  const finalCoins = useFixedTiers ? (selectedTier?.coins || 0) : (parseInt(amount) || 0);

  const handleMethodClick = key => {
    if (guest) { setSignInModal(METHODS.find(m => m.key === key)); return; }
    setSelectedMethod(prev => prev === key ? null : key);
    setDestination('');
    setAmount('');
    setSelectedTier(null);
  };

  const submit = async e => {
    e.preventDefault();
    if (!selectedMethod) return toast.error('Please select a withdrawal method.');
    if (finalCoins < MIN_COINS) return toast.error(`Minimum withdrawal is ${MIN_COINS.toLocaleString()} SC.`);
    if (finalCoins > user.coins) return toast.error('Insufficient balance.');
    if (!destination.trim()) return toast.error(`Please enter your ${method?.fieldLabel}.`);
    setLoading(true);
    try {
      const data = await api.withdraw.submit({ amount: finalCoins, method: selectedMethod, wallet_address: destination.trim() });
      toast.success(data.message);
      onUserUpdate({ ...user, coins: data.coins });
      setAmount(''); setDestination(''); setSelectedTier(null); setSelectedMethod(null);
      api.withdraw.myWithdrawals().then(d => setHistory(d.withdrawals)).catch(() => {});
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const methodLabels = { visa:'Visa', binance_usdt:'Binance', litecoin:'LTC', google_play:'Google Play' };

  return (
    <div className="screen fade-up">
      {signInModal && (
        <SignInModal method={signInModal} onClose={() => setSignInModal(null)} onGoLogin={onGoLogin} onGoRegister={onGoRegister} />
      )}

      {/* Header */}
      <div style={{ marginBottom:22 }}>
        <h2 style={{ fontSize:24,fontWeight:900,letterSpacing:'-0.02em' }}>Withdraw</h2>
        <p style={{ color:'var(--text-muted)',fontSize:14,marginTop:4 }}>1,000 SC = $1.00 · Min. 1,000 SC</p>
      </div>

      {/* Balance card */}
      {!guest && (
        <div style={{
          marginBottom:22,
          borderRadius:20,
          padding:'22px 22px 18px',
          background:'linear-gradient(145deg,#071728,#050f1c)',
          border:'1px solid rgba(14,165,233,0.2)',
          position:'relative',overflow:'hidden'
        }}>
          <div style={{ position:'absolute',top:-50,right:-50,width:150,height:150,borderRadius:'50%',background:'radial-gradient(circle,rgba(14,165,233,0.1) 0%,transparent 70%)',pointerEvents:'none' }} />
          <div style={{ position:'absolute',bottom:-30,left:-30,width:100,height:100,borderRadius:'50%',background:'radial-gradient(circle,rgba(14,165,233,0.05) 0%,transparent 70%)',pointerEvents:'none' }} />
          <p style={{ color:'var(--text-muted)',fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:8 }}>Available Balance</p>
          <div style={{ display:'flex',alignItems:'center',gap:10,marginBottom:6 }}>
            <CoinIcon size={36} />
            <span style={{ fontSize:36,fontWeight:900,letterSpacing:'-0.02em',lineHeight:1 }}>{(user.coins||0).toLocaleString()}</span>
            <span style={{ color:'var(--text-muted)',fontSize:14,fontWeight:600,marginTop:8 }}>SC</span>
          </div>
          <div style={{ display:'flex',alignItems:'center',gap:10 }}>
            <span style={{ color:'var(--success)',fontWeight:800,fontSize:18 }}>${((user.coins||0)/1000).toFixed(2)} USD</span>
            {user.coins >= MIN_COINS
              ? <span style={{ fontSize:11,fontWeight:700,color:'var(--success)',background:'rgba(16,185,129,0.12)',border:'1px solid rgba(16,185,129,0.25)',borderRadius:20,padding:'2px 10px' }}>Ready to withdraw</span>
              : <span style={{ fontSize:11,fontWeight:700,color:'var(--warning)',background:'rgba(245,158,11,0.12)',border:'1px solid rgba(245,158,11,0.25)',borderRadius:20,padding:'2px 10px' }}>Need {(MIN_COINS-(user.coins||0)).toLocaleString()} more SC</span>
            }
          </div>
        </div>
      )}

      {/* Method selector */}
      <div style={{ marginBottom:16 }}>
        <p style={{ fontWeight:700,fontSize:15,marginBottom:12,color:'var(--text)' }}>
          {guest ? 'Payout Methods' : 'Choose Payout Method'}
        </p>
        <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10 }}>
          {METHODS.map(m => (
            <MethodCard
              key={m.key}
              m={m}
              selected={!guest && selectedMethod === m.key}
              disabled={guest}
              coins={user?.coins || 0}
              onClick={() => handleMethodClick(m.key)}
            />
          ))}
        </div>

        {guest && (
          <div style={{ marginTop:12,padding:'14px 18px',background:'rgba(14,165,233,0.05)',border:'1px solid rgba(14,165,233,0.15)',borderRadius:12,textAlign:'center' }}>
            <p style={{ color:'var(--text-muted)',fontSize:13 }}>Sign in to select a method and submit a withdrawal.</p>
            <div style={{ display:'flex',gap:10,marginTop:12,justifyContent:'center' }}>
              <button className="btn btn-primary" style={{ padding:'9px 20px',fontSize:13 }} onClick={onGoRegister}>Create Account</button>
              <button className="btn btn-outline" style={{ padding:'9px 20px',fontSize:13 }} onClick={onGoLogin}>Sign In</button>
            </div>
          </div>
        )}
      </div>

      {/* Details form */}
      {!guest && selectedMethod && method && (
        <div
          className="fade-up"
          style={{ marginBottom:20,borderRadius:18,overflow:'hidden',border:`1px solid ${method.accent}33`,boxShadow:`0 0 30px ${method.glow}` }}
        >
          {/* Method header stripe */}
          <div style={{ background:method.logoBg,padding:'16px 20px',display:'flex',alignItems:'center',gap:14,borderBottom:`1px solid ${method.accent}22` }}>
            <div style={{ width:44,height:44,borderRadius:12,background:'rgba(255,255,255,0.08)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
              <img src={method.logo} alt={method.label} style={{ width:28,height:28,objectFit:'contain' }} />
            </div>
            <div>
              <p style={{ fontWeight:800,fontSize:16,color:'#fff' }}>{method.label}</p>
              <p style={{ color:'rgba(255,255,255,0.55)',fontSize:12,marginTop:1 }}>{method.subtitle}</p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedMethod(null)}
              style={{ marginLeft:'auto',background:'rgba(255,255,255,0.1)',border:'none',cursor:'pointer',width:32,height:32,borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center' }}
            >
              <XIcon size={15} style={{ stroke:'rgba(255,255,255,0.7)' }} />
            </button>
          </div>

          <div style={{ background:'var(--bg-card)',padding:'20px' }}>
            <form onSubmit={submit}>
              {/* Amount selection */}
              {useFixedTiers ? (
                <div style={{ marginBottom:18 }}>
                  <p style={{ fontSize:12,fontWeight:700,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:10 }}>Select Amount</p>
                  <div style={{ display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:7 }}>
                    {FIXED_TIERS.map(tier => {
                      const active = selectedTier?.usd === tier.usd;
                      const canAfford = !user || user.coins >= tier.coins;
                      return (
                        <button
                          key={tier.usd}
                          type="button"
                          onClick={() => canAfford && setSelectedTier(active ? null : tier)}
                          style={{
                            padding:'11px 4px',
                            borderRadius:12,
                            border:`2px solid ${active ? method.accent : 'var(--border)'}`,
                            background: active ? `${method.accent}18` : 'var(--bg-card2)',
                            boxShadow: active ? `0 0 14px ${method.glow}` : 'none',
                            color: active ? method.accent : canAfford ? 'var(--text)' : 'var(--text-dim)',
                            fontWeight:800,
                            fontSize:16,
                            cursor: canAfford ? 'pointer' : 'not-allowed',
                            opacity: canAfford ? 1 : 0.35,
                            transition:'all 0.18s',
                            fontFamily:'inherit',
                            display:'flex',flexDirection:'column',alignItems:'center',gap:3
                          }}
                        >
                          <span>${tier.usd}</span>
                          <span style={{ fontSize:9,fontWeight:700,color: active ? method.accent : 'var(--text-dim)',letterSpacing:'0.02em' }}>
                            {(tier.coins/1000).toFixed(0)}K SC
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  {selectedTier && (
                    <div style={{ marginTop:12,padding:'12px 16px',background:`${method.accent}0e`,border:`1px solid ${method.accent}30`,borderRadius:12,display:'flex',alignItems:'center',gap:10 }}>
                      <CheckIcon size={16} style={{ stroke:method.accent,strokeWidth:2.5,flexShrink:0 }} />
                      <p style={{ color:method.accent,fontSize:13,fontWeight:700 }}>
                        You will receive <strong>${selectedTier.usd}.00</strong> via {method.label}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="input-group">
                  <label>Amount (SC)</label>
                  <input
                    type="number" min={MIN_COINS} max={user?.coins}
                    placeholder={`Min. ${MIN_COINS.toLocaleString()} SC`}
                    value={amount} onChange={e => setAmount(e.target.value)} required
                    style={{ borderColor: amount && parseInt(amount) >= MIN_COINS ? `${method.accent}55` : undefined }}
                  />
                  {amount && parseInt(amount) >= MIN_COINS && (
                    <div style={{ padding:'10px 14px',background:`${method.accent}0e`,border:`1px solid ${method.accent}30`,borderRadius:10,display:'flex',alignItems:'center',gap:8 }}>
                      <CheckIcon size={14} style={{ stroke:method.accent,strokeWidth:2.5,flexShrink:0 }} />
                      <span style={{ color:method.accent,fontSize:13,fontWeight:700 }}>
                        ≈ <strong>${(parseInt(amount)/1000).toFixed(2)} USD</strong> via {method.label}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Destination */}
              <div className="input-group">
                <label>{method.fieldLabel}</label>
                <input
                  type={method.inputType || 'text'}
                  placeholder={method.placeholder}
                  value={destination}
                  onChange={e => setDestination(e.target.value)}
                  required
                />
                <span style={{ fontSize:11,color:'var(--text-dim)',marginTop:2 }}>{method.hint}</span>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{
                  width:'100%',justifyContent:'center',marginTop:6,
                  background: `linear-gradient(135deg, ${method.accent}, ${method.accent}cc)`,
                  boxShadow:`0 6px 24px ${method.glow}`,
                  fontSize:15,fontWeight:800
                }}
                disabled={loading || (user?.coins||0) < MIN_COINS || (useFixedTiers && !selectedTier)}
              >
                {loading
                  ? <span className="spinner" />
                  : (user?.coins||0) < MIN_COINS
                    ? `Need ${(MIN_COINS-(user?.coins||0)).toLocaleString()} more SC`
                    : `Withdraw via ${methodLabels[selectedMethod]}`
                }
              </button>
            </form>
          </div>
        </div>
      )}

      {/* History */}
      {!guest && history.length > 0 && (
        <div>
          <p className="section-title" style={{ marginTop:4 }}>History</p>
          <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
            {history.map(w => {
              const m = METHODS.find(x => x.key === w.method);
              return (
                <div key={w.id} style={{
                  background:'var(--bg-card)',
                  border:'1px solid var(--border)',
                  borderRadius:14,
                  padding:'14px 16px',
                  display:'flex',justifyContent:'space-between',alignItems:'center',
                  gap:12
                }}>
                  <div style={{ display:'flex',alignItems:'center',gap:12 }}>
                    <div style={{ width:40,height:40,borderRadius:11,background:m?.logoBg||'var(--bg-card2)',border:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                      {m ? <img src={m.logo} alt={m.label} style={{ width:24,height:24,objectFit:'contain' }} /> : <span style={{ fontSize:11,fontWeight:800,color:'var(--text-muted)' }}>{(w.method||'?').slice(0,2).toUpperCase()}</span>}
                    </div>
                    <div>
                      <p style={{ fontWeight:700,fontSize:14 }}>{(m?.label||w.method)} · {w.amount.toLocaleString()} SC</p>
                      <p style={{ color:'var(--text-muted)',fontSize:12,marginTop:2 }}>{w.wallet_address}</p>
                      <p style={{ color:'var(--text-dim)',fontSize:11,marginTop:2 }}>{new Date(w.created_at).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</p>
                    </div>
                  </div>
                  <span className={`badge badge-${w.status}`}>{w.status}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
