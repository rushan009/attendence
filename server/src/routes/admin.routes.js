import { Router } from "express";
import {
  assignTeacherClass,
  createClass,
  createClassSchema,
  createStudent,
  createStudentSchema,
  deleteClass,
  deleteStudent,
  listClasses,
  listClassStudents,
  listTeachers,
  updateClass,
  updateClassSchema,
  updateStudent,
  updateStudentSchema,
  updateTeacherStatus,
} from "../controllers/admin.controller.js";
import authenticate from "../middleware/auth.middleware.js";
import requireRole from "../middleware/roles.middleware.js";
import validate from "../middleware/validate.middleware.js";
import { z } from "zod";

const router = Router();

router.use(authenticate, requireRole("admin"));

// Teacher management
router.get("/teachers", listTeachers);
router.patch(
  "/teachers/:teacherId/status",
  validate(z.object({ status: z.enum(["approved", "rejected"]) })),
  updateTeacherStatus
);
router.patch(
  "/teachers/:teacherId/class",
  validate(
    z.object({
      classId: z
        .string()
        .regex(/^[0-9a-fA-F]{24}$/, "Invalid class ID format")
        .nullable()
        .optional(),
    })
  ),
  assignTeacherClass
);

// Classes & sections management
router.get("/classes", listClasses);
router.post("/classes", validate(createClassSchema), createClass);
router.patch("/classes/:classId", validate(updateClassSchema), updateClass);
router.delete("/classes/:classId", deleteClass);

// Students within a class
router.get("/classes/:classId/students", listClassStudents);
router.post("/classes/:classId/students", validate(createStudentSchema), createStudent);
router.patch("/students/:studentId", validate(updateStudentSchema), updateStudent);
router.delete("/students/:studentId", deleteStudent);

export default router;
