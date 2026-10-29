import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { schoolConfig } from '../../config/schoolConfig.js'

/**
 * PublicOnlyRoute: Route guard for authentication screens (/login, /register).
 *
 * If a user with an active, approved session visits /login, they are redirected
 * directly to their respective role dashboard without creating a redirect loop.
 */
export default function PublicOnlyRoute() {
  const { user, loading, isAuthenticated } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center p-6 text-center select-none">
        <div className="w-10 h-10 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin mb-4" />
        <p className="text-lg text-slate-900 font-bold">
          {schoolConfig.schoolName}
        </p>
        <p className="text-xs text-slate-500 mt-1">
          Restoring workspace session...
        </p>
      </div>
    )
  }

  if (isAuthenticated && user) {
    if (user.role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />
    }
    if (user.role === 'teacher') {
      return <Navigate to="/teacher/dashboard" replace />
    }
  }

  return <Outlet />
}
