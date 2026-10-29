import mongoose from "mongoose";
import xlsx from "xlsx";
import pkg from "nepali-date-converter";
import Attendance from "../models/attendance.model.js";
import Class from "../models/class.model.js";
import Student from "../models/student.model.js";
import { getNepalToday, toAdDate, getDaysInBsMonth } from "../utils/nepaliDate.js";
import { getHolidayByBsDate, getHolidaysInRange } from "../config/holidays.config.js";

const NepaliDate = pkg.default || pkg;

export const ATTENDANCE_THRESHOLD = 75;

/**
 * Helper to resolve the assigned class for a teacher.
 * Checks Class.teacher === teacherId, falling back to user.class reference.
 */
const getTeacherAssignedClass = async (user) => {
  const teacherId = user._id || user.id;
  let assignedClass = await Class.findOne({ teacher: teacherId });
  if (!assignedClass && user.class) {
    const classId = user.class._id || user.class;
    assignedClass = await Class.findById(classId);
  }
  return assignedClass;
};

/**
 * GET /api/attendance/today
 * Teacher only.
 * Finds teacher's class, returns { class, dateBs, students (active, sorted by roll), attendance (the record or null) }.
 */
export const getTodayAttendance = async (req, res, next) => {
  try {
    const { dateBs, dateAd } = getNepalToday();
    const assignedClass = await getTeacherAssignedClass(req.user);

    if (!assignedClass) {
      return res.status(200).json({
        success: true,
        class: null,
        dateBs,
        dateAd,
        students: [],
        attendance: null,
        message: "No class is currently assigned to this teacher.",
      });
    }

    // Only active students sorted by roll number
    const students = await Student.find({
      class: assignedClass._id,
      status: "active",
    })
      .sort({ roll: 1 })
      .lean();

    // Check if attendance has already been taken today
    const attendance = await Attendance.findOne({
      class: assignedClass._id,
      dateBs,
    })
      .populate("absentees", "name roll")
      .populate("teacher", "name")
      .populate("editedBy", "name")
      .lean();

    return res.status(200).json({
      success: true,
      class: {
        id: assignedClass._id.toString(),
        name: assignedClass.name,
        section: assignedClass.section || "",
      },
      dateBs,
      dateAd,
      students,
      attendance,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/attendance
 * Teacher only.
 * Body: { absentees: [studentIds] }
 * Class and date are determined by the server in Nepal Time (UTC+5:45).
 */
export const createAttendance = async (req, res, next) => {
  try {
    const assignedClass = await getTeacherAssignedClass(req.user);
    if (!assignedClass) {
      return res.status(400).json({
        success: false,
        message: "No class assigned to this teacher. Cannot submit attendance.",
      });
    }

    const { dateBs, dateAd } = getNepalToday();

    // Check if attendance already exists for today
    const existing = await Attendance.findOne({
      class: assignedClass._id,
      dateBs,
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Attendance has already been taken for this class today.",
      });
    }

    // Validate absentees body
    const rawAbsentees = req.body?.absentees ?? [];
    if (!Array.isArray(rawAbsentees)) {
      return res.status(400).json({
        success: false,
        message: "Absentees must be an array of student IDs.",
      });
    }

    // Deduplicate IDs and validate format
    const uniqueAbsenteeIds = [
      ...new Set(rawAbsentees.map((id) => String(id).trim())),
    ];

    for (const id of uniqueAbsenteeIds) {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: `Invalid student ID format: ${id}`,
        });
      }
    }

    // Retrieve active students for this class
    const activeStudents = await Student.find({
      class: assignedClass._id,
      status: "active",
    });

    const activeStudentIdSet = new Set(
      activeStudents.map((s) => s._id.toString())
    );

    // Verify all absentee IDs belong to this class and are active
    for (const id of uniqueAbsenteeIds) {
      if (!activeStudentIdSet.has(id)) {
        return res.status(400).json({
          success: false,
          message:
            "Every absentee must be an active student belonging to this class.",
        });
      }
    }

    // Counts always calculated by the server, never trusted from client
    const absent = uniqueAbsenteeIds.length;
    const present = activeStudents.length - absent;

    try {
      const attendance = await Attendance.create({
        class: assignedClass._id,
        dateBs,
        dateAd,
        present,
        absent,
        absentees: uniqueAbsenteeIds,
        teacher: req.user._id || req.user.id,
      });

      const populated = await Attendance.findById(attendance._id)
        .populate("absentees", "name roll")
        .populate("class", "name section")
        .populate("teacher", "name");

      return res.status(201).json({
        success: true,
        message: "Attendance recorded successfully.",
        attendance: populated,
      });
    } catch (err) {
      if (err.code === 11000) {
        return res.status(409).json({
          success: false,
          message: "Attendance has already been taken for this class today.",
        });
      }
      throw err;
    }
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/attendance?classId=&from=&to=
 * Admin, or teacher restricted to their own class.
 * List of records in a BS or AD date range, absentees populated (name, roll), sorted by date descending.
 */
export const getAttendanceRecords = async (req, res, next) => {
  try {
    const { dateBs: todayBs } = getNepalToday();
    const filter = {};

    // Restrict teachers strictly to their own class
    if (req.user.role === "teacher") {
      const assignedClass = await getTeacherAssignedClass(req.user);
      if (!assignedClass) {
        return res.status(200).json({
          success: true,
          records: [],
          dateBs: todayBs,
          message: "No class assigned to this teacher.",
        });
      }
      filter.class = assignedClass._id;
    } else {
      // Admin may optionally filter by classId
      if (req.query.classId) {
        if (!mongoose.Types.ObjectId.isValid(req.query.classId)) {
          return res.status(400).json({
            success: false,
            message: "Invalid classId format.",
          });
        }
        filter.class = req.query.classId;
      }
    }

    // Date range filter (supports both BS dates e.g. "2083-07-01" and AD dates e.g. "2026-10-01")
    const { from, to } = req.query;
    if (from || to) {
      const fromStr = from ? String(from).trim() : null;
      const toStr = to ? String(to).trim() : null;

      // Check if BS format (year >= 2070)
      const isBs =
        (fromStr && fromStr >= "2070") || (toStr && toStr >= "2070");

      if (isBs) {
        filter.dateBs = {};
        if (fromStr) filter.dateBs.$gte = fromStr;
        if (toStr) filter.dateBs.$lte = toStr;
      } else {
        // AD date range
        filter.dateAd = {};
        if (fromStr) {
          filter.dateAd.$gte = new Date(`${fromStr}T00:00:00+05:45`);
        }
        if (toStr) {
          filter.dateAd.$lte = new Date(`${toStr}T23:59:59.999+05:45`);
        }
      }
    }

    const records = await Attendance.find(filter)
      .sort({ dateAd: -1, createdAt: -1 })
      .populate("absentees", "name roll")
      .populate("class", "name section")
      .populate("teacher", "name phone")
      .populate("editedBy", "name")
      .lean();

    return res.status(200).json({
      success: true,
      records,
      dateBs: todayBs,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/attendance/:id
 * Admin, or the teacher of that class.
 * One record with populated absentees.
 */
export const getAttendanceById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid attendance ID format.",
      });
    }

    const record = await Attendance.findById(id)
      .populate("absentees", "name roll")
      .populate("class", "name section teacher")
      .populate("teacher", "name phone")
      .populate("editedBy", "name");

    if (!record) {
      return res.status(404).json({
        success: false,
        message: "Attendance record not found.",
      });
    }

    // Role check for teachers: must be class teacher or original taker
    if (req.user.role === "teacher") {
      const teacherId = (req.user._id || req.user.id).toString();
      const isClassTeacher =
        record.class?.teacher?.toString() === teacherId;
      const isRecordTeacher =
        record.teacher?._id?.toString() === teacherId ||
        record.teacher?.toString() === teacherId;

      if (!isClassTeacher && !isRecordTeacher) {
        return res.status(403).json({
          success: false,
          message:
            "Forbidden: You are not authorized to view attendance for this class.",
        });
      }
    }

    return res.status(200).json({
      success: true,
      attendance: record,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/attendance/:id
 * Admin only.
 * Body: { absentees: [studentIds] }
 * Replaces absentees, recalculates present/absent, sets editedBy and editedAt.
 * Never changes teacher.
 */
export const updateAttendance = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid attendance ID format.",
      });
    }

    const record = await Attendance.findById(id);
    if (!record) {
      return res.status(404).json({
        success: false,
        message: "Attendance record not found.",
      });
    }

    const rawAbsentees = req.body?.absentees ?? [];
    if (!Array.isArray(rawAbsentees)) {
      return res.status(400).json({
        success: false,
        message: "Absentees must be an array of student IDs.",
      });
    }

    const uniqueAbsenteeIds = [
      ...new Set(rawAbsentees.map((item) => String(item).trim())),
    ];

    for (const absenteeId of uniqueAbsenteeIds) {
      if (!mongoose.Types.ObjectId.isValid(absenteeId)) {
        return res.status(400).json({
          success: false,
          message: `Invalid student ID format: ${absenteeId}`,
        });
      }
    }

    // Fetch active students belonging to this class
    const activeStudents = await Student.find({
      class: record.class,
      status: "active",
    });

    const activeStudentIdSet = new Set(
      activeStudents.map((s) => s._id.toString())
    );

    for (const absenteeId of uniqueAbsenteeIds) {
      if (!activeStudentIdSet.has(absenteeId)) {
        return res.status(400).json({
          success: false,
          message:
            "Every absentee must be an active student belonging to this class.",
        });
      }
    }

    // Server-side recalculation
    record.absentees = uniqueAbsenteeIds;
    record.absent = uniqueAbsenteeIds.length;
    record.present = activeStudents.length - record.absent;
    record.editedBy = req.user._id || req.user.id;
    record.editedAt = new Date();
    // teacher is strictly preserved

    await record.save();

    const populated = await Attendance.findById(record._id)
      .populate("absentees", "name roll")
      .populate("class", "name section")
      .populate("teacher", "name")
      .populate("editedBy", "name");

    return res.status(200).json({
      success: true,
      message: "Attendance record updated successfully.",
      attendance: populated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Shared helper to validate and compute attendance report data.
 * Used by both JSON report API and Excel export.
 */
async function computeAttendanceReportData({ user, classId, from, to }) {
  if (!classId) {
    const error = new Error("classId is required.");
    error.statusCode = 400;
    throw error;
  }

  if (!mongoose.Types.ObjectId.isValid(classId)) {
    const error = new Error("Invalid classId format.");
    error.statusCode = 400;
    throw error;
  }

  if (!from || !to) {
    const error = new Error("Both 'from' and 'to' date parameters are required.");
    error.statusCode = 400;
    throw error;
  }

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(from) || !dateRegex.test(to)) {
    const error = new Error("Dates must be in 'YYYY-MM-DD' BS format.");
    error.statusCode = 400;
    throw error;
  }

  if (from > to) {
    const error = new Error("'from' date cannot be after 'to' date.");
    error.statusCode = 400;
    throw error;
  }

  // Validate range <= 366 days
  const adFrom = toAdDate(from);
  const adTo = toAdDate(to);
  if (!adFrom || !adTo) {
    const error = new Error("Invalid Bikram Sambat date provided.");
    error.statusCode = 400;
    throw error;
  }

  const diffDays = Math.round((adTo - adFrom) / (1000 * 60 * 60 * 24));
  if (diffDays > 366) {
    const error = new Error("Date range cannot exceed 1 year (366 days).");
    error.statusCode = 400;
    throw error;
  }

  const classDoc = await Class.findById(classId).lean();
  if (!classDoc) {
    const error = new Error("Class not found.");
    error.statusCode = 404;
    throw error;
  }

  // Teacher authorization check: teacher may only request their own class
  if (user.role === "teacher") {
    const teacherId = (user._id || user.id).toString();
    const isClassTeacher =
      classDoc.teacher && classDoc.teacher.toString() === teacherId;
    const userClassId = user.class
      ? (user.class._id || user.class).toString()
      : null;
    if (!isClassTeacher && userClassId !== classDoc._id.toString()) {
      const error = new Error(
        "Forbidden: You are only authorized to view reports for your own class."
      );
      error.statusCode = 403;
      throw error;
    }
  }

  // Retrieve active students for this class
  const students = await Student.find({
    class: classDoc._id,
    status: "active",
  })
    .sort({ roll: 1, name: 1 })
    .lean();

  // Retrieve attendance records for this class in the BS date range
  const records = await Attendance.find({
    class: classDoc._id,
    dateBs: { $gte: from, $lte: to },
  })
    .sort({ dateBs: 1 })
    .lean();

  const schoolDays = records.length;
  const recordedDates = records.map((r) => r.dateBs);

  const rows = students.map((student) => {
    const studentId = student._id.toString();
    const absent = records.filter(
      (r) =>
        Array.isArray(r.absentees) &&
        r.absentees.some((absId) => absId.toString() === studentId)
    ).length;
    const present = schoolDays - absent;
    const percentage =
      schoolDays > 0 ? Math.round((present / schoolDays) * 100) : null;

    return {
      studentId,
      roll: student.roll,
      name: student.name,
      present,
      absent,
      percentage,
    };
  });

  const studentCount = students.length;
  const belowThresholdCount =
    schoolDays > 0
      ? rows.filter(
          (r) => r.percentage !== null && r.percentage < ATTENDANCE_THRESHOLD
        ).length
      : 0;

  const averagePercentage =
    schoolDays > 0 && rows.length > 0
      ? Math.round(
          rows.reduce((sum, r) => sum + (r.percentage || 0), 0) / rows.length
        )
      : null;

  return {
    class: {
      _id: classDoc._id.toString(),
      id: classDoc._id.toString(),
      name: classDoc.name,
      section: classDoc.section || "",
    },
    classDoc,
    from,
    to,
    schoolDays,
    studentCount,
    averagePercentage,
    belowThresholdCount,
    rows,
    recordedDates,
  };
}

/**
 * GET /api/attendance/report?classId=&from=&to=
 * Admin or class teacher.
 * Returns: { class, from, to, schoolDays, studentCount, averagePercentage, belowThresholdCount, rows, recordedDates }
 */
export const getAttendanceReport = async (req, res, next) => {
  try {
    const { classId, from, to } = req.query;
    const reportData = await computeAttendanceReportData({
      user: req.user,
      classId,
      from,
      to,
    });

    return res.status(200).json({
      success: true,
      class: reportData.class,
      from: reportData.from,
      to: reportData.to,
      schoolDays: reportData.schoolDays,
      studentCount: reportData.studentCount,
      averagePercentage: reportData.averagePercentage,
      belowThresholdCount: reportData.belowThresholdCount,
      rows: reportData.rows,
      recordedDates: reportData.recordedDates,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }
    next(error);
  }
};

/**
 * GET /api/attendance/report/export?classId=&from=&to=
 * Admin or class teacher.
 * Generates and downloads an Excel file (.xlsx) with title row, date range, summary, and table.
 */
export const exportAttendanceReport = async (req, res, next) => {
  try {
    const { classId, from, to } = req.query;
    const reportData = await computeAttendanceReportData({
      user: req.user,
      classId,
      from,
      to,
    });

    const {
      classDoc,
      schoolDays,
      studentCount,
      averagePercentage,
      belowThresholdCount,
      rows,
    } = reportData;

    const classNameWithSection = `${classDoc.name}${
      classDoc.section ? ` ${classDoc.section}` : ""
    }`.trim();

    // Build worksheet data (AOA)
    const aoa = [
      ["भानु माध्यमिक विद्यालय (Bhanu Secondary School) — डाँडाबजार, धनकुटा"],
      ["Class Attendance Report"],
      [
        `Class: ${classNameWithSection}`,
        `Date Range (BS): ${from} to ${to}`,
        `School Days: ${schoolDays}`,
      ],
      [
        `Total Students: ${studentCount}`,
        `Average Attendance: ${
          averagePercentage !== null ? `${averagePercentage}%` : "No data"
        }`,
        `Below 75%: ${belowThresholdCount}`,
      ],
      [],
      ["Roll", "Student Name", "Present Days", "Absent Days", "Attendance %", "Remarks"],
      ...rows.map((r) => [
        r.roll,
        r.name,
        r.present,
        r.absent,
        schoolDays > 0 ? `${r.percentage}%` : "No data",
        schoolDays > 0
          ? r.percentage < ATTENDANCE_THRESHOLD
            ? "Below 75% · Low"
            : "Normal"
          : "No data",
      ]),
    ];

    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.aoa_to_sheet(aoa);

    // Apply column widths
    ws["!cols"] = [
      { wch: 8 },  // Roll
      { wch: 28 }, // Name
      { wch: 14 }, // Present
      { wch: 14 }, // Absent
      { wch: 16 }, // Attendance %
      { wch: 18 }, // Remarks
    ];

    xlsx.utils.book_append_sheet(wb, ws, "Attendance Report");
    const buffer = xlsx.write(wb, { type: "buffer", bookType: "xlsx" });

    const safeClassName = classNameWithSection.replace(/[^a-zA-Z0-9_-]/g, "_");
    const filename = `attendance-report-${safeClassName}-${from}_to_${to}.xlsx`;

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    return res.send(buffer);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }
    next(error);
  }
};

/**
 * GET /api/attendance/history?classId=&month=
 * Admin or class teacher.
 * month: "YYYY-MM" BS format, e.g. "2083-07"
 * Returns: { class, month, records: [...], missingDates: [...], holidays: [{ dateBs, name }], summary: { recordedDays, averagePercentage, missingDays } }
 */
export const getAttendanceHistory = async (req, res, next) => {
  try {
    const { classId, month } = req.query;

    if (!classId) {
      return res.status(400).json({
        success: false,
        message: "classId parameter is required.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(classId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid classId format.",
      });
    }

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({
        success: false,
        message: "Month must be provided in 'YYYY-MM' BS format (e.g. '2083-07').",
      });
    }

    const classDoc = await Class.findById(classId).lean();
    if (!classDoc) {
      return res.status(404).json({
        success: false,
        message: "Class not found.",
      });
    }

    // Role check for teachers: must be class teacher or assigned
    if (req.user.role === "teacher") {
      const teacherId = (req.user._id || req.user.id).toString();
      const isClassTeacher =
        classDoc.teacher && classDoc.teacher.toString() === teacherId;
      const userClassId = req.user.class
        ? (req.user.class._id || req.user.class).toString()
        : null;
      if (!isClassTeacher && userClassId !== classDoc._id.toString()) {
        return res.status(403).json({
          success: false,
          message: "Forbidden: You are only authorized to view attendance history for your own class.",
        });
      }
    }

    const [yearStr, monthStr] = month.split("-");
    const year = parseInt(yearStr, 10);
    const monthIndex = parseInt(monthStr, 10) - 1; // 0-indexed

    if (monthIndex < 0 || monthIndex > 11) {
      return res.status(400).json({
        success: false,
        message: "Invalid month index in 'YYYY-MM'. Month must be between 01 and 12.",
      });
    }

    const daysInMonth = getDaysInBsMonth(year, monthIndex);
    const fromBs = `${month}-01`;
    const toBs = `${month}-${String(daysInMonth).padStart(2, "0")}`;

    // Get today's BS date in Nepal Time
    const { dateBs: todayBs } = getNepalToday();

    // Query records in the month, newest first
    const records = await Attendance.find({
      class: classDoc._id,
      dateBs: { $gte: fromBs, $lte: toBs },
    })
      .sort({ dateBs: -1 })
      .populate("absentees", "name roll")
      .populate("teacher", "name phone")
      .populate("editedBy", "name")
      .lean();

    const recordDatesSet = new Set(records.map((r) => r.dateBs));

    // Expected school day: not Saturday (day 6), not a public holiday, and not in the future (<= todayBs)
    const missingDates = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const dateBs = `${month}-${String(day).padStart(2, "0")}`;
      if (dateBs > todayBs) continue; // Future days are not missing

      const isSaturday = new NepaliDate(dateBs).getDay() === 6;
      if (isSaturday) continue;

      const isHoliday = Boolean(getHolidayByBsDate(dateBs));
      if (isHoliday) continue;

      if (!recordDatesSet.has(dateBs)) {
        missingDates.push(dateBs);
      }
    }

    // Sort missingDates newest first
    missingDates.sort().reverse();

    // Holidays in this month
    const holidays = getHolidaysInRange(fromBs, toBs);

    // Summary calculations
    const recordedDays = records.length;
    const missingDays = missingDates.length;

    let totalPercentageSum = 0;
    let recordsWithCount = 0;
    for (const r of records) {
      const headCount = (r.present || 0) + (r.absent || 0);
      if (headCount > 0) {
        totalPercentageSum += ((r.present || 0) / headCount) * 100;
        recordsWithCount++;
      }
    }
    const averagePercentage =
      recordsWithCount > 0
        ? Math.round(totalPercentageSum / recordsWithCount)
        : null;

    return res.status(200).json({
      success: true,
      class: {
        id: classDoc._id.toString(),
        _id: classDoc._id.toString(),
        name: classDoc.name,
        section: classDoc.section || "",
      },
      month,
      records,
      missingDates,
      holidays,
      summary: {
        recordedDays,
        averagePercentage,
        missingDays,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/attendance/student/:studentId?month=2083-07
 * Admin or class teacher.
 * Returns: { student, present, absent, percentage, absentDates: [...], dayStatuses: [{ dateBs, status }] }
 */
export const getStudentAttendance = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const { month } = req.query;

    if (!studentId || !mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid studentId parameter.",
      });
    }

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({
        success: false,
        message: "Month must be provided in 'YYYY-MM' BS format (e.g. '2083-07').",
      });
    }

    const student = await Student.findById(studentId).populate("class").lean();
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found.",
      });
    }

    const studentClassId = (student.class?._id || student.class).toString();
    const classDoc = await Class.findById(studentClassId).lean();

    // Teacher authorization check
    if (req.user.role === "teacher") {
      const teacherId = (req.user._id || req.user.id).toString();
      const isClassTeacher =
        classDoc?.teacher && classDoc.teacher.toString() === teacherId;
      const userClassId = req.user.class
        ? (req.user.class._id || req.user.class).toString()
        : null;
      if (!isClassTeacher && userClassId !== studentClassId) {
        return res.status(403).json({
          success: false,
          message: "Forbidden: You are only authorized to view attendance for students in your own class.",
        });
      }
    }

    const [yearStr, monthStr] = month.split("-");
    const year = parseInt(yearStr, 10);
    const monthIndex = parseInt(monthStr, 10) - 1;

    if (monthIndex < 0 || monthIndex > 11) {
      return res.status(400).json({
        success: false,
        message: "Invalid month index in 'YYYY-MM'.",
      });
    }

    const daysInMonth = getDaysInBsMonth(year, monthIndex);
    const fromBs = `${month}-01`;
    const toBs = `${month}-${String(daysInMonth).padStart(2, "0")}`;

    // Get all class attendance records in the month, sorted by date ascending
    const records = await Attendance.find({
      class: studentClassId,
      dateBs: { $gte: fromBs, $lte: toBs },
    })
      .sort({ dateBs: 1 })
      .lean();

    const recordByDate = new Map();
    for (const r of records) {
      recordByDate.set(r.dateBs, r);
    }

    const absentDates = [];
    const dayStatuses = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const dateBs = `${month}-${String(day).padStart(2, "0")}`;
      const rec = recordByDate.get(dateBs);

      if (!rec) {
        dayStatuses.push({ dateBs, status: "none" });
      } else {
        const isAbsent =
          Array.isArray(rec.absentees) &&
          rec.absentees.some((id) => id.toString() === studentId.toString());

        if (isAbsent) {
          absentDates.push(dateBs);
          dayStatuses.push({ dateBs, status: "absent" });
        } else {
          dayStatuses.push({ dateBs, status: "present" });
        }
      }
    }

    const schoolDays = records.length;
    const absent = absentDates.length;
    const present = schoolDays - absent;
    const percentage =
      schoolDays > 0 ? Math.round((present / schoolDays) * 100) : null;

    return res.status(200).json({
      success: true,
      student: {
        id: student._id.toString(),
        _id: student._id.toString(),
        name: student.name,
        roll: student.roll,
        gender: student.gender,
        class: student.class,
      },
      present,
      absent,
      percentage,
      absentDates,
      dayStatuses,
    });
  } catch (error) {
    next(error);
  }
};
