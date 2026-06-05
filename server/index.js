require('dotenv').config();

const express = require('express');
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

// ── Warn loudly if insecure defaults are still set ───────────────────────────
const DEFAULT_SECRET = 'spetro-earn-super-secret-key-change-in-prod';
if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET === DEFAULT_SECRET) {
  console.warn('');
  console.warn('  ⚠️  WARNING: SESSION_SECRET is not set or is using the default value.');
  console.warn('  ⚠️  Set a strong random secret in your .env file before going live.');
  console.warn('  ⚠️  Generate one: node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))"');
  console.warn('');
}

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

// Hashed assets (JS/CSS) — cache forever; index.html — never cache
app.use(express.static(path.join(__dirname, 'public'), {
  setHeaders(res, filePath) {
    if (filePath.endsWith('index.html')) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
  }
}));

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
