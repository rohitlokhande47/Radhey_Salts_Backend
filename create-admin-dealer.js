import dotenv from "dotenv";
import mongoose from "mongoose";
import { DB_NAME } from "./src/constants.js";
import { Admin } from "./src/models/admin.model.js";
import { Dealer } from "./src/models/dealer.model.js";

dotenv.config({ path: "./.env" });

const connectDB = async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}${DB_NAME}`);
        console.log("✅ Connected to MongoDB");
    } catch (error) {
        console.error("❌ Connection failed:", error.message);
        process.exit(1);
    }
};

const createRecords = async () => {
    try {
        // Create Admin
        const admin = await Admin.create({
            name: "Admin User",
            email: "admin.test@radhey.com",
            password: "Admin@123",
            role: "admin",
            isActive: true,
            permissions: ["all"],
        });
        console.log("✅ Admin created:", admin.email);

        // Create Dealer
        const dealer = await Dealer.create({
            name: "Dealer Test",
            email: "dealer.test@radhey.com",
            phone: "9876543210",
            password: "Dealer@123",
            businessName: "Test Trading Co.",
            address: "123 Business Street",
            city: "Mumbai",
            state: "Maharashtra",
            pincode: "400001",
            role: "dealer",
            status: "active",
            creditLimit: 500000,
            outstandingBalance: 0,
        });
        console.log("✅ Dealer created:", dealer.email);

        console.log("\n📋 Login Credentials:");
        console.log("\n🔐 Admin:");
        console.log("  Email: admin.test@radhey.com");
        console.log("  Password: Admin@123");
        console.log("\n🔐 Dealer:");
        console.log("  Email: dealer.test@radhey.com");
        console.log("  Password: Dealer@123");

        await mongoose.disconnect();
        console.log("\n✅ Done!");
    } catch (error) {
        console.error("❌ Error:", error.message);
        process.exit(1);
    }
};

await connectDB();
await createRecords();
