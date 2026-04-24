/**
 * PHASE 7: API Security & Optimization
 * Caching & Compression Middleware
 *
 * Implements:
 * - HTTP response compression (gzip)
 * - Smart caching strategies for different endpoint types
 * - Cache-Control headers
 * - ETag generation
 * - Cache invalidation
 *
 * Features:
 * - Compression for large responses
 * - Cache-friendly headers
 * - Database query result caching
 * - Smart cache expiration
 * - Cache busting for updates
 */

import compression from "compression";

/**
 * Response Compression Middleware
 * Automatically compresses responses over 1KB
 */
export const compressionMiddleware = compression({
  filter: (req, res) => {
    // Compress if response contains Content-Encoding header
    if (res.getHeader("x-no-compression")) {
      return false;
    }
    // Use compression filter function
    return compression.filter(req, res);
  },
  // Compression level: 6 is default, 9 is maximum (slower but better compression)
  level: 6,
  // Only compress responses larger than this (in bytes)
  threshold: 1024,
});

/**
 * Cache Control Middleware
 * Sets appropriate cache headers based on endpoint
 */
export const cacheControlMiddleware = (req, res, next) => {
  // Public endpoints - can be cached by CDN and browsers
  if (req.path.includes("/api/v1/products") && req.method === "GET") {
    res.setHeader("Cache-Control", "public, max-age=300"); // 5 minutes
  }
  // User-specific data - cache at browser only, must revalidate
  else if (req.path.includes("/api/v1/user") && req.method === "GET") {
    res.setHeader("Cache-Control", "private, max-age=60"); // 1 minute
  }
  // Dashboard data - short cache due to real-time requirements
  else if (req.path.includes("/api/v1/dashboard") && req.method === "GET") {
    res.setHeader("Cache-Control", "private, max-age=30"); // 30 seconds
  }
  // Inventory data - moderate cache
  else if (req.path.includes("/api/v1/inventory") && req.method === "GET") {
    res.setHeader("Cache-Control", "private, max-age=120"); // 2 minutes
  }
  // POST/PUT/DELETE - never cache
  else if (req.method !== "GET") {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
  }
  // Default - minimal caching
  else {
    res.setHeader("Cache-Control", "private, max-age=60");
  }

  next();
};

/**
 * ETag Generation Middleware
 * Generate ETags for cache validation
 */
export const etagMiddleware = (req, res, next) => {
  const crypto = await import("crypto");
  
  const originalJson = res.json;

  res.json = function (data) {
    // Generate ETag only for GET requests
    if (req.method === "GET" && data) {
      try {
        const json = JSON.stringify(data);
        const etag = `"${crypto.createHash("md5").update(json).digest("hex")}"`;
        res.setHeader("ETag", etag);

        // Check If-None-Match header for 304 responses
        if (req.headers["if-none-match"] === etag) {
          return res.status(304).end();
        }
      } catch (error) {
        console.error("Error generating ETag:", error);
      }
    }

    return originalJson.call(this, data);
  };

  next();
};

/**
 * Query Result Cache
 * Simple in-memory cache for database queries
 */
class QueryCache {
  constructor(ttl = 5 * 60 * 1000) {
    // 5 minutes default TTL
    this.cache = new Map();
    this.ttl = ttl;
  }

  /**
   * Generate cache key from request
   */
  generateKey(method, path, params = {}) {
    return `${method}:${path}:${JSON.stringify(params)}`;
  }

  /**
   * Get cached value
   */
  get(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;

    // Check if expired
    if (Date.now() > cached.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return cached.value;
  }

  /**
   * Set cached value
   */
  set(key, value, ttl = null) {
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + (ttl || this.ttl),
    });
  }

  /**
   * Invalidate cache by pattern
   */
  invalidateByPattern(pattern) {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear all cache
   */
  clear() {
    this.cache.clear();
  }

  /**
   * Get cache stats
   */
  getStats() {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys()).slice(0, 20),
    };
  }
}

// Global query cache instance
export const queryCache = new QueryCache();

/**
 * Query Caching Middleware
 * Caches GET requests to specific endpoints
 */
export const queryCachingMiddleware = (req, res, next) => {
  // Only cache GET requests
  if (req.method !== "GET") {
    return next();
  }

  // Cache key
  const cacheKey = queryCache.generateKey(req.method, req.path, req.query);

  // Check cache
  const cachedResponse = queryCache.get(cacheKey);
  if (cachedResponse) {
    res.setHeader("X-Cache", "HIT");
    return res.json(cachedResponse);
  }

  res.setHeader("X-Cache", "MISS");

  // Override res.json to cache responses
  const originalJson = res.json;

  res.json = function (data) {
    // Cache successful responses only
    if (data && data.success !== false && res.statusCode < 400) {
      queryCache.set(cacheKey, data);
    }

    return originalJson.call(this, data);
  };

  next();
};

/**
 * Cache Invalidation Middleware
 * Clears cache when data is modified
 */
export const cacheInvalidationMiddleware = (req, res, next) => {
  // Invalidate cache on data modifications
  if (req.method === "POST" || req.method === "PUT" || req.method === "PATCH" || req.method === "DELETE") {
    // Get the endpoint pattern (e.g., /api/v1/products from /api/v1/products/:id)
    const endpoint = req.path.split("/").slice(0, 4).join("/");

    // Invalidate related cache
    queryCache.invalidateByPattern(endpoint);
  }

  next();
};

/**
 * Combined Optimization Middleware (all in one)
 */
export const allOptimizationMiddleware = (req, res, next) => {
  compressionMiddleware(req, res, () => {
    cacheControlMiddleware(req, res, () => {
      queryCachingMiddleware(req, res, () => {
        cacheInvalidationMiddleware(req, res, next);
      });
    });
  });
};

export default compressionMiddleware;
