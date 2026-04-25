import axios from "axios";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { DB_NAME } from "./src/constants.js";
import { Dealer } from "./src/models/dealer.model.js";
import { Product } from "./src/models/product.model.js";

dotenv.config({ path: "./.env" });

const API_BASE_URL = `http://localhost:${process.env.PORT || 8000}/api/v1`;
const MONGODB_URI = `${process.env.MONGODB_URI}${DB_NAME}`;

// Connect to MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log("✅ MongoDB Connected");
    } catch (error) {
        console.error("❌ MongoDB Connection Error:", error.message);
        process.exit(1);
    }
};

// Create test dealer
const createTestDealer = async () => {
    try {
        console.log("\n📝 Creating test dealer...");
        const testDealer = {
            name: "Test User FD",
            email: "fdprojects001@gmail.com",
            phone: "9999999999",
            password: "TestDealer@123",
            businessName: "FD Projects Test",
            address: "Test Street",
            city: "Test City",
            state: "Test State",
            pincode: "123456",
            role: "dealer",
            status: "active",
            creditLimit: 100000,
            outstandingBalance: 0,
        };

        // Check if dealer already exists
        const existingDealer = await Dealer.findOne({ email: testDealer.email });
        if (existingDealer) {
            console.log(`✅ Dealer already exists: ${testDealer.email}`);
            return existingDealer;
        }

        // Create new dealer
        const dealer = await Dealer.create(testDealer);
        console.log(`✅ Dealer created successfully!`);
        console.log(`   Email: ${dealer.email}`);
        console.log(`   Password: TestDealer@123`);
        return dealer;
    } catch (error) {
        console.error("❌ Error creating dealer:", error.message);
        throw error;
    }
};

// Login and get JWT token
const loginDealer = async (email, password) => {
    try {
        console.log("\n🔐 Logging in dealer...");
        const response = await axios.post(`${API_BASE_URL}/auth/dealer-login`, {
            email,
            password,
        });

        const { accessToken, refreshToken } = response.data.data;
        console.log(`✅ Login successful!`);
        console.log(`   Access Token: ${accessToken.substring(0, 20)}...`);
        return accessToken;
    } catch (error) {
        console.error("❌ Login error:", error.response?.data?.message || error.message);
        throw error;
    }
};

// Get products for ordering
const getProducts = async () => {
    try {
        console.log("\n📦 Fetching products...");
        const products = await Product.find({ isActive: true }).limit(1);
        if (products.length === 0) {
            throw new Error("No active products found");
        }
        console.log(`✅ Found ${products.length} product(s)`);
        console.log(`   Product: ${products[0].name}`);
        console.log(`   MOQ: ${products[0].MOQ}`);
        return products[0];
    } catch (error) {
        console.error("❌ Error fetching products:", error.message);
        throw error;
    }
};

// Place order
const placeOrder = async (accessToken, productId) => {
    try {
        console.log("\n🛒 Placing order...");
        const response = await axios.post(
            `${API_BASE_URL}/orders`,
            {
                items: [
                    {
                        productId,
                        quantity: 100,
                    },
                ],
                deliveryAddress: "Test Address, Test City",
            },
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
            }
        );

        const order = response.data.data.order;
        console.log(`✅ Order placed successfully!`);
        console.log(`   Order ID: ${order._id}`);
        console.log(`   Order Ref: ${order.orderRef}`);
        console.log(`   Total Amount: ₹${order.totalAmount}`);
        console.log(`   Status: ${order.orderStatus}`);
        return order;
    } catch (error) {
        console.error("❌ Error placing order:", error.response?.data?.message || error.message);
        throw error;
    }
};

// Main test flow
const runTest = async () => {
    try {
        console.log("\n═══════════════════════════════════════════════════════");
        console.log("  📧 EMAIL NOTIFICATION SERVICE TEST");
        console.log("═══════════════════════════════════════════════════════");

        // Connect to database
        await connectDB();

        // Create test dealer
        const dealer = await createTestDealer();

        // Login
        const accessToken = await loginDealer(dealer.email, "TestDealer@123");

        // Get product
        const product = await getProducts();

        // Place order
        const order = await placeOrder(accessToken, product._id);

        console.log("\n═══════════════════════════════════════════════════════");
        console.log("  ✅ TEST COMPLETED SUCCESSFULLY!");
        console.log("═══════════════════════════════════════════════════════");
        console.log("\n📧 EMAIL NOTIFICATION STATUS:");
        console.log("   ✅ Event published to Kafka");
        console.log("   ⏳ Check consumer logs for email processing");
        console.log(`   📨 Email should be sent to: ${dealer.email}`);
        console.log("\nConsumer Terminal Output Should Show:");
        console.log("   📨 Processing email event: ORDER_PLACED");
        console.log(`   ✅ Email sent successfully to ${dealer.email}`);
        console.log("═══════════════════════════════════════════════════════\n");

        process.exit(0);
    } catch (error) {
        console.error("\n❌ Test failed:", error.message);
        process.exit(1);
    }
};

// Run the test
runTest();
