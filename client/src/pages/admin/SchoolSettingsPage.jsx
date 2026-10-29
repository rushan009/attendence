import AdminPageShell from '../../components/admin/AdminPageShell.jsx'

/**
 * School > Settings
 * Route: /admin/settings
 */
export default function SchoolSettingsPage() {
  return (
    <AdminPageShell
      category="School"
      title="School Settings"
      description="Institution profile details, academic year configuration, and administrative preferences for Shree Janajyoti Secondary School."
      emptyStateTitle="This section is ready to be configured."
      emptyStateDescription="School institutional details, academic standard settings, and administration preferences will be managed here."
    />
  )
}
