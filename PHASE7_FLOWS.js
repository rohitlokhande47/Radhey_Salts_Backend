/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║             PHASE 7: API SECURITY & OPTIMIZATION - FLOW DIAGRAMS             ║
 * ║                    Visual Representation of Security Middleware               ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 *
 * This document contains 5 comprehensive ASCII workflow diagrams showing:
 * 1. Rate Limiter Adaptive Backoff Algorithm
 * 2. Input Validation Recursive Sanitization Pipeline
 * 3. Security Headers Enforcement on Responses
 * 4. Request Logging with Masking and Audit Trail
 * 5. Cache Hit/Miss with Invalidation Cascade
 */

// ═══════════════════════════════════════════════════════════════════════════════
// FLOW 1: RATE LIMITER ADAPTIVE BACKOFF ALGORITHM
// ═══════════════════════════════════════════════════════════════════════════════

const FLOW_1_RATE_LIMITER = `
╔════════════════════════════════════════════════════════════════════════════════╗
║                    RATE LIMITER ADAPTIVE BACKOFF ALGORITHM                     ║
║          Detects Abuse Pattern and Exponentially Increases Ban Duration        ║
╚════════════════════════════════════════════════════════════════════════════════╝


                              ┌─────────────────────┐
                              │  INCOMING REQUEST   │
                              └──────────┬──────────┘
                                         │
                              ┌──────────▼──────────┐
                              │   Extract Client IP │
                              └──────────┬──────────┘
                                         │
                    ┌────────────────────▼────────────────────┐
                    │  Check if IP is currently BANNED?       │
                    │  (Ban expires at X timestamp)           │
                    └──┬─────────────────────────────────┬────┘
                       │                                 │
                   YES │                                 │ NO
                       │                                 │
         ┌─────────────▼──────────┐        ┌────────────▼─────────────┐
         │   RETURN 429 TOO MANY  │        │  Is IP in rate limit map?│
         │      REQUESTS          │        │  (Has prior requests)    │
         │                        │        └──┬──────────────────┬────┘
         │  Headers:             │           │                  │
         │  - Retry-After: ...   │       YES │                  │ NO
         │  - X-RateLimit-*      │           │                  │
         └────────────────────────┘    ┌─────▼───────┐    ┌─────▼──────────┐
                                       │ Increment   │    │ Initialize     │
                                       │ request     │    │ request count  │
                                       │ count       │    │ = 1            │
                                       │ += 1        │    │ Window start   │
                                       └──────┬──────┘    │ = now          │
                                              │          └────────┬───────┘
                                      ┌───────▼────────────────────┘
                                      │
                    ┌─────────────────▼────────────────────┐
                    │  Has window EXPIRED?                 │
                    │  (now > start + window_duration)     │
                    └──┬─────────────────────────────┬─────┘
                       │                             │
                   YES │                             │ NO
                       │                             │
         ┌─────────────▼───────┐       ┌────────────▼─────────┐
         │  Reset counter = 1  │       │ Count exceeds LIMIT? │
         │  New window start   │       │ (count > limit)      │
         └──────────┬──────────┘       └──┬────────────┬──────┘
                    │                      │            │
                    │                  YES │            │ NO
                    │                      │            │
                    │         ┌────────────▼────┐   ┌──▼──────────────┐
                    │         │ OFFENSE COUNT++ │   │  ALLOW REQUEST  │
                    │         │ (offenses++)    │   │                 │
                    │         │                 │   │  Return 200 OK  │
                    │         └────────┬────────┘   │                 │
                    │                  │            │ Headers:        │
                    │     ┌────────────▼────────┐   │ - RateLimit-    │
                    │     │ Select ban duration │   │   Remaining: N-1│
                    │     │ based on offenses:  │   └─────────────────┘
                    │     │                     │
                    │     │ offenses = 1 ->    │
                    │     │   ban = 60s         │
                    │     │ offenses = 2 ->    │
                    │     │   ban = 300s (5min)│
                    │     │ offenses = 3 ->    │
                    │     │   ban = 900s (15min)
                    │     │ offenses >= 4 ->   │
                    │     │   ban = 3600s (1h) │
                    │     │                     │
                    │     └────────┬────────────┘
                    │              │
         ┌──────────▼──────────────▼──────────┐
         │   ADD IP TO BAN MAP                 │
         │   banMap[ip] = now + ban_duration  │
         │                                     │
         │   RETURN 429 TOO MANY REQUESTS     │
         │   Headers:                         │
         │   - Retry-After: ban_duration      │
         │   - X-RateLimit-Backoff: duration │
         │   - X-RateLimit-UnbanTime: stamp  │
         │   - X-RateLimit-Offense-Count: N  │
         │                                     │
         │   Log: SECURITY_EVENT              │
         │   Type: RATE_LIMIT_EXCEEDED        │
         │   Severity: HIGH (or CRITICAL)    │
         └─────────────────────────────────────┘


┌───────────────────────────────────────────────────────────────────────────────┐
│ EXPONENTIAL BACKOFF EXAMPLE: Attacker Makes 6 Requests Within 15 Minutes      │
├───────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│ Time    Request #  Window    Count  Exceeds?  Offense  Ban Duration  Action  │
│ ────    ─────────  ──────    ─────  ────────  ───────  ────────────  ──────  │
│ 14:00   1          14:00-14:15  1    NO        0       -            ALLOW   │
│ 14:02   2          14:00-14:15  2    NO        0       -            ALLOW   │
│ 14:04   3          14:00-14:15  3    NO        0       -            ALLOW   │
│ 14:06   4          14:00-14:15  4    NO        0       -            ALLOW   │
│ 14:08   5          14:00-14:15  5    NO        0       -            ALLOW   │
│ 14:09   6          14:00-14:15  6    YES       1       60s           429     │
│                                                        ├─ Unban at   │
│                                                        │  14:10      │
│                                                                      │
│ [IP banned until 14:10]                                             │
│                                                                      │
│ 14:11   7 (retry)  -           -    -         -       -            429     │
│ 14:15   8 (retry)  -           -    -         -       -            429     │
│                                                                      │
│ [Ban expires at 14:10, counter reset]                               │
│                                                                      │
│ 14:16   9          14:16-14:31  1    NO        0       -            ALLOW   │
│ 14:18   10         14:16-14:31  2    NO        0       -            ALLOW   │
│ ...continues...                                                     │
│ 14:20   12         14:16-14:31  5    NO        0       -            ALLOW   │
│ 14:21   13         14:16-14:31  6    YES       1       60s           429     │
│ 14:22   14 (retry) -            -    -         2       300s (5min)  429     │
│                    │                                   ├─ Unban at    │
│                    │                                   │  14:27      │
│                    │ After first ban expires, window  │              │
│                    │ resets but new violation occurs  │              │
│                    │ again with ESCALATED ban (5min)  │              │
│                                                        │              │
│ [Pattern shows attacker ignoring rate limits and       │              │
│  continuing attempts, triggering exponential backoff] │              │
│                                                                      │
│ After 4 total violations: Ban = 3600s (1 HOUR)                     │
│ Admin manually reviews and blocks IP in firewall                    │
│                                                                      │
└───────────────────────────────────────────────────────────────────────────────┘

ADMIN BYPASS:
────────────
  If JWT token decoded shows role: 'admin', rate limit counter is NOT incremented
  Admin can make unlimited requests to any endpoint
  Logged as: "RATE_LIMIT_ADMIN_BYPASS: true"
  Response header: X-RateLimit-Admin-Bypass: true

`;

// ═══════════════════════════════════════════════════════════════════════════════
// FLOW 2: INPUT VALIDATION RECURSIVE SANITIZATION PIPELINE
// ═══════════════════════════════════════════════════════════════════════════════

const FLOW_2_INPUT_VALIDATION = `
╔════════════════════════════════════════════════════════════════════════════════╗
║                  INPUT VALIDATION RECURSIVE SANITIZATION PIPELINE              ║
║        Seven-Layer Defense Against Injection, XSS, and Buffer Overflow         ║
╚════════════════════════════════════════════════════════════════════════════════╝


                         ┌──────────────────────┐
                         │  INCOMING REQUEST    │
                         │  req.body / req.query│
                         └──────────┬───────────┘
                                    │
                    ┌───────────────▼───────────────┐
                    │  LAYER 1: TYPE CHECK          │
                    │  Is input object/string/array?│
                    └──┬──────────────────────┬──────┘
                       │                      │
                    YES│                      │NO - Reject
                       │                   ┌──▼────────┐
                       │                   │ Return 400│
                       │                   │ Bad Type  │
                       │                   └───────────┘
                       │
         ┌─────────────▼───────────────┐
         │ LAYER 2: SIZE VALIDATION    │
         │ String <= 10000 chars?      │
         │ Array <= 1000 items?        │
         │ Object depth <= 20 levels?  │
         └──┬───────────────────┬──────┘
            │                   │
         PASS│                  │FAIL - Reject
            │              ┌────▼──────────┐
            │              │ Return 400    │
            │              │ Input Too Long│
            │              └───────────────┘
            │
     ┌──────▼──────────────┐
     │ LAYER 3: DEEP CLONE │
     │ Create working copy │
     │ Don't modify orig   │
     └──────┬──────────────┘
            │
     ┌──────▼──────────────────────┐
     │ LAYER 4: RECURSIVE STRING   │
     │ SANITIZATION               │
     │                             │
     │ For each string/value:      │
     │  - Trim whitespace          │
     │  - Remove control chars     │
     │  - Normalize unicode        │
     │  - Encode special chars     │
     │                             │
     │ If object/array:            │
     │  - Recurse into children    │
     │  - Track depth (max 20)     │
     └──┬──────────────────────┬───┘
        │                      │
     PASS│              DEPTH EXCEEDED
        │                 FAIL
        │              ┌──▼──────────┐
        │              │ Return 400  │
        │              │ Depth Limit │
        │              └─────────────┘
        │
    ┌───▼──────────────────────────────┐
    │ LAYER 5: INJECTION PATTERN DETECT│
    │                                  │
    │ For each string value:           │
    │  Check regex patterns:           │
    │                                  │
    │  SQL Injection:                  │
    │  /(UNION|SELECT|INSERT|DROP)/i   │
    │  /['].*OR.*[']/i                 │
    │  /--\s*|\/\*/                    │
    │                                  │
    │  NoSQL Injection:                │
    │  /\{\s*\$|mapReduce|function/i   │
    │  /\$where|regex:/i               │
    │                                  │
    │  XSS Attack:                     │
    │  /<script|javascript:/i          │
    │  /onerror|onload|onclick/i       │
    │  /<iframe|<embed|<img/i          │
    │                                  │
    │  Command Injection:              │
    │  /[;&|`$()]/                     │
    │  /exec|system|passthru/i         │
    │                                  │
    └──┬─────────────────────────┬─────┘
       │                         │
    CLEAN│                   PATTERN FOUND - REJECT
       │                    ┌────▼─────────────────┐
       │                    │ Log SECURITY_EVENT   │
       │                    │ type: INJECTION      │
       │                    │ Return 400           │
       │                    │ Invalid Input        │
       │                    └──────────────────────┘
       │
    ┌──▼─────────────────────────────┐
    │ LAYER 6: FORMAT VALIDATION     │
    │                                │
    │ If route is known:             │
    │  - Load field whitelist        │
    │  - Remove unlisted fields      │
    │                                │
    │ POST:/auth/register:           │
    │  Whitelist: [email, password,  │
    │             name, phone,       │
    │             companyName]       │
    │  Allowed: ✓ email, ✓ password │
    │  Rejected: ✗ role, ✗ admin    │
    │                                │
    │ POST:/auth/login:              │
    │  Whitelist: [email, password]  │
    │  Any other field: removed      │
    │                                │
    │ Unknown route:                 │
    │  No whitelist applied          │
    │  All sanitized fields passed   │
    │                                │
    └──┬──────────────────────┬──────┘
       │                      │
    PASS│              REJECTED FIELD
       │              ┌──────▼───────┐
       │              │ Return 400   │
       │              │ Bad Field    │
       │              └──────────────┘
       │
    ┌──▼─────────────────────────────┐
    │ LAYER 7: EMAIL/PHONE VALIDATION│
    │                                │
    │ For email fields:              │
    │  Check: /^[^\s@]+@[^\s@]+\..*$│
    │  Pattern: name@domain.ext      │
    │                                │
    │ For phone fields:              │
    │  Check: /^[\d\s\-\+\(\)]{7,}$ │
    │  Must be 7+ chars from set     │
    │                                │
    └──┬──────────────────────┬──────┘
       │                      │
    VALID│              INVALID FORMAT
       │                 FAIL
       │           ┌─────────▼──────┐
       │           │ Return 400     │
       │           │ Bad Email/Phone│
       │           └────────────────┘
       │
    ┌──▼────────────────────┐
    │  VALIDATION COMPLETE  │
    │                       │
    │  Return 200 OK        │
    │  Pass sanitized data  │
    │  to route handler     │
    │                       │
    │  req.body = sanitized│
    │  (safe for DB query) │
    └───────────────────────┘


┌───────────────────────────────────────────────────────────────────────────────┐
│ EXAMPLE: SQL INJECTION ATTEMPT BLOCKED AT LAYER 5                             │
├───────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│ Input: email = "admin@example.com' OR '1'='1"                               │
│                                                                               │
│ Flow:                                                                        │
│ ────                                                                        │
│ Layer 1: Type check      ✓ String                                           │
│ Layer 2: Size validation ✓ 32 chars < 10000                                 │
│ Layer 3: Deep clone      ✓ Copy created                                     │
│ Layer 4: Sanitization    ✓ String not modified (no control chars)           │
│ Layer 5: Injection detect ✗ BLOCKED!                                        │
│                          Pattern match: /['"];)\\s*(OR|AND)/i               │
│                          Found: ' OR '1'='1'                                │
│                                                                               │
│ Response: HTTP 400 Bad Request                                              │
│ {                                                                            │
│   "success": false,                                                          │
│   "statusCode": 400,                                                         │
│   "error": {                                                                 │
│     "type": "VALIDATION_ERROR",                                              │
│     "field": "email",                                                        │
│     "reason": "Potential injection attack detected",                         │
│     "securityAlert": true                                                    │
│   }                                                                          │
│ }                                                                            │
│                                                                               │
│ Log: SECURITY_EVENT {                                                        │
│   type: "INJECTION_ATTEMPT",                                                 │
│   ip: "192.168.1.102",                                                       │
│   endpoint: "/api/v1/auth/login",                                            │
│   injectionType: "SQL_INJECTION",                                            │
│   blockedField: "email"                                                      │
│ }                                                                            │
│                                                                               │
└───────────────────────────────────────────────────────────────────────────────┘

WHITELIST FILTERING EXAMPLE:
───────────────────────────
Endpoint: POST /auth/register
Whitelist: ["email", "password", "name", "phone", "companyName"]

Input object:
{
  "email": "user@example.com",        ✓ Whitelisted
  "password": "SecurePass123",        ✓ Whitelisted
  "name": "John Doe",                 ✓ Whitelisted
  "phone": "+919876543210",           ✓ Whitelisted
  "companyName": "Radhe Salt Co",     ✓ Whitelisted
  "role": "admin",                    ✗ NOT whitelisted - REMOVED
  "isAdmin": true,                    ✗ NOT whitelisted - REMOVED
  "permissions": ["read", "write"]    ✗ NOT whitelisted - REMOVED
}

Cleaned object passed to handler:
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "name": "John Doe",
  "phone": "+919876543210",
  "companyName": "Radhe Salt Co"
}

Note: Attacker cannot elevate privileges through API by injecting role/admin fields.

`;

// ═══════════════════════════════════════════════════════════════════════════════
// FLOW 3: SECURITY HEADERS ENFORCEMENT ON RESPONSES
// ═══════════════════════════════════════════════════════════════════════════════

const FLOW_3_SECURITY_HEADERS = `
╔════════════════════════════════════════════════════════════════════════════════╗
║                   SECURITY HEADERS ENFORCEMENT ON RESPONSES                    ║
║                 OWASP Headers Applied to Every Response                        ║
╚════════════════════════════════════════════════════════════════════════════════╝


                    ┌──────────────────────────┐
                    │  HANDLER CREATES RESPONSE│
                    │  (res object)            │
                    └──────────────┬───────────┘
                                   │
                    ┌──────────────▼──────────────┐
                    │ Middleware: securityHeaders│
                    │ (runs BEFORE res.send)     │
                    └──────────────┬──────────────┘
                                   │
        ┌──────────────────────────▼──────────────────────┐
        │         APPLY SECURITY HEADERS                  │
        │                                                 │
        │  Header 1: X-Frame-Options                      │
        │  Value: DENY                                    │
        │  Purpose: Prevent clickjacking                  │
        │  Effect: Browser blocks page if in iframe       │
        │                                                 │
        │  Header 2: X-Content-Type-Options              │
        │  Value: nosniff                                 │
        │  Purpose: Prevent MIME sniffing                 │
        │  Effect: Prevents IE from guessing MIME type   │
        │                                                 │
        │  Header 3: X-XSS-Protection                     │
        │  Value: 1; mode=block                           │
        │  Purpose: Legacy XSS protection                 │
        │  Effect: Browser's XSS filter enabled, blocks   │
        │                                                 │
        │  Header 4: Strict-Transport-Security           │
        │  Value: max-age=31536000; includeSubDomains... │
        │  Purpose: Force HTTPS                          │
        │  Effect: Browser caches for 1 year;            │
        │          future requests MUST be HTTPS         │
        │          (even if user types http://)           │
        │                                                 │
        │  Header 5: Referrer-Policy                      │
        │  Value: strict-origin-when-cross-origin        │
        │  Purpose: Control referrer info                 │
        │  Effect: Full referrer for same-origin,        │
        │          only origin for cross-origin           │
        │                                                 │
        │  Header 6: Permissions-Policy                   │
        │  Value: accelerometer=(), camera=(), ...       │
        │  Purpose: Disable sensitive browser APIs        │
        │  Effect: JavaScript cannot access camera,      │
        │          geolocation, microphone, etc.          │
        │                                                 │
        │  Header 7: Content-Security-Policy             │
        │  Value: default-src 'self'; script-src ...     │
        │  Purpose: Restrict resource loading            │
        │  Effect: Scripts, images, fonts only from       │
        │          same origin; blocks inline scripts     │
        │          (unless marked safe)                   │
        │                                                 │
        ├─ REMOVE HEADERS ─────────────────────────────┤
        │                                                 │
        │  Remove: Server                                 │
        │  Reason: Hide Express.js version                │
        │  Prevents: Attackers knowing framework          │
        │                                                 │
        │  Remove: X-Powered-By                           │
        │  Reason: Hide technology stack                  │
        │  Prevents: Targeted attacks on known bugs       │
        │                                                 │
        │  Remove: Date (optional)                        │
        │  Reason: Prevent timestamp analysis             │
        │  Prevents: Fingerprinting server software       │
        │                                                 │
        └───────────┬──────────────────────────────────┘
                    │
        ┌───────────▼──────────────┐
        │ Response with security   │
        │ headers configured       │
        │                          │
        │ Call: res.send(body)     │
        │ or: res.json(body)       │
        └───────────┬──────────────┘
                    │
        ┌───────────▼──────────────────┐
        │ CLIENT RECEIVES RESPONSE     │
        │                              │
        │ Headers:                     │
        │ ├─ X-Frame-Options: DENY    │
        │ ├─ X-Content-Type-Options   │
        │ ├─ X-XSS-Protection         │
        │ ├─ Strict-Transport-Security│
        │ ├─ Referrer-Policy          │
        │ ├─ Permissions-Policy       │
        │ ├─ Content-Security-Policy  │
        │ └─ [Other standard headers] │
        │                              │
        │ Body: [JSON response]        │
        └───────────┬──────────────────┘
                    │
        ┌───────────▼──────────────────┐
        │ BROWSER SECURITY PROCESSING  │
        │                              │
        │ X-Frame-Options: DENY        │
        │  → If page in iframe:        │
        │    BLOCK (don't render)      │
        │                              │
        │ CSP: default-src 'self'      │
        │  → If <script> from CDN:     │
        │    BLOCK (CSP violation)     │
        │                              │
        │ X-XSS-Protection             │
        │  → If XSS detected by filter:│
        │    BLOCK/Remove              │
        │                              │
        │ HSTS (if https)              │
        │  → Browser remembers:        │
        │    "This domain is HTTPS"    │
        │    for 1 year                │
        │                              │
        └──────────────────────────────┘


┌───────────────────────────────────────────────────────────────────────────────┐
│ CONTENT-SECURITY-POLICY (CSP) DETAILED RULES                                  │
├───────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│ Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; ...           │
│                                                                               │
│ ┌─ RULE: default-src 'self'                                                 │
│ │ Applies to: Any resource not explicitly allowed below                     │
│ │ Value: 'self' = same origin only                                          │
│ │ Effect: Cannot load resources from CDN, external servers                  │
│ │                                                                             │
│ ├─ RULE: script-src 'self' 'unsafe-inline'                                  │
│ │ Applies to: <script> tags                                                 │
│ │ Value: 'self' = scripts from same origin OK                               │
│ │        'unsafe-inline' = inline scripts (<script>code</script>) OK        │
│ │                         (normally blocked by CSP)                         │
│ │ Effect: Can load scripts from own server + inline, but NOT from CDN       │
│ │                                                                             │
│ ├─ RULE: style-src 'self' 'unsafe-inline'                                   │
│ │ Applies to: <link rel="stylesheet"> and <style> tags                      │
│ │ Effect: CSS from same origin + inline allowed                             │
│ │                                                                             │
│ ├─ RULE: img-src 'self' data: https:                                        │
│ │ Applies to: <img> tags                                                    │
│ │ Value: 'self' = images from same origin                                   │
│ │        data: = data URIs (<img src="data:image/png;base64,...">) │
│ │        https: = any https:// image                                        │
│ │ Effect: Can load images from own server, data URIs, or any HTTPS URL     │
│ │                                                                             │
│ ├─ RULE: font-src 'self'                                                    │
│ │ Applies to: @font-face in CSS                                             │
│ │ Effect: Only fonts from same origin (no Google Fonts CDN)                 │
│ │                                                                             │
│ ├─ RULE: connect-src 'self' https:                                          │
│ │ Applies to: fetch, XMLHttpRequest, WebSocket                              │
│ │ Effect: Can fetch from same origin or any https: endpoint                 │
│ │                                                                             │
│ └─ RULE: frame-ancestors 'none'                                             │
│   Applies to: Allows page to be embedded in iframe                          │
│   Value: 'none' = cannot be embedded anywhere                               │
│   Effect: Combined with X-Frame-Options: DENY                               │
│                                                                               │
│ EXAMPLE: What gets blocked?                                                  │
│ ────────────────────────────                                                 │
│                                                                               │
│ ✗ BLOCKED: <script src="https://cdn.example.com/app.js"></script>           │
│           Reason: script-src doesn't allow external CDN                      │
│                                                                               │
│ ✗ BLOCKED: <img src="http://example.com/pic.jpg">                           │
│           Reason: img-src only allows https: (not http:)                    │
│                                                                               │
│ ✓ ALLOWED: <script src="/js/app.js"></script>                               │
│           Reason: script-src allows 'self'                                   │
│                                                                               │
│ ✓ ALLOWED: <img src="data:image/png;base64,...">                            │
│           Reason: img-src allows data: URIs                                 │
│                                                                               │
│ ✓ ALLOWED: fetch("https://api.trusted.com/data")                            │
│           Reason: connect-src allows https:                                 │
│                                                                               │
└───────────────────────────────────────────────────────────────────────────────┘

DEPLOYMENT CONSIDERATIONS:
─────────────────────────

1. HTTPS REQUIREMENT for HSTS:
   Strict-Transport-Security only works over HTTPS
   If served over HTTP, header is ignored
   
2. CSP too restrictive?
   Monitor CSP violations in console
   Adjust policy before full enforcement
   Use: Content-Security-Policy-Report-Only for testing
   
3. Third-party scripts:
   CSP blocks external CDNs by default
   Either:
   a) Host scripts locally
   b) Add nonce: <script nonce="abc123">...</script>
      With CSP: script-src 'self' 'nonce-abc123'
   c) Add hash: CSP: script-src 'self' 'sha256-...'
   
4. Monitoring:
   CSP violations reported to console
   Can configure report-uri to send violations to server

`;

// ═══════════════════════════════════════════════════════════════════════════════
// FLOW 4: REQUEST LOGGING WITH MASKING AND AUDIT TRAIL
// ═══════════════════════════════════════════════════════════════════════════════

const FLOW_4_REQUEST_LOGGING = `
╔════════════════════════════════════════════════════════════════════════════════╗
║                REQUEST LOGGING WITH MASKING AND AUDIT TRAIL                   ║
║          Comprehensive Logging for Security, Debugging, and Compliance        ║
╚════════════════════════════════════════════════════════════════════════════════╝


                         ┌──────────────────────┐
                         │  INCOMING REQUEST    │
                         │  (req object)        │
                         └──────────┬───────────┘
                                    │
                    ┌───────────────▼───────────────┐
                    │ MIDDLEWARE: requestLoggingMW  │
                    │ (runs at START of middleware  │
                    │  stack - logs ALL requests)   │
                    └──────────────┬────────────────┘
                                   │
                    ┌──────────────▼──────────────┐
                    │  STEP 1: Generate requestId │
                    │  (UUID for tracking)        │
                    │  requestId = uuidv4()       │
                    │  req.id = requestId         │
                    └──────────────┬──────────────┘
                                   │
                    ┌──────────────▼──────────────┐
                    │ STEP 2: Record timestamp    │
                    │ startTime = Date.now()      │
                    │ Store in res.locals         │
                    └──────────────┬──────────────┘
                                   │
                    ┌──────────────▼──────────────┐
                    │ STEP 3: Extract metadata    │
                    │ - method = req.method       │
                    │ - url = req.url             │
                    │ - ip = req.ip               │
                    │ - userAgent = req.headers   │
                    │ - dataSize = body length    │
                    └──────────────┬──────────────┘
                                   │
                    ┌──────────────▼──────────────┐
                    │ STEP 4: Check auth status   │
                    │ - Extract JWT token from    │
                    │   Authorization header      │
                    │ - Decode token              │
                    │ - Extract userId, role      │
                    │ - Set isAuthenticated flag  │
                    │ - Set isAdmin flag          │
                    └──────────────┬──────────────┘
                                   │
                    ┌──────────────▼──────────────┐
                    │ STEP 5: Log request         │
                    │ (basic log entry created)   │
                    │ Store in memory:            │
                    │ requestLogger.logs.push({   │
                    │   timestamp, requestId,     │
                    │   method, url, ip, userId,  │
                    │   isAuthenticated, ...      │
                    │ })                          │
                    └──────────────┬──────────────┘
                                   │
                    ┌──────────────▼──────────────┐
                    │ STEP 6: Continue to next    │
                    │ middleware / route handler  │
                    │ next()                      │
                    └──────────────┬──────────────┘
                                   │
                          (route processes request)
                                   │
                    ┌──────────────▼──────────────┐
                    │ MIDDLEWARE: errorLoggingMW  │
                    │ (runs when handler throws)  │
                    │                             │
                    │ If error detected:          │
                    │ - Log to errorLog           │
                    │ - Add error details         │
                    │ - Set severity: "ERROR"     │
                    └──────────────┬──────────────┘
                                   │
                    ┌──────────────▼──────────────┐
                    │ MIDDLEWARE: auditLoggingMW  │
                    │ (runs BEFORE res.send)      │
                    │ (for mutations only)        │
                    │                             │
                    │ If method in [POST, PUT,    │
                    │    PATCH, DELETE] AND       │
                    │    url contains audit path: │
                    │   - Log to auditLog         │
                    │   - Record operation type   │
                    │   - Record changed fields   │
                    │   - Set auditFlag: true     │
                    └──────────────┬──────────────┘
                                   │
                ┌──────────────────▼──────────────────┐
                │ HANDLER SENDS RESPONSE              │
                │ res.status(200).json(data)          │
                │                                    │
                │ res.on('finish') event fires        │
                │ (triggered after response sent)     │
                └──────────────────┬─────────────────┘
                                   │
         ┌─────────────────────────▼─────────────────────┐
         │ MIDDLEWARE: performanceMonitoringMW           │
         │ (runs in res.on('finish') callback)           │
         │                                               │
         │ - Calculate responseTime                      │
         │   = Date.now() - startTime                   │
         │                                               │
         │ - Check if > 1000ms (performance threshold)   │
         │   if (responseTime > 1000)                   │
         │     performanceFlag = true                   │
         │     recommendation = optimization advice     │
         │                                               │
         │ - Extract status code from response          │
         │   statusCode = res.statusCode                │
         │                                               │
         │ - Add to log entry                           │
         │   requestLogger.logs[index].responseTime    │
         │   requestLogger.logs[index].statusCode       │
         │   requestLogger.logs[index].performanceFlag │
         └─────────────────────────┬─────────────────────┘
                                   │
         ┌─────────────────────────▼─────────────────────┐
         │ STEP 7: MASK SENSITIVE FIELDS                 │
         │ (from request and response bodies)            │
         │                                               │
         │ Sensitive fields to mask:                     │
         │ - password                                    │
         │ - token, accessToken, refreshToken           │
         │ - authorization header                       │
         │ - creditCard, cvv, ssn                        │
         │ - bankAccount, routingNumber                  │
         │ - secret, apiKey                              │
         │                                               │
         │ For each sensitive field:                     │
         │   field_value = "***MASKED***"               │
         │                                               │
         │ Example:                                      │
         │ Original: { password: "SecurePass123!" }     │
         │ Masked:   { password: "***MASKED***" }       │
         │                                               │
         └─────────────────────────┬─────────────────────┘
                                   │
         ┌─────────────────────────▼─────────────────────┐
         │ STEP 8: APPLY SECURITY CHECKS                 │
         │                                               │
         │ Is this a rate limit violation?               │
         │   → Log to securityLog                        │
         │   → severity: "CRITICAL"                      │
         │   → Include ban details                       │
         │                                               │
         │ Is this an injection attempt?                 │
         │   → Log to securityLog                        │
         │   → severity: "HIGH"                          │
         │   → Include blocked field                     │
         │                                               │
         │ Is this an auth failure?                      │
         │   → Log to securityLog                        │
         │   → severity: "WARNING"                       │
         │   → Track repeated failures per IP            │
         │                                               │
         │ Multiple failed attempts from same IP?        │
         │   → Flag as potential attack                  │
         │   → severity: "HIGH"                          │
         │                                               │
         └─────────────────────────┬─────────────────────┘
                                   │
         ┌─────────────────────────▼─────────────────────┐
         │ STEP 9: CALCULATE STATISTICS                  │
         │ (update running totals)                       │
         │                                               │
         │ requestLogger.stats.totalRequests++           │
         │                                               │
         │ if (statusCode >= 400)                        │
         │   requestLogger.stats.totalErrors++           │
         │                                               │
         │ if (statusCode === 401)                       │
         │   requestLogger.stats.totalAuthFailures++     │
         │                                               │
         │ if (statusCode === 400 && isValidationError)  │
         │   requestLogger.stats.totalValidationErrors++ │
         │                                               │
         │ Update averageResponseTime:                   │
         │   avg = (prev_avg * count + new_time)         │
         │         / (count + 1)                         │
         │                                               │
         └─────────────────────────┬─────────────────────┘
                                   │
         ┌─────────────────────────▼─────────────────────┐
         │ STEP 10: MANAGE STORAGE LIMITS                │
         │ (prevent runaway memory usage)                │
         │                                               │
         │ if (logs.length > MAX_LOGS)  // 10,000        │
         │   Remove oldest entries                       │
         │   Keep only most recent 10,000 logs           │
         │                                               │
         │ Each log type has own limit:                  │
         │ - General logs: 10,000                        │
         │ - Error logs: 5,000                           │
         │ - Security logs: 2,000                        │
         │ - Audit logs: 10,000                          │
         │                                               │
         └─────────────────────────┬─────────────────────┘
                                   │
         ┌─────────────────────────▼─────────────────────┐
         │ LOGGING COMPLETE                              │
         │                                               │
         │ Logs accessible via:                          │
         │ GET /api/v1/admin/monitoring/logs             │
         │ GET /api/v1/admin/monitoring/security-events │
         │ GET /api/v1/admin/monitoring/performance     │
         │                                               │
         │ Data structure:                               │
         │ {                                             │
         │   logs: [...],                                │
         │   errorLog: [...],                            │
         │   securityLog: [...],                         │
         │   auditLog: [...],                            │
         │   stats: { ... }                              │
         │ }                                             │
         │                                               │
         └─────────────────────────────────────────────┘


┌───────────────────────────────────────────────────────────────────────────────┐
│ COMPLETE LOG ENTRY EXAMPLE (After All Processing)                             │
├───────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│ {                                                                             │
│   // Identification                                                          │
│   "timestamp": "2024-04-25T14:35:10.012Z",                                   │
│   "requestId": "550e8400-e29b-41d4-a716-446655440000",                       │
│                                                                               │
│   // Request details                                                         │
│   "method": "POST",                                                          │
│   "url": "/api/v1/orders",                                                   │
│   "ip": "192.168.1.100",                                                     │
│   "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) ...",             │
│   "dataSize": 512,                                                           │
│                                                                               │
│   // Authentication & Authorization                                         │
│   "isAuthenticated": true,                                                   │
│   "userId": "user123",                                                       │
│   "userRole": "dealer",                                                      │
│   "isAdmin": false,                                                          │
│                                                                               │
│   // Request body (with sensitive fields masked)                             │
│   "requestBody": {                                                           │
│     "dealerId": "user123",                                                   │
│     "items": [...],                                                          │
│     "totalAmount": 45000,                                                    │
│     "paymentMethod": "transfer"                                              │
│   },                                                                         │
│                                                                               │
│   // Response details                                                        │
│   "statusCode": 201,                                                         │
│   "responseTime": 890,              // milliseconds                          │
│   "performanceFlag": false,         // < 1000ms threshold                    │
│                                                                               │
│   // Response body (with sensitive fields masked)                            │
│   "responseBody": {                                                          │
│     "orderId": "order123",                                                   │
│     "totalAmount": 45000,                                                    │
│     "createdAt": "2024-04-25T14:35:11Z"                                      │
│   },                                                                         │
│                                                                               │
│   // Audit trail (for mutations)                                             │
│   "auditFlag": true,                                                         │
│   "operation": "CREATE_ORDER",                                               │
│   "changedFields": {                                                         │
│     "dealerId": "user123",                                                   │
│     "totalAmount": 45000,                                                    │
│     "itemCount": 12                                                          │
│   },                                                                         │
│                                                                               │
│   // Security event (if any)                                                 │
│   "securityEvent": null,  // or { type: "...", severity: "..." }           │
│                                                                               │
│   // Severity level                                                          │
│   "severity": "AUDIT"      // INFO, WARNING, ERROR, CRITICAL, AUDIT         │
│ }                                                                             │
│                                                                               │
└───────────────────────────────────────────────────────────────────────────────┘

MASKING RULES:
──────────────

Original request body:
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "authToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "creditCard": "4532-1234-5678-9012",
  "cvv": "123"
}

Logged (with masking):
{
  "email": "user@example.com",              // OK - not sensitive
  "password": "***MASKED***",               // Masked
  "authToken": "***MASKED***",              // Masked
  "creditCard": "***MASKED***",             // Masked
  "cvv": "***MASKED***"                     // Masked
}

Sensitive field patterns matched:
- password, token, accessToken, refreshToken
- authorization (header), creditCard
- cvv, ssn, bankAccount, routingNumber
- secret, apiKey, secretKey

Masking applied recursively through objects and arrays.

`;

// ═══════════════════════════════════════════════════════════════════════════════
// FLOW 5: CACHE HIT/MISS WITH INVALIDATION CASCADE
// ═══════════════════════════════════════════════════════════════════════════════

const FLOW_5_CACHE_INVALIDATION = `
╔════════════════════════════════════════════════════════════════════════════════╗
║                CACHE HIT/MISS WITH INVALIDATION CASCADE                        ║
║              Smart Caching with Pattern-Based Automatic Invalidation          ║
╚════════════════════════════════════════════════════════════════════════════════╝


═════════════════════════════════════════════════════════════════════════════════
SCENARIO 1: CACHE MISS (First Request)
═════════════════════════════════════════════════════════════════════════════════

                              ┌─────────────────┐
                              │  GET REQUEST    │
                              │  /api/v1/products│
                              │  ?limit=20      │
                              └────────┬────────┘
                                       │
                    ┌──────────────────▼───────────────┐
                    │  MIDDLEWARE: queryCachingMiddleware
                    │  (checks if GET request can be   │
                    │   cached)                        │
                    └──────────────┬────────────────────┘
                                   │
                    ┌──────────────▼──────────────┐
                    │  Generate cache key:        │
                    │                             │
                    │  key = hash(               │
                    │    method='GET'            │
                    │    url='/api/v1/products'  │
                    │    query='limit=20'        │
                    │  )                         │
                    │                             │
                    │  key = "GET_/api/v1/products_limit=20"
                    └──────────────┬──────────────┘
                                   │
                    ┌──────────────▼──────────────┐
                    │  Check cache:               │
                    │  cacheEntry = queryCache    │
                    │    .get(key)                │
                    │                             │
                    │  Is key in cache?           │
                    └──┬──────────────────────┬───┘
                       │                      │
                    YES│                      │NO (MISS)
                       │                      │
                       │          ┌───────────▼────────┐
                       │          │ Cache miss!        │
                       │          │ Continue to handler│
                       │          │ next()             │
                       │          └───────────┬────────┘
                       │                      │
                       │         (handler queries database)
                       │         (handler builds response)
                       │                      │
                       │          ┌───────────▼────────┐
                       │          │ Handler sends      │
                       │          │ response           │
                       │          │ res.json(data)     │
                       │          └───────────┬────────┘
                       │                      │
                       │          ┌───────────▼────────────┐
                       │          │ MIDDLEWARE: Cache write│
                       │          │ (res.on('finish'))     │
                       │          │                        │
                       │          │ Store in cache:        │
                       │          │ queryCache.set(key, {  │
                       │          │   data: response,      │
                       │          │   timestamp: now(),    │
                       │          │   ttl: 300000  // 5min │
                       │          │ })                     │
                       │          │                        │
                       │          │ Log: CACHE_MISS        │
                       │          │ Store endpoint pattern │
                       │          │ for invalidation       │
                       │          └────────┬───────────────┘
                       │                   │
                       │          Return to client
                       │          Cache entry created


═════════════════════════════════════════════════════════════════════════════════
SCENARIO 2: CACHE HIT (Subsequent Request Within TTL)
═════════════════════════════════════════════════════════════════════════════════

                         (5 seconds after first request)
                              ┌─────────────────┐
                              │  GET REQUEST    │
                              │  /api/v1/products│
                              │  ?limit=20      │
                              └────────┬────────┘
                                       │
                    ┌──────────────────▼───────────────┐
                    │  Generate cache key (same as    │
                    │  before): "GET_/api/v1/products_limit=20"
                    └──────────────┬──────────────────┘
                                   │
                    ┌──────────────▼──────────────┐
                    │  Check cache:               │
                    │  cacheEntry = queryCache    │
                    │    .get(key)                │
                    │                             │
                    │  Found in cache? YES (HIT)  │
                    └──────────────┬──────────────┘
                                   │
                    ┌──────────────▼──────────────┐
                    │ Verify entry not expired:   │
                    │ now() < entry.expire_time?  │
                    │ 14:35:15 < 14:40:00?        │
                    │ YES - Still valid           │
                    └──────────────┬──────────────┘
                                   │
                    ┌──────────────▼──────────────┐
                    │  RETURN CACHED RESPONSE     │
                    │                             │
                    │  res.status(200)            │
                    │  res.json(entry.data)       │
                    │                             │
                    │  Skip handler!              │
                    │  (database query NOT run)   │
                    │                             │
                    │  Add cache headers:         │
                    │  Cache-Control: public,     │
                    │                 max-age=300 │
                    │  X-Cache: HIT               │
                    │  X-Cache-Key: key           │
                    │  X-Cache-Age: 5s            │
                    │                             │
                    │  Log: CACHE_HIT             │
                    │  Time saved: 250ms          │
                    │  (vs database query)        │
                    └─────────────────────────────┘
                                   │
                         Return cached data to client
                         NO database query executed


═════════════════════════════════════════════════════════════════════════════════
SCENARIO 3: CACHE EXPIRATION (TTL Exceeded)
═════════════════════════════════════════════════════════════════════════════════

                    (305 seconds after first request - past 5 min TTL)
                              ┌─────────────────┐
                              │  GET REQUEST    │
                              │  /api/v1/products│
                              │  ?limit=20      │
                              └────────┬────────┘
                                       │
                    ┌──────────────────▼────────────────┐
                    │  Generate cache key                │
                    │  key = "GET_/api/v1/products_..."  │
                    └──────────────┬─────────────────────┘
                                   │
                    ┌──────────────▼──────────────┐
                    │  Check cache: Key found     │
                    │                             │
                    │  Verify expiration:         │
                    │  now() < entry.expire_time? │
                    │ 14:40:05 < 14:40:00?        │
                    │  NO - Entry expired         │
                    └──────────────┬──────────────┘
                                   │
                    ┌──────────────▼──────────────┐
                    │  Remove from cache          │
                    │  queryCache.delete(key)     │
                    │                             │
                    │  Cache miss - continue to   │
                    │  handler as if empty cache  │
                    │  (fetch fresh from DB)      │
                    └──────────────┬──────────────┘
                                   │
                    (Handler queries database,
                     cache entry renewed)


═════════════════════════════════════════════════════════════════════════════════
SCENARIO 4: CACHE INVALIDATION CASCADE (Post/Put/Delete)
═════════════════════════════════════════════════════════════════════════════════

                              ┌─────────────────┐
                              │  POST REQUEST   │
                              │  /api/v1/products│
                              │  (Create product)
                              └────────┬────────┘
                                       │
                    ┌──────────────────▼──────────┐
                    │  Check request method:      │
                    │  method = POST              │
                    │                             │
                    │  Is mutation (POST/PUT/DEL)?│
                    │  YES - Invalidate cache     │
                    └──────────────┬──────────────┘
                                   │
            ┌──────────────────────▼─────────────────────┐
            │  MIDDLEWARE: cacheInvalidationMiddleware   │
            │  (runs BEFORE route handler)               │
            │                                             │
            │  Step 1: Invalidate exact endpoint:        │
            │  queryCache.delete("/api/v1/products")     │
            │                                             │
            │  Step 2: Invalidate dependent endpoints    │
            │  (pattern-based):                          │
            │                                             │
            │  POST /api/v1/products invalidates:        │
            │  ├─ GET /api/v1/products          ← Direct│
            │  ├─ GET /api/v1/products?*        ← Query │
            │  ├─ GET /api/v1/dashboard         ← Related
            │  └─ GET /api/v1/inventory         ← Related
            │                                             │
            │  Step 3: Find matching cache keys:         │
            │  for each key in queryCache.keys():        │
            │    if (key matches pattern):               │
            │      cache.delete(key)                     │
            │                                             │
            │  Patterns to invalidate:                   │
            │  POST /products → DELETE:                  │
            │    - /api/v1/products*  (all product GET) │
            │    - /api/v1/dashboard* (dashboards)      │
            │    - /api/v1/inventory*  (inventory)      │
            │                                             │
            │  PUT /products/{id} → DELETE:             │
            │    - /api/v1/products*  (all product GET) │
            │    - /api/v1/dashboard* (dashboards)      │
            │                                             │
            │  DELETE /products/{id} → DELETE:          │
            │    - /api/v1/products*  (all product GET) │
            │    - /api/v1/dashboard* (dashboards)      │
            │                                             │
            │  PATCH /orders/{id} → DELETE:             │
            │    - /api/v1/orders*    (all orders)      │
            │    - /api/v1/dashboard* (dashboards)      │
            │                                             │
            └──────────────────────┬──────────────────────┘
                                   │
                    ┌──────────────▼──────────────┐
                    │  Proceed to route handler   │
                    │  (Handler processes        │
                    │   CREATE request)          │
                    │                             │
                    │  Handler sends response:   │
                    │  res.json(newProduct)      │
                    └──────────────┬──────────────┘
                                   │
                    ┌──────────────▼──────────────┐
                    │  Return 201 Created        │
                    │                             │
                    │  Cache already invalidated  │
                    │  before handler ran         │
                    │                             │
                    │  Next GET /api/v1/products  │
                    │  will query fresh data     │
                    │  from database              │
                    └─────────────────────────────┘
                                   │
             RESULT: Cached product list now includes new product


┌───────────────────────────────────────────────────────────────────────────────┐
│ CACHE INVALIDATION PATTERNS - COMPLETE MAPPING                                │
├───────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│ POST /products:                                                               │
│   ├─ Cache key pattern: GET_/api/v1/products*                                │
│   ├─ Cache key pattern: GET_/api/v1/dashboard*                               │
│   └─ Cache key pattern: GET_/api/v1/inventory*                               │
│                                                                               │
│ PUT /products/{id}:                                                           │
│   ├─ Cache key pattern: GET_/api/v1/products*                                │
│   ├─ Cache key pattern: GET_/api/v1/dashboard*                               │
│   └─ Cache key pattern: GET_/api/v1/inventory*                               │
│                                                                               │
│ DELETE /products/{id}:                                                        │
│   ├─ Cache key pattern: GET_/api/v1/products*                                │
│   ├─ Cache key pattern: GET_/api/v1/dashboard*                               │
│   └─ Cache key pattern: GET_/api/v1/inventory*                               │
│                                                                               │
│ POST /orders:                                                                │
│   ├─ Cache key pattern: GET_/api/v1/orders*                                  │
│   ├─ Cache key pattern: GET_/api/v1/dashboard*                               │
│   └─ Cache key pattern: GET_/api/v1/inventory*  (stock changes)              │
│                                                                               │
│ PUT /orders/{id}:                                                             │
│   ├─ Cache key pattern: GET_/api/v1/orders*                                  │
│   ├─ Cache key pattern: GET_/api/v1/dashboard*                               │
│   └─ Cache key pattern: GET_/api/v1/inventory*                               │
│                                                                               │
│ PATCH /orders/{id}:                                                           │
│   ├─ Cache key pattern: GET_/api/v1/orders*                                  │
│   ├─ Cache key pattern: GET_/api/v1/dashboard*                               │
│   └─ Cache key pattern: GET_/api/v1/inventory*                               │
│                                                                               │
│ DELETE /orders/{id}:                                                          │
│   ├─ Cache key pattern: GET_/api/v1/orders*                                  │
│   ├─ Cache key pattern: GET_/api/v1/dashboard*                               │
│   └─ Cache key pattern: GET_/api/v1/inventory*                               │
│                                                                               │
│ POST /inventory:                                                              │
│   ├─ Cache key pattern: GET_/api/v1/inventory*                               │
│   ├─ Cache key pattern: GET_/api/v1/dashboard*                               │
│   └─ Cache key pattern: GET_/api/v1/products*  (stock info)                  │
│                                                                               │
│ PUT /user/profile:                                                            │
│   ├─ Cache key pattern: GET_/api/v1/user*                                    │
│   └─ Cache key pattern: GET_/api/v1/dashboard*                               │
│                                                                               │
│ POST /auth/login:                                                             │
│   └─ Cache key pattern: GET_/api/v1/user*  (clears user cache)               │
│                                                                               │
│ Key Pattern Matching:                                                         │
│ For pattern "GET_/api/v1/products*":                                         │
│   ✓ Matches "GET_/api/v1/products"                                           │
│   ✓ Matches "GET_/api/v1/products?limit=20"                                  │
│   ✓ Matches "GET_/api/v1/products?category=salt&limit=50"                    │
│   ✗ Does NOT match "GET_/api/v1/product" (singular)                          │
│   ✗ Does NOT match "GET_/api/v1/dashboard" (different resource)              │
│                                                                               │
└───────────────────────────────────────────────────────────────────────────────┘


═════════════════════════════════════════════════════════════════════════════════
SCENARIO 5: NO CACHE FOR MUTATIONS (POST/PUT/DELETE)
═════════════════════════════════════════════════════════════════════════════════

                              ┌─────────────────┐
                              │  POST REQUEST   │
                              │  /api/v1/orders │
                              │  (Create order) │
                              └────────┬────────┘
                                       │
                    ┌──────────────────▼──────────────┐
                    │  Check request method:          │
                    │  method = POST (Mutation)       │
                    │                                 │
                    │  Skip cache lookup              │
                    │  (mutations never cached)       │
                    └──────────────┬───────────────────┘
                                   │
                    ┌──────────────▼──────────────┐
                    │  Process request normally   │
                    │  Call handler               │
                    └──────────────┬──────────────┘
                                   │
                    ┌──────────────▼──────────────┐
                    │  Handler returns response:  │
                    │  res.json(createdOrder)     │
                    │                             │
                    │  Response headers:          │
                    │  Cache-Control:             │
                    │    no-store, no-cache,      │
                    │    must-revalidate,         │
                    │    proxy-revalidate         │
                    │  Pragma: no-cache           │
                    │  Expires: 0                 │
                    │                             │
                    │  (Explicitly tells browser  │
                    │   and proxies NOT to cache) │
                    │                             │
                    │  NOT stored in queryCache   │
                    │  (mutations excluded)       │
                    └─────────────────────────────┘
                                   │
                         Each POST returns fresh data
                         Never served from query cache


═════════════════════════════════════════════════════════════════════════════════
PERFORMANCE STATISTICS CALCULATION
═════════════════════════════════════════════════════════════════════════════════

Cache Statistics Tracked:
────────────────────────

{
  "queryCache": {
    "size": 156,                    // Current entries in cache
    "hits": 8945,                   // Times cache was hit
    "misses": 1234,                 // Times cache was missed
    "hitRate": "87.9%",             // hits / (hits + misses)
    "memoryUsage": "2.4MB"          // Estimated cache size
  },

  "compression": {
    "totalResponses": 10234,        // Total responses sent
    "compressedResponses": 9876,    // Responses that were gzipped
    "compressionRate": "96.5%",     // Percent of responses compressed
    "averageReduction": "72%",      // Average compression ratio
    "bandwidthSaved": "145MB"       // Estimated bandwidth saved
  },

  "cacheInvalidations": {
    "total": 234,                   // Total times cache invalidated
    "byReason": {
      "POST": 89,
      "PUT": 67,
      "DELETE": 45,
      "PATCH": 33
    }
  }
}

Calculation Examples:
─────────────────────

hitRate = hits / (hits + misses) * 100
        = 8945 / (8945 + 1234) * 100
        = 8945 / 10179 * 100
        = 87.9%

bandwidthSaved = total_uncompressed_size - total_compressed_size
               = sum(all response sizes) - sum(all gzipped sizes)
               = ~510MB - ~365MB
               = 145MB

compressionRate = compressedResponses / totalResponses * 100
                = 9876 / 10234 * 100
                = 96.5%

averageReduction = (original_size - compressed_size) / original_size * 100
                 = (4096 - 1024) / 4096 * 100
                 = 3072 / 4096 * 100
                 = 75% (average)

`;

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORT ALL FLOWS
// ═══════════════════════════════════════════════════════════════════════════════

export const PHASE7_FLOWS = {
  flow1_rateLimiter: FLOW_1_RATE_LIMITER,
  flow2_inputValidation: FLOW_2_INPUT_VALIDATION,
  flow3_securityHeaders: FLOW_3_SECURITY_HEADERS,
  flow4_requestLogging: FLOW_4_REQUEST_LOGGING,
  flow5_cacheInvalidation: FLOW_5_CACHE_INVALIDATION
};

console.log("✓ PHASE 7 FLOWS - 5 comprehensive ASCII workflow diagrams loaded");

// Display all flows when imported
console.log("\n" + FLOW_1_RATE_LIMITER);
console.log("\n" + FLOW_2_INPUT_VALIDATION);
console.log("\n" + FLOW_3_SECURITY_HEADERS);
console.log("\n" + FLOW_4_REQUEST_LOGGING);
console.log("\n" + FLOW_5_CACHE_INVALIDATION);
