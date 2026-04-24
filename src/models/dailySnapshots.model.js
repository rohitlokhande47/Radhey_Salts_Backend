import mongoose from "mongoose";

// Daily Snapshots Collection
// Pre-computed analytics generated nightly by cron job
// Decouples analytics queries from transactional database
const dailySnapshotsSchema = new mongoose.Schema(
    {
        // Date for this snapshot (unique)
        date: {
            type: Date,
            required: true,
            unique: true,
            index: true,
        },
        // Total orders placed on this day
        totalOrders: {
            type: Number,
            default: 0,
        },
        // Total revenue from confirmed orders on this day
        totalRevenue: {
            type: Number,
            default: 0,
        },
        // Average order value for this day
        avgOrderValue: {
            type: Number,
            default: 0,
        },
        // Top 5 products by quantity sold
        topProducts: [
            {
                productId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Product",
                },
                productName: String,
                quantitySold: Number,
                revenue: Number,
                _id: false,
            },
        ],
        // Top 5 dealers by spending
        topDealers: [
            {
                dealerId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Dealer",
                },
                dealerName: String,
                spending: Number,
                ordersCount: Number,
                _id: false,
            },
        ],
        // Number of new dealers registered on this day
        newDealers: {
            type: Number,
            default: 0,
        },
        // Payment statistics
        paymentStats: {
            totalReceivedCash: {
                type: Number,
                default: 0,
            },
            totalReceivedCredit: {
                type: Number,
                default: 0,
            },
            totalPending: {
                type: Number,
                default: 0,
            },
        },
        // Order status breakdown
        orderStatusBreakdown: {
            pending: { type: Number, default: 0 },
            confirmed: { type: Number, default: 0 },
            dispatched: { type: Number, default: 0 },
            delivered: { type: Number, default: 0 },
        },
        // Average time to confirm orders (in hours)
        avgConfirmationTime: {
            type: Number,
            default: 0,
        },
        // Timestamp when this snapshot was generated
        generatedAt: {
            type: Date,
            default: Date.now,
        },
        // Flag to indicate if snapshot is complete
        isComplete: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes for efficient querying
dailySnapshotsSchema.index({ date: 1 });
dailySnapshotsSchema.index({ createdAt: -1 }); // For fetching recent snapshots

export const DailySnapshot = mongoose.model("DailySnapshot", dailySnapshotsSchema);
