import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { Order, Product, Dealer, InventoryLedger, AuditLog } from "../models/index.js";

/**
 * Place new order (Dealer only)
 * Validates: Stock availability, MOQ, pricing
 * Creates inventory ledger entries for stock deduction
 * Creates audit log for order placement
 */
export const placeOrder = asyncHandler(async (req, res) => {
  const { items, deliveryAddress, paymentMethod = "credit" } = req.body;
  const dealerId = req.user._id;

  // Validate items
  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new ApiError(400, "Order must contain at least one item");
  }

  if (!deliveryAddress || typeof deliveryAddress !== "string") {
    throw new ApiError(400, "Delivery address is required");
  }

  // Validate payment method
  const validPaymentMethods = ["cash", "credit", "cheque", "bank_transfer"];
  if (!validPaymentMethods.includes(paymentMethod)) {
    throw new ApiError(400, `Invalid payment method. Valid: ${validPaymentMethods.join(", ")}`);
  }

  // Process each item and validate
  const processedItems = [];
  let totalAmount = 0;

  for (const item of items) {
    const { productId, quantity } = item;

    if (!productId || !quantity) {
      throw new ApiError(400, "Each item must have productId and quantity");
    }

    if (typeof quantity !== "number" || quantity <= 0) {
      throw new ApiError(400, "Quantity must be a positive number");
    }

    // Fetch product
    const product = await Product.findById(productId);
    if (!product) {
      throw new ApiError(404, `Product not found: ${productId}`);
    }

    if (!product.isActive) {
      throw new ApiError(400, `Product ${product.name} is not available`);
    }

    // MOQ validation
    if (quantity < product.MOQ) {
      throw new ApiError(400, `Product ${product.name}: Minimum order quantity is ${product.MOQ}. Requested: ${quantity}`);
    }

    // Stock availability check
    if (quantity > product.stockQty) {
      throw new ApiError(400, `Product ${product.name}: Only ${product.stockQty} units available. Requested: ${quantity}`);
    }

    // Calculate price based on quantity
    const unitPrice = product.getPriceForQuantity(quantity);
    const itemTotal = unitPrice * quantity;

    processedItems.push({
      productId: product._id,
      quantity,
      unitPrice,
      totalPrice: itemTotal,
    });

    totalAmount += itemTotal;
  }

  // Create order
  const orderRef = await generateOrderReference();
  const order = await Order.create({
    dealerId,
    items: processedItems,
    totalAmount,
    orderStatus: "pending",
    deliveryStage: "awaiting_confirmation",
    paymentStatus: "pending",
    deliveryAddress,
    orderRef,
    paymentMethod,
    orderedAt: new Date(),
  });

  // Deduct stock and create inventory ledger entries
  const ledgerEntries = [];
  for (const item of processedItems) {
    const product = await Product.findById(item.productId);
    const previousQty = product.stockQty;
    const newQty = previousQty - item.quantity;

    // Update product stock
    product.stockQty = newQty;
    await product.save();

    // Create inventory ledger entry
    const ledger = await InventoryLedger.create({
      productId: item.productId,
      changeType: "debit",
      quantityChanged: item.quantity,
      previousQty,
      newQty,
      reason: "order_placed",
      triggeredBy: order._id,
      triggeredByType: "Order",
      notes: `Order ${orderRef}`,
    });

    ledgerEntries.push(ledger);
  }

  // Create audit log
  await AuditLog.create({
    actorId: dealerId,
    actorRole: "dealer",
    action: "ORDER_PLACED",
    targetCollection: "orders",
    targetId: order._id,
    beforeSnapshot: {},
    afterSnapshot: {
      orderRef: order.orderRef,
      totalAmount: order.totalAmount,
      itemCount: order.items.length,
    },
    context: { totalAmount, itemCount: order.items.length },
    ipAddress: req.ip,
    userAgent: req.get("user-agent"),
    status: "success",
  });

  return res.status(201).json(
    new ApiResponse(201, {
      order,
      ledgerEntries,
      message: `Order ${orderRef} placed successfully`,
    })
  );
});

/**
 * Get order by ID (Dealer can see own orders, Admin can see all)
 */
export const getOrderById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id) {
    throw new ApiError(400, "Order ID is required");
  }

  const order = await Order.findById(id).populate("dealerId", "name email phone").populate("items.productId", "name productCode unit price");

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  // Check authorization: Dealer can only see own orders
  if (req.user.role === "dealer" && order.dealerId._id.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You can only view your own orders");
  }

  return res.status(200).json(new ApiResponse(200, order, "Order retrieved successfully"));
});

/**
 * Get orders by dealer (Dealer only - see own orders, Admin - see all)
 */
export const getOrdersByDealer = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status, paymentStatus, sortBy = "orderedAt", sortOrder = "desc" } = req.query;

  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10));
  const skip = (pageNum - 1) * limitNum;

  // Build filter
  const filter = {};

  // Dealer can only see own orders
  if (req.user.role === "dealer") {
    filter.dealerId = req.user._id;
  }

  if (status) {
    filter.orderStatus = status;
  }

  if (paymentStatus) {
    filter.paymentStatus = paymentStatus;
  }

  // Build sort
  const sortObj = {};
  const allowedSortFields = ["orderedAt", "totalAmount", "orderStatus"];
  const sortField = allowedSortFields.includes(sortBy) ? sortBy : "orderedAt";
  sortObj[sortField] = sortOrder === "asc" ? 1 : -1;

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum)
      .populate("dealerId", "name email phone")
      .populate("items.productId", "name productCode"),
    Order.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(total / limitNum);

  return res.status(200).json(
    new ApiResponse(200, {
      orders,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
      },
    })
  );
});

/**
 * Update order status (Admin only)
 * Status flow: pending → confirmed → dispatched → delivered
 * Also updates deliveryStage
 */
export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { orderStatus, deliveryStage, notes = "" } = req.body;

  if (!id) {
    throw new ApiError(400, "Order ID is required");
  }

  const validOrderStatuses = ["pending", "confirmed", "dispatched", "delivered", "cancelled"];
  const validDeliveryStages = [
    "awaiting_confirmation",
    "in_preparation",
    "in_transit",
    "out_for_delivery",
    "delivered",
  ];

  if (orderStatus && !validOrderStatuses.includes(orderStatus)) {
    throw new ApiError(400, `Invalid order status. Valid: ${validOrderStatuses.join(", ")}`);
  }

  if (deliveryStage && !validDeliveryStages.includes(deliveryStage)) {
    throw new ApiError(400, `Invalid delivery stage. Valid: ${validDeliveryStages.join(", ")}`);
  }

  const order = await Order.findById(id);
  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  const beforeSnapshot = order.toObject();

  // Update status
  if (orderStatus) {
    order.orderStatus = orderStatus;

    // Update timestamps based on status
    if (orderStatus === "confirmed") {
      order.confirmedAt = new Date();
    } else if (orderStatus === "dispatched") {
      order.dispatchedAt = new Date();
    } else if (orderStatus === "delivered") {
      order.deliveredAt = new Date();
    }
  }

  if (deliveryStage) {
    order.deliveryStage = deliveryStage;
  }

  if (notes) {
    order.notes = notes;
  }

  await order.save();

  // Create audit log
  await AuditLog.create({
    actorId: req.user._id,
    actorRole: req.user.role,
    action: "ORDER_STATUS_UPDATED",
    targetCollection: "orders",
    targetId: order._id,
    beforeSnapshot,
    afterSnapshot: order.toObject(),
    context: { orderStatus, deliveryStage, notes },
    ipAddress: req.ip,
    userAgent: req.get("user-agent"),
    status: "success",
  });

  return res.status(200).json(new ApiResponse(200, order, "Order status updated successfully"));
});

/**
 * Cancel order (Dealer can cancel own pending orders, Admin can cancel any pending order)
 * Restores stock to inventory when cancelled
 */
export const cancelOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason = "customer_request" } = req.body;

  if (!id) {
    throw new ApiError(400, "Order ID is required");
  }

  const order = await Order.findById(id);
  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  // Authorization check
  if (req.user.role === "dealer" && order.dealerId.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You can only cancel your own orders");
  }

  // Can only cancel pending orders
  if (order.orderStatus !== "pending") {
    throw new ApiError(400, `Cannot cancel order with status: ${order.orderStatus}`);
  }

  const beforeSnapshot = order.toObject();

  // Cancel order
  order.orderStatus = "cancelled";

  // Restore stock
  const ledgerEntries = [];
  for (const item of order.items) {
    const product = await Product.findById(item.productId);
    if (product) {
      const previousQty = product.stockQty;
      const newQty = previousQty + item.quantity;

      product.stockQty = newQty;
      await product.save();

      // Create inventory ledger entry for restoration
      const ledger = await InventoryLedger.create({
        productId: item.productId,
        changeType: "credit",
        quantityChanged: item.quantity,
        previousQty,
        newQty,
        reason: "order_cancellation",
        triggeredBy: order._id,
        triggeredByType: "Order",
        notes: `Cancellation of order ${order.orderRef}: ${reason}`,
      });

      ledgerEntries.push(ledger);
    }
  }

  await order.save();

  // Create audit log
  await AuditLog.create({
    actorId: req.user._id,
    actorRole: req.user.role,
    action: "ORDER_CANCELLED",
    targetCollection: "orders",
    targetId: order._id,
    beforeSnapshot,
    afterSnapshot: order.toObject(),
    context: { reason, stockRestored: true },
    ipAddress: req.ip,
    userAgent: req.get("user-agent"),
    status: "success",
  });

  return res.status(200).json(
    new ApiResponse(200, {
      order,
      ledgerEntries,
      message: "Order cancelled successfully, stock restored",
    })
  );
});

/**
 * Get all orders (Admin only)
 */
export const getAllOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, orderStatus, paymentStatus, sortBy = "orderedAt", sortOrder = "desc" } = req.query;

  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
  const skip = (pageNum - 1) * limitNum;

  const filter = {};

  if (orderStatus) {
    filter.orderStatus = orderStatus;
  }

  if (paymentStatus) {
    filter.paymentStatus = paymentStatus;
  }

  const sortObj = {};
  const allowedSortFields = ["orderedAt", "totalAmount", "orderStatus"];
  const sortField = allowedSortFields.includes(sortBy) ? sortBy : "orderedAt";
  sortObj[sortField] = sortOrder === "asc" ? 1 : -1;

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum)
      .populate("dealerId", "name email businessName")
      .select("-__v"),
    Order.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(total / limitNum);

  return res.status(200).json(
    new ApiResponse(200, {
      orders,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
      },
    })
  );
});

/**
 * Get order statistics for admin dashboard
 */
export const getOrderStatistics = asyncHandler(async (req, res) => {
  const stats = await Order.aggregate([
    {
      $facet: {
        totalStats: [
          {
            $group: {
              _id: null,
              totalOrders: { $sum: 1 },
              totalRevenue: { $sum: "$totalAmount" },
              averageOrderValue: { $avg: "$totalAmount" },
              totalItems: { $sum: { $size: "$items" } },
            },
          },
        ],
        statusBreakdown: [
          {
            $group: {
              _id: "$orderStatus",
              count: { $sum: 1 },
              revenue: { $sum: "$totalAmount" },
            },
          },
          { $sort: { count: -1 } },
        ],
        paymentBreakdown: [
          {
            $group: {
              _id: "$paymentStatus",
              count: { $sum: 1 },
              revenue: { $sum: "$totalAmount" },
            },
          },
        ],
        topDealers: [
          {
            $group: {
              _id: "$dealerId",
              orderCount: { $sum: 1 },
              totalSpent: { $sum: "$totalAmount" },
            },
          },
          { $sort: { totalSpent: -1 } },
          { $limit: 5 },
          {
            $lookup: {
              from: "dealers",
              localField: "_id",
              foreignField: "_id",
              as: "dealerInfo",
            },
          },
        ],
        timelineStats: [
          {
            $group: {
              _id: {
                $dateToString: { format: "%Y-%m-%d", date: "$orderedAt" },
              },
              dailyOrders: { $sum: 1 },
              dailyRevenue: { $sum: "$totalAmount" },
            },
          },
          { $sort: { _id: -1 } },
          { $limit: 30 },
        ],
      },
    },
  ]);

  return res.status(200).json(new ApiResponse(200, stats[0], "Order statistics retrieved"));
});

/**
 * Update payment status (Admin only)
 */
export const updatePaymentStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { paymentStatus, amountPaid = 0, notes = "" } = req.body;

  if (!id) {
    throw new ApiError(400, "Order ID is required");
  }

  const validPaymentStatuses = ["pending", "partial", "completed", "failed"];
  if (!validPaymentStatuses.includes(paymentStatus)) {
    throw new ApiError(400, `Invalid payment status. Valid: ${validPaymentStatuses.join(", ")}`);
  }

  const order = await Order.findById(id);
  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  const beforeSnapshot = { paymentStatus: order.paymentStatus };

  order.paymentStatus = paymentStatus;

  await order.save();

  // Create audit log
  await AuditLog.create({
    actorId: req.user._id,
    actorRole: req.user.role,
    action: "PAYMENT_STATUS_UPDATED",
    targetCollection: "orders",
    targetId: order._id,
    beforeSnapshot,
    afterSnapshot: { paymentStatus: order.paymentStatus },
    context: { paymentStatus, amountPaid, notes },
    ipAddress: req.ip,
    userAgent: req.get("user-agent"),
    status: "success",
  });

  return res.status(200).json(new ApiResponse(200, order, "Payment status updated successfully"));
});

/**
 * Get order timeline/history
 */
export const getOrderTimeline = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id) {
    throw new ApiError(400, "Order ID is required");
  }

  const order = await Order.findById(id);
  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  // Authorization check
  if (req.user.role === "dealer" && order.dealerId.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You can only view your own order timeline");
  }

  // Build timeline from order data
  const timeline = [];

  if (order.orderedAt) {
    timeline.push({
      stage: "Order Placed",
      status: "completed",
      timestamp: order.orderedAt,
      description: `Order ${order.orderRef} created`,
    });
  }

  if (order.confirmedAt) {
    timeline.push({
      stage: "Order Confirmed",
      status: "completed",
      timestamp: order.confirmedAt,
      description: "Order confirmed by admin",
    });
  }

  if (order.dispatchedAt) {
    timeline.push({
      stage: "Dispatched",
      status: "completed",
      timestamp: order.dispatchedAt,
      description: "Order dispatched from warehouse",
    });
  }

  if (order.deliveredAt) {
    timeline.push({
      stage: "Delivered",
      status: "completed",
      timestamp: order.deliveredAt,
      description: "Order delivered",
    });
  }

  // Add current/upcoming stages
  const currentStages = ["awaiting_confirmation", "in_preparation", "in_transit", "out_for_delivery"];
  if (order.orderStatus === "pending" && !order.confirmedAt) {
    timeline.push({
      stage: "Awaiting Confirmation",
      status: "in_progress",
      timestamp: null,
      description: "Waiting for admin to confirm",
    });
  }

  if (order.orderStatus === "confirmed" && !order.dispatchedAt) {
    timeline.push({
      stage: "In Preparation",
      status: "in_progress",
      timestamp: null,
      description: "Order being prepared",
    });
  }

  if (order.orderStatus === "dispatched" && !order.deliveredAt) {
    timeline.push({
      stage: "In Transit",
      status: "in_progress",
      timestamp: null,
      description: "Order on the way",
    });
  }

  return res.status(200).json(
    new ApiResponse(200, {
      orderRef: order.orderRef,
      currentStatus: order.orderStatus,
      deliveryStage: order.deliveryStage,
      timeline,
    })
  );
});

/**
 * Helper function to generate order reference number
 * Format: ORD-YYMMXXXXX (e.g., ORD-260424-00001)
 */
async function generateOrderReference() {
  const now = new Date();
  const yy = now.getFullYear().toString().slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");

  const count = await Order.countDocuments({
    createdAt: {
      $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
      $lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1),
    },
  });

  const sequence = String(count + 1).padStart(5, "0");
  return `ORD-${yy}${mm}${dd}-${sequence}`;
}
