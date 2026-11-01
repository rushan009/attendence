import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import * as authService from '../services/authService.js'

const AuthContext = createContext(null)

/**
 * AuthProvider wraps the application to provide shared authentication state.
 *
 * Supports both token-based auth (Authorization: Bearer header via localStorage key "auth_token")
 * and httpOnly cookies for local development.
 * Restores session automatically on initial mount via GET /api/auth/me.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true) // Initial session restoration check
  const [authError, setAuthError] = useState(null)

  // Verify and restore session on mount
  useEffect(() => {
    let cancelled = false
    authService
      .getMe()
      .then((data) => {
        if (!cancelled && data?.user) {
          setUser(data.user)
        }
      })
      .catch(() => {
        // Not authenticated or expired session — expected for guest
        if (!cancelled) {
          try {
            localStorage.removeItem('auth_token')
          } catch {
            // Ignore storage errors
          }
          setUser(null)
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false)
        }
      })

    // Listen for unauthorized 401 events dispatched by central axios interceptor
    const handleUnauthorized = () => {
      setUser(null)
    }
    window.addEventListener('auth:unauthorized', handleUnauthorized)

    return () => {
      cancelled = true
      window.removeEventListener('auth:unauthorized', handleUnauthorized)
    }
  }, [])

  /**
   * Performs login with phone number and PIN.
   * On success, stores JWT token and sets trusted backend user object into state.
   */
  const login = useCallback(async ({ phone, pin }) => {
    setAuthError(null)
    try {
      const data = await authService.login({ phone, pin })
      if (data?.token) {
        try {
          localStorage.setItem('auth_token', data.token)
        } catch {
          // Ignore storage errors
        }
      }
      if (data?.user) {
        setUser(data.user)
      }
      return data
    } catch (err) {
      setAuthError(err.message)
      throw err
    }
  }, [])

  /**
   * Registers a new teacher account with name, phone, and 4-digit PIN.
   * Account will be in 'pending' status awaiting admin approval.
   */
  const register = useCallback(async ({ name, phone, pin, classId } = {}) => {
    setAuthError(null)
    try {
      const data = await authService.register({ name, phone, pin, classId })
      return data
    } catch (err) {
      setAuthError(err.message)
      throw err
    }
  }, [])

  /**
   * Performs logout by calling backend logout and clearing stored auth token.
   */
  const logout = useCallback(async () => {
    try {
      await authService.logout()
    } finally {
      try {
        localStorage.removeItem('auth_token')
      } catch {
        // Ignore storage errors
      }
      setUser(null)
      setAuthError(null)
    }
  }, [])

  /**
   * Refreshes the current user from the server if needed (e.g. status changes).
   */
  const refreshUser = useCallback(async () => {
    try {
      const data = await authService.getMe()
      if (data?.user) {
        setUser(data.user)
      }
      return data.user
    } catch {
      try {
        localStorage.removeItem('auth_token')
      } catch {
        // Ignore storage errors
      }
      setUser(null)
      return null
    }
  }, [])

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      isAdmin: user?.role === 'admin',
      isTeacher: user?.role === 'teacher',
      authError,
      login,
      register,
      logout,
      refreshUser,
    }),
    [user, loading, authError, login, register, logout, refreshUser]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/**
 * Custom hook to consume the AuthContext safely.
 */
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
