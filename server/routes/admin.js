const express = require('express');
const pool = require('../db');
const adminConfig = require('../admin-config');
const { requireAdmin } = require('../middleware/auth');
const router = express.Router();

// Password-only admin login — credentials stored in server/admin-config.js
router.post('/login', (req, res) => {
  const { password } = req.body;
  if (!password)
    return res.status(400).json({ error: 'Password is required.' });
  if (password !== adminConfig.ADMIN_PASSWORD)
    return res.status(401).json({ error: 'Invalid password.' });
  req.session.adminId = 1;
  req.session.adminUsername = 'admin';
  return res.json({ success: true, admin: { id: 1, username: 'admin' } });
});

router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ error: 'Logout failed.' });
    res.clearCookie('spetro.sid');
    return res.json({ success: true });
  });
});

router.get('/me', requireAdmin, (req, res) => {
  return res.json({ admin: { id: req.session.adminId, username: req.session.adminUsername } });
});

router.get('/stats', requireAdmin, async (req, res) => {
  try {
    const [users, totalCoins, pendingWithdrawals, transactions] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM users'),
      pool.query('SELECT COALESCE(SUM(coins), 0) AS total FROM users'),
      pool.query("SELECT COUNT(*) FROM withdrawals WHERE status = 'pending'"),
      pool.query('SELECT COUNT(*) FROM transactions')
    ]);
    return res.json({
      totalUsers: parseInt(users.rows[0].count),
      totalCoinsInCirculation: parseInt(totalCoins.rows[0].total),
      pendingWithdrawals: parseInt(pendingWithdrawals.rows[0].count),
      totalTransactions: parseInt(transactions.rows[0].count)
    });
  } catch (err) {
    console.error('Stats error:', err);
    return res.status(500).json({ error: 'Failed to load stats.' });
  }
});

// Users list — includes uid, email, country, status
router.get('/users', requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, email, uid, coins, country, status,
              welcome_bonus_claimed, last_checkin, checkin_streak, created_at
       FROM users ORDER BY created_at DESC LIMIT 200`
    );
    return res.json({ users: result.rows });
  } catch (err) {
    console.error('Admin users error:', err);
    return res.status(500).json({ error: 'Failed to load users.' });
  }
});

// User transactions (offers + activity) for admin detail view
router.get('/users/:id/transactions', requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT id, amount, type, description, created_at
       FROM transactions WHERE user_id = $1
       ORDER BY created_at DESC LIMIT 100`,
      [id]
    );
    return res.json({ transactions: result.rows });
  } catch (err) {
    console.error('Admin user transactions error:', err);
    return res.status(500).json({ error: 'Failed to load transactions.' });
  }
});

router.get('/withdrawals', requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT w.id, w.amount, w.method, w.wallet_address, w.status, w.created_at,
             u.name, u.email, u.uid
      FROM withdrawals w
      JOIN users u ON w.user_id = u.id
      ORDER BY w.created_at DESC LIMIT 100
    `);
    return res.json({ withdrawals: result.rows });
  } catch (err) {
    console.error('Admin withdrawals error:', err);
    return res.status(500).json({ error: 'Failed to load withdrawals.' });
  }
});

router.patch('/withdrawals/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const allowed = ['pending', 'approved', 'rejected'];
  if (!allowed.includes(status))
    return res.status(400).json({ error: 'Invalid status.' });
  try {
    await pool.query('UPDATE withdrawals SET status = $1 WHERE id = $2', [status, id]);
    return res.json({ success: true });
  } catch (err) {
    console.error('Update withdrawal error:', err);
    return res.status(500).json({ error: 'Failed to update withdrawal.' });
  }
});

router.patch('/users/:id/coins', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { amount, reason } = req.body;
  if (!amount || isNaN(amount))
    return res.status(400).json({ error: 'Valid amount required.' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('UPDATE users SET coins = coins + $1 WHERE id = $2', [parseInt(amount), id]);
    await client.query(
      'INSERT INTO transactions (user_id, amount, type, description) VALUES ($1, $2, $3, $4)',
      [id, parseInt(amount), 'admin_adjustment', reason || 'Admin adjustment']
    );
    await client.query('COMMIT');
    return res.json({ success: true });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Admin coin adjust error:', err);
    return res.status(500).json({ error: 'Failed to adjust coins.' });
  } finally {
    client.release();
  }
});

// Postback logs — transactions of type 'postback_offer', newest first
router.get('/postback-logs', requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT t.id, t.user_id, t.amount, t.type, t.description, t.created_at,
             u.name, u.email, u.uid
      FROM transactions t
      JOIN users u ON t.user_id = u.id
      WHERE t.type = 'postback_offer'
      ORDER BY t.created_at DESC
      LIMIT 500
    `);
    return res.json({ logs: result.rows });
  } catch (err) {
    console.error('Admin postback logs error:', err);
    return res.status(500).json({ error: 'Failed to load postback logs.' });
  }
});

// ── Support Tickets ───────────────────────────────────────────────────────────
router.get('/tickets', requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT t.id, t.subject, t.status, t.created_at,
             u.name, u.email, u.uid,
             (SELECT COUNT(*) FROM ticket_replies WHERE ticket_id = t.id) AS reply_count
      FROM tickets t
      JOIN users u ON t.user_id = u.id
      ORDER BY t.created_at DESC LIMIT 200
    `);
    return res.json({ tickets: result.rows });
  } catch (err) {
    console.error('Admin tickets error:', err);
    return res.status(500).json({ error: 'Failed to load tickets.' });
  }
});

router.get('/tickets/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const [ticketResult, repliesResult] = await Promise.all([
      pool.query(
        `SELECT t.id, t.subject, t.message, t.status, t.created_at,
                u.name, u.email, u.uid
         FROM tickets t JOIN users u ON t.user_id = u.id WHERE t.id = $1`,
        [id]
      ),
      pool.query(
        `SELECT id, author_type, message, created_at
         FROM ticket_replies WHERE ticket_id = $1 ORDER BY created_at ASC`,
        [id]
      )
    ]);
    if (ticketResult.rows.length === 0) return res.status(404).json({ error: 'Ticket not found.' });
    return res.json({ ticket: ticketResult.rows[0], replies: repliesResult.rows });
  } catch (err) {
    console.error('Admin get ticket error:', err);
    return res.status(500).json({ error: 'Failed to load ticket.' });
  }
});

router.post('/tickets/:id/reply', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { message, status } = req.body;
  if (!message || !message.trim()) return res.status(400).json({ error: 'Reply message is required.' });
  const allowed = ['open', 'replied', 'closed'];
  const newStatus = allowed.includes(status) ? status : 'replied';
  try {
    await pool.query(
      `INSERT INTO ticket_replies (ticket_id, author_type, message) VALUES ($1, 'admin', $2)`,
      [id, message.trim()]
    );
    await pool.query(`UPDATE tickets SET status = $1 WHERE id = $2`, [newStatus, id]);
    return res.json({ success: true });
  } catch (err) {
    console.error('Admin reply ticket error:', err);
    return res.status(500).json({ error: 'Failed to send reply.' });
  }
});

router.patch('/tickets/:id/status', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const allowed = ['open', 'replied', 'closed'];
  if (!allowed.includes(status)) return res.status(400).json({ error: 'Invalid status.' });
  try {
    await pool.query(`UPDATE tickets SET status = $1 WHERE id = $2`, [status, id]);
    return res.json({ success: true });
  } catch (err) {
    console.error('Update ticket status error:', err);
    return res.status(500).json({ error: 'Failed to update status.' });
  }
});

// ── Offerwall Config ──────────────────────────────────────────────────────────
router.get('/offerwall-config', requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT network_id, name, url, enabled FROM offerwall_config ORDER BY id'
    );
    return res.json({ config: result.rows });
  } catch (err) {
    console.error('Offerwall config GET error:', err);
    return res.status(500).json({ error: 'Failed to load offerwall config.' });
  }
});

router.put('/offerwall-config', requireAdmin, async (req, res) => {
  const { config } = req.body;
  if (!Array.isArray(config))
    return res.status(400).json({ error: 'config must be an array.' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const entry of config) {
      const { network_id, url, enabled } = entry;
      if (!network_id) continue;
      await client.query(
        `UPDATE offerwall_config
         SET url = $1, enabled = $2, updated_at = NOW()
         WHERE network_id = $3`,
        [url || '', enabled !== false, network_id]
      );
    }
    await client.query('COMMIT');
    return res.json({ success: true });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Offerwall config PUT error:', err);
    return res.status(500).json({ error: 'Failed to save offerwall config.' });
  } finally {
    client.release();
  }
});

// Ban / unban user
router.patch('/users/:id/status', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (!['active', 'banned'].includes(status))
    return res.status(400).json({ error: 'Invalid status.' });
  try {
    await pool.query('UPDATE users SET status = $1 WHERE id = $2', [status, id]);
    return res.json({ success: true });
  } catch (err) {
    console.error('Ban/unban error:', err);
    return res.status(500).json({ error: 'Failed to update user status.' });
  }
});

module.exports = router;
