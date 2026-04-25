import dotenv from "dotenv";

// Load environment variables FIRST before importing other modules
dotenv.config();

import connectDB from "./db/index.js";
import { startEmailConsumer, stopEmailConsumer } from "./services/emailConsumer.js";

/**
 * Start the email consumer service
 * This is a separate process that listens to Kafka events and sends emails
 */
const startConsumer = async () => {
    try {
        console.log("═══════════════════════════════════════════════════════");
        console.log("  🚀 Radhey Salts - Email Notification Consumer");
        console.log("═══════════════════════════════════════════════════════\n");

        console.log("🔌 Connecting to MongoDB...");
        await connectDB();
        console.log("✅ MongoDB connected successfully\n");

        console.log("👂 Starting Email Consumer...");
        await startEmailConsumer();

        console.log("\n═══════════════════════════════════════════════════════");
        console.log("✅ Email Consumer is running and listening for events");
        console.log("═══════════════════════════════════════════════════════\n");
    } catch (error) {
        console.error("❌ Consumer startup error:", error);
        process.exit(1);
    }
};

// Graceful shutdown handler
process.on("SIGINT", async () => {
    console.log("\n\n🛑 Shutting down consumer gracefully...");
    try {
        await stopEmailConsumer();
        console.log("✅ Consumer stopped successfully");
        process.exit(0);
    } catch (error) {
        console.error("❌ Error during shutdown:", error);
        process.exit(1);
    }
});

// Start the consumer
startConsumer();
