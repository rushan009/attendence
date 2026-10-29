import { Router } from "express";
import { getTeacherDashboard } from "../controllers/teacher.controller.js";
import authenticate from "../middleware/auth.middleware.js";
import requireRole from "../middleware/roles.middleware.js";

const router = Router();

// Strictly guard all teacher routes to authenticated teachers only
router.use(authenticate, requireRole("teacher"));

// GET /api/teacher/dashboard
router.get("/dashboard", getTeacherDashboard);

export default router;
