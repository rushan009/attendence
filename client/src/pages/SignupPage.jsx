import { useEffect } from 'react'
import AuthLayout from '../components/AuthLayout.jsx'
import AuthBrandPanel from '../components/AuthBrandPanel.jsx'
import SignupForm from '../components/SignupForm.jsx'
import { schoolConfig } from '../config/schoolConfig.js'

/**
 * SignupPage: Dedicated teacher enrollment page for Shree Janajyoti Secondary School.
 * Shares the architectural school brand identity and reusable components.
 */
export default function SignupPage() {
  useEffect(() => {
    document.title = `Teacher Registration — ${schoolConfig.schoolName}`
  }, [])

  return (
    <AuthLayout
      leftPanel={
        <AuthBrandPanel
          label="TEACHER ENROLLMENT"
          headline="Teacher registration."
          supportingText="Submit your details for headmaster verification to access your classroom attendance register."
        />
      }
      rightPanel={<SignupForm />}
    />
  )
}
