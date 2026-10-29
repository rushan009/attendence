import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { schoolConfig } from '../../config/schoolConfig.js'

/**
 * Editorial page structure for Teacher Workspace placeholder / empty sections.
 * Clean, calm layout with bold sans-serif titles and friendly empty states.
 */
export default function TeacherPageShell({
  category,
  title,
  description,
  emptyStateTitle = 'This section is ready to be configured.',
  emptyStateDescription,
  action,
}) {
  useEffect(() => {
    document.title = `${title} — ${schoolConfig.schoolName}`
  }, [title])

  return (
    <div className="space-y-6">
      {/* ── Page Header ─────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-4">
        <div>
          {category && (
            <p className="text-[13px] text-slate-500 font-medium mb-1">
              {category}
            </p>
          )}
          <h1 className="text-[28px] font-bold text-slate-900 tracking-tight">
            {title}
          </h1>
          {description && (
            <p className="text-slate-600 text-[15px] mt-1 max-w-2xl leading-relaxed">
              {description}
            </p>
          )}
        </div>

        {action && <div className="shrink-0">{action}</div>}
      </div>

      <div className="h-px bg-slate-200" aria-hidden="true" />

      {/* ── Calm, Friendly Empty State ──────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200 p-8 sm:p-12 text-center max-w-lg mx-auto shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
        <div
          className="w-12 h-12 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 mx-auto mb-4"
          aria-hidden="true"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            <line x1="9" y1="7" x2="15" y2="7" />
            <line x1="9" y1="11" x2="13" y2="11" />
          </svg>
        </div>

        <h2 className="text-[18px] font-semibold text-slate-900">
          {emptyStateTitle}
        </h2>

        {emptyStateDescription && (
          <p className="text-[14px] text-slate-600 mt-1.5 leading-relaxed">
            {emptyStateDescription}
          </p>
        )}

        <div className="mt-6">
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
    </div>
  )
}
