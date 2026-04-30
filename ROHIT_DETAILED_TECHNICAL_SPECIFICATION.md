# 🔐 ROHIT LOKHANDE - DETAILED TECHNICAL SPECIFICATION

## Authentication & Product Management Backend

**Project:** Radhey Salts B2B Salt Supply Management System  
**Team Member:** Rohit Lokhande  
**Theme:** User Authentication & Product Management  
**Role:** Backend Developer (Authentication) + Product Manager + Mobile App Developer  
**Duration:** 8 weeks  
**Total Hours:** 100 hours  
**Lines of Code (Target):** 1,500-2,000 LOC

---

## 📑 TABLE OF CONTENTS

1. [Overview](#overview)
2. [Authentication System - Detailed](#authentication-system---detailed)
3. [Product Management System - Detailed](#product-management-system---detailed)
4. [Database Schemas](#database-schemas)
5. [API Specifications](#api-specifications)
6. [Code Structure & Architecture](#code-structure--architecture)
7. [Implementation Guidelines](#implementation-guidelines)
8. [Testing Strategy](#testing-strategy)
9. [Security Considerations](#security-considerations)
10. [Performance Optimization](#performance-optimization)
11. [Error Handling](#error-handling)
12. [Timeline & Milestones](#timeline--milestones)

---

## 📌 OVERVIEW

Rohit is responsible for **two critical backend systems** and a **dealer-facing mobile application**:

### Backend Responsibilities:
1. **Authentication System** - User login, JWT tokens, session management, security
2. **Product Management** - Product catalog, pricing logic, inventory integration

### Frontend Responsibilities:
- **Dealer Mobile App** - Flutter-based customer interface

### Why This Distribution?
- ✅ Authentication is foundational (other systems depend on it)
- ✅ Product management is core business logic
- ✅ Mobile app provides user-facing value
- ✅ All components integrate to form the dealer experience
- ✅ Balanced complexity (security concepts + business logic + UI)

---

## 🔐 AUTHENTICATION SYSTEM - DETAILED

### Purpose
The authentication system is the **security backbone** of the entire application. It ensures:
- Only authorized users can access the system
- User sessions are secure and traceable
- Tokens cannot be reused after logout
- Passwords are securely stored
- Admin and dealer roles have different access levels

### System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                   AUTHENTICATION SYSTEM                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐         ┌──────────────────────┐          │
│  │  Login Request  │         │  JWT Token Creation  │          │
│  │  (email/phone + │────────→│  - AccessToken       │          │
│  │   password)     │         │  - RefreshToken      │          │
│  └─────────────────┘         │  - JTI (unique ID)   │          │
│           │                  └──────────────────────┘          │
│           │                           │                        │
│           │                           ▼                        │
│           │                  ┌──────────────────────┐          │
│           │                  │  Token Storage       │          │
│           │                  │  - JWT Secret key    │          │
│           │                  │  - Expiration times  │          │
│           │                  └──────────────────────┘          │
│           │                           │                        │
│           │                           ▼                        │
│           │                  ┌──────────────────────┐          │
│           │                  │  Request with Token  │          │
│           │                  │  - Header: Bearer    │          │
│           │                  └──────────────────────┘          │
│           │                           │                        │
│           ▼                           ▼                        │
│  ┌─────────────────────────────────────────────────┐           │
│  │       JWT Middleware Verification               │           │
│  │  1. Extract token from header                   │           │
│  │  2. Verify signature (hasn't been tampered)     │           │
│  │  3. Check expiration (still valid)              │           │
│  │  4. Check blacklist (not logged out)            │           │
│  │  5. Extract user info (ID, role, email)        │           │
│  └─────────────────────────────────────────────────┘           │
│           │                           │                        │
│           ├──→ Valid ───────→ Next Middleware                  │
│           │                                                     │
│           └──→ Invalid ──────→ 401 Unauthorized Error          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 1. JWT Token Architecture

#### Access Token (Short-lived)
```
Header:
{
  "alg": "HS256",
  "typ": "JWT"
}

Payload:
{
  "_id": "user_id_from_database",
  "email": "user@example.com",
  "name": "User Name",
  "role": "admin" OR "dealer",
  "jti": "unique_token_id_for_tracking",
  "iat": 1682000000,           // Issued at
  "exp": 1682000900            // Expires in 15 minutes
}

Signature:
HMACSHA256(base64(header) + "." + base64(payload), SECRET_KEY)
```

**Purpose:** Used for API requests, short-lived for security

**Expiry:** 15 minutes

**Stored:** In-memory (frontend), Authorization header in requests

#### Refresh Token (Long-lived)
```
Payload:
{
  "_id": "user_id_from_database",
  "iat": 1682000000,
  "exp": 1682604800           // Expires in 7 days
}

Simpler than access token (no role/email needed)
```

**Purpose:** Used ONLY to get new access tokens, never for API requests

**Expiry:** 7 days

**Stored:** Secure storage (frontend), HttpOnly cookie (if supported)

#### JTI (JWT ID)
- Unique identifier for each token
- Used for token blacklisting (logout)
- Format: Random hex string (e.g., "a3b2c1d0e9f8g7h6")
- When user logs out, JTI is added to TokenBlacklist collection

### 2. Admin Login Module

**Endpoint:** `POST /api/v1/auth/admin/login`

**Request:**
```json
{
  "email": "admin@radhey.com",
  "password": "Admin@123"
}
```

**Processing Steps:**

```javascript
// Step 1: Find admin by email
const admin = await Admin.findOne({ email: email.toLowerCase() })
  .select("+password"); // Explicitly select password field

if (!admin) {
  throw new ApiError(401, "Admin not found");
}

// Step 2: Verify password
const isPasswordCorrect = await admin.isPasswordCorrect(password);
// Uses bcrypt.compare(password, admin.password)

if (!isPasswordCorrect) {
  throw new ApiError(401, "Invalid password");
}

// Step 3: Check if admin is active
if (!admin.isActive) {
  throw new ApiError(403, "Admin account is deactivated");
}

// Step 4: Generate tokens
const accessToken = admin.generateAccessToken();
// Returns JWT with 15-minute expiry + JTI

const refreshToken = admin.generateRefreshToken();
// Returns JWT with 7-day expiry

// Step 5: Update last login
admin.lastLogin = new Date();
await admin.save();

// Step 6: Return tokens (never return password!)
return {
  success: true,
  data: {
    accessToken,
    refreshToken,
    admin: {
      _id: admin._id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
      lastLogin: admin.lastLogin
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "admin": {
      "_id": "admin_id_123",
      "email": "admin@radhey.com",
      "name": "Rajesh Kumar",
      "role": "super_admin",
      "lastLogin": "2026-04-28T10:30:00Z"
    }
  }
}
```

**Error Responses:**
- 401: Admin not found or invalid password
- 403: Admin account deactivated
- 400: Missing email or password

### 3. Dealer Login Module

**Endpoint:** `POST /api/v1/auth/dealer/login`

**Request:**
```json
{
  "emailOrPhone": "amit.patel@dealer.com",  // Can be email OR 10-digit phone
  "password": "Dealer@123"
}
```

**Processing Steps:**

```javascript
// Step 1: Find dealer by email OR phone
const dealer = await Dealer.findOne({
  $or: [
    { email: emailOrPhone.toLowerCase() },
    { phone: emailOrPhone }  // If 10 digits, it's a phone
  ]
}).select("+password");

if (!dealer) {
  throw new ApiError(401, "Dealer not found");
}

// Step 2: Verify password
const isPasswordCorrect = await dealer.isPasswordCorrect(password);

if (!isPasswordCorrect) {
  throw new ApiError(401, "Invalid password");
}

// Step 3: Check dealer status
if (dealer.status === "suspended") {
  throw new ApiError(403, "Dealer account is suspended");
}

if (dealer.status === "inactive") {
  throw new ApiError(403, "Dealer account is inactive");
}

// Step 4: Generate tokens
const accessToken = dealer.generateAccessToken();
const refreshToken = dealer.generateRefreshToken();

// Step 5: Update last login
dealer.lastOrderDate = new Date();  // Track activity
await dealer.save();

// Step 6: Return response
return {
  success: true,
  data: {
    accessToken,
    refreshToken,
    dealer: {
      _id: dealer._id,
      email: dealer.email,
      phone: dealer.phone,
      name: dealer.name,
      businessName: dealer.businessName,
      status: dealer.status,
      totalOrders: dealer.totalOrders,
      totalSpent: dealer.totalSpent
    }
  }
}
```

**Why Allow Email OR Phone?**
- Dealers might forget which they registered with
- Phone login is common in India (B2B pattern)
- Improves user experience
- Validation ensures 10-digit phone numbers only

### 4. Dealer Self-Registration

**Endpoint:** `POST /api/v1/auth/dealer/register`

**Request:**
```json
{
  "name": "Amit Patel",
  "email": "amit.patel@dealer.com",
  "password": "Dealer@123",
  "phone": "9876543210",
  "businessName": "Patel Salt Trading",
  "address": "Shop No. 5, Main Market",
  "city": "Ahmedabad",
  "state": "Gujarat",
  "pincode": "380001"
}
```

**Validation Rules:**

```javascript
// Email validation
if (!email || !email.includes('@')) {
  throw new ApiError(400, "Invalid email format");
}

// Phone validation (exactly 10 digits)
if (!phone || !/^\d{10}$/.test(phone)) {
  throw new ApiError(400, "Phone must be 10 digits");
}

// Pincode validation (exactly 6 digits)
if (!pincode || !/^\d{6}$/.test(pincode)) {
  throw new ApiError(400, "Pincode must be 6 digits");
}

// Password strength
if (password.length < 6) {
  throw new ApiError(400, "Password must be at least 6 characters");
}

// Check if email already exists
const existingDealer = await Dealer.findOne({ email: email.toLowerCase() });
if (existingDealer) {
  throw new ApiError(400, "Email already registered");
}

// Check if phone already exists
const phoneExists = await Dealer.findOne({ phone: phone });
if (phoneExists) {
  throw new ApiError(400, "Phone number already registered");
}
```

**Processing Steps:**

```javascript
// Step 1: Validate all fields
// (validation code above)

// Step 2: Create dealer document
const dealer = await Dealer.create({
  name,
  email: email.toLowerCase(),
  password,  // Will be hashed in pre-save hook
  phone,
  businessName,
  address,
  city,
  state,
  pincode,
  status: "active",  // Default status
  role: "dealer",    // Always dealer role
  totalOrders: 0,
  totalSpent: 0
});

// Step 3: Pre-save hook (in model) hashes password using bcrypt

// Step 4: Generate tokens
const accessToken = dealer.generateAccessToken();
const refreshToken = dealer.generateRefreshToken();

// Step 5: Return response
return {
  success: true,
  message: "Registration successful",
  data: {
    accessToken,
    refreshToken,
    dealer: {
      _id: dealer._id,
      email: dealer.email,
      name: dealer.name,
      businessName: dealer.businessName
    }
  }
}
```

### 5. Token Refresh Mechanism

**Endpoint:** `POST /api/v1/auth/refresh`

**Request:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Processing Steps:**

```javascript
// Step 1: Get refresh token from request body or cookie
let refreshToken = req.body.refreshToken || req.cookies.refreshToken;

if (!refreshToken) {
  throw new ApiError(401, "Refresh token not provided");
}

// Step 2: Verify refresh token signature
let decoded;
try {
  decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
} catch (error) {
  throw new ApiError(401, "Invalid or expired refresh token");
}

// Step 3: Find user (could be admin or dealer)
let user;
if (decoded.role === "admin" || decoded.role === "super_admin") {
  user = await Admin.findById(decoded._id);
} else {
  user = await Dealer.findById(decoded._id);
}

if (!user) {
  throw new ApiError(401, "User not found");
}

// Step 4: Generate new access token (refresh token stays same)
const newAccessToken = user.generateAccessToken();

// Step 5: Return new access token
return {
  success: true,
  data: {
    accessToken: newAccessToken
  }
}
```

**Why This Approach?**
- Access token expires in 15 minutes (good security)
- User doesn't need to log in again if using app
- Refresh token is stored securely (last 7 days)
- If refresh token is compromised, attacker gets only 15-min window

### 6. Logout with Token Blacklisting

**Endpoint:** `POST /api/v1/auth/logout`

**Request:**
```
Headers: Authorization: Bearer <accessToken>
```

**Processing Steps:**

```javascript
// Step 1: Get JWT from authorization header
const token = req.headers.authorization.split(" ")[1];
// Extracts "Bearer token" → "token"

// Step 2: Decode token to get JTI
let decoded;
try {
  decoded = jwt.decode(token);  // Decode without verifying signature
} catch (error) {
  throw new ApiError(400, "Invalid token");
}

// Step 3: Add JTI to blacklist
const tokenBlacklistEntry = await TokenBlacklist.create({
  jti: decoded.jti,
  userId: decoded._id,
  expiresAt: new Date(decoded.exp * 1000),  // Convert Unix timestamp
  createdAt: new Date()
});

// Step 4: Return success
return {
  success: true,
  message: "Logout successful"
}
```

**Blacklist TTL Index:**
MongoDB automatically deletes expired entries at `expiresAt` time:
```javascript
// In TokenBlacklist model:
tokenBlacklistSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
```

**Why Blacklist Instead of Clearing Frontend?**
- Frontend could maliciously reuse old tokens
- Backend validates every request
- Blacklist ensures token cannot be reused
- After expiration, entry auto-deletes from DB

### 7. Password Change Functionality

**Endpoint:** `POST /api/v1/auth/change-password`

**Request:**
```
Headers: Authorization: Bearer <accessToken>

Body:
{
  "oldPassword": "OldPassword@123",
  "newPassword": "NewPassword@456",
  "confirmPassword": "NewPassword@456"
}
```

**Processing Steps:**

```javascript
// Step 1: Get user from JWT (middleware already verified)
const userId = req.user._id;
const user = await (req.user.role === "admin" ? Admin : Dealer)
  .findById(userId)
  .select("+password");

// Step 2: Verify old password
const isOldPasswordCorrect = await user.isPasswordCorrect(oldPassword);
if (!isOldPasswordCorrect) {
  throw new ApiError(400, "Old password is incorrect");
}

// Step 3: Validate new password
if (newPassword !== confirmPassword) {
  throw new ApiError(400, "Passwords do not match");
}

if (newPassword === oldPassword) {
  throw new ApiError(400, "New password must be different from old");
}

if (newPassword.length < 6) {
  throw new ApiError(400, "Password must be at least 6 characters");
}

// Step 4: Update password
user.password = newPassword;
await user.save();  // Pre-save hook will hash the password

// Step 5: Blacklist current token (force re-login)
const decoded = jwt.decode(req.headers.authorization.split(" ")[1]);
await TokenBlacklist.create({
  jti: decoded.jti,
  userId: userId,
  expiresAt: new Date(decoded.exp * 1000)
});

// Step 6: Return response
return {
  success: true,
  message: "Password changed successfully. Please login again."
}
```

**Why Blacklist Current Token?**
- Security best practice
- Invalidates all other devices' tokens
- Forces user to re-authenticate
- Prevents token reuse after password change

### 8. JWT Middleware (Verification)

**File:** `src/middlewares/jwt.middleware.js`

```javascript
export const verifyJWT = asyncHandler(async (req, res, next) => {
  // Step 1: Get token from header or cookie
  const token = req.headers.authorization?.split(" ")[1] || 
                req.cookies.accessToken;

  if (!token) {
    throw new ApiError(401, "No token provided");
  }

  // Step 2: Verify token signature
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw new ApiError(401, "Token expired");
    }
    if (error.name === "JsonWebTokenError") {
      throw new ApiError(401, "Invalid token");
    }
    throw new ApiError(401, "Token verification failed");
  }

  // Step 3: Check blacklist
  const blacklistedToken = await TokenBlacklist.findOne({ jti: decoded.jti });
  if (blacklistedToken) {
    throw new ApiError(401, "Token has been blacklisted (user logged out)");
  }

  // Step 4: Attach user to request
  req.user = {
    _id: decoded._id,
    email: decoded.email,
    role: decoded.role,
    name: decoded.name
  };

  next();
});
```

**Used In:** Every protected endpoint
```javascript
router.get("/current-user", verifyJWT, getCurrentUser);
// verifyJWT runs first, then getCurrentUser
```

### 9. Current User Endpoint

**Endpoint:** `GET /api/v1/auth/me`

```javascript
export const getCurrentUser = asyncHandler(async (req, res) => {
  // req.user is already set by verifyJWT middleware
  
  const user = await (req.user.role === "admin" ? Admin : Dealer)
    .findById(req.user._id);
  
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return res.json(
    new ApiResponse(200, user, "User details fetched successfully")
  );
});
```

---

## 📦 PRODUCT MANAGEMENT SYSTEM - DETAILED

### Purpose
Product Management is the **core business module**. It enables:
- Dealers to browse available products
- Admins to manage product catalog
- Dynamic pricing with bulk discounts
- Stock tracking and monitoring
- Product analytics and insights

### System Architecture

```
┌─────────────────────────────────────────────────────┐
│         PRODUCT MANAGEMENT SYSTEM                   │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌──────────────────────────────────────────┐     │
│  │   Product Database Collection            │     │
│  │   (Name, Price, Stock, Pricing Tiers)    │     │
│  └──────────────────────────────────────────┘     │
│                      │                             │
│        ┌─────────────┼─────────────┐              │
│        │             │             │              │
│        ▼             ▼             ▼              │
│  ┌──────────┐ ┌──────────┐ ┌──────────────┐     │
│  │  CRUD    │ │ Analytics│ │  Pricing     │     │
│  │Operations│ │& Reports │ │  Calculation │     │
│  └──────────┘ └──────────┘ └──────────────┘     │
│        │             │             │              │
│        └─────────────┼─────────────┘              │
│                      ▼                             │
│        ┌─────────────────────────────┐            │
│        │  API Endpoints (9 total)    │            │
│        │  - GET all (pagination)     │            │
│        │  - GET one                  │            │
│        │  - POST (create)            │            │
│        │  - PUT (update)             │            │
│        │  - DELETE (soft delete)     │            │
│        │  - LOW STOCK               │            │
│        │  - STATISTICS              │            │
│        └─────────────────────────────┘            │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### 1. Product Database Schema

**File:** `src/models/product.model.js`

```javascript
const productSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, "Product name required"],
    trim: true,
    minlength: 2,
    maxlength: 200
  },
  
  description: {
    type: String,
    required: [true, "Product description required"],
    maxlength: 1000
  },
  
  productCode: {
    type: String,
    required: [true, "Product code required"],
    unique: true,
    uppercase: true,
    trim: true
    // Example: "ROCK-001", "SEA-001"
  },
  
  // Pricing Information
  category: {
    type: String,
    required: true,
    trim: true
    // Examples: "Industrial Salt", "Food Grade", "Agricultural"
  },
  
  price: {
    type: Number,
    required: [true, "Base price required"],
    min: [0, "Price cannot be negative"]
    // This is the base price (Tier 0)
    // Example: 250 per kg
  },
  
  // Stock Information
  MOQ: {
    type: Number,
    required: [true, "MOQ required"],
    min: [1, "MOQ must be at least 1"]
    // Minimum Order Quantity
    // Example: 100 kg minimum
  },
  
  stockQty: {
    type: Number,
    required: [true, "Stock quantity required"],
    min: [0, "Stock cannot be negative"],
    default: 0
    // Current stock in warehouse
    // Example: 5000 kg available
  },
  
  reorderLevel: {
    type: Number,
    default: 100,
    min: [0, "Cannot be negative"]
    // Alert admin when stock falls below this
    // Example: Alert when below 100 kg
  },
  
  // Pricing Tiers for Bulk Discounts
  pricingTiers: [
    {
      minQty: {
        type: Number,
        required: true,
        min: 1
      },
      maxQty: {
        type: Number,
        default: null
        // null = no upper limit
      },
      price: {
        type: Number,
        required: true,
        min: 0
      },
      _id: false  // Don't generate MongoDB ID for subdocs
    }
  ],
  // Example:
  // [
  //   { minQty: 100, maxQty: 500, price: 245 },    // 100-500 kg = 245/kg
  //   { minQty: 501, maxQty: 1000, price: 240 },   // 501-1000 kg = 240/kg
  //   { minQty: 1001, maxQty: null, price: 235 }   // 1001+ kg = 235/kg
  // ]
  
  // Product Details
  unit: {
    type: String,
    enum: ["kg", "liter", "piece", "bag", "box", "carton"],
    default: "kg"
  },
  
  image: {
    type: String,  // Cloudinary URL
    trim: true
    // Example: "https://res.cloudinary.com/.../image.jpg"
  },
  
  supplier: {
    type: String,
    trim: true
  },
  
  hsn: {
    type: String,
    trim: true
    // HSN Code for tax purposes
    // Example: "25012100"
  },
  
  // Status Tracking
  isActive: {
    type: Boolean,
    default: true
    // false = product is hidden/archived
  },
  
  isDeleted: {
    type: Boolean,
    default: false
    // true = soft deleted (not shown but data preserved)
  },
  
  // Timestamps
  timestamps: true
  // createdAt, updatedAt auto-added
});

// Indexes for performance
productSchema.index({ productCode: 1 });
productSchema.index({ category: 1 });
productSchema.index({ isActive: 1 });
productSchema.index({ stockQty: 1 });  // For low stock queries
```

### 2. Product CRUD Operations

#### **A. GET All Products (Paginated, Searchable, Filterable)**

**Endpoint:** `GET /api/v1/products?page=1&limit=20&category=Food&search=Salt&sortBy=price`

**Query Parameters:**
- `page` (default: 1) - Page number
- `limit` (default: 10) - Items per page
- `category` - Filter by category
- `search` - Search product name or code
- `sortBy` - Sort by field (price, name, stock)
- `inStock` - true/false - Only show products in stock

**Implementation:**

```javascript
export const getAllProducts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, category, search, sortBy = "name", inStock } = req.query;
  
  // Step 1: Build filter object
  const filter = { isDeleted: false, isActive: true };
  
  // Add category filter
  if (category) {
    filter.category = { $regex: category, $options: "i" };  // Case-insensitive
  }
  
  // Add search filter (search in name and productCode)
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { productCode: { $regex: search, $options: "i" } }
    ];
  }
  
  // Add stock filter
  if (inStock === "true") {
    filter.stockQty = { $gt: 0 };  // Greater than 0
  }
  
  // Step 2: Calculate pagination
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;
  
  // Step 3: Build sort object
  let sortObj = {};
  switch(sortBy) {
    case "price":
      sortObj = { price: 1 };  // Low to high
      break;
    case "price_desc":
      sortObj = { price: -1 };  // High to low
      break;
    case "stock":
      sortObj = { stockQty: -1 };  // Most stock first
      break;
    default:
      sortObj = { name: 1 };  // Alphabetical
  }
  
  // Step 4: Query database
  const products = await Product.find(filter)
    .sort(sortObj)
    .skip(skip)
    .limit(limitNum)
    .select("-isDeleted");  // Don't return isDeleted field
  
  // Step 5: Get total count (for pagination info)
  const totalProducts = await Product.countDocuments(filter);
  
  // Step 6: Calculate pagination info
  const totalPages = Math.ceil(totalProducts / limitNum);
  const hasMore = pageNum < totalPages;
  
  // Step 7: Return response
  return res.json(
    new ApiResponse(200, {
      products,
      pagination: {
        currentPage: pageNum,
        itemsPerPage: limitNum,
        totalItems: totalProducts,
        totalPages,
        hasMore
      }
    }, "Products fetched successfully")
  );
});
```

**Response Example:**
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "_id": "product_id_1",
        "name": "Rock Salt - Industrial Grade",
        "productCode": "ROCK-001",
        "price": 250,
        "stockQty": 5000,
        "category": "Industrial Salt",
        "unit": "kg",
        "MOQ": 100,
        "reorderLevel": 100,
        "pricingTiers": [...],
        "image": "https://..."
      }
    ],
    "pagination": {
      "currentPage": 1,
      "itemsPerPage": 20,
      "totalItems": 45,
      "totalPages": 3,
      "hasMore": true
    }
  }
}
```

#### **B. GET Single Product by ID**

**Endpoint:** `GET /api/v1/products/:id`

```javascript
export const getProductById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  // Validate MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid product ID");
  }
  
  const product = await Product.findOne({
    _id: id,
    isDeleted: false
  });
  
  if (!product) {
    throw new ApiError(404, "Product not found");
  }
  
  return res.json(
    new ApiResponse(200, product, "Product fetched successfully")
  );
});
```

#### **C. GET Product Pricing (For Quote Calculation)**

**Endpoint:** `GET /api/v1/products/:id/pricing?quantity=250`

**Purpose:** Frontend sends quantity, backend returns applicable price

```javascript
export const getProductPricing = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { quantity } = req.query;
  
  // Validation
  if (!quantity || isNaN(quantity)) {
    throw new ApiError(400, "Quantity must be provided");
  }
  
  const qty = parseInt(quantity);
  
  const product = await Product.findOne({
    _id: id,
    isDeleted: false
  });
  
  if (!product) {
    throw new ApiError(404, "Product not found");
  }
  
  // Check MOQ
  if (qty < product.MOQ) {
    throw new ApiError(400, 
      `Minimum order quantity is ${product.MOQ} ${product.unit}`);
  }
  
  // Step 1: Find applicable pricing tier
  let applicablePrice = product.price;  // Default base price
  
  if (product.pricingTiers && product.pricingTiers.length > 0) {
    for (const tier of product.pricingTiers) {
      const minQtyMet = qty >= tier.minQty;
      const maxQtyMet = !tier.maxQty || qty <= tier.maxQty;
      
      if (minQtyMet && maxQtyMet) {
        applicablePrice = tier.price;
        break;
      }
    }
  }
  
  // Step 2: Calculate total
  const totalPrice = qty * applicablePrice;
  
  // Step 3: Calculate discount
  const discountPercentage = ((product.price - applicablePrice) / product.price) * 100;
  
  return res.json(
    new ApiResponse(200, {
      product: {
        _id: product._id,
        name: product.name,
        productCode: product.productCode,
        basePrice: product.price
      },
      pricing: {
        quantity: qty,
        unitPrice: applicablePrice,
        totalPrice,
        unit: product.unit,
        discountPercentage: discountPercentage.toFixed(2)
      },
      pricingTiers: product.pricingTiers
    }, "Pricing calculated successfully")
  );
});
```

**Response Example:**
```json
{
  "success": true,
  "data": {
    "product": {
      "_id": "product_id_1",
      "name": "Rock Salt",
      "productCode": "ROCK-001",
      "basePrice": 250
    },
    "pricing": {
      "quantity": 250,
      "unitPrice": 245,
      "totalPrice": 61250,
      "unit": "kg",
      "discountPercentage": "2.00"
    },
    "pricingTiers": [
      { "minQty": 100, "maxQty": 500, "price": 245 },
      { "minQty": 501, "maxQty": 1000, "price": 240 },
      { "minQty": 1001, "price": 235 }
    ]
  }
}
```

#### **D. CREATE Product (Admin Only)**

**Endpoint:** `POST /api/v1/products`

**Auth:** Admin only (verified by RBAC middleware)

**Request:**
```json
{
  "name": "Rock Salt - Industrial Grade",
  "description": "High-quality industrial salt for de-icing...",
  "productCode": "ROCK-001",
  "category": "Industrial Salt",
  "price": 250,
  "MOQ": 100,
  "stockQty": 5000,
  "reorderLevel": 500,
  "unit": "kg",
  "supplier": "Local Supplier",
  "hsn": "25012100",
  "pricingTiers": [
    { "minQty": 100, "maxQty": 500, "price": 245 },
    { "minQty": 501, "maxQty": 1000, "price": 240 },
    { "minQty": 1001, "price": 235 }
  ]
}
```

```javascript
export const createProduct = asyncHandler(async (req, res) => {
  const { name, description, productCode, category, price, MOQ, stockQty, reorderLevel, unit, supplier, hsn, pricingTiers } = req.body;
  
  // Step 1: Validate required fields
  if (!name || !description || !productCode || !price || !MOQ || !category) {
    throw new ApiError(400, "Missing required fields");
  }
  
  // Step 2: Check for duplicate product code
  const existingProduct = await Product.findOne({ productCode: productCode.toUpperCase() });
  if (existingProduct) {
    throw new ApiError(400, "Product code already exists");
  }
  
  // Step 3: Validate pricing tiers
  if (pricingTiers && pricingTiers.length > 0) {
    for (const tier of pricingTiers) {
      if (!tier.minQty || !tier.price) {
        throw new ApiError(400, "Each pricing tier must have minQty and price");
      }
      if (tier.minQty < MOQ) {
        throw new ApiError(400, `Pricing tier minimum (${tier.minQty}) cannot be less than MOQ (${MOQ})`);
      }
    }
  }
  
  // Step 4: Create product
  const product = await Product.create({
    name: name.trim(),
    description: description.trim(),
    productCode: productCode.toUpperCase(),
    category: category.trim(),
    price,
    MOQ,
    stockQty: stockQty || 0,
    reorderLevel: reorderLevel || MOQ,
    unit: unit || "kg",
    supplier: supplier?.trim(),
    hsn: hsn?.trim(),
    pricingTiers: pricingTiers || [],
    isActive: true,
    isDeleted: false
  });
  
  // Step 5: Log audit trail
  await AuditLog.create({
    actorId: req.user._id,
    actorRole: req.user.role,
    action: "PRODUCT_ADDED",
    targetCollection: "Product",
    targetId: product._id,
    afterSnapshot: product.toObject(),
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });
  
  return res.status(201).json(
    new ApiResponse(201, product, "Product created successfully")
  );
});
```

#### **E. UPDATE Product (Admin Only)**

**Endpoint:** `PUT /api/v1/products/:id`

```javascript
export const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  
  // Step 1: Find product
  const product = await Product.findOne({ _id: id, isDeleted: false });
  if (!product) {
    throw new ApiError(404, "Product not found");
  }
  
  // Step 2: Store before snapshot for audit
  const beforeSnapshot = product.toObject();
  
  // Step 3: Update allowed fields
  const allowedFields = ['name', 'description', 'price', 'stockQty', 'reorderLevel', 'category', 'pricingTiers', 'supplier', 'hsn'];
  
  for (const field of allowedFields) {
    if (field in updates) {
      // Validate based on field
      if (field === 'price' && updates[field] < 0) {
        throw new ApiError(400, "Price cannot be negative");
      }
      if (field === 'stockQty' && updates[field] < 0) {
        throw new ApiError(400, "Stock cannot be negative");
      }
      
      product[field] = updates[field];
    }
  }
  
  await product.save();
  
  // Step 4: Log audit trail
  await AuditLog.create({
    actorId: req.user._id,
    actorRole: req.user.role,
    action: "PRODUCT_UPDATED",
    targetCollection: "Product",
    targetId: product._id,
    beforeSnapshot,
    afterSnapshot: product.toObject(),
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });
  
  return res.json(
    new ApiResponse(200, product, "Product updated successfully")
  );
});
```

#### **F. DELETE Product (Soft Delete)**

**Endpoint:** `DELETE /api/v1/products/:id`

```javascript
export const deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const product = await Product.findOne({ _id: id, isDeleted: false });
  if (!product) {
    throw new ApiError(404, "Product not found");
  }
  
  const beforeSnapshot = product.toObject();
  
  // Soft delete (mark as deleted, don't remove from DB)
  product.isDeleted = true;
  product.isActive = false;
  await product.save();
  
  // Audit log
  await AuditLog.create({
    actorId: req.user._id,
    actorRole: req.user.role,
    action: "PRODUCT_DELETED",
    targetCollection: "Product",
    targetId: product._id,
    beforeSnapshot,
    afterSnapshot: product.toObject(),
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });
  
  return res.json(
    new ApiResponse(200, null, "Product deleted successfully")
  );
});
```

**Why Soft Delete?**
- Preserves data for audit trail
- Can restore if needed
- No data loss
- Historical orders still reference the product

#### **G. RESTOCK Product**

**Endpoint:** `POST /api/v1/products/:id/restock`

**Request:**
```json
{
  "quantity": 1000,
  "notes": "Monthly restocking"
}
```

```javascript
export const restockProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { quantity, notes } = req.body;
  
  if (!quantity || quantity <= 0) {
    throw new ApiError(400, "Quantity must be greater than 0");
  }
  
  const product = await Product.findOne({ _id: id, isDeleted: false });
  if (!product) {
    throw new ApiError(404, "Product not found");
  }
  
  // Step 1: Update stock
  const previousStock = product.stockQty;
  product.stockQty += quantity;
  await product.save();
  
  // Step 2: Create inventory ledger entry
  await InventoryLedger.create({
    productId: product._id,
    changeType: "credit",  // Stock coming in
    quantityChanged: quantity,
    previousQty: previousStock,
    newQty: product.stockQty,
    reason: "restock",
    triggeredBy: req.user._id,
    triggeredByType: "Admin",
    notes: notes || "Manual restock"
  });
  
  // Step 3: Audit log
  await AuditLog.create({
    actorId: req.user._id,
    actorRole: req.user.role,
    action: "RESTOCK_PERFORMED",
    targetCollection: "Product",
    targetId: product._id,
    afterSnapshot: {
      previousStock,
      newStock: product.stockQty,
      quantityAdded: quantity
    },
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });
  
  return res.json(
    new ApiResponse(200, product, "Product restocked successfully")
  );
});
```

#### **H. GET Low Stock Products (Admin)**

**Endpoint:** `GET /api/v1/products/admin/low-stock`

```javascript
export const getLowStockProducts = asyncHandler(async (req, res) => {
  // Find products where stockQty <= reorderLevel
  const lowStockProducts = await Product.find({
    isDeleted: false,
    isActive: true,
    $expr: { $lte: ["$stockQty", "$reorderLevel"] }  // MongoDB comparison
  }).sort({ stockQty: 1 });  // Lowest stock first
  
  return res.json(
    new ApiResponse(200, lowStockProducts, "Low stock products fetched")
  );
});
```

#### **I. GET Product Statistics (Admin)**

**Endpoint:** `GET /api/v1/products/admin/statistics`

```javascript
export const getProductStatistics = asyncHandler(async (req, res) => {
  // Using MongoDB aggregation for complex calculations
  const stats = await Product.aggregate([
    {
      $match: { isDeleted: false }
    },
    {
      $group: {
        _id: null,
        totalProducts: { $sum: 1 },
        activeProducts: {
          $sum: { $cond: ["$isActive", 1, 0] }
        },
        totalStockValue: {
          $sum: { $multiply: ["$stockQty", "$price"] }
        },
        totalStockQty: { $sum: "$stockQty" },
        averagePrice: { $avg: "$price" },
        highestPrice: { $max: "$price" },
        lowestPrice: { $min: "$price" }
      }
    },
    {
      $lookup: {
        from: "products",
        pipeline: [
          { $match: { isDeleted: false, $expr: { $lte: ["$stockQty", "$reorderLevel"] } } },
          { $count: "count" }
        ],
        as: "lowStockCount"
      }
    }
  ]);
  
  const statData = stats[0] || {};
  statData.lowStockProducts = statData.lowStockCount?.[0]?.count || 0;
  
  return res.json(
    new ApiResponse(200, statData, "Product statistics fetched successfully")
  );
});
```

### 3. Pricing Tier Logic

**File:** `src/utils/pricingCalculator.js`

```javascript
export class PricingCalculator {
  /**
   * Calculate price based on quantity and pricing tiers
   * @param {Number} basePrice - Base unit price
   * @param {Number} quantity - Order quantity
   * @param {Array} pricingTiers - Array of pricing tiers
   * @returns {Object} - Pricing details
   */
  static calculatePrice(basePrice, quantity, pricingTiers = []) {
    let applicablePrice = basePrice;
    let applicableTier = null;
    
    // Search for applicable tier
    if (pricingTiers && pricingTiers.length > 0) {
      for (const tier of pricingTiers) {
        const meetsMinimum = quantity >= tier.minQty;
        const meetsMaximum = !tier.maxQty || quantity <= tier.maxQty;
        
        if (meetsMinimum && meetsMaximum) {
          applicablePrice = tier.price;
          applicableTier = tier;
          break;
        }
      }
    }
    
    // Calculate totals
    const totalPrice = quantity * applicablePrice;
    const discount = basePrice - applicablePrice;
    const discountAmount = discount * quantity;
    const discountPercentage = (discount / basePrice) * 100;
    
    return {
      basePrice,
      quantity,
      applicablePrice,
      applicableTier,
      totalPrice,
      discount,
      discountAmount,
      discountPercentage: parseFloat(discountPercentage.toFixed(2)),
      savings: {
        perUnit: discount.toFixed(2),
        total: discountAmount.toFixed(2)
      }
    };
  }
}
```

---

## 🏗️ CODE STRUCTURE & ARCHITECTURE

### Directory Organization

```
radheSaltBackend/
├── src/
│   ├── models/
│   │   ├── admin.model.js          ← Rohit responsibility
│   │   ├── dealer.model.js         ← Rohit responsibility
│   │   ├── product.model.js        ← Rohit responsibility
│   │   └── tokenBlacklist.model.js ← Rohit responsibility
│   │
│   ├── controllers/
│   │   ├── auth.controller.js      ← Rohit responsibility (~300 LOC)
│   │   └── product.controller.js   ← Rohit responsibility (~400 LOC)
│   │
│   ├── routes/
│   │   ├── auth.route.js           ← Rohit responsibility
│   │   └── product.route.js        ← Rohit responsibility
│   │
│   ├── middlewares/
│   │   ├── jwt.middleware.js       ← Rohit responsibility
│   │   └── auth.middleware.js      ← Rohit responsibility
│   │
│   └── utils/
│       └── pricingCalculator.js    ← Rohit responsibility (~100 LOC)
│
└── lib/                             ← Flutter Frontend
    ├── providers/
    │   ├── auth_provider.dart      ← Rohit responsibility
    │   └── product_provider.dart   ← Rohit responsibility
    │
    ├── screens/
    │   ├── auth/
    │   │   ├── login_screen.dart    ← Rohit responsibility
    │   │   └── register_screen.dart ← Rohit responsibility
    │   └── products/
    │       ├── product_list_screen.dart    ← Rohit responsibility
    │       └── product_detail_screen.dart  ← Rohit responsibility
    │
    ├── models/
    │   ├── auth.dart               ← Rohit responsibility
    │   └── product.dart            ← Rohit responsibility
    │
    ├── widgets/
    │   └── product_card.dart       ← Rohit responsibility
    │
    └── services/
        └── api_service.dart        ← Rohit responsibility
```

---

## 🧪 TESTING STRATEGY

### Unit Tests to Write

**File:** `tests/auth.test.js`

```javascript
describe("Authentication System", () => {
  describe("Admin Login", () => {
    test("Should successfully login with valid credentials", async () => {
      const response = await request(app)
        .post("/api/v1/auth/admin/login")
        .send({ email: "admin@radhey.com", password: "Admin@123" });
      
      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty("accessToken");
      expect(response.body.data).toHaveProperty("refreshToken");
      expect(response.body.data.admin.role).toBe("super_admin");
    });
    
    test("Should fail with invalid password", async () => {
      const response = await request(app)
        .post("/api/v1/auth/admin/login")
        .send({ email: "admin@radhey.com", password: "WrongPassword" });
      
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
  
  describe("JWT Verification", () => {
    test("Should verify valid JWT token", async () => {
      // Generate token
      const token = generateTestToken();
      
      const response = await request(app)
        .get("/api/v1/auth/me")
        .set("Authorization", `Bearer ${token}`);
      
      expect(response.status).toBe(200);
    });
    
    test("Should reject expired token", async () => {
      const expiredToken = generateExpiredToken();
      
      const response = await request(app)
        .get("/api/v1/auth/me")
        .set("Authorization", `Bearer ${expiredToken}`);
      
      expect(response.status).toBe(401);
      expect(response.body.message).toContain("expired");
    });
  });
});
```

**File:** `tests/product.test.js`

```javascript
describe("Product Management", () => {
  describe("Get Products", () => {
    test("Should get all products with pagination", async () => {
      const response = await request(app)
        .get("/api/v1/products?page=1&limit=10");
      
      expect(response.status).toBe(200);
      expect(response.body.data.products).toBeInstanceOf(Array);
      expect(response.body.data.pagination).toHaveProperty("totalPages");
    });
  });
  
  describe("Pricing Calculation", () => {
    test("Should calculate correct tier price", async () => {
      const response = await request(app)
        .get("/api/v1/products/123/pricing?quantity=250");
      
      expect(response.status).toBe(200);
      expect(response.body.data.pricing.unitPrice).toBe(245);
      expect(response.body.data.pricing.totalPrice).toBe(61250);
    });
  });
});
```

### Integration Tests

Test complete flows:
- Register → Login → Get Products → Logout
- Create Product → Update Stock → Get Low Stock → Restock
- Login with token → Refresh token → Verify new token works

---

## 🔒 SECURITY CONSIDERATIONS

### 1. Password Security
- **Storage:** bcrypt hashing with 10 salt rounds
- **Transmission:** HTTPS only (enforced in production)
- **Never:** Log, store in plaintext, return in API

### 2. JWT Security
- **Secret:** Long, random, stored in .env
- **Signature:** HMAC-SHA256
- **Storage:** In-memory + secure storage (frontend)
- **Transmission:** Bearer token in Authorization header
- **Refresh Mechanism:** Automatic after 15 minutes

### 3. Token Blacklisting
- **Method:** Store JTI in MongoDB collection
- **Check:** Every request verifies blacklist
- **Cleanup:** TTL index auto-deletes expired entries
- **Prevents:** Token reuse after logout

### 4. RBAC (Role-Based Access Control)
- **Roles:** admin, super_admin, dealer
- **Enforcement:** Middleware checks role before route
- **Data:** Users cannot modify others' data

### 5. Input Validation
- Email format validation
- Phone number (exactly 10 digits)
- Pincode (exactly 6 digits)
- Price (non-negative)
- MOQ (positive integer)

### 6. SQL Injection Prevention
- **Method:** MongoDB parameterized queries
- **Never:** String concatenation in queries
- **Use:** `{ field: { $regex: userInput } }` for searches

### 7. XSS Protection
- **Sanitization:** Trim whitespace, escape HTML
- **Headers:** CSP headers set by middleware
- **Validation:** Type checking all inputs

---

## ⚡ PERFORMANCE OPTIMIZATION

### 1. Database Indexing
```javascript
productSchema.index({ productCode: 1 });        // Unique queries
productSchema.index({ category: 1 });           // Filter queries
productSchema.index({ isActive: 1 });           // Visibility queries
productSchema.index({ stockQty: 1 });           // Low stock queries
```

### 2. Query Optimization
- **Use Projections:** `select("-isDeleted")` - exclude unnecessary fields
- **Use Lean Queries:** `.lean()` for read-only operations
- **Limit Results:** Pagination prevents loading all records

### 3. Caching Strategy
- Frontend caches product list (15 minutes)
- Auth tokens cached in-memory
- Refresh tokens checked only on token expiration

### 4. Connection Pooling
- MongoDB connection pool (default 10 connections)
- Reuse connections, don't create new ones per request

---

## ⚠️ ERROR HANDLING

**Centralized Error Class:**
```javascript
export class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

// Usage:
throw new ApiError(404, "Product not found");
```

**Error Handler Middleware:**
```javascript
export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  
  res.status(statusCode).json({
    success: false,
    message,
    statusCode
  });
};
```

**Common Error Codes:**
- 400: Bad Request (validation error)
- 401: Unauthorized (invalid/missing token)
- 403: Forbidden (insufficient permissions)
- 404: Not Found (resource doesn't exist)
- 500: Server Error (unexpected issue)

---

## 📅 TIMELINE & MILESTONES

### Week 1-2: Planning & Database Design
**Deliverables:**
- ✅ Admin schema designed & reviewed
- ✅ Dealer schema designed & reviewed
- ✅ Product schema designed & reviewed
- ✅ API endpoints documented
- ✅ Mobile app UI mockups (Figma/Sketch)

**Tasks:**
- Study existing codebase
- Design database schemas
- Plan API contracts
- Set up Git repository
- Create development environment

### Week 2-3: Authentication Implementation
**Deliverables:**
- ✅ Admin model with JWT methods (~100 LOC)
- ✅ Dealer model with JWT methods (~100 LOC)
- ✅ TokenBlacklist model (~50 LOC)
- ✅ Auth controller (~300 LOC)
- ✅ JWT middleware (~50 LOC)
- ✅ Auth routes (~40 LOC)
- ✅ Auth endpoints tested & working

**Tasks:**
- Implement models with bcrypt hashing
- Implement JWT generation & verification
- Implement token refresh mechanism
- Implement logout with blacklisting
- Write unit tests for auth
- Create postman collection for testing

### Week 3-5: Product Management & Frontend
**Deliverables:**
- ✅ Product model (~80 LOC)
- ✅ Product controller with CRUD (~400 LOC)
- ✅ Pricing calculator utility (~100 LOC)
- ✅ Product routes (~50 LOC)
- ✅ Dealer mobile app (5 screens, ~1000 LOC)
- ✅ State management with Riverpod (~200 LOC)
- ✅ API service layer (~150 LOC)

**Tasks:**
- Implement product CRUD endpoints
- Implement pricing tier logic
- Implement low stock detection
- Implement product analytics
- Build mobile UI screens
- Implement auth flow in mobile app
- Implement product browsing in mobile app
- Test all endpoints with Postman

### Week 5-6: Integration & Testing
**Deliverables:**
- ✅ Complete auth flow working (register → login → use API → logout)
- ✅ Product creation & display working
- ✅ Pricing calculation verified
- ✅ All unit tests passing (>80% coverage)
- ✅ Integration tests passing
- ✅ Mobile app UI responsive & functional

**Tasks:**
- Write comprehensive unit tests
- Write integration tests
- Test edge cases
- Performance testing
- Mobile app testing on real devices/emulator
- Fix bugs & issues
- Optimize query performance

### Week 6-8: Documentation & Polishing
**Deliverables:**
- ✅ Project Overview section written (400 words)
- ✅ Technology Stack section written (500 words)
- ✅ Security Implementation section written (800 words)
- ✅ Mobile App Deployment section written (400 words)
- ✅ 5 diagrams created (auth flow, pricing, JWT lifecycle, DB relationships, UI mockups)
- ✅ API documentation complete
- ✅ Code comments & documentation
- ✅ README with setup instructions

**Tasks:**
- Write report sections
- Create technical diagrams
- Document API endpoints
- Add code comments
- Test all features
- Performance optimization
- Final bug fixes
- Prepare for presentation

---

## 📋 DELIVERABLES CHECKLIST

### Backend Code
- [ ] Admin model with JWT methods
- [ ] Dealer model with JWT methods
- [ ] TokenBlacklist model
- [ ] Product model with indexing
- [ ] Auth controller (6 endpoints)
- [ ] Product controller (9 endpoints)
- [ ] JWT middleware
- [ ] Auth middleware
- [ ] Pricing calculator utility
- [ ] Auth routes
- [ ] Product routes
- [ ] Error handling implemented
- [ ] Logging integrated

### Frontend Code
- [ ] Auth provider (Riverpod)
- [ ] Product provider (Riverpod)
- [ ] Login screen UI
- [ ] Register screen UI
- [ ] Product list screen
- [ ] Product detail screen
- [ ] Product card widget
- [ ] API service layer
- [ ] Error handling in UI
- [ ] Loading states
- [ ] Responsive design

### Testing
- [ ] Unit tests (auth & products)
- [ ] Integration tests (complete flows)
- [ ] Mobile app testing (functional)
- [ ] Postman collection created
- [ ] >80% test coverage

### Documentation
- [ ] Project Overview (300-400 words)
- [ ] Technology Stack (400-500 words)
- [ ] Security Implementation (600-800 words)
- [ ] Mobile App Deployment (300-400 words)
- [ ] Authentication flow diagram
- [ ] Product browsing workflow
- [ ] JWT lifecycle diagram
- [ ] Database relationships diagram
- [ ] Mobile app UI mockups (3-4 screens)
- [ ] API documentation with examples
- [ ] Code comments on complex logic
- [ ] README with setup instructions

### Presentation Ready
- [ ] Code well-organized & commented
- [ ] All tests passing
- [ ] All features working
- [ ] Performance optimized
- [ ] Security validated
- [ ] Documentation complete
- [ ] Ready for viva questions

---

## 🎓 KEY CONCEPTS ROHIT SHOULD UNDERSTAND

1. **JWT Tokens**
   - How they work (header.payload.signature)
   - Why refresh tokens are needed
   - How blacklisting prevents token reuse

2. **Database Design**
   - Schema design for flexibility
   - Indexing for performance
   - Relationships between collections

3. **API Design**
   - RESTful principles
   - Proper HTTP status codes
   - Request/response formats
   - Pagination & filtering

4. **Security**
   - Password hashing (bcrypt)
   - Token-based authentication
   - RBAC implementation
   - Input validation

5. **Flutter Development**
   - State management with Riverpod
   - Async operations & futures
   - UI building with widgets
   - API integration

6. **Performance**
   - Database indexing
   - Query optimization
   - Caching strategies
   - Pagination for large datasets

---

## 📞 COMMON QUESTIONS FOR VIVA

**Q: Why use JWT instead of session-based auth?**
A: JWT is stateless, scalable, and works well for mobile apps. No server-side session storage needed.

**Q: What if JWT secret is compromised?**
A: Rotate the secret immediately. Old tokens would become invalid. Use strong, random secrets.

**Q: Why 15-minute access token and 7-day refresh token?**
A: Short access token minimizes damage if compromised. Refresh token gives flexibility for users.

**Q: How does token blacklisting work?**
A: When user logs out, we store the JWT ID in DB. Every request checks if token is blacklisted.

**Q: Why soft delete instead of hard delete?**
A: Preserves audit trail, allows data recovery, and historical orders still reference products.

**Q: How are pricing tiers applied?**
A: We find the tier that matches the order quantity and use that price tier.

**Q: What prevents SQL injection in MongoDB?**
A: We use parameterized queries, never concatenate strings into queries.

---

**Document Version:** 1.0  
**Last Updated:** April 28, 2026  
**Status:** Ready for Implementation
