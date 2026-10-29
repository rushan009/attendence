import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { schoolConfig } from '../../config/schoolConfig.js'
import { getTeacherDashboard } from '../../services/teacherService.js'
import { getDualCalendarDate } from '../../utils/nepaliDate.js'

/**
 * TeacherDashboardPage: Overview shell for the Teacher Attendance Workspace.
 * Clean, calm layout with simple white summary cards, today's attendance status,
 * and one primary blue "Take attendance" button.
 */
export default function TeacherDashboardPage() {
  const { user } = useAuth()
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Current dual date
  const todayDate = getDualCalendarDate()

  useEffect(() => {
    document.title = `Teacher Dashboard — ${schoolConfig.schoolName}`
  }, [])

  useEffect(() => {
    let isMounted = true

    async function loadDashboard() {
      try {
        setLoading(true)
        setError(null)
        const res = await getTeacherDashboard()
        if (isMounted) {
          setDashboardData(res.data)
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Unable to refresh dashboard records')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadDashboard()

    return () => {
      isMounted = false
    }
  }, [])

  // Resolve assigned class information from backend or fallback to auth user
  const assignedClass = dashboardData?.assignedClass || (user?.class && typeof user.class === 'object' ? user.class : null)
  const studentCount = dashboardData?.studentCount ?? 0
  const attendanceStatus = dashboardData?.attendanceStatus || 'not_taken'

  const hasAssignedClass = Boolean(assignedClass)
  const classDisplayName = assignedClass
    ? `${assignedClass.name}${assignedClass.section ? ` — Section ${assignedClass.section}` : ''}`
    : null

  const isAttendanceSubmitted = attendanceStatus === 'submitted'

  return (
    <div className="max-w-4xl space-y-8 animate-in fade-in duration-150">
      {/* ── Top Greeting Section ───────────────────────────── */}
      <div>
        <h1 className="text-[28px] font-bold text-slate-900 tracking-tight">
          Teacher Dashboard
        </h1>

        <p className="text-slate-600 text-[15px] mt-1.5 leading-relaxed">
          Welcome, <span className="text-slate-900 font-semibold">{user?.name}</span>.{' '}
          {hasAssignedClass ? (
            <>
              Assigned as Class Teacher for{' '}
              <span className="text-blue-600 font-semibold">{classDisplayName}</span> for Academic Session {schoolConfig.academicYear}.
            </>
          ) : (
            'Your faculty account is active. Class assignment is pending administrative allocation.'
          )}
        </p>
      </div>

      {/* ── Today's Attendance Overview Section ───────────── */}
      <section aria-labelledby="today-attendance-heading" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2
            id="today-attendance-heading"
            className="text-[18px] font-semibold text-slate-900"
          >
            Today's attendance
          </h2>
          <span className="text-[13px] text-slate-500">
            {todayDate.adFormatted}
          </span>
        </div>

        {loading ? (
          <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.06)] space-y-4">
            <div className="h-6 w-48 bg-slate-200 rounded animate-pulse" />
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-2">
              <div className="h-14 bg-slate-100 rounded animate-pulse" />
              <div className="h-14 bg-slate-100 rounded animate-pulse" />
              <div className="h-14 bg-slate-100 rounded animate-pulse" />
              <div className="h-14 bg-slate-100 rounded animate-pulse" />
            </div>
          </div>
        ) : hasAssignedClass ? (
          /* Case A: Teacher Has An Assigned Class */
          <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.06)] space-y-6">
            {/* Header Row: Class Name & Status */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-200">
              <div>
                <span className="text-[13px] text-slate-500 block mb-0.5">
                  Assigned classroom
                </span>
                <h3 className="text-[20px] font-bold text-slate-900">
                  {classDisplayName}
                </h3>
              </div>

              {/* Status Badge */}
              <div>
                {isAttendanceSubmitted ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[13px] font-medium bg-[#E7F3EC] text-[#166534] border border-[#166534]/20">
                    <span className="w-2 h-2 rounded-full bg-[#166534]" aria-hidden="true" />
                    Attendance submitted
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[13px] font-medium bg-[#FEF3C7] text-[#92400E] border border-[#92400E]/20">
                    <span className="w-2 h-2 rounded-full bg-[#92400E]" aria-hidden="true" />
                    Not taken today
                  </span>
                )}
              </div>
            </div>

            {/* Attendance Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-5 text-[14px]">
              <div>
                <span className="text-[13px] text-slate-500 block mb-1">
                  Today's date (BS)
                </span>
                <p className="font-semibold text-slate-900 text-[15px]">
                  {todayDate.bsDateFormatted}
                </p>
                <p className="text-[13px] text-slate-500 mt-0.5">
                  {todayDate.dayNameEn}
                </p>
              </div>

              <div>
                <span className="text-[13px] text-slate-500 block mb-1">
                  Enrolled students
                </span>
                <p className="font-semibold text-slate-900 text-[15px] tabular-nums">
                  {studentCount} {studentCount === 1 ? 'student' : 'students'}
                </p>
              </div>

              <div>
                <span className="text-[13px] text-slate-500 block mb-1">
                  Today's attendance
                </span>
                {isAttendanceSubmitted && dashboardData?.attendance ? (
                  <div>
                    <p className="text-[15px] font-semibold text-[#166534] tabular-nums">
                      {dashboardData.attendance.present} Present / {dashboardData.attendance.absent} Absent
                    </p>
                    <p className="text-[13px] text-slate-500 mt-0.5 tabular-nums">
                      {studentCount > 0 ? Math.round((dashboardData.attendance.present / studentCount) * 100) : 0}% attendance rate
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="font-semibold text-slate-900 text-[15px]">
                      Pending roll call
                    </p>
                    <p className="text-[13px] text-slate-500 mt-0.5">
                      Not yet submitted today
                    </p>
                  </div>
                )}
              </div>

              <div>
                <span className="text-[13px] text-slate-500 block mb-1">
                  Status
                </span>
                <p className="font-semibold text-slate-900 text-[15px]">
                  {isAttendanceSubmitted ? 'Submitted & Locked' : 'Awaiting entry'}
                </p>
              </div>
            </div>

            {/* Action Row */}
            <div className="pt-5 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4">
              {isAttendanceSubmitted ? (
                <>
                  <p className="text-[13px] text-slate-500">
                    Today's attendance for this section has been submitted and locked.
                  </p>
                  <Link
                    to="/teacher/take-attendance"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-800 hover:bg-slate-50 text-[14px] font-medium rounded-lg transition-colors"
                  >
                    <span>View today's record</span>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                      <path d="M3 7H11M8 4L11 7L8 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </Link>
                </>
              ) : (
                <>
                  <p className="text-[13px] text-slate-500">
                    Mark student presence and submit the daily register to the school office.
                  </p>
                  <Link
                    to="/teacher/take-attendance"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-[14px] font-semibold rounded-lg transition-colors shadow-sm cursor-pointer"
                  >
                    <span>Take attendance</span>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                      <path d="M3 7H11M8 4L11 7L8 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </Link>
                </>
              )}
            </div>
          </div>
        ) : (
          /* Case B: Teacher Has NO Assigned Class */
          <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.06)] space-y-3">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-full bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <div>
                <h3 className="text-[16px] font-semibold text-slate-900">
                  No classroom assigned
                </h3>
                <p className="text-[14px] text-slate-600 mt-1 leading-relaxed">
                  The school administrator has not assigned a classroom to your account yet. Daily attendance recording will become available once your grade and section are designated.
                </p>
                <p className="text-[13px] text-slate-500 mt-2">
                  कृपया आफ्नो कक्षा तथा सेक्सन तोक्नका लागि विद्यालय प्रशासन शाखामा सम्पर्क गर्नुहोला।
                </p>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ── Quick Access Links ────────────────────────────── */}
      <section aria-labelledby="workspace-links-heading" className="space-y-3">
        <h2
          id="workspace-links-heading"
          className="text-[18px] font-semibold text-slate-900"
        >
          Quick access
        </h2>

        <div className="border border-slate-200 rounded-xl bg-white divide-y divide-slate-100 overflow-hidden shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
          <Link
            to="/teacher/take-attendance"
            className="group flex items-center justify-between p-4 hover:bg-slate-50/80 transition-colors"
          >
            <div>
              <p className="text-[15px] font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                Take attendance
              </p>
              <p className="text-[13px] text-slate-500 mt-0.5">
                Record morning roll call and student presence for today's session.
              </p>
            </div>
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none" className="text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" aria-hidden="true">
              <path d="M6 3L11 8L6 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>

          <Link
            to="/teacher/attendance-history"
            className="group flex items-center justify-between p-4 hover:bg-slate-50/80 transition-colors"
          >
            <div>
              <p className="text-[15px] font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                Attendance history
              </p>
              <p className="text-[13px] text-slate-500 mt-0.5">
                Review past attendance registers and verified records.
              </p>
            </div>
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none" className="text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" aria-hidden="true">
              <path d="M6 3L11 8L6 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>

          <Link
            to="/teacher/roster"
            className="group flex items-center justify-between p-4 hover:bg-slate-50/80 transition-colors"
          >
            <div>
              <p className="text-[15px] font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                Class roster
              </p>
              <p className="text-[13px] text-slate-500 mt-0.5">
                View student list, roll numbers, guardian contacts, and active enrollment.
              </p>
            </div>
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none" className="text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" aria-hidden="true">
              <path d="M6 3L11 8L6 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>

          <Link
            to="/teacher/reports"
            className="group flex items-center justify-between p-4 hover:bg-slate-50/80 transition-colors"
          >
            <div>
              <p className="text-[15px] font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                Class reports
              </p>
              <p className="text-[13px] text-slate-500 mt-0.5">
                Generate student attendance summaries and term-wise attendance ledgers.
              </p>
            </div>
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none" className="text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" aria-hidden="true">
              <path d="M6 3L11 8L6 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>
      </section>

      {/* ── Faculty Details ─────────────────────────────────── */}
      <section aria-labelledby="credentials-heading" className="space-y-4">
        <h2
          id="credentials-heading"
          className="text-[18px] font-semibold text-slate-900"
        >
          Teacher profile & institution
        </h2>

        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 text-[14px] p-6 rounded-xl bg-white border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
          <div className="border-b sm:border-b-0 sm:border-r border-slate-200 pb-3 sm:pb-0 sm:pr-4">
            <dt className="text-slate-500 text-[13px]">Teacher Name</dt>
            <dd className="font-semibold text-slate-900 mt-0.5">{user?.name}</dd>
          </div>

          <div className="border-b sm:border-b-0 pb-3 sm:pb-0">
            <dt className="text-slate-500 text-[13px]">Mobile Phone Number</dt>
            <dd className="font-semibold text-slate-900 mt-0.5 tabular-nums">+977 {user?.phone}</dd>
          </div>

          <div className="border-b sm:border-b-0 sm:border-r border-slate-200 pb-3 sm:pb-0 sm:pr-4 pt-3 sm:pt-4 sm:border-t">
            <dt className="text-slate-500 text-[13px]">Assigned Classroom</dt>
            <dd className="font-semibold text-slate-900 mt-0.5">
              {classDisplayName || 'No class assigned yet'}
            </dd>
          </div>

          <div className="pt-3 sm:pt-4 sm:border-t border-slate-200">
            <dt className="text-slate-500 text-[13px]">Authorized Role</dt>
            <dd className="font-semibold text-blue-600 mt-0.5">
              Class Teacher (कक्षा शिक्षक)
            </dd>
          </div>

          <div className="sm:col-span-2 pt-3 sm:pt-4 border-t border-slate-200">
            <dt className="text-slate-500 text-[13px]">Affiliated Institution</dt>
            <dd className="font-medium text-slate-900 mt-0.5">
              <span>{schoolConfig.schoolNameNepali}</span>,{' '}
              <span>{schoolConfig.locationNepali}</span>
            </dd>
          </div>
        </dl>
      </section>
    </div>
  )
}
