import { useEffect } from 'react'
import AuthLayout from '../components/AuthLayout.jsx'
import AuthBrandPanel from '../components/AuthBrandPanel.jsx'
import LoginForm from '../components/LoginForm.jsx'
import { schoolConfig } from '../config/schoolConfig.js'

/**
 * LoginPage: Dedicated staff sign-in screen for Shree Janajyoti Secondary School.
 * Composes the quiet, minimal left brand panel with the focused sign-in form.
 */
export default function LoginPage() {
  useEffect(() => {
    document.title = `Staff Sign In — ${schoolConfig.schoolName}`
  }, [])

  return (
    <AuthLayout
      leftPanel={<AuthBrandPanel />}
      rightPanel={<LoginForm />}
    />
  )
}
