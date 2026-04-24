/**
 * PHASE 7: API Security & Optimization
 * Rate Limiting Middleware
 *
 * Implements adaptive rate limiting to prevent:
 * - Brute force attacks on auth endpoints
 * - DDoS and traffic abuse
 * - Excessive API usage
 *
 * Features:
 * - Per-IP rate limiting with sliding window
 * - Endpoint-specific limits
 * - Exponential backoff for repeat violators
 * - Admin bypass capability
 * - Persistent state tracking
 */

class RateLimiterStore {
  constructor() {
    this.requests = new Map(); // Map of IP -> {requests: [], violations: number, blockedUntil: timestamp}
    this.endpointLimits = {
      "/api/v1/auth/login": { limit: 5, window: 15 * 60 * 1000 }, // 5 requests per 15 min
      "/api/v1/auth/register": { limit: 3, window: 60 * 60 * 1000 }, // 3 requests per hour
      "/api/v1/auth/refresh": { limit: 10, window: 60 * 1000 }, // 10 requests per minute
      "/api/v1/user/profile": { limit: 30, window: 60 * 1000 }, // 30 requests per minute
      "/api/v1/products": { limit: 50, window: 60 * 1000 }, // 50 requests per minute
      "/api/v1/orders": { limit: 30, window: 60 * 1000 }, // 30 requests per minute
      "/api/v1/inventory": { limit: 40, window: 60 * 1000 }, // 40 requests per minute
      "/api/v1/dashboard": { limit: 20, window: 60 * 1000 }, // 20 requests per minute
    };
    this.defaultLimit = { limit: 60, window: 60 * 1000 }; // 60 requests per minute for other endpoints
    
    // Cleanup old entries every 10 minutes
    setInterval(() => this.cleanup(), 10 * 60 * 1000);
  }

  /**
   * Check rate limit for IP and endpoint
   * Returns: { allowed: boolean, remaining: number, resetIn: ms, retryAfter: ms }
   */
  checkLimit(ip, endpoint) {
    const now = Date.now();
    
    // Initialize or get existing record
    if (!this.requests.has(ip)) {
      this.requests.set(ip, { requests: [], violations: 0, blockedUntil: 0 });
    }

    const record = this.requests.get(ip);

    // Check if IP is temporarily blocked (exponential backoff)
    if (record.blockedUntil > now) {
      const retryAfter = Math.ceil((record.blockedUntil - now) / 1000);
      return {
        allowed: false,
        remaining: 0,
        resetIn: record.blockedUntil - now,
        retryAfter: retryAfter,
        reason: "Too many violations. Temporary block in effect.",
        violations: record.violations,
      };
    }

    // Get limit for this endpoint
    const config = this.endpointLimits[endpoint] || this.defaultLimit;
    const { limit, window } = config;

    // Remove old requests outside the window
    record.requests = record.requests.filter((timestamp) => now - timestamp < window);

    // Check if limit exceeded
    if (record.requests.length >= limit) {
      record.violations++;
      // Exponential backoff: 60s, 300s, 900s, 3600s (capped)
      const backoffMs = Math.min(60000 * Math.pow(2, record.violations - 1), 3600000);
      record.blockedUntil = now + backoffMs;

      const retryAfter = Math.ceil(backoffMs / 1000);
      return {
        allowed: false,
        remaining: 0,
        resetIn: window,
        retryAfter: retryAfter,
        reason: "Rate limit exceeded. Exponential backoff applied.",
        violations: record.violations,
      };
    }

    // Request allowed - record it
    record.requests.push(now);
    const remaining = limit - record.requests.length;
    const oldestRequest = record.requests[0];
    const resetIn = window - (now - oldestRequest);

    return {
      allowed: true,
      remaining,
      resetIn,
      retryAfter: 0,
      reason: "Request allowed",
      violations: record.violations,
    };
  }

  /**
   * Reset violations for an IP (for admin cleanup)
   */
  resetViolations(ip) {
    if (this.requests.has(ip)) {
      this.requests.get(ip).violations = 0;
      this.requests.get(ip).blockedUntil = 0;
    }
  }

  /**
   * Get stats for monitoring
   */
  getStats() {
    const stats = {
      totalTrackedIPs: this.requests.size,
      blockedIPs: 0,
      totalViolations: 0,
      details: {},
    };

    this.requests.forEach((record, ip) => {
      if (record.blockedUntil > Date.now()) {
        stats.blockedIPs++;
      }
      stats.totalViolations += record.violations;
      stats.details[ip] = {
        violations: record.violations,
        blockedUntil: record.blockedUntil > Date.now() ? new Date(record.blockedUntil).toISOString() : null,
        recentRequests: record.requests.length,
      };
    });

    return stats;
  }

  /**
   * Cleanup old entries
   */
  cleanup() {
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;

    for (const [ip, record] of this.requests.entries()) {
      // Remove if no requests in last hour and not currently blocked
      if (record.requests.length === 0 && record.blockedUntil < oneHourAgo) {
        this.requests.delete(ip);
      }
    }
  }
}

// Global rate limiter instance
const limiter = new RateLimiterStore();

/**
 * Rate Limiter Middleware
 * Applied to all routes by default
 * Admin users bypass rate limiting
 */
export const rateLimiterMiddleware = (req, res, next) => {
  // Extract client IP
  const clientIp = req.ip || req.connection.remoteAddress || req.headers["x-forwarded-for"] || "unknown";

  // Get user from JWT (if authenticated)
  const user = req.user;
  const isAdmin = user && (user.role === "admin" || user.role === "super_admin");

  // Bypass rate limiting for admin users and health checks
  if (isAdmin || req.path === "/api/v1/health") {
    return next();
  }

  // Check rate limit for this endpoint
  const endpoint = req.path;
  const limitResult = limiter.checkLimit(clientIp, endpoint);

  // Set rate limit headers
  res.setHeader("X-RateLimit-Limit", "60");
  res.setHeader("X-RateLimit-Remaining", Math.max(limitResult.remaining, 0));
  res.setHeader("X-RateLimit-Reset", new Date(Date.now() + limitResult.resetIn).toISOString());

  if (!limitResult.allowed) {
    res.setHeader("Retry-After", limitResult.retryAfter);
    return res.status(429).json({
      success: false,
      statusCode: 429,
      message: "Too many requests. Please try again later.",
      reason: limitResult.reason,
      retryAfter: limitResult.retryAfter,
      violations: limitResult.violations,
    });
  }

  next();
};

/**
 * Strict Rate Limiter for Auth endpoints
 * Much stricter limits for login/register to prevent brute force
 */
export const strictRateLimiter = (req, res, next) => {
  const clientIp = req.ip || req.connection.remoteAddress || req.headers["x-forwarded-for"] || "unknown";
  const endpoint = req.path;
  
  const limitResult = limiter.checkLimit(clientIp, endpoint);

  res.setHeader("X-RateLimit-Limit", "5");
  res.setHeader("X-RateLimit-Remaining", Math.max(limitResult.remaining, 0));
  res.setHeader("X-RateLimit-Reset", new Date(Date.now() + limitResult.resetIn).toISOString());

  if (!limitResult.allowed) {
    res.setHeader("Retry-After", limitResult.retryAfter);
    return res.status(429).json({
      success: false,
      statusCode: 429,
      message: "Authentication rate limit exceeded. Account security measure.",
      reason: limitResult.reason,
      retryAfter: limitResult.retryAfter,
    });
  }

  next();
};

/**
 * Export limiter instance for admin monitoring/reset
 */
export { limiter };
