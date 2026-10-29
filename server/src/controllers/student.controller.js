import mongoose from 'mongoose';
import Student from '../models/student.model.js';
import Class from '../models/class.model.js';
import xlsx from 'xlsx';

const clean = (v) => String(v ?? '').replace(/\s+/g, ' ').trim();

// "Class 1", "class1", "1" -> "1"
const classKey = (v) => clean(v).toLowerCase().replace(/^class\s*/, '');

// Finds the class by name + section. No section = only a blank-section class matches.
const findClass = (classes, name, section) =>
  classes.find(
    (c) =>
      classKey(c.name) === classKey(name) &&
      clean(c.section).toLowerCase() === clean(section).toLowerCase()
  );

const NOT_FOUND = 'Class not found. Section is required if the class has sections.';

// ---------- Create one student ----------
export const createStudent = async (req, res) => {
  try {
    const { name, roll, class: className, section, gender, guardianPhone, guardianName, classId } = req.body;

    const cleanedName = clean(name);
    if (!cleanedName) {
      return res.status(400).json({ success: false, message: 'Student name is required' });
    }

    const numRoll = Number(roll);
    if (roll === undefined || roll === null || roll === '' || isNaN(numRoll) || numRoll <= 0) {
      return res.status(400).json({ success: false, message: 'Roll number must be a valid positive integer' });
    }

    const cleanedPhone = clean(guardianPhone);
    if (cleanedPhone && !/^\d{10}$/.test(cleanedPhone)) {
      return res.status(400).json({ success: false, message: 'Parent phone number must be 10 digits' });
    }

    let resolvedClassId = null;

    // Support direct classId (preferred) or class name + section lookup
    if (classId) {
      if (!mongoose.Types.ObjectId.isValid(classId)) {
        return res.status(400).json({ success: false, message: 'Invalid classId format' });
      }
      const classDoc = await Class.findById(classId);
      if (!classDoc) {
        return res.status(400).json({ success: false, message: 'Class not found' });
      }
      resolvedClassId = classDoc._id;
    } else if (className) {
      const classes = await Class.find({});
      const classDoc = findClass(classes, className, section);
      if (!classDoc) {
        return res.status(400).json({ success: false, message: NOT_FOUND });
      }
      resolvedClassId = classDoc._id;
    } else {
      return res.status(400).json({ success: false, message: 'classId or class name is required' });
    }

    // For teachers, verify they own the class
    if (req.user.role === 'teacher') {
      const classDoc = await Class.findById(resolvedClassId).lean();
      const teacherId = (req.user._id || req.user.id).toString();
      if (!classDoc || classDoc.teacher?.toString() !== teacherId) {
        return res.status(403).json({ success: false, message: 'You can only add students to your own class' });
      }
    }

    const student = await Student.create({
      name: cleanedName,
      roll: numRoll,
      class: resolvedClassId,
      gender: clean(gender).toLowerCase(),
      guardianPhone: cleanedPhone,
      guardianName: clean(guardianName),
    });

    const populated = await Student.findById(student._id).populate('class', 'name section');
    return res.status(201).json(populated);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'Roll number already exists in this class' });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ---------- Import students from Excel ----------
export const importStudents = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const rows = xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
    const classes = await Class.find({});

    const students = [];
    const skipped = [];

    rows.forEach((row, i) => {
      const classDoc = findClass(classes, row['CurrentClass'], row['Section']);
      const name = clean(row['FullName'] || row['Name']);
      const roll = Number(row['S.N'] || row['Roll']);

      if (!name || !roll || !classDoc) {
        return skipped.push({ row: i + 2, reason: !classDoc ? NOT_FOUND : 'Name or S.N missing' });
      }

      students.push({
        name,
        roll,
        class: classDoc._id,
        gender: clean(row['Gender']).toLowerCase(),
        guardianPhone: clean(row['Guardian Contact Number'] || row['GuardianPhone'] || row['Guardian Phone'] || row['Parent Phone'] || ''),
        guardianName: clean(row['Guardian Name'] || row['GuardianName'] || row['Parent Name'] || ''),
      });
    });

    let inserted = 0;
    if (students.length > 0) {
      try {
        inserted = (await Student.insertMany(students, { ordered: false })).length;
      } catch (error) {
        // duplicates are skipped, the rest are saved
        inserted = error.insertedDocs?.length ?? 0;
      }
    }

    return res.status(201).json({ inserted, skipped });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

/**
 * GET /api/students?classId=<id>
 * Admin only. Returns that class's students sorted by roll ascending,
 * with the class populated (name, section).
 * Return 400 for a missing or invalid classId.
 */
export const getStudentsByClass = async (req, res, next) => {
  try {
    const { classId } = req.query;

    if (!classId || !mongoose.Types.ObjectId.isValid(classId)) {
      return res.status(400).json({
        success: false,
        message: 'A valid classId query parameter is required',
      });
    }

    const classDoc = await Class.findById(classId).lean();
    if (!classDoc) {
      return res.status(404).json({
        success: false,
        message: 'Class not found',
      });
    }

    const students = await Student.find({ class: classId })
      .sort({ roll: 1 })
      .populate('class', 'name section');

    return res.status(200).json({
      success: true,
      class: {
        id: classDoc._id,
        name: classDoc.name,
        section: classDoc.section || '',
      },
      students,
    });
  } catch (error) {
    if (next) return next(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/students/my-class
 * Teacher only. Finds the class(es) where Class.teacher equals the logged-in user's id
 * and returns those students sorted by roll.
 * If no class is assigned, return an empty list with a clear message.
 */
export const getMyClassStudents = async (req, res, next) => {
  try {
    const teacherId = req.user?._id || req.user?.id;
    if (!teacherId) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required',
      });
    }

    // Find class where Class.teacher matches this teacher
    let assignedClasses = await Class.find({ teacher: teacherId }).lean();

    // Fallback: check if req.user.class has a class reference
    if ((!assignedClasses || assignedClasses.length === 0) && req.user?.class) {
      const fallbackId = req.user.class._id || req.user.class;
      const fallbackClass = await Class.findById(fallbackId).lean();
      if (fallbackClass) {
        assignedClasses = [fallbackClass];
      }
    }

    if (!assignedClasses || assignedClasses.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No class is currently assigned to this teacher.',
        class: null,
        classes: [],
        students: [],
      });
    }

    const classIds = assignedClasses.map((c) => c._id);
    const students = await Student.find({ class: { $in: classIds } })
      .sort({ roll: 1 })
      .populate('class', 'name section');

    const primaryClass = assignedClasses[0];

    return res.status(200).json({
      success: true,
      class: {
        id: primaryClass._id,
        name: primaryClass.name,
        section: primaryClass.section || '',
      },
      classes: assignedClasses.map((c) => ({
        id: c._id,
        name: c.name,
        section: c.section || '',
      })),
      students,
    });
  } catch (error) {
    if (next) return next(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PUT /api/students/:id
 * Admin or class teacher. Updates a student's editable fields.
 * Body: { name, roll, gender, guardianPhone, guardianName }
 * Cannot change the student's class.
 */
export const updateStudent = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid student ID format' });
    }

    const student = await Student.findById(id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // For teachers, verify they own the class
    if (req.user.role === 'teacher') {
      const classDoc = await Class.findById(student.class).lean();
      const teacherId = (req.user._id || req.user.id).toString();
      if (!classDoc || classDoc.teacher?.toString() !== teacherId) {
        return res.status(403).json({ success: false, message: 'You can only edit students in your own class' });
      }
    }

    const { name, roll, gender, guardianPhone, guardianName } = req.body;

    if (name !== undefined) {
      const cleanedName = clean(name);
      if (!cleanedName) {
        return res.status(400).json({ success: false, message: 'Student name is required' });
      }
      student.name = cleanedName;
    }

    if (roll !== undefined) {
      const numRoll = Number(roll);
      if (roll === null || roll === '' || isNaN(numRoll) || numRoll <= 0) {
        return res.status(400).json({ success: false, message: 'Roll number must be a valid positive integer' });
      }
      student.roll = numRoll;
    }

    if (gender !== undefined) {
      const cleanedGender = clean(gender).toLowerCase();
      if (!['male', 'female', 'other', ''].includes(cleanedGender)) {
        return res.status(400).json({ success: false, message: 'Invalid gender' });
      }
      student.gender = cleanedGender;
    }

    if (guardianPhone !== undefined) {
      const cleanedPhone = clean(guardianPhone);
      if (cleanedPhone && !/^\d{10}$/.test(cleanedPhone)) {
        return res.status(400).json({ success: false, message: 'Parent phone number must be 10 digits' });
      }
      student.guardianPhone = cleanedPhone;
    }

    if (guardianName !== undefined) {
      student.guardianName = clean(guardianName);
    }

    // The class cannot be changed
    await student.save();

    const populated = await Student.findById(student._id).populate('class', 'name section');
    return res.status(200).json({ success: true, student: populated });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'Roll number already exists in this class' });
    }
    if (next) return next(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PATCH /api/students/:id/status
 * Admin or class teacher. Toggles a student's status between active and inactive.
 * Body: { status: 'active' | 'inactive' }
 */
export const setStudentStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid student ID format' });
    }

    const { status } = req.body;
    if (!status || !['active', 'inactive'].includes(status)) {
      return res.status(400).json({ success: false, message: 'status must be "active" or "inactive"' });
    }

    const student = await Student.findById(id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // For teachers, verify they own the class
    if (req.user.role === 'teacher') {
      const classDoc = await Class.findById(student.class).lean();
      const teacherId = (req.user._id || req.user.id).toString();
      if (!classDoc || classDoc.teacher?.toString() !== teacherId) {
        return res.status(403).json({ success: false, message: 'You can only change status for students in your own class' });
      }
    }

    student.status = status;
    await student.save();

    const populated = await Student.findById(student._id).populate('class', 'name section');
    return res.status(200).json({ success: true, student: populated });
  } catch (error) {
    if (next) return next(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};