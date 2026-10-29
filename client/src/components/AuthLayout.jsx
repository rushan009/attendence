import { Link } from 'react-router-dom'
import BrandWordmark from './BrandWordmark.jsx'
import { schoolConfig } from '../config/schoolConfig.js'

/**
 * Shared AuthLayout component.
 * Centered white card on cream background, one primary blue button, clean and calm.
 */
export default function AuthLayout({ children, leftPanel, rightPanel }) {
  const content = rightPanel || children

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-slate-900 flex flex-col justify-between selection:bg-blue-600/15 selection:text-slate-900 font-sans">
      {/* ── Top Bar ────────────────────────────────────────── */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-10">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <BrandWordmark size="sm" showNepaliSubtitle />

          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-slate-600 hover:text-slate-900 transition-colors py-1.5 px-2.5 rounded-lg hover:bg-slate-100"
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M10 13l-5-5 5-5" />
            </svg>
            <span>Home</span>
          </Link>
        </div>
      </header>

      {/* ── Centered White Card on Cream ───────────────────── */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-6 sm:my-10">
        <div className="w-full max-w-[460px] bg-white border border-slate-200 rounded-xl shadow-[0_1px_2px_rgba(15,23,42,0.06)] p-6 sm:p-8">
          {content}
        </div>
      </main>

      {/* ── Quiet Footer ───────────────────────────────────── */}
      <footer className="border-t border-slate-200 py-4 px-4 text-[13px] text-slate-500 bg-[#FAF8F5] text-center">
        <p>© {new Date().getFullYear()} {schoolConfig.schoolName}. {schoolConfig.locationNepali}</p>
      </footer>
    </div>
  )
}
