const express = require('express');
const pool = require('../db');
const { requireAuth } = require('../middleware/auth');
const router = express.Router();

const MIN_WITHDRAWAL = 500;
const VALID_METHODS = ['visa', 'binance_usdt', 'litecoin', 'google_play'];

router.post('/', requireAuth, async (req, res) => {
  const userId = req.session.userId;
  const { amount, method, wallet_address } = req.body;
  if (!amount || !method || !wallet_address) {
    return res.status(400).json({ error: 'Amount, method, and destination are required.' });
  }
  if (!VALID_METHODS.includes(method)) {
    return res.status(400).json({ error: 'Invalid payment method.' });
  }
  const coins = parseInt(amount);
  if (isNaN(coins) || coins < MIN_WITHDRAWAL) {
    return res.status(400).json({ error: `Minimum withdrawal is ${MIN_WITHDRAWAL} coins.` });
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const userResult = await client.query(
      'SELECT coins, status FROM users WHERE id = $1 FOR UPDATE',
      [userId]
    );
    if (userResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'User not found.' });
    }
    const user = userResult.rows[0];
    if (user.status === 'banned') {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'Account suspended.' });
    }
    if (user.coins < coins) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Insufficient coins.' });
    }
    await client.query('UPDATE users SET coins = coins - $1 WHERE id = $2', [coins, userId]);
    await client.query(
      'INSERT INTO withdrawals (user_id, amount, method, wallet_address) VALUES ($1, $2, $3, $4)',
      [userId, coins, method, wallet_address]
    );
    await client.query(
      'INSERT INTO transactions (user_id, amount, type, description) VALUES ($1, $2, $3, $4)',
      [userId, -coins, 'withdrawal', `Withdrawal via ${method}`]
    );
    await client.query('COMMIT');
    const updated = await pool.query('SELECT coins FROM users WHERE id = $1', [userId]);
    return res.json({
      success: true,
      message: 'Withdrawal request submitted. Pending review within 24-48 hours.',
      coins: updated.rows[0].coins
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Withdrawal error:', err);
    return res.status(500).json({ error: 'Failed to process withdrawal.' });
  } finally {
    client.release();
  }
});

router.get('/my', requireAuth, async (req, res) => {
  const userId = req.session.userId;
  try {
    const result = await pool.query(
      'SELECT id, amount, method, wallet_address, status, created_at FROM withdrawals WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    return res.json({ withdrawals: result.rows });
  } catch (err) {
    console.error('My withdrawals error:', err);
    return res.status(500).json({ error: 'Failed to load withdrawals.' });
  }
});

module.exports = router;
