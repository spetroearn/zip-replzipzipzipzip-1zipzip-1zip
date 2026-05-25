# Spetro Earn

A secure server-side reward platform where users earn coins by completing offers, daily check-ins, and welcome bonuses. Coin balances are stored server-side in PostgreSQL to prevent client-side tampering (Lucky Patcher, etc.).

## Architecture

- **Backend**: Node.js + Express.js (server/index.js)
- **Frontend**: React + Vite (client/)
- **Database**: PostgreSQL (Replit managed)
- **Auth**: express-session with PostgreSQL session store
- **Packaging**: Capacitor (for APK wrapping)

## Project Structure

```
server/
  index.js          - Express server entry point
  db.js             - PostgreSQL pool connection
  db-init.js        - Schema creation & default admin setup
  middleware/
    auth.js         - requireAuth / requireAdmin middleware
  routes/
    auth.js         - /api/auth/* (register, login, logout, me)
    coins.js        - /api/coins/* (welcome bonus, daily check-in, history)
    offerwalls.js   - /api/offerwalls/* (Adjoy, Revu, Offery, Ovnix callbacks)
    admin.js        - /api/admin/* (admin login, users, withdrawals, stats)
    withdraw.js     - /api/withdraw/* (submit, my withdrawals)
client/
  src/
    App.jsx         - Main router (user app + admin panel)
    api.js          - API client (fetch wrapper)
    pages/          - Login, Register, Dashboard, Profile, Offerwalls, Withdraw
    pages/admin/    - AdminLogin, AdminDashboard
    components/     - Toast, BottomNav
```

## Default Admin Credentials

- Username: `admin`
- Password: `admin123`
- **Change this immediately in production.**

## Environment Variables / Secrets Required

| Key | Description |
|-----|-------------|
| `DATABASE_URL` | Auto-set by Replit PostgreSQL |
| `SESSION_SECRET` | Strong random string for session signing |
| `ADJOY_SECRET` | Adjoy offerwall HMAC secret |
| `REVU_SECRET` | Revu offerwall HMAC secret |
| `OFFERY_SECRET` | Offery offerwall HMAC secret |
| `OVNIX_SECRET` | Ovnix offerwall HMAC secret |
| `TOROX_SECRET` | Torox offerwall HMAC secret |
| `MYCHIPS_SECRET` | MyChips offerwall HMAC secret |

## Key Security Features

- All coin balances stored server-side only (tamper-proof)
- HMAC-SHA256 verification for all offerwall callbacks
- bcrypt password hashing (cost factor 12)
- PostgreSQL-backed sessions (httpOnly cookie)
- Transaction-locked coin updates (prevents race conditions)

## User Preferences

- All interfaces and code strictly in English
- Mobile-first design (480px max width for app screens)
- No mocked data — all data from real PostgreSQL queries
