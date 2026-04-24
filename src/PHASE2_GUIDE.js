/**
 * PHASE 2: AUTHENTICATION MODULE - QUICK REFERENCE GUIDE
 * 
 * Complete JWT authentication system with token blacklisting and RBAC
 */

// ============================================================
// PUBLIC API ENDPOINTS (No Authentication Required)
// ============================================================

/**
 * 1. ADMIN LOGIN
 * POST /api/v1/auth/admin/login
 * 
 * Request Body:
 * {
 *   "email": "admin@radhesalt.com",
 *   "password": "SecurePassword123"
 * }
 * 
 * Response (200):
 * {
 *   "success": true,
 *   "statusCode": 200,
 *   "data": {
 *     "admin": { _id, name, email, role, ... },
 *     "accessToken": "eyJhbGc...",
 *     "refreshToken": "eyJhbGc..."
 *   },
 *   "message": "Admin login successful"
 * }
 * 
 * Cookies Set:
 * - accessToken (httpOnly, 24 hours)
 * - refreshToken (httpOnly, 24 hours)
 * 
 * Error Responses:
 * - 400: Email and password are required
 * - 401: Invalid email or password
 * - 403: Admin account is inactive
 */

/**
 * 2. DEALER LOGIN
 * POST /api/v1/auth/dealer/login
 * 
 * Request Body (email):
 * {
 *   "email": "dealer@business.com",
 *   "password": "SecurePassword123"
 * }
 * 
 * Request Body (phone):
 * {
 *   "phone": "9876543210",
 *   "password": "SecurePassword123"
 * }
 * 
 * Response (200):
 * {
 *   "success": true,
 *   "data": {
 *     "dealer": { _id, name, email, phone, status, ... },
 *     "accessToken": "eyJhbGc...",
 *     "refreshToken": "eyJhbGc..."
 *   },
 *   "message": "Dealer login successful"
 * }
 * 
 * Error Responses:
 * - 400: Email/Phone and password are required
 * - 401: Invalid credentials
 * - 403: Dealer account is [inactive/suspended]
 */

// ============================================================
// PROTECTED API ENDPOINTS (Authentication Required)
// ============================================================

/**
 * 3. LOGOUT
 * POST /api/v1/auth/logout
 * 
 * Headers:
 * - Authorization: Bearer <accessToken>
 * OR
 * - Cookie: accessToken=<token>
 * 
 * Response (200):
 * {
 *   "success": true,
 *   "data": {},
 *   "message": "Logout successful"
 * }
 * 
 * Action:
 * - Extracts jti from token
 * - Adds jti to token_blacklist collection
 * - Token immediately rejected on all future requests
 * - TTL index auto-deletes entry after expiry
 * 
 * Error Responses:
 * - 401: Access token is missing
 * - 401: Token has been revoked
 * - 401: Access token has expired
 */

/**
 * 4. REFRESH ACCESS TOKEN
 * POST /api/v1/auth/refresh
 * 
 * Headers:
 * - Cookie: refreshToken=<refreshToken>
 * OR in Body/Header: x-refresh-token
 * 
 * Response (200):
 * {
 *   "success": true,
 *   "data": {
 *     "accessToken": "eyJhbGc..."
 *   },
 *   "message": "Access token refreshed"
 * }
 * 
 * Cookie Set:
 * - New accessToken (httpOnly)
 * 
 * Error Responses:
 * - 401: Refresh token is missing
 * - 401: Invalid or expired refresh token
 * - 401: User not found
 */

/**
 * 5. CHANGE PASSWORD
 * POST /api/v1/auth/change-password
 * 
 * Headers:
 * - Authorization: Bearer <accessToken>
 * 
 * Request Body:
 * {
 *   "oldPassword": "OldPassword123",
 *   "newPassword": "NewPassword456",
 *   "confirmPassword": "NewPassword456"
 * }
 * 
 * Response (200):
 * {
 *   "success": true,
 *   "data": {},
 *   "message": "Password changed successfully. Please login again."
 * }
 * 
 * Actions:
 * - Updates password in database
 * - Hashes new password with bcrypt
 * - Blacklists current token (forces re-login)
 * - Clears all cookies
 * 
 * Error Responses:
 * - 400: All fields are required
 * - 400: New passwords do not match
 * - 400: New password must be at least 6 characters
 * - 401: Old password is incorrect
 * - 401: User not authenticated
 * - 404: User not found
 */

/**
 * 6. GET CURRENT USER
 * GET /api/v1/auth/me
 * 
 * Headers:
 * - Authorization: Bearer <accessToken>
 * 
 * Response (200):
 * {
 *   "success": true,
 *   "data": {
 *     "_id": "507f1f77bcf86cd799439011",
 *     "email": "user@example.com",
 *     "name": "John Doe",
 *     "role": "admin",
 *     "iat": 1234567890,
 *     "exp": 1234654290,
 *     "jti": "abc123xyz..."
 *   },
 *   "message": "Current user retrieved"
 * }
 * 
 * Error Responses:
 * - 401: User not authenticated
 * - 401: Token has been revoked
 */

// ============================================================
// JWT TOKEN STRUCTURE
// ============================================================

/**
 * ACCESS TOKEN PAYLOAD:
 * {
 *   "_id": "507f1f77bcf86cd799439011",      // User ID
 *   "email": "user@example.com",
 *   "name": "John Doe",
 *   "role": "admin" | "dealer",             // Role
 *   "jti": "abc123xyz...",                  // JWT ID (for revocation)
 *   "iat": 1234567890,                      // Issued at
 *   "exp": 1234654290                       // Expires at (1 day)
 * }
 * 
 * REFRESH TOKEN PAYLOAD:
 * {
 *   "_id": "507f1f77bcf86cd799439011",
 *   "iat": 1234567890,
 *   "exp": 1235259090                       // Expires at (7 days)
 * }
 */

// ============================================================
// TOKEN BLACKLIST MECHANISM
// ============================================================

/**
 * HOW BLACKLISTING WORKS:
 * 
 * 1. User logs out:
 *    - POST /api/v1/auth/logout
 *    - Extract jti from token
 *    - Create TokenBlacklist entry: {jti, userId, reason, expiresAt}
 * 
 * 2. Every protected request:
 *    - JWT middleware extracts token
 *    - Verifies JWT signature
 *    - Queries token_blacklist for jti
 *    - If found: reject (401 Revoked)
 *    - If not found: continue
 * 
 * 3. Automatic cleanup:
 *    - TTL index on expiresAt
 *    - MongoDB auto-deletes after expiry
 *    - No manual maintenance required
 */

// ============================================================
// MIDDLEWARE ARCHITECTURE
// ============================================================

/**
 * JWT VERIFICATION MIDDLEWARE: verifyJWT
 * Location: src/middlewares/jwt.middleware.js
 * 
 * Flow:
 * 1. Extract token from Authorization header or cookies
 * 2. Verify JWT signature
 * 3. Check if jti is in token_blacklist
 * 4. Attach user details to req.user
 * 5. Call next() if valid
 * 6. Throw ApiError(401) if invalid
 * 
 * Usage:
 * router.post("/endpoint", verifyJWT, controllerFunction)
 * 
 * req.user will contain:
 * {
 *   "_id": "...",
 *   "email": "...",
 *   "role": "...",
 *   "jti": "...",
 *   "exp": "...",
 *   "ipAddress": "192.168.1.1"  // Added by middleware
 * }
 */

/**
 * OPTIONAL JWT MIDDLEWARE: verifyJWTOptional
 * Location: src/middlewares/jwt.middleware.js
 * 
 * Similar to verifyJWT but:
 * - Does NOT throw error if token missing
 * - Continues without req.user if token invalid
 * - Useful for public endpoints that support auth
 * 
 * Usage:
 * router.get("/products", verifyJWTOptional, getProducts)
 */

/**
 * ROLE-BASED ACCESS CONTROL: verifyRole
 * Location: src/middlewares/rbac.middleware.js
 * 
 * Purpose: Verify user has required role
 * 
 * Usage:
 * router.delete("/products/:id", verifyJWT, verifyRole(["admin", "super_admin"]), deleteProduct)
 * 
 * Parameters:
 * - allowedRoles: Array of role strings
 * 
 * Roles Available:
 * - "admin"
 * - "super_admin"
 * - "dealer"
 * 
 * Shorthand Middlewares:
 * - verifyAdminRole: Checks for admin or super_admin
 * - verifySuperAdminRole: Checks for super_admin only
 * - verifyDealerRole: Checks for dealer only
 */

/**
 * OWNER OR ADMIN MIDDLEWARE: verifyOwnerOrAdmin
 * Location: src/middlewares/rbac.middleware.js
 * 
 * Purpose: Allow access if user is resource owner OR admin
 * 
 * Usage:
 * router.put("/dealers/:dealerId", verifyJWT, verifyOwnerOrAdmin("dealerId"), updateDealer)
 * 
 * Parameters:
 * - resourceUserIdField: Field name containing user ID
 * 
 * Behavior:
 * - Allow if user.role is admin/super_admin
 * - Allow if user._id matches resourceUserId
 * - Reject otherwise (403 Forbidden)
 */

// ============================================================
// COMMON MIDDLEWARE PATTERNS
// ============================================================

/**
 * PATTERN 1: Admin-Only Endpoint
 * router.delete("/products/:id", verifyJWT, verifyAdminRole, deleteProduct)
 * 
 * PATTERN 2: Dealer-Only Endpoint
 * router.post("/orders", verifyJWT, verifyDealerRole, createOrder)
 * 
 * PATTERN 3: Owner or Admin
 * router.put("/dealers/:id", verifyJWT, verifyOwnerOrAdmin("id"), updateDealer)
 * 
 * PATTERN 4: Public with Optional Auth
 * router.get("/products", verifyJWTOptional, getProducts)
 * 
 * PATTERN 5: Multiple Roles
 * router.post("/orders", verifyJWT, verifyRole(["dealer", "admin"]), createOrder)
 */

// ============================================================
// ERROR HANDLING
// ============================================================

/**
 * 401 ERRORS (Unauthorized):
 * - Access token is missing
 * - Invalid access token
 * - Token has been revoked
 * - Access token has expired
 * - Invalid email or password
 * - User not authenticated
 * 
 * 403 ERRORS (Forbidden):
 * - Admin account is inactive
 * - Dealer account is inactive/suspended
 * - Access denied. Required role(s): admin
 * - You do not have permission to access this resource
 * 
 * 400 ERRORS (Bad Request):
 * - Email and password are required
 * - New passwords do not match
 * - All fields are required
 * 
 * 404 ERRORS (Not Found):
 * - User not found
 * - Admin not found
 * - Dealer not found
 * 
 * 409 ERRORS (Conflict):
 * - User with email already exists
 * - Dealer with email already exists
 */

// ============================================================
// CLIENT-SIDE IMPLEMENTATION GUIDE
// ============================================================

/**
 * FLUTTER/JAVASCRIPT CLIENT SETUP:
 * 
 * 1. STORE TOKENS:
 *    - Save accessToken from login response
 *    - Save refreshToken from login response
 *    - Store in secure storage (localStorage, SharedPreferences)
 * 
 * 2. MAKE AUTHENTICATED REQUESTS:
 *    - Add Authorization header: "Bearer <accessToken>"
 *    - OR use cookies if set to httpOnly
 * 
 * 3. HANDLE TOKEN EXPIRY:
 *    - Catch 401 response
 *    - Call POST /api/v1/auth/refresh
 *    - Get new accessToken
 *    - Retry original request
 * 
 * 4. LOGOUT:
 *    - Call POST /api/v1/auth/logout
 *    - Clear local storage
 *    - Redirect to login page
 * 
 * 5. CHANGE PASSWORD:
 *    - Call POST /api/v1/auth/change-password
 *    - User will be logged out (token blacklisted)
 *    - Force re-login with new password
 */

// ============================================================
// SECURITY BEST PRACTICES IMPLEMENTED
// ============================================================

/**
 * ✅ PASSWORD SECURITY:
 *    - Hashed with bcrypt (cost factor: 10)
 *    - Never stored in plain text
 *    - Never returned in API responses
 * 
 * ✅ TOKEN SECURITY:
 *    - JWT signed with SECRET
 *    - Includes unique jti claim
 *    - Expiry set to 1 day (access)
 *    - Refresh token separate (7 days)
 * 
 * ✅ TOKEN REVOCATION:
 *    - Logout adds jti to blacklist
 *    - Checked on every protected request
 *    - TTL auto-deletes after expiry
 * 
 * ✅ COOKIE SECURITY:
 *    - httpOnly: Prevents XSS attacks
 *    - secure: HTTPS only in production
 *    - sameSite: strict - CSRF protection
 * 
 * ✅ ROLE ENFORCEMENT:
 *    - Roles checked at middleware level
 *    - Before business logic executes
 *    - Consistent enforcement across all endpoints
 * 
 * ✅ AUDIT TRAIL:
 *    - Login/logout tracked
 *    - IP address logged
 *    - Can be extended to audit_logs collection
 */

export const PHASE2_COMPLETE = true;
