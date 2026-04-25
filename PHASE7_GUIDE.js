/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║             PHASE 7: API SECURITY & OPTIMIZATION - COMPLETE API GUIDE        ║
 * ║                    Rate Limiting | Input Validation | Security Headers        ║
 * ║                   Request Logging | Caching | Performance Monitoring         ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 *
 * COMPREHENSIVE API REFERENCE AND IMPLEMENTATION GUIDE
 * 
 * This document provides:
 * - Detailed explanation of each security middleware
 * - Rate limiting behavior and response headers
 * - Input validation rules and injection detection
 * - Security headers enforcement
 * - Request logging and audit trail format
 * - Caching strategy and cache key generation
 * - Monitoring endpoints for admin access
 * - Real-world request/response examples
 * - Error scenarios and proper handling
 * - Admin bypass scenarios and authorization
 */

// ═══════════════════════════════════════════════════════════════════════════════
// 1. RATE LIMITER MIDDLEWARE - DDOS PREVENTION & ABUSE DETECTION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * RATE LIMITER OVERVIEW
 * ═════════════════════════════════════════════════════════════════════════════
 * 
 * Purpose: Prevent brute force attacks, DDoS attacks, and API abuse
 * 
 * Mechanism: Sliding window algorithm with per-IP request tracking
 * - Each endpoint has specific rate limits
 * - Exceeding limit triggers exponential backoff ban
 * - Admin users can bypass rate limits
 * 
 * Configuration:
 * - Stored in memory with per-IP tracking
 * - Automatic cleanup of expired entries
 * - Configurable for different environments (dev/prod)
 */

const RATE_LIMITER_CONFIG = {
  // Endpoint-specific limits (requests per time window)
  endpoints: {
    "/auth/login": {
      limit: 5,
      window: 900000,           // 15 minutes in ms
      windowDisplay: "15 minutes"
    },
    "/auth/register": {
      limit: 3,
      window: 3600000,          // 1 hour in ms
      windowDisplay: "1 hour"
    },
    "/auth/refresh": {
      limit: 10,
      window: 60000,            // 1 minute in ms
      windowDisplay: "1 minute"
    },
    "/user/profile": {
      limit: 30,
      window: 60000,            // 1 minute in ms
      windowDisplay: "1 minute"
    },
    "/products": {
      limit: 50,
      window: 60000,            // 1 minute in ms
      windowDisplay: "1 minute"
    },
    "/orders": {
      limit: 30,
      window: 60000,            // 1 minute in ms
      windowDisplay: "1 minute"
    },
    "/inventory": {
      limit: 40,
      window: 60000,            // 1 minute in ms
      windowDisplay: "1 minute"
    },
    "/dashboard": {
      limit: 20,
      window: 60000,            // 1 minute in ms
      windowDisplay: "1 minute"
    }
  },

  // Exponential backoff ban durations
  banDurations: [60000, 300000, 900000, 3600000],  // 1min, 5min, 15min, 1hour
  globalLimit: 1000,                               // Per IP per hour
  globalWindow: 3600000,                           // 1 hour
  
  // Admin bypass: When user is admin, rate limits do NOT apply
  adminBypass: true
};

/**
 * RATE LIMITER - RESPONSE HEADERS
 * ═════════════════════════════════════════════════════════════════════════════
 * 
 * Every response includes rate limit headers:
 * 
 * X-RateLimit-Limit:       Total requests allowed in window
 * X-RateLimit-Remaining:   Requests remaining before limit
 * X-RateLimit-Reset:       Unix timestamp when limit resets
 * X-RateLimit-Backoff:     Ban duration in milliseconds (if exceeded)
 * X-RateLimit-UnbanTime:   Unix timestamp when ban expires (if banned)
 * Retry-After:             Seconds to wait before retrying (if 429)
 */

// ─────────────────────────────────────────────────────────────────────────────
// EXAMPLE 1: Normal Request (Within Limit)
// ─────────────────────────────────────────────────────────────────────────────

const EXAMPLE_RATE_LIMITER_NORMAL = {
  request: {
    method: "POST",
    url: "http://localhost:8000/api/v1/auth/login",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    },
    body: {
      email: "user@example.com",
      password: "SecurePassword123!"
    }
  },

  response: {
    status: 200,
    headers: {
      "X-RateLimit-Limit": "5",           // Max 5 requests
      "X-RateLimit-Remaining": "3",        // 3 requests left
      "X-RateLimit-Reset": "1713072900",   // Unix timestamp
      "X-RateLimit-Backoff": "60000"       // Next ban would be 1 minute
    },
    body: {
      success: true,
      statusCode: 200,
      data: {
        user: { id: "user123", email: "user@example.com" },
        accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
      },
      message: "User logged in successfully"
    }
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// EXAMPLE 2: Rate Limit Exceeded - First Offense
// ─────────────────────────────────────────────────────────────────────────────

const EXAMPLE_RATE_LIMITER_EXCEEDED_1 = {
  request: {
    method: "POST",
    url: "http://localhost:8000/api/v1/auth/login",
    headers: {
      "Content-Type": "application/json"
    },
    body: {
      email: "attacker@example.com",
      password: "WrongPassword"
    },
    note: "6th attempt within 15 minute window (limit is 5)"
  },

  response: {
    status: 429,
    statusText: "Too Many Requests",
    headers: {
      "X-RateLimit-Limit": "5",
      "X-RateLimit-Remaining": "0",
      "X-RateLimit-Reset": "1713072900",
      "X-RateLimit-Backoff": "60000",              // 1 minute ban
      "X-RateLimit-UnbanTime": "1713072960",       // Unix timestamp
      "Retry-After": "60"                           // Seconds to wait
    },
    body: {
      success: false,
      statusCode: 429,
      data: null,
      message: "Rate limit exceeded. Please try again in 60 seconds.",
      error: {
        type: "RATE_LIMIT_EXCEEDED",
        remainingTime: 60,
        nextBanDuration: 300000,
        offenseCount: 1
      }
    }
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// EXAMPLE 3: Rate Limit Exceeded - Exponential Backoff (4th Offense)
// ─────────────────────────────────────────────────────────────────────────────

const EXAMPLE_RATE_LIMITER_EXPONENTIAL = {
  request: {
    method: "POST",
    url: "http://localhost:8000/api/v1/auth/login",
    headers: { "Content-Type": "application/json" },
    body: { email: "attacker@example.com", password: "WrongPassword" },
    note: "4th violation in escalating pattern: 1min → 5min → 15min → NOW 1HOUR"
  },

  response: {
    status: 429,
    headers: {
      "X-RateLimit-Limit": "5",
      "X-RateLimit-Remaining": "0",
      "X-RateLimit-Reset": "1713076560",       // 1 hour from now
      "X-RateLimit-Backoff": "3600000",         // 1 hour ban
      "X-RateLimit-UnbanTime": "1713076560",
      "Retry-After": "3600"                      // 1 hour in seconds
    },
    body: {
      success: false,
      statusCode: 429,
      data: null,
      message: "Rate limit exceeded. Repeated violations detected. IP temporarily banned for 3600 seconds.",
      error: {
        type: "RATE_LIMIT_EXCEEDED_SEVERE",
        remainingTime: 3600,
        offenseCount: 4,
        securityAlert: true,
        reason: "Multiple rate limit violations detected"
      }
    }
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// EXAMPLE 4: Admin Bypass - Admin User Ignores Rate Limits
// ─────────────────────────────────────────────────────────────────────────────

const EXAMPLE_RATE_LIMITER_ADMIN_BYPASS = {
  request: {
    method: "GET",
    url: "http://localhost:8000/api/v1/dashboard/overview",
    headers: {
      "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "note": "Admin token (payload contains role: 'admin')"
    }
  },

  response: {
    status: 200,
    headers: {
      "X-RateLimit-Limit": "20",              // Dashboard limit
      "X-RateLimit-Remaining": "20",           // NOT decremented for admin
      "X-RateLimit-Reset": "1713072900",
      "X-RateLimit-Admin-Bypass": "true"       // Special header indicating bypass
    },
    body: {
      success: true,
      statusCode: 200,
      data: {
        totalSales: 1500000,
        activeOrders: 234,
        inventoryValue: 2500000
      },
      message: "Dashboard data retrieved (admin bypass applied)"
    }
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// 2. INPUT VALIDATION MIDDLEWARE - INJECTION ATTACK PREVENTION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * INPUT VALIDATION OVERVIEW
 * ═════════════════════════════════════════════════════════════════════════════
 * 
 * Purpose: Prevent injection attacks (SQL, NoSQL, XSS), buffer overflows, etc.
 * 
 * Validation Layers:
 * 1. Recursive string sanitization (removes special chars, trims)
 * 2. Object deep-scanning with depth limit (20 levels max)
 * 3. Injection pattern detection (SQL, NoSQL, command injection)
 * 4. XSS prevention (HTML entity encoding)
 * 5. Field whitelist filtering (known routes only)
 * 6. Size validation (string max 10000 chars, array max 1000 items)
 */

const INPUT_VALIDATION_CONFIG = {
  // Patterns detected and blocked
  injectionPatterns: {
    sql: [
      /(\b(UNION|SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER)\b)/i,
      /(['";])\s*(OR|AND)\s*(['"];|1|true)/i,
      /--\s*|\/\*/,  // SQL comments
      /(;|%3B)\s*(DROP|DELETE|INSERT|UPDATE|CREATE)/i
    ],
    
    noSQL: [
      /\$where|mapReduce|function|eval/i,
      /\{\s*\$|regex:/i
    ],
    
    xss: [
      /<script|javascript:|onerror|onload|onmouseover|onclick/i,
      /<iframe|<embed|<object|<img.*src/i,
      /vbscript:|data:text\/html/i
    ],
    
    commandInjection: [
      /[;&|`$(){}[\]\\]/,  // Shell metacharacters
      /\$\{|`|exec|system|passthru/i
    ]
  },

  // Known routes with field whitelists
  fieldWhitelists: {
    "POST:/auth/register": ["email", "password", "name", "phone", "companyName"],
    "POST:/auth/login": ["email", "password"],
    "POST:/user/profile": ["name", "phone", "address", "city", "state", "pincode", "gstNumber"],
    "POST:/products": ["name", "description", "price", "quantity", "category", "sku"],
    "POST:/orders": ["dealerId", "items", "totalAmount", "discountPercent", "notes"],
    "POST:/inventory": ["productId", "quantity", "type", "notes"],
    "POST:/dashboard": ["startDate", "endDate", "filters", "reportType"]
  },

  // Size limits
  maxStringLength: 10000,
  maxArrayLength: 1000,
  maxObjectDepth: 20,

  // Email and phone validation
  emailRegex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phoneRegex: /^[\d\s\-\+\(\)]{7,}$/
};

// ─────────────────────────────────────────────────────────────────────────────
// EXAMPLE 1: Valid Input - Passes All Validation
// ─────────────────────────────────────────────────────────────────────────────

const EXAMPLE_INPUT_VALID = {
  request: {
    method: "POST",
    url: "http://localhost:8000/api/v1/auth/register",
    headers: { "Content-Type": "application/json" },
    body: {
      email: "john@example.com",
      password: "SecurePassword123!@#",
      name: "John Doe",
      phone: "+91 9876543210",
      companyName: "Radhe Salt Industries"
    }
  },

  validation: {
    step1_stringSanitization: "PASS - No special characters detected",
    step2_fieldWhitelist: "PASS - All fields in POST:/auth/register whitelist",
    step3_injectionDetection: "PASS - No SQL/NoSQL/XSS/Command injection patterns",
    step4_emailValidation: "PASS - Valid email format",
    step5_phoneValidation: "PASS - Valid phone format",
    step6_sizeLimits: "PASS - All strings under 10000 chars"
  },

  response: {
    status: 201,
    body: {
      success: true,
      statusCode: 201,
      data: {
        userId: "user123",
        email: "john@example.com",
        name: "John Doe",
        role: "dealer"
      },
      message: "User registered successfully"
    }
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// EXAMPLE 2: SQL Injection Attempt - BLOCKED
// ─────────────────────────────────────────────────────────────────────────────

const EXAMPLE_INPUT_SQL_INJECTION = {
  request: {
    method: "POST",
    url: "http://localhost:8000/api/v1/auth/login",
    headers: { "Content-Type": "application/json" },
    body: {
      email: "admin@example.com' OR '1'='1",
      password: "' OR '1'='1' --"
    }
  },

  validation: {
    step1_stringSanitization: "PASS",
    step2_fieldWhitelist: "PASS",
    step3_injectionDetection: "FAIL - SQL injection pattern detected: 'OR' operator",
    blockedPattern: "/(\\b(UNION|SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER)\\b)/i",
    detectedAt: "email field"
  },

  response: {
    status: 400,
    body: {
      success: false,
      statusCode: 400,
      data: null,
      message: "Invalid input detected. Please provide valid credentials.",
      error: {
        type: "VALIDATION_ERROR",
        field: "email",
        reason: "Potential injection attack detected",
        securityAlert: true
      }
    }
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// EXAMPLE 3: XSS Attack Attempt - BLOCKED
// ─────────────────────────────────────────────────────────────────────────────

const EXAMPLE_INPUT_XSS = {
  request: {
    method: "POST",
    url: "http://localhost:8000/api/v1/user/profile",
    headers: { "Content-Type": "application/json" },
    body: {
      name: "<script>alert('XSS')</script>",
      phone: "+919876543210",
      address: "123 Main St"
    }
  },

  validation: {
    step3_injectionDetection: "FAIL - XSS pattern detected",
    blockedPattern: "/<script|javascript:|onerror|onload/i",
    detectedAt: "name field"
  },

  response: {
    status: 400,
    body: {
      success: false,
      statusCode: 400,
      data: null,
      message: "Invalid characters detected in input.",
      error: {
        type: "VALIDATION_ERROR",
        field: "name",
        reason: "Contains forbidden HTML/JavaScript content",
        securityAlert: true
      }
    }
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// EXAMPLE 4: NoSQL Injection - BLOCKED
// ─────────────────────────────────────────────────────────────────────────────

const EXAMPLE_INPUT_NOSQL_INJECTION = {
  request: {
    method: "POST",
    url: "http://localhost:8000/api/v1/auth/login",
    headers: { "Content-Type": "application/json" },
    body: {
      email: { "$ne": null },
      password: { "$ne": null }
    }
  },

  validation: {
    step3_injectionDetection: "FAIL - NoSQL injection pattern: $ne operator",
    blockedPattern: "/\\{\\s\\$|\\$where|mapReduce/i"
  },

  response: {
    status: 400,
    body: {
      success: false,
      statusCode: 400,
      data: null,
      message: "Invalid input format.",
      error: {
        type: "VALIDATION_ERROR",
        reason: "NoSQL injection pattern detected",
        securityAlert: true
      }
    }
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// EXAMPLE 5: Oversized Input - BLOCKED
// ─────────────────────────────────────────────────────────────────────────────

const EXAMPLE_INPUT_OVERSIZED = {
  request: {
    method: "POST",
    url: "http://localhost:8000/api/v1/user/profile",
    headers: { "Content-Type": "application/json" },
    body: {
      name: "Valid Name",
      phone: "+919876543210",
      address: "a".repeat(15000)  // 15,000 characters (limit is 10,000)
    }
  },

  validation: {
    step6_sizeLimits: "FAIL - String exceeds maximum length of 10000",
    fieldSize: 15000,
    maxAllowed: 10000
  },

  response: {
    status: 400,
    body: {
      success: false,
      statusCode: 400,
      data: null,
      message: "Input validation failed.",
      error: {
        type: "VALIDATION_ERROR",
        field: "address",
        reason: "Input exceeds maximum length",
        details: { received: 15000, maximum: 10000 }
      }
    }
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// 3. SECURITY HEADERS MIDDLEWARE - OWASP PROTECTION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * SECURITY HEADERS OVERVIEW
 * ═════════════════════════════════════════════════════════════════════════════
 * 
 * Purpose: Implement OWASP security headers to prevent:
 * - Clickjacking attacks (X-Frame-Options)
 * - MIME type sniffing (X-Content-Type-Options)
 * - XSS attacks (X-XSS-Protection, Content-Security-Policy)
 * - MITM attacks (HSTS, Referrer-Policy)
 * - Information disclosure (removes Server header)
 * 
 * Applied to ALL responses automatically
 */

const SECURITY_HEADERS_DETAILS = {
  headers: {
    "X-Frame-Options": {
      value: "DENY",
      description: "Prevents this site from being displayed in iframes (clickjacking protection)",
      alternatives: ["SAMEORIGIN", "ALLOW-FROM https://trusted.com"]
    },

    "X-Content-Type-Options": {
      value: "nosniff",
      description: "Prevents MIME type sniffing; Content-Type must be respected"
    },

    "X-XSS-Protection": {
      value: "1; mode=block",
      description: "Legacy XSS protection; enables browser XSS filter in blocking mode"
    },

    "Strict-Transport-Security": {
      value: "max-age=31536000; includeSubDomains; preload",
      description: "Forces HTTPS; max-age 1 year; applies to subdomains; can be preloaded",
      deployment: "Only sent over HTTPS; ensures connection cannot be downgraded to HTTP"
    },

    "Referrer-Policy": {
      value: "strict-origin-when-cross-origin",
      description: "Controls how much referrer information is shared",
      behavior: "Full referrer for same-origin, only origin for cross-origin"
    },

    "Permissions-Policy": {
      value: "accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()",
      description: "Disables access to sensitive browser APIs"
    },

    "Content-Security-Policy": {
      value: "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https:; frame-ancestors 'none'",
      description: "Comprehensive CSP restricting resource loading",
      rules: {
        "default-src": "'self' - only resources from same origin",
        "script-src": "'self' 'unsafe-inline' - scripts from same origin + inline",
        "style-src": "'self' 'unsafe-inline' - styles from same origin + inline",
        "img-src": "'self' data: https: - images from same origin, data URIs, HTTPS",
        "font-src": "'self' - fonts from same origin only",
        "connect-src": "'self' https: - fetch/WebSocket from same origin or HTTPS",
        "frame-ancestors": "'none' - cannot be framed"
      }
    },

    "Cache-Control": {
      value: "public, max-age=3600",
      description: "Default cache control for responses; overridden per endpoint"
    }
  },

  removedHeaders: [
    "Server",  // Removed to hide Express.js version
    "X-Powered-By"  // Removed to hide framework details
  ]
};

// ─────────────────────────────────────────────────────────────────────────────
// EXAMPLE: Security Headers on Response
// ─────────────────────────────────────────────────────────────────────────────

const EXAMPLE_SECURITY_HEADERS = {
  request: {
    method: "GET",
    url: "http://localhost:8000/api/v1/products/list"
  },

  response: {
    status: 200,
    headers: {
      "X-Frame-Options": "DENY",
      "X-Content-Type-Options": "nosniff",
      "X-XSS-Protection": "1; mode=block",
      "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Permissions-Policy": "accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()",
      "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https:; frame-ancestors 'none'",
      "X-Content-Length-Options": "nosniff"
    },
    body: { /* API response */ }
  },

  securityMatrix: {
    "Clickjacking Protection": "✓ X-Frame-Options: DENY",
    "MIME Sniffing Prevention": "✓ X-Content-Type-Options: nosniff",
    "XSS Protection": "✓ X-XSS-Protection + Content-Security-Policy",
    "HTTPS Enforcement": "✓ Strict-Transport-Security",
    "Referrer Information Leak": "✓ Referrer-Policy controls sharing",
    "Browser Feature Access": "✓ Permissions-Policy disables sensitive APIs",
    "Framework Detection": "✓ Server header removed",
    "Response Smuggling Prevention": "✓ Validates response format"
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// 4. REQUEST LOGGING MIDDLEWARE - AUDIT TRAIL & MONITORING
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * REQUEST LOGGING OVERVIEW
 * ═════════════════════════════════════════════════════════════════════════════
 * 
 * Purpose: Complete audit trail for security, debugging, and compliance
 * 
 * Features:
 * - Tracks all requests with method, URL, IP, auth status, response time
 * - Masks sensitive fields (passwords, tokens, credit cards)
 * - Separates regular, error, and security event logs
 * - Performance monitoring (flags requests > 1 second)
 * - Audit logging for sensitive operations
 * - In-memory storage (max 10,000 entries)
 * - Admin access via monitoring endpoints
 */

const REQUEST_LOGGING_CONFIG = {
  maxLogs: 10000,
  performanceThreshold: 1000,  // milliseconds

  // Sensitive fields that are masked in logs
  sensitiveFields: [
    "password", "token", "accessToken", "refreshToken", 
    "authorization", "creditCard", "cvv", "ssn",
    "bankAccount", "routingNumber", "secret", "apiKey"
  ],

  // Operations that get audited (logged separately)
  auditedMethods: ["POST", "PUT", "PATCH", "DELETE"],
  auditedPaths: ["/auth", "/user", "/orders", "/dashboard", "/inventory"],

  // Log format for each entry
  logEntryFormat: {
    timestamp: "ISO 8601 string",
    requestId: "UUID",
    method: "HTTP method",
    url: "Request URL",
    ip: "Client IP address",
    userId: "User ID if authenticated",
    userRole: "User role if authenticated",
    statusCode: "HTTP response status",
    responseTime: "Time in milliseconds",
    isAuthenticated: "Boolean",
    isAdmin: "Boolean",
    userAgent: "User-Agent header",
    dataSize: "Request body size in bytes"
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// EXAMPLE 1: Normal Request Log
// ─────────────────────────────────────────────────────────────────────────────

const EXAMPLE_LOG_NORMAL = {
  timestamp: "2024-04-25T14:30:45.123Z",
  requestId: "550e8400-e29b-41d4-a716-446655440000",
  method: "GET",
  url: "/api/v1/products/list?category=salt&limit=20",
  ip: "192.168.1.100",
  userId: "user123",
  userRole: "dealer",
  statusCode: 200,
  responseTime: 245,
  isAuthenticated: true,
  isAdmin: false,
  userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
  dataSize: 2048
};

// ─────────────────────────────────────────────────────────────────────────────
// EXAMPLE 2: Authentication Request Log (Sensitive Fields Masked)
// ─────────────────────────────────────────────────────────────────────────────

const EXAMPLE_LOG_AUTH_REQUEST = {
  timestamp: "2024-04-25T14:32:15.456Z",
  requestId: "660e8401-e29b-41d4-a716-446655440001",
  method: "POST",
  url: "/api/v1/auth/login",
  ip: "192.168.1.101",
  userId: null,
  userRole: null,
  statusCode: 200,
  responseTime: 580,
  isAuthenticated: false,
  isAdmin: false,
  requestBody: {
    email: "user@example.com",
    password: "***MASKED***"  // Original: "SecurePassword123!"
  },
  responseBody: {
    accessToken: "***MASKED***",  // Original: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    refreshToken: "***MASKED***"
  },
  userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0)",
  dataSize: 150
};

// ─────────────────────────────────────────────────────────────────────────────
// EXAMPLE 3: Failed Authentication (Error Log)
// ─────────────────────────────────────────────────────────────────────────────

const EXAMPLE_LOG_ERROR = {
  timestamp: "2024-04-25T14:33:22.789Z",
  requestId: "770e8402-e29b-41d4-a716-446655440002",
  method: "POST",
  url: "/api/v1/auth/login",
  ip: "192.168.1.102",
  userId: null,
  userRole: null,
  statusCode: 401,
  responseTime: 245,
  isAuthenticated: false,
  isAdmin: false,
  errorMessage: "Invalid email or password",
  errorType: "AuthenticationError",
  userAgent: "curl/7.68.0",
  dataSize: 145,
  severity: "WARNING"
};

// ─────────────────────────────────────────────────────────────────────────────
// EXAMPLE 4: Audit Log Entry (Sensitive Operation)
// ─────────────────────────────────────────────────────────────────────────────

const EXAMPLE_LOG_AUDIT = {
  timestamp: "2024-04-25T14:35:10.012Z",
  requestId: "880e8403-e29b-41d4-a716-446655440003",
  method: "POST",
  url: "/api/v1/orders",
  ip: "192.168.1.100",
  userId: "user123",
  userRole: "dealer",
  statusCode: 201,
  responseTime: 890,
  isAuthenticated: true,
  isAdmin: false,
  auditFlag: true,
  operation: "CREATE_ORDER",
  changedFields: {
    dealerId: "user123",
    totalAmount: 45000,
    itemCount: 12
  },
  userAgent: "Mobile-App/1.0",
  dataSize: 512,
  severity: "AUDIT"
};

// ─────────────────────────────────────────────────────────────────────────────
// EXAMPLE 5: Security Event Log (Flagged Activity)
// ─────────────────────────────────────────────────────────────────────────────

const EXAMPLE_LOG_SECURITY = {
  timestamp: "2024-04-25T14:36:45.345Z",
  requestId: "990e8404-e29b-41d4-a716-446655440004",
  method: "POST",
  url: "/api/v1/auth/login",
  ip: "10.20.30.40",  // Different IP = suspicious
  userId: null,
  userRole: null,
  statusCode: 429,
  responseTime: 50,
  isAuthenticated: false,
  isAdmin: false,
  securityAlert: true,
  alertType: "RATE_LIMIT_EXCEEDED",
  offenseCount: 5,
  violationReason: "Multiple failed login attempts",
  blockDuration: 3600,
  userAgent: "Unknown",
  dataSize: 120,
  severity: "CRITICAL"
};

// ─────────────────────────────────────────────────────────────────────────────
// EXAMPLE 6: Performance Monitoring Log (Slow Request)
// ─────────────────────────────────────────────────────────────────────────────

const EXAMPLE_LOG_PERFORMANCE = {
  timestamp: "2024-04-25T14:38:20.567Z",
  requestId: "aa0e8405-e29b-41d4-a716-446655440005",
  method: "GET",
  url: "/api/v1/dashboard/analytics",
  ip: "192.168.1.100",
  userId: "user123",
  userRole: "admin",
  statusCode: 200,
  responseTime: 3245,  // 3.2 seconds (exceeds 1 second threshold)
  performanceFlag: true,
  performanceCategory: "SLOW",
  recommendation: "Consider optimizing database queries or adding caching",
  isAuthenticated: true,
  isAdmin: true,
  userAgent: "Mozilla/5.0",
  dataSize: 8192
};

// ═══════════════════════════════════════════════════════════════════════════════
// 5. CACHING & COMPRESSION MIDDLEWARE - PERFORMANCE OPTIMIZATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * CACHING OVERVIEW
 * ═════════════════════════════════════════════════════════════════════════════
 * 
 * Purpose: Reduce response times, lower bandwidth usage, improve user experience
 * 
 * Components:
 * 1. Response Compression (gzip) - Reduces response size by 60-80%
 * 2. HTTP Cache-Control Headers - Browser/CDN caching
 * 3. ETags - Detect changes and serve 304 Not Modified
 * 4. Query Response Caching - In-memory cache for GET requests
 * 5. Cache Invalidation - Automatic on POST/PUT/PATCH/DELETE
 */

const CACHING_CONFIG = {
  // Gzip compression settings
  compression: {
    enabled: true,
    threshold: 1024,      // Only compress responses > 1KB
    level: 6,             // Compression level 1-9 (6 is balanced)
    expectedReduction: "60-80%"
  },

  // Cache-Control TTLs per endpoint
  cacheTTLs: {
    "/api/v1/products": 300000,         // 5 minutes
    "/api/v1/user": 60000,              // 1 minute
    "/api/v1/dashboard": 30000,         // 30 seconds
    "/api/v1/inventory": 120000,        // 2 minutes
    "POST": 0,                          // No cache for POST
    "PUT": 0,                           // No cache for PUT
    "PATCH": 0,                         // No cache for PATCH
    "DELETE": 0                         // No cache for DELETE
  },

  // Query cache settings
  queryCache: {
    maxSize: 500,         // Max entries
    ttl: 300000,          // 5 minutes default
    keyGeneration: "method + url + query params"
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// EXAMPLE 1: Compressed Response
// ─────────────────────────────────────────────────────────────────────────────

const EXAMPLE_CACHE_COMPRESSED = {
  request: {
    method: "GET",
    url: "http://localhost:8000/api/v1/dashboard/overview",
    headers: {
      "Accept-Encoding": "gzip, deflate, br"
    }
  },

  response: {
    status: 200,
    headers: {
      "Content-Encoding": "gzip",
      "Content-Length": "1024",                          // Compressed size
      "Original-Content-Length": "4096",                 // Uncompressed size
      "X-Compression-Ratio": "75%",
      "Cache-Control": "public, max-age=30, must-revalidate",
      "ETag": "\"abc123def456\""
    },
    compressionStats: {
      originalSize: 4096,
      compressedSize: 1024,
      ratio: "75% reduction",
      estimatedTime: "Saves ~30ms bandwidth at 1Mbps"
    },
    body: "[gzip compressed binary data]"
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// EXAMPLE 2: Cache Hit (304 Not Modified)
// ─────────────────────────────────────────────────────────────────────────────

const EXAMPLE_CACHE_HIT_304 = {
  firstRequest: {
    method: "GET",
    url: "http://localhost:8000/api/v1/products/list",
    headers: {}
  },

  firstResponse: {
    status: 200,
    headers: {
      "Cache-Control": "public, max-age=300",
      "ETag": "\"xyz789\"",
      "Content-Length": "2048"
    }
  },

  secondRequest: {
    method: "GET",
    url: "http://localhost:8000/api/v1/products/list",
    headers: {
      "If-None-Match": "\"xyz789\""  // ETag from first response
    },
    note: "Sent within 5 minute cache window"
  },

  secondResponse: {
    status: 304,
    statusText: "Not Modified",
    headers: {
      "ETag": "\"xyz789\""
    },
    body: "No body returned",
    benefit: "Client uses cached data; server sends no body; reduces bandwidth to ~200 bytes"
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// EXAMPLE 3: Cache Invalidation on POST
// ─────────────────────────────────────────────────────────────────────────────

const EXAMPLE_CACHE_INVALIDATION = {
  operation: "User creates new product",

  postRequest: {
    method: "POST",
    url: "http://localhost:8000/api/v1/products",
    body: {
      name: "New Salt Product",
      price: 500,
      quantity: 1000
    }
  },

  invalidationRules: {
    "/api/v1/products": "Cache invalidated (entire product list affected)",
    "/api/v1/inventory": "Cache invalidated (inventory may change)",
    "/api/v1/dashboard": "Cache invalidated (dashboard aggregates products)",
    pattern: "All GET endpoints with matching path prefix invalidated"
  },

  cacheBehavior: {
    beforePost: "GET /api/v1/products returns cached data from 4 seconds ago",
    afterPost: "Cache entry deleted; next GET /api/v1/products queries database",
    timing: "Invalidation happens within middleware, before response sent"
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// EXAMPLE 4: No Cache Headers for Sensitive Operations
// ─────────────────────────────────────────────────────────────────────────────

const EXAMPLE_CACHE_DISABLED = {
  request: {
    method: "POST",
    url: "http://localhost:8000/api/v1/orders"
  },

  response: {
    status: 201,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      "Pragma": "no-cache",
      "Expires": "0"
    },
    reason: "POST requests (mutations) should never be cached"
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// EXAMPLE 5: Cache Key Generation
// ─────────────────────────────────────────────────────────────────────────────

const EXAMPLE_CACHE_KEY_GENERATION = {
  scenario: "Multiple requests with different query parameters",

  requests: [
    {
      url: "/api/v1/products/list?category=salt&limit=20",
      cacheKey: "GET_/api/v1/products/list_category=salt&limit=20"
    },
    {
      url: "/api/v1/products/list?category=pepper&limit=50",
      cacheKey: "GET_/api/v1/products/list_category=pepper&limit=50"
    },
    {
      url: "/api/v1/products/list?category=salt&limit=50",
      cacheKey: "GET_/api/v1/products/list_category=salt&limit=50"
    }
  ],

  behavior: "Each unique query creates separate cache entry; parameter order matters",
  keyGeneration: "hash(method + URL + sorted query string)"
};

// ═══════════════════════════════════════════════════════════════════════════════
// 6. MONITORING ENDPOINTS - ADMIN ACCESS TO SECURITY & PERFORMANCE DATA
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * MONITORING ENDPOINTS OVERVIEW
 * ═════════════════════════════════════════════════════════════════════════════
 * 
 * All monitoring endpoints require:
 * - Authentication (valid JWT token)
 * - Admin role
 * 
 * Endpoints provide real-time insights into:
 * - Request logs (recent requests)
 * - Security events (rate limit violations, injection attempts)
 * - Performance metrics (slow requests, average response time)
 * - Cache statistics (hit/miss rates, memory usage)
 */

const MONITORING_ENDPOINTS = {
  // ─────────────────────────────────────────────────────────────────────────
  // ENDPOINT 1: GET /api/v1/admin/monitoring/logs
  // ─────────────────────────────────────────────────────────────────────────

  "GET /api/v1/admin/monitoring/logs": {
    description: "Retrieve recent request logs with filtering",
    authentication: "Required (JWT bearer token)",
    authorization: "Admin only",
    
    queryParameters: {
      limit: "Number of logs to return (default: 100, max: 1000)",
      offset: "Pagination offset (default: 0)",
      filter: "Filter by method, status, or userId (optional)",
      sortBy: "Sort by timestamp, responseTime, or statusCode (default: timestamp)",
      sortOrder: "asc or desc (default: desc)"
    },

    request: {
      method: "GET",
      url: "http://localhost:8000/api/v1/admin/monitoring/logs?limit=50&filter=GET&sortBy=responseTime",
      headers: {
        "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
      }
    },

    response: {
      status: 200,
      body: {
        success: true,
        statusCode: 200,
        data: {
          logs: [
            {
              timestamp: "2024-04-25T14:35:10.012Z",
              method: "GET",
              url: "/api/v1/products/list",
              statusCode: 200,
              responseTime: 245,
              ip: "192.168.1.100",
              userId: "user123"
            }
            // More logs...
          ],
          total: 250,
          limit: 50,
          offset: 0
        },
        message: "Logs retrieved successfully"
      }
    }
  },

  // ─────────────────────────────────────────────────────────────────────────
  // ENDPOINT 2: GET /api/v1/admin/monitoring/security-events
  // ─────────────────────────────────────────────────────────────────────────

  "GET /api/v1/admin/monitoring/security-events": {
    description: "Retrieve security events (rate limits, injections, etc)",
    authentication: "Required (JWT bearer token)",
    authorization: "Admin only",

    request: {
      method: "GET",
      url: "http://localhost:8000/api/v1/admin/monitoring/security-events",
      headers: {
        "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
      }
    },

    response: {
      status: 200,
      body: {
        success: true,
        statusCode: 200,
        data: {
          securityEvents: [
            {
              timestamp: "2024-04-25T14:36:45.345Z",
              type: "RATE_LIMIT_EXCEEDED",
              ip: "10.20.30.40",
              endpoint: "/api/v1/auth/login",
              severity: "CRITICAL",
              details: {
                offenseCount: 5,
                blockDuration: 3600
              }
            },
            {
              timestamp: "2024-04-25T14:35:22.789Z",
              type: "INJECTION_ATTEMPT",
              ip: "192.168.1.102",
              endpoint: "/api/v1/auth/login",
              severity: "HIGH",
              details: {
                injectionType: "SQL_INJECTION",
                blockedField: "email"
              }
            }
            // More events...
          ],
          total: 15,
          criticalCount: 3,
          highCount: 7,
          mediumCount: 5
        }
      }
    }
  },

  // ─────────────────────────────────────────────────────────────────────────
  // ENDPOINT 3: GET /api/v1/admin/monitoring/performance
  // ─────────────────────────────────────────────────────────────────────────

  "GET /api/v1/admin/monitoring/performance": {
    description: "Retrieve performance metrics and slow request analysis",
    authentication: "Required",
    authorization: "Admin only",

    response: {
      status: 200,
      body: {
        success: true,
        statusCode: 200,
        data: {
          stats: {
            totalRequests: 45230,
            averageResponseTime: 345,
            totalErrors: 120,
            totalAuthFailures: 45,
            totalValidationErrors: 23
          },
          slowRequests: [
            {
              timestamp: "2024-04-25T14:38:20.567Z",
              method: "GET",
              url: "/api/v1/dashboard/analytics",
              responseTime: 3245,
              recommendation: "Add caching or optimize database queries"
            }
          ],
          topSlowEndpoints: [
            {
              endpoint: "/api/v1/dashboard/analytics",
              averageResponseTime: 2100,
              hitCount: 45
            },
            {
              endpoint: "/api/v1/orders",
              averageResponseTime: 890,
              hitCount: 230
            }
          ]
        }
      }
    }
  },

  // ─────────────────────────────────────────────────────────────────────────
  // ENDPOINT 4: GET /api/v1/admin/monitoring/cache-stats
  // ─────────────────────────────────────────────────────────────────────────

  "GET /api/v1/admin/monitoring/cache-stats": {
    description: "Retrieve caching and compression statistics",
    authentication: "Required",
    authorization: "Admin only",

    response: {
      status: 200,
      body: {
        success: true,
        statusCode: 200,
        data: {
          queryCache: {
            size: 156,
            hits: 8945,
            misses: 1234,
            hitRate: "87.9%",
            memoryUsage: "2.4MB"
          },
          compression: {
            totalResponses: 10234,
            compressedResponses: 9876,
            compressionRate: "96.5%",
            averageReduction: "72%",
            bandwidthSaved: "145MB"
          },
          cacheInvalidations: {
            total: 234,
            byReason: {
              POST: 89,
              PUT: 67,
              DELETE: 45,
              PATCH: 33
            }
          }
        }
      }
    }
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// 7. ERROR SCENARIOS & PROPER HANDLING
// ═══════════════════════════════════════════════════════════════════════════════

const ERROR_SCENARIOS = {
  // ─────────────────────────────────────────────────────────────────────────
  // SCENARIO 1: Invalid JWT Token
  // ─────────────────────────────────────────────────────────────────────────

  "Invalid JWT Token": {
    request: {
      method: "GET",
      url: "http://localhost:8000/api/v1/admin/monitoring/logs",
      headers: {
        "Authorization": "Bearer invalid.token.here"
      }
    },

    response: {
      status: 401,
      body: {
        success: false,
        statusCode: 401,
        data: null,
        message: "Unauthorized",
        error: {
          type: "AUTHENTICATION_ERROR",
          reason: "Invalid or expired JWT token"
        }
      }
    }
  },

  // ─────────────────────────────────────────────────────────────────────────
  // SCENARIO 2: Missing Authorization Header
  // ─────────────────────────────────────────────────────────────────────────

  "Missing Authorization": {
    request: {
      method: "GET",
      url: "http://localhost:8000/api/v1/admin/monitoring/logs",
      headers: {}  // No Authorization header
    },

    response: {
      status: 401,
      body: {
        success: false,
        statusCode: 401,
        data: null,
        message: "Unauthorized",
        error: {
          type: "AUTHENTICATION_ERROR",
          reason: "Missing authorization header"
        }
      }
    }
  },

  // ─────────────────────────────────────────────────────────────────────────
  // SCENARIO 3: Dealer Trying to Access Admin Endpoint
  // ─────────────────────────────────────────────────────────────────────────

  "Insufficient Permissions": {
    request: {
      method: "GET",
      url: "http://localhost:8000/api/v1/admin/monitoring/logs",
      headers: {
        "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "note": "Token contains role: 'dealer' (not 'admin')"
      }
    },

    response: {
      status: 403,
      body: {
        success: false,
        statusCode: 403,
        data: null,
        message: "Forbidden",
        error: {
          type: "AUTHORIZATION_ERROR",
          reason: "You do not have permission to access this resource",
          requiredRole: "admin",
          userRole: "dealer"
        }
      }
    }
  },

  // ─────────────────────────────────────────────────────────────────────────
  // SCENARIO 4: Server Error (500)
  // ─────────────────────────────────────────────────────────────────────────

  "Server Error": {
    request: {
      method: "GET",
      url: "http://localhost:8000/api/v1/admin/monitoring/logs",
      headers: {
        "Authorization": "Bearer validtoken..."
      }
    },

    response: {
      status: 500,
      body: {
        success: false,
        statusCode: 500,
        data: null,
        message: "Internal Server Error",
        error: {
          type: "SERVER_ERROR",
          reason: "An unexpected error occurred while retrieving logs",
          requestId: "550e8400-e29b-41d4-a716-446655440000"
        }
      }
    }
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// 8. INTEGRATION SUMMARY & MIDDLEWARE STACK ORDER
// ═══════════════════════════════════════════════════════════════════════════════

const MIDDLEWARE_INTEGRATION = {
  stackOrder: [
    "1. securityHeadersMiddleware - Apply OWASP headers to all responses",
    "2. requestLoggingMiddleware - Start logging all requests",
    "3. rateLimiterMiddleware - Check rate limits (may return 429)",
    "4. compressionMiddleware - Gzip compress large responses",
    "5. inputValidationMiddleware - Validate and sanitize inputs",
    "6. CORS setup - Allow cross-origin requests",
    "7. Body parsers (JSON, URL-encoded) - Parse request body",
    "8. Cache-Control headers - Set default caching behavior",
    "9. Query caching - Cache GET request responses",
    "10. cacheInvalidationMiddleware - Clear cache on mutations"
  ],

  importanceOfOrder: "Middleware stack order is CRITICAL. Security headers must be first to apply to all responses. Rate limiting must come before input validation to reject abusive requests early. Logging should be early to catch all requests including those that fail later middleware.",

  bypassScenarios: {
    healthCheck: "/health endpoint bypasses all middleware",
    errorRoutes: "Error handling middleware at end of stack",
    staticFiles: "Static file serving bypasses most middleware",
    publicRoutes: "/auth/register, /auth/login skip some auth checks but not security headers"
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// 9. TESTING STRATEGIES & VERIFICATION
// ═══════════════════════════════════════════════════════════════════════════════

const TESTING_STRATEGIES = {
  rateLimiterTests: [
    "Test normal requests within limits",
    "Test exceeding limit and receiving 429",
    "Test exponential backoff progression",
    "Test admin bypass of rate limits",
    "Test different endpoint limits"
  ],

  inputValidationTests: [
    "Test valid inputs pass through",
    "Test SQL injection attempts blocked",
    "Test XSS attack attempts blocked",
    "Test NoSQL injection attempts blocked",
    "Test command injection attempts blocked",
    "Test oversized input rejected"
  ],

  securityHeadersTests: [
    "Verify all OWASP headers present",
    "Verify Content-Security-Policy enforced",
    "Verify Server header removed",
    "Verify Strict-Transport-Security on HTTPS"
  ],

  loggingTests: [
    "Verify sensitive fields masked",
    "Verify all requests logged",
    "Verify performance flagging works",
    "Verify audit logs captured"
  ],

  cachingTests: [
    "Test gzip compression enabled",
    "Test cache hit returns 304",
    "Test cache miss returns 200",
    "Test cache invalidation on POST",
    "Test no cache on sensitive operations"
  ]
};

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORT: Complete Phase 7 API Documentation
// ═══════════════════════════════════════════════════════════════════════════════

export const PHASE7_API_GUIDE = {
  rateLimiter: RATE_LIMITER_CONFIG,
  inputValidation: INPUT_VALIDATION_CONFIG,
  securityHeaders: SECURITY_HEADERS_DETAILS,
  requestLogging: REQUEST_LOGGING_CONFIG,
  caching: CACHING_CONFIG,
  monitoring: MONITORING_ENDPOINTS,
  errorScenarios: ERROR_SCENARIOS,
  integration: MIDDLEWARE_INTEGRATION,
  testing: TESTING_STRATEGIES,
  examples: {
    rateLimiter: {
      normal: EXAMPLE_RATE_LIMITER_NORMAL,
      exceeded1: EXAMPLE_RATE_LIMITER_EXCEEDED_1,
      exponential: EXAMPLE_RATE_LIMITER_EXPONENTIAL,
      adminBypass: EXAMPLE_RATE_LIMITER_ADMIN_BYPASS
    },
    inputValidation: {
      valid: EXAMPLE_INPUT_VALID,
      sqlInjection: EXAMPLE_INPUT_SQL_INJECTION,
      xss: EXAMPLE_INPUT_XSS,
      noSqlInjection: EXAMPLE_INPUT_NOSQL_INJECTION,
      oversized: EXAMPLE_INPUT_OVERSIZED
    },
    securityHeaders: EXAMPLE_SECURITY_HEADERS,
    logging: {
      normal: EXAMPLE_LOG_NORMAL,
      auth: EXAMPLE_LOG_AUTH_REQUEST,
      error: EXAMPLE_LOG_ERROR,
      audit: EXAMPLE_LOG_AUDIT,
      security: EXAMPLE_LOG_SECURITY,
      performance: EXAMPLE_LOG_PERFORMANCE
    },
    caching: {
      compressed: EXAMPLE_CACHE_COMPRESSED,
      hit304: EXAMPLE_CACHE_HIT_304,
      invalidation: EXAMPLE_CACHE_INVALIDATION,
      disabled: EXAMPLE_CACHE_DISABLED,
      keyGeneration: EXAMPLE_CACHE_KEY_GENERATION
    }
  }
};

console.log("✓ PHASE 7 API GUIDE - Complete security and optimization documentation loaded");
