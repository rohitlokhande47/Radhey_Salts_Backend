/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PHASE 4: ORDER MANAGEMENT SYSTEM - COMPLETE REFERENCE GUIDE
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * This file contains complete API specifications, workflows, and patterns
 * for Order Management System including placement, validation, tracking,
 * status management, and analytics.
 */

// ═════════════════════════════════════════════════════════════════════════
// SECTION 1: API ENDPOINTS OVERVIEW
// ═════════════════════════════════════════════════════════════════════════

const ORDER_ENDPOINTS = {
  // ───────────────────────────────────────────────────────────────────
  // DEALER ENDPOINTS (JWT + Dealer role required)
  // ───────────────────────────────────────────────────────────────────

  placeOrder: {
    method: "POST",
    path: "/api/v1/orders",
    auth: "REQUIRED - Dealer role",
    description: "Place new order with stock validation, MOQ checking, and price calculation",
    contentType: "application/json",
    requiredFields: ["items", "deliveryAddress"],
    optionalFields: ["paymentMethod"],
    exampleRequest: {
      method: "POST",
      path: "/api/v1/orders",
      headers: {
        Authorization: "Bearer <JWT_TOKEN>",
        "Content-Type": "application/json",
      },
      body: {
        items: [
          {
            productId: "507f1f77bcf86cd799439011",
            quantity: 500,
          },
          {
            productId: "507f1f77bcf86cd799439013",
            quantity: 250,
          },
        ],
        deliveryAddress: "123 Main Street, City, State 12345",
        paymentMethod: "credit",
      },
    },
    exampleResponse: {
      status: 201,
      body: {
        success: true,
        statusCode: 201,
        data: {
          order: {
            _id: "507f1f77bcf86cd799439020",
            orderRef: "ORD-260424-00001",
            dealerId: "507f1f77bcf86cd799439005",
            items: [
              {
                productId: "507f1f77bcf86cd799439011",
                quantity: 500,
                unitPrice: 240,
                totalPrice: 120000,
              },
            ],
            totalAmount: 120000,
            orderStatus: "pending",
            deliveryStage: "awaiting_confirmation",
            paymentStatus: "pending",
            deliveryAddress: "123 Main Street, City, State 12345",
            paymentMethod: "credit",
            orderedAt: "2026-04-24T10:00:00Z",
          },
          ledgerEntries: [
            {
              _id: "507f1f77bcf86cd799439021",
              productId: "507f1f77bcf86cd799439011",
              changeType: "debit",
              quantityChanged: 500,
              previousQty: 1000,
              newQty: 500,
              reason: "order_placed",
            },
          ],
        },
        message: "Order ORD-260424-00001 placed successfully",
      },
    },
    validation: {
      items: "Must be array with at least 1 item",
      quantity: "Must be >= MOQ",
      productId: "Must be valid product ID",
      stock: "Must have sufficient stock",
      deliveryAddress: "Required string",
      paymentMethod: "cash, credit, cheque, bank_transfer",
    },
    errors: {
      400: "Validation failed (quantity < MOQ, insufficient stock)",
      404: "Product not found",
    },
  },

  getOrdersByDealer: {
    method: "GET",
    path: "/api/v1/orders/my-orders",
    auth: "REQUIRED - Dealer role",
    description: "Get dealer's order history with pagination and filtering",
    queryParameters: {
      page: { type: "number", default: 1 },
      limit: { type: "number", default: 10, max: 100 },
      status: { type: "string", enum: ["pending", "confirmed", "dispatched", "delivered", "cancelled"] },
      paymentStatus: { type: "string", enum: ["pending", "partial", "completed", "failed"] },
      sortBy: { type: "string", default: "orderedAt", enum: ["orderedAt", "totalAmount", "orderStatus"] },
      sortOrder: { type: "string", default: "desc", enum: ["asc", "desc"] },
    },
    exampleRequest: `
      GET /api/v1/orders/my-orders?page=1&limit=10&status=confirmed&sortBy=orderedAt&sortOrder=desc
      Header: Authorization: Bearer <JWT_TOKEN>
    `,
    exampleResponse: {
      status: 200,
      body: {
        success: true,
        data: {
          orders: [
            {
              _id: "507f1f77bcf86cd799439020",
              orderRef: "ORD-260424-00001",
              items: "array of order items",
              totalAmount: 120000,
              orderStatus: "confirmed",
              paymentStatus: "completed",
              deliveryStage: "in_preparation",
              orderedAt: "2026-04-24T10:00:00Z",
              confirmedAt: "2026-04-24T11:00:00Z",
            },
          ],
          pagination: {
            page: 1,
            limit: 10,
            total: 45,
            totalPages: 5,
          },
        },
      },
    },
  },

  getOrderById: {
    method: "GET",
    path: "/api/v1/orders/:id",
    auth: "REQUIRED",
    description: "Get single order details (Dealer sees own, Admin sees all)",
    exampleRequest: `
      GET /api/v1/orders/507f1f77bcf86cd799439020
      Header: Authorization: Bearer <JWT_TOKEN>
    `,
    exampleResponse: {
      status: 200,
      body: {
        success: true,
        data: {
          _id: "507f1f77bcf86cd799439020",
          orderRef: "ORD-260424-00001",
          dealerId: {
            _id: "507f1f77bcf86cd799439005",
            name: "Dealer Name",
            email: "dealer@example.com",
            phone: "9876543210",
          },
          items: [
            {
              productId: {
                _id: "507f1f77bcf86cd799439011",
                name: "Rock Salt Premium",
                productCode: "SALT-001",
                unit: "kg",
                price: 250,
              },
              quantity: 500,
              unitPrice: 240,
              totalPrice: 120000,
            },
          ],
          totalAmount: 120000,
          orderStatus: "confirmed",
          paymentStatus: "completed",
          deliveryStage: "in_transit",
          deliveryAddress: "123 Main Street",
        },
      },
    },
  },

  cancelOrder: {
    method: "POST",
    path: "/api/v1/orders/:id/cancel",
    auth: "REQUIRED",
    description: "Cancel pending order and restore stock",
    body: {
      reason: "customer_request, wrong_order, etc",
    },
    exampleRequest: `
      POST /api/v1/orders/507f1f77bcf86cd799439020/cancel
      Header: Authorization: Bearer <JWT_TOKEN>
      Body: {"reason": "customer_request"}
    `,
    exampleResponse: {
      status: 200,
      body: {
        success: true,
        data: {
          order: {
            orderStatus: "cancelled",
          },
          ledgerEntries: [
            {
              changeType: "credit",
              quantityChanged: 500,
              reason: "order_cancellation",
            },
          ],
          message: "Order cancelled successfully, stock restored",
        },
      },
    },
    restrictions: "Can only cancel pending orders",
  },

  getOrderTimeline: {
    method: "GET",
    path: "/api/v1/orders/:id/timeline",
    auth: "REQUIRED",
    description: "Get order status timeline with timestamps",
    exampleResponse: {
      status: 200,
      body: {
        success: true,
        data: {
          orderRef: "ORD-260424-00001",
          currentStatus: "in_transit",
          deliveryStage: "in_transit",
          timeline: [
            {
              stage: "Order Placed",
              status: "completed",
              timestamp: "2026-04-24T10:00:00Z",
              description: "Order ORD-260424-00001 created",
            },
            {
              stage: "Order Confirmed",
              status: "completed",
              timestamp: "2026-04-24T11:00:00Z",
              description: "Order confirmed by admin",
            },
            {
              stage: "In Preparation",
              status: "completed",
              timestamp: "2026-04-24T12:00:00Z",
              description: "Order being prepared",
            },
            {
              stage: "In Transit",
              status: "in_progress",
              timestamp: null,
              description: "Order on the way",
            },
          ],
        },
      },
    },
  },

  // ───────────────────────────────────────────────────────────────────
  // ADMIN ENDPOINTS (JWT + Admin role required)
  // ───────────────────────────────────────────────────────────────────

  getAllOrders: {
    method: "GET",
    path: "/api/v1/orders/admin/all-orders",
    auth: "REQUIRED - Admin role",
    description: "Get all orders with pagination and filtering",
    queryParameters: {
      page: { type: "number", default: 1 },
      limit: { type: "number", default: 20 },
      orderStatus: { type: "string" },
      paymentStatus: { type: "string" },
      sortBy: { type: "string", default: "orderedAt" },
      sortOrder: { type: "string", default: "desc" },
    },
  },

  getOrderStatistics: {
    method: "GET",
    path: "/api/v1/orders/admin/statistics",
    auth: "REQUIRED - Admin role",
    description: "Get dashboard statistics with aggregated data",
    exampleResponse: {
      status: 200,
      body: {
        success: true,
        data: {
          totalStats: [
            {
              totalOrders: 1250,
              totalRevenue: 5000000,
              averageOrderValue: 4000,
              totalItems: 25000,
            },
          ],
          statusBreakdown: [
            { _id: "delivered", count: 800, revenue: 3200000 },
            { _id: "confirmed", count: 300, revenue: 1200000 },
            { _id: "pending", count: 100, revenue: 400000 },
          ],
          paymentBreakdown: [
            { _id: "completed", count: 900, revenue: 3600000 },
            { _id: "pending", count: 300, revenue: 1200000 },
          ],
          topDealers: [
            {
              _id: "507f1f77bcf86cd799439005",
              orderCount: 45,
              totalSpent: 450000,
              dealerInfo: [{ name: "Dealer A", businessName: "Business A" }],
            },
          ],
          timelineStats: [
            {
              _id: "2026-04-24",
              dailyOrders: 25,
              dailyRevenue: 100000,
            },
          ],
        },
      },
    },
  },

  updateOrderStatus: {
    method: "PUT",
    path: "/api/v1/orders/:id/status",
    auth: "REQUIRED - Admin role",
    description: "Update order status with automatic timestamp tracking",
    body: {
      orderStatus: "pending, confirmed, dispatched, delivered, cancelled",
      deliveryStage: "awaiting_confirmation, in_preparation, in_transit, out_for_delivery, delivered",
      notes: "optional notes",
    },
    statusFlow: [
      "pending → confirmed (sets confirmedAt)",
      "confirmed → dispatched (sets dispatchedAt)",
      "dispatched → delivered (sets deliveredAt)",
    ],
  },

  updatePaymentStatus: {
    method: "PUT",
    path: "/api/v1/orders/:id/payment",
    auth: "REQUIRED - Admin role",
    description: "Update payment status",
    body: {
      paymentStatus: "pending, partial, completed, failed",
      amountPaid: "number",
      notes: "optional notes",
    },
  },
};

// ═════════════════════════════════════════════════════════════════════════
// SECTION 2: ORDER PLACEMENT WORKFLOW
// ═════════════════════════════════════════════════════════════════════════

const ORDER_PLACEMENT_WORKFLOW = `
STEP 1: VALIDATE REQUEST
├─ Check items array not empty
├─ Check deliveryAddress provided
└─ Check paymentMethod valid

STEP 2: PROCESS EACH ITEM
├─ Fetch product
├─ Validate product exists and isActive
├─ MOQ Validation: quantity >= MOQ
├─ Stock Validation: quantity <= available stock
├─ Calculate unit price based on quantity (bulk pricing)
└─ Calculate item total

STEP 3: CALCULATE TOTALS
├─ Sum all item totals
└─ Store total amount for order

STEP 4: CREATE ORDER
├─ Generate order reference (ORD-YYMMDD-XXXXX)
├─ Create Order document with:
│  ├─ dealerId (from JWT)
│  ├─ items (with unitPrice, totalPrice)
│  ├─ totalAmount
│  ├─ orderStatus: "pending"
│  ├─ deliveryStage: "awaiting_confirmation"
│  ├─ paymentStatus: "pending"
│  └─ orderedAt: current timestamp
└─ Return order

STEP 5: DEDUCT STOCK
├─ For each item:
│  ├─ Update product.stockQty (previousQty - quantity)
│  └─ Create InventoryLedger entry:
│     ├─ changeType: "debit"
│     ├─ reason: "order_placed"
│     └─ triggeredBy: order._id
└─ All items updated

STEP 6: CREATE AUDIT LOG
├─ Action: ORDER_PLACED
├─ Record order reference
├─ Record total amount
├─ Record item count
└─ Status: success

STEP 7: RETURN RESPONSE
├─ Status: 201 Created
├─ Include: order details
├─ Include: inventory ledger entries
└─ Include: success message with order reference
`;

// ═════════════════════════════════════════════════════════════════════════
// SECTION 3: ORDER STATUS FLOW
// ═════════════════════════════════════════════════════════════════════════

const ORDER_STATUS_FLOW = {
  statusStages: [
    {
      status: "pending",
      description: "Order placed, awaiting admin confirmation",
      canTransition: ["confirmed", "cancelled"],
      timestamp: "orderedAt",
    },
    {
      status: "confirmed",
      description: "Order confirmed by admin",
      canTransition: ["dispatched", "cancelled"],
      timestamp: "confirmedAt",
    },
    {
      status: "dispatched",
      description: "Order shipped from warehouse",
      canTransition: ["delivered"],
      timestamp: "dispatchedAt",
    },
    {
      status: "delivered",
      description: "Order delivered to dealer",
      canTransition: [],
      timestamp: "deliveredAt",
    },
    {
      status: "cancelled",
      description: "Order cancelled (stock restored)",
      canTransition: [],
      timestamp: "none",
    },
  ],

  deliveryStages: [
    "awaiting_confirmation",
    "in_preparation",
    "in_transit",
    "out_for_delivery",
    "delivered",
  ],
};

// ═════════════════════════════════════════════════════════════════════════
// SECTION 4: VALIDATION RULES
// ═════════════════════════════════════════════════════════════════════════

const VALIDATION_RULES = {
  items: {
    rule: "Must be non-empty array",
    example: {
      valid: [{ productId: "...", quantity: 500 }],
      invalid: [],
    },
  },
  quantity: {
    rule: "Must be >= MOQ and <= available stock",
    example: {
      MOQ: 100,
      available: 5000,
      valid: [100, 500, 5000],
      invalid: [50, 6000],
    },
  },
  paymentMethod: {
    rule: "Must be one of: cash, credit, cheque, bank_transfer",
    default: "credit",
  },
  deliveryAddress: {
    rule: "Required string",
  },
  orderReference: {
    rule: "Auto-generated: ORD-YYMMDD-XXXXX",
    example: "ORD-260424-00001",
  },
};

// ═════════════════════════════════════════════════════════════════════════
// SECTION 5: INVENTORY INTEGRATION
// ═════════════════════════════════════════════════════════════════════════

const INVENTORY_INTEGRATION = {
  orderPlacement: {
    trigger: "When order is created",
    action: "Deduct stock and create ledger entry",
    fields: {
      changeType: "debit",
      reason: "order_placed",
      quantityChanged: "order quantity",
    },
  },
  orderCancellation: {
    trigger: "When pending order is cancelled",
    action: "Restore stock and create ledger entry",
    fields: {
      changeType: "credit",
      reason: "order_cancellation",
      quantityChanged: "order quantity",
    },
  },
  auditTrail: "Complete history of all stock movements",
};

// ═════════════════════════════════════════════════════════════════════════
// SECTION 6: PRICING INTEGRATION
// ═════════════════════════════════════════════════════════════════════════

const PRICING_INTEGRATION = {
  dynamicPricing: {
    description: "Price calculated based on order quantity",
    logic: "Product.getPriceForQuantity(quantity) from Phase 3",
    example: {
      product: "SALT-001",
      pricingTiers: [
        { minQty: 100, maxQty: 500, price: 250 },
        { minQty: 501, maxQty: 1000, price: 240 },
      ],
      quantities: {
        100: { price: 250, total: 25000 },
        250: { price: 250, total: 62500 },
        500: { price: 240, total: 120000 },
      },
    },
  },
};

// ═════════════════════════════════════════════════════════════════════════
// SECTION 7: ERROR HANDLING
// ═════════════════════════════════════════════════════════════════════════

const ERROR_RESPONSES = {
  400: {
    description: "Bad Request - Validation errors",
    examples: [
      "Order must contain at least one item",
      "Minimum order quantity is 100. Requested: 50",
      "Only 1000 units available. Requested: 5000",
      "Invalid payment method",
    ],
  },
  401: {
    description: "Unauthorized - Missing or invalid token",
  },
  403: {
    description: "Forbidden - Insufficient permissions",
    examples: [
      "You can only view your own orders",
      "You can only cancel your own orders",
    ],
  },
  404: {
    description: "Not Found",
    examples: ["Order not found", "Product not found"],
  },
  500: {
    description: "Server Error",
  },
};

export { ORDER_ENDPOINTS, ORDER_PLACEMENT_WORKFLOW, ORDER_STATUS_FLOW, VALIDATION_RULES, INVENTORY_INTEGRATION, PRICING_INTEGRATION, ERROR_RESPONSES };
