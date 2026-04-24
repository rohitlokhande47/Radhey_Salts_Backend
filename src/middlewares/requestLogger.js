/**
 * PHASE 7: API Security & Optimization
 * Request Logging & Monitoring Middleware
 *
 * Tracks:
 * - All incoming requests (method, URL, IP, auth status)
 * - Response times and status codes
 * - Errors and exceptions
 * - Security events (auth failures, validation errors)
 * - Performance metrics
 * - Sensitive data masking (passwords, tokens)
 *
 * Features:
 * - Structured JSON logging
 * - Performance profiling
 * - Error tracking
 * - Security audit trail
 * - In-memory log storage for monitoring
 * - Automatic log rotation
 */

/**
 * Request Logger Store
 * Maintains in-memory log of recent requests for monitoring
 */
class RequestLoggerStore {
  constructor(maxLogs = 10000) {
    this.logs = [];
    this.maxLogs = maxLogs;
    this.stats = {
      totalRequests: 0,
      totalErrors: 0,
      totalAuthFailures: 0,
      totalValidationErrors: 0,
      averageResponseTime: 0,
      statusCodeCounts: {},
    };
    this.errorLog = [];
    this.securityLog = [];
  }

  /**
   * Add log entry
   */
  addLog(logEntry) {
    this.logs.push(logEntry);

    // Rotate logs if exceeds max
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Update stats
    this.stats.totalRequests++;
    this.stats.statusCodeCounts[logEntry.statusCode] = (this.stats.statusCodeCounts[logEntry.statusCode] || 0) + 1;

    if (logEntry.statusCode >= 400) {
      this.stats.totalErrors++;
    }

    // Calculate average response time
    const allResponseTimes = this.logs.map((l) => l.responseTime);
    this.stats.averageResponseTime =
      allResponseTimes.reduce((a, b) => a + b, 0) / allResponseTimes.length;
  }

  /**
   * Log security event
   */
  logSecurityEvent(event) {
    const securityEvent = {
      timestamp: new Date().toISOString(),
      ...event,
    };
    this.securityLog.push(securityEvent);

    if (this.securityLog.length > 1000) {
      this.securityLog.shift();
    }

    if (event.type === "auth_failure") {
      this.stats.totalAuthFailures++;
    } else if (event.type === "validation_error") {
      this.stats.totalValidationErrors++;
    }
  }

  /**
   * Log error
   */
  logError(errorEntry) {
    this.errorLog.push({
      timestamp: new Date().toISOString(),
      ...errorEntry,
    });

    if (this.errorLog.length > 1000) {
      this.errorLog.shift();
    }
  }

  /**
   * Get recent logs
   */
  getRecentLogs(count = 100) {
    return this.logs.slice(-count);
  }

  /**
   * Get security events
   */
  getSecurityEvents(count = 100) {
    return this.securityLog.slice(-count);
  }

  /**
   * Get error logs
   */
  getErrorLogs(count = 100) {
    return this.errorLog.slice(-count);
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      ...this.stats,
      totalLogs: this.logs.length,
      totalSecurityEvents: this.securityLog.length,
      totalErrors: this.errorLog.length,
    };
  }

  /**
   * Clear logs
   */
  clearLogs() {
    this.logs = [];
    this.errorLog = [];
    this.securityLog = [];
  }
}

// Global logger instance
const requestLogger = new RequestLoggerStore();

/**
 * Mask sensitive information in logs
 */
const maskSensitiveData = (obj) => {
  if (!obj || typeof obj !== "object") return obj;

  const masked = JSON.parse(JSON.stringify(obj));
  const sensitiveFields = [
    "password",
    "token",
    "accessToken",
    "refreshToken",
    "authorization",
    "creditCard",
    "cvv",
    "ssn",
    "apiKey",
    "secret",
  ];

  const maskValue = (value) => {
    if (typeof value === "object" && value !== null) {
      Object.keys(value).forEach((key) => {
        if (sensitiveFields.some((field) => key.toLowerCase().includes(field.toLowerCase()))) {
          value[key] = "***MASKED***";
        } else {
          maskValue(value[key]);
        }
      });
    }
  };

  maskValue(masked);
  return masked;
};

/**
 * Request Logging Middleware
 * Logs all incoming requests and their responses
 */
export const requestLoggingMiddleware = (req, res, next) => {
  // Skip logging for health check
  if (req.path === "/api/v1/health") {
    return next();
  }

  const startTime = Date.now();
  const requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Store request ID for later use
  res.locals.requestId = requestId;
  req.requestId = requestId;

  // Capture the original res.end to log response
  const originalEnd = res.end;

  res.end = function (chunk, encoding) {
    const responseTime = Date.now() - startTime;

    // Parse response body if JSON
    let responseBody = null;
    if (chunk && typeof chunk === "string") {
      try {
        responseBody = JSON.parse(chunk);
      } catch (e) {
        responseBody = chunk.substring(0, 200); // Limit response logging
      }
    }

    // Create log entry
    const logEntry = {
      requestId,
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.originalUrl,
      path: req.path,
      statusCode: res.statusCode,
      responseTime,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.headers["user-agent"],
      userId: req.user?._id || "anonymous",
      userRole: req.user?.role || "public",
    };

    // Log request body (masked)
    if (req.body && Object.keys(req.body).length > 0) {
      logEntry.requestBody = maskSensitiveData(req.body);
    }

    // Add to logger store
    requestLogger.addLog(logEntry);

    // Log security events for sensitive operations
    if (res.statusCode >= 400) {
      requestLogger.logSecurityEvent({
        type: "http_error",
        statusCode: res.statusCode,
        path: req.path,
        method: req.method,
        ip: req.ip,
      });
    }

    // Log to console in development
    if (process.env.NODE_ENV === "development") {
      const color =
        res.statusCode >= 500
          ? "\x1b[41m"
          : res.statusCode >= 400
            ? "\x1b[43m"
            : res.statusCode >= 300
              ? "\x1b[44m"
              : "\x1b[42m";
      const reset = "\x1b[0m";

      console.log(
        `${color}${res.statusCode}${reset} ${req.method} ${req.path} - ${responseTime}ms - ${req.ip}`
      );
    }

    // Call original end
    res.end = originalEnd;
    res.end(chunk, encoding);
  };

  next();
};

/**
 * Error Logging Middleware
 * Logs all errors that occur during request processing
 */
export const errorLoggingMiddleware = (req, res, next) => {
  // Override res.json to catch API errors
  const originalJson = res.json;

  res.json = function (data) {
    // Log if error response
    if (data && !data.success && data.statusCode >= 400) {
      const errorEntry = {
        requestId: req.requestId,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
        statusCode: data.statusCode,
        message: data.message,
        error: data.error,
        userId: req.user?._id || "anonymous",
        ip: req.ip,
      };

      requestLogger.logError(errorEntry);

      // Log security events for auth errors
      if (data.statusCode === 401 || data.statusCode === 403) {
        requestLogger.logSecurityEvent({
          type: "auth_failure",
          path: req.path,
          ip: req.ip,
          userId: req.user?._id || "anonymous",
          message: data.message,
        });
      }

      // Log validation errors
      if (data.statusCode === 400 && data.message.includes("validation")) {
        requestLogger.logSecurityEvent({
          type: "validation_error",
          path: req.path,
          ip: req.ip,
          error: data.error,
        });
      }
    }

    return originalJson.call(this, data);
  };

  next();
};

/**
 * Performance Monitoring Middleware
 * Tracks slow requests (> 1 second)
 */
export const performanceMonitoringMiddleware = (req, res, next) => {
  const startTime = Date.now();
  const originalSend = res.send;

  res.send = function (data) {
    const responseTime = Date.now() - startTime;

    // Flag slow requests
    if (responseTime > 1000) {
      console.warn(`⚠️  Slow request: ${req.method} ${req.path} took ${responseTime}ms`);

      requestLogger.logSecurityEvent({
        type: "slow_request",
        path: req.path,
        responseTime,
        threshold: 1000,
      });
    }

    return originalSend.call(this, data);
  };

  next();
};

/**
 * Audit Logger Middleware
 * Logs sensitive operations for compliance
 */
export const auditLoggingMiddleware = (req, res, next) => {
  // Audit sensitive operations
  const auditPaths = [
    "/api/v1/auth/login",
    "/api/v1/auth/register",
    "/api/v1/user",
    "/api/v1/orders",
    "/api/v1/dashboard",
    "/api/v1/inventory",
  ];

  const shouldAudit = auditPaths.some((path) => req.path.includes(path));

  if (shouldAudit && (req.method === "POST" || req.method === "PUT" || req.method === "PATCH" || req.method === "DELETE")) {
    requestLogger.logSecurityEvent({
      type: "audit_trail",
      operation: `${req.method} ${req.path}`,
      userId: req.user?._id || "anonymous",
      userRole: req.user?.role || "public",
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });
  }

  next();
};

/**
 * Combined Logging Middleware (all in one)
 */
export const allLoggingMiddleware = (req, res, next) => {
  requestLoggingMiddleware(req, res, () => {
    errorLoggingMiddleware(req, res, () => {
      performanceMonitoringMiddleware(req, res, () => {
        auditLoggingMiddleware(req, res, next);
      });
    });
  });
};

/**
 * Export logger instance for monitoring endpoints
 */
export { requestLogger };

export default requestLoggingMiddleware;
