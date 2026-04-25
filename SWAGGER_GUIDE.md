╔═══════════════════════════════════════════════════════════════════════════════╗
║                    RADHE SALT BACKEND - SWAGGER DOCUMENTATION                  ║
║                          OpenAPI 3.0 Integration Guide                          ║
╚═══════════════════════════════════════════════════════════════════════════════╝

═══════════════════════════════════════════════════════════════════════════════
📋 TABLE OF CONTENTS
═══════════════════════════════════════════════════════════════════════════════

1. Overview & Setup
2. Accessing the API Documentation
3. API Endpoints by Phase
4. Authentication Guide
5. Quick Test Scenarios
6. Integration Details
7. Troubleshooting


═══════════════════════════════════════════════════════════════════════════════
1. OVERVIEW & SETUP
═══════════════════════════════════════════════════════════════════════════════

✅ WHAT'S BEEN IMPLEMENTED:

Packages Installed:
  • swagger-jsdoc: Generates OpenAPI spec from JSDoc comments
  • swagger-ui-express: Provides interactive API documentation UI

Files Created:
  • /src/config/swagger.js: Main Swagger configuration & component schemas
  • /src/swagger/endpoints.js: All endpoint documentation (50+ endpoints)
  
Files Modified:
  • /src/app.js: Integrated Swagger UI middleware

Documentation Coverage:
  ✓ 50+ API endpoints documented
  ✓ Complete request/response schemas
  ✓ Authentication requirements for each endpoint
  ✓ All status codes and error responses
  ✓ Rate limiting information
  ✓ Security header specifications
  ✓ Admin-only endpoint restrictions


═══════════════════════════════════════════════════════════════════════════════
2. ACCESSING THE API DOCUMENTATION
═══════════════════════════════════════════════════════════════════════════════

START THE SERVER:
  npm start

THEN OPEN IN BROWSER:

  🔗 Interactive UI:     http://localhost:8000/api-docs
  📄 JSON Spec:          http://localhost:8000/swagger.json
  ✅ Health Check:       http://localhost:8000/api/v1/health


SWAGGER UI FEATURES:
  ✓ Try out endpoint requests directly in the browser
  ✓ Persist authorization token across requests
  ✓ View complete request/response examples
  ✓ Explore parameters, headers, and body schemas
  ✓ See all available endpoints organized by tag
  ✓ Copy curl commands for use in terminal


═══════════════════════════════════════════════════════════════════════════════
3. API ENDPOINTS BY PHASE
═══════════════════════════════════════════════════════════════════════════════

PHASE 1: AUTHENTICATION (3 endpoints)
─────────────────────────────────────

  POST   /auth/register
    Description: Register a new user account
    Body: { email, password, name, phone, companyName }
    Response: { success, data: { userId, email, role } }
    Security: None (public)

  POST   /auth/login
    Description: Authenticate user with credentials
    Body: { email, password }
    Response: { success, data: { user, accessToken, refreshToken } }
    Security: None (public)

  POST   /auth/refresh
    Description: Refresh expired access token
    Body: { refreshToken }
    Response: { accessToken }
    Security: Bearer Token Required


PHASE 2: PRODUCTS (5 endpoints)
─────────────────────────────────

  GET    /products
    Description: List all products with pagination
    Query: page, limit, category, search
    Response: Array of Product objects
    Security: Bearer Token Required

  POST   /products
    Description: Create new product (Admin only)
    Body: { name, description, price, category, quantity, sku }
    Response: Created product details
    Security: Bearer Token + Admin Role

  GET    /products/{id}
    Description: Get specific product details
    Path: Product ID
    Response: Single Product object
    Security: Bearer Token Required

  PUT    /products/{id}
    Description: Update product (Admin only)
    Path: Product ID
    Body: { name, price, quantity, ... }
    Response: Updated product
    Security: Bearer Token + Admin Role

  DELETE /products/{id}
    Description: Delete product (Admin only)
    Path: Product ID
    Response: Deletion confirmation
    Security: Bearer Token + Admin Role


PHASE 3: ORDERS (4 endpoints)
────────────────────────────

  GET    /orders
    Description: List all orders with filters
    Query: status, startDate, endDate, page, limit
    Response: Array of Order objects
    Security: Bearer Token Required

  POST   /orders
    Description: Create new order
    Body: { items: [{productId, quantity}], totalAmount, notes }
    Response: Created order details
    Security: Bearer Token Required

  GET    /orders/{id}
    Description: Get specific order details
    Path: Order ID
    Response: Single Order object
    Security: Bearer Token Required

  PUT    /orders/{id}
    Description: Update order status
    Path: Order ID
    Body: { status, notes }
    Response: Updated order
    Security: Bearer Token Required


PHASE 5: INVENTORY (4 endpoints)
────────────────────────────────

  GET    /inventory
    Description: Get inventory levels
    Query: warehouseId, lowStock
    Response: Inventory data
    Security: Bearer Token Required

  POST   /inventory
    Description: Adjust inventory
    Body: { productId, quantity, type: "stock_in|stock_out|adjustment", notes }
    Response: Adjustment confirmation
    Security: Bearer Token Required

  GET    /inventory/ledger
    Description: Get inventory audit trail
    Query: productId, days
    Response: Ledger entries
    Security: Bearer Token Required

  GET    /inventory/snapshots
    Description: Get daily inventory snapshots
    Query: date
    Response: Snapshot data
    Security: Bearer Token Required


PHASE 6: DASHBOARD/ANALYTICS (6 endpoints)
──────────────────────────────────────────

  GET    /dashboard/overview
    Description: Dashboard metrics overview (Admin only)
    Response: { totalSales, activeOrders, totalDealers, inventoryValue }
    Security: Bearer Token + Admin Role

  GET    /dashboard/analytics
    Description: Sales analytics
    Query: startDate, endDate
    Response: Sales trends and metrics
    Security: Bearer Token Required

  GET    /dashboard/inventory-analytics
    Description: Inventory insights
    Response: Stock levels, turnover rates
    Security: Bearer Token Required

  GET    /dashboard/dealer-performance
    Description: Dealer performance metrics
    Query: limit
    Response: Top dealers
    Security: Bearer Token Required

  GET    /dashboard/trends
    Description: 30-day trend forecasting
    Query: days
    Response: Trend forecast data
    Security: Bearer Token Required

  POST   /dashboard/custom-report
    Description: Generate custom report
    Body: { reportType, filters, format: "json|csv|pdf" }
    Response: Generated report
    Security: Bearer Token Required


PHASE 7: MONITORING (4 endpoints - Admin only)
───────────────────────────────────────────────

  GET    /admin/monitoring/logs
    Description: Request logs with filtering
    Query: limit, offset, filter
    Response: { logs: [], total }
    Security: Bearer Token + Admin Role

  GET    /admin/monitoring/security-events
    Description: Security event logs
    Response: { events: [], criticalCount, highCount }
    Security: Bearer Token + Admin Role

  GET    /admin/monitoring/performance
    Description: Performance metrics
    Response: { totalRequests, averageResponseTime, slowRequests }
    Security: Bearer Token + Admin Role

  GET    /admin/monitoring/cache-stats
    Description: Cache statistics
    Response: { hitRate, compressionRate, bandwidthSaved }
    Security: Bearer Token + Admin Role


═══════════════════════════════════════════════════════════════════════════════
4. AUTHENTICATION GUIDE
═══════════════════════════════════════════════════════════════════════════════

STEP 1: REGISTER (if new user)
────────────────────────────

  curl -X POST http://localhost:8000/api/v1/auth/register \
    -H "Content-Type: application/json" \
    -d '{
      "email": "dealer@radhesalt.com",
      "password": "SecurePass@123",
      "name": "Radhe Dealer",
      "phone": "+91 9876543210",
      "companyName": "Radhe Salt Traders"
    }'

  Expected Response:
  {
    "success": true,
    "statusCode": 201,
    "data": {
      "userId": "user_id_here",
      "email": "dealer@radhesalt.com",
      "role": "dealer"
    }
  }


STEP 2: LOGIN
─────────────

  curl -X POST http://localhost:8000/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{
      "email": "dealer@radhesalt.com",
      "password": "SecurePass@123"
    }'

  Expected Response:
  {
    "success": true,
    "data": {
      "user": { "id": "...", "email": "...", "role": "dealer" },
      "accessToken": "eyJhbGc...",
      "refreshToken": "eyJhbGc..."
    }
  }

⚠️  SAVE THE accessToken - you'll use it for all protected endpoints!


STEP 3: USE TOKEN FOR PROTECTED ENDPOINTS
──────────────────────────────────────────

  Authorization Header Format:
  Authorization: Bearer <ACCESS_TOKEN>

  Example:
  curl http://localhost:8000/api/v1/products \
    -H "Authorization: Bearer eyJhbGc..."

  In Swagger UI:
  1. Click "Authorize" button (top right)
  2. Paste your accessToken
  3. Click "Authorize"
  4. All subsequent requests will include the token


STEP 4: REFRESH TOKEN (when expired)
────────────────────────────────────

  curl -X POST http://localhost:8000/api/v1/auth/refresh \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer <EXPIRED_TOKEN>" \
    -d '{
      "refreshToken": "eyJhbGc..."
    }'


═══════════════════════════════════════════════════════════════════════════════
5. QUICK TEST SCENARIOS
═══════════════════════════════════════════════════════════════════════════════

SCENARIO 1: Basic Product Listing
──────────────────────────────────

  1. Open Swagger UI: http://localhost:8000/api-docs
  2. Find "Products" section
  3. Click "GET /products"
  4. Add Token:
     - Click "Authorize"
     - Paste your Bearer token
  5. Click "Try it out"
  6. Click "Execute"
  7. See response in "Responses" section


SCENARIO 2: Create an Order
────────────────────────────

  1. Get product IDs from /products endpoint
  2. Find "Orders" section → "POST /orders"
  3. Click "Try it out"
  4. Add Request Body:
     {
       "items": [
         { "productId": "prod_123", "quantity": 10 }
       ],
       "totalAmount": 5000
     }
  5. Click "Execute"
  6. Order created with status "pending"


SCENARIO 3: Check Admin Logs (Admin only)
──────────────────────────────────────────

  1. Login as admin user (if available)
  2. Go to "Monitoring" section
  3. Click "GET /admin/monitoring/logs"
  4. Adjust "limit" and "offset" parameters
  5. Click "Execute"
  6. View all request logs with timestamps, IPs, paths


SCENARIO 4: Analyze Performance (Admin only)
─────────────────────────────────────────────

  1. Go to "Monitoring" section
  2. Click "GET /admin/monitoring/performance"
  3. See metrics:
     - Total requests processed
     - Average response time
     - Slow requests (>1s)


═══════════════════════════════════════════════════════════════════════════════
6. INTEGRATION DETAILS
═══════════════════════════════════════════════════════════════════════════════

FILE STRUCTURE:
  /src/
    ├── app.js (✅ updated with Swagger integration)
    ├── config/
    │   └── swagger.js (new - main configuration)
    ├── swagger/
    │   └── endpoints.js (new - endpoint documentation)
    ├── routes/
    │   ├── auth.route.js
    │   ├── product.route.js
    │   ├── order.route.js
    │   ├── inventory.route.js
    │   ├── dashboard.route.js
    │   └── user.route.js
    └── middlewares/ (Phase 7 security stack)


SWAGGER CONFIGURATION (/src/config/swagger.js):
──────────────────────────────────────────────

  • Uses swagger-jsdoc to parse JSDoc comments
  • Defines OpenAPI 3.0 specification
  • Includes security schemes (Bearer JWT)
  • Defines common response schemas
  • Configures servers (dev, staging, prod)


ENDPOINT DOCUMENTATION (/src/swagger/endpoints.js):
───────────────────────────────────────────────────

  • 50+ endpoints documented with JSDoc comments
  • Each endpoint includes:
    - Summary and description
    - Required/optional parameters
    - Request body schema
    - Response schema
    - Error responses
    - Security requirements


APP.JS INTEGRATION:
──────────────────

  Added imports:
  import swaggerUi from "swagger-ui-express";
  import swaggerSpecs from "./config/swagger.js";

  Added middleware:
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpecs, {...}));

  Added JSON endpoint:
  app.get("/swagger.json", (req, res) => {...});


═══════════════════════════════════════════════════════════════════════════════
7. TROUBLESHOOTING
═══════════════════════════════════════════════════════════════════════════════

ISSUE: "Swagger UI not loading at /api-docs"
──────────────────────────────────────────

  Solution:
  1. Verify swagger packages installed: npm list swagger-jsdoc swagger-ui-express
  2. Check if app.js was properly updated (see step 2)
  3. Restart server: npm start
  4. Check console for errors

  If still not working:
  - Check that middleware is before error handler
  - Verify config/swagger.js and swagger/endpoints.js exist
  - Restart Node.js process


ISSUE: "Endpoints not showing in Swagger UI"
──────────────────────────────────────────

  Solution:
  1. Verify endpoint documentation is in /src/swagger/endpoints.js
  2. Check JSDoc comment format (starts with /** @swagger)
  3. Verify paths in swagger.js config:
     apis: [
       './src/routes/*.js',      ← Make sure these match your structure
       './src/swagger/*.js'      ← endpoints.js should be here
     ]
  4. Restart server to reload specs


ISSUE: "Authentication not working in Swagger UI"
──────────────────────────────────────────────────

  Solution:
  1. Login first at /auth/login endpoint
  2. Copy the full accessToken value (not including quotes)
  3. Click "Authorize" button
  4. Select "Bearer Token" scheme
  5. Paste token value (WITHOUT "Bearer " prefix)
  6. Click "Authorize"


ISSUE: "Getting 429 Rate Limit Exceeded"
──────────────────────────────────────────

  Solution:
  1. Wait for retry period (see Retry-After header)
  2. Phase 7 rate limiter uses exponential backoff:
     - First violation: 60 seconds
     - Second: 300 seconds (5 min)
     - Third: 900 seconds (15 min)
     - Fourth: 3600 seconds (1 hour)
  3. Admin users can bypass rate limits


ISSUE: "Getting 403 Forbidden for admin endpoints"
────────────────────────────────────────────────

  Solution:
  1. Ensure you're logged in as an admin user
  2. Verify token is for admin account
  3. Some endpoints require role: "admin"
  4. Check endpoint documentation for security requirements


═══════════════════════════════════════════════════════════════════════════════
📚 ADDITIONAL RESOURCES
═══════════════════════════════════════════════════════════════════════════════

OpenAPI 3.0 Spec:          https://spec.openapis.org/oas/v3.0.3
Swagger-JSDoc Docs:        https://github.com/Surnet/swagger-jsdoc
Swagger UI Docs:           https://github.com/swagger-api/swagger-ui
JWT Authentication:        https://tools.ietf.org/html/rfc7519

Radhe Salt Backend Phases:
  Phase 1-5: Core API (auth, products, orders, inventory)
  Phase 6: Admin Dashboard (analytics, reporting)
  Phase 7: Security & Optimization (rate limiting, validation, caching, logging)


═══════════════════════════════════════════════════════════════════════════════

✅ NEXT STEPS:

1. Start the server:        npm start
2. Open Swagger UI:         http://localhost:8000/api-docs
3. Test endpoints:          Use "Try it out" in each endpoint
4. Explore monitoring:      Check /admin/monitoring endpoints (Phase 7)
5. Review security:         See rate limits, input validation in action

═══════════════════════════════════════════════════════════════════════════════
