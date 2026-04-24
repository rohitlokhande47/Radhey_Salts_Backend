import mongoose from "mongoose";

// Audit Log Collection
// Immutable record of all administrative actions
// Enables compliance, forensic investigation, and accountability
const auditLogSchema = new mongoose.Schema(
    {
        // Admin who performed the action
        actorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Admin",
            required: [true, "Actor ID is required"],
        },
        // Role of the actor
        actorRole: {
            type: String,
            enum: ["super_admin", "admin"],
            required: true,
        },
        // Action performed
        action: {
            type: String,
            enum: [
                "PRODUCT_ADDED",
                "PRODUCT_UPDATED",
                "PRODUCT_DELETED",
                "PRODUCT_PRICE_UPDATED",
                "PRODUCT_STOCK_UPDATED",
                "ORDER_STATUS_CHANGED",
                "ORDER_CANCELLED",
                "DEALER_ADDED",
                "DEALER_UPDATED",
                "DEALER_DEACTIVATED",
                "DEALER_ACTIVATED",
                "ADMIN_ADDED",
                "ADMIN_UPDATED",
                "ADMIN_DEACTIVATED",
                "RESTOCK_PERFORMED",
                "BULK_IMPORT",
                "REPORT_GENERATED",
                "SYSTEM_CONFIG_CHANGED",
                "LOGIN_ATTEMPT",
                "LOGOUT",
                "PASSWORD_CHANGED",
            ],
            required: [true, "Action is required"],
        },
        // Collection that was affected
        targetCollection: {
            type: String,
            enum: ["Product", "Order", "Dealer", "Admin", "System"],
            required: [true, "Target collection is required"],
        },
        // Specific document ID that was affected
        targetId: {
            type: mongoose.Schema.Types.ObjectId,
            default: null,
        },
        // Complete document state before the change
        beforeSnapshot: {
            type: mongoose.Schema.Types.Mixed,
            default: null,
        },
        // Complete document state after the change
        afterSnapshot: {
            type: mongoose.Schema.Types.Mixed,
            default: null,
        },
        // IP address of the request
        ipAddress: {
            type: String,
            required: true,
            trim: true,
        },
        // User agent (browser/client info)
        userAgent: {
            type: String,
            trim: true,
            default: null,
        },
        // Additional context data
        context: {
            type: mongoose.Schema.Types.Mixed,
            default: null,
        },
        // Status of the action
        status: {
            type: String,
            enum: ["success", "failure"],
            default: "success",
        },
        // Error message if action failed
        errorMessage: {
            type: String,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

// Make audit logs immutable
auditLogSchema.pre("save", function (next) {
    if (!this.isNew) {
        throw new Error("Audit log entries are immutable - cannot be updated");
    }
    next();
});

// Prevent updates via findByIdAndUpdate
auditLogSchema.pre("findByIdAndUpdate", function (next) {
    throw new Error("Audit log entries are immutable - cannot be updated");
});

// Indexes for efficient querying
auditLogSchema.index({ actorId: 1 });
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ targetCollection: 1 });
auditLogSchema.index({ targetId: 1 });
auditLogSchema.index({ createdAt: 1 });
auditLogSchema.index({ timestamp: 1 });
auditLogSchema.index({ status: 1 });

// Compound indexes
auditLogSchema.index({ targetCollection: 1, targetId: 1 }); // Find all changes to specific document
auditLogSchema.index({ actorId: 1, createdAt: -1 }); // Find all actions by specific admin
auditLogSchema.index({ action: 1, createdAt: -1 }); // Find specific actions chronologically
auditLogSchema.index({ createdAt: -1 }); // Most recent audits first

export const AuditLog = mongoose.model("AuditLog", auditLogSchema);
