const https = require('https');

// ── Risk threshold (0–100) ────────────────────────────────────────────────────
// Block the user if their fraud/risk score is above this value.
// Configurable via RISK_THRESHOLD env var. Default: 12 (strict).
// Raise to be more lenient, lower to be stricter.
const RISK_THRESHOLD = parseInt(process.env.RISK_THRESHOLD || '12', 10);

// ── Blocked message (shown to the user on the frontend overlay) ───────────────
const BLOCKED_MESSAGE =
  'Access Restricted: Your connection does not meet our security requirements. ' +
  'Please disable any VPN/Proxy or try switching to a secure mobile network.';

// ── In-memory cache (IP → result, TTL: 15 min) ───────────────────────────────
// Prevents excessive API calls. ProxyCheck.io free tier: 100 req/day (no key)
// or 1,000 req/day with a free API key (set PROXYCHECK_KEY env var).
const cache = new Map();
const CACHE_TTL_MS = 15 * 60 * 1000;

// ── Core IP check via ProxyCheck.io ──────────────────────────────────────────
// Returns: { isVpn, riskScore, blocked, country, countryCode }
//   isVpn     — true if proxy/VPN/Tor detected
//   riskScore — fraud/risk score 0–100 from ProxyCheck.io
//   blocked   — true if isVpn OR riskScore > RISK_THRESHOLD
//   country   — full country name (e.g. "United States")
//   countryCode — ISO 3166-1 alpha-2 code (e.g. "US")
//
// API key: sign up free at https://proxycheck.io and set PROXYCHECK_KEY env var.
// Without a key: 100 lookups/day. With free key: 1,000 lookups/day.
function checkIP(ip) {
  return new Promise((resolve) => {
    const cleanIP = (ip || '').replace('::ffff:', '').split(',')[0].trim();

    // Local / private IPs — skip check, always allow through
    if (
      !cleanIP ||
      cleanIP === '127.0.0.1' ||
      cleanIP === '::1' ||
      cleanIP.startsWith('10.') ||
      cleanIP.startsWith('192.168.') ||
      cleanIP.startsWith('172.')
    ) {
      return resolve({ isVpn: false, riskScore: 0, blocked: false, country: 'Unknown', countryCode: '' });
    }

    // Return cached result if still fresh
    const cached = cache.get(cleanIP);
    if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
      const { isVpn, riskScore, country, countryCode } = cached;
      return resolve({
        isVpn,
        riskScore,
        blocked: isVpn || riskScore > RISK_THRESHOLD,
        country,
        countryCode
      });
    }

    // Build ProxyCheck.io request URL
    // vpn=1  → detect VPN/proxy/Tor
    // risk=1 → include fraud/risk score (0–100)
    // asn=1  → include country + ASN metadata
    const apiKey = process.env.PROXYCHECK_KEY || '';
    const keyParam = apiKey ? `&key=${apiKey}` : '';
    const url = `https://proxycheck.io/v2/${cleanIP}?vpn=1&risk=1&asn=1${keyParam}`;

    const req = https.get(url, (res) => {
      let raw = '';
      res.on('data', (chunk) => { raw += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(raw);

          // ProxyCheck.io returns data keyed by the IP address
          const data = json[cleanIP] || {};

          const isVpn = data.proxy === 'yes';
          const riskScore = typeof data.risk === 'number' ? data.risk : 0;
          const country = data.country || 'Unknown';
          const countryCode = data.isocode || '';

          // Store in cache (without the computed `blocked` flag — threshold may change)
          cache.set(cleanIP, { isVpn, riskScore, country, countryCode, cachedAt: Date.now() });

          resolve({
            isVpn,
            riskScore,
            blocked: isVpn || riskScore > RISK_THRESHOLD,
            country,
            countryCode
          });
        } catch {
          // Parse error — fail open
          resolve({ isVpn: false, riskScore: 0, blocked: false, country: 'Unknown', countryCode: '' });
        }
      });
    });

    req.on('error', () =>
      resolve({ isVpn: false, riskScore: 0, blocked: false, country: 'Unknown', countryCode: '' })
    );
    // 5-second hard timeout so a slow API never hangs the request
    req.setTimeout(5000, () => {
      req.destroy();
      resolve({ isVpn: false, riskScore: 0, blocked: false, country: 'Unknown', countryCode: '' });
    });
  });
}

// ── Express middleware: block VPN / Proxy / high-risk IPs ────────────────────
// Blocks if isVpn === true  OR  riskScore > RISK_THRESHOLD (default 80)
// Usage: router.post('/login', blockVPN, handler)
async function blockVPN(req, res, next) {
  try {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
    const { blocked } = await checkIP(ip);
    if (blocked) {
      return res.status(403).json({ error: BLOCKED_MESSAGE });
    }
    next();
  } catch {
    // Fail open: never block users because of an API/network error
    next();
  }
}

module.exports = { checkIP, blockVPN, BLOCKED_MESSAGE, RISK_THRESHOLD };
