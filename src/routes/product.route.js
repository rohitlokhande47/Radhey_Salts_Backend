import express from "express";
import { verifyJWT } from "../middlewares/jwt.middleware.js";
import { verifyAdminRole } from "../middlewares/rbac.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  restockProduct,
  getProductPricing,
  getLowStockProducts,
  getProductStatistics,
} from "../controllers/product.controller.js";

const router = express.Router();

/**
 * PUBLIC ROUTES (No authentication required)
 */

// Get all products with pagination, filtering, search
router.get("/", getAllProducts);

// Get single product by ID with pricing examples
router.get("/:id", getProductById);

// Get dynamic pricing for specific quantity
router.get("/:id/pricing", getProductPricing);

/**
 * ADMIN ONLY ROUTES (JWT + Admin role required)
 */

// Create new product with image upload
router.post("/", verifyJWT, verifyAdminRole, upload.single("image"), createProduct);

// Update product with optional image upload
router.put("/:id", verifyJWT, verifyAdminRole, upload.single("image"), updateProduct);

// Delete product (soft delete)
router.delete("/:id", verifyJWT, verifyAdminRole, deleteProduct);

// Restock product
router.post("/:id/restock", verifyJWT, verifyAdminRole, restockProduct);

/**
 * ADMIN DASHBOARD ROUTES
 */

// Get low stock products
router.get("/admin/low-stock", verifyJWT, verifyAdminRole, getLowStockProducts);

// Get product statistics
router.get("/admin/statistics", verifyJWT, verifyAdminRole, getProductStatistics);

export default router;
