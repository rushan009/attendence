import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { schoolConfig } from '../../config/schoolConfig.js'
import * as adminService from '../../services/adminService.js'
import * as attendanceService from '../../services/attendanceService.js'
import { getDualCalendarDate, formatBsDate } from '../../utils/nepaliDate.js'
import Button from '../../components/Button.jsx'

/**
 * Admin Dashboard Page
 * Route: /admin/dashboard
 *
 * Clean, calm dashboard for school-wide attendance overview.
 * Complies with the unified design system:
 * - 28px bold sans-serif title
 * - White cards on cream background
 * - Navy table header with cream text
 * - Status pills with clear background/text tokens
 * - Tabular numbers for all stats and counts
 */
export default function AdminDashboardPage() {
  const [classes, setClasses] = useState([])
  const [todayRecords, setTodayRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [todayBs, setTodayBs] = useState('')

  const todayDate = useMemo(() => getDualCalendarDate(), [])

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch all classes and attendance records
      const [classRes, attendanceRes] = await Promise.all([
        adminService.getClasses(),
        attendanceService.getAttendanceRecords(),
      ])

      const schoolClasses = classRes.classes || []
      const allRecords = attendanceRes.records || []
      const currentBs = attendanceRes.dateBs || todayDate.bsDateOnly

      setClasses(schoolClasses)
      setTodayBs(currentBs)

      // Filter records that match today's BS date
      const todayOnly = allRecords.filter((r) => r.dateBs === currentBs)
      setTodayRecords(todayOnly)
    } catch (err) {
      setError(err.message || 'Unable to load school dashboard records.')
    } finally {
      setLoading(false)
    }
  }, [todayDate.bsDateOnly])

  useEffect(() => {
    document.title = `Admin Dashboard — ${schoolConfig.schoolName}`
    loadDashboardData()
  }, [loadDashboardData])

  // Map of classId -> attendance record for fast lookup
  const attendanceByClassId = useMemo(() => {
    const map = new Map()
    for (const record of todayRecords) {
      const cid =
        record.class?._id || record.class?.id || String(record.class)
      if (cid) {
        map.set(cid.toString(), record)
      }
    }
    return map
  }, [todayRecords])

  // Aggregate statistics across classes
  const stats = useMemo(() => {
    const totalClasses = classes.length
    let submittedCount = 0
    let totalPresent = 0
    let totalAbsent = 0

    for (const cls of classes) {
      const cid = (cls.id || cls._id || '').toString()
      const record = attendanceByClassId.get(cid)
      if (record) {
        submittedCount++
        totalPresent += record.present || 0
        totalAbsent += record.absent || 0
      }
    }

    const pendingCount = Math.max(0, totalClasses - submittedCount)
    const totalStudentsRecorded = totalPresent + totalAbsent
    const overallRate =
      totalStudentsRecorded > 0
        ? Math.round((totalPresent / totalStudentsRecorded) * 100)
        : 0

    return {
      totalClasses,
      submittedCount,
      pendingCount,
      totalPresent,
      totalAbsent,
      totalStudentsRecorded,
      overallRate,
    }
  }, [classes, attendanceByClassId])

  const formattedTodayBs = useMemo(() => formatBsDate(todayBs), [todayBs])

  return (
    <div className="max-w-6xl space-y-6 sm:space-y-8 animate-in fade-in duration-150 pb-16">
      {/* ── Page Header ─────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <p className="text-[13px] text-slate-500 font-medium mb-1">
            Administration
          </p>
          <h1 className="text-[28px] font-bold text-slate-900 tracking-tight leading-tight">
            School Dashboard
          </h1>
          <p className="text-slate-600 text-sm mt-1 leading-relaxed">
            Attendance operations and classroom register tracking for session {schoolConfig.academicYear}.
          </p>
        </div>

        {/* Date Display Pill */}
        <div className="shrink-0 p-3 rounded-lg bg-white border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.06)] text-left sm:text-right">
          <p className="text-sm font-semibold text-slate-900">
            {todayDate.bsDateFormatted}
          </p>
          <p className="text-xs text-slate-500 tabular-nums">
            {todayBs || todayDate.bsDateOnly} BS • {todayDate.adFormatted}
          </p>
        </div>
      </div>

      {/* ── Error Banner ────────────────────────────────── */}
      {error && (
        <div className="p-4 rounded-lg bg-[#FBE9E9] border border-[#991B1B]/20 text-[#991B1B] text-sm flex items-center justify-between">
          <span>{error}</span>
          <Button variant="secondary" size="sm" onClick={loadDashboardData}>
            Retry
          </Button>
        </div>
      )}

      {/* ── Top Level School Overview Tiles ─────────────── */}
      <section aria-labelledby="overview-stats-heading" className="space-y-3">
        <h2 id="overview-stats-heading" className="text-sm font-semibold text-slate-900">
          Today's school attendance
        </h2>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="p-5 rounded-lg bg-white border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.06)] animate-pulse space-y-2">
                <div className="h-3 w-20 bg-slate-200 rounded" />
                <div className="h-7 w-16 bg-slate-200 rounded" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {/* Total Classes */}
            <div className="p-5 rounded-lg bg-white border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.06)] space-y-1">
              <span className="text-xs text-slate-500 font-medium">
                Total classrooms
              </span>
              <p className="text-2xl sm:text-3xl font-bold text-slate-900 tabular-nums">
                {stats.totalClasses}
              </p>
            </div>

            {/* Submissions Progress */}
            <div className="p-5 rounded-lg bg-white border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.06)] space-y-1">
              <span className="text-xs text-slate-500 font-medium">
                Registers submitted
              </span>
              <p className="text-2xl sm:text-3xl font-bold text-blue-600 tabular-nums">
                {stats.submittedCount}
                <span className="text-sm font-normal text-slate-500 ml-1">
                  / {stats.totalClasses}
                </span>
              </p>
            </div>

            {/* Present Count */}
            <div className="p-5 rounded-lg bg-white border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.06)] space-y-1">
              <span className="text-xs text-slate-500 font-medium">
                Students present
              </span>
              <p className="text-2xl sm:text-3xl font-bold text-[#166534] tabular-nums">
                {stats.totalPresent}
              </p>
              <p className="text-xs text-slate-500 tabular-nums">
                {stats.overallRate}% overall
              </p>
            </div>

            {/* Absent Count */}
            <div className="p-5 rounded-lg bg-white border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.06)] space-y-1">
              <span className="text-xs text-slate-500 font-medium">
                Students absent
              </span>
              <p className="text-2xl sm:text-3xl font-bold text-[#991B1B] tabular-nums">
                {stats.totalAbsent}
              </p>
            </div>
          </div>
        )}
      </section>

      {/* ── Today's Attendance Across Classes Table ─────── */}
      <section aria-labelledby="classes-status-heading" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 id="classes-status-heading" className="text-sm font-semibold text-slate-900">
              Classroom submission ledger
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Live submission status for{' '}
              <span className="font-medium text-slate-900">{formattedTodayBs.formatted}</span>
            </p>
          </div>

          <Link
            to="/admin/reports"
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
          >
            <span>View all registers</span>
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M5 3L9 7L5 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>

        {loading ? (
          <div className="p-8 rounded-lg bg-white border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.06)] space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 bg-slate-100 rounded animate-pulse" />
            ))}
          </div>
        ) : classes.length === 0 ? (
          <div className="p-10 rounded-lg bg-white border border-slate-200 text-center space-y-2 shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
            <p className="text-base font-semibold text-slate-900">
              No classes configured yet
            </p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Set up school classrooms in the Classes section to start tracking daily attendance.
            </p>
            <div className="pt-2">
              <Link to="/admin/classes">
                <Button variant="primary" size="sm">
                  Add class
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="border border-slate-200 rounded-lg bg-white overflow-hidden shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#1E293B] text-[#FAF8F5] sticky top-0">
                    <th className="py-3 px-4 font-semibold">Class and section</th>
                    <th className="py-3 px-4 font-semibold">Class teacher</th>
                    <th className="py-3 px-4 font-semibold text-center">Status</th>
                    <th className="py-3 px-4 font-semibold text-center">Present</th>
                    <th className="py-3 px-4 font-semibold text-center">Absent</th>
                    <th className="py-3 px-4 font-semibold text-center">Attendance %</th>
                    <th className="py-3 px-4 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {classes.map((cls) => {
                    const cid = (cls.id || cls._id || '').toString()
                    const record = attendanceByClassId.get(cid)
                    const isSubmitted = Boolean(record)
                    const totalInDay = record ? (record.present || 0) + (record.absent || 0) : 0
                    const rate =
                      totalInDay > 0
                        ? Math.round(((record.present || 0) / totalInDay) * 100)
                        : 0

                    return (
                      <tr key={cid} className="hover:bg-slate-50 transition-colors">
                        {/* Class Name */}
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-sm text-slate-900">
                            {cls.name}
                          </span>
                          {cls.section && (
                            <span className="ml-1.5 text-xs text-slate-500">
                              (Section {cls.section})
                            </span>
                          )}
                        </td>

                        {/* Assigned Teacher */}
                        <td className="py-3.5 px-4 text-slate-600">
                          {cls.teacher?.name ? (
                            <span className="font-medium text-slate-900">
                              {cls.teacher.name}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">
                              Unassigned
                            </span>
                          )}
                        </td>

                        {/* Status Badge */}
                        <td className="py-3.5 px-4 text-center">
                          {isSubmitted ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#E7F3EC] text-[#166534]">
                              Submitted
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FEF3C7] text-[#92400E]">
                              Pending
                            </span>
                          )}
                        </td>

                        {/* Present Count */}
                        <td className="py-3.5 px-4 text-center font-semibold tabular-nums">
                          {isSubmitted ? (
                            <span className="text-[#166534] text-sm">{record.present}</span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>

                        {/* Absent Count */}
                        <td className="py-3.5 px-4 text-center font-semibold tabular-nums">
                          {isSubmitted ? (
                            <span className={record.absent > 0 ? 'text-[#991B1B] text-sm' : 'text-slate-500 text-sm'}>
                              {record.absent}
                            </span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>

                        {/* Presence Percentage */}
                        <td className="py-3.5 px-4 text-center tabular-nums">
                          {isSubmitted ? (
                            <span className="font-semibold text-slate-900">
                              {rate}%
                            </span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>

                        {/* Action */}
                        <td className="py-3.5 px-4 text-right">
                          {isSubmitted ? (
                            <Link
                              to="/admin/reports"
                              className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                            >
                              Review
                            </Link>
                          ) : (
                            <span className="text-xs text-slate-400">
                              Awaiting roll call
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* ── Quick Administrative Navigation Grid ────────── */}
      <section aria-labelledby="quick-nav-heading" className="space-y-3">
        <h2 id="quick-nav-heading" className="text-sm font-semibold text-slate-900">
          Management
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            to="/admin/reports"
            className="p-5 rounded-lg bg-white border border-slate-200 hover:border-blue-500 transition-colors shadow-[0_1px_2px_rgba(15,23,42,0.06)] group"
          >
            <p className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
              Attendance reports and register audit
            </p>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Examine daily ledgers, filter by date ranges, and make corrections to absentee records.
            </p>
          </Link>

          <Link
            to="/admin/classes"
            className="p-5 rounded-lg bg-white border border-slate-200 hover:border-blue-500 transition-colors shadow-[0_1px_2px_rgba(15,23,42,0.06)] group"
          >
            <p className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
              Classes and sections
            </p>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Designate class teachers, manage sections, and monitor grade enrollments.
            </p>
          </Link>

          <Link
            to="/admin/students"
            className="p-5 rounded-lg bg-white border border-slate-200 hover:border-blue-500 transition-colors shadow-[0_1px_2px_rgba(15,23,42,0.06)] group"
          >
            <p className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
              Students roster
            </p>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Manage student roll numbers, guardian contact details, and enrollment status.
            </p>
          </Link>
        </div>
      </section>
    </div>
  )
}
