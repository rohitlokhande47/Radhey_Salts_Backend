import { Router } from "express";
import { verifyJWT } from "../middlewares/jwt.middleware.js";
import { verifyAdminRole } from "../middlewares/rbac.middleware.js";
import {
  getDashboardOverview,
  getSalesAnalytics,
  getInventoryAnalytics,
  getOrderAnalytics,
  getDealerPerformance,
  getSystemHealth,
  getPurchasingRecommendations,
  getTrendForecast,
  getExecutiveReport,
  getCustomReport
} from "../controllers/dashboard.controller.js";

const router = Router();

/**
 * PHASE 6: ADMIN DASHBOARD & ANALYTICS ROUTES
 * ═════════════════════════════════════════════════════
 * 10 admin-only endpoints for comprehensive analytics
 * Authentication: JWT required
 * Authorization: Admin role required
 */

// ─────────────────────────────────────────────────────
// 1. DASHBOARD OVERVIEW
// ─────────────────────────────────────────────────────
router.get(
  "/overview",
  verifyJWT,
  verifyAdminRole,
  getDashboardOverview
);

// ─────────────────────────────────────────────────────
// 2. SALES ANALYTICS
// ─────────────────────────────────────────────────────
router.get(
  "/sales/analytics",
  verifyJWT,
  verifyAdminRole,
  getSalesAnalytics
);

// ─────────────────────────────────────────────────────
// 3. INVENTORY ANALYTICS
// ─────────────────────────────────────────────────────
router.get(
  "/inventory/analytics",
  verifyJWT,
  verifyAdminRole,
  getInventoryAnalytics
);

// ─────────────────────────────────────────────────────
// 4. ORDER ANALYTICS
// ─────────────────────────────────────────────────────
router.get(
  "/orders/analytics",
  verifyJWT,
  verifyAdminRole,
  getOrderAnalytics
);

// ─────────────────────────────────────────────────────
// 5. DEALER PERFORMANCE
// ─────────────────────────────────────────────────────
router.get(
  "/dealers/performance",
  verifyJWT,
  verifyAdminRole,
  getDealerPerformance
);

// ─────────────────────────────────────────────────────
// 6. SYSTEM HEALTH
// ─────────────────────────────────────────────────────
router.get(
  "/system/health",
  verifyJWT,
  verifyAdminRole,
  getSystemHealth
);

// ─────────────────────────────────────────────────────
// 7. PURCHASING RECOMMENDATIONS
// ─────────────────────────────────────────────────────
router.get(
  "/recommendations/purchase",
  verifyJWT,
  verifyAdminRole,
  getPurchasingRecommendations
);

// ─────────────────────────────────────────────────────
// 8. TREND FORECAST
// ─────────────────────────────────────────────────────
router.get(
  "/trends/forecast",
  verifyJWT,
  verifyAdminRole,
  getTrendForecast
);

// ─────────────────────────────────────────────────────
// 9. EXECUTIVE REPORT
// ─────────────────────────────────────────────────────
router.get(
  "/report/executive",
  verifyJWT,
  verifyAdminRole,
  getExecutiveReport
);

// ─────────────────────────────────────────────────────
// 10. CUSTOM REPORT BUILDER
// ─────────────────────────────────────────────────────
router.post(
  "/report/custom",
  verifyJWT,
  verifyAdminRole,
  getCustomReport
);

export default router;
