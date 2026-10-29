import Class from "../models/class.model.js";
import Student from "../models/student.model.js";
import Attendance from "../models/attendance.model.js";
import { getNepalToday } from "../utils/nepaliDate.js";

/**
 * GET /api/teacher/dashboard
 * Retrieves the authenticated teacher's assigned class overview,
 * active student headcount, and today's attendance status.
 */
export const getTeacherDashboard = async (req, res, next) => {
  try {
    const user = req.user;
    const teacherId = user._id || user.id;

    let assignedClass = null;
    let studentCount = 0;
    let attendanceStatus = "not_taken";
    let todayAttendanceData = null;

    // Check if teacher has an assigned class via Class.teacher or user.class
    let classDoc = await Class.findOne({ teacher: teacherId }).lean();
    if (!classDoc && user.class) {
      const classId = user.class._id || user.class;
      classDoc = await Class.findById(classId).lean();
    }

    const { dateBs } = getNepalToday();

    if (classDoc) {
      assignedClass = {
        id: classDoc._id.toString(),
        name: classDoc.name,
        section: classDoc.section || "",
      };

      // Real count of active students enrolled in this assigned class
      studentCount = await Student.countDocuments({
        class: classDoc._id,
        status: "active",
      });

      // Today's attendance for this class
      const todayRecord = await Attendance.findOne({
        class: classDoc._id,
        dateBs,
      }).lean();

      if (todayRecord) {
        attendanceStatus = "submitted";
        todayAttendanceData = {
          id: todayRecord._id,
          present: todayRecord.present,
          absent: todayRecord.absent,
          dateBs: todayRecord.dateBs,
        };
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        teacher: {
          id: user._id,
          name: user.name,
          phone: user.phone,
          role: user.role,
        },
        assignedClass,
        studentCount,
        attendanceStatus,
        attendance: todayAttendanceData,
        dateBs,
        date: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};
