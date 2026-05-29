const express = require('express');
const crypto = require('crypto');
const pool = require('../db');
const router = express.Router();

// ── Shared HMAC-SHA256 verifier ───────────────────────────────────────────────
// All offerwall networks send:  payload = "${user_id}:${coins}:${offer_id}"
// Signed with the network's individual secret key via HMAC-SHA256 (hex digest).
// timingSafeEqual prevents timing-attack exploits on signature comparison.
function verifyHmac(secret, data, signature) {
  const hmac = crypto.createHmac('sha256', secret).update(data).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(signature));
  } catch {
    return false; // length mismatch throws — treat as invalid
  }
}

// ── Atomic coin credit helper ─────────────────────────────────────────────────
// Runs UPDATE users + INSERT transactions inside a single DB transaction.
// Throws on any DB error so callers can return 500.
async function creditUser(userId, coins, type, description) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      'UPDATE users SET coins = coins + $1 WHERE id = $2',
      [coins, userId]
    );
    await client.query(
      'INSERT INTO transactions (user_id, amount, type, description) VALUES ($1, $2, $3, $4)',
      [userId, coins, type, description]
    );
    await client.query('COMMIT');
    console.log(`[Offerwall] Credited user_id=${userId} +${coins} SC | type=${type} | ${description}`);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// ── Shared postback request validator ────────────────────────────────────────
// Parses + validates user_id, coins, offer_id, and signature from the request.
// Returns { ok: false, status, message } on failure or { ok: true, ...fields } on success.
function parsePostbackBody(req, secret) {
  const { user_id, coins, offer_id, signature } = req.body;

  if (!secret) {
    return { ok: false, status: 500, message: 'Secret not configured on server.' };
  }
  if (!user_id || !coins || !offer_id || !signature) {
    return { ok: false, status: 400, message: 'Missing required parameters.' };
  }

  const parsedUserId = parseInt(user_id, 10);
  const parsedCoins  = parseInt(coins, 10);
  if (isNaN(parsedUserId) || isNaN(parsedCoins) || parsedCoins <= 0) {
    return { ok: false, status: 400, message: 'Invalid user_id or coins value.' };
  }

  const payload = `${user_id}:${coins}:${offer_id}`;
  if (!verifyHmac(secret, payload, signature)) {
    return { ok: false, status: 403, message: 'Invalid signature.' };
  }

  return { ok: true, userId: parsedUserId, coins: parsedCoins, offerId: offer_id };
}


// =============================================================================
// === ADJOE POSTBACK START ===
// =============================================================================
// Network:    Adjoe (adjoe.io)
// Endpoint:   POST /api/offerwalls/adjoy/callback
// Env var:    ADJOY_SECRET
// Payload:    user_id:coins:offer_id  signed with HMAC-SHA256
// =============================================================================

router.post('/adjoy/callback', async (req, res) => {
  const parsed = parsePostbackBody(req, process.env.ADJOY_SECRET);
  if (!parsed.ok) {
    console.warn(`[Adjoe] Rejected postback — ${parsed.message}`);
    return res.status(parsed.status).send(parsed.message);
  }
  try {
    await creditUser(parsed.userId, parsed.coins, 'adjoe_offer', `Adjoe offer #${parsed.offerId}`);
    return res.status(200).send('OK');
  } catch (err) {
    console.error('[Adjoe] DB error:', err.message);
    return res.status(500).send('Server error');
  }
});

// === ADJOE POSTBACK END ===


// =============================================================================
// === REVU POSTBACK START ===
// =============================================================================
// Network:    RevU (revu.net)
// Endpoint:   POST /api/offerwalls/revu/callback
// Env var:    REVU_SECRET
// Payload:    user_id:coins:offer_id  signed with HMAC-SHA256
// =============================================================================

router.post('/revu/callback', async (req, res) => {
  const parsed = parsePostbackBody(req, process.env.REVU_SECRET);
  if (!parsed.ok) {
    console.warn(`[RevU] Rejected postback — ${parsed.message}`);
    return res.status(parsed.status).send(parsed.message);
  }
  try {
    await creditUser(parsed.userId, parsed.coins, 'revu_offer', `RevU offer #${parsed.offerId}`);
    return res.status(200).send('OK');
  } catch (err) {
    console.error('[RevU] DB error:', err.message);
    return res.status(500).send('Server error');
  }
});

// === REVU POSTBACK END ===


// =============================================================================
// === OFFERY POSTBACK START ===
// =============================================================================
// Network:    Offery (offery.io)
// Endpoint:   POST /api/offerwalls/offery/callback
// Env var:    OFFERY_SECRET
// Payload:    user_id:coins:offer_id  signed with HMAC-SHA256
// =============================================================================

router.post('/offery/callback', async (req, res) => {
  const parsed = parsePostbackBody(req, process.env.OFFERY_SECRET);
  if (!parsed.ok) {
    console.warn(`[Offery] Rejected postback — ${parsed.message}`);
    return res.status(parsed.status).send(parsed.message);
  }
  try {
    await creditUser(parsed.userId, parsed.coins, 'offery_offer', `Offery offer #${parsed.offerId}`);
    return res.status(200).send('OK');
  } catch (err) {
    console.error('[Offery] DB error:', err.message);
    return res.status(500).send('Server error');
  }
});

// === OFFERY POSTBACK END ===


// =============================================================================
// === OVNIX POSTBACK START ===
// =============================================================================
// Network:    Ovnix (ovnix.com)
// Endpoint:   POST /api/offerwalls/ovnix/callback
// Env var:    OVNIX_SECRET
// Payload:    user_id:coins:offer_id  signed with HMAC-SHA256
// =============================================================================

router.post('/ovnix/callback', async (req, res) => {
  const parsed = parsePostbackBody(req, process.env.OVNIX_SECRET);
  if (!parsed.ok) {
    console.warn(`[Ovnix] Rejected postback — ${parsed.message}`);
    return res.status(parsed.status).send(parsed.message);
  }
  try {
    await creditUser(parsed.userId, parsed.coins, 'ovnix_offer', `Ovnix offer #${parsed.offerId}`);
    return res.status(200).send('OK');
  } catch (err) {
    console.error('[Ovnix] DB error:', err.message);
    return res.status(500).send('Server error');
  }
});

// === OVNIX POSTBACK END ===


// =============================================================================
// === ADTOWALL POSTBACK START ===
// =============================================================================
// Network:    AdToWall (adtowall.com)
// Endpoint:   POST /api/offerwalls/adtowall/callback
// Env var:    ADTOWALL_SECRET
// Payload:    user_id:coins:offer_id  signed with HMAC-SHA256
// Register this postback URL in your AdToWall publisher dashboard:
//   https://<your-domain>/api/offerwalls/adtowall/callback
// =============================================================================

router.post('/adtowall/callback', async (req, res) => {
  const parsed = parsePostbackBody(req, process.env.ADTOWALL_SECRET);
  if (!parsed.ok) {
    console.warn(`[AdToWall] Rejected postback — ${parsed.message}`);
    return res.status(parsed.status).send(parsed.message);
  }
  try {
    await creditUser(parsed.userId, parsed.coins, 'adtowall_offer', `AdToWall offer #${parsed.offerId}`);
    return res.status(200).send('OK');
  } catch (err) {
    console.error('[AdToWall] DB error:', err.message);
    return res.status(500).send('Server error');
  }
});

// === ADTOWALL POSTBACK END ===


// =============================================================================
// === TASKWALL POSTBACK START ===
// =============================================================================
// Network:    TaskWall
// Endpoint:   GET or POST /api/offerwalls/taskwall/callback
// Env var:    TASKWALL_SECRET  (set this same value as the "Postback Password"
//             in the TaskWall dashboard — it is sent back as &password=)
// TaskWall macros: {userid} {user_amount} {offer_id} {offer_name} {payout} ...
// Register this postback URL in your TaskWall publisher dashboard:
//   https://<your-domain>/api/offerwalls/taskwall/callback?userid={userid}&amount={user_amount}&offer_id={offer_id}
// (TaskWall appends the configured Postback Password automatically.)
// =============================================================================

// Constant-time compare that won't throw on differing lengths.
function safeEqual(a, b) {
  const bufA = Buffer.from(String(a || ''));
  const bufB = Buffer.from(String(b || ''));
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

router.all('/taskwall/callback', async (req, res) => {
  const secret = process.env.TASKWALL_SECRET;
  if (!secret) {
    console.warn('[TaskWall] Rejected postback — Secret not configured on server.');
    return res.status(500).send('Secret not configured on server.');
  }

  // TaskWall sends macros via query string (GET); accept POST body too.
  const p = { ...req.body, ...req.query };

  // The Postback Password is returned as `password`; also accept `key` for
  // setups that embed the secret directly in the URL.
  const provided = p.password ?? p.key;
  if (!safeEqual(provided, secret)) {
    console.warn('[TaskWall] Rejected postback — Invalid password.');
    return res.status(403).send('Invalid password.');
  }

  const userId = parseInt(p.userid ?? p.user_id, 10);
  const coins  = parseInt(p.amount ?? p.user_amount ?? p.coins, 10);
  const offerId = p.offer_id ?? p.offerid ?? '';

  if (isNaN(userId) || isNaN(coins) || coins <= 0) {
    console.warn('[TaskWall] Rejected postback — Invalid userid or amount.');
    return res.status(400).send('Invalid userid or amount.');
  }

  try {
    await creditUser(userId, coins, 'taskwall_offer', `TaskWall offer #${offerId}`);
    return res.status(200).send('OK');
  } catch (err) {
    console.error('[TaskWall] DB error:', err.message);
    return res.status(500).send('Server error');
  }
});

// === TASKWALL POSTBACK END ===


// =============================================================================
// === TOROX POSTBACK START ===
// =============================================================================
// Network:    Torox (torox.io)
// Endpoint:   POST /api/offerwalls/torox/callback
// Env var:    TOROX_SECRET
// Payload:    user_id:coins:offer_id  signed with HMAC-SHA256
// Register this postback URL in your Torox publisher dashboard:
//   https://<your-domain>/api/offerwalls/torox/callback
// =============================================================================

router.post('/torox/callback', async (req, res) => {
  const parsed = parsePostbackBody(req, process.env.TOROX_SECRET);
  if (!parsed.ok) {
    console.warn(`[Torox] Rejected postback — ${parsed.message}`);
    return res.status(parsed.status).send(parsed.message);
  }
  try {
    await creditUser(parsed.userId, parsed.coins, 'torox_offer', `Torox offer #${parsed.offerId}`);
    return res.status(200).send('OK');
  } catch (err) {
    console.error('[Torox] DB error:', err.message);
    return res.status(500).send('Server error');
  }
});

// === TOROX POSTBACK END ===


// =============================================================================
// === MYCHIPS POSTBACK START ===
// =============================================================================
// Network:    MyChips (mychips.io)
// Endpoint:   POST /api/offerwalls/mychips/callback
// Env var:    MYCHIPS_SECRET
// Payload:    user_id:coins:offer_id  signed with HMAC-SHA256
// Register this postback URL in your MyChips publisher dashboard:
//   https://<your-domain>/api/offerwalls/mychips/callback
// =============================================================================

router.post('/mychips/callback', async (req, res) => {
  const parsed = parsePostbackBody(req, process.env.MYCHIPS_SECRET);
  if (!parsed.ok) {
    console.warn(`[MyChips] Rejected postback — ${parsed.message}`);
    return res.status(parsed.status).send(parsed.message);
  }
  try {
    await creditUser(parsed.userId, parsed.coins, 'mychips_offer', `MyChips offer #${parsed.offerId}`);
    return res.status(200).send('OK');
  } catch (err) {
    console.error('[MyChips] DB error:', err.message);
    return res.status(500).send('Server error');
  }
});

// === MYCHIPS POSTBACK END ===


// ── Public offerwall config (used by frontend Earn page) ─────────────────────
// Returns the URL template for each enabled network so the frontend
// can build the iframe src without hardcoding publisher URLs in client code.
// Returns ALL networks (enabled + disabled) so the frontend can hide disabled cards.
// Shape: { config: { [network_id]: { url: string, enabled: boolean } } }
router.get('/config', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT network_id, url, enabled FROM offerwall_config ORDER BY id'
    );
    const config = {};
    for (const row of result.rows) {
      config[row.network_id] = { url: row.url, enabled: row.enabled };
    }
    return res.json({ config });
  } catch (err) {
    console.error('Offerwall public config error:', err);
    return res.status(500).json({ config: {} });
  }
});

module.exports = router;
