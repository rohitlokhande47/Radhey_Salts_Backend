import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Product, InventoryLedger, AuditLog } from "../models/index.js";
import cloudinary from "cloudinary";

/**
 * Get all products with pagination, filtering, and search
 * Query Parameters:
 *   - page: Page number (default: 1)
 *   - limit: Items per page (default: 10)
 *   - category: Filter by category
 *   - isActive: Filter by active status (true/false)
 *   - search: Search in product name/description
 *   - sortBy: Sort field (price, name, createdAt)
 *   - sortOrder: asc or desc (default: desc)
 */
export const getAllProducts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, category, isActive, search, sortBy = "createdAt", sortOrder = "desc" } = req.query;

  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10));
  const skip = (pageNum - 1) * limitNum;

  // Build filter
  const filter = { isActive: true }; // Only active products by default

  if (category && category !== "") {
    filter.category = category;
  }

  if (isActive !== undefined) {
    filter.isActive = isActive === "true" || isActive === true;
  }

  if (search && search.trim() !== "") {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
      { productCode: { $regex: search, $options: "i" } },
    ];
  }

  // Build sort
  const sortObj = {};
  const allowedSortFields = ["name", "price", "stockQty", "createdAt", "MOQ"];
  const sortField = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";
  sortObj[sortField] = sortOrder === "asc" ? 1 : -1;

  // Execute query
  const [products, total] = await Promise.all([
    Product.find(filter).sort(sortObj).skip(skip).limit(limitNum).select("-__v"),
    Product.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(total / limitNum);

  return res.status(200).json(
    new ApiResponse(200, {
      products,
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
 * Get single product by ID
 * Also returns pricing information for different quantities
 */
export const getProductById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id) {
    throw new ApiError(400, "Product ID is required");
  }

  const product = await Product.findById(id).select("-__v");

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  // Add pricing examples
  const pricingExamples = [1, 5, 10, 25, 50, 100].map((qty) => ({
    quantity: qty,
    price: product.getPriceForQuantity(qty),
    total: product.getPriceForQuantity(qty) * qty,
  }));

  return res.status(200).json(
    new ApiResponse(200, {
      ...product.toObject(),
      pricingExamples,
    })
  );
});

/**
 * Create new product (Admin only)
 * Uploads image to Cloudinary
 * Required Fields: name, description, productCode, category, price, MOQ, unit
 * Optional: pricingTiers, image, supplier, hsn, stockQty
 */
export const createProduct = asyncHandler(async (req, res) => {
  const { name, description, productCode, category, price, MOQ, unit, supplier, hsn, stockQty = 0, pricingTiers = [], reorderLevel = MOQ } = req.body;

  // Validation
  if (!name || !description || !productCode || !category || price === undefined || !MOQ || !unit) {
    throw new ApiError(400, "Missing required fields: name, description, productCode, category, price, MOQ, unit");
  }

  if (typeof price !== "number" || price <= 0) {
    throw new ApiError(400, "Price must be a positive number");
  }

  if (typeof MOQ !== "number" || MOQ <= 0) {
    throw new ApiError(400, "MOQ must be a positive number");
  }

  // Check for duplicate product code
  const existingProduct = await Product.findOne({ productCode });
  if (existingProduct) {
    throw new ApiError(409, `Product with code ${productCode} already exists`);
  }

  // Handle image upload
  let imageUrl = null;
  if (req.file) {
    try {
      const uploadResponse = await cloudinary.v2.uploader.upload(req.file.path, {
        folder: "radhe-salt/products",
        resource_type: "auto",
        quality: "auto",
      });
      imageUrl = uploadResponse.secure_url;
    } catch (error) {
      throw new ApiError(500, `Image upload failed: ${error.message}`);
    }
  }

  // Create product
  const product = await Product.create({
    name,
    description,
    productCode,
    category,
    price,
    MOQ,
    unit,
    image: imageUrl,
    supplier,
    hsn,
    stockQty,
    reorderLevel,
    pricingTiers,
    isActive: true,
  });

  // Create audit log
  await AuditLog.create({
    actorId: req.user._id,
    actorRole: req.user.role,
    action: "PRODUCT_ADDED",
    targetCollection: "products",
    targetId: product._id,
    beforeSnapshot: {},
    afterSnapshot: product.toObject(),
    ipAddress: req.ip,
    userAgent: req.get("user-agent"),
    status: "success",
  });

  return res.status(201).json(new ApiResponse(201, product, "Product created successfully"));
});

/**
 * Update product (Admin only)
 * Can update: name, description, category, price, MOQ, reorderLevel, supplier, hsn, image, pricingTiers, isActive
 * Creates audit log of changes
 */
export const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description, category, price, MOQ, reorderLevel, supplier, hsn, pricingTiers, isActive } = req.body;

  if (!id) {
    throw new ApiError(400, "Product ID is required");
  }

  const product = await Product.findById(id);
  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  // Store before snapshot
  const beforeSnapshot = product.toObject();

  // Update allowed fields
  const updates = {};

  if (name !== undefined) {
    if (!name || typeof name !== "string") throw new ApiError(400, "Invalid product name");
    updates.name = name;
  }

  if (description !== undefined) {
    if (!description || typeof description !== "string") throw new ApiError(400, "Invalid description");
    updates.description = description;
  }

  if (category !== undefined) {
    if (!category || typeof category !== "string") throw new ApiError(400, "Invalid category");
    updates.category = category;
  }

  if (price !== undefined) {
    if (typeof price !== "number" || price <= 0) throw new ApiError(400, "Price must be positive");
    updates.price = price;
  }

  if (MOQ !== undefined) {
    if (typeof MOQ !== "number" || MOQ <= 0) throw new ApiError(400, "MOQ must be positive");
    updates.MOQ = MOQ;
  }

  if (reorderLevel !== undefined) {
    if (typeof reorderLevel !== "number" || reorderLevel < 0) throw new ApiError(400, "Reorder level must be non-negative");
    updates.reorderLevel = reorderLevel;
  }

  if (supplier !== undefined) {
    updates.supplier = supplier;
  }

  if (hsn !== undefined) {
    updates.hsn = hsn;
  }

  if (pricingTiers !== undefined) {
    if (!Array.isArray(pricingTiers)) throw new ApiError(400, "Pricing tiers must be an array");
    updates.pricingTiers = pricingTiers;
  }

  if (isActive !== undefined) {
    updates.isActive = isActive === true || isActive === "true";
  }

  // Handle image upload
  if (req.file) {
    try {
      const uploadResponse = await cloudinary.v2.uploader.upload(req.file.path, {
        folder: "radhe-salt/products",
        resource_type: "auto",
        quality: "auto",
      });
      updates.image = uploadResponse.secure_url;
    } catch (error) {
      throw new ApiError(500, `Image upload failed: ${error.message}`);
    }
  }

  // Apply updates
  Object.assign(product, updates);
  await product.save();

  // Create audit log
  await AuditLog.create({
    actorId: req.user._id,
    actorRole: req.user.role,
    action: "PRODUCT_UPDATED",
    targetCollection: "products",
    targetId: product._id,
    beforeSnapshot,
    afterSnapshot: product.toObject(),
    ipAddress: req.ip,
    userAgent: req.get("user-agent"),
    status: "success",
  });

  return res.status(200).json(new ApiResponse(200, product, "Product updated successfully"));
});

/**
 * Delete product (Admin only)
 * Soft delete: Sets isActive to false
 * Also creates audit log
 */
export const deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id) {
    throw new ApiError(400, "Product ID is required");
  }

  const product = await Product.findById(id);
  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  const beforeSnapshot = product.toObject();

  // Soft delete
  product.isActive = false;
  await product.save();

  // Create audit log
  await AuditLog.create({
    actorId: req.user._id,
    actorRole: req.user.role,
    action: "PRODUCT_DELETED",
    targetCollection: "products",
    targetId: product._id,
    beforeSnapshot,
    afterSnapshot: product.toObject(),
    ipAddress: req.ip,
    userAgent: req.get("user-agent"),
    status: "success",
  });

  return res.status(200).json(new ApiResponse(200, {}, "Product deleted successfully"));
});

/**
 * Restock product (Admin only)
 * Adds quantity to stock and creates inventory ledger entry
 * Required: quantity, reason
 */
export const restockProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { quantity, reason = "manual_restock", notes = "" } = req.body;

  if (!id) {
    throw new ApiError(400, "Product ID is required");
  }

  if (typeof quantity !== "number" || quantity <= 0) {
    throw new ApiError(400, "Quantity must be a positive number");
  }

  const product = await Product.findById(id);
  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  const previousQty = product.stockQty;
  const newQty = previousQty + quantity;

  // Update stock
  product.stockQty = newQty;
  await product.save();

  // Create inventory ledger entry
  const ledgerEntry = await InventoryLedger.create({
    productId: product._id,
    changeType: "credit",
    quantityChanged: quantity,
    previousQty,
    newQty,
    reason,
    triggeredBy: req.user._id,
    triggeredByType: "Admin",
    notes,
  });

  // Create audit log
  await AuditLog.create({
    actorId: req.user._id,
    actorRole: req.user.role,
    action: "PRODUCT_RESTOCKED",
    targetCollection: "products",
    targetId: product._id,
    beforeSnapshot: { stockQty: previousQty },
    afterSnapshot: { stockQty: newQty },
    context: { reason, quantity },
    ipAddress: req.ip,
    userAgent: req.get("user-agent"),
    status: "success",
  });

  return res.status(200).json(
    new ApiResponse(200, {
      product,
      ledgerEntry,
      message: `Stock increased by ${quantity} units`,
    })
  );
});

/**
 * Get product pricing for specific quantity
 * Useful for frontend to show dynamic pricing based on order quantity
 */
export const getProductPricing = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { quantity } = req.query;

  if (!id) {
    throw new ApiError(400, "Product ID is required");
  }

  if (!quantity || typeof parseInt(quantity) !== "number" || parseInt(quantity) <= 0) {
    throw new ApiError(400, "Valid quantity is required");
  }

  const product = await Product.findById(id);
  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  const qty = parseInt(quantity);

  // Check MOQ
  if (qty < product.MOQ) {
    throw new ApiError(400, `Minimum order quantity is ${product.MOQ}. Requested: ${qty}`);
  }

  const unitPrice = product.getPriceForQuantity(qty);
  const totalPrice = unitPrice * qty;

  return res.status(200).json(
    new ApiResponse(200, {
      productId: product._id,
      productName: product.name,
      quantity: qty,
      MOQ: product.MOQ,
      unitPrice,
      totalPrice,
      discount: qty > product.MOQ ? ((product.price - unitPrice) / product.price * 100).toFixed(2) + "%" : "0%",
      pricingTiers: product.pricingTiers,
      availableStock: product.stockQty,
      canOrder: product.stockQty >= qty && product.isActive,
    })
  );
});

/**
 * Get low stock products (Admin dashboard)
 * Products where stockQty <= reorderLevel
 */
export const getLowStockProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({
    isActive: true,
    $expr: { $lte: ["$stockQty", "$reorderLevel"] },
  })
    .sort({ stockQty: 1 })
    .select("name productCode stockQty reorderLevel MOQ");

  return res.status(200).json(new ApiResponse(200, products, "Low stock products retrieved"));
});

/**
 * Get product statistics (Admin dashboard)
 * Total products, active products, categories, avg price, etc.
 */
export const getProductStatistics = asyncHandler(async (req, res) => {
  const stats = await Product.aggregate([
    {
      $facet: {
        totalStats: [
          {
            $group: {
              _id: null,
              totalProducts: { $sum: 1 },
              activeProducts: {
                $sum: { $cond: [{ $eq: ["$isActive", true] }, 1, 0] },
              },
              averagePrice: { $avg: "$price" },
              totalStockValue: {
                $sum: { $multiply: ["$price", "$stockQty"] },
              },
              totalStockQty: { $sum: "$stockQty" },
            },
          },
        ],
        categoryCounts: [
          {
            $group: {
              _id: "$category",
              count: { $sum: 1 },
              activeCount: {
                $sum: { $cond: [{ $eq: ["$isActive", true] }, 1, 0] },
              },
            },
          },
          { $sort: { count: -1 } },
        ],
      },
    },
  ]);

  return res.status(200).json(new ApiResponse(200, stats[0], "Product statistics retrieved"));
});
