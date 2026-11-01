import api, { handleAxiosError } from './api.js'

/**
 * Teacher: Fetch today's class, students roster, and attendance status.
 * GET /api/attendance/today
 * @returns {Promise<{ success: boolean, class: object|null, dateBs: string, dateAd: string, students: Array, attendance: object|null, message?: string }>}
 */
export async function getTodayAttendance() {
  try {
    const res = await api.get('/api/attendance/today')
    return res.data
  } catch (err) {
    throw handleAxiosError(err)
  }
}

/**
 * Teacher: Submit today's attendance for the assigned class.
 * POST /api/attendance
 * @param {Array<string>} absentees - Array of absent student IDs
 * @returns {Promise<{ success: boolean, message: string, attendance: object }>}
 */
export async function submitAttendance(absentees = []) {
  try {
    const res = await api.post('/api/attendance', { absentees })
    return res.data
  } catch (err) {
    throw handleAxiosError(err)
  }
}

/**
 * Admin / Teacher: List attendance records with optional filters.
 * GET /api/attendance?classId=&from=&to=
 * @param {object} [params] - { classId, from, to }
 * @returns {Promise<{ success: boolean, records: Array, dateBs: string, message?: string }>}
 */
export async function getAttendanceRecords(params = {}) {
  try {
    const res = await api.get('/api/attendance', { params })
    return res.data
  } catch (err) {
    throw handleAxiosError(err)
  }
}

/**
 * Admin / Teacher: Get a single attendance record by ID.
 * GET /api/attendance/:id
 * @param {string} id - Attendance record ID
 * @returns {Promise<{ success: boolean, attendance: object }>}
 */
export async function getAttendanceById(id) {
  try {
    const res = await api.get(`/api/attendance/${id}`)
    return res.data
  } catch (err) {
    throw handleAxiosError(err)
  }
}

/**
 * Admin only: Update an existing attendance record's absentees.
 * PUT /api/attendance/:id
 * @param {string} id - Attendance record ID
 * @param {Array<string>} absentees - Updated list of absent student IDs
 * @returns {Promise<{ success: boolean, message: string, attendance: object }>}
 */
export async function updateAttendance(id, absentees = []) {
  try {
    const res = await api.put(`/api/attendance/${id}`, { absentees })
    return res.data
  } catch (err) {
    throw handleAxiosError(err)
  }
}

/**
 * Fetch detailed class attendance report with per-student stats.
 * GET /api/attendance/report?classId=&from=&to=
 * @param {object} params - { classId, from, to }
 * @returns {Promise<{ success: boolean, class: object, from: string, to: string, schoolDays: number, studentCount: number, averagePercentage: number|null, belowThresholdCount: number, rows: Array, recordedDates: Array }>}
 */
export async function getAttendanceReport(params = {}) {
  try {
    const res = await api.get('/api/attendance/report', { params })
    return res.data
  } catch (err) {
    throw handleAxiosError(err)
  }
}

/**
 * Download attendance report as an Excel spreadsheet (.xlsx).
 * GET /api/attendance/report/export?classId=&from=&to=
 * @param {object} params - { classId, from, to }
 * @returns {Promise<Blob>}
 */
export async function downloadAttendanceReport(params = {}) {
  try {
    const res = await api.get('/api/attendance/report/export', {
      params,
      responseType: 'blob',
    })
    return res.data
  } catch (err) {
    throw handleAxiosError(err)
  }
}

/**
 * Fetch day-by-day attendance history for a class and month.
 * GET /api/attendance/history?classId=&month=
 * @param {object} params - { classId, month }
 * @returns {Promise<{ success: boolean, class: object, month: string, records: Array, missingDates: Array, holidays: Array, summary: object }>}
 */
export async function getAttendanceHistory(params = {}) {
  try {
    const res = await api.get('/api/attendance/history', { params })
    return res.data
  } catch (err) {
    throw handleAxiosError(err)
  }
}

/**
 * Fetch monthly attendance history for an individual student.
 * GET /api/attendance/student/:studentId?month=
 * @param {string} studentId
 * @param {object} params - { month }
 * @returns {Promise<{ success: boolean, student: object, present: number, absent: number, percentage: number|null, absentDates: Array, dayStatuses: Array }>}
 */
export async function getStudentAttendance(studentId, params = {}) {
  try {
    const res = await api.get(`/api/attendance/student/${studentId}`, { params })
    return res.data
  } catch (err) {
    throw handleAxiosError(err)
  }
}

export default {
  getTodayAttendance,
  submitAttendance,
  getAttendanceRecords,
  getAttendanceById,
  updateAttendance,
  getAttendanceReport,
  downloadAttendanceReport,
  getAttendanceHistory,
  getStudentAttendance,
}
