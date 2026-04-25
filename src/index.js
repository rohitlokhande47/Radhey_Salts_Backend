import dotenv from "dotenv";
import { app } from "./app.js";
import connectDB from "./db/index.js";
import { disconnectProducer, initProducer } from "./services/kafkaProducer.js";

dotenv.config({
    path: "./.env",
});

const startServer = async () => {
    try {
        // Connect to MongoDB
        await connectDB();
        console.log("✅ MongoDB connected");

        // Initialize Kafka Producer (non-blocking)
        initProducer().catch((err) => {
            console.log("⚠️  Kafka Producer initialization failed:", err.message);
            console.log("    Continuing without Kafka - email notifications disabled");
        });

        // Start Express server
        const server = app.listen(process.env.PORT || 8000, () => {
            console.log(`⚡️ Server is running on port ${process.env.PORT || 8000}`);
            console.log(`📡 Kafka Email Notifications Enabled`);
        });

        // Graceful shutdown
        process.on("SIGINT", async () => {
            console.log("\n🛑 Shutting down server gracefully...");
            await disconnectProducer().catch(() => {});
            server.close(() => {
                console.log("✅ Server closed");
                process.exit(0);
            });
        });
    } catch (err) {
        console.log("❌ Server startup failed:", err);
        process.exit(1);
    }
};

startServer();
