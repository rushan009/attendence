import mongoose from "mongoose";
import { z } from "zod";
import User from "../models/user.model.js";
import Class from "../models/class.model.js";
import Student from "../models/student.model.js";

const statusSchema = z.object({
  status: z.enum(["approved", "rejected"]),
});

const classAssignmentSchema = z.object({
  classId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid class ID format")
    .nullable()
    .optional(),
});

export const createClassSchema = z.object({
  name: z
    .string({ required_error: "Class name is required" })
    .trim()
    .min(1, "Class name cannot be empty"),
  section: z.string().trim().optional().default(""),
  teacherId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid teacher ID format")
    .nullable()
    .optional(),
});

export const updateClassSchema = z.object({
  name: z.string().trim().min(1, "Class name cannot be empty").optional(),
  section: z.string().trim().optional(),
  teacherId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid teacher ID format")
    .nullable()
    .optional(),
});

export const createStudentSchema = z.object({
  name: z
    .string({ required_error: "Student name is required" })
    .trim()
    .min(1, "Student name cannot be empty"),
  roll: z.coerce
    .number({ required_error: "Roll number is required" })
    .int("Roll number must be an integer")
    .positive("Roll number must be greater than 0"),
  gender: z.enum(["male", "female", "other", ""]).optional().default(""),
  guardianPhone: z.string().trim().optional().default(""),
});

export const updateStudentSchema = z.object({
  name: z.string().trim().min(1, "Student name cannot be empty").optional(),
  roll: z.coerce
    .number()
    .int("Roll number must be an integer")
    .positive("Roll number must be greater than 0")
    .optional(),
  gender: z.enum(["male", "female", "other", ""]).optional(),
  guardianPhone: z.string().trim().optional(),
});

const toTeacherResponse = (teacher) => ({
  id: teacher._id,
  name: teacher.name,
  phone: teacher.phone,
  role: teacher.role,
  status: teacher.status,
  approved: teacher.approved === true,
  class: teacher.class,
  createdAt: teacher.createdAt,
  updatedAt: teacher.updatedAt,
});

const findTeacher = async (teacherId) => {
  if (!mongoose.isValidObjectId(teacherId)) {
    return { error: { status: 400, message: "Invalid teacher ID" } };
  }

  const teacher = await User.findOne({ _id: teacherId, role: "teacher" }).populate("class");
  if (!teacher) {
    return { error: { status: 404, message: "Teacher not found" } };
  }

  return { teacher };
};

// ─── Teachers Management ─────────────────────────────────────────────

export const listTeachers = async (req, res, next) => {
  try {
    const filter = { role: "teacher" };
    if (req.query.status) {
      if (!["pending", "approved", "rejected"].includes(req.query.status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid teacher status filter",
        });
      }
      filter.status = req.query.status;
    }

    const teachers = await User.find(filter).populate("class").sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      teachers: teachers.map(toTeacherResponse),
    });
  } catch (error) {
    next(error);
  }
};

export const updateTeacherStatus = async (req, res, next) => {
  try {
    const { status } = statusSchema.parse(req.body);
    const result = await findTeacher(req.params.teacherId);
    if (result.error) {
      return res.status(result.error.status).json({
        success: false,
        message: result.error.message,
      });
    }

    const { teacher } = result;
    teacher.status = status;
    teacher.approved = status === "approved";
    await teacher.save();

    return res.status(200).json({
      success: true,
      message: `Teacher ${status} successfully`,
      teacher: toTeacherResponse(teacher),
    });
  } catch (error) {
    next(error);
  }
};

export const assignTeacherClass = async (req, res, next) => {
  try {
    const { classId = null } = classAssignmentSchema.parse(req.body);
    const result = await findTeacher(req.params.teacherId);
    if (result.error) {
      return res.status(result.error.status).json({
        success: false,
        message: result.error.message,
      });
    }

    const { teacher } = result;
    if (teacher.status !== "approved") {
      return res.status(409).json({
        success: false,
        message: "Only approved teachers can be assigned to a class",
      });
    }

    let nextClass = null;
    if (classId) {
      nextClass = await Class.findById(classId);
      if (!nextClass) {
        return res.status(404).json({
          success: false,
          message: "Class not found",
        });
      }

      const occupiedBy = await User.findOne({
        role: "teacher",
        class: nextClass._id,
        _id: { $ne: teacher._id },
      });
      if (occupiedBy) {
        return res.status(409).json({
          success: false,
          message: "This class is already assigned to another teacher",
        });
      }
    }

    const previousClassId = teacher.class?._id || teacher.class;
    if (previousClassId && (!nextClass || previousClassId.toString() !== nextClass._id.toString())) {
      await Class.updateOne(
        { _id: previousClassId, teacher: teacher._id },
        { $set: { teacher: null } }
      );
    }

    if (nextClass) {
      await Class.updateOne(
        { _id: nextClass._id },
        { $set: { teacher: teacher._id } }
      );
    }

    teacher.class = nextClass?._id || null;
    await teacher.save();
    await teacher.populate("class");

    return res.status(200).json({
      success: true,
      message: nextClass ? "Teacher class assignment updated" : "Teacher class assignment removed",
      teacher: toTeacherResponse(teacher),
    });
  } catch (error) {
    next(error);
  }
};

// ─── Classes & Sections Management ────────────────────────────────────

export const listClasses = async (req, res, next) => {
  try {
    const classes = await Class.find()
      .populate("teacher", "name phone status")
      .sort({ name: 1, section: 1 });

    // Aggregate student counts per class
    const classIds = classes.map((c) => c._id);
    const studentCounts = await Student.aggregate([
      { $match: { class: { $in: classIds } } },
      { $group: { _id: "$class", count: { $sum: 1 } } },
    ]);

    const countMap = {};
    studentCounts.forEach((item) => {
      countMap[item._id.toString()] = item.count;
    });

    return res.status(200).json({
      success: true,
      classes: classes.map((classRecord) => ({
        id: classRecord._id,
        name: classRecord.name,
        section: classRecord.section || "",
        teacher: classRecord.teacher
          ? {
              id: classRecord.teacher._id,
              name: classRecord.teacher.name,
              phone: classRecord.teacher.phone,
              status: classRecord.teacher.status,
            }
          : null,
        studentCount: countMap[classRecord._id.toString()] || 0,
      })),
    });
  } catch (error) {
    next(error);
  }
};

export const createClass = async (req, res, next) => {
  try {
    const { name, section = "", teacherId = null } = createClassSchema.parse(req.body);

    // Check duplicate class and section
    const existingClass = await Class.findOne({ name, section });
    if (existingClass) {
      return res.status(409).json({
        success: false,
        message: section
          ? `Class "${name}" with Section "${section}" already exists.`
          : `Class "${name}" already exists.`,
      });
    }

    let assignedTeacher = null;
    if (teacherId) {
      assignedTeacher = await User.findOne({ _id: teacherId, role: "teacher" });
      if (!assignedTeacher) {
        return res.status(404).json({ success: false, message: "Teacher not found" });
      }
      if (assignedTeacher.status !== "approved") {
        return res.status(409).json({
          success: false,
          message: "Only approved teachers can be assigned to a class",
        });
      }
    }

    const newClass = await Class.create({
      name,
      section,
      teacher: assignedTeacher?._id || null,
    });

    if (assignedTeacher) {
      // If teacher was assigned to another class, remove from that class
      if (assignedTeacher.class) {
        await Class.updateOne(
          { _id: assignedTeacher.class },
          { $set: { teacher: null } }
        );
      }
      assignedTeacher.class = newClass._id;
      await assignedTeacher.save();
    }

    await newClass.populate("teacher", "name phone status");

    return res.status(201).json({
      success: true,
      message: "Class created successfully",
      class: {
        id: newClass._id,
        name: newClass.name,
        section: newClass.section || "",
        teacher: newClass.teacher
          ? {
              id: newClass.teacher._id,
              name: newClass.teacher.name,
              phone: newClass.teacher.phone,
              status: newClass.teacher.status,
            }
          : null,
        studentCount: 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateClass = async (req, res, next) => {
  try {
    const { classId } = req.params;
    if (!mongoose.isValidObjectId(classId)) {
      return res.status(400).json({ success: false, message: "Invalid class ID" });
    }

    const classRecord = await Class.findById(classId);
    if (!classRecord) {
      return res.status(404).json({ success: false, message: "Class not found" });
    }

    const { name, section, teacherId } = updateClassSchema.parse(req.body);

    const targetName = name !== undefined ? name : classRecord.name;
    const targetSection = section !== undefined ? section : classRecord.section;

    // Check duplicate if name or section is changing
    if (targetName !== classRecord.name || targetSection !== classRecord.section) {
      const duplicate = await Class.findOne({
        _id: { $ne: classId },
        name: targetName,
        section: targetSection,
      });
      if (duplicate) {
        return res.status(409).json({
          success: false,
          message: targetSection
            ? `Class "${targetName}" with Section "${targetSection}" already exists.`
            : `Class "${targetName}" already exists.`,
        });
      }
      classRecord.name = targetName;
      classRecord.section = targetSection;
    }

    // Handle teacher assignment update if teacherId is explicitly provided in body
    if (teacherId !== undefined) {
      const previousTeacherId = classRecord.teacher;

      if (teacherId) {
        const nextTeacher = await User.findOne({ _id: teacherId, role: "teacher" });
        if (!nextTeacher) {
          return res.status(404).json({ success: false, message: "Teacher not found" });
        }
        if (nextTeacher.status !== "approved") {
          return res.status(409).json({
            success: false,
            message: "Only approved teachers can be assigned to a class",
          });
        }

        // If another class had this teacher, unassign it
        if (nextTeacher.class && nextTeacher.class.toString() !== classId) {
          await Class.updateOne(
            { _id: nextTeacher.class },
            { $set: { teacher: null } }
          );
        }

        // If this class had a different previous teacher, clear previous teacher's class
        if (previousTeacherId && previousTeacherId.toString() !== teacherId) {
          await User.updateOne(
            { _id: previousTeacherId },
            { $set: { class: null } }
          );
        }

        nextTeacher.class = classRecord._id;
        await nextTeacher.save();
        classRecord.teacher = nextTeacher._id;
      } else {
        // Teacher unassigned
        if (previousTeacherId) {
          await User.updateOne(
            { _id: previousTeacherId },
            { $set: { class: null } }
          );
        }
        classRecord.teacher = null;
      }
    }

    await classRecord.save();
    await classRecord.populate("teacher", "name phone status");

    const studentCount = await Student.countDocuments({ class: classRecord._id });

    return res.status(200).json({
      success: true,
      message: "Class updated successfully",
      class: {
        id: classRecord._id,
        name: classRecord.name,
        section: classRecord.section || "",
        teacher: classRecord.teacher
          ? {
              id: classRecord.teacher._id,
              name: classRecord.teacher.name,
              phone: classRecord.teacher.phone,
              status: classRecord.teacher.status,
            }
          : null,
        studentCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteClass = async (req, res, next) => {
  try {
    const { classId } = req.params;
    if (!mongoose.isValidObjectId(classId)) {
      return res.status(400).json({ success: false, message: "Invalid class ID" });
    }

    const classRecord = await Class.findById(classId);
    if (!classRecord) {
      return res.status(404).json({ success: false, message: "Class not found" });
    }

    // Unassign any teacher pointing to this class
    await User.updateMany({ class: classId }, { $set: { class: null } });

    // Remove all students in this class
    await Student.deleteMany({ class: classId });

    // Remove the class record
    await Class.deleteOne({ _id: classId });

    return res.status(200).json({
      success: true,
      message: `Class "${classRecord.name}${classRecord.section ? ` - ${classRecord.section}` : ""}" deleted successfully`,
    });
  } catch (error) {
    next(error);
  }
};

// ─── Students Management in Class ────────────────────────────────────

export const listClassStudents = async (req, res, next) => {
  try {
    const { classId } = req.params;
    if (!mongoose.isValidObjectId(classId)) {
      return res.status(400).json({ success: false, message: "Invalid class ID" });
    }

    const classRecord = await Class.findById(classId);
    if (!classRecord) {
      return res.status(404).json({ success: false, message: "Class not found" });
    }

    const students = await Student.find({ class: classId }).sort({ roll: 1 });

    return res.status(200).json({
      success: true,
      students: students.map((s) => ({
        id: s._id,
        name: s.name,
        roll: s.roll,
        classId: s.class,
        gender: s.gender || "",
        guardianPhone: s.guardianPhone || "",
        status: s.status,
        createdAt: s.createdAt,
      })),
    });
  } catch (error) {
    next(error);
  }
};

export const createStudent = async (req, res, next) => {
  try {
    const { classId } = req.params;
    if (!mongoose.isValidObjectId(classId)) {
      return res.status(400).json({ success: false, message: "Invalid class ID" });
    }

    const classRecord = await Class.findById(classId);
    if (!classRecord) {
      return res.status(404).json({ success: false, message: "Class not found" });
    }

    const { name, roll, gender = "", guardianPhone = "" } = createStudentSchema.parse(req.body);

    // Check if roll already exists in this class
    const existingStudent = await Student.findOne({ class: classId, roll });
    if (existingStudent) {
      return res.status(409).json({
        success: false,
        message: `Roll number ${roll} is already assigned to "${existingStudent.name}" in this class.`,
      });
    }

    const student = await Student.create({
      name,
      roll,
      class: classId,
      gender,
      guardianPhone,
    });

    return res.status(201).json({
      success: true,
      message: "Student added successfully",
      student: {
        id: student._id,
        name: student.name,
        roll: student.roll,
        classId: student.class,
        gender: student.gender || "",
        guardianPhone: student.guardianPhone || "",
        status: student.status,
        createdAt: student.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateStudent = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    if (!mongoose.isValidObjectId(studentId)) {
      return res.status(400).json({ success: false, message: "Invalid student ID" });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    const { name, roll, gender, guardianPhone } = updateStudentSchema.parse(req.body);

    if (roll !== undefined && roll !== student.roll) {
      const duplicateRoll = await Student.findOne({
        _id: { $ne: studentId },
        class: student.class,
        roll,
      });
      if (duplicateRoll) {
        return res.status(409).json({
          success: false,
          message: `Roll number ${roll} is already assigned to "${duplicateRoll.name}" in this class.`,
        });
      }
      student.roll = roll;
    }

    if (name !== undefined) student.name = name;
    if (gender !== undefined) student.gender = gender;
    if (guardianPhone !== undefined) student.guardianPhone = guardianPhone;

    await student.save();

    return res.status(200).json({
      success: true,
      message: "Student updated successfully",
      student: {
        id: student._id,
        name: student.name,
        roll: student.roll,
        classId: student.class,
        gender: student.gender || "",
        guardianPhone: student.guardianPhone || "",
        status: student.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteStudent = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    if (!mongoose.isValidObjectId(studentId)) {
      return res.status(400).json({ success: false, message: "Invalid student ID" });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    await Student.deleteOne({ _id: studentId });

    return res.status(200).json({
      success: true,
      message: `Student "${student.name}" (Roll: ${student.roll}) removed successfully`,
    });
  } catch (error) {
    next(error);
  }
};
