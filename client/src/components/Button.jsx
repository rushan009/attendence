/**
 * Reusable Button component for Shree Janajyoti Secondary School.
 * Aesthetic: Quiet luxury, crisp editorial typography, restrained micro-interactions.
 * Supports loading states with screen-reader accessibility, focused keyboards,
 * and deliberate, consistent sizing.
 */
export default function Button({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  className = '',
  onClick,
  ...rest
}) {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-lg transition-colors duration-150 select-none cursor-pointer focus-visible:outline-2 focus-visible:outline-blue-600 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.99]'

  const variantStyles = {
    primary:
      'bg-blue-600 text-white hover:bg-blue-700 shadow-sm focus-visible:outline-blue-600',
    secondary:
      'bg-white text-slate-800 border border-slate-200 hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-blue-600',
    outline:
      'bg-transparent text-blue-600 border border-blue-600/40 hover:bg-blue-50 focus-visible:outline-blue-600',
    ghost:
      'bg-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus-visible:outline-blue-600',
    danger:
      'bg-red-700 text-white hover:bg-red-800 focus-visible:outline-red-700',
    'danger-ghost':
      'bg-transparent text-red-700 hover:bg-red-50 focus-visible:outline-red-700',
  }

  const sizeStyles = {
    sm: 'text-[13px] px-3 py-1.5 gap-1.5 min-h-[36px]',
    md: 'text-[14px] px-4 py-2 gap-2 min-h-[40px]',
    lg: 'text-[15px] px-5 py-2.5 gap-2 min-h-[44px]',
  }

  const widthStyle = fullWidth ? 'w-full' : ''
  const isDisabled = disabled || loading

  return (
    <button
      type={type}
      disabled={isDisabled}
      aria-busy={loading ? 'true' : 'false'}
      onClick={onClick}
      className={`${baseStyles} ${variantStyles[variant] || variantStyles.primary} ${sizeStyles[size] || sizeStyles.md} ${widthStyle} ${className}`}
      {...rest}
    >
      {loading && (
        <svg
          className="animate-spin -ml-0.5 w-4 h-4 text-current shrink-0"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="3"
          />
          <path
            className="opacity-90"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      <span>{children}</span>
    </button>
  )
}
