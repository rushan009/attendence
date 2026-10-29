import express from "express";
import {
  createStudent,
  importStudents,
  getStudentsByClass,
  getMyClassStudents,
  updateStudent,
  setStudentStatus,
} from "../controllers/student.controller.js";
import { upload } from "../middleware/upload.middleware.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/roles.middleware.js";

const protect = authenticate;
const router = express.Router();

// GET /api/students/my-class (teacher only)
router.get("/my-class", protect, requireRole("teacher"), getMyClassStudents);

// GET /api/students?classId=<id> (admin only)
router.get("/", protect, requireRole("admin"), getStudentsByClass);

// Route to create a single student
router.post("/", protect, requireRole("admin", "teacher"), createStudent);

// Route to edit a student
router.put("/:id", protect, requireRole("admin", "teacher"), updateStudent);

// Route to toggle a student's active/inactive status
router.patch("/:id/status", protect, requireRole("admin", "teacher"), setStudentStatus);

// Route to import students from an Excel file
router.post(
  "/import",
  protect,
  requireRole("admin", "teacher"),
  upload.single("file"),
  importStudents
);

export default router;