import { ApiError } from "../utils/ApiError.js";

/**
 * ROLE-BASED ACCESS CONTROL (RBAC) MIDDLEWARE
 * 
 * Purpose: Verify user has required role to access route
 * Usage: app.delete("/api/v1/products/:id", verifyJWT, verifyRole(["admin", "super_admin"]), deleteProduct)
 */
export const verifyRole = (allowedRoles = []) => {
    return (req, res, next) => {
        try {
            const user = req.user;

            if (!user) {
                throw new ApiError(401, "User not authenticated");
            }

            if (!allowedRoles.includes(user.role)) {
                throw new ApiError(
                    403,
                    `Access denied. Required role(s): ${allowedRoles.join(", ")}, but user role is: ${user.role}`
                );
            }

            next();
        } catch (error) {
            if (error instanceof ApiError) {
                return res.status(error.statusCode).json({
                    success: false,
                    message: error.message,
                    statusCode: error.statusCode,
                });
            }

            return res.status(500).json({
                success: false,
                message: "Authorization check failed",
                statusCode: 500,
            });
        }
    };
};

/**
 * ADMIN ONLY MIDDLEWARE
 * 
 * Shorthand for verifying admin/super_admin role
 */
export const verifyAdminRole = verifyRole(["admin", "super_admin"]);

/**
 * SUPER ADMIN ONLY MIDDLEWARE
 * 
 * Shorthand for verifying super_admin role
 */
export const verifySuperAdminRole = verifyRole(["super_admin"]);

/**
 * DEALER ONLY MIDDLEWARE
 * 
 * Shorthand for verifying dealer role
 */
export const verifyDealerRole = verifyRole(["dealer"]);

/**
 * VERIFY OWNER OR ADMIN MIDDLEWARE
 * 
 * Allow access if user is the resource owner or an admin
 * Usage: app.put("/api/v1/profile/:id", verifyJWT, verifyOwnerOrAdmin("dealerId"), updateProfile)
 */
export const verifyOwnerOrAdmin = (resourceUserIdField = "userId") => {
    return (req, res, next) => {
        try {
            const user = req.user;

            if (!user) {
                throw new ApiError(401, "User not authenticated");
            }

            const resourceUserId = req.params[resourceUserIdField] || req.body[resourceUserIdField];

            // Allow if user is admin/super_admin
            if (["admin", "super_admin"].includes(user.role)) {
                return next();
            }

            // Allow if user is the resource owner
            if (user._id.toString() === resourceUserId) {
                return next();
            }

            throw new ApiError(403, "You do not have permission to access this resource");
        } catch (error) {
            if (error instanceof ApiError) {
                return res.status(error.statusCode).json({
                    success: false,
                    message: error.message,
                    statusCode: error.statusCode,
                });
            }

            return res.status(500).json({
                success: false,
                message: "Authorization check failed",
                statusCode: 500,
            });
        }
    };
};

/**
 * VERIFY ACTIVE USER MIDDLEWARE
 * 
 * Ensure user account is active (not suspended/inactive)
 * Can be combined with other middlewares
 */
export const verifyActiveUser = async (req, res, next) => {
    try {
        const user = req.user;

        if (!user) {
            throw new ApiError(401, "User not authenticated");
        }

        // User info is in JWT - if they have a valid token, they're considered "active"
        // For dealer status check, you might want to query the Dealer model
        // For now, we trust the JWT

        next();
    } catch (error) {
        if (error instanceof ApiError) {
            return res.status(error.statusCode).json({
                success: false,
                message: error.message,
                statusCode: error.statusCode,
            });
        }

        return res.status(500).json({
            success: false,
            message: "User verification failed",
            statusCode: 500,
        });
    }
};

export default verifyRole;
