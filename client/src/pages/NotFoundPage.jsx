import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { schoolConfig } from '../config/schoolConfig.js'
import BrandWordmark from '../components/BrandWordmark.jsx'

/**
 * NotFoundPage: Clean minimal 404 page styled to match the calm cream & white aesthetic.
 */
export default function NotFoundPage() {
  const { user, isAuthenticated } = useAuth()

  const destination = isAuthenticated
    ? user?.role === 'admin'
      ? '/admin/dashboard'
      : '/teacher/dashboard'
    : '/'

  const buttonText = isAuthenticated ? 'Go to dashboard' : 'Back to home'

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col justify-between p-6">
      <header className="max-w-[1200px] w-full mx-auto py-4">
        <BrandWordmark size="md" />
      </header>

      <main className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-xl p-8 sm:p-10 text-center space-y-4 shadow-[0_1px_2px_rgba(15,23,42,0.06)] animate-in fade-in duration-150">
          <p className="text-xs font-semibold text-slate-500">
            Error 404
          </p>
          <h1 className="text-[28px] font-bold text-slate-900 tracking-tight leading-tight">
            Page not found
          </h1>
          <p className="text-slate-600 text-sm leading-relaxed max-w-sm mx-auto">
            The requested page could not be found within the {schoolConfig.schoolName} workspace.
          </p>

          <div className="pt-2">
            <Link
              to={destination}
              className="inline-flex items-center justify-center min-h-[40px] px-6 py-2.5 rounded-lg text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-blue-600 focus-visible:outline-offset-2 transition-colors shadow-xs"
            >
              {buttonText}
            </Link>
          </div>
        </div>
      </main>

      <footer className="text-center text-xs text-slate-500 py-4">
        © {new Date().getFullYear()} {schoolConfig.schoolName}. Internal Attendance Workspace.
      </footer>
    </div>
  )
}
