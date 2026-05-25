# Spetro Earn

A server-side reward platform where users earn coins by completing offerwall tasks, daily check-ins, and welcome bonuses. All coin balances are stored in PostgreSQL — never on the client — making them immune to tampering tools like Lucky Patcher.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js 20 + Express.js |
| Frontend | React 18 + Vite (pre-built into `server/public/`) |
| Database | PostgreSQL (Replit-managed or any PG-compatible host) |
| Sessions | express-session + connect-pg-simple (DB-backed) |
| Auth | Username/password (bcrypt) + Google OAuth 2.0 |
| Mobile | Capacitor 6 + custom Android WebView bridge |

---

## Repository Structure

```
/
├── server/                         # Node.js backend
│   ├── index.js                    # Entry point — middleware, route registration, static serving
│   ├── db.js                       # PostgreSQL pool (reads DATABASE_URL)
│   ├── db-init.js                  # Schema creation + default admin seed
│   ├── middleware/
│   │   ├── auth.js                 # requireAuth / requireAdmin guards
│   │   └── vpnCheck.js             # blockVPN middleware (proxycheck.io)
│   └── routes/
│       ├── auth.js                 # /api/auth/*
│       ├── coins.js                # /api/coins/*
│       ├── withdraw.js             # /api/withdraw/*
│       ├── tickets.js              # /api/tickets/*
│       ├── admin.js                # /api/admin/*
│       ├── offerwalls.js           # /api/offerwalls/* — all 6 network postbacks
│       └── postback.js             # /api/postback/* — Adjoe event + generic handler
│
├── client/                         # React + Vite frontend (source)
│   └── src/
│       ├── App.jsx                 # Top-level router
│       ├── api.js                  # Fetch wrapper for all API calls
│       ├── pages/
│       │   ├── Dashboard.jsx
│       │   ├── Login.jsx
│       │   ├── Register.jsx
│       │   ├── Profile.jsx
│       │   ├── Offerwalls.jsx      # Earn tab — AndroidBridge wiring for Adjoe APK
│       │   ├── Withdraw.jsx
│       │   ├── ResetPassword.jsx
│       │   ├── Support.jsx
│       │   └── admin/
│       │       ├── AdminLogin.jsx
│       │       └── AdminDashboard.jsx
│       └── components/
│           ├── BottomNav.jsx
│           ├── Icons.jsx
│           └── Toast.jsx
│
├── android-bridge/                 # Android WebView bridge (copy into Android Studio project)
│   ├── AndroidBridge.java          # JavascriptInterface — exposes window.AndroidBridge to JS
│   ├── MainActivity.java           # Extends BridgeActivity, injects AndroidBridge into WebView
│   ├── strings.xml                 # App name resource
│   ├── build_gradle_additions.txt  # Adjoe Maven repo, minSdk, signing config snippets
│   └── AndroidManifest_additions.txt # Required permissions (INTERNET, AD_ID, etc.)
│
├── scripts/
│   ├── setup-android.sh            # One-shot local APK build (requires Java 17 + Android Studio)
│   └── sync-only.sh                # Re-sync Capacitor without full setup
│
├── capacitor.config.json           # Capacitor — appId: com.spetro.earn, webDir: server/public
├── package.json                    # npm scripts (see below)
└── README.md                       # This file
```

---

## API Route Reference

### Auth — `/api/auth/`
| Method | Path | Description |
|---|---|---|
| POST | `/register` | Create account |
| POST | `/login` | Login with username + password |
| POST | `/logout` | Destroy session |
| GET | `/me` | Current session user |
| GET | `/vpn-check` | VPN/proxy detection |
| GET | `/google` | Start Google OAuth flow |
| GET | `/google/callback` | Google OAuth callback |
| POST | `/forgot-password` | Send password reset email |
| POST | `/reset-password` | Apply reset token |
| POST | `/push-subscribe` | Save push notification subscription |

### Coins — `/api/coins/`
| Method | Path | Description |
|---|---|---|
| POST | `/claim/welcome` | One-time welcome bonus |
| POST | `/claim/daily` | Daily check-in reward |
| GET | `/history` | Transaction history |

### Withdraw — `/api/withdraw/`
| Method | Path | Description |
|---|---|---|
| POST | `/` | Submit withdrawal request |
| GET | `/my` | User's own withdrawal history |

### Support Tickets — `/api/tickets/`
| Method | Path | Description |
|---|---|---|
| POST | `/` | Open new ticket |
| GET | `/my` | User's ticket list |
| GET | `/:id` | Ticket detail + replies |

### Admin — `/api/admin/`
| Method | Path | Description |
|---|---|---|
| POST | `/login` | Admin login |
| POST | `/logout` | Admin logout |
| GET | `/me` | Admin session check |
| GET | `/stats` | Platform statistics |
| GET | `/users` | All users |
| GET | `/users/:id/transactions` | User transaction history |
| PATCH | `/users/:id/coins` | Manually adjust coins |
| PATCH | `/users/:id/status` | Ban / unban user |
| GET | `/withdrawals` | All withdrawal requests |
| PATCH | `/withdrawals/:id` | Approve or reject withdrawal |
| GET | `/postback-logs` | Offerwall callback log viewer |
| GET | `/tickets` | All support tickets |
| GET | `/tickets/:id` | Ticket detail |
| POST | `/tickets/:id/reply` | Admin reply |
| PATCH | `/tickets/:id/status` | Open / close ticket |

### Offerwall Postbacks — `/api/offerwalls/`
| Method | Path | Network | Verification |
|---|---|---|---|
| POST | `/adjoy/callback` | Adjoy | HMAC-SHA256 (`ADJOY_SECRET`) |
| POST | `/revu/callback` | RevU | HMAC-SHA256 (`REVU_SECRET`) |
| POST | `/offery/callback` | Offery | HMAC-SHA256 (`OFFERY_SECRET`) |
| POST | `/ovnix/callback` | Ovnix | HMAC-SHA256 (`OVNIX_SECRET`) |
| POST | `/adtowall/callback` | AdToWall | HMAC-SHA256 (`ADTOWALL_SECRET`) |
| POST | `/taskwall/callback` | TaskWall | HMAC-SHA256 (`TASKWALL_SECRET`) |

### Adjoe Event Postback — `/api/postback/`
| Method | Path | Description |
|---|---|---|
| POST | `/adjoe` | Adjoe SDK event (subId, currency, adjoe_signature) |
| GET/POST | `/` | Generic signed postback (`POSTBACK_SECRET`) |

---

## Database Schema

All tables are auto-created on first run by `server/db-init.js`.

| Table | Key Columns |
|---|---|
| `users` | `id`, `name`, `email`, `password_hash`, `coins`, `uid`, `status`, `google_id`, `checkin_streak`, `last_checkin`, `welcome_bonus_claimed`, `country`, `avatar_seed`, `password_reset_token`, `password_reset_expires` |
| `transactions` | `id`, `user_id`, `amount`, `type`, `description`, `created_at` |
| `withdrawals` | `id`, `user_id`, `amount`, `method`, `wallet_address`, `status`, `created_at` |
| `admins` | `id`, `username`, `password_hash`, `created_at` |
| `session` | `sid`, `sess`, `expire` (connect-pg-simple managed) |
| `tickets` | `id`, `user_id`, `subject`, `message`, `status`, `created_at` |
| `ticket_replies` | `id`, `ticket_id`, `author_type`, `message`, `created_at` |

---

## Environment Variables

Set all of these before starting the server. On Replit, use the Secrets panel. On a VPS, use a `.env` file (never commit it).

### Required — app will not start without these

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string — auto-set by Replit, or `postgres://user:pass@host:5432/dbname` |
| `SESSION_SECRET` | Long random string for signing session cookies (min 32 chars) |

### Required for Google OAuth

| Variable | Description |
|---|---|
| `GOOGLE_CLIENT_ID` | From Google Cloud Console → OAuth 2.0 Credentials |
| `GOOGLE_CLIENT_SECRET` | Same as above |
| `APP_URL` | Your public base URL, e.g. `https://spetro.orihost.com` — used for OAuth callback |

### Required for offerwall postback verification (one per network)

| Variable | Network |
|---|---|
| `ADJOY_SECRET` | Adjoy |
| `REVU_SECRET` | RevU |
| `OFFERY_SECRET` | Offery |
| `OVNIX_SECRET` | Ovnix |
| `ADTOWALL_SECRET` | AdToWall |
| `TASKWALL_SECRET` | TaskWall |
| `ADJOE_SECRET_KEY` | Adjoe SDK event postback |
| `POSTBACK_SECRET` | Generic postback endpoint |

### Optional

| Variable | Description | Default |
|---|---|---|
| `PORT` | HTTP port | `5000` |
| `NODE_ENV` | Set to `production` to enable SSL for DB | — |
| `PROXYCHECK_KEY` | proxycheck.io API key for VPN detection | — |
| `EMAIL_HOST` | SMTP host for password reset emails | — |
| `EMAIL_PORT` | SMTP port | — |
| `EMAIL_SECURE` | `true` for port 465 | — |
| `EMAIL_USER` | SMTP username | — |
| `EMAIL_PASS` | SMTP password | — |
| `EMAIL_FROM` | From address, e.g. `noreply@spetro.com` | — |

---

## npm Scripts

```bash
npm start           # Start the Express server (production)
npm run build       # Build React → server/public/ (MUST run before deploying frontend changes)
npm run dev         # Start server + Vite dev server in parallel (local development)
npm run db:init     # Manually run schema creation + admin seed
npm run cap:sync    # Build frontend then sync into Android project (Capacitor)
npm run cap:open    # Open Android Studio with the project
npm run apk:setup   # Full automated APK build (requires local Java 17 + Android SDK)
npm run apk:sync    # Re-sync Capacitor only (skips full setup)
```

> **Important:** The server always serves the pre-built bundle from `server/public/`. After any frontend change run `npm run build` and restart the server.

---

## Android APK (Capacitor)

The mobile APK wraps the web app in a WebView using Capacitor. A custom `AndroidBridge` class exposes native Android functionality to JavaScript.

### Key files

| File | What it does |
|---|---|
| `capacitor.config.json` | App ID, web directory, scheme settings |
| `android-bridge/AndroidBridge.java` | `@JavascriptInterface` — gives JS access to `window.AndroidBridge` |
| `android-bridge/MainActivity.java` | Injects `AndroidBridge` into the WebView on startup |
| `android-bridge/build_gradle_additions.txt` | Gradle snippets to add Adjoe SDK dependency |
| `android-bridge/AndroidManifest_additions.txt` | Permissions required by Adjoe SDK |
| `scripts/setup-android.sh` | Automated local build script |

### JavaScript bridge API (available in APK only)

```js
window.AndroidBridge.isNativeApp()              // → "true"
window.AndroidBridge.setUserId(userId)          // Persist Spetro user ID to native
window.AndroidBridge.startAdjoeSDK(userId, appHash) // Init Adjoe SDK
window.AndroidBridge.openAdjoeOfferwalls()      // Launch Adjoe UI
window.AndroidBridge.getDeviceInfo()            // → JSON string {model, os, version}
window.AndroidBridge.showToast(message)         // Native Android toast
window.AndroidBridge.vibrate(ms)                // Vibrate device
```

### Building the APK locally

1. Install Java 17+ and Android Studio with SDK Platform 33+
2. Set `ANDROID_HOME` environment variable
3. Run: `bash scripts/setup-android.sh`
4. Output: `android/app/build/outputs/apk/debug/app-debug.apk`

---

## Deploying to a VPS (Orihost or similar)

```bash
# 1. Clone the repo
git clone <repo-url> spetro-earn && cd spetro-earn

# 2. Install dependencies
npm install

# 3. Set environment variables (create .env or use systemd EnvironmentFile)
cp .env.example .env   # edit values

# 4. Initialize the database
npm run db:init

# 5. Build the frontend
npm run build

# 6. Start the server (use PM2 or systemd for production)
pm2 start server/index.js --name spetro-earn

# 7. Reverse proxy with Nginx → port 5000
```

For HTTPS, set `NODE_ENV=production`. The PostgreSQL client will then enforce SSL.

---

## Default Admin Credentials

Username: `admin`  
Password: `admin123`  

**Change these immediately after first deployment via the Admin Dashboard.**

---

## Security Notes

- Coin balances are only ever mutated server-side inside PostgreSQL transactions — no client value is trusted
- All offerwall postbacks are verified with HMAC-SHA256 before any coins are credited
- Sessions use `httpOnly`, `sameSite: lax` cookies backed by the PostgreSQL session table
- Passwords are hashed with bcrypt (cost factor 12)
- VPN/proxy detection is applied to offerwall access to reduce fraud
