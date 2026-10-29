import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { schoolConfig } from '../config/schoolConfig.js'
import FormField from './FormField.jsx'
import PasswordField from './PasswordField.jsx'
import Button from './Button.jsx'

/**
 * LoginForm: Dedicated sign-in for Bhanu Secondary School authorized staff.
 * Clean, white card on cream aesthetic with royal blue primary action.
 */
export default function LoginForm({ className = '' }) {
  const { user, login, logout, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Form inputs
  const [phone, setPhone] = useState('')
  const [pin, setPin] = useState('')

  // Validation & status
  const [fieldErrors, setFieldErrors] = useState({})
  const [serverError, setServerError] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loginSuccess, setLoginSuccess] = useState(false)

  // Focus ref
  const phoneInputRef = useRef(null)

  // Clear server error when user modifies fields
  useEffect(() => {
    if (serverError) {
      setServerError(null)
    }
  }, [phone, pin])

  // Client-side validation matching backend rules
  const validateForm = () => {
    const errors = {}

    const trimmedPhone = phone.trim()
    if (!trimmedPhone) {
      errors.phone = 'Phone number is required'
    } else if (!/^9\d{9}$/.test(trimmedPhone)) {
      errors.phone = 'Must be a 10-digit Nepali mobile number starting with 9'
    }

    if (!pin) {
      errors.pin = '4-digit PIN is required'
    } else if (!/^\d{4}$/.test(pin)) {
      errors.pin = 'PIN must be exactly 4 digits'
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (isSubmitting) return

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    setServerError(null)

    try {
      const result = await login({
        phone: phone.trim(),
        pin: pin.trim(),
      })

      setLoginSuccess(true)

      // Role-based redirection: admin -> /admin/dashboard, teacher -> /teacher/dashboard
      const role = result?.user?.role
      const defaultDashboard =
        role === 'admin'
          ? '/admin/dashboard'
          : role === 'teacher'
          ? '/teacher/dashboard'
          : null
      if (!defaultDashboard) {
        await logout()
        setLoginSuccess(false)
        setServerError({
          type: 'generic',
          title: 'Access Restricted',
          message: 'Your account has an unsupported role. Please contact school administration.',
        })
        return
      }
      const requestedFrom = location.state?.from?.pathname

      // Preserve deep link if user was attempting to reach an authorized route for their role
      const targetDestination =
        requestedFrom &&
        ((role === 'admin' && requestedFrom.startsWith('/admin')) ||
          (role === 'teacher' && requestedFrom.startsWith('/teacher')))
          ? requestedFrom
          : defaultDashboard

      setTimeout(() => {
        navigate(targetDestination, { replace: true })
      }, 350)
    } catch (err) {
      setPin('')
      setLoginSuccess(false)

      if (err.status === 400 && Array.isArray(err.data?.errors)) {
        const backendFieldErrors = Object.fromEntries(
          err.data.errors
            .filter((error) => error.field && error.field !== 'root')
            .map((error) => [error.field, error.message])
        )
        setFieldErrors(backendFieldErrors)
        setServerError({
          type: 'validation',
          title: 'Invalid Input',
          message: err.data.message || 'Please check your phone number and PIN.',
        })
      } else if (err.status === 401) {
        setServerError({
          type: 'unauthorized',
          title: 'Incorrect Credentials',
          message: 'The mobile number or PIN entered is incorrect.',
        })
      } else if (err.status === 403) {
        setServerError({
          type: 'forbidden',
          title: 'Approval Pending',
          message:
            err.data?.message ||
            'Your registration is currently awaiting school administrator approval.',
        })
      } else if (err.status === 429) {
        setServerError({
          type: 'ratelimit',
          title: 'Too Many Attempts',
          message:
            'Too many sign-in attempts. Please wait 15 minutes before trying again.',
        })
      } else if (err.isNetworkError || err.status === 0) {
        setServerError({
          type: 'network',
          title: 'Connection Error',
          message:
            'Cannot connect to the school server. Please verify your internet connection.',
        })
      } else {
        setServerError({
          type: 'generic',
          title: 'Sign-in Failed',
          message: err.message || 'An error occurred during sign in. Please try again.',
        })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // If already authenticated and not loading
  if (user && !authLoading) {
    return (
      <div className={`space-y-5 ${className}`}>
        <div>
          <h2 className="text-[24px] font-bold text-slate-900 tracking-tight">
            Already signed in
          </h2>
          <p className="text-slate-600 text-[14px] mt-1.5 leading-relaxed">
            Signed in as <strong className="text-slate-900 font-semibold">{user.name}</strong> ({user.role === 'admin' ? 'Administrator' : 'Teacher'}).
          </p>
        </div>

        <div className="py-2 flex flex-col gap-2.5">
          <Button
            variant="primary"
            fullWidth
            onClick={() =>
              navigate(user?.role === 'admin' ? '/admin/dashboard' : '/teacher/dashboard')
            }
          >
            Go to dashboard
          </Button>
          <Button
            variant="secondary"
            fullWidth
            onClick={logout}
          >
            Sign out
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={`w-full ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-[26px] font-bold text-slate-900 tracking-tight">
          Staff sign in
        </h1>
        <p className="text-slate-600 text-[14px] mt-1 leading-relaxed">
          Enter your registered mobile phone and 4-digit PIN.
        </p>
      </div>

      {/* Server Error Alert */}
      {serverError && (
        <div
          role="alert"
          className="mb-5 p-3.5 rounded-lg bg-[#FBE9E9] border border-red-200 text-[#991B1B] text-[13px] flex items-start gap-2.5"
        >
          <svg
            className="w-4 h-4 shrink-0 mt-0.5 text-[#991B1B]"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <div className="flex-1 leading-relaxed">
            <span className="font-semibold block mb-0.5">
              {serverError.title}
            </span>
            <span>{serverError.message}</span>
          </div>
        </div>
      )}

      {/* Success Alert */}
      {loginSuccess && (
        <div
          role="status"
          className="mb-5 p-3.5 rounded-lg bg-[#E7F3EC] border border-green-200 text-[#166534] text-[13px] flex items-center gap-2"
        >
          <svg
            className="w-4 h-4 shrink-0"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          <span className="font-medium">
            Access verified. Loading dashboard...
          </span>
        </div>
      )}

      {/* Form Fields */}
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <FormField
          id="phone"
          label="Mobile Phone Number"
          type="tel"
          value={phone}
          onChange={(e) => {
            setPhone(e.target.value)
            if (fieldErrors.phone) {
              setFieldErrors((prev) => ({ ...prev, phone: null }))
            }
          }}
          placeholder="98XXXXXXXX"
          prefix="+977"
          hint="10-digit number"
          required
          autoComplete="username tel"
          inputMode="tel"
          maxLength={10}
          disabled={isSubmitting || loginSuccess}
          error={fieldErrors.phone}
          autoFocus
        />

        <PasswordField
          id="pin"
          label="Security PIN"
          value={pin}
          onChange={(e) => {
            setPin(e.target.value)
            if (fieldErrors.pin) {
              setFieldErrors((prev) => ({ ...prev, pin: null }))
            }
          }}
          hint="4-digit PIN"
          required
          disabled={isSubmitting || loginSuccess}
          error={fieldErrors.pin}
        />

        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={isSubmitting}
            disabled={isSubmitting || loginSuccess || authLoading}
          >
            Sign in
          </Button>
        </div>
      </form>

      {/* Footer */}
      <div className="mt-6 pt-5 border-t border-slate-200 text-center text-[13px] text-slate-500 space-y-2">
        <p>
          New teacher at the school?{' '}
          <Link
            to="/register"
            className="font-semibold text-blue-600 hover:text-blue-700 underline underline-offset-2 transition-colors"
          >
            Register here
          </Link>
        </p>
      </div>
    </div>
  )
}
