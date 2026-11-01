import api, { handleAxiosError } from './api.js'

/**
 * GET /api/teacher/dashboard
 * Fetches the authenticated teacher's assigned class, active student headcount,
 * and current attendance state directly from the database.
 */
export async function getTeacherDashboard() {
  try {
    const res = await api.get('/api/teacher/dashboard')
    return res.data
  } catch (err) {
    throw handleAxiosError(err)
  }
}

export default {
  getTeacherDashboard,
}
