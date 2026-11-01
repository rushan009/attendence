import api, { handleAxiosError } from './api.js'

/**
 * Admin: Get students belonging to a specific class.
 * GET /api/students?classId=<id>
 * @param {string} classId
 * @returns {Promise<{ success: boolean, class: object, students: Array }>}
 */
export async function getStudentsByClass(classId) {
  try {
    const res = await api.get('/api/students', {
      params: { classId },
    })
    return res.data
  } catch (err) {
    throw handleAxiosError(err)
  }
}

/**
 * Teacher: Get students of the class assigned to the logged-in teacher.
 * GET /api/students/my-class
 * @returns {Promise<{ success: boolean, class: object|null, classes: Array, students: Array, message?: string }>}
 */
export async function getMyClassStudents() {
  try {
    const res = await api.get('/api/students/my-class')
    return res.data
  } catch (err) {
    throw handleAxiosError(err)
  }
}

/**
 * Import students via Excel spreadsheet.
 * POST /api/students/import
 * Preserved for ImportStudentsPage.jsx.
 */
export async function importStudents(file, classId) {
  try {
    const formData = new FormData()
    formData.append('file', file)
    if (classId) {
      formData.append('classId', classId)
    }

    const res = await api.post('/api/students/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return res.data
  } catch (err) {
    throw handleAxiosError(err)
  }
}

/**
 * Create a new student record.
 * POST /api/students
 * @param {object} payload - { name, roll, gender, guardianPhone, guardianName, classId }
 * @returns {Promise<object>}
 */
export async function createStudent(payload) {
  try {
    const res = await api.post('/api/students', payload)
    return res.data
  } catch (err) {
    throw handleAxiosError(err)
  }
}

/**
 * Update an existing student record.
 * PUT /api/students/:id
 * @param {string} id
 * @param {object} payload - { name, roll, gender, guardianPhone, guardianName }
 * @returns {Promise<{ success: boolean, student: object }>}
 */
export async function updateStudent(id, payload) {
  try {
    const res = await api.put(`/api/students/${id}`, payload)
    return res.data
  } catch (err) {
    throw handleAxiosError(err)
  }
}

/**
 * Change student active/inactive status.
 * PATCH /api/students/:id/status
 * @param {string} id
 * @param {'active' | 'inactive'} status
 * @returns {Promise<{ success: boolean, student: object }>}
 */
export async function setStudentStatus(id, status) {
  try {
    const res = await api.patch(`/api/students/${id}/status`, { status })
    return res.data
  } catch (err) {
    throw handleAxiosError(err)
  }
}

export default {
  getStudentsByClass,
  getMyClassStudents,
  importStudents,
  createStudent,
  updateStudent,
  setStudentStatus,
}
