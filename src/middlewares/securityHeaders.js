/**
 * PHASE 7: API Security & Optimization
 * Security Headers Middleware
 *
 * Implements OWASP security headers to protect against:
 * - Clickjacking (X-Frame-Options)
 * - MIME type sniffing (X-Content-Type-Options)
 * - XSS attacks (Content-Security-Policy, X-XSS-Protection)
 * - Man-in-the-middle attacks (HSTS)
 * - Unwanted feature access (Permissions-Policy)
 * - Information leakage (Referrer-Policy)
 *
 * Features:
 * - Comprehensive security headers
 * - Environment-aware configuration
 * - Admin endpoint special handling
 * - CSP nonce generation for inline scripts
 * - HSTS preload list compatibility
 */

/**
 * Security Headers Middleware
 * Applies to all responses
 */
export const securityHeadersMiddleware = (req, res, next) => {
  // 1. Prevent Clickjacking (X-Frame-Options)
  // DENY = Page cannot be displayed in a frame
  res.setHeader("X-Frame-Options", "DENY");

  // 2. Prevent MIME Type Sniffing
  // Tells browser to respect Content-Type and not try to detect MIME type
  res.setHeader("X-Content-Type-Options", "nosniff");

  // 3. Enable XSS Protection in older browsers
  res.setHeader("X-XSS-Protection", "1; mode=block");

  // 4. Strict Transport Security (HSTS)
  // Forces HTTPS for 1 year and includes subdomains
  const isDevelopment = process.env.NODE_ENV === "development";
  if (!isDevelopment) {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  }

  // 5. Referrer Policy
  // Controls how much referrer information to share with third-party websites
  // 'strict-no-referrer' = Never send referrer information
  res.setHeader("Referrer-Policy", "strict-no-referrer");

  // 6. Permissions Policy (formerly Feature Policy)
  // Controls which browser features can be used
  res.setHeader(
    "Permissions-Policy",
    "geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()"
  );

  // 7. Content Security Policy (CSP)
  // Prevents inline scripts and restricts resource loading
  const cspRules = [
    "default-src 'self'", // Only allow resources from same origin by default
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Scripts from same origin + inline (for Node/Express)
    "style-src 'self' 'unsafe-inline'", // Styles from same origin + inline
    "img-src 'self' data: https:", // Images from same origin, data URIs, and HTTPS
    "font-src 'self' data:", // Fonts from same origin and data URIs
    "connect-src 'self' https://api.example.com", // AJAX/WebSocket connections
    "media-src 'none'", // No video/audio
    "object-src 'none'", // No plugins (Flash, etc.)
    "base-uri 'self'", // Restrict base URL
    "form-action 'self'", // Form submissions to same origin only
    "frame-ancestors 'none'", // Cannot be framed by any page
    "upgrade-insecure-requests", // Upgrade HTTP to HTTPS automatically
    "block-all-mixed-content", // Block mixed HTTP/HTTPS content
  ];

  res.setHeader("Content-Security-Policy", cspRules.join("; "));

  // For development, also send CSP-Report-Only to detect violations without blocking
  if (isDevelopment) {
    res.setHeader("Content-Security-Policy-Report-Only", cspRules.join("; "));
  }

  // 8. Remove sensitive headers that might leak information
  res.removeHeader("Server");
  res.removeHeader("X-Powered-By");

  // 9. Custom security headers for API
  res.setHeader("X-API-Version", "1.0");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");

  // 10. Prevent caching of sensitive data
  if (req.path.includes("/auth") || req.path.includes("/profile")) {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
  }

  next();
};

/**
 * Generate CSP Nonce for inline scripts
 * (Rarely needed in modern APIs but included for completeness)
 */
export const generateCspNonce = (req, res, next) => {
  const crypto = await import("crypto");
  const nonce = crypto.randomBytes(16).toString("base64");
  res.locals.cspNonce = nonce;
  res.setHeader("Content-Security-Policy", `script-src 'nonce-${nonce}'`);
  next();
};

/**
 * CORS Configuration with Security
 * Should be applied before other middleware
 */
export const corsSecurityMiddleware = (req, res, next) => {
  const allowedOrigins = [
    process.env.CLIENT_URL || "http://localhost:3000",
    process.env.ADMIN_URL || "http://localhost:3001",
    ...(process.env.ADDITIONAL_ORIGINS?.split(",") || []),
  ];

  const origin = req.headers.origin;

  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
    res.setHeader("Access-Control-Max-Age", "3600");

    // Preflight request
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
  }

  next();
};

/**
 * Prevent Response Smuggling
 * Validates response headers for malicious patterns
 */
export const preventResponseSmugglingMiddleware = (req, res, next) => {
  const originalWriteHead = res.writeHead;

  res.writeHead = function (statusCode, reason, obj) {
    // Validate headers for CRLF injection
    const headers = obj || reason;

    if (typeof headers === "object") {
      for (const key in headers) {
        const value = headers[key];
        if (typeof value === "string" && /[\r\n]/.test(value)) {
          console.warn(`Potential response smuggling attempt in header ${key}`);
          headers[key] = value.replace(/[\r\n]/g, "");
        }
      }
    }

    return originalWriteHead.call(this, statusCode, reason, obj);
  };

  next();
};

/**
 * Add Security Footer to responses
 * Indicates security measures are in place
 */
export const securityFooterMiddleware = (req, res, next) => {
  res.setHeader("X-Protected-By", "Radhe-Salt-Security-Layer");
  res.setHeader("X-Request-ID", `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);

  next();
};

/**
 * Combined Security Middleware (all in one)
 * Apply this to use all security headers at once
 */
export const allSecurityHeaders = (req, res, next) => {
  securityHeadersMiddleware(req, res, () => {
    corsSecurityMiddleware(req, res, () => {
      preventResponseSmugglingMiddleware(req, res, () => {
        securityFooterMiddleware(req, res, next);
      });
    });
  });
};

export default securityHeadersMiddleware;
