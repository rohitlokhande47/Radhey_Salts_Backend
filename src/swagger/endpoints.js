/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║                    RADHE SALT - COMPLETE API ENDPOINTS                        ║
 * ║                          OpenAPI 3.0 Specification                            ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 *
 * @swagger
 * tags:
 *   - name: Authentication
 *     description: User authentication endpoints
 *   - name: Users
 *     description: User management endpoints
 *   - name: Products
 *     description: Product catalog endpoints
 *   - name: Orders
 *     description: Order management endpoints
 *   - name: Inventory
 *     description: Inventory tracking endpoints
 *   - name: Dealers
 *     description: Dealer management endpoints
 *   - name: Dashboard
 *     description: Admin analytics and reporting
 *   - name: Monitoring
 *     description: Admin monitoring and logs (Phase 7)
 */

// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 1: AUTHENTICATION ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - name
 *               - phone
 *               - companyName
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "dealer@example.com"
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "SecurePassword123!"
 *               name:
 *                 type: string
 *                 example: "John Dealer"
 *               phone:
 *                 type: string
 *                 example: "+91 9876543210"
 *               companyName:
 *                 type: string
 *                 example: "Radhe Salt Traders"
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 statusCode:
 *                   type: integer
 *                   example: 201
 *                 data:
 *                   type: object
 *                   properties:
 *                     userId:
 *                       type: string
 *                     email:
 *                       type: string
 *                     name:
 *                       type: string
 *                     role:
 *                       type: string
 *                       example: "dealer"
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "dealer@example.com"
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "SecurePassword123!"
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 statusCode:
 *                   type: integer
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     accessToken:
 *                       type: string
 *                     refreshToken:
 *                       type: string
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Authentication]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token refreshed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */

// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 2: PRODUCTS ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * @swagger
 * /products:
 *   get:
 *     summary: Get all products
 *     tags: [Products]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *           default: 1
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           default: 20
 *       - name: category
 *         in: query
 *         schema:
 *           type: string
 *       - name: search
 *         in: query
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Products retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */

/**
 * @swagger
 * /products:
 *   post:
 *     summary: Create a new product (Admin only)
 *     tags: [Products]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - price
 *               - category
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               category:
 *                 type: string
 *               quantity:
 *                 type: integer
 *               sku:
 *                 type: string
 *     responses:
 *       201:
 *         description: Product created
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */

/**
 * @swagger
 * /products/{id}:
 *   get:
 *     summary: Get product by ID
 *     tags: [Products]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */

/**
 * @swagger
 * /products/{id}:
 *   put:
 *     summary: Update product (Admin only)
 *     tags: [Products]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               price:
 *                 type: number
 *               quantity:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Product updated
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */

/**
 * @swagger
 * /products/{id}:
 *   delete:
 *     summary: Delete product (Admin only)
 *     tags: [Products]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product deleted
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */

// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 3: ORDERS ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * @swagger
 * /orders:
 *   get:
 *     summary: Get all orders
 *     tags: [Orders]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: status
 *         in: query
 *         schema:
 *           type: string
 *           enum: [pending, confirmed, shipped, delivered, cancelled]
 *       - name: startDate
 *         in: query
 *         schema:
 *           type: string
 *           format: date
 *       - name: endDate
 *         in: query
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Orders retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Order'
 */

/**
 * @swagger
 * /orders:
 *   post:
 *     summary: Create a new order
 *     tags: [Orders]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - items
 *               - totalAmount
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     productId:
 *                       type: string
 *                     quantity:
 *                       type: integer
 *               totalAmount:
 *                 type: number
 *               discountPercent:
 *                 type: number
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Order created
 */

/**
 * @swagger
 * /orders/{id}:
 *   get:
 *     summary: Get order details
 *     tags: [Orders]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 */

/**
 * @swagger
 * /orders/{id}:
 *   put:
 *     summary: Update order status
 *     tags: [Orders]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, confirmed, shipped, delivered, cancelled]
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Order updated
 */

// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 5: INVENTORY ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * @swagger
 * /inventory:
 *   get:
 *     summary: Get inventory levels
 *     tags: [Inventory]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: warehouseId
 *         in: query
 *         schema:
 *           type: string
 *       - name: lowStock
 *         in: query
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Inventory data
 */

/**
 * @swagger
 * /inventory:
 *   post:
 *     summary: Adjust inventory
 *     tags: [Inventory]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productId:
 *                 type: string
 *               quantity:
 *                 type: integer
 *               type:
 *                 type: string
 *                 enum: [stock_in, stock_out, adjustment]
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Inventory adjusted
 */

/**
 * @swagger
 * /inventory/ledger:
 *   get:
 *     summary: Get inventory ledger (audit trail)
 *     tags: [Inventory]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: productId
 *         in: query
 *         schema:
 *           type: string
 *       - name: days
 *         in: query
 *         schema:
 *           type: integer
 *           default: 30
 *     responses:
 *       200:
 *         description: Inventory ledger
 */

/**
 * @swagger
 * /inventory/snapshots:
 *   get:
 *     summary: Get daily inventory snapshots
 *     tags: [Inventory]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: date
 *         in: query
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Daily snapshots
 */

// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 6: DASHBOARD/ANALYTICS ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * @swagger
 * /dashboard/overview:
 *   get:
 *     summary: Get dashboard overview (Admin only)
 *     tags: [Dashboard]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard metrics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalSales:
 *                   type: number
 *                 activeOrders:
 *                   type: integer
 *                 totalDealers:
 *                   type: integer
 *                 inventoryValue:
 *                   type: number
 */

/**
 * @swagger
 * /dashboard/analytics:
 *   get:
 *     summary: Get sales analytics
 *     tags: [Dashboard]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: startDate
 *         in: query
 *         schema:
 *           type: string
 *           format: date
 *       - name: endDate
 *         in: query
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Sales analytics
 */

/**
 * @swagger
 * /dashboard/inventory-analytics:
 *   get:
 *     summary: Get inventory analytics
 *     tags: [Dashboard]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Inventory insights
 */

/**
 * @swagger
 * /dashboard/dealer-performance:
 *   get:
 *     summary: Get dealer performance metrics
 *     tags: [Dashboard]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Top dealers
 */

/**
 * @swagger
 * /dashboard/trends:
 *   get:
 *     summary: Get trend forecasting
 *     tags: [Dashboard]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: days
 *         in: query
 *         schema:
 *           type: integer
 *           default: 30
 *     responses:
 *       200:
 *         description: 30-day trend forecast
 */

/**
 * @swagger
 * /dashboard/custom-report:
 *   post:
 *     summary: Generate custom report
 *     tags: [Dashboard]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reportType:
 *                 type: string
 *               filters:
 *                 type: object
 *               format:
 *                 type: string
 *                 enum: [json, csv, pdf]
 *     responses:
 *       201:
 *         description: Report generated
 */

// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 7: MONITORING ENDPOINTS (Security & Optimization)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * @swagger
 * /admin/monitoring/logs:
 *   get:
 *     summary: Get request logs (Admin only)
 *     tags: [Monitoring]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           default: 100
 *       - name: offset
 *         in: query
 *         schema:
 *           type: integer
 *           default: 0
 *       - name: filter
 *         in: query
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Request logs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 logs:
 *                   type: array
 *                 total:
 *                   type: integer
 */

/**
 * @swagger
 * /admin/monitoring/security-events:
 *   get:
 *     summary: Get security events (Admin only)
 *     tags: [Monitoring]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Security events
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 events:
 *                   type: array
 *                 criticalCount:
 *                   type: integer
 *                 highCount:
 *                   type: integer
 */

/**
 * @swagger
 * /admin/monitoring/performance:
 *   get:
 *     summary: Get performance metrics (Admin only)
 *     tags: [Monitoring]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Performance data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalRequests:
 *                   type: integer
 *                 averageResponseTime:
 *                   type: number
 *                 slowRequests:
 *                   type: array
 */

/**
 * @swagger
 * /admin/monitoring/cache-stats:
 *   get:
 *     summary: Get cache statistics (Admin only)
 *     tags: [Monitoring]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Cache statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 hitRate:
 *                   type: string
 *                 compressionRate:
 *                   type: string
 *                 bandwidthSaved:
 *                   type: string
 */
