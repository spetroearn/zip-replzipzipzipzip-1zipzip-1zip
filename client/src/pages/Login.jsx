import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useToast } from '../components/Toast';
import { ZapIcon } from '../components/Icons';

const TERMS_TEXT = `Terms of Service & Privacy Policy — Spetro Earn
Last updated: May 2026

Please read these Terms carefully before creating an account or using Spetro Earn ("the Platform", "we", "us"). By checking the box and registering, you confirm that you are at least 13 years old and agree to be legally bound by these Terms.

────────────────────────────────────────
1. ELIGIBILITY & ACCOUNT
────────────────────────────────────────
You must provide accurate, complete, and truthful information when registering. Each person may hold only one account. Creating multiple accounts to exploit bonuses or rewards is strictly prohibited and will result in permanent suspension without appeal.

────────────────────────────────────────
2. ADJOE TRACKING & DATA CONSENT
────────────────────────────────────────
Spetro Earn uses Adjoe, a third-party offer and reward provider. By using the Earn / Offerwalls section of the Platform, you explicitly consent to:

  a) Adjoe and its partners collecting data about your app usage, in-app events, and device attributes (including advertising ID, OS version, device model, and installed applications) for the purpose of attributing completed offers and preventing fraud.

  b) The sharing of your advertising identifier (Google Advertising ID / GAID) with Adjoe and its advertising partners to verify task completion and calculate your reward.

  c) Adjoe's use of cookies and similar tracking technologies as described in Adjoe's Privacy Policy (https://adjoe.io/privacy).

You may withdraw this consent at any time by deleting your account and resetting your device's advertising ID. Withdrawing consent will terminate your ability to earn rewards through Adjoe-powered offers.

────────────────────────────────────────
3. PROHIBITED METHODS — VPN, PROXY & EMULATORS
────────────────────────────────────────
The use of any of the following is strictly forbidden and will result in immediate account termination and forfeiture of all pending rewards:

  • VPN (Virtual Private Network) services
  • Proxy servers or anonymization tools
  • Tor or similar onion-routing networks
  • Android emulators, virtual machines, or rooted devices
  • Any tool designed to spoof, mask, or alter your real device, IP address, GPS location, or advertising ID

We perform continuous automated checks to detect prohibited tools. If our systems flag your session, your account will be suspended pending manual review. Flagged rewards will not be paid out.

────────────────────────────────────────
4. REWARDS & WITHDRAWALS
────────────────────────────────────────
Spetro Coins (SC) earned on the Platform have no cash value until a withdrawal is approved. We reserve the right to withhold or reverse rewards that were earned through fraudulent, abusive, or prohibited activity. Withdrawal processing times are 1–3 business days after approval.

────────────────────────────────────────
5. ACCEPTABLE USE
────────────────────────────────────────
You agree not to:
  • Attempt to hack, reverse-engineer, or manipulate the Platform or its APIs
  • Use bots, scripts, or automated tools to complete offers
  • Impersonate other users or Spetro Earn staff
  • Violate any applicable local, national, or international laws

────────────────────────────────────────
6. PRIVACY POLICY
────────────────────────────────────────
We collect only the data necessary to operate the Platform: your name, email address, IP address, and device information. We do not sell your personal data to third parties. Data shared with offerwall partners (such as Adjoe) is strictly for the purpose of offer attribution and fraud prevention. You may request deletion of your account and associated data at any time via the Support ticket system.

────────────────────────────────────────
7. TERMINATION
────────────────────────────────────────
We may suspend or terminate your account at any time, with or without notice, if you violate these Terms. Upon termination, all accrued but unpaid rewards will be forfeited.

────────────────────────────────────────
8. CHANGES TO TERMS
────────────────────────────────────────
We may update these Terms at any time. Continued use of the Platform after changes are posted constitutes acceptance of the revised Terms.

────────────────────────────────────────
9. CONTACT
────────────────────────────────────────
For support or legal inquiries, use the in-app Support ticket system.`;

function GoogleIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}

function TermsModal({ onClose }) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.72)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 480, maxHeight: '80vh', background: 'var(--bg-card)', borderRadius: '18px 18px 0 0', display: 'flex', flexDirection: 'column', boxShadow: '0 -8px 40px rgba(0,0,0,0.5)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 20px 14px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <p style={{ fontWeight: 800, fontSize: 16 }}>Terms of Service & Privacy Policy</p>
          <button onClick={onClose} style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: 8, padding: '5px 12px', color: 'var(--text-muted)', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Close</button>
        </div>
        <div style={{ overflowY: 'auto', padding: '16px 20px 32px', flex: 1 }}>
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: 12, lineHeight: 1.7, color: 'var(--text-dim)', fontFamily: 'inherit', margin: 0 }}>{TERMS_TEXT}</pre>
        </div>
      </div>
    </div>
  );
}

export default function Login({ onLogin, onGoRegister }) {
  const toast = useToast();
  const [view, setView] = useState('signin'); // 'signin' | 'forgot'
  const [form, setForm] = useState({ email: '', password: '' });
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const err = params.get('error');
    if (err === 'google_not_configured') toast.info('Google Sign-In is not configured yet. Use email & password.');
    else if (err === 'google_cancelled') toast.info('Google sign-in was cancelled.');
    else if (err === 'account_banned') toast.error('This account has been suspended.');
    else if (err === 'google_token_failed') toast.error('Could not verify Google credentials. Please try again.');
    else if (err === 'google_profile_failed') toast.error('Could not fetch your Google profile. Please try again.');
    else if (err === 'google_failed') toast.error('Google sign-in failed. Please try again.');
    if (err) window.history.replaceState({}, '', '/');
  }, []);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (!termsAccepted) return;
    setLoading(true);
    try {
      const data = await api.auth.login(form);
      onLogin(data.user);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const submitForgot = async (e) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;
    setLoading(true);
    try {
      await api.auth.forgotPassword(forgotEmail.trim());
      setForgotSent(true);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = () => {
    if (!termsAccepted) return;
    window.location.href = '/api/auth/google';
  };

  const linkStyle = {
    background: 'none', border: 'none', padding: 0,
    color: 'var(--primary)', fontWeight: 600, fontSize: 13,
    cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'underline', display: 'inline',
  };

  if (view === 'forgot') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', background: 'var(--bg)' }}>
        <div style={{ width: '100%', maxWidth: 400 }}>
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))', marginBottom: 16, boxShadow: 'var(--shadow-primary)' }}>
              <ZapIcon size={28} style={{ stroke: '#fff' }} />
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 800 }}>{forgotSent ? 'Check Your Email' : 'Forgot Password?'}</h1>
            <p style={{ color: 'var(--text-muted)', marginTop: 6, fontSize: 14 }}>
              {forgotSent
                ? 'If that email exists, a reset link has been sent.'
                : 'Enter your account email and we\'ll send you a reset link.'}
            </p>
          </div>
          <div className="card" style={{ padding: 28 }}>
            {forgotSent ? (
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(16,185,129,0.1)', border: '2px solid var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
                  Check your inbox for the reset link. It expires in 1 hour.
                </p>
                <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => { setView('signin'); setForgotSent(false); setForgotEmail(''); }}>
                  Back to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={submitForgot}>
                <div className="input-group" style={{ marginBottom: 24 }}>
                  <label>Email Address</label>
                  <input type="email" placeholder="you@example.com" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} required autoComplete="email" />
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%', marginBottom: 14 }} disabled={loading}>
                  {loading ? <span className="spinner" /> : 'Send Reset Link'}
                </button>
                <button type="button" className="btn btn-outline" style={{ width: '100%' }} onClick={() => setView('signin')}>
                  Back to Sign In
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', background: 'var(--bg)' }}>
      {showModal && <TermsModal onClose={() => setShowModal(false)} />}

      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))', marginBottom: 16, boxShadow: 'var(--shadow-primary)' }}>
            <ZapIcon size={28} style={{ stroke: '#fff' }} />
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)' }}>Spetro Earn</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: 6, fontSize: 14 }}>Sign in to your account</p>
        </div>

        <div className="card" style={{ padding: 28 }}>
          {/* Google Sign-In */}
          <button
            onClick={signInWithGoogle}
            disabled={!termsAccepted}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '12px 20px', background: 'var(--bg-card2)', border: '1.5px solid var(--border-light)', borderRadius: 10, color: 'var(--text)', fontWeight: 600, fontSize: 15, cursor: termsAccepted ? 'pointer' : 'not-allowed', transition: 'opacity 0.18s, border-color 0.18s, background 0.18s', marginBottom: 14, fontFamily: 'inherit', opacity: termsAccepted ? 1 : 0.4 }}
            onMouseEnter={(e) => { if (termsAccepted) { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.background = 'var(--bg-card3)'; } }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-light)'; e.currentTarget.style.background = 'var(--bg-card2)'; }}
          >
            <GoogleIcon size={20} />
            Continue with Google
          </button>

          {/* Terms checkbox */}
          <label style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 16, cursor: 'pointer' }}>
            <input type="checkbox" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} style={{ width: 15, height: 15, accentColor: 'var(--primary)', flexShrink: 0, cursor: 'pointer', margin: 0 }} />
            <span style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.4 }}>
              I agree to the{' '}
              <button type="button" style={linkStyle} onClick={() => setShowModal(true)}>Terms of Service</button>
              {' '}and{' '}
              <button type="button" style={linkStyle} onClick={() => setShowModal(true)}>Privacy Policy</button>.
            </span>
          </label>

          {/* OR Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            <span style={{ color: 'var(--text-dim)', fontSize: 12, fontWeight: 600 }}>OR</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>

          {/* Email / Password */}
          <form onSubmit={submit}>
            <div className="input-group">
              <label>Email Address</label>
              <input name="email" type="email" placeholder="you@example.com" value={form.email} onChange={handle} required autoComplete="email" />
            </div>
            <div className="input-group" style={{ marginBottom: 6 }}>
              <label>Password</label>
              <input name="password" type="password" placeholder="••••••••" value={form.password} onChange={handle} required autoComplete="current-password" />
            </div>
            <div style={{ textAlign: 'right', marginBottom: 18 }}>
              <button type="button" onClick={() => setView('forgot')} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', padding: 0, textDecoration: 'underline' }}>
                Forgot password?
              </button>
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', opacity: !termsAccepted ? 0.4 : 1, cursor: !termsAccepted ? 'not-allowed' : 'pointer' }} disabled={loading || !termsAccepted}>
              {loading ? <span className="spinner" /> : 'Sign In'}
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            <span style={{ color: 'var(--text-dim)', fontSize: 12 }}>NEW HERE?</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>

          <button onClick={onGoRegister} className="btn btn-outline" style={{ width: '100%' }}>
            Create Free Account
          </button>
        </div>
      </div>
    </div>
  );
}
