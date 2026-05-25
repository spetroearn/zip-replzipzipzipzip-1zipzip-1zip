const express = require('express');
const pool = require('../db');
const { requireAuth } = require('../middleware/auth');
const router = express.Router();

router.post('/claim/welcome', requireAuth, async (req, res) => {
  const userId = req.session.userId;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const userResult = await client.query(
      'SELECT id, coins, welcome_bonus_claimed FROM users WHERE id = $1 FOR UPDATE',
      [userId]
    );
    if (userResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'User not found.' });
    }
    const user = userResult.rows[0];
    if (user.welcome_bonus_claimed) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Welcome bonus already claimed.' });
    }
    const WELCOME_COINS = 20;
    await client.query(
      'UPDATE users SET coins = coins + $1, welcome_bonus_claimed = TRUE WHERE id = $2',
      [WELCOME_COINS, userId]
    );
    await client.query(
      'INSERT INTO transactions (user_id, amount, type, description) VALUES ($1, $2, $3, $4)',
      [userId, WELCOME_COINS, 'welcome_bonus', 'Welcome bonus reward']
    );
    await client.query('COMMIT');
    const updated = await pool.query('SELECT coins FROM users WHERE id = $1', [userId]);
    return res.json({ success: true, message: `Welcome! You earned ${WELCOME_COINS} coins!`, coins: updated.rows[0].coins });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Welcome claim error:', err);
    return res.status(500).json({ error: 'Failed to claim welcome bonus.' });
  } finally {
    client.release();
  }
});

router.post('/claim/daily', requireAuth, async (req, res) => {
  const userId = req.session.userId;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const userResult = await client.query(
      'SELECT id, coins, last_checkin, checkin_streak FROM users WHERE id = $1 FOR UPDATE',
      [userId]
    );
    if (userResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'User not found.' });
    }
    const user = userResult.rows[0];

    const today = new Date().toISOString().split('T')[0];
    let streak = user.checkin_streak || 0;

    if (user.last_checkin) {
      const lastCheckin = new Date(user.last_checkin).toISOString().split('T')[0];
      if (lastCheckin === today) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Daily check-in already claimed today. Come back tomorrow!', checkin_streak: streak });
      }
      // Check if yesterday - streak continues, otherwise reset
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      if (lastCheckin === yesterday) {
        streak = (streak % 7) + 1;
      } else {
        streak = 1;
      }
    } else {
      streak = 1;
    }

    const DAILY_COINS = 5;
    await client.query(
      'UPDATE users SET coins = coins + $1, last_checkin = CURRENT_DATE, checkin_streak = $2 WHERE id = $3',
      [DAILY_COINS, streak, userId]
    );
    await client.query(
      'INSERT INTO transactions (user_id, amount, type, description) VALUES ($1, $2, $3, $4)',
      [userId, DAILY_COINS, 'daily_checkin', `Daily check-in (Day ${streak})`]
    );
    await client.query('COMMIT');

    const updated = await pool.query('SELECT coins FROM users WHERE id = $1', [userId]);
    return res.json({
      success: true,
      message: `Day ${streak} check-in! +${DAILY_COINS} coins earned.`,
      coins: updated.rows[0].coins,
      checkin_streak: streak
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Daily checkin error:', err);
    return res.status(500).json({ error: 'Failed to claim daily check-in.' });
  } finally {
    client.release();
  }
});

router.post('/claim/xp3', requireAuth, async (req, res) => {
  const userId = req.session.userId;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      'UPDATE users SET coins = GREATEST(coins, 250) WHERE id = $1',
      [userId]
    );
    const updated = await client.query('SELECT coins FROM users WHERE id = $1', [userId]);
    await client.query('COMMIT');
    return res.json({ success: true, coins: updated.rows[0].coins });
  } catch (err) {
    await client.query('ROLLBACK');
    return res.status(500).json({ error: 'Failed.' });
  } finally {
    client.release();
  }
});

router.get('/history', requireAuth, async (req, res) => {
  const userId = req.session.userId;
  try {
    const result = await pool.query(
      'SELECT id, amount, type, description, created_at FROM transactions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
      [userId]
    );
    return res.json({ transactions: result.rows });
  } catch (err) {
    console.error('History error:', err);
    return res.status(500).json({ error: 'Failed to load history.' });
  }
});

module.exports = router;
