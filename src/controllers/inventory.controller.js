/**
 * ═══════════════════════════════════════════════════════════════════════════
 * INVENTORY CONTROLLER - PHASE 5
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Inventory management system with:
 * - Stock reconstruction from InventoryLedger
 * - Discrepancy detection algorithms
 * - Reorder level automation
 * - Inventory adjustments with audit trail
 * - Historical analytics & reporting
 * - Compliance audit support
 */

import Product from "../models/product.model.js";
import InventoryLedger from "../models/inventoryLedger.model.js";
import AuditLog from "../models/auditLog.model.js";
import Order from "../models/orders.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";

// ═════════════════════════════════════════════════════════════════════════
// FUNCTION 1: GET CURRENT INVENTORY SNAPSHOT
// ═════════════════════════════════════════════════════════════════════════

export const getInventorySnapshot = asyncHandler(async (req, res) => {
  /**
   * Get current inventory state for all products
   * Returns: Current stock quantities, reorder levels, status
   */

  const products = await Product.find({ isActive: true }).select(
    "_id name category stockQty MOQ reorderLevel"
  );

  const snapshot = await Promise.all(
    products.map(async (product) => {
      const reorderStatus =
        product.stockQty <= product.reorderLevel ? "critical" : "normal";
      return {
        productId: product._id,
        productName: product.name,
        category: product.category,
        currentStock: product.stockQty,
        MOQ: product.MOQ,
        reorderLevel: product.reorderLevel,
        status: reorderStatus,
        requiresReorder: product.stockQty <= product.reorderLevel,
      };
    })
  );

  const criticalCount = snapshot.filter((s) => s.status === "critical").length;
  const totalValue = snapshot.reduce(
    (sum, s) => sum + s.currentStock * 200,
    0
  ); // Approximate value

  return res.status(200).json(
    new ApiResponse(200, {
      snapshot,
      summary: {
        totalProducts: snapshot.length,
        productsInStock: snapshot.filter((s) => s.currentStock > 0).length,
        lowStockCount: criticalCount,
        approximateInventoryValue: totalValue,
        snapshotAt: new Date(),
      },
    })
  );
});

// ═════════════════════════════════════════════════════════════════════════
// FUNCTION 2: RECONSTRUCT STOCK FROM LEDGER
// ═════════════════════════════════════════════════════════════════════════

export const reconstructStockFromLedger = asyncHandler(async (req, res) => {
  /**
   * Rebuild current stock quantities from immutable InventoryLedger
   * Used for: Verification, discrepancy detection, data recovery
   * Returns: Reconstructed quantities vs current quantities
   */

  const { productId } = req.params;

  const product = await Product.findById(productId);
  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  // Get all ledger entries for this product
  const ledgerEntries = await InventoryLedger.find({ productId }).sort({
    createdAt: 1,
  });

  // Reconstruct stock from ledger
  let reconstructedQty = 0;
  const ledgerSummary = {
    totalDebits: 0,
    totalCredits: 0,
    debitsCount: 0,
    creditsCount: 0,
  };

  ledgerEntries.forEach((entry) => {
    if (entry.changeType === "debit") {
      reconstructedQty -= entry.quantityChanged;
      ledgerSummary.totalDebits += entry.quantityChanged;
      ledgerSummary.debitsCount += 1;
    } else if (entry.changeType === "credit") {
      reconstructedQty += entry.quantityChanged;
      ledgerSummary.totalCredits += entry.quantityChanged;
      ledgerSummary.creditsCount += 1;
    }
  });

  const currentQty = product.stockQty;
  const discrepancy = currentQty - reconstructedQty;
  const isAccurate = discrepancy === 0;

  return res.status(200).json(
    new ApiResponse(200, {
      productId: product._id,
      productName: product.name,
      reconstruction: {
        currentDatabaseQty: currentQty,
        reconstructedQty,
        discrepancy,
        isAccurate,
        accuracy: ((Math.abs(discrepancy) / currentQty) * 100).toFixed(2) + "%",
      },
      ledgerSummary,
      totalEntries: ledgerEntries.length,
      lastEntryAt: ledgerEntries.length > 0 ? ledgerEntries[ledgerEntries.length - 1].createdAt : null,
    })
  );
});

// ═════════════════════════════════════════════════════════════════════════
// FUNCTION 3: DETECT INVENTORY DISCREPANCIES
// ═════════════════════════════════════════════════════════════════════════

export const detectDiscrepancies = asyncHandler(async (req, res) => {
  /**
   * Scan all products for stock discrepancies
   * Used for: Inventory audits, data integrity checks
   * Returns: List of products with mismatches
   */

  const products = await Product.find({ isActive: true });
  const discrepancies = [];

  for (const product of products) {
    const ledgerEntries = await InventoryLedger.find({
      productId: product._id,
    });

    let reconstructedQty = 0;
    ledgerEntries.forEach((entry) => {
      if (entry.changeType === "debit") {
        reconstructedQty -= entry.quantityChanged;
      } else {
        reconstructedQty += entry.quantityChanged;
      }
    });

    const discrepancy = product.stockQty - reconstructedQty;

    if (discrepancy !== 0) {
      discrepancies.push({
        productId: product._id,
        productName: product.name,
        currentQty: product.stockQty,
        reconstructedQty,
        discrepancy,
        severity:
          Math.abs(discrepancy) > 100 ? "high" : "low",
        percentageDiff: (
          (Math.abs(discrepancy) / product.stockQty) *
          100
        ).toFixed(2),
        lastLedgerEntry:
          ledgerEntries.length > 0
            ? ledgerEntries[ledgerEntries.length - 1].createdAt
            : null,
      });
    }
  }

  // Log audit trail
  await AuditLog.create({
    action: "INVENTORY_DISCREPANCY_CHECK",
    actorId: req.user._id,
    targetCollection: "products",
    context: {
      productsChecked: products.length,
      discrepanciesFound: discrepancies.length,
    },
    status: "success",
    ipAddress: req.ip,
  });

  return res.status(200).json(
    new ApiResponse(200, {
      discrepancies,
      summary: {
        totalProductsChecked: products.length,
        discrepanciesFound: discrepancies.length,
        highSeverity: discrepancies.filter((d) => d.severity === "high").length,
        lowSeverity: discrepancies.filter((d) => d.severity === "low").length,
        scannedAt: new Date(),
      },
    })
  );
});

// ═════════════════════════════════════════════════════════════════════════
// FUNCTION 4: SET REORDER LEVEL
// ═════════════════════════════════════════════════════════════════════════

export const setReorderLevel = asyncHandler(async (req, res) => {
  /**
   * Set reorder level (alert threshold) for product
   * When stock <= reorderLevel, product appears in low-stock alerts
   */

  const { productId } = req.params;
  const { reorderLevel, notes } = req.body;

  if (reorderLevel === undefined || reorderLevel < 0) {
    throw new ApiError(400, "Valid reorder level required");
  }

  const product = await Product.findByIdAndUpdate(
    productId,
    { reorderLevel },
    { new: true }
  );

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  // Log change
  await AuditLog.create({
    action: "REORDER_LEVEL_UPDATED",
    actorId: req.user._id,
    targetCollection: "products",
    targetId: product._id,
    beforeSnapshot: { reorderLevel: product.reorderLevel },
    afterSnapshot: { reorderLevel },
    context: { productName: product.name, notes },
    status: "success",
    ipAddress: req.ip,
  });

  return res.status(200).json(
    new ApiResponse(200, {
      productId: product._id,
      productName: product.name,
      reorderLevel,
      currentStock: product.stockQty,
      requiresReorder: product.stockQty <= reorderLevel,
    })
  );
});

// ═════════════════════════════════════════════════════════════════════════
// FUNCTION 5: ADJUST STOCK (MANUAL ADJUSTMENT)
// ═════════════════════════════════════════════════════════════════════════

export const adjustStock = asyncHandler(async (req, res) => {
  /**
   * Manually adjust stock quantity with reason and audit trail
   * Used for: Damaged goods, corrections, physical count adjustments
   * Creates new InventoryLedger entry and AuditLog
   */

  const { productId } = req.params;
  const { adjustment, reason, notes } = req.body;

  if (adjustment === undefined || adjustment === 0) {
    throw new ApiError(400, "Valid adjustment value required (non-zero)");
  }

  const validReasons = [
    "physical_count_correction",
    "damaged_goods",
    "expired_goods",
    "miscount_correction",
    "return_from_dealer",
    "inventory_error",
    "other",
  ];

  if (!validReasons.includes(reason)) {
    throw new ApiError(400, `Invalid reason. Must be one of: ${validReasons.join(", ")}`);
  }

  const product = await Product.findById(productId);
  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  const previousQty = product.stockQty;
  const newQty = previousQty + adjustment;

  if (newQty < 0) {
    throw new ApiError(
      400,
      `Cannot adjust to negative stock. Current: ${previousQty}, Adjustment: ${adjustment}`
    );
  }

  // Update product stock
  await Product.findByIdAndUpdate(productId, { stockQty: newQty });

  // Create ledger entry
  const ledgerEntry = await InventoryLedger.create({
    productId,
    changeType: adjustment > 0 ? "credit" : "debit",
    quantityChanged: Math.abs(adjustment),
    previousQty,
    newQty,
    reason: "manual_adjustment",
    adjustmentReason: reason,
    notes,
    triggeredBy: req.user._id,
    triggeredByType: "Admin",
  });

  // Create audit log
  await AuditLog.create({
    action: "INVENTORY_ADJUSTED",
    actorId: req.user._id,
    targetCollection: "products",
    targetId: product._id,
    beforeSnapshot: { stockQty: previousQty },
    afterSnapshot: { stockQty: newQty },
    context: {
      productName: product.name,
      adjustment,
      reason,
      notes,
      ledgerId: ledgerEntry._id,
    },
    status: "success",
    ipAddress: req.ip,
  });

  return res.status(200).json(
    new ApiResponse(200, {
      productId,
      productName: product.name,
      previousQty,
      newQty,
      adjustment,
      reason,
      notes,
      ledgerEntry,
    })
  );
});

// ═════════════════════════════════════════════════════════════════════════
// FUNCTION 6: GET INVENTORY HISTORY
// ═════════════════════════════════════════════════════════════════════════

export const getInventoryHistory = asyncHandler(async (req, res) => {
  /**
   * Get historical inventory movements for product
   * Includes: All debits/credits, timestamps, reasons, actors
   */

  const { productId } = req.params;
  const { startDate, endDate, limit = 50, page = 1 } = req.query;

  const product = await Product.findById(productId);
  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  const query = { productId };

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  const skip = (page - 1) * limit;
  const totalEntries = await InventoryLedger.countDocuments(query);

  const history = await InventoryLedger.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  return res.status(200).json(
    new ApiResponse(200, {
      productId,
      productName: product.name,
      history,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalEntries / limit),
        totalEntries,
        entriesPerPage: parseInt(limit),
      },
      summary: {
        totalDebits: history
          .filter((h) => h.changeType === "debit")
          .reduce((sum, h) => sum + h.quantityChanged, 0),
        totalCredits: history
          .filter((h) => h.changeType === "credit")
          .reduce((sum, h) => sum + h.quantityChanged, 0),
        netChange:
          history
            .filter((h) => h.changeType === "credit")
            .reduce((sum, h) => sum + h.quantityChanged, 0) -
          history
            .filter((h) => h.changeType === "debit")
            .reduce((sum, h) => sum + h.quantityChanged, 0),
      },
    })
  );
});

// ═════════════════════════════════════════════════════════════════════════
// FUNCTION 7: GET LOW STOCK ALERTS
// ═════════════════════════════════════════════════════════════════════════

export const getLowStockAlerts = asyncHandler(async (req, res) => {
  /**
   * Get all products at or below reorder level
   * Returns: Products needing restock with quantity details
   */

  const { severity = "all" } = req.query;

  const query = {
    isActive: true,
  };

  const products = await Product.find(query).select(
    "name category stockQty MOQ reorderLevel pricingTiers"
  );

  const alerts = products
    .filter((p) => p.stockQty <= p.reorderLevel)
    .map((p) => {
      const stockoutDays = Math.ceil(p.stockQty / p.MOQ);
      const alertSeverity =
        p.stockQty === 0 ? "critical" : p.stockQty <= p.reorderLevel / 2
          ? "high"
          : "medium";

      return {
        productId: p._id,
        productName: p.name,
        category: p.category,
        currentStock: p.stockQty,
        MOQ: p.MOQ,
        reorderLevel: p.reorderLevel,
        stockoutDaysAtMOQ: stockoutDays,
        severity: alertSeverity,
        recommendedOrderQty: Math.max(p.MOQ * 5, p.reorderLevel * 2),
        unitPrice: p.pricingTiers[0]?.price || 0,
      };
    })
    .sort((a, b) => {
      const severityOrder = { critical: 0, high: 1, medium: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });

  const filtered =
    severity === "all"
      ? alerts
      : alerts.filter((a) => a.severity === severity);

  return res.status(200).json(
    new ApiResponse(200, {
      alerts: filtered,
      summary: {
        totalLowStock: alerts.length,
        critical: alerts.filter((a) => a.severity === "critical").length,
        high: alerts.filter((a) => a.severity === "high").length,
        medium: alerts.filter((a) => a.severity === "medium").length,
        alertsAt: new Date(),
      },
    })
  );
});

// ═════════════════════════════════════════════════════════════════════════
// FUNCTION 8: GET INVENTORY REPORT
// ═════════════════════════════════════════════════════════════════════════

export const getInventoryReport = asyncHandler(async (req, res) => {
  /**
   * Comprehensive inventory analytics and reporting
   * Includes: Value, turnover, alerts, metrics
   */

  const { period = "monthly" } = req.query;

  const products = await Product.find({ isActive: true });

  // Calculate inventory metrics
  const report = {
    period,
    generatedAt: new Date(),
    products: products.map((p) => ({
      productId: p._id,
      productName: p.name,
      category: p.category,
      stockQty: p.stockQty,
      MOQ: p.MOQ,
      reorderLevel: p.reorderLevel,
      estimatedValue: p.stockQty * (p.pricingTiers[0]?.price || 0),
      status:
        p.stockQty === 0
          ? "out_of_stock"
          : p.stockQty <= p.reorderLevel
            ? "low_stock"
            : "normal",
    })),
  };

  const totalValue = report.products.reduce((sum, p) => sum + p.estimatedValue, 0);
  const outOfStock = report.products.filter((p) => p.status === "out_of_stock").length;
  const lowStock = report.products.filter((p) => p.status === "low_stock").length;

  report.summary = {
    totalProducts: report.products.length,
    productsInStock: report.products.filter((p) => p.stockQty > 0).length,
    outOfStock,
    lowStock,
    totalInventoryValue: totalValue,
    averageProductValue: (totalValue / report.products.length).toFixed(2),
  };

  // Log report generation
  await AuditLog.create({
    action: "INVENTORY_REPORT_GENERATED",
    actorId: req.user._id,
    targetCollection: "products",
    context: {
      period,
      productsReported: report.products.length,
      totalValue,
    },
    status: "success",
    ipAddress: req.ip,
  });

  return res.status(200).json(new ApiResponse(200, report));
});

// ═════════════════════════════════════════════════════════════════════════
// FUNCTION 9: GET AUDIT TRAIL
// ═════════════════════════════════════════════════════════════════════════

export const getAuditTrail = asyncHandler(async (req, res) => {
  /**
   * Get complete audit trail for inventory operations
   * Shows: Who did what, when, and why
   */

  const { startDate, endDate, action, limit = 100, page = 1 } = req.query;

  const query = {
    targetCollection: "products",
  };

  if (action) {
    query.action = action;
  }

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  const skip = (page - 1) * limit;
  const totalLogs = await AuditLog.countDocuments(query);

  const logs = await AuditLog.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .populate("actorId", "email businessName");

  return res.status(200).json(
    new ApiResponse(200, {
      logs,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalLogs / limit),
        totalLogs,
        logsPerPage: parseInt(limit),
      },
    })
  );
});

// ═════════════════════════════════════════════════════════════════════════
// FUNCTION 10: PERFORM INVENTORY AUDIT
// ═════════════════════════════════════════════════════════════════════════

export const performInventoryAudit = asyncHandler(async (req, res) => {
  /**
   * Comprehensive inventory audit procedure
   * Checks: All discrepancies, accuracy, compliance
   */

  const auditId = `AUDIT-${Date.now()}`;
  const products = await Product.find({ isActive: true });
  const auditResults = {
    auditId,
    startedAt: new Date(),
    productsAudited: 0,
    discrepanciesFound: 0,
    accuracyRate: 0,
    results: [],
  };

  for (const product of products) {
    const ledgerEntries = await InventoryLedger.find({
      productId: product._id,
    });

    let reconstructedQty = 0;
    ledgerEntries.forEach((entry) => {
      if (entry.changeType === "debit") {
        reconstructedQty -= entry.quantityChanged;
      } else {
        reconstructedQty += entry.quantityChanged;
      }
    });

    const discrepancy = product.stockQty - reconstructedQty;
    const isAccurate = discrepancy === 0;

    auditResults.productsAudited += 1;
    if (!isAccurate) auditResults.discrepanciesFound += 1;

    if (!isAccurate) {
      auditResults.results.push({
        productId: product._id,
        productName: product.name,
        currentQty: product.stockQty,
        reconstructedQty,
        discrepancy,
        severity: Math.abs(discrepancy) > 100 ? "high" : "low",
      });
    }
  }

  auditResults.completedAt = new Date();
  auditResults.accuracyRate = (
    ((auditResults.productsAudited - auditResults.discrepanciesFound) /
      auditResults.productsAudited) *
    100
  ).toFixed(2);
  auditResults.auditStatus =
    auditResults.discrepanciesFound === 0 ? "passed" : "found_issues";

  // Log audit
  await AuditLog.create({
    action: "INVENTORY_AUDIT_COMPLETED",
    actorId: req.user._id,
    targetCollection: "products",
    context: {
      auditId,
      productsAudited: auditResults.productsAudited,
      discrepanciesFound: auditResults.discrepanciesFound,
      accuracyRate: auditResults.accuracyRate,
      status: auditResults.auditStatus,
    },
    status: "success",
    ipAddress: req.ip,
  });

  return res.status(200).json(new ApiResponse(200, auditResults));
});

export default {
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
};
