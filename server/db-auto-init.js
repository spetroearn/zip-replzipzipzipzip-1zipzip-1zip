const pool = require('./db');
const bcrypt = require('bcrypt');
const path = require('path');
const fs = require('fs');

const SCHEMA_SQL = `
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    coins INTEGER NOT NULL DEFAULT 0,
    welcome_bonus_claimed BOOLEAN NOT NULL DEFAULT FALSE,
    last_checkin DATE,
    uid VARCHAR(40) UNIQUE,
    avatar_seed INTEGER DEFAULT 1,
    country VARCHAR(100) DEFAULT 'Unknown',
    country_code VARCHAR(5) DEFAULT '',
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    checkin_streak INTEGER NOT NULL DEFAULT 0,
    google_id VARCHAR(255) UNIQUE,
    terms_accepted BOOLEAN NOT NULL DEFAULT FALSE,
    terms_accepted_at TIMESTAMP,
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    type VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS withdrawals (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    method VARCHAR(50) NOT NULL,
    wallet_address VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS admins (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS session (
    sid VARCHAR NOT NULL COLLATE "default",
    sess JSON NOT NULL,
    expire TIMESTAMP(6) NOT NULL,
    CONSTRAINT session_pkey PRIMARY KEY (sid)
  );

  CREATE INDEX IF NOT EXISTS IDX_session_expire ON session (expire);

  CREATE TABLE IF NOT EXISTS tickets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject VARCHAR(120) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'open',
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS ticket_replies (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    author_type VARCHAR(10) NOT NULL DEFAULT 'admin',
    message TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS offerwall_config (
    id SERIAL PRIMARY KEY,
    network_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    url TEXT NOT NULL DEFAULT '',
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS direct_offers (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    image_url TEXT NOT NULL DEFAULT '',
    tracking_link TEXT NOT NULL,
    points INTEGER NOT NULL DEFAULT 0,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
  );
`;

const OFFERWALL_NETWORKS = [
  { network_id: 'adjoe',    name: 'adjoe' },
  { network_id: 'revu',     name: 'Revu' },
  { network_id: 'offery',   name: 'Offery' },
  { network_id: 'ovnix',    name: 'Ovnix' },
  { network_id: 'adtowall', name: 'AdToWall' },
  { network_id: 'taskwall', name: 'TaskWall', url: 'https://wall.taskwall.io/?app_id=10889467703bb0ea255abfe901662a50&userid={USER_ID}' },
];

async function autoInit() {
  const client = await pool.connect();
  try {
    console.log('[DB] Running auto-init schema check...');

    await client.query(SCHEMA_SQL);

    for (const nw of OFFERWALL_NETWORKS) {
      await client.query(
        `INSERT INTO offerwall_config (network_id, name, url, enabled)
         VALUES ($1, $2, $3, true)
         ON CONFLICT (network_id) DO UPDATE
           SET url = EXCLUDED.url
           WHERE offerwall_config.url = ''`,
        [nw.network_id, nw.name, nw.url || '']
      );
    }

    const adminCheck = await client.query(
      'SELECT id FROM admins WHERE username = $1',
      ['admin']
    );
    if (adminCheck.rows.length === 0) {
      const hash = await bcrypt.hash('admin123', 12);
      await client.query(
        'INSERT INTO admins (username, password_hash) VALUES ($1, $2)',
        ['admin', hash]
      );
      console.log('[DB] Default admin account created (admin / admin123) — change this in production!');
    }

    const defaultOffers = [
      { title: 'Just Games [UK]',                    description: 'Register and complete 3 games to earn your reward!',              image: 'https://play-lh.googleusercontent.com/lpjvwbdxujZrDY3GIVA2JcJiyz7YeaOYK9ONV5OeiGR9EW0OKHa-CU6CRkI0RbFsCI3UOSzdxmbbk7zDVnjVRg=w512-h512-rw', link: 'https://www.adtogametrkk.com/FS6MH5T/2B2Q1SDT/', points: 2400 },
      { title: 'testerup [US/UK/CA]',                description: 'Register and test your first mobile app to earn your reward!',    image: 'https://play-lh.googleusercontent.com/CG3vTGUNaGhj2WqUWYZTSzWDrmjImnH-StVlCVFWMbyNWE9tK9HGj7vMSXUq0ZSCBvbw06apZJPsT24omg7ZSg=w512-h512-rw', link: 'https://www.adtogametrkk.com/FS6MH5T/2B2XKCC9/', points: 3000 },
      { title: 'JustPlay [US]',                      description: 'Install JustPlay and reach Level 5 in any game to earn your reward!', image: 'https://play-lh.googleusercontent.com/rCfVtIUrnY_YE0d5GNnRh8KOad-LBZUFt6gOPWR7c6QyXa28wXTmelrZpwd8gkXfAIoaCbwW4DdBZmguDLkg0w=w512-h512-rw', link: 'https://www.adtogametrkk.com/FS6MH5T/2B539C1D/', points: 1000 },
      { title: 'Rate: Home, Finance & Wellness [US]', description: 'Download the app and complete your first survey to earn your reward!', image: 'https://play-lh.googleusercontent.com/sbYhIWq96kE2DiAD2qtywGT1S468HCFfp0HbkgTi6jGNfAKInFDDQ360_dVlBYv7Ww=w512-h512-rw', link: 'https://www.adtogametrkk.com/FS6MH5T/29TSJCJQ/', points: 500 },
    ];
    for (const o of defaultOffers) {
      await client.query(
        `INSERT INTO direct_offers (title, description, image_url, tracking_link, points)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT DO NOTHING`,
        [o.title, o.description, o.image, o.link, o.points]
      );
    }

    console.log('[DB] Auto-init complete. All tables ready.');
  } catch (err) {
    console.error('[DB] Auto-init FAILED:', err.message);
    throw err;
  } finally {
    client.release();
  }
}

module.exports = autoInit;
