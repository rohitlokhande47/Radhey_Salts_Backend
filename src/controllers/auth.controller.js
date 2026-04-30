import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { Admin } from "../models/admin.model.js";
import { Dealer } from "../models/dealer.model.js";
import { TokenBlacklist } from "../models/tokenBlacklist.model.js";
import crypto from "crypto";

/**
 * ADMIN LOGIN CONTROLLER
 * 
 * Accepts: email, password
 * Returns: accessToken, refreshToken, admin details
 * Logs: Admin login event
 */
export const adminLogin = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
        throw new ApiError(400, "Email and password are required");
    }

    // Find admin by email and include password field
    const admin = await Admin.findOne({ email }).select("+password");

    if (!admin) {
        throw new ApiError(401, "Invalid email or password");
    }

    if (!admin.isActive) {
        throw new ApiError(403, "Admin account is inactive");
    }

    // Verify password
    const isPasswordValid = await admin.isPasswordCorrect(password);

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid email or password");
    }

    // Generate tokens
    const accessToken = admin.generateAccessToken();
    const refreshToken = admin.generateRefreshToken();

    // Update last login time
    admin.lastLogin = new Date();
    await admin.save({ validateBeforeSave: false });

    // Remove password from response
    const adminData = admin.toObject();
    delete adminData.password;

    // Set secure cookies
    const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
    };

    return res
        .status(200)
        .cookie("accessToken", accessToken, cookieOptions)
        .cookie("refreshToken", refreshToken, cookieOptions)
        .json(
            new ApiResponse(
                200,
                {
                    admin: adminData,
                    accessToken,
                    refreshToken,
                },
                "Admin login successful"
            )
        );
});

/**
 * DEALER LOGIN CONTROLLER
 * 
 * Accepts: email (or phone), password
 * Returns: accessToken, refreshToken, dealer details
 */
export const dealerLogin = asyncHandler(async (req, res) => {
    const { email, phone, password } = req.body;

    // Validation: email or phone required
    if ((!email && !phone) || !password) {
        throw new ApiError(400, "Email/Phone and password are required");
    }

    // Find dealer by email or phone
    const dealer = await Dealer.findOne({
        $or: [{ email }, { phone }],
    }).select("+password");

    if (!dealer) {
        throw new ApiError(401, "Invalid credentials");
    }

    if (dealer.status !== "active") {
        throw new ApiError(403, `Dealer account is ${dealer.status}`);
    }

    // Verify password
    const isPasswordValid = await dealer.isPasswordCorrect(password);

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid credentials");
    }

    // Generate tokens
    const accessToken = dealer.generateAccessToken();
    const refreshToken = dealer.generateRefreshToken();

    // Remove password from response
    const dealerData = dealer.toObject();
    delete dealerData.password;

    // Set secure cookies
    const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
    };

    return res
        .status(200)
        .cookie("accessToken", accessToken, cookieOptions)
        .cookie("refreshToken", refreshToken, cookieOptions)
        .json(
            new ApiResponse(
                200,
                {
                    dealer: dealerData,
                    accessToken,
                    refreshToken,
                },
                "Dealer login successful"
            )
        );
});

/**
 * DEALER REGISTRATION CONTROLLER
 * 
 * Accepts: email, password, name, phone, businessName, address, city, state, pincode
 * Returns: Dealer details (without password)
 * Creates new dealer account
 */
export const dealerRegister = asyncHandler(async (req, res) => {
    const { email, password, name, phone, businessName, address, city, state, pincode } = req.body;

    // Validation - Check all required fields
    if ([email, password, name, phone, businessName, address, city, state, pincode].some((field) => !field || (typeof field === 'string' && field.trim() === ""))) {
        throw new ApiError(400, "All fields are required");
    }

    // Phone validation - should be 10 digits
    if (!/^[0-9]{10}$/.test(phone)) {
        throw new ApiError(400, "Phone number must be 10 digits");
    }

    // Pincode validation - should be 6 digits
    if (!/^[0-9]{6}$/.test(pincode)) {
        throw new ApiError(400, "Pincode must be 6 digits");
    }

    // Check if dealer already exists with same email or phone
    const existedDealer = await Dealer.findOne({
        $or: [{ email }, { phone }],
    });

    if (existedDealer) {
        throw new ApiError(409, "Dealer with this email or phone already exists");
    }

    // Create dealer
    const dealer = await Dealer.create({
        name,
        email,
        password,
        phone,
        businessName,
        address,
        city,
        state,
        pincode,
        role: "dealer",
        status: "active",
        creditLimit: 0, // Can be updated by admin
        outstandingBalance: 0,
    });

    // Fetch created dealer without password
    const createdDealer = await Dealer.findById(dealer._id).select("-password");

    if (!createdDealer) {
        throw new ApiError(500, "Something went wrong while registering the dealer");
    }

    return res.status(201).json(new ApiResponse(201, createdDealer, "Dealer registered successfully"));
});

/**
 * LOGOUT CONTROLLER
 * 
 * Accepts: Current token (from header or cookie)
 * Action: Adds token jti to blacklist
 * Returns: Success message
 */
export const logout = asyncHandler(async (req, res) => {
    const user = req.user;

    if (!user) {
        throw new ApiError(401, "User not authenticated");
    }

    const { jti, exp } = user;

    if (!jti) {
        throw new ApiError(400, "Invalid token - missing jti claim");
    }

    // Add token to blacklist
    const expiresAt = new Date(exp * 1000); // Convert Unix timestamp to Date

    await TokenBlacklist.create({
        jti,
        userId: user._id,
        userType: user.role === "dealer" ? "Dealer" : "Admin",
        reason: "logout",
        expiresAt,
        ipAddress: req.ip,
    });

    // Clear cookies
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    return res.status(200).json(new ApiResponse(200, {}, "Logout successful"));
});

/**
 * REFRESH TOKEN CONTROLLER
 * 
 * Accepts: refreshToken from cookie or header
 * Returns: New accessToken (and optionally new refreshToken)
 */
export const refreshAccessToken = asyncHandler(async (req, res) => {
    const refreshToken = req.cookies.refreshToken || req.header("x-refresh-token");

    if (!refreshToken) {
        throw new ApiError(401, "Refresh token is missing");
    }

    let decodedRefreshToken;
    try {
        decodedRefreshToken = jwt.verify(refreshToken, process.env.JWT_SECRET);
    } catch (error) {
        throw new ApiError(401, "Invalid or expired refresh token");
    }

    // Find user by ID
    const userId = decodedRefreshToken._id;

    // Try to find in either Admin or Dealer collection
    let user = await Admin.findById(userId);
    if (!user) {
        user = await Dealer.findById(userId);
    }

    if (!user) {
        throw new ApiError(401, "User not found");
    }

    // Generate new access token
    const newAccessToken = user.generateAccessToken();

    const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
    };

    return res
        .status(200)
        .cookie("accessToken", newAccessToken, cookieOptions)
        .json(
            new ApiResponse(
                200,
                { accessToken: newAccessToken },
                "Access token refreshed"
            )
        );
});

/**
 * CHANGE PASSWORD CONTROLLER
 * 
 * Accepts: oldPassword, newPassword, confirmPassword
 * Action: Updates password and invalidates all existing tokens
 */
export const changePassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword, confirmPassword } = req.body;
    const user = req.user;

    // Validation
    if (!oldPassword || !newPassword || !confirmPassword) {
        throw new ApiError(400, "All fields are required");
    }

    if (newPassword !== confirmPassword) {
        throw new ApiError(400, "New passwords do not match");
    }

    if (newPassword.length < 6) {
        throw new ApiError(400, "New password must be at least 6 characters");
    }

    // Find user and verify old password
    let userDoc;
    if (user.role === "dealer") {
        userDoc = await Dealer.findById(user._id).select("+password");
    } else {
        userDoc = await Admin.findById(user._id).select("+password");
    }

    if (!userDoc) {
        throw new ApiError(404, "User not found");
    }

    const isOldPasswordValid = await userDoc.isPasswordCorrect(oldPassword);
    if (!isOldPasswordValid) {
        throw new ApiError(401, "Old password is incorrect");
    }

    // Update password
    userDoc.password = newPassword;
    await userDoc.save();

    // Blacklist current token to force re-login
    const { jti, exp } = user;
    if (jti && exp) {
        await TokenBlacklist.create({
            jti,
            userId: user._id,
            userType: user.role === "dealer" ? "Dealer" : "Admin",
            reason: "password_change",
            expiresAt: new Date(exp * 1000),
            ipAddress: req.ip,
        });
    }

    // Clear cookies
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    return res.status(200).json(new ApiResponse(200, {}, "Password changed successfully. Please login again."));
});

/**
 * GET CURRENT USER CONTROLLER
 * 
 * Returns: Current authenticated user details
 */
export const getCurrentUser = asyncHandler(async (req, res) => {
    const user = req.user;

    if (!user) {
        throw new ApiError(401, "User not authenticated");
    }

    return res.status(200).json(new ApiResponse(200, user, "Current user retrieved"));
});

export default {
    adminLogin,
    dealerLogin,
    dealerRegister,
    logout,
    refreshAccessToken,
    changePassword,
    getCurrentUser,
};
