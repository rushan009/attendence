/**
 * Accessible FormField component with human, editorial typography,
 * consistent field heights, and subtle validation states.
 */
export default function FormField({
  id,
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  hint,
  required = false,
  disabled = false,
  autoComplete,
  inputMode,
  maxLength,
  pattern,
  prefix,
  suffix,
  className = '',
  inputClassName = '',
  autoFocus = false,
  ...rest
}) {
  const errorId = `${id}-error`
  const hintId = `${id}-hint`

  const describedBy = [
    error ? errorId : null,
    hint ? hintId : null,
  ]
    .filter(Boolean)
    .join(' ') || undefined

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {/* Label and optional hint */}
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

      {/* Input container with prefix / suffix */}
      <div
        className={`relative flex items-center min-h-[40px] bg-white border rounded-lg transition-colors duration-150 ${
          error
            ? 'border-red-700 focus-within:border-red-700 focus-within:ring-2 focus-within:ring-red-700/20'
            : 'border-slate-200 hover:border-slate-300 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-600/20'
        } ${disabled ? 'opacity-60 bg-slate-50 cursor-not-allowed' : ''}`}
      >
        {prefix && (
          <div className="pl-3 pr-2 text-slate-500 text-[13px] sm:text-sm flex items-center select-none pointer-events-none border-r border-slate-200 my-1">
            {prefix}
          </div>
        )}

        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          autoComplete={autoComplete}
          inputMode={inputMode}
          maxLength={maxLength}
          pattern={pattern}
          autoFocus={autoFocus}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className={`w-full bg-transparent px-3 py-2 text-[14px] text-slate-900 placeholder:text-slate-400 focus:outline-none disabled:cursor-not-allowed ${
            prefix ? 'pl-2.5' : ''
          } ${suffix ? 'pr-9' : ''} ${inputClassName}`}
          {...rest}
        />

        {suffix && (
          <div className="absolute right-2.5 flex items-center">{suffix}</div>
        )}
      </div>

      {/* Inline Error Message */}
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
