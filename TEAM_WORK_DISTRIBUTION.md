# 📋 RADHEY SALTS B.TECH PROJECT - TEAM WORK DISTRIBUTION

**Project Name:** Radhey Salts Backend & Frontend System  
**Date:** April 28, 2026  
**Team Members:** Rohit Lokhande, Narendra, Tanuj  
**Total Project Duration:** 6-8 Weeks  
**Evaluation Criteria:** Equal effort, complexity, and contribution

---

## 📊 WORK DISTRIBUTION OVERVIEW

| **Team Member** | **Primary Modules** | **Lines of Code** | **Documentation** | **Effort Level** |
|---|---|---|---|---|
| **ROHIT** | Authentication, Products, Dealer Mobile App | ~1,500-2,000 | 4 sections | MEDIUM-HIGH |
| **NARENDRA** | Orders, Inventory, API Caching, Testing | ~1,500-2,000 | 4 sections | MEDIUM-HIGH |
| **TANUJ** | Dashboard, Analytics, Admin Panel, Infrastructure | ~1,500-2,000 | 4 sections | MEDIUM-HIGH |

---

## 📑 DETAILED WORK BREAKDOWN

---

# 👤 ROHIT LOKHANDE

## **Theme: User Authentication & Product Management**

### ✅ Assigned Modules

#### **1. Authentication System (Backend)**
- **JWT Token Generation & Verification**
  - Access token creation (15-minute expiry)
  - Refresh token generation (7-day expiry)
  - JTI (JWT ID) implementation for token tracking
  - Token signature verification
  - Token blacklist integration

- **Admin Login Module**
  - Email + Password authentication
  - bcrypt password hashing (10 salt rounds)
  - Admin role assignment (super_admin / admin)
  - Last login tracking
  - Admin session management

- **Dealer Login Module**
  - Email or Phone + Password authentication
  - Business details validation
  - Account status management (active/inactive/suspended)
  - Self-registration endpoint
  - Email verification ready

- **Session Management**
  - Token refresh mechanism
  - Logout with token blacklisting
  - Password change functionality
  - Current user retrieval endpoint

- **Auth Middleware**
  - JWT verification middleware
  - Token expiration checking
  - Blacklist lookup
  - Error handling for expired/invalid tokens

**Files to Create/Modify:**
- `src/models/admin.model.js` - Admin schema with JWT methods
- `src/models/dealer.model.js` - Dealer schema with JWT methods
- `src/models/tokenBlacklist.model.js` - Token blacklist schema
- `src/controllers/auth.controller.js` - All auth logic
- `src/routes/auth.route.js` - Auth endpoints
- `src/middlewares/jwt.middleware.js` - JWT verification
- `src/middlewares/auth.middleware.js` - Auth utilities

---

#### **2. Product Management System (Backend)**
- **Product Model & Schema**
  - Product fields: name, description, code, price, MOQ
  - Pricing tiers for bulk discounts
  - Stock tracking with reorder levels
  - Product categorization
  - Image URL support (Cloudinary ready)
  - Soft delete mechanism

- **Product CRUD Operations**
  - Get all products (pagination, filtering, search)
  - Get single product by ID
  - Create new product (admin only)
  - Update product details (admin only)
  - Delete/Soft delete product (admin only)
  - Restore deleted products

- **Product Analytics**
  - Low stock product detection
  - Product statistics (total, active, low stock)
  - Stock status monitoring
  - Product restocking functionality
  - Reorder level management

- **Dynamic Pricing Calculation**
  - Pricing tier selection based on quantity
  - Real-time price calculation
  - Volume discount application
  - Pricing examples generation

**Files to Create/Modify:**
- `src/models/product.model.js` - Product schema
- `src/controllers/product.controller.js` - Product logic
- `src/routes/product.route.js` - Product endpoints
- `src/utils/pricingCalculator.js` - Pricing tier logic (new)

**API Endpoints:**
```
GET    /api/v1/products                    (public)
GET    /api/v1/products/:id                (public)
GET    /api/v1/products/:id/pricing        (public)
POST   /api/v1/products                    (admin)
PUT    /api/v1/products/:id                (admin)
DELETE /api/v1/products/:id                (admin)
POST   /api/v1/products/:id/restock        (admin)
GET    /api/v1/products/admin/low-stock    (admin)
GET    /api/v1/products/admin/statistics   (admin)
```

---

#### **3. Dealer Mobile Application (Frontend - Flutter)**

- **Authentication UI**
  - Dealer login screen (email/phone + password)
  - Dealer registration screen (business details)
  - Admin login screen
  - Loading states during auth
  - Error handling & validation messages
  - Session restoration on app restart

- **Product Catalog UI**
  - Product list with pagination
  - Product detail view
  - Pricing tier display
  - Stock status indicators
  - Search functionality
  - Filter by category
  - Sort options (price, rating, etc.)

- **Product Browsing Features**
  - Product image display (with lazy loading)
  - Product description & specifications
  - MOQ (Minimum Order Quantity) display
  - Available stock indicator
  - Pricing calculator (show price for quantity)
  - Add to cart button

- **State Management (Riverpod)**
  - Auth provider (login, logout, session)
  - Product list provider
  - Product cache invalidation
  - Loading states
  - Error states

- **Performance Optimization**
  - Cached product data (15-min TTL)
  - Lazy loading images
  - Pagination implementation
  - Efficient list rendering (LazyColumn)
  - Memory optimization

**Files to Create:**
- `lib/providers/auth_provider.dart` - Auth state
- `lib/providers/product_provider.dart` - Product state
- `lib/screens/auth/login_screen.dart` - Login UI
- `lib/screens/auth/register_screen.dart` - Register UI
- `lib/screens/products/product_list_screen.dart` - Product listing
- `lib/screens/products/product_detail_screen.dart` - Product detail
- `lib/widgets/product_card.dart` - Product card widget
- `lib/services/api_service.dart` - API calls
- `lib/models/product.dart` - Product model
- `lib/models/auth.dart` - Auth model

---

### ✅ Research & Documentation Tasks

#### **Report Sections to Write:**
1. **Section 2: Project Overview** (300-400 words)
   - Project purpose & scope
   - Success metrics
   - Key objectives

2. **Section 3: Technology Stack** (400-500 words)
   - Node.js & Express.js explanation
   - JWT & bcrypt security
   - Flutter framework introduction
   - Database choice justification

3. **Section 8: Security Implementation** (600-800 words)
   - JWT authentication detailed
   - Password security measures
   - Token management strategy
   - Auth flow diagrams
   - Security headers explanation

4. **Section 16.3: Mobile App Deployment** (300-400 words)
   - App store submission process
   - Platform-specific configuration
   - Certificate management
   - Testing on devices

#### **Diagrams & Visuals to Create:**
1. Authentication flow diagram (login → token → session)
2. Product browsing workflow
3. JWT token lifecycle
4. Database relationships for Auth & Products
5. Mobile app UI mockups (3-4 screens)

---

### ✅ Testing & Validation Tasks

**Unit Tests:**
- Admin login validation
- Dealer login with phone/email
- Product filtering & search
- Pricing tier calculation
- Password hashing verification

**Integration Tests:**
- Complete auth flow (register → login → logout)
- Product CRUD operations
- Product catalog loading
- Token refresh mechanism

**Mobile App Testing:**
- Login form validation
- Product list loading
- Pagination functionality
- Offline capabilities

---

### ✅ Specific Deliverables

| **Deliverable** | **Status** | **Effort** |
|---|---|---|
| Auth system (6 endpoints) | Code + Tests | HIGH |
| Product management (9 endpoints) | Code + Tests | HIGH |
| Dealer mobile app (5 screens) | Code + UI | HIGH |
| Security documentation | Report section | MEDIUM |
| API documentation | Swagger comments | MEDIUM |
| Database design | ER diagram | MEDIUM |
| Total Effort Estimate | **100 hours** | **BALANCED** |

---

### 📅 Timeline & Milestones

**Week 1-2: Planning & Setup**
- Database schema design
- API endpoint planning
- Mobile UI design mockups

**Week 2-3: Authentication Implementation**
- Admin & Dealer models
- Auth controllers
- JWT middleware
- Auth UI screens

**Week 3-5: Product Management**
- Product model & CRUD
- Pricing logic
- Product UI screens
- Caching implementation

**Week 5-6: Integration & Testing**
- End-to-end testing
- Mobile app testing
- Documentation writing

**Week 6-8: Final Polishing**
- Bug fixes
- Performance optimization
- Final documentation

---

---

# 👤 NARENDRA

## **Theme: Order Management & Inventory System**

### ✅ Assigned Modules

#### **1. Order Management System (Backend)**

- **Order Model & Schema**
  - Order fields: dealerId, items, totalAmount, status
  - Order status workflow (pending → confirmed → dispatched → delivered)
  - Payment status tracking (pending → partial → completed)
  - Delivery stage management
  - Order reference generation (auto-increment)
  - Order timestamps (ordered, confirmed, dispatched, delivered)

- **Order CRUD Operations**
  - Create order (dealers only)
  - Get all orders (admin only)
  - Get dealer's order history
  - Get single order details
  - Cancel orders (with conditions)
  - Update order status (admin only)
  - Update payment status (admin only)

- **Order Workflow Management**
  - Order validation (MOQ, stock, pricing)
  - Automatic stock deduction on order creation
  - Automatic stock reversal on cancellation
  - Order status progression
  - Payment tracking
  - Delivery address validation

- **Order Analytics**
  - Order statistics dashboard
  - Order timeline generation
  - Order by status (pending, confirmed, etc.)
  - Top products by order volume
  - Order fulfillment rate

- **Order Timeline Tracking**
  - Detailed timeline of order events
  - Timestamp recording
  - Status change history
  - Payment updates

**Files to Create/Modify:**
- `src/models/orders.model.js` - Order schema
- `src/controllers/order.controller.js` - Order logic (500+ lines)
- `src/routes/order.route.js` - Order endpoints
- `src/services/orderService.js` - Business logic (new)

**API Endpoints:**
```
POST   /api/v1/orders                      (dealer)
GET    /api/v1/orders/my-orders            (dealer)
GET    /api/v1/orders/:id                  (any auth)
POST   /api/v1/orders/:id/cancel           (dealer)
GET    /api/v1/orders/:id/timeline         (any auth)
GET    /api/v1/orders/admin/all-orders     (admin)
GET    /api/v1/orders/admin/statistics     (admin)
PUT    /api/v1/orders/:id/status           (admin)
PUT    /api/v1/orders/:id/payment          (admin)
```

---

#### **2. Inventory Management System (Backend)**

- **Inventory Ledger (Immutable)**
  - Append-only ledger design
  - Debit/Credit tracking
  - Stock movement reasons
  - Previous & new quantity tracking
  - Triggered by information (order/admin)
  - Prevention of ledger modifications

- **Real-Time Inventory Tracking**
  - Live stock snapshots
  - Stock quantity updates
  - Reorder level management
  - Stock status indicators (in stock, low stock, out of stock)
  - Stock reconstruction from ledger

- **Inventory Operations**
  - Get inventory snapshot
  - Reconstruct stock from ledger
  - Detect discrepancies (stock mismatch)
  - Set reorder levels
  - Manual stock adjustments
  - Stock reversal on order cancellation

- **Inventory Alerts & Monitoring**
  - Low stock alerts
  - Reorder recommendations
  - Stock discrepancy detection
  - Inventory audit trail
  - Historical tracking

- **Inventory Analytics**
  - Stock valuation
  - Stock turnover rate
  - Slow-moving products
  - Fast-moving products
  - Inventory report generation

- **Audit & Compliance**
  - Immutable ledger entries
  - Complete movement history
  - Audit trail maintenance
  - Before/after snapshots

**Files to Create/Modify:**
- `src/models/inventoryLedger.model.js` - Ledger schema
- `src/models/auditLog.model.js` - Audit schema
- `src/controllers/inventory.controller.js` - Inventory logic (500+ lines)
- `src/routes/inventory.route.js` - Inventory endpoints
- `src/services/inventoryService.js` - Ledger logic (new)

**API Endpoints:**
```
GET    /api/v1/inventory/snapshot                (admin)
GET    /api/v1/inventory/:productId/reconstruct  (admin)
GET    /api/v1/inventory/scan/discrepancies      (admin)
POST   /api/v1/inventory/reorder-level           (admin)
POST   /api/v1/inventory/adjust                  (admin)
GET    /api/v1/inventory/history/:productId      (admin)
GET    /api/v1/inventory/alerts/low-stock        (admin)
GET    /api/v1/inventory/report                  (admin)
GET    /api/v1/inventory/audit-trail             (admin)
POST   /api/v1/inventory/audit                   (admin)
```

---

#### **3. API Integration & Client-Side Caching (Frontend)**

- **HTTP Client Setup**
  - HTTP client initialization with Dio/http
  - Base URL configuration
  - Timeout settings
  - Request interceptors

- **Request Interceptor**
  - JWT token attachment
  - Content-type headers
  - Request ID generation
  - Timestamp tracking

- **Response Handler**
  - JSON parsing
  - Error extraction
  - Status code handling
  - Response logging

- **Error Handling**
  - 401 Unauthorized → token refresh
  - 403 Forbidden → permission error
  - 404 Not found → show error UI
  - 500 Server error → retry logic
  - Network errors → offline mode

- **Client-Side Caching**
  - Product list caching (15 min)
  - Dealer profile caching (1 hour)
  - Order history caching
  - Static metadata caching
  - Cache key generation
  - Cache invalidation logic

- **Pagination Implementation**
  - Offset-based pagination
  - Page size configuration
  - Total count tracking
  - Load more functionality
  - Infinite scroll support

**Files to Create:**
- `lib/services/http_client.dart` - HTTP setup
- `lib/services/api_interceptor.dart` - Interceptor logic
- `lib/services/cache_service.dart` - Caching logic
- `lib/models/api_response.dart` - Response model
- `lib/models/api_error.dart` - Error handling

---

#### **4. Testing & Quality Assurance**

- **Unit Tests**
  - Order validation logic
  - Price calculation
  - Stock adjustment calculations
  - Inventory ledger logic
  - Cache key generation

- **Integration Tests**
  - Complete order flow (create → confirm → dispatch)
  - Inventory updates on order
  - Stock reversal on cancellation
  - API error handling
  - Cache invalidation

- **API Tests (Postman/Jest)**
  - All order endpoints
  - All inventory endpoints
  - Error responses
  - Edge cases (MOQ violation, insufficient stock, etc.)

- **Performance Tests**
  - Large order lists pagination
  - Inventory query performance
  - Cache effectiveness
  - Database query optimization

- **Test Documentation**
  - Test cases document
  - Test results report
  - Coverage metrics

**Files to Create:**
- `tests/order.test.js` - Order tests
- `tests/inventory.test.js` - Inventory tests
- `tests/api_caching.test.dart` - Frontend caching tests

---

### ✅ Research & Documentation Tasks

#### **Report Sections to Write:**

1. **Section 6: API Endpoints** (500-600 words)
   - Complete endpoint documentation
   - Request/response formats
   - Authentication requirements
   - Error codes & descriptions

2. **Section 7.4: Order Management** (600-700 words)
   - Order lifecycle explanation
   - Order status flow diagram
   - Payment tracking details
   - Order validation logic

3. **Section 7.5: Inventory Management** (600-700 words)
   - Immutable ledger concept
   - Stock tracking mechanism
   - Inventory audit trail
   - Discrepancy detection

4. **Section 15: Testing & Documentation** (400-500 words)
   - Testing strategy & approach
   - Test cases summary
   - Quality metrics

#### **Diagrams & Visuals to Create:**
1. Order lifecycle flow diagram
2. Inventory ledger structure diagram
3. Order status state machine
4. Inventory update workflow
5. API response error handling flowchart
6. Pagination strategy diagram

---

### ✅ Testing & Validation Tasks

**Backend Tests:**
- Order creation with various quantities
- Order cancellation & stock reversal
- Inventory discrepancy detection
- Ledger immutability verification
- Stock calculation accuracy

**Frontend Tests:**
- API error handling (401, 403, 500)
- Cache invalidation on order
- Pagination loading
- Offline detection

---

### ✅ Specific Deliverables

| **Deliverable** | **Status** | **Effort** |
|---|---|---|
| Order management (9 endpoints) | Code + Tests | HIGH |
| Inventory system (10 endpoints) | Code + Tests | HIGH |
| API caching layer | Code + Implementation | MEDIUM-HIGH |
| Testing suite | Unit + Integration | MEDIUM |
| API documentation | Swagger + Report | MEDIUM |
| Flowchart diagrams | 6 diagrams | MEDIUM |
| Total Effort Estimate | **100 hours** | **BALANCED** |

---

### 📅 Timeline & Milestones

**Week 1-2: Planning & Design**
- Order schema design
- Inventory ledger design
- API planning

**Week 2-3: Order System Implementation**
- Order model & CRUD
- Order validation logic
- Stock management integration

**Week 3-5: Inventory System Implementation**
- Ledger model
- Inventory operations
- Discrepancy detection

**Week 5-6: API Caching & Performance**
- Caching implementation
- Pagination setup
- Performance optimization

**Week 6-8: Testing & Documentation**
- Complete test suite
- Integration testing
- Final documentation

---

---

# 👤 TANUJ

## **Theme: Analytics, Dashboard & Infrastructure**

### ✅ Assigned Modules

#### **1. Dashboard & Analytics (Backend)**

- **Dashboard Overview**
  - Total products count
  - Total stock value
  - Total orders count
  - Total order value
  - Active dealers count
  - System health status
  - Low stock items alert

- **Sales Analytics**
  - Daily/weekly/monthly revenue trends
  - Top products by revenue
  - Top products by volume
  - Sales by category
  - Revenue forecasting (trend analysis)
  - Seasonal pattern detection
  - Growth metrics

- **Order Analytics**
  - Order volume trends
  - Average order value
  - Order status distribution (pending, confirmed, etc.)
  - Order fulfillment rate
  - Order cycle time analysis
  - Cancellation rate tracking

- **Inventory Analytics**
  - Stock levels by category
  - Stock turnover rate
  - Slow-moving products identification
  - Fast-moving products identification
  - Stock valuation trends
  - Reorder frequency analysis

- **Dealer Performance Metrics**
  - Total purchases per dealer
  - Average order value per dealer
  - Order frequency
  - Payment performance
  - Dealer segmentation (high/medium/low value)
  - Dealer trends

- **Daily Snapshots Model**
  - Automated daily data capture
  - Historical analytics storage
  - Trend calculation basis
  - Report generation base

**Files to Create/Modify:**
- `src/models/dailySnapshots.model.js` - Snapshots schema
- `src/controllers/dashboard.controller.js` - Dashboard logic (600+ lines)
- `src/routes/dashboard.route.js` - Dashboard endpoints
- `src/services/analyticsService.js` - Analytics calculations (new)
- `src/utils/reportGenerator.js` - Report generation (new)

**API Endpoints:**
```
GET    /api/v1/dashboard/overview           (admin)
GET    /api/v1/dashboard/sales-analytics    (admin)
GET    /api/v1/dashboard/order-analytics    (admin)
GET    /api/v1/dashboard/inventory-analytics(admin)
GET    /api/v1/dashboard/dealer-performance (admin)
GET    /api/v1/dashboard/health             (admin)
POST   /api/v1/dashboard/report/custom      (admin)
GET    /api/v1/dashboard/trends             (admin)
```

---

#### **2. Admin Dashboard (Flutter Web Frontend)**

- **Dashboard Layout**
  - Responsive web design
  - Sidebar navigation
  - Header with user info
  - Main content area
  - Footer with version info

- **Home/Overview Dashboard**
  - KPI cards (revenue, orders, dealers, stock)
  - Quick stats widgets
  - Recent orders list
  - Low stock alerts
  - System health indicator

- **Analytics Dashboard**
  - Revenue trend chart (line graph)
  - Order status chart (pie/bar)
  - Inventory metrics (gauge)
  - Dealer performance table
  - Export buttons (CSV, PDF ready)

- **Orders Management Table**
  - Paginated orders list
  - Sortable columns
  - Filter by status
  - Filter by date range
  - Action buttons (view, edit, cancel)
  - Search functionality

- **Inventory Management Table**
  - Product list with stock
  - Reorder level display
  - Low stock highlighting
  - Action buttons (restock, adjust)
  - Category filtering
  - Search by product name/code

- **Dealers Management Table**
  - Dealer list with info
  - Total purchases display
  - Payment status
  - Action buttons (view, edit, suspend)
  - Search & filter

- **Audit Logs Viewer**
  - Admin actions log
  - Before/after snapshots
  - Timestamp display
  - Filter by action type
  - Filter by date range
  - Detailed view modal

- **Responsive Design**
  - Mobile-friendly dashboard
  - Tablet optimization
  - Desktop full view
  - Collapsible sidebar
  - Adaptive layouts

**Files to Create:**
- `lib/screens/dashboard/home_screen.dart` - Home dashboard
- `lib/screens/dashboard/analytics_screen.dart` - Analytics view
- `lib/screens/orders/orders_table_screen.dart` - Orders management
- `lib/screens/inventory/inventory_screen.dart` - Inventory management
- `lib/screens/dealers/dealers_screen.dart` - Dealers management
- `lib/screens/audit/audit_log_screen.dart` - Audit logs
- `lib/widgets/kpi_card.dart` - KPI card widget
- `lib/widgets/data_table_widget.dart` - Reusable table
- `lib/widgets/chart_widget.dart` - Chart components
- `lib/providers/dashboard_provider.dart` - Dashboard state
- `lib/providers/analytics_provider.dart` - Analytics state
- `lib/models/dashboard.dart` - Dashboard models
- `lib/models/analytics.dart` - Analytics models

---

#### **3. Middleware Stack & Infrastructure (Backend)**

- **Security Headers Middleware**
  - HSTS (HTTP Strict Transport Security)
  - CSP (Content Security Policy)
  - X-Frame-Options
  - X-Content-Type-Options
  - X-XSS-Protection
  - Additional security headers

- **Rate Limiting Middleware**
  - Global rate limiter (100 req/15min)
  - Strict rate limiter (10 req/15min for sensitive routes)
  - In-memory counter tracking
  - IP-based limiting
  - Admin monitoring endpoints

- **Request Logging Middleware**
  - All requests logged
  - Response time tracking
  - Status code recording
  - Security event tracking
  - Recent logs storage
  - Admin logs retrieval

- **Input Validation Middleware**
  - Email format validation
  - Phone number validation (10 digits)
  - Pincode validation (6 digits)
  - MOQ/quantity validation
  - Price validation
  - Size limits enforcement (16KB)

- **Compression Middleware**
  - gzip compression setup
  - Compression level configuration
  - Threshold setting
  - Compression statistics

- **Caching Middleware**
  - Query result caching
  - Cache control headers
  - Cache invalidation logic
  - TTL management
  - Cache statistics

- **Error Handler Middleware**
  - Global error catching
  - Error formatting
  - Error logging
  - Status code assignment
  - User-friendly messages

- **CORS Middleware**
  - Origin validation
  - Credentials support
  - Method configuration
  - Header configuration

**Files to Create/Modify:**
- `src/middlewares/securityHeaders.js` - Security headers
- `src/middlewares/rateLimiter.js` - Rate limiting (enhanced)
- `src/middlewares/requestLogger.js` - Request logging (enhanced)
- `src/middlewares/inputValidator.js` - Input validation (enhanced)
- `src/middlewares/caching.js` - Caching (enhanced)
- `src/middlewares/errorHandler.js` - Error handling (enhanced)
- `src/app.js` - Middleware chain setup

---

#### **4. Configuration & Deployment (Backend)**

- **.env Configuration**
  - Server setup
  - Database configuration
  - JWT configuration
  - CORS configuration
  - SendGrid setup
  - Kafka setup
  - Cloudinary setup

- **Database Connection**
  - MongoDB Atlas connection
  - Connection pooling
  - Error handling
  - Logging setup

- **Production Deployment**
  - Node.js production setup
  - PM2 process manager
  - Environment variables
  - Error tracking
  - Performance monitoring

- **Kafka Integration**
  - Kafka producer setup
  - Consumer configuration
  - SSL/TLS setup
  - SASL authentication
  - Error handling

- **Email Service Setup**
  - SendGrid integration
  - Email templates
  - Email queue management

- **File Upload Setup**
  - Multer middleware
  - Cloudinary integration
  - File validation

**Files to Create/Modify:**
- `.env` - Environment template
- `src/db/index.js` - Database connection
- `src/config/swagger.js` - API documentation
- `docker-compose.yml` - Docker setup (optional)
- Deployment guides

---

### ✅ Research & Documentation Tasks

#### **Report Sections to Write:**

1. **Section 9: Performance Optimizations** (600-700 words)
   - Compression techniques
   - Caching strategies
   - Database optimization
   - Network optimization
   - Memory management

2. **Section 11: Middleware Stack** (700-800 words)
   - Middleware architecture
   - Execution order
   - Security middleware details
   - Performance middleware details
   - Error handling flow

3. **Section 14: Configuration & Setup** (500-600 words)
   - Environment variables
   - Installation steps
   - Database setup
   - Configuration options
   - Scripts & commands

4. **Section 16: Deployment & Environment** (500-600 words)
   - Development environment
   - Production deployment
   - Monitoring & logging
   - Scaling considerations

#### **Diagrams & Visuals to Create:**
1. Middleware execution flow diagram
2. Request lifecycle diagram
3. Rate limiting strategy diagram
4. Error handling flowchart
5. Deployment architecture diagram
6. Dashboard UI mockups (3-4 screens)

---

### ✅ Testing & Validation Tasks

**Backend Tests:**
- Dashboard data accuracy
- Analytics calculation correctness
- Middleware functionality
- Rate limiting enforcement
- Security headers presence
- Error handling coverage

**Frontend Tests:**
- Dashboard loading & data binding
- Chart rendering accuracy
- Table pagination
- Sorting & filtering
- Responsive layout
- Error state handling

---

### ✅ Specific Deliverables

| **Deliverable** | **Status** | **Effort** |
|---|---|---|
| Dashboard system (8 endpoints) | Code + Logic | HIGH |
| Admin dashboard UI (6 screens) | Flutter code | HIGH |
| Middleware stack (7 middlewares) | Code + Tests | MEDIUM-HIGH |
| Configuration & deployment | Setup guides | MEDIUM |
| Analytics documentation | Report section | MEDIUM |
| UI/UX mockups | Diagrams & wireframes | MEDIUM |
| Total Effort Estimate | **100 hours** | **BALANCED** |

---

### 📅 Timeline & Milestones

**Week 1-2: Infrastructure Setup**
- Middleware implementation
- Configuration setup
- Database optimization

**Week 2-3: Dashboard Backend**
- Dashboard controllers
- Analytics service
- Daily snapshots model

**Week 3-5: Admin Frontend**
- Dashboard UI screens
- Analytics charts
- Data tables

**Week 5-6: Testing & Integration**
- Unit testing
- Integration testing
- Performance testing

**Week 6-8: Documentation & Deployment**
- Final documentation
- Deployment guides
- Performance optimization

---

---

## 📋 SUMMARY COMPARISON TABLE

| **Aspect** | **ROHIT** | **NARENDRA** | **TANUJ** |
|---|---|---|---|
| **Primary Theme** | Authentication & Products | Orders & Inventory | Analytics & Infrastructure |
| **Backend Modules** | 2 (Auth, Products) | 2 (Orders, Inventory) | 2 (Dashboard, Middleware) |
| **Frontend Components** | Mobile app (5 screens) | API layer | Admin dashboard (6 screens) |
| **Estimated LOC** | 1,500-2,000 | 1,500-2,000 | 1,500-2,000 |
| **API Endpoints** | 9 endpoints | 19 endpoints | 8 endpoints |
| **Database Models** | 2 models | 2 models | 2 models + 7 middlewares |
| **Report Sections** | 4 sections | 4 sections | 4 sections |
| **Diagrams** | 5 diagrams | 6 diagrams | 6 diagrams |
| **Testing Coverage** | Unit + Integration | Unit + Integration + Performance | Unit + Integration + Middleware |
| **Complexity Level** | MEDIUM-HIGH | HIGH | MEDIUM-HIGH |
| **Effort Hours** | 100 hours | 100 hours | 100 hours |
| **Timeline** | 8 weeks | 8 weeks | 8 weeks |

---

## 🎯 KEY RESPONSIBILITIES BY PERSON

### ROHIT - Security & User Management
- ✅ Authentication system (6 endpoints)
- ✅ Product management (9 endpoints)
- ✅ Dealer mobile app (5 screens)
- ✅ Security documentation
- ✅ User/profile related features
- ✅ Mobile UX implementation

### NARENDRA - Business Logic & Data Integrity
- ✅ Order management (9 endpoints)
- ✅ Inventory system (10 endpoints)
- ✅ API integration layer
- ✅ Complete testing suite
- ✅ Data validation logic
- ✅ Business rule enforcement

### TANUJ - Operations & Insights
- ✅ Dashboard system (8 endpoints)
- ✅ Admin dashboard (6 screens)
- ✅ Middleware infrastructure
- ✅ Analytics & reporting
- ✅ Performance optimization
- ✅ System monitoring & deployment

---

## 📊 EFFORT & FAIRNESS METRICS

### Code Distribution
- **Rohit:** ~15% authentication, ~20% products, ~25% mobile UI = **~40% frontend + backend**
- **Narendra:** ~15% orders, ~15% inventory, ~20% API layer, ~10% testing = **~60% backend**
- **Tanuj:** ~15% dashboard, ~20% admin UI, ~15% middleware, ~10% infrastructure = **~40% frontend + backend**

### Complexity Distribution
- **Rohit:** Security concepts (medium) + Mobile UI (medium) = **MEDIUM-HIGH**
- **Narendra:** Business logic (high) + Data integrity (high) + Testing (high) = **HIGH**
- **Tanuj:** Analytics (medium) + Infrastructure (medium-high) + Admin UI (medium) = **MEDIUM-HIGH**

### Effort Distribution
- **Rohit:** 100 hours (Research: 20h, Coding: 50h, Testing: 15h, Documentation: 15h)
- **Narendra:** 100 hours (Research: 15h, Coding: 55h, Testing: 20h, Documentation: 10h)
- **Tanuj:** 100 hours (Research: 20h, Coding: 45h, Testing: 15h, Documentation: 20h)

**Total Project:** 300 hours equally distributed

---

## ✅ FAIRNESS VALIDATION CHECKLIST

### Code Complexity ✓
- [ ] Rohit: Authentication (medium) + Products (medium) = Fair
- [ ] Narendra: Orders (high) + Inventory (high) = Fair (compensated with clear requirements)
- [ ] Tanuj: Dashboard (medium) + Infrastructure (medium) = Fair

### Code Volume ✓
- [ ] Rohit: ~500 lines auth + ~400 lines products + ~600 lines mobile = ~1500 LOC
- [ ] Narendra: ~500 lines orders + ~600 lines inventory + ~400 lines caching = ~1500 LOC
- [ ] Tanuj: ~600 lines dashboard + ~500 lines middleware + ~400 lines admin UI = ~1500 LOC

### Frontend Work ✓
- [ ] Rohit: Dealer mobile app (primary mobile developer)
- [ ] Narendra: API integration & caching (backend-focused)
- [ ] Tanuj: Admin dashboard (web developer)

### Documentation ✓
- [ ] Rohit: 4 sections (Security, Overview, Tech stack, Deployment)
- [ ] Narendra: 4 sections (API, Orders, Inventory, Testing)
- [ ] Tanuj: 4 sections (Performance, Middleware, Setup, Deployment)

### Testing ✓
- [ ] Rohit: Unit + Integration tests for auth & products
- [ ] Narendra: Unit + Integration + Performance tests (comprehensive)
- [ ] Tanuj: Unit + Integration + Middleware tests

---

## 📅 SUBMISSION DEADLINES

| **Milestone** | **Due Date** | **Deliverables** |
|---|---|---|
| **Week 1** | Day 7 | Design docs, Database schemas, API planning |
| **Week 2** | Day 14 | Auth system (Rohit), Order model (Narendra), Middleware setup (Tanuj) |
| **Week 3** | Day 21 | Product system (Rohit), Inventory system (Narendra), Dashboard backend (Tanuj) |
| **Week 4** | Day 28 | Mobile app screens (Rohit), Testing suite (Narendra), Admin dashboard (Tanuj) |
| **Week 5** | Day 35 | Feature completion & integration testing |
| **Week 6** | Day 42 | Bug fixes & documentation writing |
| **Week 7** | Day 49 | Final testing & report completion |
| **Week 8** | Day 56 | **FINAL SUBMISSION** (All deliverables) |

---

## 📝 ASSESSMENT CRITERIA

### For Each Team Member:

**Code Quality (30%)**
- Follows best practices
- Proper error handling
- Code organization
- Comments & documentation

**Feature Implementation (30%)**
- All assigned features working
- Edge cases handled
- API contracts met
- Performance acceptable

**Testing (20%)**
- Unit test coverage >80%
- Integration tests passing
- Documentation of test cases
- Performance metrics

**Documentation (15%)**
- Report sections complete
- Diagrams included
- Code comments present
- README updates

**Participation (5%)**
- Regular commits
- Team collaboration
- Meeting deadlines
- Communication

---

## 🔄 COLLABORATION POINTS

### Weekly Sync Meetings (Every Monday 10 AM)
- Discuss progress
- Identify blockers
- Plan next week

### Integration Points
- **Rohit → Narendra:** Auth tokens used in Orders API
- **Rohit → Tanuj:** User data in Dashboard
- **Narendra → Tanuj:** Analytics data from Orders & Inventory
- **Tanuj → All:** Infrastructure supports all systems

### Shared Utilities (Everyone Contributes)
- Error handling classes
- Response formatting
- Logger setup
- Constants file

---

## 📞 POINTS OF CONTACT

| **System** | **Owner** | **Backup** |
|---|---|---|
| Authentication | Rohit | Narendra |
| Products | Rohit | Tanuj |
| Orders | Narendra | Rohit |
| Inventory | Narendra | Tanuj |
| Dashboard | Tanuj | Narendra |
| Infrastructure | Tanuj | Rohit |
| Mobile App | Rohit | Tanuj |
| Admin Dashboard | Tanuj | Narendra |

---

## ✨ CONCLUSION

This distribution ensures:
- ✅ **Equal effort** (100 hours each)
- ✅ **Equal complexity** (all get challenging tasks)
- ✅ **Equal code volume** (1500 LOC each)
- ✅ **Fair documentation** (4 sections each)
- ✅ **Balanced testing** (all test their components)
- ✅ **Independent workstreams** (minimal blocking)
- ✅ **Integration points** (system cohesion)

All three team members will have significant contributions to a production-ready system that demonstrates:
- Backend API development
- Database design
- Frontend development
- System integration
- Testing & QA
- Project documentation

---

**Prepared by:** Technical Project Coordinator  
**Date:** April 28, 2026  
**Approved by:** Project Mentor  
**Status:** Ready for Team Implementation
