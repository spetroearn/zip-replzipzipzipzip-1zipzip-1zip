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
import { SpetroMark } from './components/Icons';

function AppInner() {
  const isAdminRoute = window.location.pathname.startsWith('/admin');

  // Check for password reset token in URL
  const urlParams = new URLSearchParams(window.location.search);
  const resetToken = urlParams.get('reset_token');

  const [authState, setAuthState] = useState('loading');
  const [user, setUser] = useState(null);
  const [authScreen, setAuthScreen] = useState('login');
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
        .then((d) => { setUser(d.user); setAuthState('app'); })
        .catch(() => setAuthState('guest'));
    }
  }, [isAdminRoute]);

  // Password reset flow — takes priority over everything else
  if (resetToken && !isAdminRoute) {
    return (
      <ResetPassword
        token={resetToken}
        onDone={() => {
          window.history.replaceState({}, '', '/');
          setAuthState('auth');
          setAuthScreen('login');
        }}
      />
    );
  }

  if (isAdminRoute) {
    if (adminState === 'loading') return <LoadingScreen />;
    if (adminState === 'login') return <AdminLogin onLogin={(a) => { setAdmin(a); setAdminState('dashboard'); }} />;
    return <AdminDashboard admin={admin} onLogout={() => { setAdmin(null); setAdminState('login'); }} />;
  }

  if (authState === 'loading') return <LoadingScreen />;

  if (authState === 'auth') {
    if (authScreen === 'register') {
      return (
        <Register
          onLogin={(u) => { setUser(u); setAuthState('app'); setActiveTab('dashboard'); }}
          onGoLogin={() => setAuthScreen('login')}
        />
      );
    }
    return (
      <Login
        onLogin={(u) => { setUser(u); setAuthState('app'); setActiveTab('dashboard'); }}
        onGoRegister={() => setAuthScreen('register')}
      />
    );
  }

  const goToLogin = () => { setAuthScreen('login'); setAuthState('auth'); };
  const goToRegister = () => { setAuthScreen('register'); setAuthState('auth'); };

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
          onLogout={() => { setUser(null); setAuthState('guest'); setActiveTab('dashboard'); }}
          onBack={handleBack}
          onGoLogin={goToLogin}
          onGoRegister={goToRegister}
        />
      )}
      <Footer />
      <BottomNav active={activeTab} onChange={handleTabChange} guest={isGuest} />
      <CookieConsent />
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
