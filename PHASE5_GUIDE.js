/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PHASE 5: INVENTORY MANAGEMENT SYSTEM - COMPLETE API REFERENCE
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * This comprehensive guide documents all 10 inventory management endpoints:
 * - Stock reconstruction from immutable ledger
 * - Discrepancy detection algorithms
 * - Reorder level management
 * - Manual inventory adjustments
 * - Historical analytics & reporting
 * - Compliance audit support
 */

// ═══════════════════════════════════════════════════════════════════════════
// ENDPOINT 1: GET INVENTORY SNAPSHOT
// ═══════════════════════════════════════════════════════════════════════════

const ENDPOINT_1_SNAPSHOT = `
╔════════════════════════════════════════════════════════════════════════╗
║          ENDPOINT 1: GET INVENTORY SNAPSHOT                            ║
║          GET /api/v1/inventory/snapshot                                ║
╚════════════════════════════════════════════════════════════════════════╝

AUTHENTICATION: Required (JWT Bearer Token)
AUTHORIZATION:  Admin only
PURPOSE: Get current state of all products

REQUEST:
  GET /api/v1/inventory/snapshot
  Authorization: Bearer <ADMIN_JWT>

RESPONSE (200 OK):
{
  "success": true,
  "data": {
    "snapshot": [
      {
        "productId": "507f...",
        "productName": "SALT-001",
        "category": "bulk_salt",
        "currentStock": 500,
        "MOQ": 100,
        "reorderLevel": 200,
        "status": "normal",
        "requiresReorder": false
      },
      {
        "productId": "507f...",
        "productName": "SALT-003",
        "category": "industrial",
        "currentStock": 150,
        "MOQ": 200,
        "reorderLevel": 300,
        "status": "critical",
        "requiresReorder": true
      }
    ],
    "summary": {
      "totalProducts": 10,
      "productsInStock": 8,
      "lowStockCount": 2,
      "approximateInventoryValue": 450000,
      "snapshotAt": "2026-04-24T10:00:00Z"
    }
  }
}

BUSINESS LOGIC:
  1. Fetch all active products
  2. For each product:
     ├─ Get current stock quantity
     ├─ Compare to reorderLevel
     ├─ Determine status (critical|normal)
     └─ Flag if requires reorder
  3. Calculate inventory metrics
  4. Return comprehensive snapshot
`;

// ═══════════════════════════════════════════════════════════════════════════
// ENDPOINT 2: RECONSTRUCT STOCK FROM LEDGER
// ═══════════════════════════════════════════════════════════════════════════

const ENDPOINT_2_RECONSTRUCT = `
╔════════════════════════════════════════════════════════════════════════╗
║       ENDPOINT 2: RECONSTRUCT STOCK FROM LEDGER                        ║
║       GET /api/v1/inventory/:productId/reconstruct                     ║
╚════════════════════════════════════════════════════════════════════════╝

AUTHENTICATION: Required (JWT Bearer Token)
AUTHORIZATION:  Admin only
PURPOSE: Rebuild current stock from immutable InventoryLedger

REQUEST:
  GET /api/v1/inventory/507f1f77bcf86cd799439011/reconstruct
  Authorization: Bearer <ADMIN_JWT>

RESPONSE (200 OK):
{
  "success": true,
  "data": {
    "productId": "507f...",
    "productName": "SALT-001",
    "reconstruction": {
      "currentDatabaseQty": 500,
      "reconstructedQty": 500,
      "discrepancy": 0,
      "isAccurate": true,
      "accuracy": "100.00%"
    },
    "ledgerSummary": {
      "totalDebits": 3500,
      "totalCredits": 2000,
      "debitsCount": 8,
      "creditsCount": 3
    },
    "totalEntries": 11,
    "lastEntryAt": "2026-04-24T09:30:00Z"
  }
}

USE CASES:
  ✓ Data recovery: Verify current stock vs ledger
  ✓ Audit verification: Check for discrepancies
  ✓ Compliance: Prove stock accuracy
  ✓ Troubleshooting: Find stock issues
`;

// ═══════════════════════════════════════════════════════════════════════════
// ENDPOINT 3: DETECT DISCREPANCIES
// ═══════════════════════════════════════════════════════════════════════════

const ENDPOINT_3_DETECT_DISCREPANCIES = `
╔════════════════════════════════════════════════════════════════════════╗
║         ENDPOINT 3: DETECT INVENTORY DISCREPANCIES                     ║
║         GET /api/v1/inventory/scan/discrepancies                       ║
╚════════════════════════════════════════════════════════════════════════╝

AUTHENTICATION: Required (JWT Bearer Token)
AUTHORIZATION:  Admin only
PURPOSE: Scan all products for stock mismatches

REQUEST:
  GET /api/v1/inventory/scan/discrepancies
  Authorization: Bearer <ADMIN_JWT>

RESPONSE (200 OK):
{
  "success": true,
  "data": {
    "discrepancies": [
      {
        "productId": "507f...",
        "productName": "SALT-002",
        "currentQty": 500,
        "reconstructedQty": 480,
        "discrepancy": 20,
        "severity": "low",
        "percentageDiff": "4.00%",
        "lastLedgerEntry": "2026-04-24T08:00:00Z"
      },
      {
        "productId": "507f...",
        "productName": "SALT-004",
        "currentQty": 200,
        "reconstructedQty": 50,
        "discrepancy": 150,
        "severity": "high",
        "percentageDiff": "75.00%",
        "lastLedgerEntry": "2026-04-23T12:00:00Z"
      }
    ],
    "summary": {
      "totalProductsChecked": 15,
      "discrepanciesFound": 2,
      "highSeverity": 1,
      "lowSeverity": 1,
      "scannedAt": "2026-04-24T10:00:00Z"
    }
  }
}

ALERTS DEFINITION:
  - High Severity: Discrepancy > 100 units
  - Low Severity: Discrepancy <= 100 units

ACTIONS ON DISCREPANCIES:
  ✓ Investigate root cause
  ✓ Use reconstructStock to verify
  ✓ Consider adjustStock to correct
  ✓ Review recent orders/cancellations
`;

// ═══════════════════════════════════════════════════════════════════════════
// ENDPOINT 4: SET REORDER LEVEL
// ═══════════════════════════════════════════════════════════════════════════

const ENDPOINT_4_SET_REORDER = `
╔════════════════════════════════════════════════════════════════════════╗
║              ENDPOINT 4: SET REORDER LEVEL                             ║
║              PUT /api/v1/inventory/:productId/reorder-level            ║
╚════════════════════════════════════════════════════════════════════════╝

AUTHENTICATION: Required (JWT Bearer Token)
AUTHORIZATION:  Admin only
PURPOSE: Configure reorder threshold for product

REQUEST:
  PUT /api/v1/inventory/507f1f77bcf86cd799439011/reorder-level
  Authorization: Bearer <ADMIN_JWT>
  Content-Type: application/json

REQUEST BODY:
{
  "reorderLevel": 300,
  "notes": "Increased from 200 due to higher demand"
}

RESPONSE (200 OK):
{
  "success": true,
  "data": {
    "productId": "507f...",
    "productName": "SALT-001",
    "reorderLevel": 300,
    "currentStock": 500,
    "requiresReorder": false
  }
}

REORDER LEVEL BEHAVIOR:
  - When stock <= reorderLevel: Product appears in low-stock alerts
  - Used for automatic purchasing recommendations
  - Recommended: 2-4 weeks of expected sales
  
AUDIT TRAIL:
  ✓ Change logged in AuditLog
  ✓ Before/after values recorded
  ✓ Admin ID and timestamp captured
`;

// ═══════════════════════════════════════════════════════════════════════════
// ENDPOINT 5: ADJUST STOCK
// ═══════════════════════════════════════════════════════════════════════════

const ENDPOINT_5_ADJUST_STOCK = `
╔════════════════════════════════════════════════════════════════════════╗
║               ENDPOINT 5: ADJUST STOCK (MANUAL)                        ║
║               POST /api/v1/inventory/:productId/adjust                 ║
╚════════════════════════════════════════════════════════════════════════╝

AUTHENTICATION: Required (JWT Bearer Token)
AUTHORIZATION:  Admin only
PURPOSE: Manually adjust stock with reason and audit trail

REQUEST:
  POST /api/v1/inventory/507f1f77bcf86cd799439011/adjust
  Authorization: Bearer <ADMIN_JWT>
  Content-Type: application/json

REQUEST BODY:
{
  "adjustment": -50,  // Negative = reduction, Positive = increase
  "reason": "damaged_goods",
  "notes": "50 units damaged in shipment, reference: RMA-12345"
}

VALID REASONS:
  - physical_count_correction: Correcting count mismatch
  - damaged_goods: Items damaged (cannot be sold)
  - expired_goods: Items expired (must be discarded)
  - miscount_correction: Previous count was wrong
  - return_from_dealer: Dealer returned items
  - inventory_error: System or process error
  - other: Other reason (notes required)

RESPONSE (200 OK):
{
  "success": true,
  "data": {
    "productId": "507f...",
    "productName": "SALT-001",
    "previousQty": 500,
    "newQty": 450,
    "adjustment": -50,
    "reason": "damaged_goods",
    "notes": "50 units damaged in shipment, reference: RMA-12345",
    "ledgerEntry": {
      "_id": "507f...",
      "changeType": "debit",
      "quantityChanged": 50,
      "previousQty": 500,
      "newQty": 450,
      "reason": "manual_adjustment"
    }
  }
}

AUDIT TRAIL CREATED:
  ✓ InventoryLedger entry (debit or credit)
  ✓ AuditLog entry with reason
  ✓ Admin ID and timestamp
  ✓ IP address recorded

VALIDATION:
  ✗ Cannot adjust to negative stock
  ✗ Adjustment cannot be zero
  ✗ Invalid reasons rejected
`;

// ═══════════════════════════════════════════════════════════════════════════
// ENDPOINT 6: GET INVENTORY HISTORY
// ═══════════════════════════════════════════════════════════════════════════

const ENDPOINT_6_HISTORY = `
╔════════════════════════════════════════════════════════════════════════╗
║            ENDPOINT 6: GET INVENTORY HISTORY                           ║
║            GET /api/v1/inventory/:productId/history                    ║
╚════════════════════════════════════════════════════════════════════════╝

AUTHENTICATION: Required (JWT Bearer Token)
AUTHORIZATION:  Admin only
PURPOSE: Get historical inventory movements

REQUEST:
  GET /api/v1/inventory/507f.../history?\\
      startDate=2026-04-01&\\
      endDate=2026-04-30&\\
      limit=50&\\
      page=1
  Authorization: Bearer <ADMIN_JWT>

RESPONSE (200 OK):
{
  "success": true,
  "data": {
    "productId": "507f...",
    "productName": "SALT-001",
    "history": [
      {
        "_id": "507f...",
        "changeType": "debit",
        "quantityChanged": 500,
        "previousQty": 1000,
        "newQty": 500,
        "reason": "order_placed",
        "createdAt": "2026-04-24T10:00:00Z"
      },
      {
        "_id": "507f...",
        "changeType": "credit",
        "quantityChanged": 50,
        "previousQty": 500,
        "newQty": 550,
        "reason": "order_cancellation",
        "createdAt": "2026-04-24T12:00:00Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "totalEntries": 15
    },
    "summary": {
      "totalDebits": 500,
      "totalCredits": 50,
      "netChange": -450
    }
  }
}

QUERY PARAMETERS:
  - startDate: ISO date (optional)
  - endDate: ISO date (optional)
  - limit: entries per page (default: 50)
  - page: page number (default: 1)

SUMMARY CALCULATIONS:
  ✓ Total units debited (sold/used)
  ✓ Total units credited (returned/restored)
  ✓ Net change since start date
`;

// ═══════════════════════════════════════════════════════════════════════════
// ENDPOINT 7: GET LOW STOCK ALERTS
// ═══════════════════════════════════════════════════════════════════════════

const ENDPOINT_7_LOW_STOCK = `
╔════════════════════════════════════════════════════════════════════════╗
║             ENDPOINT 7: GET LOW STOCK ALERTS                           ║
║             GET /api/v1/inventory/alerts/low-stock                     ║
╚════════════════════════════════════════════════════════════════════════╝

AUTHENTICATION: Required (JWT Bearer Token)
AUTHORIZATION:  Admin only
PURPOSE: Get all products at or below reorder level

REQUEST:
  GET /api/v1/inventory/alerts/low-stock?severity=all
  Authorization: Bearer <ADMIN_JWT>

QUERY PARAMETERS:
  - severity: "all" | "critical" | "high" | "medium" (default: all)

RESPONSE (200 OK):
{
  "success": true,
  "data": {
    "alerts": [
      {
        "productId": "507f...",
        "productName": "SALT-001",
        "category": "bulk_salt",
        "currentStock": 0,
        "MOQ": 100,
        "reorderLevel": 200,
        "stockoutDaysAtMOQ": 0,
        "severity": "critical",
        "recommendedOrderQty": 1000,
        "unitPrice": 200
      },
      {
        "productId": "507f...",
        "productName": "SALT-003",
        "category": "industrial",
        "currentStock": 150,
        "MOQ": 200,
        "reorderLevel": 300,
        "stockoutDaysAtMOQ": 0,
        "severity": "high",
        "recommendedOrderQty": 1200,
        "unitPrice": 150
      }
    ],
    "summary": {
      "totalLowStock": 10,
      "critical": 2,
      "high": 3,
      "medium": 5,
      "alertsAt": "2026-04-24T10:00:00Z"
    }
  }
}

SEVERITY LEVELS:
  - Critical: Stock = 0 (immediate action needed)
  - High: Stock <= 50% of reorderLevel
  - Medium: Stock > 50% but <= reorderLevel

RECOMMENDED ORDER QTY:
  ✓ Suggested quantity = max(MOQ × 5, reorderLevel × 2)
  ✓ Ensures minimum safety stock
  ✓ Balances storage with cost
`;

// ═══════════════════════════════════════════════════════════════════════════
// ENDPOINTS 8-10: REPORTING & AUDIT
// ═════════════════════════════════════════════════════════════════════════

const ADDITIONAL_ENDPOINTS = `
╔════════════════════════════════════════════════════════════════════════╗
║              ENDPOINTS 8-10: REPORTING & AUDIT                         ║
╚════════════════════════════════════════════════════════════════════════╝

ENDPOINT 8: GET INVENTORY REPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GET /api/v1/inventory/report/analytics?period=monthly

Purpose: Comprehensive inventory analytics
Returns: Product-level metrics, value calculations, status breakdown
Auth: Admin only

Response includes:
  - Individual product valuations
  - Total inventory value
  - Out of stock products
  - Low stock products
  - Average product value

ENDPOINT 9: GET AUDIT TRAIL
━━━━━━━━━━━━━━━━━━━━━━━━━
GET /api/v1/inventory/audit/trail?action=INVENTORY_ADJUSTED&page=1

Purpose: View all inventory operations history
Returns: Who did what, when, and why
Auth: Admin only

Queryable by:
  - Action type (INVENTORY_ADJUSTED, REORDER_LEVEL_UPDATED, etc.)
  - Date range
  - Actor (admin)

ENDPOINT 10: PERFORM INVENTORY AUDIT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
POST /api/v1/inventory/audit/perform

Purpose: Complete inventory verification
Returns: Audit results, discrepancies, accuracy rate
Auth: Admin only

Process:
  1. Scan all active products
  2. Reconstruct stock from ledger
  3. Check for discrepancies
  4. Generate accuracy report
  5. Log audit results
`;

export {
  ENDPOINT_1_SNAPSHOT,
  ENDPOINT_2_RECONSTRUCT,
  ENDPOINT_3_DETECT_DISCREPANCIES,
  ENDPOINT_4_SET_REORDER,
  ENDPOINT_5_ADJUST_STOCK,
  ENDPOINT_6_HISTORY,
  ENDPOINT_7_LOW_STOCK,
  ADDITIONAL_ENDPOINTS,
};
