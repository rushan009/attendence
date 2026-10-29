import BrandWordmark from './BrandWordmark.jsx'
import { schoolConfig } from '../config/schoolConfig.js'

/**
 * Editorial brand panel for authentication screens.
 * Strictly school-branded for Shree Janajyoti Secondary School.
 */
export default function AuthBrandPanel({
  label = 'Staff access',
  headline = 'Welcome back.',
  supportingText = "Sign in to access your school's attendance workspace.",
  location = schoolConfig.location,
  className = '',
}) {
  return (
    <div
      className={`flex flex-col justify-between p-8 sm:p-10 lg:p-12 border-b lg:border-b-0 lg:border-r border-slate-200 bg-[#FAF8F5] ${className}`}
    >
      {/* School Header */}
      <div>
        <BrandWordmark size="sm" as="div" />
      </div>

      {/* Main Focus */}
      <div className="my-auto py-10 lg:py-14 space-y-3.5 max-w-sm">
        <p className="text-xs font-semibold text-slate-500">
          {label}
        </p>

        <h1 className="text-2xl sm:text-3xl text-slate-900 font-bold tracking-tight leading-snug">
          {headline}
        </h1>

        <p className="text-slate-600 text-sm leading-relaxed">
          {supportingText}
        </p>

        {location && (
          <div className="pt-1 flex items-center gap-1.5 text-xs text-slate-500">
            <svg
              className="w-4 h-4 text-blue-600 shrink-0"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M8 1.5C5.515 1.5 3.5 3.515 3.5 6c0 3.375 4.5 8.5 4.5 8.5s4.5-5.125 4.5-8.5c0-2.485-2.015-4.5-4.5-4.5z" />
              <circle cx="8" cy="6" r="1.5" />
            </svg>
            <span>{location}</span>
          </div>
        )}
      </div>

      {/* Discreet Footer */}
      <div className="pt-5 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
        <span>Internal attendance workspace</span>
        <span className="text-slate-700 font-medium">
          {schoolConfig.locationShort}
        </span>
      </div>
    </div>
  )
}
