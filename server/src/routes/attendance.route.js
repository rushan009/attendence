import { Router } from "express";
import {
  getTodayAttendance,
  createAttendance,
  getAttendanceRecords,
  getAttendanceById,
  updateAttendance,
  getAttendanceReport,
  exportAttendanceReport,
  getAttendanceHistory,
  getStudentAttendance,
} from "../controllers/attendance.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/roles.middleware.js";

const protect = authenticate;
const router = Router();

// GET /api/attendance/today (teacher only)
router.get("/today", protect, requireRole("teacher"), getTodayAttendance);

// POST /api/attendance (teacher only)
router.post("/", protect, requireRole("teacher"), createAttendance);

// GET /api/attendance/history?classId=&month= (admin or teacher)
router.get("/history", protect, requireRole("admin", "teacher"), getAttendanceHistory);

// GET /api/attendance/student/:studentId?month= (admin or teacher)
router.get("/student/:studentId", protect, requireRole("admin", "teacher"), getStudentAttendance);

// GET /api/attendance/report (admin or teacher)
router.get("/report", protect, requireRole("admin", "teacher"), getAttendanceReport);

// GET /api/attendance/report/export (admin or teacher)
router.get("/report/export", protect, requireRole("admin", "teacher"), exportAttendanceReport);

// GET /api/attendance?classId=&from=&to= (admin or teacher)
router.get("/", protect, requireRole("admin", "teacher"), getAttendanceRecords);

// GET /api/attendance/:id (admin or class teacher)
router.get("/:id", protect, requireRole("admin", "teacher"), getAttendanceById);

// PUT /api/attendance/:id (admin only)
router.put("/:id", protect, requireRole("admin"), updateAttendance);

export default router;
