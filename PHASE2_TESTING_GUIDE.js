/**
 * PHASE 2: AUTHENTICATION TESTING GUIDE
 * 
 * Step-by-step instructions for testing all authentication endpoints
 * Using curl commands (can be imported into Postman)
 */

// ============================================================
// PREREQUISITE: Setup Test Admin and Dealer
// ============================================================

/**
 * IMPORTANT: Before running tests, you need to create test users in MongoDB
 * 
 * Create Test Admin:
 * db.admins.insertOne({
 *   name: "Test Admin",
 *   email: "admin@test.com",
 *   password: bcrypt_hash("admin123"),  // Will be hashed by model
 *   role: "admin",
 *   isActive: true,
 *   createdAt: new Date(),
 *   updatedAt: new Date()
 * })
 * 
 * Create Test Dealer:
 * db.dealers.insertOne({
 *   name: "Test Dealer",
 *   email: "dealer@test.com",
 *   phone: "9876543210",
 *   password: bcrypt_hash("dealer123"),
 *   businessName: "Test Business",
 *   address: "123 Main St",
 *   city: "New York",
 *   state: "NY",
 *   pincode: "100001",
 *   role: "dealer",
 *   status: "active",
 *   createdAt: new Date(),
 *   updatedAt: new Date()
 * })
 */

// ============================================================
// TEST 1: ADMIN LOGIN
// ============================================================

/**
 * Endpoint: POST /api/v1/auth/admin/login
 * Purpose: Authenticate admin and receive tokens
 * 
 * CURL Command:
 */
curl -X POST http://localhost:8000/api/v1/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "admin123"
  }' \
  -v

/**
 * Expected Response (200 OK):
 * {
 *   "success": true,
 *   "statusCode": 200,
 *   "data": {
 *     "admin": {
 *       "_id": "507f1f77bcf86cd799439011",
 *       "name": "Test Admin",
 *       "email": "admin@test.com",
 *       "role": "admin",
 *       "isActive": true,
 *       "lastLogin": "2024-04-24T15:40:00.000Z"
 *     },
 *     "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
 *     "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *   },
 *   "message": "Admin login successful"
 * }
 * 
 * Cookies Set:
 * - Set-Cookie: accessToken=eyJ...; HttpOnly; Secure; SameSite=Strict; Max-Age=86400
 * - Set-Cookie: refreshToken=eyJ...; HttpOnly; Secure; SameSite=Strict; Max-Age=86400
 */

/**
 * Error Test: Invalid Password
 */
curl -X POST http://localhost:8000/api/v1/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "wrongpassword"
  }'

// Expected: 401 Unauthorized

/**
 * Error Test: Non-existent Admin
 */
curl -X POST http://localhost:8000/api/v1/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "nonexistent@test.com",
    "password": "admin123"
  }'

// Expected: 401 Invalid email or password

// ============================================================
// TEST 2: DEALER LOGIN (Email)
// ============================================================

/**
 * Endpoint: POST /api/v1/auth/dealer/login
 * Purpose: Authenticate dealer with email
 */
curl -X POST http://localhost:8000/api/v1/auth/dealer/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "dealer@test.com",
    "password": "dealer123"
  }' \
  -v

// Expected: 200 OK with accessToken and refreshToken

// ============================================================
// TEST 3: DEALER LOGIN (Phone)
// ============================================================

/**
 * Endpoint: POST /api/v1/auth/dealer/login
 * Purpose: Authenticate dealer with phone number
 */
curl -X POST http://localhost:8000/api/v1/auth/dealer/login \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "9876543210",
    "password": "dealer123"
  }'

// Expected: 200 OK with accessToken and refreshToken

// ============================================================
// TEST 4: GET CURRENT USER
// ============================================================

/**
 * Endpoint: GET /api/v1/auth/me
 * Purpose: Retrieve authenticated user details
 * Authentication: Required (Bearer token)
 */
curl -X GET http://localhost:8000/api/v1/auth/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -v

/**
 * Expected Response (200 OK):
 * {
 *   "success": true,
 *   "data": {
 *     "_id": "507f1f77bcf86cd799439011",
 *     "email": "admin@test.com",
 *     "name": "Test Admin",
 *     "role": "admin",
 *     "iat": 1713960000,
 *     "exp": 1714046400,
 *     "jti": "abc123xyz..."
 *   },
 *   "message": "Current user retrieved"
 * }
 */

/**
 * Error Test: Missing Token
 */
curl -X GET http://localhost:8000/api/v1/auth/me

// Expected: 401 Access token is missing

/**
 * Error Test: Invalid Token
 */
curl -X GET http://localhost:8000/api/v1/auth/me \
  -H "Authorization: Bearer invalid_token_here"

// Expected: 401 Invalid access token

// ============================================================
// TEST 5: LOGOUT (Token Blacklisting)
// ============================================================

/**
 * Endpoint: POST /api/v1/auth/logout
 * Purpose: Invalidate current token
 * 
 * IMPORTANT: Keep the accessToken from login TEST 1 above
 * Replace <ACCESS_TOKEN> with actual token
 */
curl -X POST http://localhost:8000/api/v1/auth/logout \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -v

/**
 * Expected Response (200 OK):
 * {
 *   "success": true,
 *   "data": {},
 *   "message": "Logout successful"
 * }
 * 
 * Cookie Headers:
 * - Clear-Site-Data: "cache", "cookies"
 * - Set-Cookie: accessToken=; HttpOnly; Max-Age=0
 * - Set-Cookie: refreshToken=; HttpOnly; Max-Age=0
 */

// ============================================================
// TEST 6: USE BLACKLISTED TOKEN (Should Fail)
// ============================================================

/**
 * After logout, try to use the same token
 * This tests that token blacklisting works
 */
curl -X GET http://localhost:8000/api/v1/auth/me \
  -H "Authorization: Bearer <SAME_BLACKLISTED_TOKEN>"

/**
 * Expected Response (401):
 * {
 *   "success": false,
 *   "message": "Token has been revoked",
 *   "statusCode": 401
 * }
 */

// ============================================================
// TEST 7: REFRESH TOKEN
// ============================================================

/**
 * Endpoint: POST /api/v1/auth/refresh
 * Purpose: Get new access token using refresh token
 * 
 * Use refreshToken from login response (TEST 1)
 */
curl -X POST http://localhost:8000/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -H "x-refresh-token: <REFRESH_TOKEN>" \
  -v

/**
 * Alternative: Using cookie header
 */
curl -X POST http://localhost:8000/api/v1/auth/refresh \
  -H "Cookie: refreshToken=<REFRESH_TOKEN>" \
  -v

/**
 * Expected Response (200 OK):
 * {
 *   "success": true,
 *   "data": {
 *     "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *   },
 *   "message": "Access token refreshed"
 * }
 */

// ============================================================
// TEST 8: CHANGE PASSWORD
// ============================================================

/**
 * Endpoint: POST /api/v1/auth/change-password
 * Purpose: Update password and invalidate all tokens
 */
curl -X POST http://localhost:8000/api/v1/auth/change-password \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "oldPassword": "admin123",
    "newPassword": "newadmin456",
    "confirmPassword": "newadmin456"
  }' \
  -v

/**
 * Expected Response (200 OK):
 * {
 *   "success": true,
 *   "data": {},
 *   "message": "Password changed successfully. Please login again."
 * }
 * 
 * Important: Current token is blacklisted, user must re-login
 */

/**
 * Error Test: Passwords don't match
 */
curl -X POST http://localhost:8000/api/v1/auth/change-password \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "oldPassword": "admin123",
    "newPassword": "newadmin456",
    "confirmPassword": "different456"
  }'

// Expected: 400 New passwords do not match

/**
 * Error Test: Wrong old password
 */
curl -X POST http://localhost:8000/api/v1/auth/change-password \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "oldPassword": "wrongoldpassword",
    "newPassword": "newadmin456",
    "confirmPassword": "newadmin456"
  }'

// Expected: 401 Old password is incorrect

// ============================================================
// TEST 9: RBAC - ADMIN ENDPOINT ACCESS
// ============================================================

/**
 * In Phase 3, endpoints will be protected with verifyAdminRole
 * For now, this is a conceptual test
 * 
 * When protected endpoint is available:
 */
curl -X DELETE http://localhost:8000/api/v1/products/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer <ADMIN_TOKEN>"

// Expected: 200 OK (admin can delete)

// ============================================================
// TEST 10: RBAC - UNAUTHORIZED ACCESS
// ============================================================

/**
 * Using dealer token on admin-only endpoint
 */
curl -X DELETE http://localhost:8000/api/v1/products/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer <DEALER_TOKEN>"

// Expected: 403 Forbidden
// Message: "Access denied. Required role(s): admin, super_admin, but user role is: dealer"

// ============================================================
// POSTMAN COLLECTION TEMPLATE
// ============================================================

/**
 * Can be imported as Postman Environment:
 * 
 * {
 *   "name": "Radhey Salt Backend - Phase 2",
 *   "values": [
 *     {
 *       "key": "base_url",
 *       "value": "http://localhost:8000",
 *       "enabled": true
 *     },
 *     {
 *       "key": "accessToken",
 *       "value": "",
 *       "enabled": true
 *     },
 *     {
 *       "key": "refreshToken",
 *       "value": "",
 *       "enabled": true
 *     }
 *   ]
 * }
 * 
 * Then in requests:
 * - Header: Authorization: Bearer {{accessToken}}
 * - URL: {{base_url}}/api/v1/auth/login
 * 
 * After login, update {{accessToken}} with response value
 */

// ============================================================
// TESTING CHECKLIST
// ============================================================

/**
 * ✅ Test 1: Admin Login - Success
 * ✅ Test 2: Admin Login - Invalid Password
 * ✅ Test 3: Admin Login - Non-existent User
 * ✅ Test 4: Dealer Login - Email
 * ✅ Test 5: Dealer Login - Phone
 * ✅ Test 6: Get Current User - Valid Token
 * ✅ Test 7: Get Current User - Invalid Token
 * ✅ Test 8: Get Current User - Missing Token
 * ✅ Test 9: Logout - Success
 * ✅ Test 10: Use Blacklisted Token - Should Fail
 * ✅ Test 11: Refresh Token - Success
 * ✅ Test 12: Change Password - Success
 * ✅ Test 13: Change Password - Mismatch
 * ✅ Test 14: Change Password - Wrong Old Password
 * ✅ Test 15: Verify Token Blacklisting in Database
 * ✅ Test 16: Verify TTL Index Auto-Deletion
 * ✅ Test 17: RBAC - Admin Can Access
 * ✅ Test 18: RBAC - Dealer Denied Access
 * ✅ Test 19: Expired Token - Should Get 401
 * ✅ Test 20: Cookie-based Auth - Works Same as Header
 */

// ============================================================
// DATABASE VERIFICATION QUERIES
// ============================================================

/**
 * Check token_blacklist entries:
 * db.tokenblacklists.find({})
 * 
 * Find specific user's blacklisted tokens:
 * db.tokenblacklists.find({ userId: ObjectId("...") })
 * 
 * Count active entries:
 * db.tokenblacklists.find({ expiresAt: { $gt: new Date() } }).count()
 * 
 * Check admin login record:
 * db.admins.findOne({ email: "admin@test.com" })
 * 
 * Check dealer login record:
 * db.dealers.findOne({ email: "dealer@test.com" })
 */

export const PHASE2_TESTING_GUIDE = true;
