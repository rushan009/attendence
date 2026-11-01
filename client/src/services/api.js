import axios from 'axios'

const API_ROOT = (import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')

/**
 * Shared Axios client for all API communication.
 * Handles:
 * 1. Base URL configuration via VITE_API_URL
 * 2. withCredentials: true for backwards-compatible cookie handling
 * 3. Request interceptor attaching Authorization: Bearer <token>
 * 4. Response interceptor handling 401 unauthorized errors with token cleanup and safe redirection
 */
const api = axios.create({
  baseURL: API_ROOT,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 12000,
})

// Request Interceptor: Attach Authorization Bearer token from localStorage
api.interceptors.request.use(
  (config) => {
    try {
      const token = localStorage.getItem('auth_token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    } catch {
      // LocalStorage access may fail in strict private browsing environments
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response Interceptor: Handle 401s, clear auth state, and safely redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      try {
        localStorage.removeItem('auth_token')
      } catch {
        // Ignore storage errors
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('auth:unauthorized'))
        const pathname = window.location.pathname
        // Prevent redirect loops on the login or registration page
        if (pathname !== '/login' && pathname !== '/register') {
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(error)
  }
)

/**
 * Normalizes Axios errors into a consistent format with status and message.
 */
export function handleAxiosError(error) {
  if (error.response) {
    const message =
      error.response.data?.message ||
      `Request failed with status ${error.response.status}`
    const normalized = new Error(message)
    normalized.status = error.response.status
    normalized.data = error.response.data
    return normalized
  }
  if (error.request) {
    const normalized = new Error(
      'Cannot reach school server. Please verify your connection.'
    )
    normalized.status = 0
    normalized.isNetworkError = true
    return normalized
  }
  return error
}

export default api

