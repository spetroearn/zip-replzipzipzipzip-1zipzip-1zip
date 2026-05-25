const express = require('express');
const pool = require('../db');
const { requireAuth } = require('../middleware/auth');
const router = express.Router();

router.post('/', requireAuth, async (req, res) => {
  const { subject, message } = req.body;
  if (!subject || !message) return res.status(400).json({ error: 'Subject and message are required.' });
  if (subject.length > 120) return res.status(400).json({ error: 'Subject too long (max 120 chars).' });
  if (message.length > 2000) return res.status(400).json({ error: 'Message too long (max 2000 chars).' });
  try {
    const result = await pool.query(
      `INSERT INTO tickets (user_id, subject, message)
       VALUES ($1, $2, $3)
       RETURNING id, subject, message, status, created_at`,
      [req.session.userId, subject.trim(), message.trim()]
    );
    return res.json({ success: true, ticket: result.rows[0] });
  } catch (err) {
    console.error('Create ticket error:', err);
    return res.status(500).json({ error: 'Failed to create ticket.' });
  }
});

router.get('/my', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT t.id, t.subject, t.status, t.created_at,
              (SELECT COUNT(*) FROM ticket_replies WHERE ticket_id = t.id) AS reply_count
       FROM tickets t
       WHERE t.user_id = $1
       ORDER BY t.created_at DESC`,
      [req.session.userId]
    );
    return res.json({ tickets: result.rows });
  } catch (err) {
    console.error('Get tickets error:', err);
    return res.status(500).json({ error: 'Failed to load tickets.' });
  }
});

router.get('/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  try {
    const ticketResult = await pool.query(
      `SELECT id, subject, message, status, created_at
       FROM tickets WHERE id = $1 AND user_id = $2`,
      [id, req.session.userId]
    );
    if (ticketResult.rows.length === 0) return res.status(404).json({ error: 'Ticket not found.' });
    const repliesResult = await pool.query(
      `SELECT id, author_type, message, created_at
       FROM ticket_replies WHERE ticket_id = $1
       ORDER BY created_at ASC`,
      [id]
    );
    return res.json({ ticket: ticketResult.rows[0], replies: repliesResult.rows });
  } catch (err) {
    console.error('Get ticket detail error:', err);
    return res.status(500).json({ error: 'Failed to load ticket.' });
  }
});

module.exports = router;
