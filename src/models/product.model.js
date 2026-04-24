import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Product name is required"],
            trim: true,
            minlength: 2,
            maxlength: 200,
        },
        description: {
            type: String,
            required: [true, "Product description is required"],
            trim: true,
            maxlength: 1000,
        },
        productCode: {
            type: String,
            required: [true, "Product code is required"],
            unique: true,
            trim: true,
            uppercase: true,
        },
        category: {
            type: String,
            required: true,
            trim: true,
        },
        // Base price per unit
        price: {
            type: Number,
            required: [true, "Price is required"],
            min: [0, "Price cannot be negative"],
        },
        // Minimum order quantity
        MOQ: {
            type: Number,
            required: [true, "MOQ is required"],
            min: [1, "MOQ must be at least 1"],
        },
        // Current stock quantity
        stockQty: {
            type: Number,
            required: [true, "Stock quantity is required"],
            min: [0, "Stock quantity cannot be negative"],
            default: 0,
        },
        // Reorder level for low stock alerts
        reorderLevel: {
            type: Number,
            default: 100,
            min: [0, "Reorder level cannot be negative"],
        },
        // Product image URL from Cloudinary
        image: {
            type: String,
            trim: true,
        },
        // Array of pricing tiers for bulk discounts
        // Example: [{minQty: 100, maxQty: 500, price: 45}, {minQty: 501, price: 40}]
        pricingTiers: [
            {
                minQty: {
                    type: Number,
                    required: true,
                    min: 1,
                },
                maxQty: {
                    type: Number,
                    default: null,
                },
                price: {
                    type: Number,
                    required: true,
                    min: 0,
                },
            },
        ],
        unit: {
            type: String,
            enum: ["kg", "liter", "piece", "bag", "box", "carton"],
            default: "kg",
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        supplier: {
            type: String,
            trim: true,
        },
        hsn: {
            type: String,
            trim: true,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

// Method to get applicable price based on quantity ordered
productSchema.methods.getPriceForQuantity = function (qty) {
    // If no pricing tiers, return base price
    if (!this.pricingTiers || this.pricingTiers.length === 0) {
        return this.price;
    }

    // Find applicable pricing tier
    let applicablePrice = this.price;
    
    for (let tier of this.pricingTiers) {
        if (qty >= tier.minQty) {
            if (!tier.maxQty || qty <= tier.maxQty) {
                applicablePrice = tier.price;
                break;
            } else if (!tier.maxQty) {
                applicablePrice = tier.price;
            }
        }
    }

    return applicablePrice;
};

// Validate that pricingTiers are properly sorted
productSchema.pre("save", function (next) {
    if (this.pricingTiers && this.pricingTiers.length > 0) {
        // Sort by minQty
        this.pricingTiers.sort((a, b) => a.minQty - b.minQty);
        
        // Validate that minQty values are unique and increasing
        for (let i = 0; i < this.pricingTiers.length - 1; i++) {
            if (this.pricingTiers[i].minQty >= this.pricingTiers[i + 1].minQty) {
                return next(new Error("Pricing tiers must have unique and increasing minQty values"));
            }
        }
    }
    next();
});

// Indexes for faster queries
productSchema.index({ productCode: 1 });
productSchema.index({ category: 1 });
productSchema.index({ isActive: 1 });
productSchema.index({ stockQty: 1 });
productSchema.index({ createdAt: 1 });
productSchema.index({ name: "text", description: "text" }); // Text search index

export const Product = mongoose.model("Product", productSchema);
