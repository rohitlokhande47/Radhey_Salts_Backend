/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PHASE 4: ORDER MANAGEMENT SYSTEM - COMPLETE API REFERENCE
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * This comprehensive guide documents all 11 order management endpoints with:
 * - Exact request/response payloads
 * - Authentication & authorization requirements
 * - Error scenarios with HTTP status codes
 * - Real-world usage examples
 * - Business logic explanations
 */

// ═══════════════════════════════════════════════════════════════════════════
// ENDPOINT 1: CREATE ORDER (POST /api/v1/orders)
// ═══════════════════════════════════════════════════════════════════════════

const ENDPOINT_1_CREATE_ORDER = `
╔════════════════════════════════════════════════════════════════════════╗
║                          ENDPOINT 1: CREATE ORDER                      ║
║                        POST /api/v1/orders                             ║
╚════════════════════════════════════════════════════════════════════════╝

AUTHENTICATION: Required (JWT Bearer Token)
AUTHORIZATION:  Dealer role (or Admin)
RATE LIMIT:     10 requests per hour per dealer

PURPOSE: Create a new order with items from authenticated dealer

REQUEST HEADERS:
  Authorization: Bearer <JWT_TOKEN>
  Content-Type: application/json

REQUEST BODY:
{
  "items": [
    {
      "productId": "507f1f77bcf86cd799439011",     // Required: Valid product ID
      "qty": 500                                     // Required: MOQ >= qty <= stock
    },
    {
      "productId": "507f1f77bcf86cd799439013",
      "qty": 250
    }
  ],
  "deliveryAddress": "123 Main Street, City, State 12345",  // Required: Full address
  "paymentMethod": "bank_transfer",                          // Required: "bank_transfer" | "cheque" | "credit"
  "notes": "Urgent delivery required"                         // Optional: Delivery notes
}

RESPONSE HEADERS:
  HTTP/1.1 201 Created
  Content-Type: application/json

RESPONSE BODY (SUCCESS - 201):
{
  "success": true,
  "statusCode": 201,
  "data": {
    "order": {
      "_id": "507f1f77bcf86cd799439012",
      "orderRef": "ORD-260424-00001",              // Auto-generated: ORD-YYMMDD-#####
      "dealerId": "507f1f77bcf86cd799439010",     // From JWT token
      "items": [
        {
          "_id": "507f1f77bcf86cd799439014",
          "productId": "507f1f77bcf86cd799439011",
          "qty": 500,
          "unitPrice": 200,                        // Calculated from pricingTiers
          "totalPrice": 100000                     // unitPrice × qty
        },
        {
          "_id": "507f1f77bcf86cd799439015",
          "productId": "507f1f77bcf86cd799439013",
          "qty": 250,
          "unitPrice": 150,
          "totalPrice": 37500
        }
      ],
      "totalAmount": 137500,                       // Sum of all items
      "orderStatus": "pending",                    // Initial status
      "deliveryStage": "awaiting_confirmation",    // Initial delivery stage
      "paymentStatus": "pending",                  // Initial payment status
      "deliveryAddress": "123 Main Street, City, State 12345",
      "paymentMethod": "bank_transfer",
      "notes": "Urgent delivery required",
      "orderedAt": "2026-04-24T10:00:00Z",         // Auto-set timestamp
      "confirmedAt": null,                         // Set on status update
      "dispatchedAt": null,
      "deliveredAt": null,
      "cancelledAt": null,
      "createdAt": "2026-04-24T10:00:00Z",
      "updatedAt": "2026-04-24T10:00:00Z"
    },
    "ledgerEntries": [                             // Stock deduction records
      {
        "_id": "507f1f77bcf86cd799439016",
        "productId": "507f1f77bcf86cd799439011",
        "changeType": "debit",
        "quantityChanged": 500,
        "previousQty": 1000,
        "newQty": 500,
        "reason": "order_placed",
        "createdAt": "2026-04-24T10:00:00Z"
      },
      {
        "_id": "507f1f77bcf86cd799439017",
        "productId": "507f1f77bcf86cd799439013",
        "changeType": "debit",
        "quantityChanged": 250,
        "previousQty": 2000,
        "newQty": 1750,
        "reason": "order_placed",
        "createdAt": "2026-04-24T10:00:00Z"
      }
    ],
    "message": "Order placed successfully"
  }
}

RESPONSE BODY (MOQ VIOLATION - 400):
{
  "success": false,
  "statusCode": 400,
  "message": "MOQ for SALT-001 is 100 kg, you provided 50 kg",
  "error": "MOQ_VIOLATION",
  "details": {
    "productId": "507f1f77bcf86cd799439011",
    "productName": "SALT-001",
    "requiredMOQ": 100,
    "providedQty": 50
  }
}

RESPONSE BODY (INSUFFICIENT STOCK - 409):
{
  "success": false,
  "statusCode": 409,
  "message": "Insufficient stock for SALT-001. Available: 800 kg, Requested: 1000 kg",
  "error": "INSUFFICIENT_STOCK",
  "details": {
    "productId": "507f1f77bcf86cd799439011",
    "productName": "SALT-001",
    "availableQty": 800,
    "requestedQty": 1000
  }
}

RESPONSE BODY (MISSING FIELD - 400):
{
  "success": false,
  "statusCode": 400,
  "message": "deliveryAddress is required",
  "error": "VALIDATION_ERROR",
  "details": {
    "field": "deliveryAddress",
    "requirement": "Non-empty string"
  }
}

RESPONSE BODY (UNAUTHORIZED - 401):
{
  "success": false,
  "statusCode": 401,
  "message": "No token, authorization denied",
  "error": "NO_TOKEN"
}

RESPONSE BODY (FORBIDDEN - 403):
{
  "success": false,
  "statusCode": 403,
  "message": "Only dealers can create orders",
  "error": "FORBIDDEN"
}

BUSINESS LOGIC:
  1. Verify JWT token valid & not blacklisted
  2. Extract dealer ID from JWT payload
  3. Validate items array not empty
  4. For each item:
     ├─ Fetch product from database
     ├─ Check product isActive
     ├─ Validate qty >= MOQ
     ├─ Validate qty <= stockQty
     ├─ Calculate price from pricingTiers
     └─ Add to totalAmount
  5. Verify delivery address provided
  6. Create order document with status "pending"
  7. For each item:
     ├─ Atomically update Product.stockQty
     └─ Create InventoryLedger entry (debit)
  8. Create AuditLog entry with "ORDER_PLACED" action
  9. Return order object with ledger entries

SIDE EFFECTS:
  ✓ Stock immediately deducted (not reserved)
  ✓ InventoryLedger entries created (2 per order)
  ✓ AuditLog entry created
  ✓ Cannot be undone except via cancellation

EXAMPLE USAGE:
  Dealer places 500 kg of SALT-001 and 250 kg of SALT-003
  → Stock immediately deducted
  → InventoryLedger records changes
  → Order ready for admin confirmation
`;

// ═══════════════════════════════════════════════════════════════════════════
// ENDPOINT 2: GET ORDER BY ID (GET /api/v1/orders/:id)
// ═══════════════════════════════════════════════════════════════════════════

const ENDPOINT_2_GET_ORDER_BY_ID = `
╔════════════════════════════════════════════════════════════════════════╗
║                      ENDPOINT 2: GET ORDER BY ID                       ║
║                     GET /api/v1/orders/:id                             ║
╚════════════════════════════════════════════════════════════════════════╝

AUTHENTICATION: Required (JWT Bearer Token)
AUTHORIZATION:  Dealer (own order) or Admin (any order)
RATE LIMIT:     Unlimited

PURPOSE: Retrieve complete order details including items and dealer info

REQUEST:
  GET /api/v1/orders/507f1f77bcf86cd799439012
  Authorization: Bearer <JWT_TOKEN>

PATH PARAMETERS:
  :id (required) - Order MongoDB ObjectId

RESPONSE HEADERS:
  HTTP/1.1 200 OK
  Content-Type: application/json

RESPONSE BODY (SUCCESS - 200):
{
  "success": true,
  "statusCode": 200,
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "orderRef": "ORD-260424-00001",
    "dealerId": {                                  // Populated dealer info
      "_id": "507f1f77bcf86cd799439010",
      "businessName": "Dealer Inc.",
      "contactPerson": "John Doe",
      "email": "dealer@example.com",
      "phone": "9876543210",
      "creditLimit": 500000,
      "creditUsed": 137500
    },
    "items": [
      {
        "_id": "507f1f77bcf86cd799439014",
        "productId": {                             // Populated product info
          "_id": "507f1f77bcf86cd799439011",
          "name": "SALT-001",
          "description": "Premium White Salt",
          "MOQ": 100,
          "category": "bulk_salt"
        },
        "qty": 500,
        "unitPrice": 200,
        "totalPrice": 100000
      },
      {
        "_id": "507f1f77bcf86cd799439015",
        "productId": {
          "_id": "507f1f77bcf86cd799439013",
          "name": "SALT-003",
          "description": "Industrial Salt",
          "MOQ": 200,
          "category": "industrial"
        },
        "qty": 250,
        "unitPrice": 150,
        "totalPrice": 37500
      }
    ],
    "totalAmount": 137500,
    "orderStatus": "confirmed",                  // Current status
    "deliveryStage": "in_preparation",
    "paymentStatus": "pending",
    "deliveryAddress": "123 Main Street, City, State 12345",
    "paymentMethod": "bank_transfer",
    "notes": "Urgent delivery required",
    "orderedAt": "2026-04-24T10:00:00Z",
    "confirmedAt": "2026-04-24T11:00:00Z",
    "dispatchedAt": null,
    "deliveredAt": null,
    "cancelledAt": null,
    "createdAt": "2026-04-24T10:00:00Z",
    "updatedAt": "2026-04-24T11:00:00Z"
  }
}

RESPONSE BODY (NOT FOUND - 404):
{
  "success": false,
  "statusCode": 404,
  "message": "Order not found",
  "error": "NOT_FOUND",
  "details": {
    "orderId": "invalid-id"
  }
}

RESPONSE BODY (FORBIDDEN - 403):
{
  "success": false,
  "statusCode": 403,
  "message": "You can only view your own orders",
  "error": "FORBIDDEN"
}

BUSINESS LOGIC:
  1. Verify JWT token valid
  2. Fetch order by MongoDB ObjectId
  3. Check if order exists
  4. If dealer: verify order belongs to dealer
  5. If admin: allow access
  6. Populate dealerId with dealer details
  7. Populate items[].productId with product details
  8. Return complete order object

POPULATED FIELDS:
  ✓ dealerId → Full dealer object (business info)
  ✓ items[].productId → Full product object (specs)

EXAMPLE USAGE:
  View order ORD-260424-00001
  → See all item details with pricing
  → See dealer info
  → Verify current status
`;

// ═══════════════════════════════════════════════════════════════════════════
// ENDPOINT 3: GET DEALER'S ORDERS (GET /api/v1/orders/dealer/:dealerId)
// ═════════════════════════════════════════════════════════════════════════

const ENDPOINT_3_GET_DEALER_ORDERS = `
╔════════════════════════════════════════════════════════════════════════╗
║                    ENDPOINT 3: GET DEALER'S ORDERS                     ║
║                 GET /api/v1/orders/dealer/:dealerId                    ║
╚════════════════════════════════════════════════════════════════════════╝

AUTHENTICATION: Required (JWT Bearer Token)
AUTHORIZATION:  Dealer (own orders) or Admin
RATE LIMIT:     50 requests per minute

PURPOSE: List all orders for a dealer with pagination and filtering

REQUEST:
  GET /api/v1/orders/dealer/507f1f77bcf86cd799439010?\\
      page=1&\\
      limit=10&\\
      status=pending&\\
      sort=latest
  Authorization: Bearer <JWT_TOKEN>

PATH PARAMETERS:
  :dealerId (required) - Dealer MongoDB ObjectId

QUERY PARAMETERS (all optional):
  page=1           - Page number (default: 1)
  limit=10         - Orders per page (default: 10, max: 100)
  status=pending   - Filter by status (pending|confirmed|dispatched|delivered|cancelled)
  sort=latest      - Sort order (latest|oldest)

RESPONSE BODY (SUCCESS - 200):
{
  "success": true,
  "statusCode": 200,
  "data": {
    "orders": [
      {
        "_id": "507f1f77bcf86cd799439012",
        "orderRef": "ORD-260424-00001",
        "totalAmount": 137500,
        "orderStatus": "pending",
        "deliveryStage": "awaiting_confirmation",
        "paymentStatus": "pending",
        "itemCount": 2,
        "orderedAt": "2026-04-24T10:00:00Z"
      },
      {
        "_id": "507f1f77bcf86cd799439013",
        "orderRef": "ORD-260424-00002",
        "totalAmount": 95000,
        "orderStatus": "confirmed",
        "deliveryStage": "in_preparation",
        "paymentStatus": "pending",
        "itemCount": 1,
        "orderedAt": "2026-04-23T15:30:00Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalOrders": 25,
      "ordersPerPage": 10,
      "hasNextPage": true,
      "hasPreviousPage": false
    }
  }
}

RESPONSE BODY (EMPTY RESULT - 200):
{
  "success": true,
  "statusCode": 200,
  "data": {
    "orders": [],
    "pagination": {
      "currentPage": 1,
      "totalPages": 0,
      "totalOrders": 0,
      "ordersPerPage": 10
    }
  }
}

BUSINESS LOGIC:
  1. Verify JWT token
  2. If dealer: verify dealerId matches JWT
  3. If admin: allow any dealerId
  4. Query orders with pagination
  5. Apply status filter if provided
  6. Sort by orderedAt (latest first or oldest first)
  7. Return paginated results with metadata

FILTERS APPLIED:
  ✓ dealerId matches exactly
  ✓ orderStatus matches (if provided)
  ✓ Pagination: (page-1)*limit to page*limit
  ✓ Sort: orderedAt DESC (latest) or ASC (oldest)

EXAMPLE PAGINATION:
  Page 1: Orders 1-10
  Page 2: Orders 11-20
  Page 3: Orders 21-25
  
EXAMPLE FILTERS:
  ?status=pending → Only pending orders
  ?status=delivered&sort=latest → Delivered, newest first
`;

// ═══════════════════════════════════════════════════════════════════════════
// ENDPOINT 4: UPDATE ORDER STATUS (PUT /api/v1/orders/:id/status)
// ═════════════════════════════════════════════════════════════════════════

const ENDPOINT_4_UPDATE_ORDER_STATUS = `
╔════════════════════════════════════════════════════════════════════════╗
║                  ENDPOINT 4: UPDATE ORDER STATUS                       ║
║                   PUT /api/v1/orders/:id/status                        ║
╚════════════════════════════════════════════════════════════════════════╝

AUTHENTICATION: Required (JWT Bearer Token)
AUTHORIZATION:  Admin only
RATE LIMIT:     100 requests per minute

PURPOSE: Update order status with automatic timestamp management

REQUEST:
  PUT /api/v1/orders/507f1f77bcf86cd799439012/status
  Authorization: Bearer <ADMIN_JWT>
  Content-Type: application/json

REQUEST BODY:
{
  "orderStatus": "confirmed",              // Required: pending|confirmed|dispatched|delivered|cancelled
  "deliveryStage": "in_preparation",       // Optional: Updates delivery stage
  "notes": "Order ready for packing"       // Optional: Admin notes
}

RESPONSE BODY (SUCCESS - 200):
{
  "success": true,
  "statusCode": 200,
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "orderRef": "ORD-260424-00001",
    "orderStatus": "confirmed",
    "deliveryStage": "in_preparation",
    "confirmedAt": "2026-04-24T11:00:00Z",  // Auto-set on confirm
    "orderedAt": "2026-04-24T10:00:00Z",    // Unchanged
    "dispatchedAt": null,                   // Will be set on dispatch
    "deliveredAt": null,
    "notes": "Order ready for packing"
  },
  "message": "Order status updated successfully"
}

RESPONSE BODY (INVALID TRANSITION - 400):
{
  "success": false,
  "statusCode": 400,
  "message": "Invalid status transition from pending to delivered",
  "error": "INVALID_TRANSITION",
  "details": {
    "currentStatus": "pending",
    "requestedStatus": "delivered",
    "allowedTransitions": ["confirmed", "cancelled"]
  }
}

VALID STATUS TRANSITIONS:
  pending → confirmed (admin confirms order)
  confirmed → dispatched (admin ships order)
  dispatched → delivered (admin marks delivered)
  pending/confirmed → cancelled (dealer or admin)

AUTO-TIMESTAMPS SET:
  confirmedAt: Set when transitioning to "confirmed"
  dispatchedAt: Set when transitioning to "dispatched"
  deliveredAt: Set when transitioning to "delivered"
  cancelledAt: Set when transitioning to "cancelled"

BUSINESS LOGIC:
  1. Verify JWT is admin
  2. Fetch order by ID
  3. Validate status transition allowed
  4. If confirming: Set confirmedAt = now
  5. If dispatching: Set dispatchedAt = now
  6. If delivering: Set deliveredAt = now
  7. Update order status
  8. Create AuditLog with beforeSnapshot/afterSnapshot
  9. Return updated order

TIMESTAMPS IMMUTABLE:
  ✓ Each timestamp only set once on first transition
  ✓ Cannot be changed after initial set
  ✓ Represents exact time of state change

EXAMPLE SEQUENCE:
  Time 10:00 - Dealer places order → orderedAt = 10:00
  Time 11:00 - Admin confirms → confirmedAt = 11:00
  Time 12:00 - Admin dispatches → dispatchedAt = 12:00
  Time 15:30 - Admin delivers → deliveredAt = 15:30
`;

// ═══════════════════════════════════════════════════════════════════════════
// ENDPOINT 5: CANCEL ORDER (POST /api/v1/orders/:id/cancel)
// ═════════════════════════════════════════════════════════════════════════

const ENDPOINT_5_CANCEL_ORDER = `
╔════════════════════════════════════════════════════════════════════════╗
║                        ENDPOINT 5: CANCEL ORDER                        ║
║                   POST /api/v1/orders/:id/cancel                       ║
╚════════════════════════════════════════════════════════════════════════╝

AUTHENTICATION: Required (JWT Bearer Token)
AUTHORIZATION:  Dealer (own order) or Admin
RATE LIMIT:     20 requests per minute

PURPOSE: Cancel pending order and restore stock

REQUEST:
  POST /api/v1/orders/507f1f77bcf86cd799439012/cancel
  Authorization: Bearer <JWT_TOKEN>
  Content-Type: application/json

REQUEST BODY:
{
  "reason": "customer_request",            // Required: Cancellation reason
  "notes": "Customer changed their mind"   // Optional: Additional details
}

VALID REASONS:
  - customer_request: Customer requested cancellation
  - stock_issue: Unable to fulfill order
  - payment_issue: Payment cannot be processed
  - delivery_delay: Cannot deliver on time
  - other: Other reason (notes required)

RESPONSE BODY (SUCCESS - 200):
{
  "success": true,
  "statusCode": 200,
  "data": {
    "order": {
      "_id": "507f1f77bcf86cd799439012",
      "orderRef": "ORD-260424-00001",
      "orderStatus": "cancelled",
      "cancelledAt": "2026-04-24T12:00:00Z"
    },
    "ledgerEntries": [
      {
        "_id": "507f1f77bcf86cd799439018",
        "productId": "507f1f77bcf86cd799439011",
        "changeType": "credit",            // Restoration entry
        "quantityChanged": 500,
        "previousQty": 500,
        "newQty": 1000,                    // Restored to original
        "reason": "order_cancellation",
        "createdAt": "2026-04-24T12:00:00Z"
      },
      {
        "_id": "507f1f77bcf86cd799439019",
        "productId": "507f1f77bcf86cd799439013",
        "changeType": "credit",
        "quantityChanged": 250,
        "previousQty": 1750,
        "newQty": 2000,
        "reason": "order_cancellation",
        "createdAt": "2026-04-24T12:00:00Z"
      }
    ],
    "message": "Order cancelled successfully, stock restored"
  }
}

RESPONSE BODY (NOT ALLOWED - 400):
{
  "success": false,
  "statusCode": 400,
  "message": "Cannot cancel orders that are already confirmed or dispatched",
  "error": "INVALID_STATUS_FOR_CANCELLATION",
  "details": {
    "currentStatus": "confirmed",
    "allowedForCancellation": ["pending"]
  }
}

RESPONSE BODY (NOT FOUND - 404):
{
  "success": false,
  "statusCode": 404,
  "message": "Order not found",
  "error": "NOT_FOUND"
}

RESPONSE BODY (FORBIDDEN - 403):
{
  "success": false,
  "statusCode": 403,
  "message": "You can only cancel your own orders",
  "error": "FORBIDDEN"
}

CANCELLATION RULES:
  ✓ Only pending orders can be cancelled
  ✓ Confirmed/dispatched/delivered cannot be cancelled
  ✓ Cancelled orders cannot be re-cancelled
  ✓ Stock fully restored
  ✓ Complete history preserved

STOCK RESTORATION PROCESS:
  1. Find all items in order
  2. For each item:
     ├─ Calculate restoration amount (deducted qty)
     ├─ Add back to Product.stockQty
     └─ Create InventoryLedger entry (type: credit)
  3. Update order.orderStatus = "cancelled"
  4. Set cancelledAt timestamp
  5. Create AuditLog entry

BUSINESS LOGIC:
  1. Verify JWT token
  2. If dealer: verify order belongs to dealer
  3. Fetch order
  4. Check if cancellable (status = pending)
  5. Extract all items to cancel
  6. Atomically:
     ├─ Restore stock for each item
     ├─ Create credit InventoryLedger entries
     └─ Update order status
  7. Create AuditLog entry
  8. Return order with ledger entries

EXAMPLE FLOW:
  Order placed: SALT-001 (500kg), stock 500 remaining
  Order cancelled: stock restored to 1000
  InventoryLedger shows: debit (-500), credit (+500)
  Complete audit trail maintained
`;

// ═══════════════════════════════════════════════════════════════════════════
// ADDITIONAL ENDPOINTS (6-11)
// ═════════════════════════════════════════════════════════════════════════

const ADDITIONAL_ENDPOINTS = `
╔════════════════════════════════════════════════════════════════════════╗
║                   ENDPOINTS 6-11: ANALYTICS & TRACKING                 ║
╚════════════════════════════════════════════════════════════════════════╝

ENDPOINT 6: GET ORDER HISTORY WITH TIME RANGE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GET /api/v1/orders/dealer/history/:dealerId
?startDate=2026-04-01&endDate=2026-04-30&status=delivered&sort=latest

Purpose: Time-based order history with filtering
Returns: Orders in date range with summary statistics
Auth: Dealer (own history) or Admin

ENDPOINT 7: GET DEALER ORDER STATISTICS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GET /api/v1/orders/:dealerId/stats

Purpose: Order analytics for individual dealer
Returns: 
  - Total orders & spending
  - Top products
  - Status breakdown
  - Payment status breakdown
Auth: Dealer (own stats) or Admin

ENDPOINT 8: GET ORDER INVOICE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GET /api/v1/orders/:id/invoice

Purpose: Generate invoice data
Returns:
  - Invoice number & date
  - Itemized breakdown
  - Tax calculation
  - Payment status
Auth: Dealer (own) or Admin

ENDPOINT 9: GET DELIVERY TRACKING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GET /api/v1/orders/:id/delivery

Purpose: Delivery status & tracking
Returns:
  - Current delivery stage
  - Tracking number
  - Dispatch & expected delivery dates
  - Delivery proof URLs
Auth: Dealer (own) or Admin

ENDPOINT 10: UPDATE PAYMENT STATUS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PUT /api/v1/orders/:id/payment

Purpose: Mark payment received (admin action)
Body:
  {
    "paymentStatus": "completed|partial",
    "amountReceived": 137500,
    "transactionId": "TXN-123456",
    "notes": "Payment details"
  }
Returns: Updated order with payment details
Auth: Admin only

ENDPOINT 11: GET ADMIN ORDER STATISTICS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GET /api/v1/orders/admin/statistics?period=monthly

Purpose: Platform-wide analytics dashboard
Returns:
  - Total revenue & orders
  - Top dealers & products
  - Payment collection rate
  - Status breakdown
Query params: period (daily|weekly|monthly|yearly)
Auth: Admin only
`;

export {
  ENDPOINT_1_CREATE_ORDER,
  ENDPOINT_2_GET_ORDER_BY_ID,
  ENDPOINT_3_GET_DEALER_ORDERS,
  ENDPOINT_4_UPDATE_ORDER_STATUS,
  ENDPOINT_5_CANCEL_ORDER,
  ADDITIONAL_ENDPOINTS,
};
