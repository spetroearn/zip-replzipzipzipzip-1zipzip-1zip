const express = require('express');
const pool = require('../db');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, title, description, image_url, tracking_link, points FROM direct_offers WHERE active = TRUE ORDER BY created_at DESC'
    );
    return res.json({ offers: result.rows });
  } catch (err) {
    console.error('Offers list error:', err);
    return res.status(500).json({ error: 'Failed to load offers.' });
  }
});

module.exports = router;
