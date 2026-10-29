import axios from 'axios'

/**
 * Axios instance configured for Teacher Workspace endpoints.
 * Operates with httpOnly session cookies.
 */
const api = axios.create({
  baseURL: '/api/teacher',
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

/**
 * GET /api/teacher/dashboard
 * Fetches the authenticated teacher's assigned class, active student headcount,
 * and current attendance state directly from the database.
 */
export async function getTeacherDashboard() {
  try {
    const res = await api.get('/dashboard')
    return res.data
  } catch (err) {
    throw handleAxiosError(err)
  }
}

export default {
  getTeacherDashboard,
}
