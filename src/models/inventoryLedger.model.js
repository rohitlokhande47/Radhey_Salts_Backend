import mongoose from "mongoose";

// Immutable, append-only inventory ledger
// Every stock movement creates a new entry - entries are never updated or deleted
const inventoryLedgerSchema = new mongoose.Schema(
    {
        // Reference to product
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: [true, "Product ID is required"],
        },
        // Type of stock change
        changeType: {
            type: String,
            enum: ["debit", "credit"],
            required: [true, "Change type is required"],
            // debit = stock out (order placed, damage, etc.)
            // credit = stock in (restock, cancellation, return, etc.)
        },
        // Quantity that moved
        quantityChanged: {
            type: Number,
            required: [true, "Quantity changed is required"],
            min: [1, "Quantity must be at least 1"],
        },
        // Stock quantity before this change
        previousQty: {
            type: Number,
            required: [true, "Previous quantity is required"],
            min: [0, "Quantity cannot be negative"],
        },
        // Stock quantity after this change
        newQty: {
            type: Number,
            required: [true, "New quantity is required"],
            min: [0, "Quantity cannot be negative"],
        },
        // What triggered this stock movement
        reason: {
            type: String,
            enum: ["order_placed", "restock", "cancellation", "damage", "expiry", "adjustment"],
            required: [true, "Reason is required"],
        },
        // Reference to what triggered this (orderId or adminId)
        triggeredBy: {
            type: mongoose.Schema.Types.ObjectId,
            required: [true, "Triggered by is required"],
            // Can be an order ID or admin ID depending on reason
        },
        // Admin or system note
        notes: {
            type: String,
            trim: true,
            default: null,
        },
        // Type of entity that triggered (order or admin)
        triggeredByType: {
            type: String,
            enum: ["Order", "Admin"],
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

// This schema is designed to be immutable
// Add a pre-save hook to prevent updates
inventoryLedgerSchema.pre("save", function (next) {
    if (!this.isNew) {
        throw new Error("Inventory ledger entries are immutable - cannot be updated");
    }
    next();
});

// Override findByIdAndUpdate to prevent updates
inventoryLedgerSchema.pre("findByIdAndUpdate", function (next) {
    throw new Error("Inventory ledger entries are immutable - cannot be updated");
});

// Indexes for efficient querying
inventoryLedgerSchema.index({ productId: 1 });
inventoryLedgerSchema.index({ changeType: 1 });
inventoryLedgerSchema.index({ reason: 1 });
inventoryLedgerSchema.index({ createdAt: 1 });
inventoryLedgerSchema.index({ triggeredBy: 1 });

// Compound indexes
inventoryLedgerSchema.index({ productId: 1, createdAt: -1 }); // Get ledger for product chronologically
inventoryLedgerSchema.index({ changeType: 1, createdAt: -1 }); // Filter by type and date
inventoryLedgerSchema.index({ productId: 1, reason: 1 }); // Find specific type of changes for product

// TTL index - keep ledger indefinitely (set to very high value or remove if needed)
// inventoryLedgerSchema.index({ createdAt: 1 }, { expireAfterSeconds: 31536000 }); // 1 year

export const InventoryLedger = mongoose.model("InventoryLedger", inventoryLedgerSchema);
