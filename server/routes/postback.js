const express = require('express');
const crypto = require('crypto');
const pool = require('../db');
const router = express.Router();

// ── Atomic coin credit helper ─────────────────────────────────────────────────
async function creditUser(userId, coins, type, description) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      'UPDATE users SET coins = coins + $1 WHERE id = $2',
      [coins, userId]
    );
    await client.query(
      `INSERT INTO transactions (user_id, amount, type, description) VALUES ($1, $2, $3, $4)`,
      [userId, coins, type, description]
    );
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// =============================================================================
// === ADJOE EVENT-BASED POSTBACK START ===
// =============================================================================
// Network:  Adjoe (adjoe.io) — Playtime / event-based rewards
// Endpoint: POST /api/postback/adjoe
// Env var:  ADJOE_SECRET_KEY
//
// Adjoe sends these parameters on every completed event:
//   subId          — Your user identifier (maps to users.id in our DB)
//   currency       — Coins/points to award the user
//   extra_param_1  — Game or campaign name (for logging purposes)
//   adjoe_signature — HMAC-SHA256 signature for request authenticity
//
// Signature verification:
//   Adjoe signs the payload as: HMAC-SHA256(ADJOE_SECRET_KEY, "${subId}:${currency}")
//   Digest format: lowercase hex string
//   NOTE: Confirm the exact payload string in your Adjoe publisher dashboard.
//         Update the `payload` variable below if Adjoe's format differs.
//
// Register this URL in your Adjoe publisher dashboard as the postback endpoint:
//   https://<your-domain>/api/postback/adjoe
// =============================================================================

router.post('/adjoe', async (req, res) => {
  // ── 1. Read Adjoe parameters ────────────────────────────────────────────────
  // Support both JSON body and form-encoded (Adjoe can send either).
  const params = { ...req.query, ...req.body };
  const { subId, currency, extra_param_1, adjoe_signature } = params;

  // ── 2. Check secret is configured ──────────────────────────────────────────
  const secret = process.env.ADJOE_SECRET_KEY;
  if (!secret) {
    console.error('[Adjoe Postback] ADJOE_SECRET_KEY is not set in environment variables.');
    return res.status(500).send('Server misconfiguration: ADJOE_SECRET_KEY missing.');
  }

  // ── 3. Validate required parameters ────────────────────────────────────────
  if (!subId || !currency || !adjoe_signature) {
    console.warn('[Adjoe Postback] Missing required parameters:', { subId, currency, adjoe_signature: !!adjoe_signature });
    return res.status(400).send('Missing required parameters: subId, currency, adjoe_signature.');
  }

  const parsedUserId = parseInt(subId, 10);
  const parsedCoins  = parseInt(currency, 10);

  if (isNaN(parsedUserId) || parsedUserId <= 0) {
    console.warn(`[Adjoe Postback] Invalid subId: "${subId}"`);
    return res.status(400).send('Invalid subId — must be a positive integer.');
  }
  if (isNaN(parsedCoins) || parsedCoins <= 0) {
    console.warn(`[Adjoe Postback] Invalid currency value: "${currency}"`);
    return res.status(400).send('Invalid currency — must be a positive integer.');
  }

  // ── 4. Verify Adjoe signature ───────────────────────────────────────────────
  // Payload: "${subId}:${currency}"
  // If Adjoe uses a different payload format, update the string below.
  const payload   = `${subId}:${currency}`;
  const expected  = crypto.createHmac('sha256', secret).update(payload).digest('hex');

  let signatureValid = false;
  try {
    signatureValid = crypto.timingSafeEqual(
      Buffer.from(expected),
      Buffer.from(adjoe_signature)
    );
  } catch {
    signatureValid = false; // Buffer length mismatch = invalid
  }

  if (!signatureValid) {
    console.warn(`[Adjoe Postback] Signature mismatch for subId=${subId}. Possible tampering or wrong secret.`);
    return res.status(403).send('Invalid signature.');
  }

  // ── 5. Look up user ─────────────────────────────────────────────────────────
  let user;
  try {
    const result = await pool.query(
      'SELECT id, name, coins, status FROM users WHERE id = $1',
      [parsedUserId]
    );
    if (result.rows.length === 0) {
      console.warn(`[Adjoe Postback] User not found: subId=${subId}`);
      return res.status(404).send(`User not found: subId=${subId}`);
    }
    user = result.rows[0];
  } catch (err) {
    console.error('[Adjoe Postback] DB error during user lookup:', err.message);
    return res.status(500).send('Database error.');
  }

  // ── 6. Reject banned users ──────────────────────────────────────────────────
  if (user.status === 'banned') {
    console.warn(`[Adjoe Postback] Blocked — user is banned: subId=${subId}`);
    return res.status(403).send('User account is suspended.');
  }

  // ── 7. Credit coins (atomic) ────────────────────────────────────────────────
  const campaignName = extra_param_1 || 'Unknown Campaign';
  const description  = `Adjoe — ${campaignName}`;

  try {
    await creditUser(parsedUserId, parsedCoins, 'adjoe_event', description);
    console.log(
      `[Adjoe Postback] SUCCESS — user_id=${user.id} (${user.name})` +
      ` +${parsedCoins} SC | campaign="${campaignName}"` +
      ` | balance: ${user.coins} → ${user.coins + parsedCoins}`
    );
    // Adjoe expects a plain "1" or "OK" as the success response.
    return res.status(200).send('1');
  } catch (err) {
    console.error('[Adjoe Postback] DB error crediting coins:', err.message);
    return res.status(500).send('Database error while crediting coins.');
  }
});

// === ADJOE EVENT-BASED POSTBACK END ===


// =============================================================================
// === GENERIC POSTBACK START ===
// =============================================================================
// A universal fallback handler for any network not covered above.
// Uses a shared POSTBACK_SECRET env var for simple key-based auth.
// Endpoint: GET|POST /api/postback/
// Params:   user_id, amount, offer_id (or offer_name), secret_key
// =============================================================================

async function handlePostback(req, res) {
  const params = { ...req.query, ...req.body };
  const { user_id, amount, offer_id, offer_name, secret_key } = params;

  const expectedSecret = process.env.POSTBACK_SECRET;
  if (!expectedSecret) {
    console.error('[Postback] POSTBACK_SECRET is not configured.');
    return res.status(500).json({ error: 'Postback secret not configured on server.' });
  }

  if (!secret_key || secret_key !== expectedSecret) {
    console.warn(`[Postback] Rejected — invalid secret_key.`);
    return res.status(403).json({ error: 'Unauthorized: invalid secret key.' });
  }

  if (!user_id) {
    return res.status(400).json({ error: 'Missing required parameter: user_id.' });
  }

  const parsedAmount = parseInt(amount, 10);
  if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
    return res.status(400).json({ error: 'Invalid or missing amount.' });
  }

  const resolvedOfferName = offer_name || offer_id || 'Unknown Offer';

  let user;
  try {
    const result = await pool.query(
      'SELECT id, name, coins, status FROM users WHERE id = $1',
      [parseInt(user_id, 10)]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: `User not found: user_id=${user_id}` });
    }
    user = result.rows[0];
  } catch (err) {
    console.error('[Postback] DB lookup error:', err.message);
    return res.status(500).json({ error: 'Database error.' });
  }

  if (user.status === 'banned') {
    return res.status(403).json({ error: 'User account is suspended.' });
  }

  try {
    await creditUser(user.id, parsedAmount, 'postback_offer', `Offer completed: ${resolvedOfferName}`);
    console.log(`[Postback] SUCCESS — user_id=${user.id} +${parsedAmount} SC | offer="${resolvedOfferName}"`);
    return res.status(200).send('1');
  } catch (err) {
    console.error('[Postback] DB credit error:', err.message);
    return res.status(500).json({ error: 'Database error while crediting coins.' });
  }
}

router.get('/', handlePostback);
router.post('/', handlePostback);

// === GENERIC POSTBACK END ===


module.exports = router;
