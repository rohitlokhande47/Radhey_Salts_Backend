import mongoose from "mongoose";

const ordersSchema = new mongoose.Schema(
    {
        // Reference to dealer who placed the order
        dealerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Dealer",
            required: [true, "Dealer ID is required"],
        },
        // Array of items in the order
        items: [
            {
                productId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Product",
                    required: true,
                },
                qty: {
                    type: Number,
                    required: [true, "Quantity is required"],
                    min: [1, "Quantity must be at least 1"],
                },
                unitPrice: {
                    type: Number,
                    required: [true, "Unit price is required"],
                    min: [0, "Unit price cannot be negative"],
                },
                totalPrice: {
                    type: Number,
                    required: true,
                    min: [0, "Total price cannot be negative"],
                },
                _id: false, // Exclude MongoDB ID from embedded document
            },
        ],
        // Total order amount
        totalAmount: {
            type: Number,
            required: [true, "Total amount is required"],
            min: [0, "Total amount cannot be negative"],
        },
        // Order status progression
        orderStatus: {
            type: String,
            enum: ["pending", "confirmed", "dispatched", "delivered", "cancelled"],
            default: "pending",
        },
        // Delivery details
        deliveryStage: {
            type: String,
            enum: ["awaiting_confirmation", "in_preparation", "in_transit", "out_for_delivery", "delivered"],
            default: "awaiting_confirmation",
        },
        // Payment status
        paymentStatus: {
            type: String,
            enum: ["pending", "partial", "completed"],
            default: "pending",
        },
        // Order timestamps
        orderedAt: {
            type: Date,
            default: Date.now,
        },
        confirmedAt: {
            type: Date,
            default: null,
        },
        dispatchedAt: {
            type: Date,
            default: null,
        },
        deliveredAt: {
            type: Date,
            default: null,
        },
        // Additional notes
        notes: {
            type: String,
            trim: true,
            default: null,
        },
        // Delivery address
        deliveryAddress: {
            type: String,
            trim: true,
            default: null,
        },
        // Order reference number
        orderRef: {
            type: String,
            unique: true,
            trim: true,
        },
        // Payment method
        paymentMethod: {
            type: String,
            enum: ["credit", "upi", "bank_transfer", "cash"],
            default: "credit",
        },
    },
    {
        timestamps: true,
    }
);

// Auto-generate order reference before saving
ordersSchema.pre("save", async function (next) {
    if (!this.orderRef) {
        const count = await mongoose.model("Order").countDocuments();
        const year = new Date().getFullYear().toString().slice(-2);
        const month = String(new Date().getMonth() + 1).padStart(2, "0");
        this.orderRef = `ORD-${year}${month}${String(count + 1).padStart(5, "0")}`;
    }
    next();
});

// Indexes for faster queries
ordersSchema.index({ dealerId: 1 });
ordersSchema.index({ orderStatus: 1 });
ordersSchema.index({ paymentStatus: 1 });
ordersSchema.index({ createdAt: 1 });
ordersSchema.index({ orderedAt: 1 });
ordersSchema.index({ orderRef: 1 });
ordersSchema.index({ "items.productId": 1 });

// Compound indexes
ordersSchema.index({ dealerId: 1, createdAt: -1 }); // For fetching dealer orders chronologically
ordersSchema.index({ orderStatus: 1, createdAt: -1 }); // For filtering orders by status

export const Order = mongoose.model("Order", ordersSchema);
