/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PHASE 5: INVENTORY MANAGEMENT - VISUAL FLOW DIAGRAMS
 * ═══════════════════════════════════════════════════════════════════════════
 */

const PHASE5_FLOW_DIAGRAMS = {
  // ═════════════════════════════════════════════════════════════════════
  // FLOW 1: STOCK RECONSTRUCTION FROM LEDGER
  // ═════════════════════════════════════════════════════════════════════
  stockReconstructionFlow: `
    ┌─────────────────────────────────────────────────────────────────┐
    │        FLOW 1: STOCK RECONSTRUCTION FROM LEDGER                 │
    └─────────────────────────────────────────────────────────────────┘

    Admin Request:
      ├─ "Verify stock accuracy for SALT-001"
      └─ GET /api/v1/inventory/SALT-001/reconstruct
           │
           ↓
    ┌──────────────────────────────────────────────────────────────────┐
    │  API Handler: reconstructStockFromLedger()                      │
    ├──────────────────────────────────────────────────────────────────┤
    │  1. Find product: SALT-001 (currentQty = 500)                   │
    │  2. Fetch all InventoryLedger entries for SALT-001              │
    │  3. Initialize: reconstructedQty = 0                             │
    └──────────────────────────────────────────────────────────────────┘
           │
           ├─ Process Ledger Entries (Chronological)
           │
           ├─ Entry 1: Debit 1000 kg (initial stock)
           │  └─ reconstructedQty = 0 - 1000 = -1000 ✓
           │
           ├─ Entry 2: Debit 500 kg (order placed)
           │  └─ reconstructedQty = -1000 - 500 = -1500 ✓
           │
           ├─ Entry 3: Credit 50 kg (order cancelled)
           │  └─ reconstructedQty = -1500 + 50 = -1450 ✓
           │
           ├─ Entry 4: Debit 150 kg (another order)
           │  └─ reconstructedQty = -1450 - 150 = -1600 ✓
           │
           ├─ Entry 5: Credit 100 kg (return)
           │  └─ reconstructedQty = -1600 + 100 = -1500 ✓
           │
           └─ ... (continue for all entries)
                │
                ↓ Final: reconstructedQty = 500

    Comparison:
      Current DB: 500 kg
      Reconstructed: 500 kg
      Discrepancy: 0 kg
      Status: ✓ ACCURATE (100%)

    Ledger Summary:
      Total Debits: 1,650 kg (4 entries)
      Total Credits: 150 kg (2 entries)
      Net: -1,500 kg (starting 2000 → current 500)

    Response:
      ├─ Current: 500 kg
      ├─ Reconstructed: 500 kg
      ├─ Discrepancy: 0 (accurate)
      └─ Accuracy: 100%

    Admin Conclusion:
      ✓ Stock verified accurate
      ✓ All ledger entries consistent
      ✓ No missing/extra inventory
      ✓ Ready for next operations
  `,

  // ═════════════════════════════════════════════════════════════════════
  // FLOW 2: DETECT DISCREPANCIES
  // ═════════════════════════════════════════════════════════════════════
  discrepancyDetectionFlow: `
    ┌─────────────────────────────────────────────────────────────────┐
    │       FLOW 2: DETECT INVENTORY DISCREPANCIES                    │
    └─────────────────────────────────────────────────────────────────┘

    Admin Initiates Audit:
      └─ GET /api/v1/inventory/scan/discrepancies

    System Process:
      │
      ├─ Step 1: Fetch all active products (10 total)
      │
      ├─ Step 2: For each product, reconstruct stock
      │  │
      │  ├─ SALT-001: Current 500 vs Reconstructed 500 ✓
      │  ├─ SALT-002: Current 350 vs Reconstructed 360 ✗ (-10)
      │  ├─ SALT-003: Current 200 vs Reconstructed 200 ✓
      │  ├─ SALT-004: Current 100 vs Reconstructed 250 ✗ (-150)
      │  ├─ SALT-005: Current 450 vs Reconstructed 450 ✓
      │  ├─ SALT-006: Current 600 vs Reconstructed 600 ✓
      │  ├─ SALT-007: Current 150 vs Reconstructed 150 ✓
      │  ├─ SALT-008: Current 300 vs Reconstructed 300 ✓
      │  ├─ SALT-009: Current 75 vs Reconstructed 75 ✓
      │  └─ SALT-010: Current 80 vs Reconstructed 80 ✓
      │
      ├─ Step 3: Identify discrepancies
      │  │
      │  ├─ Discrepancy 1: SALT-002
      │  │  ├─ Diff: -10 kg (2.8%)
      │  │  ├─ Severity: LOW
      │  │  └─ Cause: Possibly rounding or measurement error
      │  │
      │  └─ Discrepancy 2: SALT-004
      │     ├─ Diff: -150 kg (60%)
      │     ├─ Severity: HIGH
      │     └─ Cause: Possible: Lost order, damaged goods, system error
      │
      ├─ Step 4: Log audit
      │  └─ AuditLog: 10 products checked, 2 discrepancies found
      │
      ↓

    Alert Dashboard:
      ┌────────────────────────────────────────────────────┐
      │  Discrepancies Found: 2                            │
      ├────────────────────────────────────────────────────┤
      │  HIGH SEVERITY (Immediate Action)                  │
      │  ├─ SALT-004: Missing 150 kg (60% of 250 kg)     │
      │  │  └─ Action: Investigate order history, check   │
      │  │     cancellations, physical count              │
      │  │                                                  │
      │  LOW SEVERITY (Monitor)                            │
      │  ├─ SALT-002: Missing 10 kg (2.8% of 360 kg)     │
      │  │  └─ Action: Monitor for trend, recount         │
      │  │                                                  │
      │  ACCURATE (No Issues)                              │
      │  └─ 8 products: Perfect accuracy                  │
      └────────────────────────────────────────────────────┘

    Admin Actions:
      1. For SALT-004 (high severity):
         ├─ Check recent orders (look for cancellations)
         ├─ Review manual adjustments
         ├─ Physical count verification
         └─ Use reconstructStock to confirm
      
      2. For SALT-002 (low severity):
         └─ Monitor, recount at next audit
      
      3. Document findings
         └─ Reference in compliance audit trail
  `,

  // ═════════════════════════════════════════════════════════════════════
  // FLOW 3: MANUAL STOCK ADJUSTMENT
  // ═════════════════════════════════════════════════════════════════════
  stockAdjustmentFlow: `
    ┌─────────────────────────────────────────────────────────────────┐
    │      FLOW 3: MANUAL STOCK ADJUSTMENT WITH AUDIT TRAIL          │
    └─────────────────────────────────────────────────────────────────┘

    Scenario: 50 units of SALT-001 found damaged

    Admin Action:
      │
      └─ POST /api/v1/inventory/SALT-001/adjust
         Body: {
           adjustment: -50,
           reason: "damaged_goods",
           notes: "Found in warehouse fire - RMA-12345"
         }

    System Process:
      │
      ├─ Validation:
      │  ├─ ✓ adjustment = -50 (non-zero)
      │  ├─ ✓ reason = "damaged_goods" (valid)
      │  ├─ ✓ Product SALT-001 exists
      │  └─ ✓ Current: 500 kg, New: 450 kg (valid)
      │
      ├─ Update Database:
      │  └─ SALT-001: stockQty 500 → 450
      │
      ├─ Create InventoryLedger Entry:
      │  │
      │  ├─ productId: SALT-001
      │  ├─ changeType: "debit" (reduction)
      │  ├─ quantityChanged: 50
      │  ├─ previousQty: 500
      │  ├─ newQty: 450
      │  ├─ reason: "manual_adjustment"
      │  ├─ adjustmentReason: "damaged_goods"
      │  ├─ notes: "Found in warehouse fire - RMA-12345"
      │  ├─ triggeredBy: admin._id
      │  └─ createdAt: now
      │
      ├─ Create AuditLog Entry:
      │  │
      │  ├─ action: "INVENTORY_ADJUSTED"
      │  ├─ beforeSnapshot: {stockQty: 500}
      │  ├─ afterSnapshot: {stockQty: 450}
      │  ├─ context: {adjustment: -50, reason: "damaged_goods", ...}
      │  ├─ actorId: admin._id
      │  ├─ ipAddress: admin's IP
      │  └─ status: "success"
      │
      ↓

    Response to Admin:
      ├─ Product: SALT-001
      ├─ Previous: 500 kg
      ├─ New: 450 kg
      ├─ Adjustment: -50 kg
      ├─ Reason: damaged_goods
      └─ Notes: Found in warehouse fire - RMA-12345

    Audit Trail Preserved:
      ├─ InventoryLedger shows exact what changed
      ├─ AuditLog shows who and why
      ├─ Timestamps record when
      ├─ IP addresses record where
      └─ Complete immutable trail for compliance

    Reconstruction Verification:
      Previous: 500 kg
      After adjustment: -50 kg debit
      Current: 450 kg ✓ (matches database)

    Benefits:
      ✓ No guessing or hidden changes
      ✓ Complete traceability
      ✓ Compliance ready
      ✓ Can be audited later
      ✓ Justification documented
  `,

  // ═════════════════════════════════════════════════════════════════════
  // FLOW 4: REORDER LEVEL CONFIGURATION
  // ═════════════════════════════════════════════════════════════════════
  reorderLevelFlow: `
    ┌─────────────────────────────────────────────────────────────────┐
    │      FLOW 4: REORDER LEVEL CONFIGURATION                        │
    └─────────────────────────────────────────────────────────────────┘

    Business Decision:
      Admin reviews: SALT-001 selling at 300 kg/day
      └─ Need 4-week buffer = 300 × 28 = 8,400 kg minimum

    Admin Sets Reorder Level:
      │
      └─ PUT /api/v1/inventory/SALT-001/reorder-level
         Body: {
           reorderLevel: 8400,
           notes: "Based on 4-week demand buffer"
         }

    System Process:
      │
      ├─ Validation:
      │  ├─ ✓ reorderLevel = 8400 (valid)
      │  └─ ✓ Product SALT-001 exists
      │
      ├─ Update Product:
      │  └─ SALT-001: reorderLevel 300 → 8400
      │
      ├─ Log Change:
      │  │
      │  ├─ AuditLog:
      │  │  ├─ action: "REORDER_LEVEL_UPDATED"
      │  │  ├─ beforeSnapshot: {reorderLevel: 300}
      │  │  ├─ afterSnapshot: {reorderLevel: 8400}
      │  │  ├─ context: {productName, notes}
      │  │  └─ status: "success"
      │  │
      │  └─ Complete audit trail preserved
      │
      ↓

    Impact on Low Stock Alerts:
      Current stock: 5,000 kg
      New reorderLevel: 8,400 kg
      Status: LOW STOCK ALERT
      └─ Product now appears in low-stock list
         └─ Recommended order: 16,800 kg (2x reorder level)

    Timeline:
      Day 1: Set reorderLevel to 8,400 kg
      Day 5: Stock down to 7,500 kg → ALERT
      Day 10: Stock down to 6,000 kg → ALERT
      Day 20: Stock down to 1,500 kg → CRITICAL

    Workflow Loop:
      ├─ Alert triggers → Admin reviews
      ├─ Admin places order → Inventory increases
      ├─ Stock monitored daily
      └─ Cycle repeats

    Audit Trail:
      Shows exact reorder level configuration history
      Useful for: Compliance, troubleshooting, trend analysis
  `,

  // ═════════════════════════════════════════════════════════════════════
  // FLOW 5: COMPLETE INVENTORY AUDIT
  // ═════════════════════════════════════════════════════════════════════
  inventoryAuditFlow: `
    ┌─────────────────────────────────────────────────────────────────┐
    │       FLOW 5: COMPLETE INVENTORY AUDIT PROCEDURE                │
    └─────────────────────────────────────────────────────────────────┘

    Quarterly Audit Initiated:
      Admin triggers: POST /api/v1/inventory/audit/perform

    System Audit Process:
      │
      ├─ Phase 1: Gather Products
      │  └─ Fetch 15 active products
      │
      ├─ Phase 2: Reconstruct Each Product
      │  │
      │  ├─ For each product:
      │  │  ├─ Fetch all ledger entries
      │  │  ├─ Reconstruct quantity from ledger
      │  │  ├─ Compare with current database
      │  │  ├─ Calculate discrepancy
      │  │  ├─ Determine if accurate
      │  │  └─ Log result
      │  │
      │  └─ Results:
      │     ├─ 12 products: Accurate (100%)
      │     ├─ 2 products: Discrepancies found
      │     └─ 1 product: Significant issue (>10%)
      │
      ├─ Phase 3: Calculate Metrics
      │  │
      │  ├─ Total products audited: 15
      │  ├─ Products with issues: 3
      │  ├─ Overall accuracy rate: 80%
      │  ├─ Status: FOUND_ISSUES
      │  └─ Duration: 2 minutes
      │
      ├─ Phase 4: Log Audit Results
      │  │
      │  └─ AuditLog Entry:
      │     ├─ action: "INVENTORY_AUDIT_COMPLETED"
      │     ├─ auditId: AUDIT-1703001600000
      │     ├─ productsAudited: 15
      │     ├─ discrepanciesFound: 3
      │     ├─ accuracyRate: 80%
      │     ├─ status: "found_issues"
      │     └─ actorId: admin._id
      │
      ↓

    Audit Report:
      ┌────────────────────────────────────────────────────┐
      │        QUARTERLY INVENTORY AUDIT REPORT           │
      ├────────────────────────────────────────────────────┤
      │  Audit ID: AUDIT-1703001600000                    │
      │  Date: 2026-04-24T10:00:00Z                       │
      │  Completed: 2026-04-24T10:02:00Z (2 min)         │
      │                                                    │
      │  OVERALL METRICS                                  │
      │  ├─ Products Audited: 15                          │
      │  ├─ Products Accurate: 12 (80%)                   │
      │  ├─ Discrepancies Found: 3 (20%)                  │
      │  └─ Overall Accuracy: 80%                         │
      │                                                    │
      │  ISSUES REQUIRING ACTION                          │
      │  ├─ SALT-002: -10 kg (2.8% - LOW)               │
      │  ├─ SALT-004: -150 kg (60% - HIGH)              │
      │  └─ SALT-007: +25 kg (3% - LOW)                 │
      │                                                    │
      │  RECOMMENDATIONS                                  │
      │  ├─ SALT-004: Investigate immediately           │
      │  ├─ SALT-002 & 007: Monitor next month          │
      │  └─ Consider physical count in Q2                │
      └────────────────────────────────────────────────────┘

    Post-Audit Actions:
      ├─ High issues: Immediate investigation
      ├─ Low issues: Next month follow-up
      ├─ All findings documented
      ├─ Compliance report generated
      └─ Management notified

    Compliance Trail:
      ✓ Audit performed by verified admin
      ✓ Complete methodology documented
      ✓ All calculations verified
      ✓ Results immutable in audit log
      ✓ Ready for external auditor review
  `,
};

export { PHASE5_FLOW_DIAGRAMS };
