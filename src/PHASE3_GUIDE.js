/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PHASE 3: PRODUCT MANAGEMENT APIS - COMPLETE REFERENCE GUIDE
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * This file contains complete API specifications, examples, and patterns
 * for Product Management APIs including CRUD operations, MOQ validation,
 * bulk pricing, and Cloudinary integration.
 */

// ═════════════════════════════════════════════════════════════════════════
// SECTION 1: API ENDPOINTS OVERVIEW
// ═════════════════════════════════════════════════════════════════════════

const PRODUCT_ENDPOINTS = {
  // ───────────────────────────────────────────────────────────────────
  // PUBLIC ENDPOINTS (No Authentication Required)
  // ───────────────────────────────────────────────────────────────────

  getAllProducts: {
    method: "GET",
    path: "/api/v1/products",
    auth: "NOT REQUIRED",
    description: "Fetch all products with pagination, filtering, and search",
    queryParameters: {
      page: { type: "number", default: 1, description: "Page number for pagination" },
      limit: { type: "number", default: 10, max: 100, description: "Items per page" },
      category: { type: "string", description: "Filter by product category" },
      isActive: { type: "boolean", default: true, description: "Filter by active status" },
      search: { type: "string", description: "Search in name, description, or product code" },
      sortBy: {
        type: "string",
        default: "createdAt",
        enum: ["name", "price", "stockQty", "createdAt", "MOQ"],
        description: "Field to sort by",
      },
      sortOrder: {
        type: "string",
        default: "desc",
        enum: ["asc", "desc"],
        description: "Sort order",
      },
    },
    exampleRequest: `
      GET /api/v1/products?page=1&limit=10&category=salt&search=premium&sortBy=price&sortOrder=asc
    `,
    exampleResponse: {
      status: 200,
      body: {
        success: true,
        statusCode: 200,
        data: {
          products: [
            {
              _id: "507f1f77bcf86cd799439011",
              name: "Rock Salt Premium",
              productCode: "SALT-001",
              category: "salt",
              price: 250,
              MOQ: 100,
              stockQty: 5000,
              image: "https://cloudinary.com/...",
              pricingTiers: [
                { minQty: 100, maxQty: 500, price: 250 },
                { minQty: 501, maxQty: 1000, price: 240 },
              ],
              isActive: true,
              createdAt: "2026-04-24T10:00:00Z",
            },
          ],
          pagination: {
            page: 1,
            limit: 10,
            total: 45,
            totalPages: 5,
          },
        },
        message: "Products retrieved successfully",
      },
    },
  },

  getProductById: {
    method: "GET",
    path: "/api/v1/products/:id",
    auth: "NOT REQUIRED",
    description: "Get single product details with pricing examples",
    pathParameters: {
      id: { type: "string", required: true, description: "Product MongoDB ID" },
    },
    exampleRequest: `
      GET /api/v1/products/507f1f77bcf86cd799439011
    `,
    exampleResponse: {
      status: 200,
      body: {
        success: true,
        statusCode: 200,
        data: {
          _id: "507f1f77bcf86cd799439011",
          name: "Rock Salt Premium",
          description: "High quality rock salt for bulk trading",
          productCode: "SALT-001",
          category: "salt",
          price: 250,
          MOQ: 100,
          unit: "kg",
          stockQty: 5000,
          reorderLevel: 1000,
          supplier: "Supplier A",
          hsn: "25010000",
          image: "https://cloudinary.com/...",
          pricingTiers: [
            { minQty: 100, maxQty: 500, price: 250 },
            { minQty: 501, maxQty: 1000, price: 240 },
            { minQty: 1001, maxQty: 5000, price: 230 },
          ],
          pricingExamples: [
            { quantity: 1, price: 250, total: 250 },
            { quantity: 5, price: 250, total: 1250 },
            { quantity: 10, price: 250, total: 2500 },
            { quantity: 25, price: 250, total: 6250 },
            { quantity: 50, price: 250, total: 12500 },
            { quantity: 100, price: 250, total: 25000 },
          ],
          isActive: true,
          createdAt: "2026-04-24T10:00:00Z",
        },
        message: "Product retrieved successfully",
      },
    },
  },

  getProductPricing: {
    method: "GET",
    path: "/api/v1/products/:id/pricing",
    auth: "NOT REQUIRED",
    description: "Get dynamic pricing for specific quantity with MOQ validation",
    queryParameters: {
      quantity: { type: "number", required: true, description: "Order quantity" },
    },
    exampleRequest: `
      GET /api/v1/products/507f1f77bcf86cd799439011/pricing?quantity=250
    `,
    exampleResponse: {
      status: 200,
      body: {
        success: true,
        statusCode: 200,
        data: {
          productId: "507f1f77bcf86cd799439011",
          productName: "Rock Salt Premium",
          quantity: 250,
          MOQ: 100,
          unitPrice: 240,
          totalPrice: 60000,
          discount: "4.00%",
          pricingTiers: [
            { minQty: 100, maxQty: 500, price: 250 },
            { minQty: 501, maxQty: 1000, price: 240 },
          ],
          availableStock: 5000,
          canOrder: true,
        },
        message: "Product pricing retrieved successfully",
      },
    },
    errorResponses: {
      moqViolation: {
        status: 400,
        body: {
          success: false,
          statusCode: 400,
          message: "Minimum order quantity is 100. Requested: 50",
        },
      },
    },
  },

  // ───────────────────────────────────────────────────────────────────
  // ADMIN ONLY ENDPOINTS (JWT + Admin Role Required)
  // ───────────────────────────────────────────────────────────────────

  createProduct: {
    method: "POST",
    path: "/api/v1/products",
    auth: "REQUIRED - Admin role",
    description: "Create new product with image upload to Cloudinary",
    contentType: "multipart/form-data",
    requiredFields: ["name", "description", "productCode", "category", "price", "MOQ", "unit"],
    optionalFields: ["supplier", "hsn", "stockQty", "reorderLevel", "pricingTiers", "image"],
    exampleRequest: {
      method: "POST",
      path: "/api/v1/products",
      headers: {
        Authorization: "Bearer <JWT_TOKEN>",
        "Content-Type": "multipart/form-data",
      },
      body: {
        name: "Rock Salt Premium",
        description: "High quality rock salt for bulk trading",
        productCode: "SALT-001",
        category: "salt",
        price: 250,
        MOQ: 100,
        unit: "kg",
        supplier: "Supplier A",
        hsn: "25010000",
        stockQty: 5000,
        reorderLevel: 1000,
        pricingTiers: [
          { minQty: 100, maxQty: 500, price: 250 },
          { minQty: 501, maxQty: 1000, price: 240 },
        ],
        image: "<BINARY_FILE_UPLOAD>",
      },
    },
    exampleResponse: {
      status: 201,
      body: {
        success: true,
        statusCode: 201,
        data: {
          _id: "507f1f77bcf86cd799439011",
          name: "Rock Salt Premium",
          productCode: "SALT-001",
          image: "https://res.cloudinary.com/...",
          isActive: true,
        },
        message: "Product created successfully",
      },
    },
  },

  updateProduct: {
    method: "PUT",
    path: "/api/v1/products/:id",
    auth: "REQUIRED - Admin role",
    description: "Update product details with audit logging and optional image upload",
    contentType: "multipart/form-data",
    updatableFields: ["name", "description", "category", "price", "MOQ", "reorderLevel", "supplier", "hsn", "pricingTiers", "isActive", "image"],
    exampleRequest: {
      method: "PUT",
      path: "/api/v1/products/507f1f77bcf86cd799439011",
      headers: {
        Authorization: "Bearer <JWT_TOKEN>",
        "Content-Type": "multipart/form-data",
      },
      body: {
        price: 260,
        MOQ: 50,
        pricingTiers: [
          { minQty: 50, maxQty: 500, price: 260 },
          { minQty: 501, maxQty: 1000, price: 250 },
        ],
      },
    },
    exampleResponse: {
      status: 200,
      body: {
        success: true,
        statusCode: 200,
        data: {
          _id: "507f1f77bcf86cd799439011",
          name: "Rock Salt Premium",
          price: 260,
          MOQ: 50,
          pricingTiers: [
            { minQty: 50, maxQty: 500, price: 260 },
            { minQty: 501, maxQty: 1000, price: 250 },
          ],
        },
        message: "Product updated successfully",
      },
    },
  },

  deleteProduct: {
    method: "DELETE",
    path: "/api/v1/products/:id",
    auth: "REQUIRED - Admin role",
    description: "Delete product (soft delete - sets isActive to false)",
    exampleRequest: {
      method: "DELETE",
      path: "/api/v1/products/507f1f77bcf86cd799439011",
      headers: {
        Authorization: "Bearer <JWT_TOKEN>",
      },
    },
    exampleResponse: {
      status: 200,
      body: {
        success: true,
        statusCode: 200,
        data: {},
        message: "Product deleted successfully",
      },
    },
  },

  restockProduct: {
    method: "POST",
    path: "/api/v1/products/:id/restock",
    auth: "REQUIRED - Admin role",
    description: "Restock product and create inventory ledger entry",
    requiredFields: ["quantity"],
    optionalFields: ["reason", "notes"],
    exampleRequest: {
      method: "POST",
      path: "/api/v1/products/507f1f77bcf86cd799439011/restock",
      headers: {
        Authorization: "Bearer <JWT_TOKEN>",
        "Content-Type": "application/json",
      },
      body: {
        quantity: 5000,
        reason: "new_shipment",
        notes: "Received shipment from Supplier A on 24-Apr-2026",
      },
    },
    exampleResponse: {
      status: 200,
      body: {
        success: true,
        statusCode: 200,
        data: {
          product: {
            _id: "507f1f77bcf86cd799439011",
            stockQty: 10000,
          },
          ledgerEntry: {
            _id: "507f1f77bcf86cd799439012",
            productId: "507f1f77bcf86cd799439011",
            changeType: "credit",
            quantityChanged: 5000,
            previousQty: 5000,
            newQty: 10000,
            reason: "new_shipment",
          },
          message: "Stock increased by 5000 units",
        },
        message: "Restock successful",
      },
    },
  },

  getLowStockProducts: {
    method: "GET",
    path: "/api/v1/products/admin/low-stock",
    auth: "REQUIRED - Admin role",
    description: "Get all products with stock below reorder level",
    exampleRequest: {
      method: "GET",
      path: "/api/v1/products/admin/low-stock",
      headers: {
        Authorization: "Bearer <JWT_TOKEN>",
      },
    },
    exampleResponse: {
      status: 200,
      body: {
        success: true,
        statusCode: 200,
        data: [
          {
            _id: "507f1f77bcf86cd799439011",
            name: "Rock Salt Premium",
            productCode: "SALT-001",
            stockQty: 800,
            reorderLevel: 1000,
            MOQ: 100,
          },
          {
            _id: "507f1f77bcf86cd799439013",
            name: "Sea Salt Fine",
            productCode: "SALT-003",
            stockQty: 200,
            reorderLevel: 500,
            MOQ: 50,
          },
        ],
        message: "Low stock products retrieved",
      },
    },
  },

  getProductStatistics: {
    method: "GET",
    path: "/api/v1/products/admin/statistics",
    auth: "REQUIRED - Admin role",
    description: "Get product statistics for admin dashboard",
    exampleResponse: {
      status: 200,
      body: {
        success: true,
        statusCode: 200,
        data: {
          totalStats: [
            {
              totalProducts: 45,
              activeProducts: 42,
              averagePrice: 275.5,
              totalStockValue: 1234567.89,
              totalStockQty: 50000,
            },
          ],
          categoryCounts: [
            {
              _id: "salt",
              count: 20,
              activeCount: 19,
            },
            {
              _id: "spices",
              count: 15,
              activeCount: 14,
            },
          ],
        },
        message: "Product statistics retrieved",
      },
    },
  },
};

// ═════════════════════════════════════════════════════════════════════════
// SECTION 2: DATA MODELS & VALIDATION
// ═════════════════════════════════════════════════════════════════════════

const PRODUCT_MODEL = {
  _id: { type: "ObjectId", auto: true, description: "MongoDB ID" },
  name: { type: "string", required: true, minLength: 3, maxLength: 100 },
  description: { type: "string", required: true, minLength: 10, maxLength: 500 },
  productCode: { type: "string", required: true, unique: true, pattern: "^[A-Z0-9-]+$" },
  category: { type: "string", required: true, enum: ["salt", "spices", "minerals", "other"] },
  price: { type: "number", required: true, min: 0.01, description: "Base price per unit" },
  MOQ: {
    type: "number",
    required: true,
    min: 1,
    description: "Minimum Order Quantity - cannot order less than this",
  },
  stockQty: {
    type: "number",
    default: 0,
    min: 0,
    description: "Current stock quantity",
  },
  reorderLevel: {
    type: "number",
    default: 0,
    min: 0,
    description: "Stock level below which reorder is needed",
  },
  unit: {
    type: "string",
    required: true,
    enum: ["kg", "ton", "bag", "box", "piece"],
    description: "Unit of measurement",
  },
  image: {
    type: "string",
    description: "Cloudinary URL for product image",
  },
  pricingTiers: {
    type: "array",
    items: {
      minQty: { type: "number", description: "Minimum quantity for this tier" },
      maxQty: { type: "number", description: "Maximum quantity for this tier" },
      price: { type: "number", description: "Price for this tier" },
    },
    description: "Bulk pricing tiers - must be sorted by minQty with no gaps",
  },
  supplier: { type: "string", description: "Supplier name" },
  hsn: {
    type: "string",
    pattern: "^[0-9]{8}$",
    description: "HSN Code for GST purposes",
  },
  isActive: {
    type: "boolean",
    default: true,
    description: "Whether product is available for ordering",
  },
  createdAt: { type: "date", auto: true, description: "Product creation timestamp" },
  updatedAt: { type: "date", auto: true, description: "Last update timestamp" },
};

// ═════════════════════════════════════════════════════════════════════════
// SECTION 3: ERROR HANDLING & STATUS CODES
// ═════════════════════════════════════════════════════════════════════════

const ERROR_RESPONSES = {
  400: {
    description: "Bad Request - Invalid input",
    examples: [
      "Missing required fields",
      "Invalid product name",
      "Price must be positive",
      "MOQ must be positive",
      "Minimum order quantity is 100. Requested: 50",
    ],
  },
  404: {
    description: "Not Found",
    examples: [
      "Product not found",
    ],
  },
  409: {
    description: "Conflict - Duplicate resource",
    examples: [
      "Product with code SALT-001 already exists",
    ],
  },
  500: {
    description: "Internal Server Error",
    examples: [
      "Image upload failed",
      "Database error",
    ],
  },
};

// ═════════════════════════════════════════════════════════════════════════
// SECTION 4: MOQ & BULK PRICING LOGIC
// ═════════════════════════════════════════════════════════════════════════

const MOQ_VALIDATION_RULES = {
  rule: "Quantity must be >= MOQ",
  example: {
    MOQ: 100,
    validQuantities: [100, 250, 500, 1000],
    invalidQuantities: [1, 50, 99],
  },
  error: "Minimum order quantity is {MOQ}. Requested: {qty}",
};

const BULK_PRICING_LOGIC = {
  description: "Price determined by quantity using pricingTiers array",
  algorithm: "Find first tier where qty >= minQty AND qty <= maxQty, use that price",
  example: {
    pricingTiers: [
      { minQty: 100, maxQty: 500, price: 250 },
      { minQty: 501, maxQty: 1000, price: 240 },
      { minQty: 1001, maxQty: 5000, price: 230 },
    ],
    scenarios: [
      { qty: 50, result: "Error - Below MOQ (100)" },
      { qty: 100, result: "Price: 250" },
      { qty: 250, result: "Price: 250" },
      { qty: 500, result: "Price: 250" },
      { qty: 501, result: "Price: 240" },
      { qty: 1001, result: "Price: 230" },
      { qty: 10000, result: "Price: 230 (above max tier, use last tier)" },
    ],
  },
  implementation: "Product.getPriceForQuantity(qty) method in Phase 1",
};

// ═════════════════════════════════════════════════════════════════════════
// SECTION 5: CLOUDINARY IMAGE UPLOAD INTEGRATION
// ═════════════════════════════════════════════════════════════════════════

const CLOUDINARY_INTEGRATION = {
  provider: "Cloudinary v2.9.0",
  folder: "radhe-salt/products",
  features: {
    autoQuality: "auto",
    resourceType: "auto",
    responsive: true,
    caching: "Cloudinary CDN",
  },
  configuration: {
    apiKey: "process.env.CLOUDINARY_API_KEY",
    apiSecret: "process.env.CLOUDINARY_API_SECRET",
    cloudName: "process.env.CLOUDINARY_CLOUD_NAME",
  },
  errorHandling: {
    uploadFailure: {
      status: 500,
      message: "Image upload failed: {error}",
    },
  },
};

// ═════════════════════════════════════════════════════════════════════════
// SECTION 6: INVENTORY LEDGER INTEGRATION
// ═════════════════════════════════════════════════════════════════════════

const INVENTORY_LEDGER_INTEGRATION = {
  trigger: "Restock endpoint creates immutable ledger entry",
  fields: {
    productId: "Product being restocked",
    changeType: "credit (for restock)",
    quantityChanged: "Amount added",
    previousQty: "Stock before",
    newQty: "Stock after",
    reason: "restock, new_shipment, adjustment, etc.",
    triggeredBy: "Admin user ID",
    triggeredByType: "Admin",
    notes: "Optional notes",
  },
  immutable: "Cannot be updated after creation",
  useCase: "Complete audit trail of all stock movements",
};

// ═════════════════════════════════════════════════════════════════════════
// SECTION 7: AUDIT LOGGING INTEGRATION
// ═════════════════════════════════════════════════════════════════════════

const AUDIT_LOGGING = {
  triggers: [
    "PRODUCT_ADDED - On product creation",
    "PRODUCT_UPDATED - On product update",
    "PRODUCT_DELETED - On product deletion (soft delete)",
    "PRODUCT_RESTOCKED - On restock operation",
  ],
  fields: {
    actorId: "Admin who performed action",
    actorRole: "admin/super_admin",
    action: "One of the triggers above",
    targetId: "Product ID",
    beforeSnapshot: "Full product data before change",
    afterSnapshot: "Full product data after change",
    context: "Additional context (reason, quantity, etc.)",
    ipAddress: "Admin's IP address",
    userAgent: "Admin's browser/client info",
    status: "success/failure",
  },
  immutable: "Cannot be updated after creation",
  compliance: "Complete audit trail for regulatory compliance",
};

// ═════════════════════════════════════════════════════════════════════════
// SECTION 8: MIDDLEWARE USAGE
// ═════════════════════════════════════════════════════════════════════════

const MIDDLEWARE_COMPOSITION = {
  publicEndpoints: {
    flow: "Morgan Logger → Body Parser → Controller",
    examples: ["GET /products", "GET /products/:id"],
  },
  adminEndpoints: {
    flow: "Morgan Logger → Body Parser → verifyJWT → verifyAdminRole → Multer (for file upload) → Controller",
    examples: [
      "POST /products",
      "PUT /products/:id",
      "DELETE /products/:id",
      "POST /products/:id/restock",
    ],
  },
};

// ═════════════════════════════════════════════════════════════════════════
// SECTION 9: COMMON WORKFLOWS
// ═════════════════════════════════════════════════════════════════════════

const WORKFLOW_EXAMPLES = {
  createProductWorkflow: {
    steps: [
      "1. Admin clicks 'Add Product'",
      "2. Admin fills form: name, description, productCode, category, price, MOQ, unit, image",
      "3. Submit POST /api/v1/products with multipart/form-data",
      "4. Server validates all fields",
      "5. Server uploads image to Cloudinary",
      "6. Server creates Product in MongoDB",
      "7. Server creates AuditLog entry",
      "8. Return created product with 201 status",
    ],
  },

  viewProductsWorkflow: {
    steps: [
      "1. Dealer/Customer opens product listing",
      "2. Frontend sends GET /api/v1/products?page=1&limit=20&category=salt",
      "3. Server applies filters and pagination",
      "4. Return paginated product list with 200 status",
    ],
  },

  checkPricingWorkflow: {
    steps: [
      "1. Dealer selects product and enters quantity (e.g., 250 kg)",
      "2. Frontend sends GET /api/v1/products/:id/pricing?quantity=250",
      "3. Server validates MOQ (250 >= 100 ✓)",
      "4. Server finds applicable pricing tier (501-1000? No, so use 100-500 tier)",
      "5. Return price: 250/unit, total: 62500, discount: 4%",
      "6. Dealer can now confirm order with this pricing",
    ],
  },

  restockProductWorkflow: {
    steps: [
      "1. Admin receives shipment of 5000 kg Rock Salt",
      "2. Admin clicks 'Restock' for product SALT-001",
      "3. Admin enters quantity: 5000, reason: new_shipment",
      "4. Submit POST /api/v1/products/:id/restock",
      "5. Server increases stockQty from 5000 to 10000",
      "6. Server creates immutable InventoryLedger entry",
      "7. Server creates AuditLog entry with before/after snapshots",
      "8. Return success with ledger entry details",
    ],
  },
};

// ═════════════════════════════════════════════════════════════════════════
// SECTION 10: SECURITY CONSIDERATIONS
// ═════════════════════════════════════════════════════════════════════════

const SECURITY_FEATURES = {
  adminOnlyEndpoints: "RBAC middleware ensures only admin can create/update/delete products",
  imageUpload: "Images uploaded to Cloudinary, not stored locally",
  auditLogging: "All admin actions logged with IP, user agent, before/after snapshots",
  immutableLedger: "Stock changes create write-once ledger entries",
  dataValidation: "All inputs validated before database operations",
  softDelete: "Products not permanently deleted, just marked inactive",
};

export { PRODUCT_ENDPOINTS, PRODUCT_MODEL, ERROR_RESPONSES, WORKFLOW_EXAMPLES, SECURITY_FEATURES };
