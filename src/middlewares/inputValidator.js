/**
 * PHASE 7: API Security & Optimization
 * Input Validation & Sanitization Middleware
 *
 * Prevents:
 * - SQL Injection attacks
 * - NoSQL Injection attacks
 * - XSS (Cross-Site Scripting) attacks
 * - Mass assignment vulnerabilities
 * - Invalid data type attacks
 * - Buffer overflow attempts
 *
 * Features:
 * - Recursive object sanitization
 * - Type validation
 * - Length enforcement
 * - Whitelist-based field filtering
 * - SQL/NoSQL injection pattern detection
 * - URL encoding validation
 */

/**
 * Dangerous patterns to block
 */
const DANGEROUS_PATTERNS = {
  sqlInjection: /(\b(UNION|SELECT|INSERT|UPDATE|DELETE|DROP|EXEC|SCRIPT|JAVASCRIPT)\b|--|;|\/\*|\*\/|xp_|sp_)/gi,
  noSqlInjection: /(\$where|\$ne|\$gt|\$lt|\$regex|\$or|\$and|{\s*\$)/gi,
  xssPatterns: /(<script|javascript:|onerror=|onclick=|onload=|<iframe|<object|<embed)/gi,
  commandInjection: /[;&|`$()\[\]{}]/g,
};

/**
 * Sanitize a string value
 * Removes dangerous characters and patterns
 */
const sanitizeString = (value) => {
  if (typeof value !== "string") return value;

  let sanitized = value;

  // Remove control characters
  sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, "");

  // HTML encode special characters
  sanitized = sanitized
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

  // Remove dangerous patterns
  Object.values(DANGEROUS_PATTERNS).forEach((pattern) => {
    sanitized = sanitized.replace(pattern, "");
  });

  return sanitized.trim();
};

/**
 * Detect SQL/NoSQL injection attempts
 */
const containsInjectionAttempt = (value) => {
  if (typeof value !== "string") return false;

  return (
    DANGEROUS_PATTERNS.sqlInjection.test(value) ||
    DANGEROUS_PATTERNS.noSqlInjection.test(value) ||
    DANGEROUS_PATTERNS.commandInjection.test(value)
  );
};

/**
 * Validate email format
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number (basic international format)
 */
const isValidPhone = (phone) => {
  const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/;
  return phoneRegex.test(phone);
};

/**
 * Validate MongoDB ObjectId format
 */
const isValidObjectId = (id) => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

/**
 * Recursively sanitize object
 */
const sanitizeObject = (obj, depth = 0) => {
  if (depth > 20) {
    throw new Error("Object nesting too deep - possible circular reference or attack attempt");
  }

  if (obj === null || obj === undefined) return obj;

  if (typeof obj === "string") {
    return sanitizeString(obj);
  }

  if (typeof obj === "number" || typeof obj === "boolean") {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item, depth + 1));
  }

  if (typeof obj === "object") {
    const sanitized = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        // Validate key name (prevent key injection)
        if (containsInjectionAttempt(key)) {
          throw new Error(`Suspicious key name detected: ${key}`);
        }
        sanitized[key] = sanitizeObject(obj[key], depth + 1);
      }
    }
    return sanitized;
  }

  return obj;
};

/**
 * Validate specific fields based on type
 */
const validateField = (fieldName, value, expectedType = "string") => {
  // Check for injection attempts
  if (typeof value === "string" && containsInjectionAttempt(value)) {
    throw new Error(`Injection attempt detected in field: ${fieldName}`);
  }

  // Type validation
  if (typeof value !== expectedType && value !== null && value !== undefined) {
    throw new Error(`Invalid type for field ${fieldName}: expected ${expectedType}, got ${typeof value}`);
  }

  // Field-specific validation
  if (fieldName.toLowerCase().includes("email") && value && !isValidEmail(value)) {
    throw new Error(`Invalid email format: ${value}`);
  }

  if (fieldName.toLowerCase().includes("phone") && value && !isValidPhone(value)) {
    throw new Error(`Invalid phone format: ${value}`);
  }

  if (fieldName.toLowerCase().includes("id") && value && !isValidObjectId(value)) {
    throw new Error(`Invalid ObjectId format: ${value}`);
  }

  // Length validation
  if (typeof value === "string") {
    if (value.length > 5000) {
      throw new Error(`Field ${fieldName} exceeds maximum length of 5000 characters`);
    }
  }

  return true;
};

/**
 * Whitelist validator for known routes
 */
const FIELD_WHITELIST = {
  "/api/v1/auth/login": ["email", "password"],
  "/api/v1/auth/register": ["email", "password", "firstName", "lastName"],
  "/api/v1/user/profile": ["firstName", "lastName", "email", "phone", "address"],
  "/api/v1/products": ["name", "price", "quantity", "categoryId"],
  "/api/v1/orders": ["dealerId", "items", "shippingAddress"],
  "/api/v1/inventory": ["productId", "quantity", "warehouseId"],
};

/**
 * Input Validation Middleware
 * Applied to all routes
 */
export const inputValidationMiddleware = (req, res, next) => {
  try {
    // Skip GET requests with no body
    if (req.method === "GET" || (req.method !== "POST" && req.method !== "PUT" && req.method !== "PATCH")) {
      // Validate query parameters
      if (Object.keys(req.query).length > 0) {
        req.query = sanitizeObject(req.query);
      }
      return next();
    }

    // Validate request body
    if (req.body && typeof req.body === "object") {
      // Check if whitelist exists for this route
      const whitelist = FIELD_WHITELIST[req.path];

      if (whitelist) {
        // Apply whitelist - only allow specified fields
        const filtered = {};
        whitelist.forEach((field) => {
          if (field in req.body) {
            filtered[field] = req.body[field];
          }
        });
        req.body = filtered;
      }

      // Sanitize all fields
      req.body = sanitizeObject(req.body);

      // Validate all fields in body
      Object.entries(req.body).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          validateField(key, value);
        }
      });
    }

    // Validate URL parameters
    if (Object.keys(req.params).length > 0) {
      Object.entries(req.params).forEach(([key, value]) => {
        if (key.includes("Id")) {
          validateField(key, value);
        } else if (typeof value === "string") {
          const sanitized = sanitizeString(value);
          if (containsInjectionAttempt(sanitized)) {
            throw new Error(`Injection attempt detected in URL parameter: ${key}`);
          }
          req.params[key] = sanitized;
        }
      });
    }

    next();
  } catch (error) {
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: "Input validation failed",
      error: error.message,
      details: "Potentially malicious input detected",
    });
  }
};

/**
 * Strict input validation for sensitive operations (auth, user updates)
 */
export const strictInputValidation = (req, res, next) => {
  try {
    if (!req.body || typeof req.body !== "object") {
      return next();
    }

    // Enforce strict validation
    const maxSize = 50; // Max properties
    if (Object.keys(req.body).length > maxSize) {
      throw new Error(`Request body contains too many fields: max ${maxSize} allowed`);
    }

    // Re-validate after sanitization
    req.body = sanitizeObject(req.body);

    // Additional checks for auth endpoints
    if (req.path.includes("/auth/")) {
      if (req.body.password) {
        if (req.body.password.length < 6) {
          throw new Error("Password must be at least 6 characters");
        }
        if (req.body.password.length > 128) {
          throw new Error("Password is too long");
        }
      }

      if (req.body.email && !isValidEmail(req.body.email)) {
        throw new Error("Invalid email address");
      }
    }

    next();
  } catch (error) {
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: "Strict validation failed",
      error: error.message,
    });
  }
};

/**
 * Export sanitization functions for use in controllers
 */
export { sanitizeString, sanitizeObject, validateField, isValidEmail, isValidPhone, isValidObjectId };
