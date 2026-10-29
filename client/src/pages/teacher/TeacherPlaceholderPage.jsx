import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { schoolConfig } from '../../config/schoolConfig.js'

/**
 * Lightweight placeholder for teacher workspace routes.
 */
export default function TeacherPlaceholderPage({ title, description }) {
  useEffect(() => {
    document.title = `${title} — ${schoolConfig.schoolName}`
  }, [title])

  return (
    <div className="max-w-2xl space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div>
        <h1 className="text-[28px] font-bold text-slate-900 tracking-tight">
          {title}
        </h1>
        <p className="text-[15px] text-slate-600 mt-1 leading-relaxed">
          {description || 'This section is ready to be configured. The daily dashboard overview is currently active.'}
        </p>
      </div>

      <div className="h-px bg-slate-200" aria-hidden="true" />

      {/* Notice Card */}
      <div className="p-6 rounded-xl bg-white border border-slate-200 text-[14px] text-slate-600 leading-relaxed space-y-2 shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
        <p className="font-semibold text-slate-900 text-[16px]">
          Section ready
        </p>
        <p>
          Full workflows, data tables, and input forms for this section will be available here. Please use the daily dashboard to review today's attendance summary.
        </p>
      </div>

      <div>
        <Link
          to="/teacher/dashboard"
          className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-blue-600 hover:text-blue-700 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M9 11L5 7L9 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>Return to dashboard</span>
        </Link>
      </div>
    </div>
  )
}
