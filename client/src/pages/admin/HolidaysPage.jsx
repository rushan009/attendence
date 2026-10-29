import AdminPageShell from '../../components/admin/AdminPageShell.jsx'

/**
 * School > Holidays
 * Route: /admin/holidays
 */
export default function HolidaysPage() {
  return (
    <AdminPageShell
      category="School"
      title="Holidays & Calendar"
      description="School calendar, Bikram Sambat (BS) academic schedule, public holidays, vacations, and examination dates."
      emptyStateTitle="This section is ready to be configured."
      emptyStateDescription="The school academic calendar and official holiday schedule will be configured here to ensure accurate daily attendance logs."
    />
  )
}
