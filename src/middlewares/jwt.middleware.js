import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
import { TokenBlacklist } from "../models/tokenBlacklist.model.js";

/**
 * JWT VERIFICATION MIDDLEWARE
 * 
 * Flow:
 * 1. Extract token from Authorization header or cookies
 * 2. Verify JWT signature
 * 3. Check if jti is in token_blacklist (revocation check)
 * 4. Attach user details to req.user
 * 5. Reject if token is invalid or revoked
 * 
 * Protected routes use this middleware
 */
export const verifyJWT = async (req, res, next) => {
    try {
        // Extract token from Authorization header or cookies
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");

        if (!token) {
            throw new ApiError(401, "Access token is missing");
        }

        // Verify JWT signature and decode
        let decodedToken;
        try {
            decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        } catch (error) {
            if (error.name === "TokenExpiredError") {
                throw new ApiError(401, "Access token has expired");
            } else if (error.name === "JsonWebTokenError") {
                throw new ApiError(401, "Invalid access token");
            }
            throw error;
        }

        // Check if token is blacklisted (revoked)
        if (decodedToken.jti) {
            const blacklistedToken = await TokenBlacklist.findOne({ jti: decodedToken.jti });

            if (blacklistedToken) {
                throw new ApiError(401, "Token has been revoked");
            }
        }

        // Attach user details to request
        req.user = decodedToken;
        req.user.ipAddress = req.ip;

        next();
    } catch (error) {
        if (error instanceof ApiError) {
            return res.status(error.statusCode).json({
                success: false,
                message: error.message,
                statusCode: error.statusCode,
            });
        }

        return res.status(401).json({
            success: false,
            message: error.message || "Authentication failed",
            statusCode: 401,
        });
    }
};

/**
 * OPTIONAL JWT MIDDLEWARE
 * 
 * Tries to attach user details if token exists
 * Does not throw error if token is missing
 * Useful for routes that can be accessed by both authenticated and unauthenticated users
 */
export const verifyJWTOptional = async (req, res, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");

        if (!token) {
            // No token provided - continue without user
            return next();
        }

        // Verify token
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

        // Check blacklist
        if (decodedToken.jti) {
            const blacklistedToken = await TokenBlacklist.findOne({ jti: decodedToken.jti });
            if (blacklistedToken) {
                // Token is revoked - continue without user
                return next();
            }
        }

        // Token is valid - attach user
        req.user = decodedToken;
        req.user.ipAddress = req.ip;

        next();
    } catch (error) {
        // Token verification failed - continue without user
        next();
    }
};

export default verifyJWT;
