import TeacherPageShell from '../../components/teacher/TeacherPageShell.jsx'

/**
 * ACCOUNT > Profile & PIN
 * Route: /teacher/profile
 */
export default function TeacherProfilePage() {
  return (
    <TeacherPageShell
      category="Account"
      title="Profile & PIN"
      description="Teacher account credentials, mobile verification, security PIN management, and contact details."
      emptyStateTitle="Profile and security settings are ready to be configured."
      emptyStateDescription="Teacher profile editing, 4-digit security PIN changes, and notification preferences will be managed here."
    />
  )
}
