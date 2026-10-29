import { useState } from 'react'

/**
 * Password / PIN field component with accessible show/hide toggle.
 * Tailored for 4-digit security PIN used in school authentication.
 */
export default function PasswordField({
  id = 'pin',
  label = '4-Digit PIN',
  value,
  onChange,
  error,
  hint = 'Enter your 4-digit access PIN',
  disabled = false,
  required = true,
  autoComplete = 'current-password',
  autoFocus = false,
  className = '',
  ...rest
}) {
  const [showPassword, setShowPassword] = useState(false)

  const errorId = `${id}-error`
  const hintId = `${id}-hint`
  const describedBy = [error ? errorId : null, hint ? hintId : null]
    .filter(Boolean)
    .join(' ') || undefined

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {/* Label & Hint */}
      <div className="flex items-baseline justify-between">
        <label
          htmlFor={id}
          className="text-[13px] font-semibold text-slate-900"
        >
          {label}
          {required && (
            <span className="text-red-700 ml-0.5" aria-hidden="true">
              *
            </span>
          )}
        </label>
        {hint && !error && (
          <span id={hintId} className="text-[13px] text-slate-500">
            {hint}
          </span>
        )}
      </div>

      {/* Input container */}
      <div
        className={`relative flex items-center min-h-[40px] bg-white border rounded-lg transition-colors duration-150 ${
          error
            ? 'border-red-700 focus-within:border-red-700 focus-within:ring-2 focus-within:ring-red-700/20'
            : 'border-slate-200 hover:border-slate-300 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-600/20'
        } ${disabled ? 'opacity-60 bg-slate-50 cursor-not-allowed' : ''}`}
      >
        {/* Keypad motif prefix */}
        <div className="pl-3 pr-2 text-slate-400 select-none pointer-events-none flex items-center">
          <svg
            className="w-4 h-4 text-slate-500"
            viewBox="0 0 20 20"
            fill="none"
            aria-hidden="true"
          >
            <rect
              x="3"
              y="9"
              width="14"
              height="9"
              rx="1.5"
              stroke="currentColor"
              strokeWidth="1.3"
            />
            <path
              d="M7 9V6a3 3 0 016 0v3"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
            />
            <circle cx="10" cy="13.5" r="1" fill="currentColor" />
          </svg>
        </div>

        <input
          id={id}
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder="••••"
          maxLength={4}
          inputMode="numeric"
          pattern="[0-9]*"
          required={required}
          disabled={disabled}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className="w-full bg-transparent px-2 py-2 text-[15px] tracking-[0.25em] text-slate-900 placeholder:tracking-normal placeholder:text-slate-400 focus:outline-none disabled:cursor-not-allowed pr-9 font-sans"
          {...rest}
        />

        {/* Toggle show/hide PIN */}
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          disabled={disabled}
          aria-label={showPassword ? 'Hide PIN' : 'Show PIN'}
          aria-pressed={showPassword}
          className="absolute right-2 p-1.5 text-slate-500 hover:text-slate-900 transition-colors rounded-md focus-visible:outline-blue-600 disabled:opacity-50 cursor-pointer"
        >
          {showPassword ? (
            <svg
              className="w-4 h-4"
              viewBox="0 0 20 20"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M3 3l14 14M8.5 8.5a3 3 0 004.24 4.24M6.2 6.2C4.3 7.4 2.8 9.3 2 10c1.7 3.5 5 6 8 6 1.4 0 2.7-.4 3.8-1.2m2-2.1c1.3-1.2 2.3-2.7 2.7-3.7-1.7-3.5-5-6-8-6-.9 0-1.8.2-2.6.5"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            <svg
              className="w-4 h-4"
              viewBox="0 0 20 20"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M10 4C5.5 4 2 10 2 10s3.5 6 8 6 8-6 8-6-3.5-6-8-6z"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle
                cx="10"
                cy="10"
                r="3"
                stroke="currentColor"
                strokeWidth="1.3"
              />
            </svg>
          )}
        </button>
      </div>

      {/* Error message */}
      {error && (
        <p
          id={errorId}
          role="alert"
          className="text-[13px] text-red-700 flex items-center gap-1.5 font-medium mt-0.5"
        >
          <svg
            className="w-3.5 h-3.5 shrink-0"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
          >
            <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.3" />
            <path
              d="M8 4.5V8.5M8 11.5H8.01"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          <span>{error}</span>
        </p>
      )}
    </div>
  )
}
