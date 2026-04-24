import mongoose from "mongoose";

// Token Blacklist Collection
// Stores JWT IDs (jti claims) of revoked tokens
// TTL index automatically deletes expired entries
const tokenBlacklistSchema = new mongoose.Schema(
    {
        // Unique JWT ID claim (jti)
        jti: {
            type: String,
            required: [true, "JWT ID is required"],
            unique: true,
            trim: true,
        },
        // User or Admin who owned this token
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            required: [true, "User ID is required"],
        },
        // Type of user (Dealer or Admin)
        userType: {
            type: String,
            enum: ["Dealer", "Admin"],
            required: true,
        },
        // Reason for blacklisting
        reason: {
            type: String,
            enum: ["logout", "password_change", "admin_revoke", "session_timeout"],
            required: [true, "Reason is required"],
        },
        // Token expiry time (for TTL index)
        expiresAt: {
            type: Date,
            required: [true, "Expiry time is required"],
        },
        // IP address from where token was revoked
        ipAddress: {
            type: String,
            trim: true,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

// TTL Index: MongoDB will automatically delete documents 0 seconds after expiresAt
// This keeps the collection lean with zero manual maintenance
tokenBlacklistSchema.index(
    { expiresAt: 1 },
    { expireAfterSeconds: 0 }
);

// Regular indexes for faster queries
tokenBlacklistSchema.index({ jti: 1 });
tokenBlacklistSchema.index({ userId: 1 });
tokenBlacklistSchema.index({ createdAt: 1 });

export const TokenBlacklist = mongoose.model("TokenBlacklist", tokenBlacklistSchema);
