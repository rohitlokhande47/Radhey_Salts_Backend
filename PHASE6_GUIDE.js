/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PHASE 6: ADMIN DASHBOARD & ANALYTICS - COMPLETE API REFERENCE
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * 10 Admin-Only Endpoints for comprehensive business intelligence,
 * real-time metrics, forecasting, and data-driven insights
 */

// ═══════════════════════════════════════════════════════════════════════════
// ENDPOINT 1: DASHBOARD OVERVIEW
// ═══════════════════════════════════════════════════════════════════════════

const ENDPOINT_1_DASHBOARD_OVERVIEW = `
GET /api/v1/dashboard/overview

PURPOSE:
  Quick snapshot of all critical business metrics in one view

AUTHENTICATION:
  ✓ JWT required
  ✓ Admin role required

REQUEST:
  curl -X GET http://localhost:5000/api/v1/dashboard/overview \\
    -H "Authorization: Bearer $ADMIN_JWT"

RESPONSE (200):
{
  "success": true,
  "data": {
    "dashboard": {
      "userMetrics": {
        "totalAdmins": 2,
        "totalDealers": 15,
        "totalProducts": 50
      },
      "orderMetrics": {
        "activeOrders": 25,
        "pendingOrders": 8,
        "todayOrderCount": 5
      },
      "financialMetrics": {
        "todayRevenue": 125000,
        "inventoryValue": 2500000
      },
      "inventoryMetrics": {
        "lowStockCount": 3,
        "totalProducts": 50
      },
      "timestamp": "2026-04-24T10:00:00Z"
    }
  }
}

USE CASES:
  1. Admin login → Load dashboard overview
  2. Executive dashboard → Quick KPIs
  3. Morning standup → Daily summary
`;

// ═══════════════════════════════════════════════════════════════════════════
// ENDPOINT 2: SALES ANALYTICS
// ═══════════════════════════════════════════════════════════════════════════

const ENDPOINT_2_SALES_ANALYTICS = `
GET /api/v1/dashboard/sales/analytics?period=weekly

PURPOSE:
  Comprehensive sales analysis with trends, top products, and dealer performance

PARAMETERS:
  period: "daily" | "weekly" | "monthly" (default: weekly)

AUTHENTICATION:
  ✓ JWT required
  ✓ Admin role required

REQUEST:
  curl -X GET "http://localhost:5000/api/v1/dashboard/sales/analytics?period=monthly" \\
    -H "Authorization: Bearer $ADMIN_JWT"

RESPONSE (200):
{
  "success": true,
  "data": {
    "analytics": {
      "period": "monthly",
      "metrics": {
        "totalOrders": 120,
        "totalRevenue": 3500000,
        "averageOrderValue": 29166.67
      },
      "topProducts": [
        {
          "productId": "product_001",
          "quantitySold": 1500
        },
        {
          "productId": "product_002",
          "quantitySold": 1200
        }
      ],
      "topDealers": [
        {
          "name": "Dealer ABC",
          "sales": 850000,
          "orders": 25
        },
        {
          "name": "Dealer XYZ",
          "sales": 750000,
          "orders": 20
        }
      ],
      "startDate": "2026-03-24T00:00:00Z",
      "endDate": "2026-04-24T23:59:59Z"
    }
  }
}

USE CASES:
  1. Identify top-selling products
  2. Track dealer performance
  3. Analyze sales trends
  4. Revenue forecasting
  5. Inventory planning based on sales velocity
`;

// ═══════════════════════════════════════════════════════════════════════════
// ENDPOINT 3: INVENTORY ANALYTICS
// ═══════════════════════════════════════════════════════════════════════════

const ENDPOINT_3_INVENTORY_ANALYTICS = `
GET /api/v1/dashboard/inventory/analytics

PURPOSE:
  Inventory health metrics, stock valuations, and movement trends

AUTHENTICATION:
  ✓ JWT required
  ✓ Admin role required

REQUEST:
  curl -X GET http://localhost:5000/api/v1/dashboard/inventory/analytics \\
    -H "Authorization: Bearer $ADMIN_JWT"

RESPONSE (200):
{
  "success": true,
  "data": {
    "analytics": {
      "inventory": {
        "totalValue": 2500000,
        "totalQuantity": 50000,
        "productCount": 50,
        "averageValuePerProduct": 50000
      },
      "stockHealth": {
        "inStock": 47,
        "lowStock": 2,
        "outOfStock": 1
      },
      "turnoverRate": "45.32%",
      "movements": {
        "totalMovements": 245,
        "debits": 150,
        "credits": 95
      },
      "period": "last_30_days"
    }
  }
}

USE CASES:
  1. Assess inventory valuation for financial reporting
  2. Monitor stock health and identify issues
  3. Calculate turnover rates
  4. Plan purchasing based on movement patterns
  5. Identify slow-moving inventory
`;

// ═══════════════════════════════════════════════════════════════════════════
// ENDPOINT 4: ORDER ANALYTICS
// ═══════════════════════════════════════════════════════════════════════════

const ENDPOINT_4_ORDER_ANALYTICS = `
GET /api/v1/dashboard/orders/analytics

PURPOSE:
  Order patterns, status breakdown, pending items, and completion tracking

AUTHENTICATION:
  ✓ JWT required
  ✓ Admin role required

REQUEST:
  curl -X GET http://localhost:5000/api/v1/dashboard/orders/analytics \\
    -H "Authorization: Bearer $ADMIN_JWT"

RESPONSE (200):
{
  "success": true,
  "data": {
    "analytics": {
      "summary": {
        "totalOrders": 285,
        "totalValue": 8250000,
        "averageOrderValue": 28947.37
      },
      "statusBreakdown": {
        "pending": 8,
        "active": 25,
        "completed": 250,
        "cancelled": 2
      },
      "pendingOrders": [
        {
          "orderId": "ORD-001",
          "dealerName": "Dealer ABC",
          "amount": 125000,
          "status": "pending",
          "createdAt": "2026-04-23T10:00:00Z"
        }
      ],
      "recentlyCompleted": [
        {
          "orderId": "ORD-002",
          "dealerName": "Dealer XYZ",
          "amount": 145000,
          "completedAt": "2026-04-24T09:30:00Z"
        }
      ]
    }
  }
}

USE CASES:
  1. Track pending orders requiring action
  2. Monitor completion rates
  3. Identify bottlenecks
  4. Performance metrics
`;

// ═══════════════════════════════════════════════════════════════════════════
// ENDPOINT 5: DEALER PERFORMANCE
// ═══════════════════════════════════════════════════════════════════════════

const ENDPOINT_5_DEALER_PERFORMANCE = `
GET /api/v1/dashboard/dealers/performance

PURPOSE:
  Dealer rankings, performance metrics, and trends

AUTHENTICATION:
  ✓ JWT required
  ✓ Admin role required

REQUEST:
  curl -X GET http://localhost:5000/api/v1/dashboard/dealers/performance \\
    -H "Authorization: Bearer $ADMIN_JWT"

RESPONSE (200):
{
  "success": true,
  "data": {
    "analytics": {
      "totalDealers": 15,
      "topPerformers": [
        {
          "dealerId": "dealer_001",
          "dealerName": "Dealer ABC",
          "totalOrders": 45,
          "totalRevenue": "1250000.00",
          "completedOrders": 43,
          "completionRate": "95.56%",
          "averageOrderValue": "27777.78",
          "lastOrderDate": "2026-04-24T10:00:00Z"
        },
        {
          "dealerId": "dealer_002",
          "dealerName": "Dealer XYZ",
          "totalOrders": 38,
          "totalRevenue": "1100000.00",
          "completedOrders": 36,
          "completionRate": "94.74%",
          "averageOrderValue": "28947.37",
          "lastOrderDate": "2026-04-24T09:30:00Z"
        }
      ],
      "allDealers": [
        // Full list of all dealers with metrics
      ]
    }
  }
}

USE CASES:
  1. Rank dealers by performance
  2. Identify top customers
  3. Monitor dealer activity
  4. Completion rate tracking
  5. Relationship management insights
`;

// ═══════════════════════════════════════════════════════════════════════════
// ENDPOINT 6: SYSTEM HEALTH
// ═══════════════════════════════════════════════════════════════════════════

const ENDPOINT_6_SYSTEM_HEALTH = `
GET /api/v1/dashboard/system/health

PURPOSE:
  API uptime, memory usage, database status

AUTHENTICATION:
  ✓ JWT required
  ✓ Admin role required

REQUEST:
  curl -X GET http://localhost:5000/api/v1/dashboard/system/health \\
    -H "Authorization: Bearer $ADMIN_JWT"

RESPONSE (200):
{
  "success": true,
  "data": {
    "health": {
      "status": "healthy",
      "uptime": "145.32 minutes",
      "memory": {
        "heapUsed": "125.45 MB",
        "heapTotal": "256.00 MB"
      },
      "database": {
        "collections": {
          "adminCount": 2,
          "dealerCount": 15,
          "productCount": 50,
          "orderCount": 285
        },
        "connected": true
      },
      "timestamp": "2026-04-24T10:00:00Z"
    }
  }
}

USE CASES:
  1. Monitor system status
  2. Detect performance issues
  3. Memory leak monitoring
  4. Database connectivity checks
`;

// ═══════════════════════════════════════════════════════════════════════════
// ENDPOINT 7: PURCHASING RECOMMENDATIONS
// ═══════════════════════════════════════════════════════════════════════════

const ENDPOINT_7_PURCHASING_RECOMMENDATIONS = `
GET /api/v1/dashboard/recommendations/purchase

PURPOSE:
  Intelligent recommendations on what and how much to purchase based on
  sales velocity, current stock, and demand patterns

AUTHENTICATION:
  ✓ JWT required
  ✓ Admin role required

REQUEST:
  curl -X GET http://localhost:5000/api/v1/dashboard/recommendations/purchase \\
    -H "Authorization: Bearer $ADMIN_JWT"

RESPONSE (200):
{
  "success": true,
  "data": {
    "recommendations": {
      "totalRecommendations": 5,
      "items": [
        {
          "productId": "SALT-001",
          "productName": "Premium Iodized Salt 25kg",
          "currentStock": 50,
          "reorderLevel": 500,
          "dailyVelocity": "45.50",
          "recommendedOrderQty": "2730",
          "priority": "critical",
          "estimatedCost": "190500.00"
        },
        {
          "productId": "SALT-004",
          "productName": "Rock Salt 50kg",
          "currentStock": 200,
          "reorderLevel": 1000,
          "dailyVelocity": "32.20",
          "recommendedOrderQty": "1932",
          "priority": "high",
          "estimatedCost": "96600.00"
        }
      ],
      "generatedAt": "2026-04-24T10:00:00Z"
    }
  }
}

USE CASES:
  1. Automated purchasing decisions
  2. Prevent stockouts with data-driven quantities
  3. Supplier ordering
  4. Budget planning
  5. Inventory optimization
`;

// ═══════════════════════════════════════════════════════════════════════════
// ENDPOINT 8: TREND FORECAST
// ═══════════════════════════════════════════════════════════════════════════

const ENDPOINT_8_TREND_FORECAST = `
GET /api/v1/dashboard/trends/forecast?days=30

PURPOSE:
  Forecast future business metrics based on historical trends

PARAMETERS:
  days: number of days to forecast (default: 30)

AUTHENTICATION:
  ✓ JWT required
  ✓ Admin role required

REQUEST:
  curl -X GET "http://localhost:5000/api/v1/dashboard/trends/forecast?days=60" \\
    -H "Authorization: Bearer $ADMIN_JWT"

RESPONSE (200):
{
  "success": true,
  "data": {
    "forecast": {
      "forecastDays": 60,
      "historical": {
        "avgDailyRevenue": "145833.33",
        "avgDailyOrders": "9.42",
        "avgDailyMovement": "8156.67"
      },
      "projections": {
        "projectedRevenue": "8750000.00",
        "projectedOrders": 565,
        "projectedMovement": "489400.00"
      },
      "trend": "stable",
      "generatedAt": "2026-04-24T10:00:00Z"
    }
  }
}

USE CASES:
  1. Budget forecasting
  2. Capacity planning
  3. Purchasing forecasts
  4. Revenue projections
  5. Staffing requirements estimation
`;

// ═══════════════════════════════════════════════════════════════════════════
// ENDPOINT 9: EXECUTIVE REPORT
// ═══════════════════════════════════════════════════════════════════════════

const ENDPOINT_9_EXECUTIVE_REPORT = `
GET /api/v1/dashboard/report/executive

PURPOSE:
  High-level executive summary of all key business metrics

AUTHENTICATION:
  ✓ JWT required
  ✓ Admin role required

REQUEST:
  curl -X GET http://localhost:5000/api/v1/dashboard/report/executive \\
    -H "Authorization: Bearer $ADMIN_JWT"

RESPONSE (200):
{
  "success": true,
  "data": {
    "report": {
      "title": "Executive Summary Report",
      "generatedAt": "2026-04-24T10:00:00Z",
      "summary": {
        "users": {
          "admins": 2,
          "dealers": 15,
          "totalUsers": 17
        },
        "operations": {
          "products": 50,
          "totalOrders": 285,
          "completedOrders": 250
        },
        "financial": {
          "totalRevenue": "8250000.00"
        },
        "inventory": {
          "totalValue": "2500000.00",
          "lowStockItems": 3
        }
      }
    }
  }
}

USE CASES:
  1. Board presentations
  2. Investor reports
  3. Monthly reviews
  4. Performance summaries
`;

// ═══════════════════════════════════════════════════════════════════════════
// ENDPOINT 10: CUSTOM REPORT BUILDER
// ═══════════════════════════════════════════════════════════════════════════

const ENDPOINT_10_CUSTOM_REPORT = `
POST /api/v1/dashboard/report/custom

PURPOSE:
  Build custom reports with selected metrics

AUTHENTICATION:
  ✓ JWT required
  ✓ Admin role required

REQUEST BODY:
{
  "metrics": ["revenue", "orders", "dealers", "inventory"]
}

REQUEST:
  curl -X POST http://localhost:5000/api/v1/dashboard/report/custom \\
    -H "Content-Type: application/json" \\
    -H "Authorization: Bearer $ADMIN_JWT" \\
    -d '{
      "metrics": ["revenue", "orders", "inventory"]
    }'

RESPONSE (200):
{
  "success": true,
  "data": {
    "customReport": {
      "requestedMetrics": ["revenue", "orders", "inventory"],
      "data": {
        "totalRevenue": 8250000,
        "totalOrders": 285,
        "inventoryValue": 2500000
      },
      "generatedAt": "2026-04-24T10:00:00Z"
    }
  }
}

AVAILABLE METRICS:
  - revenue: Total revenue
  - orders: Order count
  - dealers: Dealer count
  - inventory: Inventory value

USE CASES:
  1. Ad-hoc reporting
  2. Custom dashboards
  3. Specific data extraction
  4. Flexible analysis
`;

// ═══════════════════════════════════════════════════════════════════════════
// COMMON ERROR RESPONSES
// ═══════════════════════════════════════════════════════════════════════════

const ERROR_RESPONSES = `
1. MISSING AUTHENTICATION (401):
{
  "success": false,
  "statusCode": 401,
  "message": "No token, authorization denied",
  "error": "UNAUTHORIZED"
}

2. INVALID TOKEN (401):
{
  "success": false,
  "statusCode": 401,
  "message": "Token is not valid",
  "error": "UNAUTHORIZED"
}

3. DEALER ATTEMPTING ACCESS (403):
{
  "success": false,
  "statusCode": 403,
  "message": "Admin role required",
  "error": "FORBIDDEN"
}

4. INVALID CUSTOM METRICS (400):
{
  "success": false,
  "statusCode": 400,
  "message": "Metrics array required",
  "error": "BAD_REQUEST"
}
`;

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 6 API ENDPOINTS SUMMARY
// ═══════════════════════════════════════════════════════════════════════════

const PHASE6_ENDPOINTS_SUMMARY = `
╔═════════════════════════════════════════════════════════════════════╗
║     PHASE 6: ADMIN DASHBOARD & ANALYTICS - 10 ENDPOINTS            ║
╠═════════════════════════════════════════════════════════════════════╣
║                                                                     ║
║ 1. GET /api/v1/dashboard/overview                                  ║
║    → Quick dashboard snapshot (KPIs, totals, alerts)              ║
║                                                                     ║
║ 2. GET /api/v1/dashboard/sales/analytics?period=...              ║
║    → Sales trends, top products, dealer rankings                 ║
║                                                                     ║
║ 3. GET /api/v1/dashboard/inventory/analytics                     ║
║    → Inventory valuation, health, turnover, movements             ║
║                                                                     ║
║ 4. GET /api/v1/dashboard/orders/analytics                        ║
║    → Order patterns, status breakdown, pending items              ║
║                                                                     ║
║ 5. GET /api/v1/dashboard/dealers/performance                     ║
║    → Dealer rankings, metrics, completion rates                  ║
║                                                                     ║
║ 6. GET /api/v1/dashboard/system/health                           ║
║    → API uptime, memory, database status                         ║
║                                                                     ║
║ 7. GET /api/v1/dashboard/recommendations/purchase                ║
║    → What & how much to order (data-driven)                      ║
║                                                                     ║
║ 8. GET /api/v1/dashboard/trends/forecast?days=30                 ║
║    → Revenue, order, and inventory forecasts                     ║
║                                                                     ║
║ 9. GET /api/v1/dashboard/report/executive                        ║
║    → High-level executive summary                                ║
║                                                                     ║
║ 10. POST /api/v1/dashboard/report/custom                         ║
║     → Build custom reports with selected metrics                 ║
║                                                                     ║
║ ALL ENDPOINTS:                                                    ║
║   ✓ Require JWT authentication                                    ║
║   ✓ Require admin role                                            ║
║   ✓ Return JSON response                                          ║
║   ✓ Include timestamps                                            ║
║   ✓ Comprehensive error handling                                  ║
║                                                                     ║
╚═════════════════════════════════════════════════════════════════════╝
`;

export {
  ENDPOINT_1_DASHBOARD_OVERVIEW,
  ENDPOINT_2_SALES_ANALYTICS,
  ENDPOINT_3_INVENTORY_ANALYTICS,
  ENDPOINT_4_ORDER_ANALYTICS,
  ENDPOINT_5_DEALER_PERFORMANCE,
  ENDPOINT_6_SYSTEM_HEALTH,
  ENDPOINT_7_PURCHASING_RECOMMENDATIONS,
  ENDPOINT_8_TREND_FORECAST,
  ENDPOINT_9_EXECUTIVE_REPORT,
  ENDPOINT_10_CUSTOM_REPORT,
  ERROR_RESPONSES,
  PHASE6_ENDPOINTS_SUMMARY
};
