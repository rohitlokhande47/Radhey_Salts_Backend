/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PHASE 3: PRODUCT MANAGEMENT APIS - VISUAL FLOW DIAGRAMS
 * ═══════════════════════════════════════════════════════════════════════════
 */

const PHASE3_FLOW_DIAGRAMS = {
  // ═════════════════════════════════════════════════════════════════════
  // FLOW 1: CREATE PRODUCT FLOW
  // ═════════════════════════════════════════════════════════════════════
  createProductFlow: `
    ┌─────────────────────────────────────────────────────────────────┐
    │          FLOW 1: CREATE PRODUCT WITH IMAGE UPLOAD              │
    └─────────────────────────────────────────────────────────────────┘

    Admin
      │
      ├─ Prepare Product Data
      │  ├─ name: "Rock Salt Premium"
      │  ├─ productCode: "SALT-001"
      │  ├─ price: 250
      │  ├─ MOQ: 100
      │  ├─ pricingTiers: [...]
      │  └─ image: <BINARY_FILE>
      │
      ↓
    ┌──────────────────────────────────────────────────┐
    │  POST /api/v1/products                           │
    │  Content-Type: multipart/form-data               │
    │  Header: Authorization: Bearer <JWT_TOKEN>       │
    └──────────────────────────────────────────────────┘
      │
      ↓
    ┌──────────────────────────────────────────────────┐
    │  SERVER: Middleware Chain                        │
    ├──────────────────────────────────────────────────┤
    │  ✓ verifyJWT - Authenticate admin               │
    │  ✓ verifyAdminRole - Check role = admin         │
    │  ✓ upload.single("image") - Parse multipart     │
    └──────────────────────────────────────────────────┘
      │
      ↓
    ┌──────────────────────────────────────────────────┐
    │  Controller: createProduct()                     │
    ├──────────────────────────────────────────────────┤
    │  1. Validate all fields                          │
    │  2. Check productCode uniqueness                 │
    │  3. Upload image to Cloudinary                   │
    │     cloudinary.uploader.upload(file)             │
    │     → return secure_url                          │
    └──────────────────────────────────────────────────┘
      │
      ├─ Database Operations
      │  ├─ Create Product Document
      │  │  ├─ _id: auto-generated
      │  │  ├─ name, description, productCode
      │  │  ├─ category, price, MOQ, unit
      │  │  ├─ image: cloudinary_url
      │  │  ├─ pricingTiers: validated array
      │  │  ├─ isActive: true
      │  │  └─ createdAt: timestamp
      │  │
      │  └─ Create AuditLog Entry
      │     ├─ action: PRODUCT_ADDED
      │     ├─ beforeSnapshot: {}
      │     ├─ afterSnapshot: full product object
      │     ├─ actorId: admin._id
      │     └─ status: success
      │
      ↓
    ┌──────────────────────────────────────────────────┐
    │  Response (201 Created)                          │
    ├──────────────────────────────────────────────────┤
    │  {                                               │
    │    success: true,                                │
    │    statusCode: 201,                              │
    │    data: {product object},                       │
    │    message: "Product created successfully"       │
    │  }                                               │
    └──────────────────────────────────────────────────┘
      │
      ↓
    Admin
      └─ Product SALT-001 now available in catalog
  `,

  // ═════════════════════════════════════════════════════════════════════
  // FLOW 2: GET ALL PRODUCTS WITH PAGINATION
  // ═════════════════════════════════════════════════════════════════════
  getAllProductsFlow: `
    ┌─────────────────────────────────────────────────────────────────┐
    │      FLOW 2: GET ALL PRODUCTS WITH PAGINATION & FILTERING      │
    └─────────────────────────────────────────────────────────────────┘

    Dealer/Customer
      │
      ├─ Wants to see products
      │  └─ Filters: category=salt, search=premium, page=1, limit=10
      │
      ↓
    ┌──────────────────────────────────────────────────┐
    │  GET /api/v1/products                            │
    │  Query Parameters:                               │
    │    page=1&limit=10&category=salt&search=premium  │
    │  No Authorization Required (Public)              │
    └──────────────────────────────────────────────────┘
      │
      ↓
    ┌──────────────────────────────────────────────────┐
    │  Controller: getAllProducts()                    │
    ├──────────────────────────────────────────────────┤
    │  1. Parse query parameters                       │
    │  2. Build filter object:                         │
    │     ├─ isActive: true                            │
    │     ├─ category: "salt"                          │
    │     └─ $or: [name, description, code] ~ premium │
    │  3. Build sort object: {createdAt: -1}           │
    │  4. Calculate pagination:                        │
    │     ├─ skip: (1-1) * 10 = 0                      │
    │     └─ limit: 10                                 │
    └──────────────────────────────────────────────────┘
      │
      ↓
    ┌──────────────────────────────────────────────────┐
    │  Database Queries (Parallel)                     │
    ├──────────────────────────────────────────────────┤
    │  1. Find products with filter, sort, skip, limit │
    │  2. Count total documents matching filter        │
    └──────────────────────────────────────────────────┘
      │
      ↓
    ┌──────────────────────────────────────────────────┐
    │  Response (200 OK)                               │
    ├──────────────────────────────────────────────────┤
    │  {                                               │
    │    success: true,                                │
    │    data: {                                       │
    │      products: [                                 │
    │        { _id, name, price, MOQ, stockQty, ... },│
    │        { _id, name, price, MOQ, stockQty, ... },│
    │        ...                                       │
    │      ],                                          │
    │      pagination: {                               │
    │        page: 1,                                  │
    │        limit: 10,                                │
    │        total: 24,                                │
    │        totalPages: 3                             │
    │      }                                           │
    │    }                                             │
    │  }                                               │
    └──────────────────────────────────────────────────┘
      │
      ↓
    Dealer/Customer
      └─ Sees 10 products with 3 pages available
  `,

  // ═════════════════════════════════════════════════════════════════════
  // FLOW 3: CHECK PRICING WITH MOQ VALIDATION
  // ═════════════════════════════════════════════════════════════════════
  getPricingFlow: `
    ┌─────────────────────────────────────────────────────────────────┐
    │         FLOW 3: GET PRICING WITH MOQ VALIDATION                │
    └─────────────────────────────────────────────────────────────────┘

    Dealer
      │
      ├─ Selected Product: SALT-001 (Rock Salt Premium)
      │  ├─ MOQ: 100 kg
      │  ├─ Base Price: 250/kg
      │  └─ Pricing Tiers:
      │      ├─ 100-500: 250/kg
      │      ├─ 501-1000: 240/kg
      │      └─ 1001-5000: 230/kg
      │
      ├─ Enters Quantity: 250 kg
      │
      ↓
    ┌──────────────────────────────────────────────────┐
    │  GET /api/v1/products/:id/pricing?quantity=250   │
    │  No Authorization Required (Public)              │
    └──────────────────────────────────────────────────┘
      │
      ↓
    ┌──────────────────────────────────────────────────┐
    │  Controller: getProductPricing()                 │
    ├──────────────────────────────────────────────────┤
    │  1. Fetch product from database                  │
    │  2. Validate MOQ: 250 >= 100 ✓                   │
    │  3. Call getPriceForQuantity(250):               │
    │     ├─ Check tier 100-500: 250 in [100,500] ✓   │
    │     └─ Return price: 250                         │
    │  4. Calculate totals:                            │
    │     ├─ unitPrice: 250                            │
    │     ├─ totalPrice: 250 * 250 = 62500            │
    │     ├─ discount: (250-250)/250*100 = 0%         │
    │     └─ canOrder: true                            │
    └──────────────────────────────────────────────────┘
      │
      ↓
    ┌──────────────────────────────────────────────────┐
    │  Response (200 OK)                               │
    ├──────────────────────────────────────────────────┤
    │  {                                               │
    │    data: {                                       │
    │      productId: "507f1f77bcf86cd799439011",     │
    │      productName: "Rock Salt Premium",           │
    │      quantity: 250,                              │
    │      MOQ: 100,                                   │
    │      unitPrice: 250,                             │
    │      totalPrice: 62500,                          │
    │      discount: "0%",                             │
    │      availableStock: 5000,                       │
    │      canOrder: true                              │
    │    }                                             │
    │  }                                               │
    └──────────────────────────────────────────────────┘
      │
      ↓
    Dealer
      └─ Sees: Can order 250 kg @ 250/kg = 62500 total (No discount)

    ────────────────────────────────────────────────────

    ALTERNATIVE SCENARIO: Quantity >= 501 (bulk pricing)

    Dealer enters: 600 kg

      ↓
    Server validates: 600 >= 100 ✓
    Server checks tier: 600 in [501,1000] ✓ → price: 240/kg
    Server calculates: 600 * 240 = 144000
    Server calculates discount: (250-240)/250*100 = 4%

      ↓
    Response shows:
      quantity: 600
      unitPrice: 240
      totalPrice: 144000
      discount: "4%"  ← Customer saves 6000 by buying bulk!
      canOrder: true

      ↓
    Dealer
      └─ Incentivized to order more (600 kg) to get 4% discount
  `,

  // ═════════════════════════════════════════════════════════════════════
  // FLOW 4: RESTOCK PRODUCT WITH INVENTORY LEDGER
  // ═════════════════════════════════════════════════════════════════════
  restockFlow: `
    ┌─────────────────────────────────────────────────────────────────┐
    │  FLOW 4: RESTOCK PRODUCT WITH INVENTORY LEDGER ENTRY          │
    └─────────────────────────────────────────────────────────────────┘

    Admin
      │
      ├─ Received shipment from supplier
      │  ├─ Product: SALT-001 (Rock Salt Premium)
      │  ├─ Quantity: 5000 kg
      │  └─ Notes: Shipment from Supplier A, Invoice #INV-2026-001
      │
      ↓
    ┌──────────────────────────────────────────────────┐
    │  POST /api/v1/products/:id/restock               │
    │  Header: Authorization: Bearer <JWT_TOKEN>       │
    │  Content-Type: application/json                  │
    │  Body: {                                         │
    │    quantity: 5000,                               │
    │    reason: "new_shipment",                       │
    │    notes: "Supplier A, Invoice #INV-2026-001"    │
    │  }                                               │
    └──────────────────────────────────────────────────┘
      │
      ↓
    ┌──────────────────────────────────────────────────┐
    │  Middleware: verifyJWT + verifyAdminRole ✓       │
    └──────────────────────────────────────────────────┘
      │
      ↓
    ┌──────────────────────────────────────────────────┐
    │  Controller: restockProduct()                    │
    ├──────────────────────────────────────────────────┤
    │  1. Validate quantity > 0 ✓                      │
    │  2. Fetch product: Current stock = 5000 kg       │
    │  3. Calculate new stock = 5000 + 5000 = 10000 kg │
    └──────────────────────────────────────────────────┘
      │
      ├─ Database Operations (Atomic)
      │  │
      │  ├─ Operation 1: Update Product
      │  │  └─ SALT-001.stockQty = 10000
      │  │
      │  ├─ Operation 2: Create InventoryLedger
      │  │  ├─ productId: SALT-001
      │  │  ├─ changeType: "credit" (stock increase)
      │  │  ├─ quantityChanged: 5000
      │  │  ├─ previousQty: 5000
      │  │  ├─ newQty: 10000
      │  │  ├─ reason: "new_shipment"
      │  │  ├─ triggeredBy: admin._id
      │  │  ├─ triggeredByType: "Admin"
      │  │  └─ notes: "Supplier A, Invoice #INV-2026-001"
      │  │     [IMMUTABLE - Can never be updated]
      │  │
      │  └─ Operation 3: Create AuditLog
      │     ├─ action: "PRODUCT_RESTOCKED"
      │     ├─ actorId: admin._id
      │     ├─ targetId: SALT-001
      │     ├─ beforeSnapshot: {stockQty: 5000}
      │     ├─ afterSnapshot: {stockQty: 10000}
      │     ├─ context: {reason: "new_shipment", quantity: 5000}
      │     ├─ ipAddress: admin's IP
      │     └─ status: "success"
      │
      ↓
    ┌──────────────────────────────────────────────────┐
    │  Response (200 OK)                               │
    ├──────────────────────────────────────────────────┤
    │  {                                               │
    │    data: {                                       │
    │      product: {                                  │
    │        _id: "507f1f77bcf86cd799439011",         │
    │        stockQty: 10000                           │
    │      },                                          │
    │      ledgerEntry: {                              │
    │        _id: "507f1f77bcf86cd799439012",         │
    │        productId: "507f1f77bcf86cd799439011",   │
    │        changeType: "credit",                     │
    │        quantityChanged: 5000,                    │
    │        previousQty: 5000,                        │
    │        newQty: 10000,                            │
    │        reason: "new_shipment"                    │
    │      },                                          │
    │      message: "Stock increased by 5000 units"    │
    │    }                                             │
    │  }                                               │
    └──────────────────────────────────────────────────┘
      │
      ↓
    System Now Has Complete Audit Trail:
      │
      ├─ ✓ Product: Stock updated to 10000 kg
      ├─ ✓ InventoryLedger: Immutable record of +5000 kg
      │     └─ Can be used to reconstruct historical stock levels
      └─ ✓ AuditLog: Admin action logged with before/after snapshots
          └─ Can be used to investigate who changed what and when
  `,

  // ═════════════════════════════════════════════════════════════════════
  // FLOW 5: UPDATE PRODUCT WITH AUDIT TRAIL
  // ═════════════════════════════════════════════════════════════════════
  updateProductFlow: `
    ┌─────────────────────────────────────────────────────────────────┐
    │     FLOW 5: UPDATE PRODUCT WITH AUDIT TRAIL                    │
    └─────────────────────────────────────────────────────────────────┘

    Admin
      │
      ├─ Wants to adjust product pricing
      │  ├─ Current price: 250/kg
      │  ├─ New price: 260/kg (increase due to inflation)
      │  └─ New MOQ: 50 kg (from 100 kg)
      │
      ↓
    ┌──────────────────────────────────────────────────┐
    │  PUT /api/v1/products/:id                        │
    │  Header: Authorization: Bearer <JWT_TOKEN>       │
    │  Content-Type: application/json                  │
    │  Body: {                                         │
    │    price: 260,                                   │
    │    MOQ: 50,                                      │
    │    pricingTiers: [...]  /* updated tiers */      │
    │  }                                               │
    └──────────────────────────────────────────────────┘
      │
      ↓
    ┌──────────────────────────────────────────────────┐
    │  Middleware: verifyJWT + verifyAdminRole ✓       │
    └──────────────────────────────────────────────────┘
      │
      ↓
    ┌──────────────────────────────────────────────────┐
    │  Controller: updateProduct()                     │
    ├──────────────────────────────────────────────────┤
    │  1. Fetch product                                │
    │  2. Store before snapshot                        │
    │     {price: 250, MOQ: 100, ...}                  │
    │  3. Validate new values                          │
    │  4. Apply updates                                │
    │  5. Save product                                 │
    └──────────────────────────────────────────────────┘
      │
      ├─ Database Operations
      │  │
      │  ├─ Operation 1: Update Product
      │  │  ├─ price: 250 → 260
      │  │  └─ MOQ: 100 → 50
      │  │
      │  └─ Operation 2: Create AuditLog
      │     ├─ action: "PRODUCT_UPDATED"
      │     ├─ beforeSnapshot: {price: 250, MOQ: 100, ...}
      │     └─ afterSnapshot: {price: 260, MOQ: 50, ...}
      │        [Can see exactly what changed]
      │
      ↓
    ┌──────────────────────────────────────────────────┐
    │  Response (200 OK)                               │
    ├──────────────────────────────────────────────────┤
    │  Updated product with new values                 │
    └──────────────────────────────────────────────────┘
      │
      ↓
    Admin
      └─ Price increased to 260, MOQ reduced to 50
      └─ Complete audit trail saved for compliance
  `,

  // ═════════════════════════════════════════════════════════════════════
  // FLOW 6: ERROR SCENARIO - MOQ VIOLATION
  // ═════════════════════════════════════════════════════════════════════
  errorMoqViolation: `
    ┌─────────────────────────────────────────────────────────────────┐
    │           FLOW 6: ERROR - MOQ VIOLATION                        │
    └─────────────────────────────────────────────────────────────────┘

    Dealer
      │
      ├─ Product: SALT-001, MOQ: 100 kg
      ├─ Wants to order: 50 kg (Below MOQ!)
      │
      ↓
    ┌──────────────────────────────────────────────────┐
    │  GET /api/v1/products/:id/pricing?quantity=50    │
    └──────────────────────────────────────────────────┘
      │
      ↓
    ┌──────────────────────────────────────────────────┐
    │  Controller: getProductPricing()                 │
    ├──────────────────────────────────────────────────┤
    │  1. Validate quantity >= MOQ                     │
    │  2. Check: 50 >= 100? ✗ FAIL                    │
    └──────────────────────────────────────────────────┘
      │
      ↓
    ┌──────────────────────────────────────────────────┐
    │  ApiError(400)                                   │
    │  "Minimum order quantity is 100. Requested: 50"  │
    └──────────────────────────────────────────────────┘
      │
      ↓
    ┌──────────────────────────────────────────────────┐
    │  Response (400 Bad Request)                      │
    ├──────────────────────────────────────────────────┤
    │  {                                               │
    │    success: false,                               │
    │    statusCode: 400,                              │
    │    message: "Minimum order quantity is 100. "    │
    │             "Requested: 50"                      │
    │  }                                               │
    └──────────────────────────────────────────────────┘
      │
      ↓
    Dealer
      └─ Error message shown on UI
      └─ Prompted to increase quantity to at least 100 kg
  `,

  // ═════════════════════════════════════════════════════════════════════
  // FLOW 7: ADMIN DASHBOARD - LOW STOCK PRODUCTS
  // ═════════════════════════════════════════════════════════════════════
  lowStockFlow: `
    ┌─────────────────────────────────────────────────────────────────┐
    │    FLOW 7: ADMIN DASHBOARD - LOW STOCK ALERT                   │
    └─────────────────────────────────────────────────────────────────┘

    Admin Dashboard
      │
      ├─ Loads admin home page
      │
      ↓
    ┌──────────────────────────────────────────────────┐
    │  GET /api/v1/products/admin/low-stock             │
    │  Header: Authorization: Bearer <JWT_TOKEN>       │
    │  (Admin only - RBAC enforced)                     │
    └──────────────────────────────────────────────────┘
      │
      ↓
    ┌──────────────────────────────────────────────────┐
    │  Controller: getLowStockProducts()               │
    ├──────────────────────────────────────────────────┤
    │  Query: Find products where                      │
    │    isActive = true AND                           │
    │    stockQty <= reorderLevel                      │
    │  Sort by stockQty (ascending)                    │
    └──────────────────────────────────────────────────┘
      │
      ↓
    ┌──────────────────────────────────────────────────┐
    │  Response (200 OK)                               │
    ├──────────────────────────────────────────────────┤
    │  [                                               │
    │    {                                             │
    │      _id: "507f1f77bcf86cd799439011",           │
    │      name: "Rock Salt Premium",                  │
    │      productCode: "SALT-001",                    │
    │      stockQty: 800,                              │
    │      reorderLevel: 1000,  ← Below threshold      │
    │      MOQ: 100                                    │
    │    },                                            │
    │    {                                             │
    │      _id: "507f1f77bcf86cd799439013",           │
    │      name: "Sea Salt Fine",                      │
    │      productCode: "SALT-003",                    │
    │      stockQty: 200,                              │
    │      reorderLevel: 500,   ← Below threshold      │
    │      MOQ: 50                                     │
    │    }                                             │
    │  ]                                               │
    └──────────────────────────────────────────────────┘
      │
      ↓
    Admin Dashboard
      │
      ├─ Shows alert box with low stock products
      │  ├─ SALT-001: 800 / 1000 units
      │  └─ SALT-003: 200 / 500 units
      │
      ├─ Admin can click "Restock" buttons
      └─ Redirected to restock workflow
  `,
};

export { PHASE3_FLOW_DIAGRAMS };
