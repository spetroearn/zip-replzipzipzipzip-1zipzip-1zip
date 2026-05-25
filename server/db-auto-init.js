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
`;

const OFFERWALL_NETWORKS = [
  { network_id: 'adjoe',    name: 'adjoe' },
  { network_id: 'revu',     name: 'Revu' },
  { network_id: 'offery',   name: 'Offery' },
  { network_id: 'ovnix',    name: 'Ovnix' },
  { network_id: 'adtowall', name: 'AdToWall' },
  { network_id: 'taskwall', name: 'TaskWall' },
];

async function autoInit() {
  const client = await pool.connect();
  try {
    console.log('[DB] Running auto-init schema check...');

    await client.query(SCHEMA_SQL);

    for (const nw of OFFERWALL_NETWORKS) {
      await client.query(
        `INSERT INTO offerwall_config (network_id, name, url, enabled)
         VALUES ($1, $2, '', true)
         ON CONFLICT (network_id) DO NOTHING`,
        [nw.network_id, nw.name]
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

    console.log('[DB] Auto-init complete. All tables ready.');
  } catch (err) {
    console.error('[DB] Auto-init FAILED:', err.message);
    throw err;
  } finally {
    client.release();
  }
}

module.exports = autoInit;
