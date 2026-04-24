/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PHASE 6: ADMIN DASHBOARD & ANALYTICS - VISUAL FLOW DIAGRAMS
 * ═══════════════════════════════════════════════════════════════════════════
 */

const PHASE6_FLOW_DIAGRAMS = {
  // ═════════════════════════════════════════════════════════════════════
  // FLOW 1: DASHBOARD OVERVIEW DATA AGGREGATION
  // ═════════════════════════════════════════════════════════════════════
  dashboardOverviewFlow: `
    ┌─────────────────────────────────────────────────────────────────┐
    │      FLOW 1: DASHBOARD OVERVIEW DATA AGGREGATION                │
    └─────────────────────────────────────────────────────────────────┘

    Admin Request:
      └─ GET /api/v1/dashboard/overview
           │
           ↓
    ┌──────────────────────────────────────────────────────────────────┐
    │  API Handler: getDashboardOverview()                            │
    ├──────────────────────────────────────────────────────────────────┤
    │  Parallel Data Collection:                                       │
    └──────────────────────────────────────────────────────────────────┘
           │
           ├─┬─ Count Admin Users
           │ │  └─ Query: Admin.countDocuments()
           │ │     Result: 2
           │ │
           ├─┼─ Count Dealer Users
           │ │  └─ Query: Dealer.countDocuments()
           │ │     Result: 15
           │ │
           ├─┼─ Count Products
           │ │  └─ Query: Product.countDocuments()
           │ │     Result: 50
           │ │
           ├─┼─ Get Today's Orders
           │ │  └─ Query: Order.find({createdAt >= today})
           │ │     Result: 5 orders
           │ │
           ├─┼─ Calculate Today's Revenue
           │ │  └─ Sum: 5 orders × avg value = 125,000
           │ │
           ├─┼─ Count Active Orders
           │ │  └─ Query: Order.countDocuments({status: "active"})
           │ │     Result: 25
           │ │
           ├─┼─ Count Pending Orders
           │ │  └─ Query: Order.countDocuments({status: "pending"})
           │ │     Result: 8
           │ │
           ├─┼─ Calculate Inventory Value
           │ │  └─ Sum: All products × (stockQty × salePrice)
           │ │     Result: 2,500,000
           │ │
           └─┴─ Count Low Stock Items
              └─ Query: Product.find({$expr: stockQty <= reorderLevel})
                 Result: 3 items

    Dashboard Aggregation:
      User Metrics:
        ├─ Admins: 2
        ├─ Dealers: 15
        └─ Products: 50

      Order Metrics:
        ├─ Active: 25
        ├─ Pending: 8
        └─ Today's Orders: 5

      Financial Metrics:
        ├─ Today's Revenue: 125,000
        └─ Inventory Value: 2,500,000

      Inventory Metrics:
        ├─ Low Stock Items: 3
        └─ Total Products: 50

    Response to Admin:
      ├─ Dashboard snapshot ready
      ├─ All KPIs displayed
      ├─ Real-time data
      └─ Alerts highlighted
  `,

  // ═════════════════════════════════════════════════════════════════════
  // FLOW 2: SALES ANALYTICS CALCULATION
  // ═════════════════════════════════════════════════════════════════════
  salesAnalyticsFlow: `
    ┌─────────────────────────────────────────────────────────────────┐
    │      FLOW 2: SALES ANALYTICS AGGREGATION & TRENDS               │
    └─────────────────────────────────────────────────────────────────┘

    Admin Request:
      └─ GET /api/v1/dashboard/sales/analytics?period=monthly
           │
           ↓
    ┌──────────────────────────────────────────────────────────────────┐
    │  API Handler: getSalesAnalytics(period)                         │
    ├──────────────────────────────────────────────────────────────────┤
    │  Processing Pipeline:                                            │
    └──────────────────────────────────────────────────────────────────┘
           │
           ├─ Step 1: Calculate Date Range
           │  └─ If monthly: startDate = 30 days ago
           │
           ├─ Step 2: Fetch Period Orders
           │  └─ Query: Order.find({createdAt >= startDate})
           │     Returns: 120 orders
           │
           ├─ Step 3: Calculate Metrics
           │  ├─ Total Orders: 120
           │  ├─ Total Revenue: 3,500,000
           │  └─ Average Order Value: 29,166.67
           │
           ├─ Step 4: Analyze Top Products
           │  │
           │  ├─ Iterate all orders
           │  ├─ For each order, sum items by product
           │  │
           │  ├─ Results:
           │  │  ├─ Product A: 1,500 units
           │  │  ├─ Product B: 1,200 units
           │  │  ├─ Product C: 950 units
           │  │  ├─ Product D: 800 units
           │  │  └─ Product E: 550 units
           │  │
           │  └─ Top 5 returned
           │
           ├─ Step 5: Analyze Top Dealers
           │  │
           │  ├─ Iterate all orders
           │  ├─ Group by dealer
           │  ├─ Sum sales & order count
           │  │
           │  ├─ Results:
           │  │  ├─ Dealer ABC: 850,000 (25 orders)
           │  │  ├─ Dealer XYZ: 750,000 (20 orders)
           │  │  ├─ Dealer 123: 650,000 (18 orders)
           │  │  ├─ Dealer 456: 600,000 (15 orders)
           │  │  └─ Dealer 789: 550,000 (12 orders)
           │  │
           │  └─ Top 5 returned
           │
           ├─ Step 6: Compile Report
           │  ├─ Metrics summary
           │  ├─ Top products list
           │  └─ Top dealers ranking
           │
           ↓

    Response to Admin:
      Sales Report Generated:
        ├─ Period: Monthly
        ├─ Date Range: 2026-03-24 to 2026-04-24
        ├─ Metrics:
        │  ├─ Total Orders: 120
        │  ├─ Total Revenue: 3,500,000
        │  └─ Average Order Value: 29,166.67
        ├─ Top 5 Products (by quantity)
        │  ├─ Product A: 1,500 units
        │  └─ ...
        └─ Top 5 Dealers (by revenue)
           ├─ Dealer ABC: 850,000
           └─ ...

    Use Cases:
      ✓ Identify best-selling products
      ✓ Track top customers
      ✓ Revenue trends
      ✓ Sales velocity planning
  `,

  // ═════════════════════════════════════════════════════════════════════
  // FLOW 3: DEALER PERFORMANCE SCORING
  // ═════════════════════════════════════════════════════════════════════
  dealerPerformanceFlow: `
    ┌─────────────────────────────────────────────────────────────────┐
    │      FLOW 3: DEALER PERFORMANCE CALCULATION & RANKING            │
    └─────────────────────────────────────────────────────────────────┘

    Admin Request:
      └─ GET /api/v1/dashboard/dealers/performance
           │
           ↓
    ┌──────────────────────────────────────────────────────────────────┐
    │  API Handler: getDealerPerformance()                            │
    ├──────────────────────────────────────────────────────────────────┤
    │  Ranking Pipeline:                                               │
    └──────────────────────────────────────────────────────────────────┘
           │
           ├─ Step 1: Fetch All Dealers
           │  └─ Query: Dealer.find()
           │     Returns: 15 dealers
           │
           ├─ Step 2: For Each Dealer, Calculate Metrics
           │  │
           │  ├─ Dealer ABC (ID: ABC-001):
           │  │  ├─ Fetch orders: Order.find({dealerId: ABC-001})
           │  │  │  Returns: 45 total orders
           │  │  ├─ Total Revenue: 1,250,000
           │  │  ├─ Completed Orders: 43
           │  │  ├─ Completion Rate: 43/45 = 95.56%
           │  │  ├─ Average Order Value: 1,250,000 / 45 = 27,777.78
           │  │  └─ Last Order: 2026-04-24
           │  │
           │  ├─ Dealer XYZ (ID: XYZ-002):
           │  │  ├─ Total Orders: 38
           │  │  ├─ Total Revenue: 1,100,000
           │  │  ├─ Completion Rate: 94.74%
           │  │  └─ ...
           │  │
           │  └─ (continue for all 15 dealers)
           │
           ├─ Step 3: Ranking
           │  └─ Sort all dealers by totalRevenue (descending)
           │
           ├─ Step 4: Extract Top 10
           │  └─ Top performers list created
           │
           ├─ Step 5: Compile Full Report
           │  ├─ Total dealer count: 15
           │  ├─ Top 10 performers
           │  └─ All dealers (for exports/detailed view)
           │
           ↓

    Performance Rankings:
      Rank 1: Dealer ABC
        ├─ Orders: 45
        ├─ Revenue: 1,250,000
        ├─ Completion Rate: 95.56%
        └─ AOV: 27,777.78

      Rank 2: Dealer XYZ
        ├─ Orders: 38
        ├─ Revenue: 1,100,000
        ├─ Completion Rate: 94.74%
        └─ AOV: 28,947.37

      (... continue for all dealers)

    Use Cases:
      ✓ Identify top customers
      ✓ Reward program eligibility
      ✓ Sales commission tracking
      ✓ Relationship prioritization
  `,

  // ═════════════════════════════════════════════════════════════════════
  // FLOW 4: PURCHASING RECOMMENDATIONS ENGINE
  // ═════════════════════════════════════════════════════════════════════
  purchasingRecommendationsFlow: `
    ┌─────────────────────────────────────────────────────────────────┐
    │   FLOW 4: SMART PURCHASING RECOMMENDATIONS ENGINE                │
    └─────────────────────────────────────────────────────────────────┘

    System: Automatic Recommendation Generation
      └─ Triggered: Periodically or on-demand
           │
           ↓
    ┌──────────────────────────────────────────────────────────────────┐
    │  Algorithm: getPurchasingRecommendations()                      │
    ├──────────────────────────────────────────────────────────────────┤
    │  For Each Product:                                               │
    └──────────────────────────────────────────────────────────────────┘
           │
           ├─ Product: SALT-001
           │  ├─ Current Stock: 50 kg
           │  ├─ Reorder Level: 500 kg
           │  ├─ Status: LOW STOCK ⚠️
           │  │
           │  ├─ Step 1: Get 30-Day Sales Velocity
           │  │  └─ Query: Orders from last 30 days with SALT-001
           │  │     ├─ Order 1: 500 units
           │  │     ├─ Order 2: 450 units
           │  │     ├─ Order 3: 380 units
           │  │     └─ Total: 1,365 units in 30 days
           │  │
           │  ├─ Step 2: Calculate Daily Velocity
           │  │  └─ 1,365 / 30 = 45.5 units/day
           │  │
           │  ├─ Step 3: Calculate Recommended Order Qty
           │  │  └─ Formula: (dailyVelocity × 30 × 2)
           │  │     = (45.5 × 30 × 2)
           │  │     = 2,730 units (2-month buffer)
           │  │
           │  ├─ Step 4: Determine Priority
           │  │  └─ If stock == 0: CRITICAL ⚠️
           │  │     If stock < level/2: HIGH ⚠
           │  │     Else: MEDIUM ℹ
           │  │     Result: CRITICAL (0 < 500)
           │  │
           │  ├─ Step 5: Calculate Estimated Cost
           │  │  └─ 2,730 × cost_price = 190,500
           │  │
           │  └─ Recommendation Complete:
           │     ├─ Product: SALT-001
           │     ├─ Current: 50 kg
           │     ├─ Daily Velocity: 45.5 kg
           │     ├─ Recommend Order: 2,730 kg
           │     ├─ Priority: CRITICAL
           │     └─ Est. Cost: 190,500
           │
           ├─ (Repeat for all products below reorder level)
           │
           ├─ SALT-004:
           │  ├─ Current: 200 kg
           │  ├─ Daily Velocity: 32.2 kg
           │  ├─ Recommend: 1,932 kg
           │  ├─ Priority: HIGH
           │  └─ Cost: 96,600
           │
           └─ (Continue for all products)

    Final Recommendations Report:
      Priority Sorting:
        ├─ CRITICAL (5 items)
        │  ├─ SALT-001: 2,730 units (190,500)
        │  └─ ...
        ├─ HIGH (8 items)
        │  ├─ SALT-004: 1,932 units (96,600)
        │  └─ ...
        └─ MEDIUM (12 items)
           └─ ...

    Use Cases:
      ✓ Automated purchase orders
      ✓ Supplier communication
      ✓ Budget planning
      ✓ Prevent stockouts
      ✓ Optimize inventory levels
  `,

  // ═════════════════════════════════════════════════════════════════════
  // FLOW 5: FORECAST GENERATION FROM HISTORICAL DATA
  // ═════════════════════════════════════════════════════════════════════
  forecastFlow: `
    ┌─────────────────────────────────────────────────────────────────┐
    │     FLOW 5: TREND FORECAST & BUSINESS PREDICTIONS                │
    └─────────────────────────────────────────────────────────────────┘

    Admin Request:
      └─ GET /api/v1/dashboard/trends/forecast?days=60
           │
           ↓
    ┌──────────────────────────────────────────────────────────────────┐
    │  Algorithm: getTrendForecast(days)                              │
    ├──────────────────────────────────────────────────────────────────┤
    │  Historical Data Analysis:                                       │
    └──────────────────────────────────────────────────────────────────┘
           │
           ├─ Step 1: Fetch Historical Snapshots
           │  └─ Query: DailySnapshots.find().sort({date: -1}).limit(60)
           │     Returns: Last 60 days of data
           │
           ├─ Step 2: Aggregate Historical Metrics
           │  │
           │  ├─ Daily Revenue:
           │  │  ├─ Day 1: 145,000
           │  │  ├─ Day 2: 152,000
           │  │  ├─ Day 3: 148,000
           │  │  └─ ...
           │  │  └─ Total 60 days: 8,750,000
           │  │
           │  ├─ Daily Orders:
           │  │  ├─ Day 1: 10 orders
           │  │  ├─ Day 2: 9 orders
           │  │  ├─ Day 3: 9 orders
           │  │  └─ ...
           │  │  └─ Total: 565 orders
           │  │
           │  └─ Daily Inventory Movement:
           │     ├─ Day 1: 8,500 units
           │     ├─ Day 2: 8,100 units
           │     └─ ...
           │
           ├─ Step 3: Calculate Daily Averages
           │  ├─ Avg Daily Revenue = 8,750,000 / 60 = 145,833.33
           │  ├─ Avg Daily Orders = 565 / 60 = 9.42
           │  └─ Avg Daily Movement = 489,400 / 60 = 8,156.67
           │
           ├─ Step 4: Project Forward (60 days)
           │  ├─ Projected Revenue = 145,833.33 × 60 = 8,750,000
           │  ├─ Projected Orders = 9.42 × 60 = 565
           │  └─ Projected Movement = 8,156.67 × 60 = 489,400
           │
           ├─ Step 5: Determine Trend
           │  ├─ Compare 30-day vs 30-day before that
           │  ├─ Calculation: newer avg / older avg
           │  ├─ Result: stable, growing, or declining
           │  └─ Trend: STABLE
           │
           ↓

    Forecast Report (60 days):
      ┌────────────────────────────────────────────┐
      │     Business Forecast for Next 60 Days     │
      ├────────────────────────────────────────────┤
      │ Historical Average (per day):              │
      │   • Revenue: 145,833.33                    │
      │   • Orders: 9.42                           │
      │   • Inventory Movement: 8,156.67 units    │
      │                                            │
      │ 60-Day Projections:                        │
      │   • Revenue: 8,750,000                     │
      │   • Orders: 565                            │
      │   • Movement: 489,400 units               │
      │                                            │
      │ Trend: STABLE                              │
      │                                            │
      │ Recommendations:                           │
      │   • Budget: 8,750,000 minimum             │
      │   • Staffing: Normal levels                │
      │   • Purchasing: 489,400 units needed      │
      └────────────────────────────────────────────┘

    Use Cases:
      ✓ Revenue forecasting for budgets
      ✓ Staffing requirements planning
      ✓ Purchasing forecasts
      ✓ Capacity planning
      ✓ Risk assessment
      ✓ Growth tracking
  `,
};

export { PHASE6_FLOW_DIAGRAMS };
