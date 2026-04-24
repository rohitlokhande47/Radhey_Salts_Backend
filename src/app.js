import express from "express";
import cors from "cors";
import errorHandler from "./middlewares/errorHandler.js";

const app = express();

// CORS Configuration
app.use(
    cors({
        origin: process.env.CORS_ORIGIN || "*",
        credentials: true,
    })
);

// Body Parsers
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

// Static Files
app.use(express.static("uploads"));

// Health Check Route
app.get("/api/v1/health", (req, res) => {
    res.json({ status: "✅ Server is running" });
});

// Import Routes
import userRoute from "./routes/user.route.js";

// Routes Declaration
app.use("/api/v1/user", userRoute);

// 404 Handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found",
        statusCode: 404,
    });
});

// Error Handler Middleware (must be last)
app.use(errorHandler);

export { app };
