import api, { handleAxiosError } from './api.js'

/**
 * POST /api/auth/login
 * @param {{ phone: string, pin: string }} credentials
 * @returns {Promise<{ success: boolean, token?: string, user: object }>}
 */
export async function login({ phone, pin }) {
  try {
    const res = await api.post('/api/auth/login', { phone, pin })
    if (res.data?.token) {
      try {
        localStorage.setItem('auth_token', res.data.token)
      } catch {
        // Storage access fallback
      }
    }
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
    const res = await api.post('/api/auth/register', payload)
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
 * Restores user session from Bearer token or httpOnly cookie.
 * @returns {Promise<{ success: boolean, user: object }>}
 */
export async function getMe() {
  try {
    const res = await api.get('/api/auth/me')
    return res.data
  } catch (err) {
    throw handleAxiosError(err)
  }
}

/**
 * POST /api/auth/logout
 * Clears session on server and cleans up stored local token.
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export async function logout() {
  try {
    const res = await api.post('/api/auth/logout')
    return res.data
  } catch (err) {
    throw handleAxiosError(err)
  } finally {
    try {
      localStorage.removeItem('auth_token')
    } catch {
      // Storage access fallback
    }
  }
}

export default api
