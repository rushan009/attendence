import axios from 'axios'

/**
 * Axios instance configured for HajirPati authentication.
 * All auth endpoints rely on httpOnly cookies set by the backend.
 * withCredentials: true ensures cookies are passed and stored securely.
 */
const api = axios.create({
  baseURL: import.meta?.env?.VITE_API_BASE_URL || '/api/auth',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 12000,
})

/**
 * Normalizes Axios errors into a consistent format with status and message.
 */
function handleAxiosError(error) {
  if (error.response) {
    // Server responded with non-2xx status
    const message = error.response.data?.message || `Request failed with status ${error.response.status}`
    const normalized = new Error(message)
    normalized.status = error.response.status
    normalized.data = error.response.data
    return normalized
  }
  if (error.request) {
    // Request was made but no response was received (network failure / server down)
    const normalized = new Error('Cannot reach school server. Please check your network or try again in a moment.')
    normalized.status = 0
    normalized.isNetworkError = true
    return normalized
  }
  return error
}

/**
 * POST /api/auth/login
 * @param {{ phone: string, pin: string }} credentials
 * @returns {Promise<{ success: boolean, user: object }>}
 */
export async function login({ phone, pin }) {
  try {
    const res = await api.post('/login', { phone, pin })
    return res.data
  } catch (err) {
    throw handleAxiosError(err)
  }
}

/**
 * POST /api/auth/register
 * @param {{ name: string, phone: string, pin: string }} data
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export async function register({ name, phone, pin, classId } = {}) {
  try {
    const payload = {
      name: name?.trim(),
      phone: phone?.trim(),
      pin: pin?.trim(),
    }
    if (classId && typeof classId === 'string' && classId.trim()) {
      payload.classId = classId.trim()
    }
    const res = await api.post('/register', payload)
    return res.data
  } catch (err) {
    throw handleAxiosError(err)
  }
}

export async function getAdminTeachers(status) {
  try {
    const res = await api.get('/api/admin/teachers', {
      params: status ? { status } : undefined,
    })
    return res.data
  } catch (err) {
    throw handleAxiosError(err)
  }
}

export async function getAdminClasses() {
  try {
    const res = await api.get('/api/admin/classes')
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

/**
 * GET /api/auth/me
 * Restores user session from httpOnly cookie.
 * @returns {Promise<{ success: boolean, user: object }>}
 */
export async function getMe() {
  try {
    const res = await api.get('/me')
    return res.data
  } catch (err) {
    throw handleAxiosError(err)
  }
}

/**
 * POST /api/auth/logout
 * Clears the httpOnly session cookie on the backend.
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export async function logout() {
  try {
    const res = await api.post('/logout')
    return res.data
  } catch (err) {
    throw handleAxiosError(err)
  }
}

export default api
