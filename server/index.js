require('dotenv').config();

const express = require('express');
const compression = require('compression');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const cors = require('cors');
const path = require('path');
const pool = require('./db');
const autoInit = require('./db-auto-init');

const authRoutes = require('./routes/auth');
const coinsRoutes = require('./routes/coins');
const offerwallRoutes = require('./routes/offerwalls');
const adminRoutes = require('./routes/admin');
const withdrawRoutes = require('./routes/withdraw');
const postbackRoutes = require('./routes/postback');
const ticketRoutes = require('./routes/tickets');
const offersRoutes = require('./routes/offers');

const app = express();
const PORT = process.env.PORT || 5000;
const IS_PROD = process.env.NODE_ENV === 'production';

// ── Ensure logo-transparent.png exists (survives deploys) ─────────────────────
const logoSrc  = path.join(__dirname, '..', 'client', 'src', 'assets', 'logo.png');
const logoDest = path.join(__dirname, 'public', 'logo-transparent.png');
try {
  if (!require('fs').existsSync(logoDest) && require('fs').existsSync(logoSrc)) {
    require('fs').copyFileSync(logoSrc, logoDest);
    console.log('[Logo] Copied logo-transparent.png to public/');
  }
} catch (e) { /* ignore */ }

// ── Auto-download APK from GitHub Releases if missing ─────────────────────────
const APK_PATH = path.join(__dirname, 'public', 'SpetroEarn-latest.apk');
const APK_URL  = 'https://github.com/spetroearn/zip-replzipzipzipzip-1zipzip-1zip/releases/download/v2.1.8/SpetroEarn-v2.1.8.apk';
const fs    = require('fs');
const https = require('https');
const http  = require('http');

const APK_VER_PATH = path.join(__dirname, 'public', '.apk-version');
const APK_EXPECTED = 'v2.1.8';

function downloadApk() {
  const current = fs.existsSync(APK_VER_PATH) ? fs.readFileSync(APK_VER_PATH, 'utf8').trim() : '';
  if (fs.existsSync(APK_PATH) && current === APK_EXPECTED) {
    console.log('[APK] v2.1.7 already up-to-date, skipping download.');
    return;
  }
  if (fs.existsSync(APK_PATH)) {
    try { fs.unlinkSync(APK_PATH); } catch (_) {}
    console.log('[APK] Version mismatch (' + (current||'unknown') + ' → ' + APK_EXPECTED + '), re-downloading…');
  } else {
    console.log('[APK] Downloading SpetroEarn-latest.apk…');
  }

  function fetchTo(url, dest, redirects) {
    if (redirects > 10) { console.error('[APK] Too many redirects'); return; }
    const lib = url.startsWith('https') ? https : http;
    const tmpPath = dest + '.tmp';
    const file = fs.createWriteStream(tmpPath);

    lib.get(url, { headers: { 'User-Agent': 'SpetroServer/1.0' } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 307 || res.statusCode === 308) {
        file.close();
        fs.unlink(tmpPath, () => {});
        return fetchTo(res.headers.location, dest, redirects + 1);
      }
      if (res.statusCode !== 200) {
        file.close();
        fs.unlink(tmpPath, () => {});
        console.error('[APK] Download failed, HTTP status:', res.statusCode);
        return;
      }
      res.pipe(file);
      file.on('finish', () => {
        file.close(() => {
          fs.rename(tmpPath, dest, (err) => {
            if (err) console.error('[APK] Rename error:', err.message);
            else {
              fs.writeFileSync(APK_VER_PATH, APK_EXPECTED);
              console.log('[APK] Download complete — v2.1.7');
            }
          });
        });
      });
    }).on('error', (err) => {
      file.close();
      fs.unlink(tmpPath, () => {});
      console.error('[APK] Request error:', err.message);
    });
  }

  fetchTo(APK_URL, APK_PATH, 0);
}
downloadApk();

// ── Warn loudly if insecure defaults are still set ───────────────────────────
const DEFAULT_SECRET = 'spetro-earn-super-secret-key-change-in-prod';
if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET === DEFAULT_SECRET) {
  console.warn('');
  console.warn('  ⚠️  WARNING: SESSION_SECRET is not set or is using the default value.');
  console.warn('  ⚠️  Set a strong random secret in your .env file before going live.');
  console.warn('  ⚠️  Generate one: node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))"');
  console.warn('');
}

app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors({
  origin: true,
  credentials: true
}));

// Trust first proxy (required when behind Orihost / nginx / Cloudflare)
if (IS_PROD) app.set('trust proxy', 1);

app.use(
  session({
    store: new pgSession({
      pool,
      tableName: 'session',
      createTableIfMissing: true
    }),
    name: 'spetro.sid',
    secret: process.env.SESSION_SECRET || DEFAULT_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: IS_PROD,      // HTTPS-only in production
      httpOnly: true,
      sameSite: IS_PROD ? 'lax' : false,
      maxAge: 7 * 24 * 60 * 60 * 1000
    }
  })
);

app.use('/api/auth', authRoutes);
app.use('/api/coins', coinsRoutes);
app.use('/api/offerwalls', offerwallRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/withdraw', withdrawRoutes);
app.use('/api/postback', postbackRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/offers', offersRoutes);

// ── Android App Links verification ───────────────────────────────────────────
app.get('/.well-known/assetlinks.json', (req, res) => {
  res.json([{
    relation: ['delegate_permission/common.handle_all_urls'],
    target: {
      namespace: 'android_app',
      package_name: 'com.spetro.earn',
      sha256_cert_fingerprints: [
        process.env.APK_SHA256_FINGERPRINT || ''
      ].filter(Boolean)
    }
  }]);
});

// APK download — both routes point to the same file
function serveApk(req, res) {
  if (!fs.existsSync(APK_PATH)) {
    return res.status(503).send('APK is being prepared, please try again in 30 seconds.');
  }
  res.setHeader('Content-Type', 'application/vnd.android.package-archive');
  res.setHeader('Content-Disposition', 'attachment; filename="SpetroEarn-latest.apk"');
  res.sendFile(APK_PATH);
}
app.get('/SpetroEarn-latest.apk', serveApk);
app.get('/api/download-apk', serveApk);

// ── Download page for browser visitors ───────────────────────────────────────
// spetroearn.com is an Android-only app. Regular browser visitors are shown
// a simple download page. The app's WebView (User-Agent contains "wv") and
// all /api/* + /.well-known/* + APK routes bypass this check.
const DOWNLOAD_PAGE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Spetro Earn — Earn Real Rewards on Android</title>
  <meta name="description" content="Earn real money daily by completing offers, surveys, and check-ins. Withdraw via Visa, Binance, Google Play and more. Free to download.">
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    html{scroll-behavior:smooth}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#070f19;color:#fff;overflow-x:hidden}
    a{text-decoration:none;color:inherit}

    /* Nav */
    nav{position:fixed;top:0;left:0;right:0;z-index:100;background:rgba(7,15,25,.85);backdrop-filter:blur(12px);border-bottom:1px solid #1e293b;padding:0 24px}
    .nav-inner{max-width:1100px;margin:0 auto;height:60px;display:flex;align-items:center;justify-content:space-between}
    .nav-logo{display:flex;align-items:center;gap:10px;font-weight:800;font-size:18px}
    .nav-logo img{width:36px;height:36px;object-fit:contain;filter:drop-shadow(0 2px 8px rgba(59,130,246,.4))}
    .nav-dl{background:linear-gradient(135deg,#3b82f6,#1d4ed8);color:#fff;padding:9px 20px;border-radius:10px;font-weight:700;font-size:14px;transition:opacity .2s}
    .nav-dl:hover{opacity:.88}

    /* Hero */
    .hero{min-height:100vh;display:flex;align-items:center;justify-content:center;text-align:center;padding:120px 24px 80px;position:relative;overflow:hidden}
    .hero::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 90% 60% at 50% 0%,rgba(59,130,246,.13),transparent 70%)}
    .hero-logo{width:110px;height:110px;margin:0 auto 28px;display:flex;align-items:center;justify-content:center}
    .hero-logo img{width:110px;height:110px;object-fit:contain;filter:drop-shadow(0 16px 40px rgba(59,130,246,.55))}
    .hero h1{font-size:clamp(36px,6vw,64px);font-weight:900;letter-spacing:-1.5px;line-height:1.08;margin-bottom:18px;background:linear-gradient(135deg,#fff 40%,#94a3b8);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
    .hero-sub{font-size:18px;color:#64748b;line-height:1.65;max-width:560px;margin:0 auto 40px}
    .dl-btn{display:inline-flex;align-items:center;gap:12px;background:linear-gradient(135deg,#3b82f6,#1d4ed8);color:#fff;padding:18px 40px;border-radius:16px;font-weight:800;font-size:17px;box-shadow:0 8px 32px rgba(59,130,246,.4);transition:transform .2s,box-shadow .2s}
    .dl-btn:hover{transform:translateY(-2px);box-shadow:0 14px 40px rgba(59,130,246,.55)}
    .hero-note{margin-top:16px;font-size:13px;color:#334155}
    .hero-badges{display:flex;justify-content:center;gap:12px;margin-top:28px;flex-wrap:wrap}
    .badge{display:flex;align-items:center;gap:7px;background:#0f172a;border:1px solid #1e293b;border-radius:30px;padding:8px 16px;font-size:13px;color:#94a3b8}
    .badge-dot{width:7px;height:7px;border-radius:50%;background:#10b981;flex-shrink:0}

    /* Stats bar */
    .stats{background:#0f172a;border-top:1px solid #1e293b;border-bottom:1px solid #1e293b;padding:28px 24px}
    .stats-inner{max-width:1100px;margin:0 auto;display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:20px;text-align:center}
    .stat-num{font-size:30px;font-weight:900;color:#3b82f6}
    .stat-label{font-size:13px;color:#64748b;margin-top:4px}

    /* Section */
    .section{padding:90px 24px}
    .container{max-width:1100px;margin:0 auto}
    .section-tag{display:inline-block;background:rgba(59,130,246,.1);border:1px solid rgba(59,130,246,.25);color:#3b82f6;padding:5px 14px;border-radius:20px;font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;margin-bottom:14px}
    .section-title{font-size:clamp(26px,4vw,42px);font-weight:900;letter-spacing:-.5px;line-height:1.2;margin-bottom:14px}
    .section-sub{font-size:16px;color:#64748b;line-height:1.7;max-width:600px}

    /* Features grid */
    .features{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:18px;margin-top:50px}
    .feat{background:#0f172a;border:1px solid #1e293b;border-radius:18px;padding:24px;transition:border-color .2s}
    .feat:hover{border-color:#3b82f6}
    .feat-icon{width:46px;height:46px;border-radius:13px;background:rgba(59,130,246,.1);display:flex;align-items:center;justify-content:center;margin-bottom:16px}
    .feat-title{font-weight:700;font-size:16px;margin-bottom:7px}
    .feat-desc{font-size:13px;color:#64748b;line-height:1.6}

    /* How it works */
    .steps{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:24px;margin-top:50px;position:relative}
    .step{text-align:center;padding:28px 20px}
    .step-num{width:52px;height:52px;border-radius:50%;background:linear-gradient(135deg,#3b82f6,#1d4ed8);display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:900;margin:0 auto 18px;box-shadow:0 6px 24px rgba(59,130,246,.35)}
    .step-title{font-weight:800;font-size:17px;margin-bottom:8px}
    .step-desc{font-size:14px;color:#64748b;line-height:1.6}

    /* Payouts */
    .payouts{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;margin-top:50px}
    .payout{background:#0f172a;border:1px solid #1e293b;border-radius:16px;padding:20px;display:flex;align-items:center;gap:14px}
    .payout-icon{width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:20px}
    .payout-name{font-weight:700;font-size:15px}
    .payout-desc{font-size:12px;color:#64748b;margin-top:2px}

    /* Social CTA */
    .social-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px;margin-top:40px}
    .social-card{border-radius:18px;padding:24px;display:flex;align-items:center;gap:16px;transition:opacity .2s;cursor:pointer}
    .social-card:hover{opacity:.88}
    .yt-card{background:linear-gradient(135deg,#7f1d1d,#dc2626)}
    .tp-card{background:linear-gradient(135deg,#064e3b,#059669)}
    .social-card-icon{width:48px;height:48px;border-radius:13px;background:rgba(255,255,255,.15);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:22px}
    .social-card-title{font-weight:800;font-size:16px}
    .social-card-sub{font-size:13px;color:rgba(255,255,255,.7);margin-top:3px}

    /* FAQ */
    details{background:#0f172a;border:1px solid #1e293b;border-radius:14px;margin-bottom:10px;overflow:hidden}
    summary{padding:18px 22px;font-weight:700;font-size:15px;cursor:pointer;list-style:none;display:flex;justify-content:space-between;align-items:center;gap:12px}
    summary::after{content:'+';font-size:20px;color:#3b82f6;flex-shrink:0;transition:transform .2s}
    details[open] summary::after{content:'-'}
    .faq-body{padding:0 22px 18px;font-size:14px;color:#64748b;line-height:1.7}

    /* Footer */
    footer{background:#0f172a;border-top:1px solid #1e293b;padding:40px 24px;text-align:center}
    .footer-logo{display:flex;align-items:center;justify-content:center;gap:10px;font-weight:800;font-size:18px;margin-bottom:14px}
    .footer-logo img{width:32px;height:32px;border-radius:9px}
    .footer-links{display:flex;gap:24px;justify-content:center;flex-wrap:wrap;margin-bottom:20px}
    .footer-links a{font-size:14px;color:#64748b;transition:color .2s}
    .footer-links a:hover{color:#3b82f6}
    footer p{font-size:13px;color:#334155}
  </style>
</head>
<body>

<!-- Nav -->
<nav>
  <div class="nav-inner">
    <div class="nav-logo">
      <img src="/logo-transparent.png" alt="SE">
      Spetro Earn
    </div>
    <a class="nav-dl" href="/api/download-apk" download>Download APK</a>
  </div>
</nav>

<!-- Hero -->
<section class="hero">
  <div>
    <div class="hero-logo"><img src="/logo-transparent.png" alt="Spetro Earn"></div>
    <h1>Earn Real Money<br>Every Single Day</h1>
    <p class="hero-sub">Complete simple offers, daily check-ins, and tasks to earn Spetro Coins. Withdraw instantly via Visa, Binance, Google Play, and more. 100% free — no hidden fees.</p>
    <a class="dl-btn" href="/api/download-apk" download>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
      Download Free APK
    </a>
    <p class="hero-note">Android 7.0+ &nbsp;·&nbsp; No Google Play required &nbsp;·&nbsp; Latest v2.1.7</p>
    <div class="hero-badges">
      <div class="badge"><div class="badge-dot"></div>Tamper-proof server balances</div>
      <div class="badge"><div class="badge-dot"></div>8+ offerwall partners</div>
      <div class="badge"><div class="badge-dot"></div>Available worldwide</div>
    </div>
  </div>
</section>

<!-- Stats -->
<div class="stats">
  <div class="stats-inner">
    <div><div class="stat-num">8+</div><div class="stat-label">Offerwall Partners</div></div>
    <div><div class="stat-num">$1–$5</div><div class="stat-label">Withdrawal Tiers</div></div>
    <div><div class="stat-num">Daily</div><div class="stat-label">Check-in Rewards</div></div>
    <div><div class="stat-num">4</div><div class="stat-label">Payout Methods</div></div>
    <div><div class="stat-num">Free</div><div class="stat-label">Always & Forever</div></div>
  </div>
</div>

<!-- Features -->
<section class="section">
  <div class="container">
    <span class="section-tag">Why Spetro Earn?</span>
    <h2 class="section-title">Everything You Need<br>to Start Earning Today</h2>
    <p class="section-sub">Spetro Earn is built to be fair, secure, and rewarding. Your balance is stored on our servers — not on your device — making it impossible to cheat.</p>
    <div class="features">
      <div class="feat">
        <div class="feat-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></div>
        <div class="feat-title">Server-Side Balances</div>
        <div class="feat-desc">Your coins are stored in PostgreSQL on our servers. No app like Lucky Patcher can ever modify your balance.</div>
      </div>
      <div class="feat">
        <div class="feat-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></div>
        <div class="feat-title">Daily 7-Day Streak</div>
        <div class="feat-desc">Log in every day and build your streak. The longer your streak, the bigger your daily bonus coin reward.</div>
      </div>
      <div class="feat">
        <div class="feat-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg></div>
        <div class="feat-title">8+ Offerwall Partners</div>
        <div class="feat-desc">Earn from adjoe, TaskWall, RevU, Offery, Ovnix, AdToWall, Torox, MyChips — all in one place.</div>
      </div>
      <div class="feat">
        <div class="feat-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg></div>
        <div class="feat-title">Multiple Payouts</div>
        <div class="feat-desc">Withdraw via Visa gift card, Binance USDT, Litecoin, or Google Play gift card. Processed within 24–48h.</div>
      </div>
      <div class="feat">
        <div class="feat-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg></div>
        <div class="feat-title">Worldwide Access</div>
        <div class="feat-desc">Available to users globally. VPN detection protects our offerwall partners and ensures fair payouts for everyone.</div>
      </div>
      <div class="feat">
        <div class="feat-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg></div>
        <div class="feat-title">Completely Free</div>
        <div class="feat-desc">No subscription, no premium tier, no in-app purchases. You earn real rewards without spending a single dollar.</div>
      </div>
    </div>
  </div>
</section>

<!-- How it works -->
<section class="section" style="background:#0a1220;border-top:1px solid #1e293b;border-bottom:1px solid #1e293b">
  <div class="container" style="text-align:center">
    <span class="section-tag">Simple Process</span>
    <h2 class="section-title">Start Earning in 3 Steps</h2>
    <p class="section-sub" style="margin:0 auto">It takes less than 2 minutes to go from download to earning your first coins.</p>
    <div class="steps">
      <div class="step">
        <div class="step-num">1</div>
        <div class="step-title">Download & Install</div>
        <div class="step-desc">Download the APK below, install it on your Android device (Android 7.0+), and launch the app.</div>
      </div>
      <div class="step">
        <div class="step-num">2</div>
        <div class="step-title">Create Free Account</div>
        <div class="step-desc">Register with your email or sign in with Google. Accept the terms and receive your welcome bonus coins instantly.</div>
      </div>
      <div class="step">
        <div class="step-num">3</div>
        <div class="step-title">Earn & Withdraw</div>
        <div class="step-desc">Complete daily check-ins and offerwall tasks. Once you hit 1,000 SC (= $1), request a withdrawal.</div>
      </div>
    </div>
  </div>
</section>

<!-- Payout Methods -->
<section class="section">
  <div class="container">
    <span class="section-tag">Payouts</span>
    <h2 class="section-title">4 Ways to Cash Out</h2>
    <p class="section-sub">1,000 Spetro Coins = $1.00 USD. Choose how you want to receive your rewards.</p>
    <div class="payouts">
      <div class="payout">
        <div class="payout-icon" style="background:rgba(59,130,246,.1)">💳</div>
        <div><div class="payout-name">Visa Gift Card</div><div class="payout-desc">$1 · $2 · $3 · $5 · Sent by email</div></div>
      </div>
      <div class="payout">
        <div class="payout-icon" style="background:rgba(245,158,11,.1)">🔶</div>
        <div><div class="payout-name">Binance USDT</div><div class="payout-desc">Crypto · Custom amount</div></div>
      </div>
      <div class="payout">
        <div class="payout-icon" style="background:rgba(139,92,246,.1)">⚡</div>
        <div><div class="payout-name">Litecoin (LTC)</div><div class="payout-desc">Crypto · Custom amount</div></div>
      </div>
      <div class="payout">
        <div class="payout-icon" style="background:rgba(16,185,129,.1)">🎮</div>
        <div><div class="payout-name">Google Play</div><div class="payout-desc">$1 · $2 · $3 · $5 · Sent by email</div></div>
      </div>
    </div>
  </div>
</section>

<!-- Social CTA -->
<section class="section" style="background:#0a1220;border-top:1px solid #1e293b;border-bottom:1px solid #1e293b">
  <div class="container" style="text-align:center">
    <span class="section-tag">Community</span>
    <h2 class="section-title">Join Our Community</h2>
    <p class="section-sub" style="margin:0 auto">Stay up to date with new offerwall partners, bonus events, and withdrawal announcements.</p>
    <div class="social-grid">
      <a href="https://www.youtube.com/@SpetroEarn" target="_blank" class="social-card yt-card">
        <div class="social-card-icon">▶</div>
        <div>
          <div class="social-card-title">Follow on YouTube</div>
          <div class="social-card-sub">Tutorials, bonus tips & announcements</div>
        </div>
      </a>
      <a href="https://www.trustpilot.com" target="_blank" class="social-card tp-card">
        <div class="social-card-icon">★</div>
        <div>
          <div class="social-card-title">Rate Us on Trustpilot</div>
          <div class="social-card-sub">Your review helps others discover us</div>
        </div>
      </a>
    </div>
  </div>
</section>

<!-- FAQ -->
<section class="section">
  <div class="container">
    <span class="section-tag">FAQ</span>
    <h2 class="section-title">Frequently Asked Questions</h2>
    <p class="section-sub" style="margin-bottom:40px">Everything you need to know before getting started.</p>
    <details><summary>Is Spetro Earn really free?</summary><div class="faq-body">Yes, 100% free. There are no subscriptions, no premium plans, and no in-app purchases. You earn coins by completing offers and tasks provided by our offerwall partners.</div></details>
    <details><summary>How do I install the APK on Android?</summary><div class="faq-body">Download the APK file, go to Settings → Security → Enable "Install unknown apps" for your browser or file manager. Then open the APK file and tap Install. The app requires Android 7.0 or higher.</div></details>
    <details><summary>How long does a withdrawal take?</summary><div class="faq-body">Withdrawals are reviewed and processed within 24–48 hours on business days. Visa and Google Play gift cards are sent by email. Crypto (Binance/Litecoin) is sent to your provided wallet address.</div></details>
    <details><summary>Why can't I use a VPN with the offerwalls?</summary><div class="faq-body">Our offerwall partners require real geographic data to verify offers and prevent fraud. Using a VPN will temporarily block access to the earn section. Simply disable your VPN to access all offers.</div></details>
    <details><summary>Can I have multiple accounts?</summary><div class="faq-body">No. Each person is allowed one account. Multiple accounts from the same device or using the same withdrawal address will be flagged and banned. We use multiple detection methods to enforce this.</div></details>
    <details><summary>How many coins do I need to withdraw?</summary><div class="faq-body">The minimum withdrawal is 1,000 SC (= $1.00 USD). For Visa and Google Play gift cards, you choose from fixed tiers: $1, $2, $3, or $5. For Binance and Litecoin, you can enter any amount above 1,000 SC.</div></details>
    <details><summary>Is my account balance safe if I reinstall the app?</summary><div class="faq-body">Absolutely. Your balance is stored on our secure servers — not on your device. You can reinstall the app, switch phones, or log in from a new device and your balance will be exactly where you left it.</div></details>
  </div>
</section>

<!-- Download CTA -->
<section class="section" style="background:#0a1220;border-top:1px solid #1e293b;text-align:center">
  <div class="container">
    <h2 class="section-title">Ready to Start Earning?</h2>
    <p class="section-sub" style="margin:0 auto 36px">Download the app right now and collect your welcome bonus the moment you register.</p>
    <a class="dl-btn" href="/api/download-apk" download>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
      Download Spetro Earn — Free
    </a>
    <p class="hero-note" style="margin-top:14px">Android 7.0+ &nbsp;·&nbsp; v2.1.7 &nbsp;·&nbsp; 19 MB</p>
  </div>
</section>

<!-- Footer -->
<footer>
  <div class="footer-logo">
    <img src="/logo-transparent.png" alt="SE">
    Spetro Earn
  </div>
  <div class="footer-links">
    <a href="/admin">Admin Panel</a>
    <a href="https://www.youtube.com/@SpetroEarn" target="_blank">YouTube</a>
    <a href="https://www.trustpilot.com" target="_blank">Trustpilot</a>
    <a href="/api/download-apk" download>Download APK</a>
  </div>
  <p>&copy; 2025 Spetro Earn. All rights reserved. &nbsp;·&nbsp; Secure server-side reward platform.</p>
</footer>

</body>
</html>`;

function isBrowserRequest(req) {
  const ua = req.headers['user-agent'] || '';
  // Android WebView always contains "wv"; Capacitor/Ionic also adds it.
  // Regular Chrome/Firefox/Safari do NOT contain "wv".
  const isWebView = /\bwv\b/.test(ua);
  const acceptsHtml = (req.headers['accept'] || '').includes('text/html');
  return acceptsHtml && !isWebView;
}

// Browser visitors → show download page BEFORE express.static can intercept
// WebView (app) and API requests pass through normally.
app.use((req, res, next) => {
  // Let API, APK download, and well-known routes through always
  if (req.path.startsWith('/api') ||
      req.path.startsWith('/admin') ||
      req.path.startsWith('/.well-known') ||
      req.path === '/SpetroEarn-latest.apk') {
    return next();
  }
  if (isBrowserRequest(req)) {
    return res.send(DOWNLOAD_PAGE);
  }
  next();
});

// Serve static assets (JS/CSS/images) — needed by the WebView app
app.use(express.static(path.join(__dirname, 'public'), {
  setHeaders(res, filePath) {
    if (filePath.endsWith('index.html')) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
  }
}));

// React Router fallback — only reached by the WebView app
app.get('*', (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error.' });
});

autoInit()
  .then(() => {
    app.listen(PORT, '0.0.0.0', () => {
      const appUrl = process.env.APP_URL || `http://localhost:${PORT}`;
      console.log(`[Spetro Earn] Server ready on port ${PORT} (${IS_PROD ? 'production' : 'development'})`);
      console.log(`[Spetro Earn] App URL: ${appUrl}`);
      if (process.env.GOOGLE_CLIENT_ID) {
        console.log(`[Spetro Earn] Google OAuth callback: ${appUrl}/api/auth/google/callback`);
      }
    });
  })
  .catch((err) => {
    console.error('[FATAL] Database auto-init failed. Server will not start.', err.message);
    process.exit(1);
  });
