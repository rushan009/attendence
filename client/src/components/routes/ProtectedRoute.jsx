import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { schoolConfig } from '../../config/schoolConfig.js'

/**
 * ProtectedRoute: Enforces authentication and role-based access control.
 *
 * Scenarios:
 * 1. Session is initializing (loading === true): Renders minimal loading state.
 * 2. Unauthenticated user: Redirects to /login, saving current location in state.
 * 3. Inactive/unapproved account: Clears session and redirects to /login.
 * 4. Cross-role access attempt: Safely redirects user to their own role dashboard.
 * 5. Unknown role: Fails closed and redirects to /login.
 * 6. Authorized user: Renders nested route via <Outlet />.
 */
export default function ProtectedRoute({ allowedRoles = [] }) {
  const { user, loading, isAuthenticated } = useAuth()
  const location = useLocation()

  // 1. Session initialization check (verifying httpOnly cookie via GET /api/auth/me)
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center p-6 text-center select-none">
        <div className="w-10 h-10 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin mb-4" />
        <p className="text-lg text-slate-900 font-bold">
          {schoolConfig.schoolName}
        </p>
        <p className="text-xs text-slate-500 mt-1">
          Verifying school credentials...
        </p>
      </div>
    )
  }

  // 2. Unauthenticated check
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // 3. Status verification (must be approved by administration)
  if (user.status && user.status !== 'approved') {
    return <Navigate to="/login" state={{ unapproved: true }} replace />
  }

  // 4. Role-based authorization check
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // Cross-role protection: redirect user to their own authorized workspace
    if (user.role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />
    }
    if (user.role === 'teacher') {
      return <Navigate to="/teacher/dashboard" replace />
    }
    // Unknown role: fail closed
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
