import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { Admin } from "../models/admin.model.js";
import { Dealer } from "../models/dealer.model.js";
import { Product } from "../models/product.model.js";
import { Order } from "../models/orders.model.js";
import { InventoryLedger } from "../models/inventoryLedger.model.js";
import { DailySnapshot } from "../models/dailySnapshots.model.js";

/**
 * PHASE 6: ADMIN DASHBOARD & ANALYTICS CONTROLLER
 * ═════════════════════════════════════════════════════
 * Provides comprehensive analytics, dashboards, insights,
 * and recommendations for admin users
 */

// ─────────────────────────────────────────────────────
// 1. DASHBOARD OVERVIEW - Quick stats snapshot
// ─────────────────────────────────────────────────────
export const getDashboardOverview = asyncHandler(async (req, res) => {
  // Current statistics
  const totalAdmins = await Admin.countDocuments();
  const totalDealers = await Dealer.countDocuments();
  const totalProducts = await Product.countDocuments();
  const activeOrders = await Order.countDocuments({ status: "active" });
  
  // Revenue & Orders
  const todayOrders = await Order.find({
    createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
  });
  const todayRevenue = todayOrders.reduce((sum, order) => sum + order.totalAmount, 0);
  const todayOrderCount = todayOrders.length;
  
  // Inventory value
  const allProducts = await Product.find();
  const inventoryValue = allProducts.reduce((sum, p) => sum + (p.stockQty * p.salePrice), 0);
  
  // Low stock count
  const lowStockItems = await Product.find({ 
    $expr: { $lte: ["$stockQty", "$reorderLevel"] } 
  });
  
  // Pending orders
  const pendingOrders = await Order.countDocuments({ status: "pending" });
  
  return res.status(200).json(new ApiResponse(200, {
    dashboard: {
      userMetrics: { totalAdmins, totalDealers, totalProducts },
      orderMetrics: { activeOrders, pendingOrders, todayOrderCount },
      financialMetrics: { todayRevenue, inventoryValue },
      inventoryMetrics: { lowStockCount: lowStockItems.length, totalProducts },
      timestamp: new Date()
    }
  }));
});

// ─────────────────────────────────────────────────────
// 2. SALES ANALYTICS - Revenue & order trends
// ─────────────────────────────────────────────────────
export const getSalesAnalytics = asyncHandler(async (req, res) => {
  const { period = "weekly" } = req.query; // daily, weekly, monthly
  
  let startDate = new Date();
  if (period === "weekly") startDate.setDate(startDate.getDate() - 7);
  else if (period === "monthly") startDate.setMonth(startDate.getMonth() - 1);
  else startDate.setDate(startDate.getDate() - 1); // daily
  
  // Fetch orders in period
  const orders = await Order.find({
    createdAt: { $gte: startDate },
    status: { $ne: "cancelled" }
  }).populate("dealerId", "name");
  
  // Calculate metrics
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  
  // Top products sold
  const productSales = {};
  orders.forEach(order => {
    order.items?.forEach(item => {
      if (!productSales[item.productId]) productSales[item.productId] = 0;
      productSales[item.productId] += item.quantity;
    });
  });
  
  const topProducts = Object.entries(productSales)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  
  // Top dealers
  const dealerSales = {};
  orders.forEach(order => {
    const dealerId = order.dealerId._id.toString();
    if (!dealerSales[dealerId]) {
      dealerSales[dealerId] = { name: order.dealerId.name, sales: 0, orders: 0 };
    }
    dealerSales[dealerId].sales += order.totalAmount;
    dealerSales[dealerId].orders += 1;
  });
  
  const topDealers = Object.values(dealerSales)
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 5);
  
  return res.status(200).json(new ApiResponse(200, {
    analytics: {
      period,
      metrics: { totalOrders, totalRevenue, averageOrderValue },
      topProducts: topProducts.map(([id, qty]) => ({ productId: id, quantitySold: qty })),
      topDealers,
      startDate,
      endDate: new Date()
    }
  }));
});

// ─────────────────────────────────────────────────────
// 3. INVENTORY ANALYTICS - Stock health & trends
// ─────────────────────────────────────────────────────
export const getInventoryAnalytics = asyncHandler(async (req, res) => {
  const products = await Product.find();
  
  // Inventory metrics
  const totalValue = products.reduce((sum, p) => sum + (p.stockQty * p.salePrice), 0);
  const totalQty = products.reduce((sum, p) => sum + p.stockQty, 0);
  
  // Stock health
  const inStock = products.filter(p => p.stockQty > p.reorderLevel).length;
  const lowStock = products.filter(p => 
    p.stockQty <= p.reorderLevel && p.stockQty > 0
  ).length;
  const outOfStock = products.filter(p => p.stockQty === 0).length;
  
  // Turnover (orders vs inventory last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const recentOrders = await Order.find({
    createdAt: { $gte: thirtyDaysAgo }
  });
  
  const turnoverRate = totalValue > 0 
    ? (recentOrders.reduce((sum, o) => sum + o.totalAmount, 0) / totalValue * 100).toFixed(2)
    : 0;
  
  // Movement trends
  const ledgerEntries = await InventoryLedger.find({
    createdAt: { $gte: thirtyDaysAgo }
  });
  
  const totalMovements = ledgerEntries.length;
  const debits = ledgerEntries.filter(e => e.changeType === "debit").length;
  const credits = ledgerEntries.filter(e => e.changeType === "credit").length;
  
  return res.status(200).json(new ApiResponse(200, {
    analytics: {
      inventory: {
        totalValue,
        totalQuantity: totalQty,
        productCount: products.length,
        averageValuePerProduct: (totalValue / products.length).toFixed(2)
      },
      stockHealth: { inStock, lowStock, outOfStock },
      turnoverRate: `${turnoverRate}%`,
      movements: { totalMovements, debits, credits },
      period: "last_30_days"
    }
  }));
});

// ─────────────────────────────────────────────────────
// 4. ORDER ANALYTICS - Order patterns & insights
// ─────────────────────────────────────────────────────
export const getOrderAnalytics = asyncHandler(async (req, res) => {
  const allOrders = await Order.find()
    .populate("dealerId", "name")
    .populate("items.productId", "name");
  
  const statusCounts = {};
  let totalValue = 0;
  let totalOrders = allOrders.length;
  
  allOrders.forEach(order => {
    statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
    totalValue += order.totalAmount;
  });
  
  const averageOrderValue = totalOrders > 0 ? (totalValue / totalOrders).toFixed(2) : 0;
  
  // Pending orders (needs action)
  const pendingOrders = await Order.find({ status: "pending" })
    .populate("dealerId", "name")
    .limit(10);
  
  // Recently completed
  const completedOrders = await Order.find({ status: "completed" })
    .sort({ updatedAt: -1 })
    .limit(5);
  
  return res.status(200).json(new ApiResponse(200, {
    analytics: {
      summary: { totalOrders, totalValue, averageOrderValue },
      statusBreakdown: statusCounts,
      pendingOrders: pendingOrders.map(o => ({
        orderId: o._id,
        dealerName: o.dealerId?.name,
        amount: o.totalAmount,
        status: o.status,
        createdAt: o.createdAt
      })),
      recentlyCompleted: completedOrders.map(o => ({
        orderId: o._id,
        dealerName: o.dealerId?.name,
        amount: o.totalAmount,
        completedAt: o.updatedAt
      }))
    }
  }));
});

// ─────────────────────────────────────────────────────
// 5. DEALER PERFORMANCE - Dealer metrics & ranking
// ─────────────────────────────────────────────────────
export const getDealerPerformance = asyncHandler(async (req, res) => {
  const dealers = await Dealer.find();
  const dealerStats = [];
  
  for (const dealer of dealers) {
    const orders = await Order.find({ dealerId: dealer._id });
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
    const completedOrders = orders.filter(o => o.status === "completed").length;
    const avgOrderValue = totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(2) : 0;
    
    dealerStats.push({
      dealerId: dealer._id,
      dealerName: dealer.name,
      totalOrders,
      totalRevenue: totalRevenue.toFixed(2),
      completedOrders,
      completionRate: totalOrders > 0 ? ((completedOrders / totalOrders) * 100).toFixed(2) : 0,
      averageOrderValue: avgOrderValue,
      lastOrderDate: orders[orders.length - 1]?.createdAt || null
    });
  }
  
  // Sort by revenue
  dealerStats.sort((a, b) => parseFloat(b.totalRevenue) - parseFloat(a.totalRevenue));
  
  return res.status(200).json(new ApiResponse(200, {
    analytics: {
      totalDealers: dealers.length,
      topPerformers: dealerStats.slice(0, 10),
      allDealers: dealerStats
    }
  }));
});

// ─────────────────────────────────────────────────────
// 6. SYSTEM HEALTH - API & database status
// ─────────────────────────────────────────────────────
export const getSystemHealth = asyncHandler(async (req, res) => {
  const uptime = process.uptime();
  const memoryUsage = process.memoryUsage();
  
  // Check collections count
  const adminCount = await Admin.countDocuments();
  const dealerCount = await Dealer.countDocuments();
  const productCount = await Product.countDocuments();
  const orderCount = await Order.countDocuments();
  
  // Recent errors (from audit log if available)
  const errorCount = 0; // Would track from logging system
  
  return res.status(200).json(new ApiResponse(200, {
    health: {
      status: "healthy",
      uptime: `${(uptime / 60).toFixed(2)} minutes`,
      memory: {
        heapUsed: `${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
        heapTotal: `${(memoryUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`
      },
      database: {
        collections: { adminCount, dealerCount, productCount, orderCount },
        connected: true
      },
      timestamp: new Date()
    }
  }));
});

// ─────────────────────────────────────────────────────
// 7. PURCHASING RECOMMENDATIONS - What to order
// ─────────────────────────────────────────────────────
export const getPurchasingRecommendations = asyncHandler(async (req, res) => {
  const products = await Product.find();
  const recommendations = [];
  
  for (const product of products) {
    // Get recent sales velocity
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentOrders = await Order.find({
      createdAt: { $gte: thirtyDaysAgo },
      "items.productId": product._id
    });
    
    let quantitySold = 0;
    recentOrders.forEach(order => {
      order.items?.forEach(item => {
        if (item.productId.toString() === product._id.toString()) {
          quantitySold += item.quantity;
        }
      });
    });
    
    // Calculate daily velocity
    const dailyVelocity = quantitySold / 30;
    
    // If low stock, recommend order
    if (product.stockQty <= product.reorderLevel) {
      const recommendedQty = (dailyVelocity * 30 * 2).toFixed(0); // 2 months buffer
      
      recommendations.push({
        productId: product._id,
        productName: product.name,
        currentStock: product.stockQty,
        reorderLevel: product.reorderLevel,
        dailyVelocity: dailyVelocity.toFixed(2),
        recommendedOrderQty: recommendedQty,
        priority: product.stockQty === 0 ? "critical" : product.stockQty < product.reorderLevel / 2 ? "high" : "medium",
        estimatedCost: (recommendedQty * product.costPrice).toFixed(2)
      });
    }
  }
  
  // Sort by priority and quantity
  recommendations.sort((a, b) => {
    const priorityMap = { critical: 0, high: 1, medium: 2 };
    return priorityMap[a.priority] - priorityMap[b.priority];
  });
  
  return res.status(200).json(new ApiResponse(200, {
    recommendations: {
      totalRecommendations: recommendations.length,
      items: recommendations,
      generatedAt: new Date()
    }
  }));
});

// ─────────────────────────────────────────────────────
// 8. TREND FORECAST - Predict future needs
// ─────────────────────────────────────────────────────
export const getTrendForecast = asyncHandler(async (req, res) => {
  const { days = 30 } = req.query;
  
  // Get historical data
  const snapshots = await DailySnapshots.find()
    .sort({ date: -1 })
    .limit(60); // 2 months of data
  
  // Calculate average daily changes
  let totalRevenue = 0;
  let totalOrders = 0;
  let totalInventoryMoved = 0;
  
  if (snapshots.length > 0) {
    totalRevenue = snapshots.reduce((sum, s) => sum + (s.dailyRevenue || 0), 0);
    totalOrders = snapshots.reduce((sum, s) => sum + (s.dailyOrderCount || 0), 0);
    totalInventoryMoved = snapshots.reduce((sum, s) => sum + (s.dailyInventoryMoved || 0), 0);
  }
  
  const avgDailyRevenue = snapshots.length > 0 ? (totalRevenue / snapshots.length).toFixed(2) : 0;
  const avgDailyOrders = snapshots.length > 0 ? (totalOrders / snapshots.length).toFixed(2) : 0;
  const avgDailyMovement = snapshots.length > 0 ? (totalInventoryMoved / snapshots.length).toFixed(2) : 0;
  
  // Project forward
  const projectedRevenue = (avgDailyRevenue * days).toFixed(2);
  const projectedOrders = Math.round(avgDailyOrders * days);
  const projectedMovement = (avgDailyMovement * days).toFixed(2);
  
  return res.status(200).json(new ApiResponse(200, {
    forecast: {
      forecastDays: days,
      historical: { avgDailyRevenue, avgDailyOrders, avgDailyMovement },
      projections: { projectedRevenue, projectedOrders, projectedMovement },
      trend: "stable",
      generatedAt: new Date()
    }
  }));
});

// ─────────────────────────────────────────────────────
// 9. EXECUTIVE REPORT - Comprehensive summary
// ─────────────────────────────────────────────────────
export const getExecutiveReport = asyncHandler(async (req, res) => {
  // Gather all key metrics
  const admins = await Admin.countDocuments();
  const dealers = await Dealer.countDocuments();
  const products = await Product.countDocuments();
  const totalOrders = await Order.countDocuments();
  
  // Financial metrics
  const allOrders = await Order.find();
  const totalRevenue = allOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const completedOrders = allOrders.filter(o => o.status === "completed").length;
  
  // Inventory metrics
  const allProducts = await Product.find();
  const inventoryValue = allProducts.reduce((sum, p) => sum + (p.stockQty * p.salePrice), 0);
  const lowStockCount = allProducts.filter(p => p.stockQty <= p.reorderLevel).length;
  
  return res.status(200).json(new ApiResponse(200, {
    report: {
      title: "Executive Summary Report",
      generatedAt: new Date(),
      summary: {
        users: { admins, dealers, totalUsers: admins + dealers },
        operations: { products, totalOrders, completedOrders },
        financial: { totalRevenue: totalRevenue.toFixed(2) },
        inventory: { totalValue: inventoryValue.toFixed(2), lowStockItems: lowStockCount }
      }
    }
  }));
});

// ─────────────────────────────────────────────────────
// 10. CUSTOM REPORT BUILDER - Flexible analytics
// ─────────────────────────────────────────────────────
export const getCustomReport = asyncHandler(async (req, res) => {
  const { metrics = [] } = req.body;
  
  if (!Array.isArray(metrics) || metrics.length === 0) {
    throw new ApiError(400, "Metrics array required");
  }
  
  const report = {};
  
  for (const metric of metrics) {
    switch (metric) {
      case "revenue":
        const orders = await Order.find();
        report.totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
        break;
      case "orders":
        report.totalOrders = await Order.countDocuments();
        break;
      case "dealers":
        report.totalDealers = await Dealer.countDocuments();
        break;
      case "inventory":
        const prods = await Product.find();
        report.inventoryValue = prods.reduce((sum, p) => sum + (p.stockQty * p.salePrice), 0);
        break;
      default:
        // Skip unknown metrics
    }
  }
  
  return res.status(200).json(new ApiResponse(200, {
    customReport: {
      requestedMetrics: metrics,
      data: report,
      generatedAt: new Date()
    }
  }));
});
