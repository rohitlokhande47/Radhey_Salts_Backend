/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PHASE 4: ORDER MANAGEMENT SYSTEM - VISUAL FLOW DIAGRAMS
 * ═══════════════════════════════════════════════════════════════════════════
 */

const PHASE4_FLOW_DIAGRAMS = {
  // ═════════════════════════════════════════════════════════════════════
  // FLOW 1: COMPLETE ORDER PLACEMENT WORKFLOW
  // ═════════════════════════════════════════════════════════════════════
  orderPlacementFlow: `
    ┌─────────────────────────────────────────────────────────────────┐
    │        FLOW 1: COMPLETE ORDER PLACEMENT WORKFLOW               │
    └─────────────────────────────────────────────────────────────────┘

    Dealer (Authenticated)
      │
      ├─ Prepares order:
      │  ├─ Item 1: SALT-001, Qty: 500 kg
      │  ├─ Item 2: SALT-003, Qty: 250 kg
      │  └─ Delivery: 123 Main Street
      │
      ↓
    ┌──────────────────────────────────────────────────────────────────┐
    │  POST /api/v1/orders                                            │
    │  Header: Authorization: Bearer <JWT_TOKEN>                      │
    │  Body: { items: [...], deliveryAddress, paymentMethod }        │
    └──────────────────────────────────────────────────────────────────┘
      │
      ↓
    ┌──────────────────────────────────────────────────────────────────┐
    │  Middleware Chain                                               │
    ├──────────────────────────────────────────────────────────────────┤
    │  ✓ verifyJWT - Authenticate dealer                             │
    │  ✓ verifyDealerRole - Verify dealer role                       │
    └──────────────────────────────────────────────────────────────────┘
      │
      ↓
    ┌──────────────────────────────────────────────────────────────────┐
    │  Controller: placeOrder()                                       │
    ├──────────────────────────────────────────────────────────────────┤
    │  1. Validate items array not empty                              │
    │  2. For each item:                                              │
    │     ├─ Fetch product from database                              │
    │     ├─ Check product isActive                                   │
    │     ├─ Validate: quantity >= MOQ                                │
    │     ├─ Validate: quantity <= available stock                    │
    │     ├─ Calculate unitPrice = getPriceForQuantity(qty)           │
    │     └─ Calculate itemTotal = unitPrice × quantity              │
    │  3. Sum all items → totalAmount                                 │
    │  4. Generate order reference: ORD-260424-00001                  │
    └──────────────────────────────────────────────────────────────────┘
      │
      ├─ Atomic Database Operations
      │  │
      │  ├─ Operation 1: Create Order Document
      │  │  ├─ dealerId: from JWT
      │  │  ├─ items: array with calculated prices
      │  │  ├─ totalAmount: sum of all items
      │  │  ├─ orderStatus: "pending"
      │  │  ├─ deliveryStage: "awaiting_confirmation"
      │  │  ├─ paymentStatus: "pending"
      │  │  ├─ orderRef: "ORD-260424-00001"
      │  │  └─ orderedAt: current timestamp
      │  │
      │  ├─ Operation 2: Deduct Stock for Each Item
      │  │  For SALT-001 (qty 500):
      │  │  ├─ Update Product.stockQty: 1000 - 500 = 500
      │  │  └─ Create InventoryLedger:
      │  │     ├─ productId: SALT-001
      │  │     ├─ changeType: "debit"
      │  │     ├─ quantityChanged: 500
      │  │     ├─ previousQty: 1000
      │  │     ├─ newQty: 500
      │  │     ├─ reason: "order_placed"
      │  │     └─ triggeredBy: order._id
      │  │
      │  │  For SALT-003 (qty 250):
      │  │  ├─ Update Product.stockQty: 2000 - 250 = 1750
      │  │  └─ Create InventoryLedger (similar)
      │  │
      │  └─ Operation 3: Create AuditLog
      │     ├─ action: "ORDER_PLACED"
      │     ├─ actorId: dealer._id
      │     ├─ targetId: order._id
      │     ├─ afterSnapshot: order details
      │     ├─ context: totalAmount, itemCount
      │     └─ status: "success"
      │
      ↓
    ┌──────────────────────────────────────────────────────────────────┐
    │  Response (201 Created)                                         │
    ├──────────────────────────────────────────────────────────────────┤
    │  {                                                               │
    │    success: true,                                               │
    │    statusCode: 201,                                             │
    │    data: {                                                       │
    │      order: {                                                    │
    │        _id: "507f...",                                          │
    │        orderRef: "ORD-260424-00001",                           │
    │        dealerId: "507f...",                                     │
    │        items: [...],                                            │
    │        totalAmount: 180000,                                     │
    │        orderStatus: "pending",                                  │
    │        orderedAt: "2026-04-24T10:00:00Z"                        │
    │      },                                                          │
    │      ledgerEntries: [2 entries showing stock deduction],        │
    │      message: "Order ORD-260424-00001 placed successfully"      │
    │    }                                                             │
    │  }                                                               │
    └──────────────────────────────────────────────────────────────────┘
      │
      ↓
    Dealer
      └─ Receives order confirmation
      └─ Order now in "pending" status
      └─ Stock deducted from inventory
      └─ Awaiting admin confirmation
  `,

  // ═════════════════════════════════════════════════════════════════════
  // FLOW 2: ORDER STATUS PROGRESSION
  // ═════════════════════════════════════════════════════════════════════
  orderStatusFlow: `
    ┌─────────────────────────────────────────────────────────────────┐
    │          FLOW 2: ORDER STATUS PROGRESSION                      │
    └─────────────────────────────────────────────────────────────────┘

    Order Created (ORD-260424-00001)
           │
           ↓
    ┌──────────────────────────────┐
    │  Status: PENDING            │
    │  ├─ Awaiting admin check    │
    │  ├─ Stock already deducted  │
    │  └─ orderedAt: timestamp    │
    └──────────────────────────────┘
           │
           ├─ Option A: CONFIRM ─→ (Admin action)
           │
           ↓
    ┌──────────────────────────────┐
    │  Status: CONFIRMED          │
    │  ├─ Ready for preparation   │
    │  ├─ confirmedAt: timestamp  │
    │  ├─ Delivery: in_preparation│
    │  └─ Payment pending         │
    └──────────────────────────────┘
           │
           ↓ (Admin updates status)
    ┌──────────────────────────────┐
    │  Status: DISPATCHED         │
    │  ├─ Shipped from warehouse  │
    │  ├─ dispatchedAt: timestamp │
    │  ├─ Delivery: in_transit    │
    │  └─ Tracking ready          │
    └──────────────────────────────┘
           │
           ↓ (Admin updates status)
    ┌──────────────────────────────┐
    │  Status: DELIVERED          │
    │  ├─ Received by dealer      │
    │  ├─ deliveredAt: timestamp  │
    │  ├─ Complete audit trail    │
    │  └─ Final status            │
    └──────────────────────────────┘

    Alternative Path:

    From PENDING:
           │
           ├─ Option B: CANCEL ─→ (Dealer or Admin)
           │
           ↓
    ┌──────────────────────────────┐
    │  Status: CANCELLED          │
    │  ├─ Order cancelled         │
    │  ├─ Stock restored          │
    │  ├─ Inventory ledger entry  │
    │  │  (type: credit)          │
    │  └─ Complete record kept    │
    └──────────────────────────────┘

    Timestamps Tracked:
    ├─ orderedAt:      Order placed
    ├─ confirmedAt:    Admin confirmed
    ├─ dispatchedAt:   Shipped
    └─ deliveredAt:    Received
  `,

  // ═════════════════════════════════════════════════════════════════════
  // FLOW 3: ORDER CANCELLATION WITH STOCK RESTORATION
  // ═════════════════════════════════════════════════════════════════════
  cancelOrderFlow: `
    ┌─────────────────────────────────────────────────────────────────┐
    │   FLOW 3: ORDER CANCELLATION WITH STOCK RESTORATION            │
    └─────────────────────────────────────────────────────────────────┘

    Dealer/Admin
      │
      ├─ Wants to cancel Order ORD-260424-00001
      │  ├─ Status: PENDING
      │  ├─ Items:
      │  │  ├─ SALT-001: 500 kg (currently deducted)
      │  │  └─ SALT-003: 250 kg (currently deducted)
      │  └─ Reason: customer_request
      │
      ↓
    ┌──────────────────────────────────────────────────────────────────┐
    │  POST /api/v1/orders/:id/cancel                                 │
    │  Header: Authorization: Bearer <JWT_TOKEN>                      │
    │  Body: {"reason": "customer_request"}                           │
    └──────────────────────────────────────────────────────────────────┘
      │
      ↓
    ┌──────────────────────────────────────────────────────────────────┐
    │  Middleware: verifyJWT + Authorization check                    │
    ├──────────────────────────────────────────────────────────────────┤
    │  ✓ Verify JWT token                                             │
    │  ✓ If dealer: check if own order                                │
    │  ✓ If admin: can cancel any order                               │
    └──────────────────────────────────────────────────────────────────┘
      │
      ↓
    ┌──────────────────────────────────────────────────────────────────┐
    │  Controller: cancelOrder()                                      │
    ├──────────────────────────────────────────────────────────────────┤
    │  1. Check order status = "pending"                              │
    │     (Can only cancel pending orders)                            │
    │  2. Update order.orderStatus = "cancelled"                      │
    │  3. For each item, restore stock:                               │
    │     ├─ For SALT-001:                                            │
    │     │  ├─ Current stock: 500 (was deducted)                     │
    │     │  └─ New stock: 500 + 500 = 1000 (restored)               │
    │     └─ For SALT-003:                                            │
    │        ├─ Current stock: 1750 (was deducted)                    │
    │        └─ New stock: 1750 + 250 = 2000 (restored)              │
    └──────────────────────────────────────────────────────────────────┘
      │
      ├─ Database Operations
      │  │
      │  ├─ Operation 1: Update Order
      │  │  └─ orderStatus: "pending" → "cancelled"
      │  │
      │  ├─ Operation 2: Restore Stock
      │  │  ├─ Product SALT-001: stockQty = 1000
      │  │  └─ Product SALT-003: stockQty = 2000
      │  │
      │  ├─ Operation 3: Create InventoryLedger Entries
      │  │  ├─ Entry for SALT-001:
      │  │  │  ├─ changeType: "credit" (restoration)
      │  │  │  ├─ quantityChanged: 500
      │  │  │  ├─ previousQty: 500
      │  │  │  ├─ newQty: 1000
      │  │  │  ├─ reason: "order_cancellation"
      │  │  │  └─ notes: "Cancellation of ORD-260424-00001: ..."
      │  │  │
      │  │  └─ Entry for SALT-003: (similar)
      │  │
      │  └─ Operation 4: Create AuditLog
      │     ├─ action: "ORDER_CANCELLED"
      │     ├─ beforeSnapshot: {orderStatus: "pending"}
      │     ├─ afterSnapshot: {orderStatus: "cancelled"}
      │     ├─ context: {reason, stockRestored: true}
      │     └─ status: "success"
      │
      ↓
    ┌──────────────────────────────────────────────────────────────────┐
    │  Response (200 OK)                                              │
    ├──────────────────────────────────────────────────────────────────┤
    │  {                                                               │
    │    success: true,                                               │
    │    data: {                                                       │
    │      order: {                                                    │
    │        _id: "507f...",                                          │
    │        orderRef: "ORD-260424-00001",                           │
    │        orderStatus: "cancelled"                                 │
    │      },                                                          │
    │      ledgerEntries: [2 entries with changeType: "credit"],      │
    │      message: "Order cancelled successfully, stock restored"    │
    │    }                                                             │
    │  }                                                               │
    └──────────────────────────────────────────────────────────────────┘
      │
      ↓
    System State After Cancellation:
      │
      ├─ Order:
      │  ├─ ORD-260424-00001 marked as cancelled
      │  └─ Complete history preserved
      │
      ├─ Inventory:
      │  ├─ SALT-001: 1000 kg (fully restored)
      │  └─ SALT-003: 2000 kg (fully restored)
      │
      ├─ InventoryLedger:
      │  ├─ 2 debit entries (order placement)
      │  ├─ 2 credit entries (cancellation)
      │  └─ Complete audit trail of all movements
      │
      └─ AuditLog:
         ├─ ORDER_PLACED record
         └─ ORDER_CANCELLED record
  `,

  // ═════════════════════════════════════════════════════════════════════
  // FLOW 4: ADMIN UPDATES ORDER STATUS
  // ═════════════════════════════════════════════════════════════════════
  adminStatusUpdateFlow: `
    ┌─────────────────────────────────────────────────────────────────┐
    │    FLOW 4: ADMIN UPDATES ORDER STATUS                          │
    └─────────────────────────────────────────────────────────────────┘

    Admin Dashboard
      │
      ├─ Sees pending order: ORD-260424-00001
      │  ├─ Status: pending
      │  ├─ Amount: 180,000
      │  └─ Dealer: Dealer Inc.
      │
      ├─ Clicks "Confirm Order"
      │
      ↓
    ┌──────────────────────────────────────────────────────────────────┐
    │  PUT /api/v1/orders/:id/status                                  │
    │  Header: Authorization: Bearer <ADMIN_JWT>                      │
    │  Body: {                                                         │
    │    "orderStatus": "confirmed",                                  │
    │    "deliveryStage": "in_preparation",                           │
    │    "notes": "Ready for packing"                                 │
    │  }                                                               │
    └──────────────────────────────────────────────────────────────────┘
      │
      ↓
    ┌──────────────────────────────────────────────────────────────────┐
    │  Middleware: verifyJWT + verifyAdminRole ✓                      │
    └──────────────────────────────────────────────────────────────────┘
      │
      ↓
    ┌──────────────────────────────────────────────────────────────────┐
    │  Controller: updateOrderStatus()                                │
    ├──────────────────────────────────────────────────────────────────┤
    │  1. Fetch order from database                                   │
    │  2. Store beforeSnapshot: {orderStatus: "pending"}              │
    │  3. Update order.orderStatus = "confirmed"                      │
    │  4. Set confirmedAt = current timestamp ← AUTO TIMESTAMP       │
    │  5. Update order.deliveryStage = "in_preparation"               │
    │  6. Save to database                                            │
    └──────────────────────────────────────────────────────────────────┘
      │
      ├─ Audit Trail Created
      │  │
      │  ├─ AuditLog Entry:
      │  │  ├─ action: "ORDER_STATUS_UPDATED"
      │  │  ├─ beforeSnapshot: {orderStatus: "pending"}
      │  │  ├─ afterSnapshot: {orderStatus: "confirmed"}
      │  │  ├─ context: {orderStatus, deliveryStage, notes}
      │  │  ├─ actorId: admin._id
      │  │  ├─ ipAddress: admin's IP
      │  │  └─ status: "success"
      │  │
      │  └─ Timestamps in Order Document:
      │     ├─ confirmedAt: "2026-04-24T11:00:00Z" ← SET HERE
      │     ├─ orderedAt: "2026-04-24T10:00:00Z" (unchanged)
      │     └─ dispatchedAt: null (to be set later)
      │
      ↓
    ┌──────────────────────────────────────────────────────────────────┐
    │  Response (200 OK)                                              │
    ├──────────────────────────────────────────────────────────────────┤
    │  {                                                               │
    │    success: true,                                               │
    │    data: {                                                       │
    │      _id: "507f...",                                            │
    │      orderRef: "ORD-260424-00001",                             │
    │      orderStatus: "confirmed",                                  │
    │      deliveryStage: "in_preparation",                           │
    │      confirmedAt: "2026-04-24T11:00:00Z",                      │
    │      notes: "Ready for packing"                                 │
    │    },                                                            │
    │    message: "Order status updated successfully"                 │
    │  }                                                               │
    └──────────────────────────────────────────────────────────────────┘
      │
      ↓
    ✓ Order confirmed
    ✓ Status visible to dealer
    ✓ Automatic timestamp recorded
    ✓ Complete audit trail maintained

    NEXT STEPS FOR ADMIN:
    1. When ready to ship: Update to "dispatched" (sets dispatchedAt)
    2. When shipped: Update to "delivered" (sets deliveredAt)
    3. Each update automatically timestamped and logged
  `,

  // ═════════════════════════════════════════════════════════════════════
  // FLOW 5: DEALER VIEWS ORDER TIMELINE
  // ═════════════════════════════════════════════════════════════════════
  orderTimelineFlow: `
    ┌─────────────────────────────────────────────────────────────────┐
    │        FLOW 5: DEALER VIEWS ORDER TIMELINE                     │
    └─────────────────────────────────────────────────────────────────┘

    Dealer (Authenticated)
      │
      ├─ Clicks "Track Order" for ORD-260424-00001
      │
      ↓
    ┌──────────────────────────────────────────────────────────────────┐
    │  GET /api/v1/orders/:id/timeline                                │
    │  Header: Authorization: Bearer <DEALER_JWT>                     │
    └──────────────────────────────────────────────────────────────────┘
      │
      ↓
    ┌──────────────────────────────────────────────────────────────────┐
    │  Controller: getOrderTimeline()                                 │
    ├──────────────────────────────────────────────────────────────────┤
    │  1. Fetch order                                                 │
    │  2. Check authorization (dealer can see own)                    │
    │  3. Build timeline array from order data                        │
    │  4. Include completed stages with timestamps                    │
    │  5. Include current/in-progress stages                          │
    │  6. Return timeline to dealer                                   │
    └──────────────────────────────────────────────────────────────────┘
      │
      ↓
    ┌──────────────────────────────────────────────────────────────────┐
    │  Response (200 OK) - Timeline Data                              │
    ├──────────────────────────────────────────────────────────────────┤
    │  {                                                               │
    │    orderRef: "ORD-260424-00001",                               │
    │    currentStatus: "in_transit",                                 │
    │    deliveryStage: "in_transit",                                 │
    │    timeline: [                                                  │
    │      {                                                           │
    │        stage: "Order Placed",                                   │
    │        status: "completed",                                     │
    │        timestamp: "2026-04-24T10:00:00Z",                      │
    │        description: "Order ORD-260424-00001 created"           │
    │      },                                                          │
    │      {                                                           │
    │        stage: "Order Confirmed",                                │
    │        status: "completed",                                     │
    │        timestamp: "2026-04-24T11:00:00Z",                      │
    │        description: "Order confirmed by admin"                  │
    │      },                                                          │
    │      {                                                           │
    │        stage: "In Preparation",                                 │
    │        status: "completed",                                     │
    │        timestamp: "2026-04-24T12:00:00Z",                      │
    │        description: "Order being prepared"                      │
    │      },                                                          │
    │      {                                                           │
    │        stage: "Dispatched",                                     │
    │        status: "completed",                                     │
    │        timestamp: "2026-04-24T13:00:00Z",                      │
    │        description: "Order dispatched from warehouse"           │
    │      },                                                          │
    │      {                                                           │
    │        stage: "In Transit",                                     │
    │        status: "in_progress",                                   │
    │        timestamp: null,                                         │
    │        description: "Order on the way"                          │
    │      },                                                          │
    │      {                                                           │
    │        stage: "Delivered",                                      │
    │        status: "pending",                                       │
    │        timestamp: null,                                         │
    │        description: "Order delivery expected soon"              │
    │      }                                                           │
    │    ]                                                             │
    │  }                                                               │
    └──────────────────────────────────────────────────────────────────┘
      │
      ↓
    Dealer sees:
      │
      ├─ ✓ Order placed: 10:00 AM
      ├─ ✓ Confirmed: 11:00 AM
      ├─ ✓ Preparation: 12:00 PM
      ├─ ✓ Dispatched: 1:00 PM
      ├─ ⏳ In Transit (currently here)
      └─ ○ Delivery (expected soon)

    Dealer now has complete visibility into:
    ├─ Current status
    ├─ All completed stages with exact timestamps
    └─ Upcoming stages
  `,
};

export { PHASE4_FLOW_DIAGRAMS };
