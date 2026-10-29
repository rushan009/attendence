import { Link } from 'react-router-dom'
import { schoolConfig } from '../config/schoolConfig.js'

/**
 * Reusable School Wordmark and Identity Header.
 * Uses the school name in the refined serif typeface and an understated
 * academic crest placeholder, ready to be swapped with an official school logo.
 * No product branding is displayed.
 */
export default function BrandWordmark({
  to = '/',
  as = 'link',
  size = 'md',
  className = '',
  showNepaliSubtitle = false,
  showTagline = false,
  onDark = false,
}) {
  const iconSizes = {
    sm: 'w-6 h-6',
    md: 'w-7 h-7',
    lg: 'w-8 h-8',
  }

  const textSizes = {
    sm: 'text-sm sm:text-[15px]',
    md: 'text-[15px] sm:text-base',
    lg: 'text-base sm:text-lg',
  }

  const content = (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {schoolConfig.logo ? (
        <img
          src={schoolConfig.logo}
          alt={`${schoolConfig.schoolName} Crest`}
          className={`${iconSizes[size] || iconSizes.md} object-contain shrink-0`}
        />
      ) : (
        <span
          className={`shrink-0 inline-flex items-center justify-center p-1.5 rounded-lg border ${
            onDark
              ? 'bg-blue-600/20 border-blue-400/30 text-blue-400'
              : 'bg-blue-50 border-blue-200 text-blue-600'
          }`}
          aria-hidden="true"
        >
          <svg
            className={iconSizes[size] || iconSizes.md}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            <line x1="8" y1="6" x2="16" y2="6" strokeWidth="1.2" />
            <line x1="8" y1="10" x2="14" y2="10" strokeWidth="1.2" />
          </svg>
        </span>
      )}

      {/* School Name in Bold Sans-Serif */}
      <div className="flex flex-col leading-tight min-w-0">
        <span
          className={`font-sans font-bold tracking-tight truncate ${
            onDark ? 'text-[#FAF8F5]' : 'text-slate-900'
          } ${textSizes[size] || textSizes.md}`}
        >
          {schoolConfig.schoolName}
        </span>
        {showNepaliSubtitle ? (
          <span
            className={`text-[13px] tracking-normal font-normal truncate ${
              onDark ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            {schoolConfig.location}
          </span>
        ) : showTagline ? (
          <span
            className={`text-[13px] font-normal tracking-wide truncate ${
              onDark ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            {schoolConfig.locationShort}
          </span>
        ) : null}
      </div>
    </div>
  )

  if (as === 'div' || !to) {
    return content
  }

  return (
    <Link
      to={to}
      className="inline-flex items-center focus-visible:outline-2 focus-visible:outline-blue-600 rounded-lg transition-opacity hover:opacity-90 min-w-0"
      aria-label={`${schoolConfig.schoolName} — Home`}
    >
      {content}
    </Link>
  )
}
