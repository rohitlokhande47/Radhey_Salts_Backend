/**
 * PHASE 1: DATABASE MODELS - QUICK REFERENCE GUIDE
 * 
 * All 8 Mongoose models for Radhey Salt Trading B2B Marketplace
 */

// ============================================================
// CORE COLLECTIONS (4)
// ============================================================

/**
 * 1. ADMIN MODEL
 * Location: src/models/admin.model.js
 * 
 * Purpose: Stores administrator accounts with authentication
 * 
 * Key Fields:
 * - name: Admin name
 * - email: Unique email (indexed)
 * - password: bcrypt hashed (min 6 chars)
 * - role: enum ["super_admin", "admin"]
 * - isActive: Boolean flag
 * - lastLogin: Track last login time
 * - permissions: Array of permission strings
 * 
 * Methods:
 * - isPasswordCorrect(password): Compare passwords
 * - generateAccessToken(): Create JWT token with jti
 * - generateRefreshToken(): Create 7-day refresh token
 * 
 * Indexes:
 * - email (unique)
 * - createdAt
 */

/**
 * 2. DEALER MODEL
 * Location: src/models/dealer.model.js
 * 
 * Purpose: Stores dealer accounts and business details
 * 
 * Key Fields:
 * - name: Dealer name
 * - email: Unique email (indexed)
 * - password: bcrypt hashed
 * - phone: 10-digit Indian phone number (indexed)
 * - businessName: Company/business name
 * - address, city, state, pincode: Full address
 * - status: enum ["active", "inactive", "suspended"] (indexed)
 * - totalOrders: Running count of orders
 * - totalSpent: Cumulative spending amount
 * - lastOrderDate: Date of last order placed
 * - gstin: GST registration number
 * - creditLimit: Max credit amount allowed
 * - outstandingBalance: Current balance due
 * 
 * Methods:
 * - isPasswordCorrect(password)
 * - generateAccessToken()
 * - generateRefreshToken()
 * 
 * Indexes:
 * - email, phone, status, createdAt, totalSpent
 */

/**
 * 3. PRODUCT MODEL
 * Location: src/models/product.model.js
 * 
 * Purpose: Product catalog with pricing and inventory
 * 
 * Key Fields:
 * - name: Product name
 * - description: Product details
 * - productCode: Unique code (indexed, uppercase)
 * - category: Product category
 * - price: Base unit price
 * - MOQ: Minimum order quantity (required for all orders)
 * - stockQty: Current available stock (indexed for low-stock alerts)
 * - reorderLevel: Trigger point for low stock warnings
 * - image: Cloudinary CDN URL
 * - pricingTiers: Array of {minQty, maxQty, price} for bulk discounts
 * - unit: enum [kg, liter, piece, bag, box, carton]
 * - isActive: Boolean flag
 * - supplier: Supplier name
 * - hsn: HSN code for GST
 * 
 * Methods:
 * - getPriceForQuantity(qty): Returns applicable price from tiers
 * 
 * Validation:
 * - pricingTiers must be unique and sorted by minQty
 * 
 * Indexes:
 * - productCode, category, isActive, stockQty, createdAt
 * - Text search index on name and description
 */

/**
 * 4. ORDERS MODEL
 * Location: src/models/orders.model.js
 * 
 * Purpose: Order management and fulfillment tracking
 * 
 * Key Fields:
 * - dealerId: Reference to Dealer (ObjectId, indexed)
 * - items: Array of {productId, qty, unitPrice, totalPrice}
 * - totalAmount: Sum of all item totals
 * - orderStatus: enum [pending, confirmed, dispatched, delivered, cancelled]
 * - deliveryStage: enum [awaiting_confirmation, in_preparation, in_transit, out_for_delivery, delivered]
 * - paymentStatus: enum [pending, partial, completed]
 * - orderedAt, confirmedAt, dispatchedAt, deliveredAt: Status timestamps
 * - notes: Order notes/instructions
 * - deliveryAddress: Specific delivery location
 * - orderRef: Auto-generated unique order reference (ORD-YYMMXXXXX)
 * - paymentMethod: enum [credit, upi, bank_transfer, cash]
 * 
 * Auto-Generated:
 * - orderRef: Format "ORD-" + YY + MM + Counter (5 digits)
 * 
 * Indexes:
 * - dealerId, orderStatus, paymentStatus, createdAt
 * - Compound: dealerId + createdAt, orderStatus + createdAt
 */

// ============================================================
// EXTENDED COLLECTIONS (4) - Production Features
// ============================================================

/**
 * 5. INVENTORY LEDGER MODEL
 * Location: src/models/inventoryLedger.model.js
 * 
 * Purpose: IMMUTABLE append-only stock movement audit trail
 * Design: Write-once, never update or delete
 * 
 * Key Fields:
 * - productId: Reference to Product
 * - changeType: enum ["debit" (out), "credit" (in)]
 * - quantityChanged: Absolute quantity moved
 * - previousQty: Stock before event
 * - newQty: Stock after event
 * - reason: enum [order_placed, restock, cancellation, damage, expiry, adjustment]
 * - triggeredBy: ObjectId of Order or Admin who caused change
 * - triggeredByType: enum [Order, Admin]
 * - notes: Admin comments
 * 
 * Features:
 * - Pre-save hook prevents any updates
 * - Can reconstruct stock quantity at any historical date
 * - Enables discrepancy investigation
 * - Complete audit trail for compliance
 * 
 * Indexes:
 * - productId, changeType, reason, createdAt, triggeredBy
 */

/**
 * 6. TOKEN BLACKLIST MODEL
 * Location: src/models/tokenBlacklist.model.js
 * 
 * Purpose: Stores invalidated JWT IDs (jti claims) for revocation
 * 
 * Key Fields:
 * - jti: JWT ID claim (unique, indexed)
 * - userId: Reference to user who owned token
 * - userType: enum [Dealer, Admin]
 * - reason: enum [logout, password_change, admin_revoke, session_timeout]
 * - expiresAt: Token expiry time (TTL index target)
 * - ipAddress: IP address where token was revoked
 * 
 * TTL Index:
 * - MongoDB automatically deletes entries 0 seconds after expiresAt
 * - Keeps collection lean with zero manual maintenance
 * 
 * Workflow:
 * 1. User logs out → jti added to blacklist
 * 2. JWT middleware checks jti on every protected request
 * 3. Revoked tokens immediately rejected
 * 4. Entries auto-deleted after token expiry
 */

/**
 * 7. DAILY SNAPSHOTS MODEL
 * Location: src/models/dailySnapshots.model.js
 * 
 * Purpose: Pre-computed analytics snapshots for admin dashboard
 * Generated: Nightly cron job (11:59 PM)
 * 
 * Key Fields:
 * - date: Unique date for snapshot
 * - totalOrders: Order count for the day
 * - totalRevenue: Sum of confirmed orders
 * - avgOrderValue: Mean order value
 * - topProducts: Top 5 products by quantity sold
 * - topDealers: Top 5 dealers by spending
 * - newDealers: Newly registered dealers count
 * - paymentStats: Cash/credit/pending breakdown
 * - orderStatusBreakdown: Status distribution
 * - avgConfirmationTime: Average hours to confirm
 * - isComplete: Snapshot completeness flag
 * 
 * Benefits:
 * - Decouples analytics from transactional database
 * - Fast dashboard loads (pre-computed)
 * - Nightly aggregation doesn't impact live database
 * - Historical trend analysis
 */

/**
 * 8. AUDIT LOG MODEL
 * Location: src/models/auditLog.model.js
 * 
 * Purpose: IMMUTABLE record of all administrative actions
 * Design: Append-only for compliance and forensic investigation
 * 
 * Key Fields:
 * - actorId: Admin who performed action
 * - actorRole: Role of admin
 * - action: Specific action performed (PRODUCT_ADDED, ORDER_STATUS_CHANGED, etc.)
 * - targetCollection: Affected collection (Product, Order, Dealer, Admin, System)
 * - targetId: Specific document ID affected
 * - beforeSnapshot: Complete JSON before change
 * - afterSnapshot: Complete JSON after change
 * - ipAddress: Request IP address (required)
 * - userAgent: Browser/client info
 * - status: enum [success, failure]
 * - errorMessage: Error details if failed
 * - context: Additional metadata
 * 
 * Tracked Actions:
 * - PRODUCT_ADDED, PRODUCT_UPDATED, PRODUCT_DELETED
 * - PRODUCT_PRICE_UPDATED, PRODUCT_STOCK_UPDATED
 * - ORDER_STATUS_CHANGED, ORDER_CANCELLED
 * - DEALER_ADDED, DEALER_UPDATED, DEALER_DEACTIVATED
 * - ADMIN_ADDED, ADMIN_UPDATED, PASSWORD_CHANGED
 * - RESTOCK_PERFORMED, BULK_IMPORT, REPORT_GENERATED
 * 
 * Immutable:
 * - Pre-save hook prevents updates
 * - Enables forensic investigation
 * - Full compliance trail
 */

// ============================================================
// RELATIONSHIPS & REFERENCES
// ============================================================

/**
 * RELATIONSHIP MAP:
 * 
 * Admin (1) -----> (many) AuditLog
 * Admin (1) -----> (many) InventoryLedger (via restock action)
 * 
 * Dealer (1) -----> (many) Orders
 * Dealer (1) -----> (many) DailySnapshots (aggregated)
 * 
 * Product (1) -----> (many) Orders.items (embedded)
 * Product (1) -----> (many) InventoryLedger
 * Product (1) -----> (many) DailySnapshots.topProducts (aggregated)
 * 
 * Order (1) -----> (many) InventoryLedger (one ledger per item)
 * Order (1) -----> (many) AuditLog (status changes logged)
 * 
 * TokenBlacklist:
 * - Independent collection
 * - References userId but not enforced (stateless tokens)
 */

// ============================================================
// IMPORT SYNTAX
// ============================================================

/**
 * Option 1: Import individual models
 * 
 * import { Admin } from "./models/admin.model.js";
 * import { Dealer } from "./models/dealer.model.js";
 * import { Product } from "./models/product.model.js";
 * // etc...
 * 
 * Option 2: Import from index
 * 
 * import { Admin, Dealer, Product, Order, InventoryLedger, TokenBlacklist, DailySnapshot, AuditLog } from "./models/index.js";
 */

// ============================================================
// VALIDATION RULES
// ============================================================

/**
 * PASSWORD HASHING:
 * - All passwords hashed with bcrypt (salt rounds: 10)
 * - Pre-save hook auto-hashes
 * - Plain-text passwords never stored
 * 
 * EMAIL VALIDATION:
 * - Format: RFC 5322 compliant regex
 * - Unique indexes on all collections
 * 
 * MOQ (Minimum Order Quantity):
 * - Enforced at Product level
 * - Validated in Order creation (Phase 4)
 * - Prevents orders below MOQ
 * 
 * STOCK QUANTITY:
 * - Non-negative (min: 0)
 * - Real-time updates via atomic operations
 * - Tracked in InventoryLedger
 * 
 * PRICING TIERS:
 * - Sorted automatically by minQty
 * - Cannot have duplicate minQty
 * - Used to calculate unit price per order
 */

// ============================================================
// KEY FEATURES SUMMARY
// ============================================================

/**
 * ✅ JWT Authentication with Token Blacklisting
 * ✅ Password Hashing (bcrypt with salt rounds 10)
 * ✅ Role-Based Access Control (super_admin, admin, dealer)
 * ✅ Immutable Audit Logging (AuditLog collection)
 * ✅ Event-Driven Inventory Tracking (InventoryLedger)
 * ✅ MOQ Validation at Product Level
 * ✅ Bulk Pricing Tiers Support
 * ✅ Real-Time Stock Management
 * ✅ Order Status Workflow Tracking
 * ✅ Pre-Computed Analytics (DailySnapshots)
 * ✅ Token Revocation with TTL Auto-Cleanup
 * ✅ Comprehensive Indexing Strategy
 * ✅ Immutable Ledger for Stock Reconstruction
 * ✅ Complete Admin Audit Trail
 */

export const PHASE1_COMPLETE = true;
