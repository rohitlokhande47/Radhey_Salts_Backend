import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI.endsWith("/")
            ? `${process.env.MONGODB_URI}${DB_NAME}`
            : `${process.env.MONGODB_URI}/${DB_NAME}`;
        
        const connectionInstance = await mongoose.connect(mongoUri);
        console.log(`\n✅ MongoDB Connected! DB Host: ${connectionInstance.connection.host}`);
        return connectionInstance;
    } catch (error) {
        console.log("❌ MongoDB Connection Error: ", error);
        process.exit(1);
    }
};

export default connectDB;
