import axios from 'axios'

/**
 * Axios instance configured for Student endpoints.
 * Configured with httpOnly cookie credentials and matching adminService setup.
 */
const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
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

/**
 * Admin: Get students belonging to a specific class.
 * GET /api/students?classId=<id>
 * @param {string} classId
 * @returns {Promise<{ success: boolean, class: object, students: Array }>}
 */
export async function getStudentsByClass(classId) {
  try {
    const res = await api.get('/students', {
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
    const res = await api.get('/students/my-class')
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

    const res = await api.post('/students/import', formData, {
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
    const res = await api.post('/students', payload)
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
    const res = await api.put(`/students/${id}`, payload)
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
    const res = await api.patch(`/students/${id}/status`, { status })
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