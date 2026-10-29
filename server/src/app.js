import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import teacherRoutes from "./routes/teacher.routes.js";
import studentRoutes from "./routes/student.route.js";
import attendanceRoutes from "./routes/attendance.route.js";
import errorHandler from "./middleware/errorHandler.middleware.js";

dotenv.config();

const app = express();

// CORS configuration limited to FRONTEND_URL with credentials enabled
const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
app.use(
  cors({
    origin: frontendUrl,
    credentials: true,
  })
);

// Cookie parser and JSON body parser with strict size limit
app.use(cookieParser());
app.use(express.json({ limit: "10kb" }));

// Basic health check route
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
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