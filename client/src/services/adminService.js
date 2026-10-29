import axios from 'axios'

/**
 * Axios instance configured for Admin Workspace endpoints.
 * Operates with httpOnly credentials.
 */
const api = axios.create({
  baseURL: '/api/admin',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 12000,
})

function handleAxiosError(error) {
  if (error.response) {
    const message = error.response.data?.message || `Request failed with status ${error.response.status}`
    const normalized = new Error(message)
    normalized.status = error.response.status
    normalized.data = error.response.data
    return normalized
  }
  if (error.request) {
    const normalized = new Error('Cannot reach school server. Please verify your connection.')
    normalized.status = 0
    normalized.isNetworkError = true
    return normalized
  }
  return error
}

// ─── Classes & Sections ──────────────────────────────────────────────

export async function getClasses() {
  try {
    const res = await api.get('/classes')
    return res.data
  } catch (err) {
    throw handleAxiosError(err)
  }
}

export async function createClass({ name, section, teacherId }) {
  try {
    const res = await api.post('/classes', {
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

    const res = await api.patch(`/classes/${classId}`, payload)
    return res.data
  } catch (err) {
    throw handleAxiosError(err)
  }
}

export async function deleteClass(classId) {
  try {
    const res = await api.delete(`/classes/${classId}`)
    return res.data
  } catch (err) {
    throw handleAxiosError(err)
  }
}

// ─── Teachers ────────────────────────────────────────────────────────

export async function getTeachers(status) {
  try {
    const res = await api.get('/teachers', {
      params: status ? { status } : undefined,
    })
    return res.data
  } catch (err) {
    throw handleAxiosError(err)
  }
}

export async function updateTeacherStatus(teacherId, status) {
  try {
    const res = await api.patch(`/teachers/${teacherId}/status`, { status })
    return res.data
  } catch (err) {
    throw handleAxiosError(err)
  }
}

export async function assignTeacherClass(teacherId, classId) {
  try {
    const res = await api.patch(`/teachers/${teacherId}/class`, {
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
    const res = await api.get(`/classes/${classId}/students`)
    return res.data
  } catch (err) {
    throw handleAxiosError(err)
  }
}

export async function createStudent(classId, { name, roll, gender, guardianPhone }) {
  try {
    const res = await api.post(`/classes/${classId}/students`, {
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

    const res = await api.patch(`/students/${studentId}`, payload)
    return res.data
  } catch (err) {
    throw handleAxiosError(err)
  }
}

export async function deleteStudent(studentId) {
  try {
    const res = await api.delete(`/students/${studentId}`)
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
