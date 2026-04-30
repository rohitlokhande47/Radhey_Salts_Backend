import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const dealerSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Dealer name is required"],
            trim: true,
            minlength: 2,
            maxlength: 100,
        },
        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Please provide a valid email"],
        },
        password: {
            type: String,
            required: [true, "Password is required"],
            minlength: [6, "Password must be at least 6 characters"],
            select: false, // Don't return password by default
        },
        phone: {
            type: String,
            required: [true, "Phone number is required"],
            match: [/^[0-9]{10}$/, "Please provide a valid 10-digit phone number"],
        },
        businessName: {
            type: String,
            required: true,
            trim: true,
        },
        address: {
            type: String,
            required: true,
            trim: true,
        },
        city: {
            type: String,
            required: true,
            trim: true,
        },
        state: {
            type: String,
            required: true,
            trim: true,
        },
        pincode: {
            type: String,
            required: true,
            match: [/^[0-9]{6}$/, "Please provide a valid 6-digit pincode"],
        },
        role: {
            type: String,
            enum: ["dealer"],
            default: "dealer",
            required: true,
        },
        status: {
            type: String,
            enum: ["active", "inactive", "suspended"],
            default: "active",
        },
        totalOrders: {
            type: Number,
            default: 0,
        },
        totalSpent: {
            type: Number,
            default: 0,
        },
        lastOrderDate: {
            type: Date,
            default: null,
        },
        gstin: {
            type: String,
            trim: true,
            default: null,
        },
        creditLimit: {
            type: Number,
            default: 0,
        },
        outstandingBalance: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

// Hash password before saving
dealerSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to check if password is correct
dealerSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password);
};

// Method to generate access token
dealerSchema.methods.generateAccessToken = function () {
    const jti = crypto.randomBytes(16).toString("hex");
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            name: this.name,
            role: this.role,
            jti: jti,
        },
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.JWT_EXPIRE || "1d",
        }
    );
};

// Method to generate refresh token
dealerSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "7d",
        }
    );
};

// Indexes for faster queries
dealerSchema.index({ email: 1 });
dealerSchema.index({ phone: 1 });
dealerSchema.index({ status: 1 });
dealerSchema.index({ createdAt: 1 });
dealerSchema.index({ totalSpent: 1 });

export const Dealer = mongoose.model("Dealer", dealerSchema);
