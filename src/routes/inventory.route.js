/**
 * ═══════════════════════════════════════════════════════════════════════════
 * INVENTORY ROUTES - PHASE 5
 * ═══════════════════════════════════════════════════════════════════════════
 */

import express from "express";
import {
  getInventorySnapshot,
  reconstructStockFromLedger,
  detectDiscrepancies,
  setReorderLevel,
  adjustStock,
  getInventoryHistory,
  getLowStockAlerts,
  getInventoryReport,
  getAuditTrail,
  performInventoryAudit,
} from "../controllers/inventory.controller.js";
import { verifyJWT } from "../middlewares/jwt.middleware.js";
import { verifyAdminRole } from "../middlewares/rbac.middleware.js";

const router = express.Router();

// ═════════════════════════════════════════════════════════════════════════
// INVENTORY MANAGEMENT ENDPOINTS
// ═════════════════════════════════════════════════════════════════════════

/**
 * ENDPOINT 1: GET INVENTORY SNAPSHOT
 * Purpose: Current state of all products
 * Auth: Admin
 */
router.get("/snapshot", verifyJWT, verifyAdminRole, getInventorySnapshot);

/**
 * ENDPOINT 2: RECONSTRUCT STOCK FROM LEDGER
 * Purpose: Rebuild stock from immutable ledger
 * Auth: Admin
 */
router.get(
  "/:productId/reconstruct",
  verifyJWT,
  verifyAdminRole,
  reconstructStockFromLedger
);

/**
 * ENDPOINT 3: DETECT DISCREPANCIES
 * Purpose: Scan all products for stock mismatches
 * Auth: Admin
 */
router.get(
  "/scan/discrepancies",
  verifyJWT,
  verifyAdminRole,
  detectDiscrepancies
);

/**
 * ENDPOINT 4: SET REORDER LEVEL
 * Purpose: Configure reorder threshold for product
 * Auth: Admin
 */
router.put(
  "/:productId/reorder-level",
  verifyJWT,
  verifyAdminRole,
  setReorderLevel
);

/**
 * ENDPOINT 5: ADJUST STOCK
 * Purpose: Manual stock adjustment with audit trail
 * Auth: Admin
 */
router.post(
  "/:productId/adjust",
  verifyJWT,
  verifyAdminRole,
  adjustStock
);

/**
 * ENDPOINT 6: GET INVENTORY HISTORY
 * Purpose: Historical ledger movements for product
 * Auth: Admin
 */
router.get(
  "/:productId/history",
  verifyJWT,
  verifyAdminRole,
  getInventoryHistory
);

/**
 * ENDPOINT 7: GET LOW STOCK ALERTS
 * Purpose: Products at or below reorder level
 * Auth: Admin
 */
router.get(
  "/alerts/low-stock",
  verifyJWT,
  verifyAdminRole,
  getLowStockAlerts
);

/**
 * ENDPOINT 8: GET INVENTORY REPORT
 * Purpose: Comprehensive analytics & reporting
 * Auth: Admin
 */
router.get(
  "/report/analytics",
  verifyJWT,
  verifyAdminRole,
  getInventoryReport
);

/**
 * ENDPOINT 9: GET AUDIT TRAIL
 * Purpose: Complete operation history
 * Auth: Admin
 */
router.get(
  "/audit/trail",
  verifyJWT,
  verifyAdminRole,
  getAuditTrail
);

/**
 * ENDPOINT 10: PERFORM INVENTORY AUDIT
 * Purpose: Full inventory verification
 * Auth: Admin
 */
router.post(
  "/audit/perform",
  verifyJWT,
  verifyAdminRole,
  performInventoryAudit
);

export default router;
