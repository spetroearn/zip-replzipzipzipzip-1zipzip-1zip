================================================================================
  SPETRO EARN — MIGRATION GUIDE
  Prepared for account transfer / ZIP migration
  Date: May 2026
================================================================================

  Read this file top to bottom before starting anything.
  Every section tells you exactly what exists, where it lives, and what you
  need to fill in to get the project running on a fresh Replit account.

================================================================================
  TABLE OF CONTENTS
================================================================================

  1.  Project Overview
  2.  Tech Stack & Runtime
  3.  Directory Structure
  4.  How to Run the Project
  5.  Required Environment Variables (.env / Replit Secrets)
  6.  Database Setup
  7.  Google OAuth — Redirect URI Setup
  8.  IP / VPN & Risk Check Middleware
  9.  Offerwall Postback Routes
  10. Password Reset Flow
  11. Admin Panel
  12. Support Ticket System
  13. Frontend Build Process
  14. Session & Cookie Configuration
  15. Default Credentials (Change Immediately)
  16. Summary of All Major Changes Made

================================================================================
  1. PROJECT OVERVIEW
================================================================================

  Spetro Earn is a secure server-side reward platform. Users earn Spetro Coins
  (SC) by completing offerwall tasks, daily check-ins, and welcome bonuses.
  All balances are stored exclusively in PostgreSQL — never on the client —
  making them immune to tools like Lucky Patcher or any client-side tampering.

  Exchange rate:   1,000 SC = $1.00 USD
  Min withdrawal:  500 SC ($0.50)

================================================================================
  2. TECH STACK & RUNTIME
================================================================================

  Backend  : Node.js + Express.js
  Frontend : React 18 + Vite (pre-built — served as static files)
  Database : PostgreSQL (Replit managed via DATABASE_URL)
  Auth     : express-session + connect-pg-simple (PostgreSQL session store)
  OAtuh    : passport-google-oauth20
  Email    : nodemailer (SMTP — optional, for password reset emails)
  VPN Check: ProxyCheck.io REST API (no SDK needed)
  Packaging: Capacitor-compatible (wrap with npx cap for APK)

================================================================================
  3. DIRECTORY STRUCTURE
================================================================================

  /
  ├── server/
  │   ├── index.js              Entry point. Mounts all routes. Starts server.
  │   ├── db.js                 PostgreSQL pool (uses DATABASE_URL env var)
  │   ├── db-init.js            Schema creation + default admin insert on boot
  │   ├── middleware/
  │   │   ├── auth.js           requireAuth / requireAdmin middleware
  │   │   └── vpnCheck.js       IP/VPN/Risk check via ProxyCheck.io
  │   └── routes/
  │       ├── auth.js           /api/auth/*  (register, login, logout, Google OAuth,
  │       │                                   forgot-password, reset-password)
  │       ├── coins.js          /api/coins/* (welcome bonus, daily check-in, history)
  │       ├── offerwalls.js     /api/offerwalls/* (Adjoe, RevU, Offery, Ovnix postbacks)
  │       ├── admin.js          /api/admin/* (admin login, users, withdrawals, stats,
  │       │                                   support tickets management)
  │       ├── withdraw.js       /api/withdraw/* (submit withdrawal, my withdrawals)
  │       ├── tickets.js        /api/tickets/* (user support ticket CRUD)
  │       └── postback.js       /api/postback/* (additional postback handler)
  │
  ├── client/                   React + Vite frontend source
  │   ├── src/
  │   │   ├── App.jsx           Main router (user app + admin panel + reset flow)
  │   │   ├── api.js            Fetch wrapper for all API calls
  │   │   ├── pages/
  │   │   │   ├── Login.jsx         Sign-in page (email + Google + forgot password)
  │   │   │   ├── Register.jsx      Registration with ToS checkbox enforcement
  │   │   │   ├── Dashboard.jsx     Home screen (balance, check-in, welcome bonus)
  │   │   │   ├── Offerwalls.jsx    Earn tab (all offerwall cards)
  │   │   │   ├── Withdraw.jsx      Withdrawal request form
  │   │   │   ├── Profile.jsx       User profile + embedded support section
  │   │   │   ├── Support.jsx       Support ticket component (used inside Profile)
  │   │   │   ├── ResetPassword.jsx Password reset page (shown via ?reset_token= URL)
  │   │   │   └── admin/
  │   │   │       ├── AdminLogin.jsx
  │   │   │       └── AdminDashboard.jsx
  │   │   └── components/
  │   │       ├── BottomNav.jsx     4-tab bottom navigation (Home/Earn/Withdraw/Profile)
  │   │       ├── Toast.jsx         Toast notification system
  │   │       └── Icons.jsx         All SVG icon exports
  │   └── package.json
  │
  ├── server/public/            Pre-built React bundle (DO NOT edit manually)
  │   └── assets/               Generated by `npm run build` in /client
  │
  ├── package.json              Root package.json (server dependencies)
  ├── .env                      Environment variables (create this — see Section 5)
  └── README_MIGRATION.txt      This file

================================================================================
  4. HOW TO RUN THE PROJECT
================================================================================

  Step 1 — Install server dependencies:
    npm install

  Step 2 — Install client dependencies and build the frontend:
    cd client && npm install && npm run build && cd ..

  Step 3 — Set all environment variables (see Section 5 below).

  Step 4 — Start the server:
    node server/index.js

  The server listens on port 5000 (or process.env.PORT).
  It serves the pre-built React frontend from server/public/.

  On Replit: use the "Start application" workflow with command:
    node server/index.js

  IMPORTANT: Any time you change frontend code, you MUST:
    1. Run: cd client && npm run build
    2. Restart the server/workflow

================================================================================
  5. REQUIRED ENVIRONMENT VARIABLES (.env / REPLIT SECRETS)
================================================================================

  On Replit, set these in the "Secrets" panel (padlock icon), NOT in a .env file.
  On other platforms, create a .env file in the root directory.

  ┌─────────────────────────────┬────────────────────────────────────────────────┐
  │ Variable Name               │ Description & Where to Get It                  │
  ├─────────────────────────────┼────────────────────────────────────────────────┤
  │ DATABASE_URL                │ PostgreSQL connection string.                   │
  │                             │ Auto-provided by Replit PostgreSQL add-on.      │
  │                             │ On other platforms: postgres://user:pass@...    │
  ├─────────────────────────────┼────────────────────────────────────────────────┤
  │ SESSION_SECRET              │ Random secret string for signing session cookies│
  │                             │ Use any long random string (32+ characters).    │
  │                             │ Example: openssl rand -base64 32                │
  ├─────────────────────────────┼────────────────────────────────────────────────┤
  │ GOOGLE_CLIENT_ID            │ From Google Cloud Console → Credentials         │
  │                             │ → OAuth 2.0 Client ID                           │
  ├─────────────────────────────┼────────────────────────────────────────────────┤
  │ GOOGLE_CLIENT_SECRET        │ Same location as GOOGLE_CLIENT_ID above.        │
  ├─────────────────────────────┼────────────────────────────────────────────────┤
  │ ADJOY_SECRET                │ HMAC secret from your Adjoe dashboard.          │
  │                             │ Used to verify postback signatures from Adjoe.  │
  ├─────────────────────────────┼────────────────────────────────────────────────┤
  │ REVU_SECRET                 │ HMAC secret from your RevU dashboard.           │
  ├─────────────────────────────┼────────────────────────────────────────────────┤
  │ OFFERY_SECRET               │ HMAC secret from your Offery dashboard.         │
  ├─────────────────────────────┼────────────────────────────────────────────────┤
  │ OVNIX_SECRET                │ HMAC secret from your Ovnix dashboard.          │
  ├─────────────────────────────┼────────────────────────────────────────────────┤
  │ PROXYCHECK_KEY              │ (Optional but recommended)                      │
  │                             │ Free API key from https://proxycheck.io         │
  │                             │ Without key: 100 IP lookups/day limit.          │
  │                             │ With free key: 1,000 lookups/day.               │
  ├─────────────────────────────┼────────────────────────────────────────────────┤
  │ APP_URL                     │ (Optional) Your public app URL.                 │
  │                             │ Used to build password reset email links.       │
  │                             │ Example: https://spetro-earn.replit.app         │
  │                             │ If unset, auto-detected from request host.      │
  ├─────────────────────────────┼────────────────────────────────────────────────┤
  │ EMAIL_HOST                  │ (Optional) SMTP host for password reset emails. │
  │                             │ Example: smtp.gmail.com                         │
  │                             │ If not set, reset links are logged to console.  │
  ├─────────────────────────────┼────────────────────────────────────────────────┤
  │ EMAIL_PORT                  │ (Optional) SMTP port. Default: 587              │
  ├─────────────────────────────┼────────────────────────────────────────────────┤
  │ EMAIL_USER                  │ (Optional) SMTP username / email address.       │
  ├─────────────────────────────┼────────────────────────────────────────────────┤
  │ EMAIL_PASS                  │ (Optional) SMTP password or app password.       │
  ├─────────────────────────────┼────────────────────────────────────────────────┤
  │ EMAIL_FROM                  │ (Optional) "From" address in reset emails.      │
  │                             │ Example: noreply@spetro.app                     │
  │                             │ Defaults to EMAIL_USER if not set.              │
  └─────────────────────────────┴────────────────────────────────────────────────┘

  MINIMUM REQUIRED TO RUN (without Google Auth or email):
    DATABASE_URL, SESSION_SECRET

  MINIMUM FOR FULL FUNCTIONALITY:
    DATABASE_URL, SESSION_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET,
    ADJOY_SECRET, REVU_SECRET, OFFERY_SECRET, OVNIX_SECRET, PROXYCHECK_KEY

================================================================================
  6. DATABASE SETUP
================================================================================

  The database schema is created automatically on server start via db-init.js.
  You do NOT need to run any migration scripts manually.

  On first boot, db-init.js will:
    - Create all required tables (users, transactions, session, withdrawals,
      support_tickets, support_replies)
    - Insert the default admin account (see Section 15)

  Tables created:
    users              — All user accounts, coins, session data, reset tokens
    transactions       — Full coin credit/debit history per user
    session            — PostgreSQL-backed session store (connect-pg-simple)
    withdrawals        — Withdrawal requests and their statuses
    support_tickets    — User support tickets
    support_replies    — Admin and user replies on tickets

  If migrating an existing database, the scripts use IF NOT EXISTS and
  ALTER TABLE ... ADD COLUMN IF NOT EXISTS — so re-running is always safe.

================================================================================
  7. GOOGLE OAUTH — REDIRECT URI SETUP
================================================================================

  The Google OAuth callback is handled at:
    GET /api/auth/google/callback

  FULL URI YOU MUST REGISTER IN GOOGLE CLOUD CONSOLE:
    https://<YOUR-NEW-REPLIT-DOMAIN>/api/auth/google/callback

  Steps:
    1. Go to https://console.cloud.google.com
    2. Select your project (or create one)
    3. Navigate to: APIs & Services → Credentials
    4. Click your OAuth 2.0 Client ID
    5. Under "Authorized redirect URIs", click "+ ADD URI"
    6. Add: https://<your-new-replit-domain>/api/auth/google/callback
    7. Also add your production .replit.app domain when you deploy:
       https://<your-app-name>.replit.app/api/auth/google/callback
    8. Save

  The server prints the correct redirect URI to the console on every startup.
  Check the console/workflow logs after starting the server — it will show
  the exact URL you need to register.

  Previous registered URI (old account — no longer valid after migration):
    https://b75bb238-04ff-4880-a1eb-00893f361637-00-21ztsb88cgc5v.sisko.replit.dev
      /api/auth/google/callback

  Flow:
    GET  /api/auth/google           → Redirects to Google consent screen
    GET  /api/auth/google/callback  → Google redirects here after user consents
                                      Creates or logs in the user, sets session,
                                      redirects to / on success
    Code location: server/routes/auth.js

================================================================================
  8. IP / VPN & RISK CHECK MIDDLEWARE
================================================================================

  File: server/middleware/vpnCheck.js

  What it does:
    Every request to sensitive endpoints is checked against ProxyCheck.io.
    If the user's IP is a VPN, proxy, Tor exit node, or has a high fraud
    risk score, they are blocked from accessing offerwall content.

  Provider: ProxyCheck.io (https://proxycheck.io)
    - Free tier:  100 IP lookups/day (no API key required)
    - Free key:   1,000 lookups/day (sign up at proxycheck.io, set PROXYCHECK_KEY)
    - Paid plans: higher limits for production traffic

  Current risk threshold: 8 (out of 100)
    - A user is BLOCKED if: isVpn === true  OR  riskScore > 8
    - To make the check more lenient, raise the threshold in vpnCheck.js:
        const RISK_THRESHOLD = 8;  ← change this value

  In-memory cache:
    - Results are cached per IP address for 15 minutes
    - Prevents hitting the API rate limit on repeated requests
    - Cache is in-memory only — it resets on every server restart

  Local / private IPs always pass through (never blocked):
    - 127.0.0.1, ::1, 10.x.x.x, 192.168.x.x, 172.x.x.x

  Exported functions:
    checkIP(ip)        → Returns { isVpn, riskScore, blocked, country, countryCode }
    blockVPN           → Express middleware — use as: router.post('/route', blockVPN, handler)

  Where it is applied:
    - GET  /api/auth/vpn-check  → Used by the frontend Earn tab to check before
                                   showing offerwall content (client-side gate)
    - POST /api/auth/login      → Applied on login to block VPN users at sign-in
    - POST /api/auth/register   → Applied on registration

  What happens on block:
    - Backend returns: HTTP 403 + JSON { error: "Access Restricted: ..." }
    - Frontend shows a full-screen overlay with the reason (VPN or high risk score)
    - Users are prompted to disable VPN and try again

================================================================================
  9. OFFERWALL POSTBACK ROUTES
================================================================================

  File: server/routes/offerwalls.js
  Mounted at: /api/offerwalls/  (see server/index.js line: app.use('/api/offerwalls', ...))

  All postbacks use HMAC-SHA256 signature verification to prevent fraud.
  Payload format (same for all networks): "${user_id}:${coins}:${offer_id}"
  Signature must match: HMAC-SHA256(secret, payload) in hex

  ┌──────────────────────────────────────────────────────────────────────────────┐
  │  NETWORK   │  POSTBACK URL                          │  ENV VAR REQUIRED     │
  ├────────────┼────────────────────────────────────────┼───────────────────────┤
  │  Adjoe     │  POST /api/offerwalls/adjoy/callback   │  ADJOY_SECRET         │
  │  RevU      │  POST /api/offerwalls/revu/callback    │  REVU_SECRET          │
  │  Offery    │  POST /api/offerwalls/offery/callback  │  OFFERY_SECRET        │
  │  Ovnix     │  POST /api/offerwalls/ovnix/callback   │  OVNIX_SECRET         │
  └────────────┴────────────────────────────────────────┴───────────────────────┘

  Expected POST body (JSON or form-encoded) for each:
    user_id    — Spetro user ID (integer, stored in users.id)
    coins      — Amount of Spetro Coins to credit (integer)
    offer_id   — Offer identifier string from the network
    signature  — HMAC-SHA256 of "${user_id}:${coins}:${offer_id}" using the secret

  On valid request:
    - Adds coins to user's balance (atomic DB transaction, race-condition safe)
    - Inserts a record into the transactions table
    - Returns HTTP 200 "OK"

  On invalid signature: HTTP 403 "Invalid signature"
  On missing secret env var: HTTP 500 "SECRET not configured"

  IMPORTANT — AdToWall & TaskWall:
    These two networks currently have FRONTEND CARDS ONLY on the Earn page.
    Their backend postback routes have not been implemented yet.
    You will need to add two new routes in server/routes/offerwalls.js:
      POST /api/offerwalls/adtowall/callback  (needs ADTOWALL_SECRET env var)
      POST /api/offerwalls/taskwall/callback  (needs TASKWALL_SECRET env var)
    Follow the exact same pattern as the existing 4 routes above.

  Configure these postback URLs in each offerwall network's dashboard:
    https://<your-domain>/api/offerwalls/adjoy/callback
    https://<your-domain>/api/offerwalls/revu/callback
    https://<your-domain>/api/offerwalls/offery/callback
    https://<your-domain>/api/offerwalls/ovnix/callback

================================================================================
  10. PASSWORD RESET FLOW
================================================================================

  Files:
    Backend:  server/routes/auth.js  (forgot-password and reset-password routes)
    Frontend: client/src/pages/ResetPassword.jsx
              client/src/pages/Login.jsx  (Forgot password? link)

  How it works:
    1. User clicks "Forgot password?" on the login page
    2. Enters their email — POST /api/auth/forgot-password
    3. Server generates a secure 32-byte random token (crypto.randomBytes)
    4. Stores SHA-256 hash of the token in users.password_reset_token
    5. Stores expiry (1 hour from now) in users.password_reset_expires
    6. Sends reset email (if SMTP configured) OR logs the link to console
    7. Reset link format: https://<domain>/?reset_token=<raw_token>
    8. User opens the link — App.jsx detects ?reset_token= in URL
    9. Shows the ResetPassword screen (bypasses normal auth flow)
    10. User sets new password — POST /api/auth/reset-password
    11. Server verifies token hash + expiry, updates password, clears token

  Without SMTP configured:
    The reset link is printed to the server console/logs:
    [PASSWORD RESET LINK — no SMTP configured] https://.../?reset_token=...

  DB columns used (added to users table):
    password_reset_token    VARCHAR(255)  — SHA-256 hash of the token
    password_reset_expires  TIMESTAMP     — Token expiry (1 hour from creation)

================================================================================
  11. ADMIN PANEL
================================================================================

  URL:  /admin  (or https://<your-domain>/admin)

  Features:
    - View all registered users (coins, status, join date, country)
    - Ban / unban users
    - View and manage withdrawal requests (approve / reject)
    - View and reply to support tickets
    - Platform statistics dashboard

  Admin routes: server/routes/admin.js
  Mounted at:   /api/admin/

  Admin session is separate from user sessions.
  Admin login endpoint: POST /api/admin/login

================================================================================
  12. SUPPORT TICKET SYSTEM
================================================================================

  Files:
    Backend:  server/routes/tickets.js   — User-facing ticket API
              server/routes/admin.js      — Admin ticket management (view, reply)
    Frontend: client/src/pages/Support.jsx
              client/src/pages/Profile.jsx  (Support embedded inside Profile tab)

  The Support section is accessed via Profile tab → "Support & Help" row.
  It is NOT a standalone bottom nav tab (bottom nav has 4 tabs only).

  User endpoints:
    GET  /api/tickets/my          — List all of my tickets
    GET  /api/tickets/:id         — Get single ticket + all replies
    POST /api/tickets             — Create new ticket { subject, message }

  Admin endpoints (in admin routes):
    GET  /api/admin/tickets       — All tickets across all users
    GET  /api/admin/tickets/:id   — Single ticket + replies
    POST /api/admin/tickets/:id/reply  — Admin reply to a ticket

================================================================================
  13. FRONTEND BUILD PROCESS
================================================================================

  The server serves a pre-built React bundle from server/public/.
  You MUST rebuild after any change to files inside client/src/.

  Build command (run from project root):
    cd client && npm run build

  This outputs the built files to:
    server/public/index.html
    server/public/assets/

  After rebuilding, restart the server for changes to take effect.

  Vite config is at: client/vite.config.js
  The build target is: ../server/public  (relative to client/)

================================================================================
  14. SESSION & COOKIE CONFIGURATION
================================================================================

  Session store:  PostgreSQL via connect-pg-simple (table name: "session")
  Cookie name:    spetro.sid
  Cookie maxAge:  7 days
  httpOnly:       true  (not accessible from JavaScript)
  secure:         false (set to true when behind HTTPS in production)

  Session secret: set via SESSION_SECRET environment variable.
  If not set, falls back to a hardcoded default — DO NOT use the default in
  production. Always set a real SESSION_SECRET.

================================================================================
  15. DEFAULT CREDENTIALS (CHANGE IMMEDIATELY)
================================================================================

  Admin account (created by db-init.js on first boot):
    Username : admin
    Password : admin123

  Change this immediately after your first login at /admin.
  The password hash in the database uses bcrypt (cost factor 12).

================================================================================
  16. SUMMARY OF ALL MAJOR CHANGES MADE
================================================================================

  Below is a chronological record of every significant feature built during
  this development session.

  ── [1] CORE ARCHITECTURE ──────────────────────────────────────────────────────

    - Express.js backend with PostgreSQL (server-side coin storage only)
    - React + Vite SPA frontend pre-built and served as static files
    - PostgreSQL-backed session store (tamper-proof, survives restarts)
    - bcrypt password hashing (cost factor 12) on all user passwords
    - Atomic DB transactions for all coin credit/debit operations
      (prevents race conditions if same user completes multiple offers at once)

  ── [2] IP / VPN & RISK CHECK MIDDLEWARE ───────────────────────────────────────

    File: server/middleware/vpnCheck.js

    - Integrated ProxyCheck.io API to detect VPN, proxy, Tor, and high-risk IPs
    - Risk threshold set to 8/100 (strict — raises bar against fraud)
    - 15-minute in-memory cache per IP (reduces API usage and latency)
    - Local/private IPs always whitelisted (safe for development)
    - Fail-open design: any API/network error silently allows the user through
    - Applied to: login, register, and the Earn tab VPN-check endpoint
    - Frontend shows a full-screen "Access Restricted" overlay when blocked
    - Country + country code extracted from ProxyCheck response and stored in DB
    - Configurable via PROXYCHECK_KEY (optional) and RISK_THRESHOLD constant

  ── [3] GOOGLE OAUTH 2.0 ───────────────────────────────────────────────────────

    Files: server/routes/auth.js, client/src/pages/Login.jsx

    - passport-google-oauth20 integration
    - Callback URI: /api/auth/google/callback
    - On first Google login: auto-creates a user account (no password required)
    - On subsequent logins: matches by google_id or email, logs user in
    - Server prints the exact redirect URI to register in Google Cloud Console
      on every startup (visible in workflow logs)
    - Frontend: "Continue with Google" button on login page
    - Error states handled: cancelled, token failed, profile failed, banned

  ── [4] TERMS OF SERVICE ENFORCEMENT ──────────────────────────────────────────

    Files: client/src/pages/Login.jsx, client/src/pages/Register.jsx,
           server/routes/auth.js, server/db-init.js

    - ToS checkbox required before Google button and email sign-in become active
    - Both buttons are visually disabled (opacity 0.4, not-allowed cursor) if unchecked
    - Clicking "Terms of Service" or "Privacy Policy" opens a slide-up modal
      with the full legal text (Adjoe tracking consent, anti-VPN policy,
      Privacy Policy section)
    - Backend enforces acceptance: terms_accepted must be true on /api/auth/register
    - DB columns: terms_accepted (BOOLEAN), terms_accepted_at (TIMESTAMP)

  ── [5] NAME VALIDATION ────────────────────────────────────────────────────────

    Files: client/src/pages/Register.jsx, server/routes/auth.js

    - Display names restricted to English letters and spaces only
    - Regex enforced on both frontend (live feedback) and backend (API validation)
    - Pattern: /^[A-Za-z\s]+$/
    - Prevents usernames with numbers, symbols, or non-Latin characters

  ── [6] OFFERWALL POSTBACK SYSTEM ─────────────────────────────────────────────

    File: server/routes/offerwalls.js

    - HMAC-SHA256 signature verification on every postback (fraud prevention)
    - 4 active networks: Adjoe, RevU, Offery, Ovnix
    - Each network uses its own secret key (env var) for signature verification
    - Payload format: "${user_id}:${coins}:${offer_id}"
    - Atomic DB transaction: UPDATE users + INSERT transactions in one commit
    - timingSafeEqual used for signature comparison (prevents timing attacks)

  ── [7] OFFERWALL CARDS UI ─────────────────────────────────────────────────────

    File: client/src/pages/Offerwalls.jsx

    - adjoe (featured card, purple #8b5cf6) — Playtime
    - RevU (sky blue #0ea5e9) — Surveys & Offers
    - Offery (emerald #10b981) — App Installs
    - Ovnix (amber #f59e0b) — CPA Offers
    - AdToWall (forest green #059669) — Ad Rewards  [frontend card only]
    - TaskWall (deep blue #2B6CB0) — Task Offers    [frontend card only]
    - All non-featured cards have hover lift effect, color bloom, and
      an "Open Offerwall" button with external-link icon
    - Guest users see a full-screen lock overlay prompting sign-up
    - VPN-detected users see a full-screen "Access Restricted" overlay

  ── [8] FORGOT PASSWORD / RESET PASSWORD ──────────────────────────────────────

    Files: server/routes/auth.js, client/src/pages/Login.jsx,
           client/src/pages/ResetPassword.jsx

    - "Forgot password?" link on login page switches to a forgot-password view
    - Backend generates crypto.randomBytes(32) token, stores SHA-256 hash in DB
    - Token expires after 1 hour (password_reset_expires column)
    - Email sent via nodemailer if SMTP env vars are set; otherwise link is
      logged to the server console for manual retrieval
    - Reset link: https://<domain>/?reset_token=<raw_token>
    - App.jsx detects ?reset_token= on load and shows ResetPassword screen
    - After successful reset: token cleared from DB, user redirected to login
    - Always returns HTTP 200 on /forgot-password (prevents email enumeration)

  ── [9] SUPPORT TICKET SYSTEM ─────────────────────────────────────────────────

    Files: server/routes/tickets.js, server/routes/admin.js,
           client/src/pages/Support.jsx, client/src/pages/Profile.jsx

    - Users can open support tickets with subject + message
    - Admin can view all tickets and post replies from the admin dashboard
    - Ticket statuses: open, replied, closed
    - Support is embedded inside the Profile tab (NOT a standalone nav tab)
    - Profile → "Support & Help" row navigates to embedded support view

  ── [10] BOTTOM NAVIGATION RESTRUCTURE ────────────────────────────────────────

    File: client/src/components/BottomNav.jsx

    - Reduced from 5 tabs to 4 tabs: Home | Earn | Withdraw | Profile
    - Support moved inside Profile page (no longer a standalone tab)
    - Earn and Withdraw tabs show a lock badge when user is not signed in

  ── [11] ADMIN PANEL ───────────────────────────────────────────────────────────

    Files: server/routes/admin.js, client/src/pages/admin/

    - Separate admin login at /admin (session isolated from user sessions)
    - Dashboard tabs: Users, Withdrawals, Support Tickets, Stats
    - Ban/unban users with one click
    - Approve or reject withdrawal requests
    - Reply to support tickets (sets ticket status to "replied")

================================================================================
  END OF MIGRATION GUIDE
  Good luck with the new account setup. Start with Section 5 (env vars),
  then Section 4 (run the project), then Section 7 (Google OAuth URI).
================================================================================
