import mongoose from "mongoose";

const connectDB = async () => {
  const rawUri = process.env.MONGODB_URI || process.env.MONGO_URL;
  if (!rawUri || !rawUri.trim()) {
    console.error("MongoDB URI is not defined in environment variables (MONGODB_URI).");
    process.exit(1);
  }

  const uri = rawUri.trim();

  try {
    const conn = await mongoose.connect(uri);
    const host = conn.connection.host || "connected";
    const dbName = conn.connection.name || "default";
    console.log(`MongoDB Connected: ${host} (Database: ${dbName})`);
    return conn;
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    console.error("Please verify:");
    console.error("  1. MONGODB_URI in .env has the correct cluster hostname and credentials.");
    console.error("  2. In MongoDB Atlas, your IP is whitelisted under Network Access (e.g. 0.0.0.0/0).");
    process.exit(1);
  }
};

export default connectDB;