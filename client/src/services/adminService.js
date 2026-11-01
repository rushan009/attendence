import api, { handleAxiosError } from './api.js'

// ─── Classes & Sections ──────────────────────────────────────────────

export async function getClasses() {
  try {
    const res = await api.get('/api/admin/classes')
    return res.data
  } catch (err) {
    throw handleAxiosError(err)
  }
}

export async function createClass({ name, section, teacherId }) {
  try {
    const res = await api.post('/api/admin/classes', {
      name: name.trim(),
      section: section ? section.trim() : '',
      teacherId: teacherId || null,
    })
    return res.data
  } catch (err) {
    throw handleAxiosError(err)
  }
}

export async function updateClass(classId, { name, section, teacherId }) {
  try {
    const payload = {}
    if (name !== undefined) payload.name = name.trim()
    if (section !== undefined) payload.section = section ? section.trim() : ''
    if (teacherId !== undefined) payload.teacherId = teacherId || null

    const res = await api.patch(`/api/admin/classes/${classId}`, payload)
    return res.data
  } catch (err) {
    throw handleAxiosError(err)
  }
}

export async function deleteClass(classId) {
  try {
    const res = await api.delete(`/api/admin/classes/${classId}`)
    return res.data
  } catch (err) {
    throw handleAxiosError(err)
  }
}

// ─── Teachers ────────────────────────────────────────────────────────

export async function getTeachers(status) {
  try {
    const res = await api.get('/api/admin/teachers', {
      params: status ? { status } : undefined,
    })
    return res.data
  } catch (err) {
    throw handleAxiosError(err)
  }
}

export async function updateTeacherStatus(teacherId, status) {
  try {
    const res = await api.patch(`/api/admin/teachers/${teacherId}/status`, { status })
    return res.data
  } catch (err) {
    throw handleAxiosError(err)
  }
}

export async function assignTeacherClass(teacherId, classId) {
  try {
    const res = await api.patch(`/api/admin/teachers/${teacherId}/class`, {
      classId: classId || null,
    })
    return res.data
  } catch (err) {
    throw handleAxiosError(err)
  }
}

// ─── Students Roster ─────────────────────────────────────────────────

export async function getClassStudents(classId) {
  try {
    const res = await api.get(`/api/admin/classes/${classId}/students`)
    return res.data
  } catch (err) {
    throw handleAxiosError(err)
  }
}

export async function createStudent(classId, { name, roll, gender, guardianPhone }) {
  try {
    const res = await api.post(`/api/admin/classes/${classId}/students`, {
      name: name.trim(),
      roll: Number(roll),
      gender: gender || '',
      guardianPhone: guardianPhone ? guardianPhone.trim() : '',
    })
    return res.data
  } catch (err) {
    throw handleAxiosError(err)
  }
}

export async function updateStudent(studentId, { name, roll, gender, guardianPhone }) {
  try {
    const payload = {}
    if (name !== undefined) payload.name = name.trim()
    if (roll !== undefined) payload.roll = Number(roll)
    if (gender !== undefined) payload.gender = gender || ''
    if (guardianPhone !== undefined) payload.guardianPhone = guardianPhone ? guardianPhone.trim() : ''

    const res = await api.patch(`/api/admin/students/${studentId}`, payload)
    return res.data
  } catch (err) {
    throw handleAxiosError(err)
  }
}

export async function deleteStudent(studentId) {
  try {
    const res = await api.delete(`/api/admin/students/${studentId}`)
    return res.data
  } catch (err) {
    throw handleAxiosError(err)
  }
}

export default {
  getClasses,
  createClass,
  updateClass,
  deleteClass,
  getTeachers,
  updateTeacherStatus,
  assignTeacherClass,
  getClassStudents,
  createStudent,
  updateStudent,
  deleteStudent,
}
