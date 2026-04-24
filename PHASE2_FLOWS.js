/**
 * PHASE 2: AUTHENTICATION FLOW DIAGRAMS
 * Visual representation of middleware and authentication flows
 */

// ============================================================
// FLOW 1: LOGIN FLOW (Admin or Dealer)
// ============================================================
/**
 * CLIENT                          BACKEND
 *   |                                |
 *   | POST /auth/admin/login          |
 *   |-------- email + password ------>|
 *   |                                 | Check email in Admin collection
 *   |                                 | Verify password with bcrypt
 *   |                                 | Password incorrect? → 401
 *   |                                 | Account inactive? → 403
 *   |                                 | Generate JWT with jti claim
 *   |                                 | Generate Refresh token
 *   |                                 | Update lastLogin timestamp
 *   |                                 | Return tokens + user data
 *   |<----- { accessToken, ...} ------|
 *   |<----- Set Cookie: accessToken --|
 *   |<----- Set Cookie: refreshToken -|
 *   |
 * RESULT: User logged in with tokens stored
 */

// ============================================================
// FLOW 2: PROTECTED REQUEST FLOW
// ============================================================
/**
 * CLIENT                          BACKEND
 *   |                                |
 *   | GET /api/v1/products            |
 *   | Header: Authorization: Bearer <token>
 *   |----------- token ------------>|
 *   |                                 | verifyJWT Middleware
 *   |                                 | ├─ Extract token from header/cookie
 *   |                                 | ├─ Verify signature using JWT_SECRET
 *   |                                 | ├─ Check if token expired? → 401
 *   |                                 | ├─ Extract jti from decoded token
 *   |                                 | ├─ Query token_blacklist
 *   |                                 | ├─ If found? → 401 (revoked)
 *   |                                 | └─ Attach user to req.user
 *   |                                 |
 *   |                                 | verifyRole Middleware (if needed)
 *   |                                 | ├─ Check req.user.role
 *   |                                 | ├─ Is role in allowedRoles? 
 *   |                                 | └─ If no → 403 (forbidden)
 *   |                                 |
 *   |                                 | Controller Logic
 *   |                                 | ├─ Execute business logic
 *   |                                 | └─ Return response
 *   |<---------- response ----------|
 *   |
 * RESULT: Request processed with authenticated user
 */

// ============================================================
// FLOW 3: LOGOUT FLOW WITH BLACKLISTING
// ============================================================
/**
 * CLIENT                          BACKEND
 *   |                                |
 *   | POST /auth/logout               |
 *   | Header: Authorization: Bearer <accessToken>
 *   |----------- token ------------>|
 *   |                                 | verifyJWT Middleware
 *   |                                 | ├─ Extract & verify token
 *   |                                 | ├─ Check blacklist (not yet)
 *   |                                 | └─ Attach user to req.user
 *   |                                 |
 *   |                                 | logout Controller
 *   |                                 | ├─ Extract jti from token
 *   |                                 | ├─ Create TokenBlacklist entry:
 *   |                                 | │  - jti: token ID
 *   |                                 | │  - userId: user._id
 *   |                                 | │  - reason: "logout"
 *   |                                 | │  - expiresAt: token expiry time
 *   |                                 | ├─ Save to database
 *   |                                 | ├─ Clear accessToken cookie
 *   |                                 | ├─ Clear refreshToken cookie
 *   |                                 | └─ Return success
 *   |<---------- { success } --------|
 *   |
 * NEXT REQUEST WITH SAME TOKEN:
 *   |                                 |
 *   | GET /api/v1/products            |
 *   | Header: Authorization: Bearer <OLD_TOKEN>
 *   |----------- token ------------>|
 *   |                                 | verifyJWT Middleware
 *   |                                 | ├─ Extract & verify signature (OK)
 *   |                                 | ├─ Extract jti
 *   |                                 | ├─ Query token_blacklist
 *   |                                 | ├─ FOUND! (entry exists)
 *   |                                 | └─ → 401 Unauthorized
 *   |<---------- 401 Error ---------|
 *   |
 * RESULT: Old token cannot be used even if cryptographically valid
 */

// ============================================================
// FLOW 4: ROLE-BASED ACCESS CONTROL
// ============================================================
/**
 * SCENARIO: Admin deleting a product
 * 
 * CLIENT                          BACKEND
 *   |                                |
 *   | DELETE /api/v1/products/:id     |
 *   | Header: Authorization: Bearer <token>
 *   |----------- token ------------>|
 *   |                                 | verifyJWT Middleware ✓
 *   |                                 | ├─ Verify token
 *   |                                 | ├─ Check blacklist
 *   |                                 | └─ Attach user: {
 *   |                                 |    role: "admin",
 *   |                                 |    _id: "507f1...",
 *   |                                 |    email: "admin@.."
 *   |                                 |  }
 *   |                                 |
 *   |                                 | verifyAdminRole Middleware
 *   |                                 | ├─ Check req.user.role
 *   |                                 | ├─ Is "admin" in ["admin", "super_admin"]?
 *   |                                 | ├─ YES! ✓
 *   |                                 | └─ Continue to controller
 *   |                                 |
 *   |                                 | deleteProduct Controller
 *   |                                 | ├─ Execute deletion
 *   |                                 | ├─ Log to audit_logs
 *   |                                 | └─ Return success
 *   |<---------- { success } --------|
 *   |
 * 
 * SCENARIO: Dealer trying to delete a product
 * 
 * CLIENT                          BACKEND
 *   |                                |
 *   | DELETE /api/v1/products/:id     |
 *   | Header: Authorization: Bearer <token>
 *   |----------- token ------------>|
 *   |                                 | verifyJWT Middleware ✓
 *   |                                 | ├─ Verify & attach user: {
 *   |                                 |    role: "dealer",
 *   |                                 |    ...
 *   |                                 |  }
 *   |                                 |
 *   |                                 | verifyAdminRole Middleware
 *   |                                 | ├─ Check req.user.role
 *   |                                 | ├─ Is "dealer" in ["admin", "super_admin"]?
 *   |                                 | ├─ NO! ✗
 *   |                                 | ├─ Throw ApiError(403)
 *   |                                 | └─ Return error response
 *   |<---------- 403 Forbidden -------|
 *   |<---------- "Access denied" -----|
 *   |
 * RESULT: Role enforcement prevents unauthorized access
 */

// ============================================================
// FLOW 5: TOKEN REFRESH FLOW
// ============================================================
/**
 * SCENARIO: Access token expired, need new one
 * 
 * CLIENT                          BACKEND
 *   |                                |
 *   | GET /api/v1/products            |
 *   | Header: Authorization: Bearer <EXPIRED_TOKEN>
 *   |----------- token ------------>|
 *   |                                 | verifyJWT Middleware
 *   |                                 | ├─ Extract token
 *   |                                 | ├─ Verify signature
 *   |                                 | ├─ Check expiry
 *   |                                 | └─ → 401 TokenExpiredError
 *   |<---------- 401 Expired --------|
 *   |
 *   | (Client detects expiry)
 *   |
 *   | POST /auth/refresh              |
 *   | Cookie: refreshToken=<token>
 *   |--- refresh token ------------->|
 *   |                                 | Verify refresh token signature
 *   |                                 | Extract user._id
 *   |                                 | Query Admin/Dealer collection
 *   |                                 | Generate NEW accessToken
 *   |                                 | Set Cookie: new accessToken
 *   |                                 | Return new token
 *   |<---------- { accessToken } ----|
 *   |<---------- Set Cookie ---------|
 *   |
 *   | Retry original request
 *   | GET /api/v1/products            |
 *   | Header: Authorization: Bearer <NEW_TOKEN>
 *   |----------- token ------------>|
 *   |                                 | verifyJWT Middleware ✓
 *   |                                 | ├─ Verify signature (OK)
 *   |                                 | ├─ Check expiry (OK - fresh)
 *   |                                 | ├─ Check blacklist (OK)
 *   |                                 | └─ Continue
 *   |                                 |
 *   |                                 | Controller executes normally
 *   |<---------- response ----------|
 *   |
 * RESULT: Transparent token refresh without user intervention
 */

// ============================================================
// FLOW 6: TOKEN BLACKLIST CLEANUP (TTL Index)
// ============================================================
/**
 * TIMELINE:
 * 
 * Day 1, 3:00 PM: User logs out
 * ├─ Token added to blacklist
 * ├─ expiresAt = current_date + 1 day (3:00 PM Day 2)
 * └─ Entry: { jti, userId, expiresAt: 2024-04-25T15:00:00 }
 * 
 * Day 2, 3:00 PM: (Automatic - MongoDB manages)
 * ├─ TTL index checks all documents
 * ├─ Compares expiresAt to current time
 * ├─ If expiresAt <= current_time
 * └─ Auto-delete document (MongoDB background task)
 * 
 * RESULT: No manual cleanup needed, collection stays lean
 * 
 * TTL Index Definition:
 * db.token_blacklist.createIndex(
 *   { expiresAt: 1 },
 *   { expireAfterSeconds: 0 }  // Delete immediately at expiry
 * );
 */

// ============================================================
// FLOW 7: PASSWORD CHANGE WITH TOKEN REVOCATION
// ============================================================
/**
 * CLIENT                          BACKEND
 *   |                                |
 *   | POST /auth/change-password      |
 *   | Header: Authorization: Bearer <token>
 *   | Body: { oldPassword, newPassword }
 *   |----------- request ----------->|
 *   |                                 | verifyJWT Middleware ✓
 *   |                                 |
 *   |                                 | changePassword Controller
 *   |                                 | ├─ Verify oldPassword
 *   |                                 | ├─ Hash newPassword with bcrypt
 *   |                                 | ├─ Update in database
 *   |                                 | ├─ Blacklist current token:
 *   |                                 | │  - jti: token jti
 *   |                                 | │  - reason: "password_change"
 *   |                                 | │  - expiresAt: token expiry
 *   |                                 | ├─ Clear all cookies
 *   |                                 | └─ Return message: "Please login again"
 *   |<---------- success message ----|
 *   |<---------- Clear Cookies -------|
 *   |
 * NEXT REQUEST WITH OLD TOKEN:
 *   |                                 |
 *   | GET /api/v1/products            |
 *   | (Using same old token)           |
 *   |----------- token ------------>|
 *   |                                 | verifyJWT checks blacklist
 *   |                                 | → 401 Token Revoked
 *   |<---------- 401 Error ---------|
 *   |
 *   | (Client must re-login)
 *   |
 * RESULT: Old token revoked, user forced to login with new credentials
 */

// ============================================================
// MIDDLEWARE STACK VISUALIZATION
// ============================================================
/**
 * PROTECTED ROUTE EXECUTION ORDER:
 * 
 * Request arrives
 *   ↓
 * CORS Middleware (Allow cross-origin)
 *   ↓
 * Body Parser Middleware (Parse JSON)
 *   ↓
 * Morgan Middleware (Log request)
 *   ↓
 * Rate Limiter Middleware (100 req/min per IP)
 *   ↓
 * verifyJWT Middleware ← auth middlewares start here
 * ├─ Extract token
 * ├─ Verify signature
 * ├─ Check blacklist
 * └─ Attach req.user
 *   ↓
 * verifyRole Middleware (optional)
 * ├─ Check user.role
 * └─ Verify permission
 *   ↓
 * Controller Function
 * ├─ Business logic
 * └─ Generate response
 *   ↓
 * Response sent to client
 *   ↓
 * Winston Logger (Log response)
 */

// ============================================================
// ERROR HANDLING FLOW
// ============================================================
/**
 * Any middleware or controller throws error
 *   ↓
 * Error caught by asyncHandler wrapper
 *   ↓
 * Passed to errorHandler middleware
 *   ↓
 * Convert to standardized ApiError format
 *   ↓
 * Return formatted response:
 * {
 *   "success": false,
 *   "statusCode": 401,
 *   "message": "Error message",
 *   "errors": [...],
 *   "stack": (only in development)
 * }
 *   ↓
 * Winston logs the error
 *   ↓
 * Response sent to client
 */

export const PHASE2_FLOWS_DOCUMENTED = true;
