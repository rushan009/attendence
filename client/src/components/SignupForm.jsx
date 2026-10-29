import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { schoolConfig } from '../config/schoolConfig.js'
import FormField from './FormField.jsx'
import PasswordField from './PasswordField.jsx'
import Button from './Button.jsx'

/**
 * SignupForm: Teacher registration for Bhanu Secondary School.
 * Validates fields client-side, communicates with backend POST /api/auth/register,
 * and renders a clean white card confirmation receipt.
 */
export default function SignupForm({ className = '' }) {
  const { user, register, logout, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  // Form input states
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')

  // Validation & status
  const [fieldErrors, setFieldErrors] = useState({})
  const [serverError, setServerError] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submittedData, setSubmittedData] = useState(null)

  // Focus management
  const nameInputRef = useRef(null)

  // Clear server error when inputs change
  useEffect(() => {
    if (serverError) {
      setServerError(null)
    }
  }, [name, phone, pin, confirmPin])

  // Client-side validation matching backend constraints
  const validateForm = () => {
    const errors = {}

    const trimmedName = name.trim()
    if (!trimmedName) {
      errors.name = 'Full name is required'
    } else if (trimmedName.length < 2) {
      errors.name = 'Name must be at least 2 characters'
    } else if (trimmedName.length > 60) {
      errors.name = 'Name cannot exceed 60 characters'
    }

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

    if (!confirmPin) {
      errors.confirmPin = 'Please confirm your 4-digit PIN'
    } else if (pin && confirmPin !== pin) {
      errors.confirmPin = 'PINs do not match'
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

    const payload = {
      name: name.trim(),
      phone: phone.trim(),
      pin: pin.trim(),
    }

    try {
      const response = await register(payload)

      // Store submitted summary for confirmation receipt
      setSubmittedData({
        name: payload.name,
        phone: payload.phone,
        message: response.message || 'Registration submitted. Awaiting administrator approval.',
      })
    } catch (err) {
      setPin('')
      setConfirmPin('')

      if (err.status === 400 && Array.isArray(err.data?.errors)) {
        const backendFieldErrors = Object.fromEntries(
          err.data.errors
            .filter((error) => error.field && error.field !== 'root')
            .map((error) => [error.field, error.message])
        )
        setFieldErrors(backendFieldErrors)
        setServerError({
          type: 'validation',
          title: 'Check your details',
          message: err.data.message || 'Please correct the highlighted fields and try again.',
        })
      } else if (err.status === 409) {
        setServerError({
          type: 'conflict',
          title: 'Account already exists',
          message:
            'This mobile number is already registered in the system. If you already have an account, please sign in.',
          isConflict: true,
        })
      } else if (err.status === 429) {
        setServerError({
          type: 'ratelimit',
          title: 'Too many attempts',
          message:
            'Too many registration attempts from this network. Please wait 15 minutes before trying again.',
        })
      } else if (err.isNetworkError || err.status === 0) {
        setServerError({
          type: 'network',
          title: 'Connection error',
          message:
            'Cannot reach the school server. Please verify your network connection and try again.',
          canRetry: true,
        })
      } else {
        setServerError({
          type: 'generic',
          title: 'Registration error',
          message: err.message || 'An error occurred during registration. Please try again.',
        })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // Active Session Notice
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

  // Registration Submitted Confirmation Receipt
  if (submittedData) {
    return (
      <div className={`space-y-5 ${className}`}>
        <div>
          <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mb-3">
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-[24px] font-bold text-slate-900 tracking-tight">
            Registration submitted
          </h2>
          <p className="text-slate-600 text-[14px] mt-1 leading-relaxed">
            Your teacher account has been submitted and is awaiting administrator verification.
          </p>
        </div>

        {/* Details List */}
        <div className="py-3 border-y border-slate-200 space-y-2 text-[14px]">
          <div className="flex justify-between py-1 border-b border-slate-100">
            <span className="text-slate-500">Applicant name:</span>
            <span className="font-semibold text-slate-900">{submittedData.name}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-100">
            <span className="text-slate-500">Registered phone:</span>
            <span className="font-medium text-slate-900">+977 {submittedData.phone}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-100">
            <span className="text-slate-500">Requested role:</span>
            <span className="font-medium text-slate-900">Teacher (कक्षा शिक्षक)</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-slate-500">Status:</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[13px] font-medium bg-[#FEF3C7] text-[#92400E]">
              Awaiting verification
            </span>
          </div>
        </div>

        <p className="text-[13px] text-slate-500 leading-relaxed">
          The school administrator will verify your credentials and assign your classroom. Once approved, you can sign in directly with your PIN.
        </p>

        <div className="flex flex-col gap-2 pt-2">
          <Button
            variant="primary"
            fullWidth
            onClick={() => navigate('/login')}
          >
            Go to sign in
          </Button>
          <Button
            variant="secondary"
            fullWidth
            onClick={() => navigate('/')}
          >
            Back to home
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
          Teacher registration
        </h1>
        <p className="text-slate-600 text-[14px] mt-1 leading-relaxed">
          Register with your name, phone number, and a 4-digit PIN.
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
            {serverError.isConflict && (
              <div className="mt-2">
                <Link
                  to="/login"
                  className="font-semibold underline hover:text-red-900 inline-block"
                >
                  Go to sign in →
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Form Fields */}
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <FormField
          id="name"
          ref={nameInputRef}
          label="Full Name"
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            if (fieldErrors.name) {
              setFieldErrors((prev) => ({ ...prev, name: null }))
            }
          }}
          placeholder="e.g. Ram Bahadur Thapa"
          required
          autoComplete="name"
          maxLength={60}
          disabled={isSubmitting}
          error={fieldErrors.name}
          autoFocus
        />

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
          autoComplete="tel"
          inputMode="tel"
          maxLength={10}
          disabled={isSubmitting}
          error={fieldErrors.phone}
        />

        <PasswordField
          id="pin"
          label="4-Digit Security PIN"
          value={pin}
          onChange={(e) => {
            setPin(e.target.value)
            if (fieldErrors.pin) {
              setFieldErrors((prev) => ({ ...prev, pin: null }))
            }
          }}
          hint="Choose a 4-digit PIN"
          required
          autoComplete="new-password"
          disabled={isSubmitting}
          error={fieldErrors.pin}
        />

        <PasswordField
          id="confirmPin"
          label="Confirm Security PIN"
          value={confirmPin}
          onChange={(e) => {
            setConfirmPin(e.target.value)
            if (fieldErrors.confirmPin) {
              setFieldErrors((prev) => ({ ...prev, confirmPin: null }))
            }
          }}
          hint="Re-enter the same 4-digit PIN"
          required
          autoComplete="new-password"
          disabled={isSubmitting}
          error={fieldErrors.confirmPin}
        />

        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={isSubmitting}
            disabled={isSubmitting || authLoading}
          >
            Submit registration
          </Button>
        </div>
      </form>

      {/* Footer */}
      <div className="mt-6 pt-5 border-t border-slate-200 text-center text-[13px] text-slate-500">
        <p>
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-semibold text-blue-600 hover:text-blue-700 underline underline-offset-2 transition-colors"
          >
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  )
}
