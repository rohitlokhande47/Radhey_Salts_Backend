# 🚀 RADHEY SALTS BACKEND - API TESTING GUIDE

## ✅ Server Status
- **Server:** Running on `http://localhost:8000`
- **Database:** MongoDB Connected to `radheSaltDB`
- **API Documentation:** http://localhost:8000/api-docs (Swagger UI)

---

## 🔐 AUTHENTICATION ENDPOINTS

### 1. **Health Check** (No Auth Required)
```
GET http://localhost:8000/api/v1/health
```
**Response:**
```json
{
  "status": "✅ Server is running"
}
```

---

### 2. **Admin Login**
```
POST http://localhost:8000/api/v1/auth/admin/login
Content-Type: application/json

{
  "email": "admin@radhey.com",
  "password": "Admin@123"
}
```

**Response:**
```json
{
  "statusCode": 200,
  "data": {
    "admin": {
      "_id": "...",
      "name": "Rajesh Kumar",
      "email": "admin@radhey.com",
      "role": "super_admin",
      "isActive": true
    },
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  },
  "message": "Admin login successful",
  "success": true
}
```

---

### 3. **Dealer Login**
```
POST http://localhost:8000/api/v1/auth/dealer/login
Content-Type: application/json

{
  "email": "amit.patel@dealer.com",
  "password": "Dealer@123"
}
```

**Response:**
```json
{
  "statusCode": 200,
  "data": {
    "dealer": {
      "_id": "...",
      "name": "Amit Patel",
      "email": "amit.patel@dealer.com",
      "businessName": "Patel Salt Trading",
      "role": "dealer",
      "status": "active"
    },
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  },
  "message": "Dealer login successful",
  "success": true
}
```

---

### 4. **Get Current User** (Requires Auth)
```
GET http://localhost:8000/api/v1/auth/me
Authorization: Bearer {accessToken}
```

---

### 5. **Change Password** (Requires Auth)
```
POST http://localhost:8000/api/v1/auth/change-password
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "oldPassword": "Admin@123",
  "newPassword": "NewPassword@123",
  "confirmPassword": "NewPassword@123"
}
```

---

### 6. **Logout** (Requires Auth)
```
POST http://localhost:8000/api/v1/auth/logout
Authorization: Bearer {accessToken}
```

---

### 7. **Refresh Access Token**
```
POST http://localhost:8000/api/v1/auth/refresh
Content-Type: application/json

{
  "refreshToken": "{refreshToken}"
}
```

---

## 📦 PRODUCTS ENDPOINTS

### 1. **Get All Products** (Public - No Auth)
```
GET http://localhost:8000/api/v1/products
```

**Query Parameters:**
```
- page=1
- limit=10
- category=Food%20Salt
- search=Rock
- isActive=true
- sortBy=price
- sortOrder=desc
```

**Response:**
```json
{
  "statusCode": 200,
  "data": {
    "products": [
      {
        "_id": "...",
        "name": "Rock Salt - Industrial Grade",
        "productCode": "ROCK-001",
        "category": "Industrial Salt",
        "price": 250,
        "MOQ": 50,
        "stockQty": 5000,
        "reorderLevel": 500,
        "unit": "kg",
        "pricingTiers": [...]
      }
    ],
    "totalProducts": 5,
    "totalPages": 1,
    "currentPage": 1
  },
  "message": "Products fetched successfully",
  "success": true
}
```

---

### 2. **Get Single Product** (Public)
```
GET http://localhost:8000/api/v1/products/{productId}
```

---

### 3. **Get Dynamic Pricing for Product** (Public)
```
GET http://localhost:8000/api/v1/products/{productId}/pricing?qty=100
```

**Response:**
```json
{
  "statusCode": 200,
  "data": {
    "productId": "...",
    "productName": "Rock Salt - Industrial Grade",
    "quantityRequested": 100,
    "unitPrice": 240,
    "totalPrice": 24000,
    "applicable_tier": {
      "minQty": 100,
      "maxQty": 500,
      "price": 240
    }
  },
  "message": "Pricing calculated successfully",
  "success": true
}
```

---

### 4. **Create Product** (Admin Only)
```
POST http://localhost:8000/api/v1/products
Authorization: Bearer {adminToken}
Content-Type: multipart/form-data

Fields:
- name: "New Salt Product"
- description: "Premium quality salt"
- productCode: "NEW-001"
- category: "Industrial Salt"
- price: 300
- MOQ: 25
- unit: "kg"
- supplier: "Local Supplier"
- hsn: "2501"
- image: (file)

Optional:
- pricingTiers: [{"minQty": 100, "maxQty": 500, "price": 290}]
```

---

### 5. **Update Product** (Admin Only)
```
PUT http://localhost:8000/api/v1/products/{productId}
Authorization: Bearer {adminToken}
Content-Type: multipart/form-data

{
  "name": "Updated Product Name",
  "price": 320,
  "stockQty": 5500
}
```

---

### 6. **Delete Product** (Admin Only - Soft Delete)
```
DELETE http://localhost:8000/api/v1/products/{productId}
Authorization: Bearer {adminToken}
```

---

### 7. **Restock Product** (Admin Only)
```
POST http://localhost:8000/api/v1/products/{productId}/restock
Authorization: Bearer {adminToken}
Content-Type: application/json

{
  "quantity": 500,
  "notes": "Monthly restock"
}
```

---

### 8. **Get Low Stock Products** (Admin Only)
```
GET http://localhost:8000/api/v1/products/admin/low-stock
Authorization: Bearer {adminToken}
```

**Response:**
```json
{
  "statusCode": 200,
  "data": {
    "lowStockProducts": [
      {
        "_id": "...",
        "name": "Bath Salt - Himalayan",
        "productCode": "BATH-001",
        "currentStock": 1500,
        "reorderLevel": 150,
        "status": "Above Reorder Level"
      }
    ]
  },
  "success": true
}
```

---

### 9. **Get Product Statistics** (Admin Only)
```
GET http://localhost:8000/api/v1/products/admin/statistics
Authorization: Bearer {adminToken}
```

---

## 🛒 ORDERS ENDPOINTS

### 1. **Place Order** (Dealer Only)
```
POST http://localhost:8000/api/v1/orders
Authorization: Bearer {dealerToken}
Content-Type: application/json

{
  "items": [
    {
      "productId": "{productId}",
      "qty": 100
    },
    {
      "productId": "{productId}",
      "qty": 50
    }
  ],
  "deliveryAddress": "123 Business Street, City",
  "paymentMethod": "credit"
}
```

**Response:**
```json
{
  "statusCode": 201,
  "data": {
    "order": {
      "_id": "...",
      "orderRef": "ORD-260400001",
      "dealerId": "...",
      "items": [...],
      "totalAmount": 35000,
      "orderStatus": "pending",
      "paymentStatus": "pending",
      "deliveryStage": "awaiting_confirmation",
      "orderedAt": "2026-04-25T10:30:00Z"
    }
  },
  "message": "Order placed successfully",
  "success": true
}
```

---

### 2. **Get Dealer's Orders** (Dealer Only)
```
GET http://localhost:8000/api/v1/orders/my-orders
Authorization: Bearer {dealerToken}
```

**Query Parameters:**
```
- page=1
- limit=10
- status=pending
```

---

### 3. **Get Specific Order** (Requires Auth)
```
GET http://localhost:8000/api/v1/orders/{orderId}
Authorization: Bearer {token}
```

---

### 4. **Get Order Timeline** (Requires Auth)
```
GET http://localhost:8000/api/v1/orders/{orderId}/timeline
Authorization: Bearer {token}
```

**Response:**
```json
{
  "statusCode": 200,
  "data": {
    "orderRef": "ORD-260400001",
    "timeline": [
      {
        "stage": "Order Placed",
        "timestamp": "2026-04-25T10:30:00Z",
        "status": "completed"
      },
      {
        "stage": "Order Confirmed",
        "timestamp": null,
        "status": "pending"
      },
      {
        "stage": "Dispatched",
        "timestamp": null,
        "status": "pending"
      }
    ]
  },
  "success": true
}
```

---

### 5. **Cancel Order** (Dealer - Own Orders Only)
```
POST http://localhost:8000/api/v1/orders/{orderId}/cancel
Authorization: Bearer {dealerToken}
Content-Type: application/json

{
  "reason": "Changed my mind",
  "notes": "Cancel this order"
}
```

---

### 6. **Get All Orders** (Admin Only)
```
GET http://localhost:8000/api/v1/orders/admin/all-orders
Authorization: Bearer {adminToken}
```

**Query Parameters:**
```
- page=1
- limit=10
- status=pending
- paymentStatus=completed
```

---

### 7. **Get Order Statistics** (Admin Only)
```
GET http://localhost:8000/api/v1/orders/admin/statistics
Authorization: Bearer {adminToken}
```

**Response:**
```json
{
  "statusCode": 200,
  "data": {
    "totalOrders": 8,
    "totalOrderValue": 858000,
    "averageOrderValue": 107250,
    "ordersByStatus": {
      "pending": 0,
      "confirmed": 6,
      "dispatched": 0,
      "delivered": 2,
      "cancelled": 0
    },
    "ordersByPaymentStatus": {
      "pending": 0,
      "partial": 0,
      "completed": 8
    }
  },
  "success": true
}
```

---

### 8. **Update Order Status** (Admin Only)
```
PUT http://localhost:8000/api/v1/orders/{orderId}/status
Authorization: Bearer {adminToken}
Content-Type: application/json

{
  "orderStatus": "dispatched",
  "deliveryStage": "in_transit"
}
```

---

### 9. **Update Payment Status** (Admin Only)
```
PUT http://localhost:8000/api/v1/orders/{orderId}/payment
Authorization: Bearer {adminToken}
Content-Type: application/json

{
  "paymentStatus": "completed",
  "amountPaid": 35000
}
```

---

## 📊 INVENTORY ENDPOINTS

### 1. **Get Inventory Snapshot** (Admin Only)
```
GET http://localhost:8000/api/v1/inventory/snapshot
Authorization: Bearer {adminToken}
```

**Response:**
```json
{
  "statusCode": 200,
  "data": {
    "snapshot": [
      {
        "productId": "...",
        "productName": "Rock Salt - Industrial Grade",
        "currentStock": 5000,
        "reorderLevel": 500,
        "status": "Healthy"
      }
    ],
    "totalProducts": 5,
    "snapshotDate": "2026-04-25T10:35:00Z"
  },
  "success": true
}
```

---

### 2. **Reconstruct Stock from Ledger** (Admin Only)
```
GET http://localhost:8000/api/v1/inventory/{productId}/reconstruct
Authorization: Bearer {adminToken}
```

---

### 3. **Detect Stock Discrepancies** (Admin Only)
```
GET http://localhost:8000/api/v1/inventory/scan/discrepancies
Authorization: Bearer {adminToken}
```

---

### 4. **Set Reorder Level** (Admin Only)
```
PUT http://localhost:8000/api/v1/inventory/{productId}/reorder-level
Authorization: Bearer {adminToken}
Content-Type: application/json

{
  "reorderLevel": 600
}
```

---

### 5. **Adjust Stock Manually** (Admin Only)
```
POST http://localhost:8000/api/v1/inventory/{productId}/adjust
Authorization: Bearer {adminToken}
Content-Type: application/json

{
  "quantity": 200,
  "type": "credit",
  "reason": "Found damaged stock",
  "notes": "Damage assessment adjustment"
}
```

---

### 6. **Get Inventory History** (Admin Only)
```
GET http://localhost:8000/api/v1/inventory/history
Authorization: Bearer {adminToken}
```

**Query Parameters:**
```
- productId={productId}
- page=1
- limit=20
- startDate=2026-04-01
- endDate=2026-04-25
```

---

### 7. **Get Low Stock Alerts** (Admin Only)
```
GET http://localhost:8000/api/v1/inventory/low-stock-alerts
Authorization: Bearer {adminToken}
```

---

### 8. **Get Inventory Report** (Admin Only)
```
GET http://localhost:8000/api/v1/inventory/report
Authorization: Bearer {adminToken}
```

---

### 9. **Get Audit Trail** (Admin Only)
```
GET http://localhost:8000/api/v1/inventory/audit-trail
Authorization: Bearer {adminToken}
```

---

### 10. **Perform Inventory Audit** (Admin Only)
```
POST http://localhost:8000/api/v1/inventory/audit
Authorization: Bearer {adminToken}
Content-Type: application/json

{
  "auditType": "full",
  "notes": "Quarterly inventory audit"
}
```

---

## 📈 DASHBOARD & ANALYTICS ENDPOINTS

All dashboard endpoints require **Admin role** and **JWT authentication**.

### 1. **Dashboard Overview**
```
GET http://localhost:8000/api/v1/dashboard/overview
Authorization: Bearer {adminToken}
```

**Response:**
```json
{
  "statusCode": 200,
  "data": {
    "summary": {
      "totalOrders": 8,
      "totalRevenue": 858000,
      "totalDealers": 4,
      "totalProducts": 5,
      "lowStockItems": 0
    },
    "recentOrders": [...],
    "topProducts": [...]
  },
  "success": true
}
```

---

### 2. **Sales Analytics**
```
GET http://localhost:8000/api/v1/dashboard/sales/analytics
Authorization: Bearer {adminToken}
```

---

### 3. **Inventory Analytics**
```
GET http://localhost:8000/api/v1/dashboard/inventory/analytics
Authorization: Bearer {adminToken}
```

---

### 4. **Order Analytics**
```
GET http://localhost:8000/api/v1/dashboard/orders/analytics
Authorization: Bearer {adminToken}
```

---

### 5. **Dealer Performance**
```
GET http://localhost:8000/api/v1/dashboard/dealers/performance
Authorization: Bearer {adminToken}
```

---

### 6. **System Health**
```
GET http://localhost:8000/api/v1/dashboard/system/health
Authorization: Bearer {adminToken}
```

---

### 7. **Purchasing Recommendations**
```
GET http://localhost:8000/api/v1/dashboard/recommendations
Authorization: Bearer {adminToken}
```

---

### 8. **Trend Forecast**
```
GET http://localhost:8000/api/v1/dashboard/forecast
Authorization: Bearer {adminToken}
```

---

### 9. **Executive Report**
```
GET http://localhost:8000/api/v1/dashboard/executive-report
Authorization: Bearer {adminToken}
```

---

### 10. **Custom Report**
```
GET http://localhost:8000/api/v1/dashboard/custom-report
Authorization: Bearer {adminToken}
```

**Query Parameters:**
```
- startDate=2026-04-01
- endDate=2026-04-25
- reportType=sales
- includeCharts=true
```

---

## 🔍 MONITORING ENDPOINTS (Admin Only)

### 1. **Rate Limiter Statistics**
```
GET http://localhost:8000/api/v1/admin/monitoring/rate-limits
Authorization: Bearer {adminToken}
```

---

### 2. **Request Logs**
```
GET http://localhost:8000/api/v1/admin/monitoring/logs
Authorization: Bearer {adminToken}
```

**Query Parameters:**
```
- count=100
```

---

### 3. **Security Events**
```
GET http://localhost:8000/api/v1/admin/monitoring/security-events
Authorization: Bearer {adminToken}
```

**Query Parameters:**
```
- count=50
```

---

## 🗄️ SEEDED TEST DATA

### Admin Accounts:
1. **Super Admin**
   - Email: `admin@radhey.com`
   - Password: `Admin@123`

2. **Admin Manager**
   - Email: `manager@radhey.com`
   - Password: `Manager@123`

### Dealer Accounts:
1. Amit Patel - `amit.patel@dealer.com` / `Dealer@123`
2. Sharma Brothers - `sharma@dealer.com` / `Dealer@123`
3. Rajesh Gupta - `rajesh.gupta@dealer.com` / `Dealer@123`
4. Priya Verma - `priya.verma@dealer.com` / `Dealer@123`

### Products:
- Rock Salt - Industrial Grade (ROCK-001)
- Sea Salt - Food Grade (SEA-001)
- Table Salt - Iodized (TABLE-001)
- Epsom Salt - Agricultural Grade (EPSOM-001)
- Bath Salt - Himalayan (BATH-001)

### Orders:
- 8 orders created with varying statuses and amounts
- Sample order references: ORD-260400001 to ORD-260400008

---

## 🧪 TESTING WITH POSTMAN

1. **Import the API Collection:**
   - Open Postman
   - Click "Import"
   - Use `http://localhost:8000/swagger.json`

2. **Set Environment Variables:**
   - Create a Postman environment
   - Add variable: `baseUrl` = `http://localhost:8000`
   - Add variable: `adminToken` = (get from admin login response)
   - Add variable: `dealerToken` = (get from dealer login response)

3. **Test Each Endpoint:**
   - Start with Health Check
   - Login with admin/dealer credentials
   - Save tokens to environment
   - Test protected endpoints with tokens

---

## ✨ QUICK START TIPS

1. **Get Admin Token:**
   ```
   POST /api/v1/auth/admin/login
   Email: admin@radhey.com
   Password: Admin@123
   ```
   Save the `accessToken` from response

2. **Get Dealer Token:**
   ```
   POST /api/v1/auth/dealer/login
   Email: amit.patel@dealer.com
   Password: Dealer@123
   ```

3. **Use Token in Future Requests:**
   ```
   Authorization: Bearer {accessToken}
   ```

4. **View API Docs:**
   - Open browser: `http://localhost:8000/api-docs`
   - Interactive Swagger UI with all endpoints

5. **Check Database:**
   - MongoDB Atlas: https://cloud.mongodb.com
   - Database: `radheSaltDB`
   - Collections: Admin, Dealer, Product, Order, InventoryLedger, AuditLog

---

## 🛑 STOPPING THE SERVER

In the terminal where the server is running:
```
Ctrl + C
```

## 🔄 SEEDING AGAIN

To reset the database with fresh dummy data:
```
node seed.js
```

Then restart the server:
```
npm start
```

---

**Happy Testing! 🎉**
