const express = require('express');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const pool = require('../db');
const { checkIP, blockVPN } = require('../middleware/vpnCheck');
const router = express.Router();

// Temporary token store for Android app Google OAuth handoff
// Maps token -> { userId, name, expires }
const appOAuthTokens = new Map();
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of appOAuthTokens) {
    if (v.expires < now) appOAuthTokens.delete(k);
  }
}, 60_000);

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

async function sendResetEmail(toEmail, resetLink) {
  const host = process.env.EMAIL_HOST;
  if (!host) {
    console.log(`[PASSWORD RESET LINK — no SMTP configured] ${resetLink}`);
    return;
  }
  const transporter = nodemailer.createTransport({
    host,
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
  });
  await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: toEmail,
    subject: 'Spetro Earn — Reset Your Password',
    text: `You requested a password reset. Click the link below to set a new password:\n\n${resetLink}\n\nThis link expires in 1 hour. If you didn't request this, ignore this email.`,
    html: `<p>You requested a password reset. Click the link below to set a new password:</p><p><a href="${resetLink}">${resetLink}</a></p><p>This link expires in 1 hour. If you didn't request this, ignore this email.</p>`
  });
}

// ── Generates a clean 12-char alphanumeric UID ────────────────────────────────
function generateUID() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let uid = '';
  for (let i = 0; i < 12; i++) uid += chars[Math.floor(Math.random() * chars.length)];
  return uid;
}

// ── Get IP info (country + VPN flag) with a 3s timeout ───────────────────────
async function getIPInfo(ip) {
  try {
    return await Promise.race([
      checkIP(ip),
      new Promise((r) => setTimeout(() => r({ isVpn: false, country: 'Unknown', countryCode: '' }), 3000))
    ]);
  } catch {
    return { isVpn: false, country: 'Unknown', countryCode: '' };
  }
}

// ── Register ──────────────────────────────────────────────────────────────────
const NAME_REGEX = /^[A-Za-z\s]+$/;

router.post('/register', async (req, res) => {
  const { name, email, password, termsAccepted, termsAcceptedAt } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ error: 'All fields are required.' });
  if (!termsAccepted)
    return res.status(400).json({ error: 'You must agree to the Terms of Service to register.' });
  if (!NAME_REGEX.test(name.trim()))
    return res.status(400).json({ error: 'Invalid Name: Your name must contain English letters only, with no numbers or special characters.' });
  if (password.length < 6)
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });

  try {
    const exists = await pool.query(
      'SELECT id FROM users WHERE email = $1 OR name = $2',
      [email.toLowerCase().trim(), name.trim()]
    );
    if (exists.rows.length > 0)
      return res.status(409).json({ error: 'Name or email already taken.' });

    const hash = await bcrypt.hash(password, 12);
    const uid = generateUID();
    const avatarSeed = Math.floor(Math.random() * 30) + 1;

    // Detect country from IP (blockVPN already ran, so IP is clean)
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
    const { country, countryCode } = await getIPInfo(ip);

    const acceptedAt = termsAcceptedAt ? new Date(termsAcceptedAt) : new Date();
    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, uid, avatar_seed, country, country_code, terms_accepted, terms_accepted_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, name, email, coins, welcome_bonus_claimed, uid,
                 avatar_seed, country, country_code, status, checkin_streak, last_checkin`,
      [name.trim(), email.toLowerCase().trim(), hash, uid, avatarSeed, country, countryCode, true, acceptedAt]
    );

    const user = result.rows[0];
    req.session.userId = user.id;
    req.session.name = user.name;
    return res.json({ user, isNew: true });
  } catch (err) {
    console.error('Register error:', err.message);
    return res.status(500).json({ error: 'Server error during registration.' });
  }
});

// ── Login ─────────────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: 'Email and password are required.' });

  try {
    const result = await pool.query(
      `SELECT id, name, email, coins, password_hash, welcome_bonus_claimed,
              last_checkin, uid, avatar_seed, country, country_code, status, checkin_streak, created_at
       FROM users WHERE email = $1`,
      [email.toLowerCase().trim()]
    );
    if (result.rows.length === 0)
      return res.status(401).json({ error: 'Invalid email or password.' });

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match)
      return res.status(401).json({ error: 'Invalid email or password.' });
    if (user.status === 'banned')
      return res.status(403).json({ error: 'This account has been suspended.' });

    req.session.userId = user.id;
    req.session.name = user.name;

    // Update country silently if missing
    if (!user.country || user.country === 'Unknown') {
      const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
      getIPInfo(ip).then(({ country, countryCode }) =>
        pool.query(
          'UPDATE users SET country = $1, country_code = $2 WHERE id = $3',
          [country, countryCode, user.id]
        ).catch(() => {})
      );
    }

    const { password_hash, ...safeUser } = user;
    return res.json({ user: safeUser });
  } catch (err) {
    console.error('Login error:', err.message);
    return res.status(500).json({ error: 'Server error during login.' });
  }
});

// ── Logout ────────────────────────────────────────────────────────────────────
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ error: 'Logout failed.' });
    res.clearCookie('spetro.sid');
    return res.json({ success: true });
  });
});

// ── Me ────────────────────────────────────────────────────────────────────────
router.get('/me', async (req, res) => {
  if (!req.session?.userId)
    return res.status(401).json({ error: 'Not authenticated.' });
  try {
    const result = await pool.query(
      `SELECT id, name, email, coins, welcome_bonus_claimed, last_checkin,
              created_at, uid, avatar_seed, country, country_code, status, checkin_streak
       FROM users WHERE id = $1`,
      [req.session.userId]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: 'User not found.' });
    return res.json({ user: result.rows[0] });
  } catch (err) {
    console.error('Me error:', err.message);
    return res.status(500).json({ error: 'Server error.' });
  }
});

// ── VPN Check (used by the Offerwalls page on mount) ─────────────────────────
// Returns { blocked, riskScore, isVpn } so the frontend can show details
router.get('/vpn-check', async (req, res) => {
  try {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
    const { blocked, isVpn, riskScore } = await getIPInfo(ip);
    return res.json({ blocked, isVpn, riskScore: riskScore || 0 });
  } catch {
    return res.json({ blocked: false, isVpn: false, riskScore: 0 });
  }
});

// ── Google OAuth ──────────────────────────────────────────────────────────────
router.get('/google', (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) return res.redirect('/?error=google_not_configured');
  const redirectUri = encodeURIComponent(
    `${process.env.APP_URL || `https://${req.headers.host}`}/api/auth/google/callback`
  );
  const scope = encodeURIComponent('openid email profile');
  // Pass state=app so the callback knows to redirect back to the Android app
  const state = req.query.from_app ? 'app' : 'web';
  const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&prompt=select_account&state=${state}`;
  return res.redirect(url);
});

router.get('/google/callback', async (req, res) => {
  const { code, error, state } = req.query;
  const fromApp = state === 'app';
  if (error || !code) {
    return fromApp
      ? res.redirect('spetroearn://auth-error?reason=google_cancelled')
      : res.redirect('/?error=google_cancelled');
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return res.redirect('/?error=google_not_configured');

  try {
    const host = `${process.env.APP_URL || `https://${req.headers.host}`}`;
    const redirectUri = `${host}/api/auth/google/callback`;

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code, client_id: clientId, client_secret: clientSecret,
        redirect_uri: redirectUri, grant_type: 'authorization_code'
      })
    });
    const tokens = await tokenRes.json();
    if (!tokens.access_token) return res.redirect('/?error=google_token_failed');

    const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` }
    });
    const profile = await profileRes.json();
    if (!profile.id) return res.redirect('/?error=google_profile_failed');

    let userRow = await pool.query(
      `SELECT id, name, email, coins, welcome_bonus_claimed, uid, avatar_seed,
              country, country_code, status, checkin_streak, last_checkin
       FROM users WHERE google_id = $1 OR email = $2`,
      [profile.id, profile.email.toLowerCase()]
    );

    const isNewUser = userRow.rows.length === 0;
    if (isNewUser) {
      const uid = generateUID();
      const avatarSeed = Math.floor(Math.random() * 30) + 1;
      const name = (profile.name || profile.email.split('@')[0])
        .replace(/\s+/g, '').slice(0, 20) + Math.floor(Math.random() * 999);
      const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
      const { country, countryCode } = await getIPInfo(ip);

      userRow = await pool.query(
        `INSERT INTO users (name, email, password_hash, uid, avatar_seed, country, country_code, google_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id, name, email, coins, welcome_bonus_claimed, uid,
                   avatar_seed, country, country_code, status, checkin_streak, last_checkin`,
        [name, profile.email.toLowerCase(), 'GOOGLE_AUTH', uid, avatarSeed, country, countryCode, profile.id]
      );

      const newUserId = userRow.rows[0].id;
      const WELCOME_COINS = 20;
      await pool.query(
        'UPDATE users SET coins = coins + $1, welcome_bonus_claimed = TRUE WHERE id = $2',
        [WELCOME_COINS, newUserId]
      );
      await pool.query(
        'INSERT INTO transactions (user_id, amount, type, description) VALUES ($1, $2, $3, $4)',
        [newUserId, WELCOME_COINS, 'welcome_bonus', 'Welcome bonus reward']
      );
    } else if (!userRow.rows[0].google_id) {
      await pool.query('UPDATE users SET google_id = $1 WHERE id = $2', [profile.id, userRow.rows[0].id]);
    }

    const user = userRow.rows[0];
    if (user.status === 'banned') {
      return fromApp
        ? res.redirect('spetroearn://auth-error?reason=account_banned')
        : res.redirect('/?error=account_banned');
    }

    req.session.userId = user.id;
    req.session.name = user.name;
    // If request came from the Android app:
    // 1. Create a short-lived one-time token (5 min TTL)
    // 2. Redirect to spetroearn:// custom scheme — Chrome hands off to the app
    // 3. MainActivity loads /api/auth/app-signin?token=<token> in the WebView
    //    which creates a proper WebView session and redirects to /
    if (fromApp) {
      const appToken = crypto.randomBytes(32).toString('hex');
      appOAuthTokens.set(appToken, { userId: user.id, name: user.name, expires: Date.now() + 5 * 60_000 });
      return res.redirect(`spetroearn://auth-complete?token=${appToken}`);
    }
    return res.redirect('/');
  } catch (err) {
    console.error('Google OAuth error:', err.message);
    return fromApp
      ? res.redirect('spetroearn://auth-error?reason=google_failed')
      : res.redirect('/?error=google_failed');
  }
});

// ── Android App OAuth Token Exchange ─────────────────────────────────────────
// Called by MainActivity after Chrome finishes Google OAuth.
// Exchanges the one-time token for a real WebView session, then redirects to /.
router.get('/app-signin', (req, res) => {
  const { token } = req.query;
  if (!token) return res.redirect('/?error=google_failed');
  const data = appOAuthTokens.get(token);
  if (!data || Date.now() > data.expires) {
    return res.redirect('/?error=token_expired');
  }
  appOAuthTokens.delete(token); // one-time use
  req.session.userId = data.userId;
  req.session.name   = data.name;
  return res.redirect('/');
});

// ── Forgot Password ───────────────────────────────────────────────────────────
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required.' });
  try {
    const result = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    // Always respond success to avoid email enumeration
    if (result.rows.length === 0) return res.json({ success: true });

    const userId = result.rows[0].id;
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = hashToken(rawToken);
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await pool.query(
      'UPDATE users SET password_reset_token = $1, password_reset_expires = $2 WHERE id = $3',
      [hashedToken, expires, userId]
    );

    const appUrl = process.env.APP_URL || `https://${req.headers.host}`;
    const resetLink = `${appUrl}?reset_token=${rawToken}`;
    await sendResetEmail(email.toLowerCase().trim(), resetLink);

    return res.json({ success: true });
  } catch (err) {
    console.error('Forgot password error:', err.message);
    return res.status(500).json({ error: 'Failed to process request.' });
  }
});

// ── Reset Password ────────────────────────────────────────────────────────────
router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) return res.status(400).json({ error: 'Token and new password are required.' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters.' });

  try {
    const hashedToken = hashToken(token);
    const result = await pool.query(
      'SELECT id FROM users WHERE password_reset_token = $1 AND password_reset_expires > NOW()',
      [hashedToken]
    );
    if (result.rows.length === 0)
      return res.status(400).json({ error: 'Reset link is invalid or has expired. Please request a new one.' });

    const userId = result.rows[0].id;
    const hash = await bcrypt.hash(password, 12);
    await pool.query(
      'UPDATE users SET password_hash = $1, password_reset_token = NULL, password_reset_expires = NULL WHERE id = $2',
      [hash, userId]
    );
    return res.json({ success: true });
  } catch (err) {
    console.error('Reset password error:', err.message);
    return res.status(500).json({ error: 'Failed to reset password.' });
  }
});

// ── Push subscription ─────────────────────────────────────────────────────────
router.post('/push-subscribe', async (req, res) => {
  if (!req.session?.userId) return res.status(401).json({ error: 'Unauthorized' });
  return res.json({ success: true });
});

module.exports = router;
