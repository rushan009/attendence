import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import authRoutes from "./routes/auth.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import teacherRoutes from "./routes/teacher.routes.js";
import studentRoutes from "./routes/student.route.js";
import attendanceRoutes from "./routes/attendance.route.js";
import errorHandler from "./middleware/errorHandler.middleware.js";

dotenv.config();

const app = express();

// Trust reverse proxy (Render, Cloudflare, etc.)
app.set("trust proxy", 1);

// CORS configuration supporting FRONTEND_URL with credentials enabled
const rawFrontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
const allowedOrigins = rawFrontendUrl
  .split(",")
  .map((url) => url.trim().replace(/\/$/, ""))
  .filter(Boolean);

const corsOptions = {
  origin: allowedOrigins.length === 1 ? allowedOrigins[0] : allowedOrigins,
  credentials: true,
  allowedHeaders: ["Authorization", "Content-Type"],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
};

app.use(cors(corsOptions));

// Keep-alive health check for Render / monitoring (no DB queries, no auth)
app.get("/health", (req, res) => {
  res.status(200).send("ok");
});

// Cookie parser and JSON body parser with strict size limit
app.use(cookieParser());
app.use(express.json({ limit: "10kb" }));

// Basic health check route
app.get("/api/health", (req, res) => {
  const dbState = mongoose.connection.readyState;
  const stateLabels = { 0: "disconnected", 1: "connected", 2: "connecting", 3: "disconnecting" };
  const isHealthy = dbState === 1;

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? "ok" : "degraded",
    database: stateLabels[dbState] || "unknown",
    dbName: mongoose.connection.name || null,
    timestamp: new Date().toISOString(),
  });
});

// Mount Authentication & Workspace Routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/teacher", teacherRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/attendance", attendanceRoutes);

// Centralized Error Handler (must be registered after all routes)
app.use(errorHandler);

export default app;