import React, { useState, useEffect } from 'react';
import { ToastProvider } from './components/Toast';
import BottomNav from './components/BottomNav';
import Footer from './components/Footer';
import CookieConsent from './components/CookieConsent';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Offerwalls from './pages/Offerwalls';
import Withdraw from './pages/Withdraw';
import ResetPassword from './pages/ResetPassword';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import { api } from './api';
import { SpetroMark, XIcon } from './components/Icons';

const CACHE_KEY = 'spetro_user_cache';

function getCachedUser() {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY)); } catch { return null; }
}
function setCachedUser(u) {
  try { if (u) localStorage.setItem(CACHE_KEY, JSON.stringify(u)); else localStorage.removeItem(CACHE_KEY); } catch {}
}

function AppInner() {
  const isAdminRoute = window.location.pathname.startsWith('/admin');

  // Check for password reset token in URL
  const urlParams = new URLSearchParams(window.location.search);
  const resetToken = urlParams.get('reset_token');

  const cached = !isAdminRoute ? getCachedUser() : null;
  const [authState, setAuthState] = useState('guest');
  const [user, setUser] = useState(null);
  const [sessionChecked, setSessionChecked] = useState(!cached);
  const [authModal, setAuthModal] = useState(null); // null | 'login' | 'register'
  const [activeTab, setActiveTab] = useState('dashboard');
  const [prevTab, setPrevTab] = useState('dashboard');

  const [adminState, setAdminState] = useState('loading');
  const [admin, setAdmin] = useState(null);

  useEffect(() => {
    if (isAdminRoute) {
      api.admin.me()
        .then((d) => { setAdmin(d.admin); setAdminState('dashboard'); })
        .catch(() => setAdminState('login'));
    } else {
      api.auth.me()
        .then((d) => {
          setUser(d.user);
          setAuthState('app');
          setCachedUser(d.user);
        })
        .catch(() => {
          setCachedUser(null);
          setUser(null);
          setAuthState('guest');
        })
        .finally(() => setSessionChecked(true));
    }
  }, [isAdminRoute]);

  // Password reset flow — takes priority over everything else
  if (resetToken && !isAdminRoute) {
    return (
      <ResetPassword
        token={resetToken}
        onDone={() => {
          window.history.replaceState({}, '', '/');
          setAuthState('guest');
          setAuthModal('login');
        }}
      />
    );
  }

  if (isAdminRoute) {
    if (adminState === 'loading') return <LoadingScreen />;
    if (adminState === 'login') return <AdminLogin onLogin={(a) => { setAdmin(a); setAdminState('dashboard'); }} />;
    return <AdminDashboard admin={admin} onLogout={() => { setAdmin(null); setAdminState('login'); }} />;
  }

  if (!sessionChecked) return <LoadingScreen />;

  const goToLogin = () => setAuthModal('login');
  const goToRegister = () => setAuthModal('register');
  const closeAuthModal = () => setAuthModal(null);
  const handleAuthSuccess = (u) => {
    setCachedUser(u);
    setUser(u);
    setAuthState('app');
    setActiveTab('dashboard');
    setAuthModal(null);
  };

  const handleTabChange = (tab) => {
    setPrevTab(activeTab);
    setActiveTab(tab);
  };

  const handleNavigate = (tab) => {
    setPrevTab(activeTab);
    setActiveTab(tab);
  };

  const handleBack = () => setActiveTab(prevTab === activeTab ? 'dashboard' : prevTab);

  const isGuest = authState === 'guest';

  return (
    <div className="page-container">
      {activeTab === 'dashboard' && (
        <Dashboard
          user={user}
          guest={isGuest}
          onUserUpdate={setUser}
          onNavigate={handleNavigate}
          onGoLogin={goToLogin}
          onGoRegister={goToRegister}
        />
      )}
      {activeTab === 'offerwalls' && (
        <Offerwalls user={user} guest={isGuest} onGoLogin={goToLogin} onGoRegister={goToRegister} />
      )}
      {activeTab === 'withdraw' && (
        <Withdraw user={user} guest={isGuest} onUserUpdate={setUser} onGoLogin={goToLogin} onGoRegister={goToRegister} />
      )}
      {activeTab === 'profile' && (
        <Profile
          user={user}
          guest={isGuest}
          onLogout={() => { setCachedUser(null); setUser(null); setAuthState('guest'); setActiveTab('dashboard'); }}
          onBack={handleBack}
          onGoLogin={goToLogin}
          onGoRegister={goToRegister}
        />
      )}
      <Footer />
      <BottomNav active={activeTab} onChange={handleTabChange} guest={isGuest} />
      <CookieConsent />

      {authModal && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 1500,
            background: 'var(--bg)', overflowY: 'auto',
          }}
        >
          <button
            onClick={closeAuthModal}
            aria-label="Close"
            style={{
              position: 'fixed', top: 16, right: 16, zIndex: 1600,
              width: 40, height: 40, borderRadius: '50%',
              background: 'var(--bg-card2)', border: '1px solid var(--border-light)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'var(--text)',
            }}
          >
            <XIcon size={20} style={{ stroke: 'var(--text)' }} />
          </button>
          {authModal === 'register' ? (
            <Register onLogin={handleAuthSuccess} onGoLogin={() => setAuthModal('login')} />
          ) : (
            <Login onLogin={handleAuthSuccess} onGoRegister={() => setAuthModal('register')} />
          )}
        </div>
      )}
    </div>
  );
}

function LoadingScreen() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, background: 'var(--bg)' }}>
      <SpetroMark size={120} style={{ borderRadius: 28 }} />
      <p style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.02em', color: 'var(--text)' }}>Spetro Earn</p>
      <div className="spinner" style={{ width: 26, height: 26, borderWidth: 2.5 }} />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppInner />
    </ToastProvider>
  );
}
