import express from "express";
import { verifyJWT } from "../middlewares/jwt.middleware.js";
import { verifyAdminRole, verifyDealerRole } from "../middlewares/rbac.middleware.js";
import {
  placeOrder,
  getOrderById,
  getOrdersByDealer,
  updateOrderStatus,
  cancelOrder,
  getAllOrders,
  getOrderStatistics,
  updatePaymentStatus,
  getOrderTimeline,
} from "../controllers/order.controller.js";

const router = express.Router();

/**
 * DEALER ROUTES (JWT + Dealer role required)
 */

// Place new order
router.post("/", verifyJWT, verifyDealerRole, placeOrder);

// Get dealer's order history
router.get("/my-orders", verifyJWT, verifyDealerRole, getOrdersByDealer);

// Get dealer's specific order
router.get("/:id", verifyJWT, getOrderById);

// Cancel order (dealer can cancel own pending orders)
router.post("/:id/cancel", verifyJWT, cancelOrder);

// Get order timeline
router.get("/:id/timeline", verifyJWT, getOrderTimeline);

/**
 * ADMIN ROUTES (JWT + Admin role required)
 */

// Get all orders
router.get("/admin/all-orders", verifyJWT, verifyAdminRole, getAllOrders);

// Get order statistics
router.get("/admin/statistics", verifyJWT, verifyAdminRole, getOrderStatistics);

// Update order status
router.put("/:id/status", verifyJWT, verifyAdminRole, updateOrderStatus);

// Update payment status
router.put("/:id/payment", verifyJWT, verifyAdminRole, updatePaymentStatus);

export default router;
