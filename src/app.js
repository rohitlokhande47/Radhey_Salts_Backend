import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import swaggerSpecs from "./config/swagger.js";
import errorHandler from "./middlewares/errorHandler.js";
import { rateLimiterMiddleware, strictRateLimiter } from "./middlewares/rateLimiter.js";
import { inputValidationMiddleware, strictInputValidation } from "./middlewares/inputValidator.js";
import { allSecurityHeaders } from "./middlewares/securityHeaders.js";
import { allLoggingMiddleware } from "./middlewares/requestLogger.js";
import { compressionMiddleware, cacheControlMiddleware, queryCachingMiddleware, cacheInvalidationMiddleware } from "./middlewares/caching.js";

const app = express();

// PHASE 7: Security & Optimization Middleware Stack (in order of execution)
// 1. Security Headers (prevents attacks)
app.use(allSecurityHeaders);

// 2. Logging (monitors all requests)
app.use(allLoggingMiddleware);

// 3. Rate Limiting (prevents abuse)
app.use(rateLimiterMiddleware);

// 4. Compression (reduces response size)
app.use(compressionMiddleware);

// 5. Input Validation (sanitizes inputs)
app.use(inputValidationMiddleware);

// CORS Configuration
app.use(
    cors({
        origin: process.env.CORS_ORIGIN || "*",
        credentials: true,
    })
);

// Body Parsers
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

// Cache Control Headers
app.use(cacheControlMiddleware);

// Query Result Caching
app.use(queryCachingMiddleware);

// Static Files
app.use(express.static("uploads"));

// Health Check Route
app.get("/api/v1/health", (req, res) => {
    res.json({ status: "✅ Server is running" });
});

// ═══════════════════════════════════════════════════════════════════════════════
// SWAGGER UI - Interactive API Documentation
// ═══════════════════════════════════════════════════════════════════════════════
// Access at: http://localhost:8000/api-docs
app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpecs, {
        swaggerOptions: {
            persistAuthorization: true,
            displayOperationId: true
        },
        customCss: ".swagger-ui .topbar { display: none }",
        customSiteTitle: "Radhe Salt Backend API Documentation"
    })
);

// Swagger JSON Endpoint
app.get("/swagger.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpecs);
});

// Import Rate Limiter & Logger for monitoring
import { limiter } from "./middlewares/rateLimiter.js";
import { requestLogger } from "./middlewares/requestLogger.js";
import { queryCache } from "./middlewares/caching.js";

// Admin Monitoring Endpoints (metrics and logs)
app.get("/api/v1/admin/monitoring/rate-limits", (req, res) => {
    const stats = limiter.getStats();
    res.json({ success: true, data: stats });
});

app.get("/api/v1/admin/monitoring/logs", (req, res) => {
    const count = req.query.count || 100;
    const logs = requestLogger.getRecentLogs(parseInt(count));
    res.json({ success: true, count: logs.length, data: logs });
});

app.get("/api/v1/admin/monitoring/security-events", (req, res) => {
    const count = req.query.count || 50;
    const events = requestLogger.getSecurityEvents(parseInt(count));
    res.json({ success: true, count: events.length, data: events });
});

app.get("/api/v1/admin/monitoring/performance", (req, res) => {
    const stats = requestLogger.getStats();
    res.json({ success: true, data: stats });
});

app.get("/api/v1/admin/monitoring/cache", (req, res) => {
    const cacheStats = queryCache.getStats();
    res.json({ success: true, data: cacheStats });
});

// Import Routes
import authRoute from "./routes/auth.route.js";
import userRoute from "./routes/user.route.js";
import productRoute from "./routes/product.route.js";
import orderRoute from "./routes/order.route.js";
import inventoryRoute from "./routes/inventory.route.js";
import dashboardRoute from "./routes/dashboard.route.js";

// Cache Invalidation Middleware (before routes to catch modifications)
app.use(cacheInvalidationMiddleware);

// Routes Declaration
app.use("/api/v1/auth", authRoute);
app.use("/api/v1/user", userRoute);
app.use("/api/v1/products", productRoute);
app.use("/api/v1/orders", orderRoute);
app.use("/api/v1/inventory", inventoryRoute);
app.use("/api/v1/dashboard", dashboardRoute);

// 404 Handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found",
        statusCode: 404,
    });
});

// Error Handler Middleware (must be last)
app.use(errorHandler);

export { app };
