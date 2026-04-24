import { Router } from "express";
import {
    adminLogin,
    dealerLogin,
    logout,
    refreshAccessToken,
    changePassword,
    getCurrentUser,
} from "../controllers/auth.controller.js";
import { verifyJWT } from "../middlewares/jwt.middleware.js";

const router = Router();

/**
 * PUBLIC ROUTES (No authentication required)
 */

// Admin Login
// POST /api/v1/auth/admin/login
// Body: { email, password }
// Returns: { accessToken, refreshToken, admin }
router.post("/admin/login", adminLogin);

// Dealer Login
// POST /api/v1/auth/dealer/login
// Body: { email (or phone), password }
// Returns: { accessToken, refreshToken, dealer }
router.post("/dealer/login", dealerLogin);

/**
 * PROTECTED ROUTES (Authentication required)
 */

// Logout
// POST /api/v1/auth/logout
// Headers: Authorization: Bearer <token> or Cookie: accessToken=<token>
// Action: Adds token jti to blacklist
// Returns: { message: "Logout successful" }
router.post("/logout", verifyJWT, logout);

// Refresh Access Token
// POST /api/v1/auth/refresh
// Body/Cookie: refreshToken
// Returns: { accessToken }
router.post("/refresh", refreshAccessToken);

// Change Password
// POST /api/v1/auth/change-password
// Headers: Authorization: Bearer <token>
// Body: { oldPassword, newPassword, confirmPassword }
// Action: Updates password, blacklists current token
// Returns: { message: "Password changed successfully" }
router.post("/change-password", verifyJWT, changePassword);

// Get Current User
// GET /api/v1/auth/me
// Headers: Authorization: Bearer <token>
// Returns: { user details from JWT }
router.get("/me", verifyJWT, getCurrentUser);

export default router;
