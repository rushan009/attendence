import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { schoolConfig } from '../../config/schoolConfig.js'
import * as attendanceService from '../../services/attendanceService.js'
import { formatBsDate, toDevanagariDigits } from '../../utils/nepaliDate.js'
import Button from '../../components/Button.jsx'

/**
 * Teacher: Take Attendance Page
 * Route: /teacher/take-attendance
 *
 * Rules:
 * 1. Loads getTodayAttendance()
 * 2. If teacher has no assigned class, shows a friendly guidance notice
 * 3. If attendance already taken today, shows a read-only locked summary
 * 4. If attendance not yet taken:
 *    - All active students marked present by default
 *    - Large, easy rows: tapping a row toggles absent / present
 *    - Avatar initials circle next to student names
 *    - Status colors with text labels: Present (#E7F3EC / #166534) and Absent (#FBE9E9 / #991B1B)
 *    - Sticky bottom bar with live counts and blue Save button
 *    - Confirmation dialog
 */
export default function TakeAttendancePage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [todayData, setTodayData] = useState(null)

  // Absent student IDs set for fast O(1) toggles
  const [absenteeIds, setAbsenteeIds] = useState(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [saving, setSaving] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [successBanner, setSuccessBanner] = useState(null)

  const loadAttendance = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await attendanceService.getTodayAttendance()
      setTodayData(data)
      // Initialize absentees set empty (all present by default)
      setAbsenteeIds(new Set())
    } catch (err) {
      setError(err.message || 'Unable to load today’s attendance records.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    document.title = `Take Attendance — ${schoolConfig.schoolName}`
    loadAttendance()
  }, [loadAttendance])

  const assignedClass = todayData?.class
  const students = todayData?.students || []
  const existingAttendance = todayData?.attendance
  const dateBs = todayData?.dateBs || ''
  const formattedBs = useMemo(() => formatBsDate(dateBs), [dateBs])

  // Toggle student between present and absent
  const handleToggleStudent = (studentId) => {
    setAbsenteeIds((prev) => {
      const next = new Set(prev)
      if (next.has(studentId)) {
        next.delete(studentId)
      } else {
        next.add(studentId)
      }
      return next
    })
  }

  const handleMarkAllPresent = () => {
    setAbsenteeIds(new Set())
  }

  // Filtered students for search
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students
    const q = searchQuery.toLowerCase().trim()
    return students.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        String(s.roll).includes(q) ||
        toDevanagariDigits(s.roll).includes(q)
    )
  }, [students, searchQuery])

  // Live counts
  const totalStudents = students.length
  const absentCount = absenteeIds.size
  const presentCount = Math.max(0, totalStudents - absentCount)
  const attendanceRate =
    totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0

  // Submission handler
  const handleConfirmSubmit = async () => {
    try {
      setSaving(true)
      setError(null)
      const res = await attendanceService.submitAttendance(Array.from(absenteeIds))
      setConfirmOpen(false)
      setSuccessBanner(res.message || 'Today’s attendance was saved successfully.')
      // Refresh to load the newly saved record in read-only mode
      await loadAttendance()
    } catch (err) {
      setConfirmOpen(false)
      setError(err.message || 'Failed to submit attendance.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-4xl space-y-6 pb-24 animate-in fade-in duration-150">
      {/* ── Page Header ─────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {dateBs && (
              <span className="text-[13px] px-2.5 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 font-medium tabular-nums">
                {dateBs} BS
              </span>
            )}
          </div>
          <h1 className="text-[28px] font-bold text-slate-900 tracking-tight">
            Take attendance
          </h1>
          <p className="text-slate-600 text-[15px] mt-1 max-w-2xl leading-relaxed">
            {assignedClass ? (
              <>
                Morning roll call for{' '}
                <span className="font-semibold text-slate-900">
                  {assignedClass.name}
                  {assignedClass.section ? ` (${assignedClass.section})` : ''}
                </span>{' '}
                — <span>{formattedBs.formatted}</span>
              </>
            ) : (
              'Daily classroom roll call and student presence verification.'
            )}
          </p>
        </div>

        {existingAttendance && (
          <div className="shrink-0">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-medium bg-[#E7F3EC] text-[#166534] border border-[#166534]/20">
              <span className="w-2 h-2 rounded-full bg-[#166534]" aria-hidden="true" />
              Locked & submitted
            </span>
          </div>
        )}
      </div>

      <div className="h-px bg-slate-200" aria-hidden="true" />

      {/* ── Success Banner ──────────────────────────────── */}
      {successBanner && (
        <div className="p-4 rounded-xl bg-[#E7F3EC] border border-green-200 text-[#166534] text-[14px] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">{successBanner}</span>
          </div>
          <button
            onClick={() => setSuccessBanner(null)}
            className="text-[#166534] hover:text-green-900 font-bold text-lg px-1.5 cursor-pointer"
            aria-label="Dismiss banner"
          >
            ×
          </button>
        </div>
      )}

      {/* ── Error Banner ────────────────────────────────── */}
      {error && (
        <div className="p-4 rounded-xl bg-[#FBE9E9] border border-red-200 text-[#991B1B] text-[14px] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={loadAttendance}>
            Retry
          </Button>
        </div>
      )}

      {/* ── Loading Skeleton ────────────────────────────── */}
      {loading && (
        <div className="space-y-4">
          <div className="h-24 bg-white rounded-xl border border-slate-200 animate-pulse" />
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-16 bg-white rounded-xl border border-slate-200 animate-pulse" />
            ))}
          </div>
        </div>
      )}

      {/* ── Case 1: No Classroom Assigned ───────────────── */}
      {!loading && !assignedClass && (
        <div className="p-8 rounded-xl bg-white border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.06)] space-y-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-full bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <div>
              <h2 className="text-[18px] font-semibold text-slate-900">
                No classroom assigned
              </h2>
              <p className="text-[14px] text-slate-600 mt-1 leading-relaxed">
                The school administration has not assigned a classroom to your teacher account yet.
                Taking morning attendance requires a designated grade and section.
              </p>
              <p className="text-[13px] text-slate-500 mt-2">
                कृपया कक्षा शिक्षकको जिम्मेवारी तोक्नका लागि विद्यालय प्रशासन शाखामा सम्पर्क गर्नुहोला।
              </p>
              <div className="mt-4">
                <Link
                  to="/teacher/dashboard"
                  className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-blue-600 hover:text-blue-700"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                    <path d="M9 11L5 7L9 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span>Return to dashboard</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Case 2: Attendance Already Taken (Read-only locked view) ── */}
      {!loading && assignedClass && existingAttendance && (
        <div className="space-y-6">
          {/* Read-Only Banner */}
          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.06)] space-y-3">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-full bg-[#E7F3EC] border border-green-200 text-[#166534] flex items-center justify-center shrink-0 mt-0.5">
                <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <h2 className="text-[16px] font-semibold text-slate-900">
                    Today's attendance is recorded
                  </h2>
                  <span className="text-[13px] text-slate-500 tabular-nums">
                    Taken at {new Date(existingAttendance.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-[14px] text-slate-600 mt-1 leading-relaxed">
                  Attendance for <span className="font-semibold text-slate-900">{assignedClass.name}</span> has been submitted to the school register. In accordance with school policy, teachers cannot modify saved attendance.
                  If an adjustment is needed due to a student arriving late, contact the administration office.
                </p>
                {existingAttendance.editedBy && (
                  <p className="text-[13px] text-amber-800 font-medium mt-1.5 flex items-center gap-1.5">
                    <span>*</span>
                    <span>
                      Edited by administrator {existingAttendance.editedBy.name} on{' '}
                      {new Date(existingAttendance.editedAt).toLocaleDateString()}
                    </span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Key Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
              <span className="text-[13px] text-slate-500 block">Date</span>
              <p className="text-[16px] font-bold text-slate-900 mt-1">
                {formattedBs.formatted}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
              <span className="text-[13px] text-slate-500 block">Total students</span>
              <p className="text-[24px] font-bold text-slate-900 mt-1 tabular-nums">
                {existingAttendance.present + existingAttendance.absent}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
              <span className="text-[13px] text-[#166534] font-semibold block">Present</span>
              <p className="text-[24px] font-bold text-[#166534] mt-1 tabular-nums">
                {existingAttendance.present}
              </p>
              <p className="text-[13px] text-[#166534]/80 mt-0.5 tabular-nums">
                {Math.round((existingAttendance.present / (existingAttendance.present + existingAttendance.absent || 1)) * 100)}% attendance
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
              <span className="text-[13px] text-[#991B1B] font-semibold block">Absent</span>
              <p className="text-[24px] font-bold text-[#991B1B] mt-1 tabular-nums">
                {existingAttendance.absent}
              </p>
            </div>
          </div>

          {/* List of Absentees or All Present Notice */}
          <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.06)] space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-[16px] font-semibold text-slate-900">
                Absence record
              </h3>
              <span className="text-[13px] text-slate-500 tabular-nums">
                {existingAttendance.absentees?.length || 0} absent
              </span>
            </div>

            {existingAttendance.absentees && existingAttendance.absentees.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {existingAttendance.absentees.map((student) => (
                  <div
                    key={student._id || student.id}
                    className="p-3 rounded-lg border border-red-200 bg-[#FBE9E9] flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-red-200 text-[#991B1B] text-[12px] font-semibold flex items-center justify-center tabular-nums">
                        #{student.roll}
                      </div>
                      <span className="text-[14px] font-medium text-slate-900">
                        {student.name}
                      </span>
                    </div>
                    <span className="text-[12px] font-semibold text-[#991B1B]">
                      Absent
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center space-y-1">
                <div className="w-10 h-10 rounded-full bg-[#E7F3EC] text-[#166534] mx-auto flex items-center justify-center mb-2 font-bold text-lg">
                  ✓
                </div>
                <p className="text-[16px] font-semibold text-slate-900">
                  100% attendance today
                </p>
                <p className="text-[13px] text-slate-500">
                  Every active student was present for morning roll call. No absentees recorded.
                </p>
              </div>
            )}
          </div>

          {/* Navigation Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <Link
              to="/teacher/dashboard"
              className="text-[14px] font-medium text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-1.5"
            >
              <span>← Back to dashboard</span>
            </Link>
            <Link
              to="/teacher/reports"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-[14px] font-medium rounded-lg hover:bg-slate-50 text-slate-800 transition-colors"
            >
              <span>View class reports</span>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M5 3L9 7L5 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>
        </div>
      )}

      {/* ── Case 3: Attendance NOT yet taken (Interactive Roll Call) ─ */}
      {!loading && assignedClass && !existingAttendance && (
        <div className="space-y-6">
          {/* Live Attendance Counter Bar */}
          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.06)] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[13px] text-slate-500 block">
                  Today's live headcount
                </span>
                <div className="flex items-baseline gap-5 mt-1 tabular-nums">
                  <span className="text-[24px] font-bold text-slate-900">
                    {totalStudents}{' '}
                    <span className="text-[14px] font-normal text-slate-500">
                      Total
                    </span>
                  </span>
                  <span className="text-[24px] font-bold text-[#166534]">
                    {presentCount}{' '}
                    <span className="text-[14px] font-normal text-[#166534]/80">
                      Present
                    </span>
                  </span>
                  <span className="text-[24px] font-bold text-[#991B1B]">
                    {absentCount}{' '}
                    <span className="text-[14px] font-normal text-[#991B1B]/80">
                      Absent
                    </span>
                  </span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 self-start sm:self-auto">
                {absentCount > 0 && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleMarkAllPresent}
                    title="Reset all students to present"
                  >
                    Mark all present
                  </Button>
                )}
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => setConfirmOpen(true)}
                  disabled={students.length === 0}
                >
                  Save attendance
                </Button>
              </div>
            </div>

            {/* Attendance Percentage Visual Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-[13px] text-slate-500 tabular-nums">
                <span>Presence ratio</span>
                <span className="font-semibold text-slate-900">{attendanceRate}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all duration-300 rounded-full"
                  style={{ width: `${attendanceRate}%` }}
                />
              </div>
            </div>
          </div>

          {/* Search & Guidance Bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="relative flex-1 max-w-sm">
              <input
                type="text"
                placeholder="Search by student name or roll..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 px-3 pl-9 bg-white border border-slate-200 rounded-lg text-[14px] text-slate-900 placeholder:text-slate-400 focus:outline-blue-600"
              />
              <svg
                className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
              >
                <circle cx="9" cy="9" r="6" />
                <path d="M14 14L18 18" strokeLinecap="round" />
              </svg>
            </div>

            <div className="text-[13px] text-slate-500 flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-blue-600" />
              <span>Tap any row to toggle Present / Absent</span>
            </div>
          </div>

          {/* Student Roll Call List: Large, easy rows */}
          {filteredStudents.length === 0 ? (
            <div className="py-12 text-center rounded-xl bg-white border border-slate-200 space-y-2">
              <p className="text-[16px] text-slate-900 font-semibold">
                {students.length === 0
                  ? 'No active students enrolled in this class.'
                  : 'No student matches your search query.'}
              </p>
              <p className="text-[13px] text-slate-500">
                {students.length === 0
                  ? 'Add or import students in the Class Roster section.'
                  : 'Try searching by a different name or roll number.'}
              </p>
            </div>
          ) : (
            <div className="border border-slate-200 rounded-xl bg-white overflow-hidden shadow-[0_1px_2px_rgba(15,23,42,0.06)] divide-y divide-slate-100">
              {filteredStudents.map((student) => {
                const isAbsent = absenteeIds.has(student._id || student.id)
                const studentInitials = (student.name || 'S')
                  .split(' ')
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase()

                return (
                  <div
                    key={student._id || student.id}
                    onClick={() => handleToggleStudent(student._id || student.id)}
                    className={`flex items-center justify-between p-4 sm:p-5 transition-colors cursor-pointer select-none ${
                      isAbsent
                        ? 'bg-[#FBE9E9]/60 hover:bg-[#FBE9E9]/80'
                        : 'hover:bg-slate-50/80 bg-white'
                    }`}
                  >
                    {/* Student Info with Avatar Circle */}
                    <div className="flex items-center gap-3.5">
                      {/* Avatar Initials Circle */}
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-[13px] shrink-0 border ${
                          isAbsent
                            ? 'bg-red-100 border-red-200 text-[#991B1B]'
                            : 'bg-blue-50 border-blue-200 text-blue-600'
                        }`}
                      >
                        {studentInitials}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[12px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 tabular-nums">
                            Roll {student.roll}
                          </span>
                          <p
                            className={`text-[15px] font-semibold ${
                              isAbsent ? 'text-[#991B1B]' : 'text-slate-900'
                            }`}
                          >
                            {student.name}
                          </p>
                        </div>
                        <p className="text-[13px] text-slate-500 mt-0.5">
                          {student.gender ? `${student.gender}` : ''}
                          {student.guardianPhone ? ` • 📞 ${student.guardianPhone}` : ''}
                        </p>
                      </div>
                    </div>

                    {/* Interactive Status Pill Button (Color + Label) */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleToggleStudent(student._id || student.id)
                        }}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[13px] font-semibold transition-all select-none cursor-pointer border ${
                          isAbsent
                            ? 'bg-[#FBE9E9] text-[#991B1B] border-red-200 shadow-xs'
                            : 'bg-[#E7F3EC] text-[#166534] border-green-200'
                        }`}
                        aria-pressed={isAbsent}
                      >
                        {isAbsent ? (
                          <>
                            <span className="w-2 h-2 rounded-full bg-[#991B1B]" />
                            <span>Absent</span>
                          </>
                        ) : (
                          <>
                            <span className="w-2 h-2 rounded-full bg-[#166534]" />
                            <span>Present</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Sticky Bottom Save Bar */}
          <div className="sticky bottom-4 p-4 sm:p-5 rounded-xl bg-white border border-slate-200 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 z-20">
            <div>
              <p className="text-[15px] font-semibold text-slate-900">
                Ready to submit morning roll call?
              </p>
              <p className="text-[13px] text-slate-500 tabular-nums mt-0.5">
                <span className="text-[#166534] font-semibold">{presentCount} present</span>,{' '}
                <span className="text-[#991B1B] font-semibold">{absentCount} absent</span> out of {totalStudents} students.
              </p>
            </div>
            <Button
              variant="primary"
              size="lg"
              onClick={() => setConfirmOpen(true)}
              disabled={students.length === 0}
            >
              Save attendance
            </Button>
          </div>
        </div>
      )}

      {/* ── Confirmation Modal ──────────────────────────── */}
      {confirmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-modal-title"
        >
          <div className="w-full max-w-md rounded-xl bg-white border border-slate-200 p-6 shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 id="confirm-modal-title" className="text-[18px] font-semibold text-slate-900">
                  Confirm daily attendance
                </h3>
                <p className="text-[13px] text-slate-500 mt-0.5">
                  Class: {assignedClass?.name} • {dateBs} BS
                </p>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-[#FAF8F5] border border-slate-200 text-[14px] space-y-2">
              <p className="font-semibold text-[#991B1B]">
                Attendance cannot be changed after saving.
              </p>
              <p className="text-slate-600 text-[13px] leading-relaxed">
                Once saved, your daily register is locked and submitted to the school administration.
                Please ensure you have accurately verified all students.
              </p>
              <div className="pt-2 border-t border-slate-200 flex justify-between text-[13px] text-slate-900 tabular-nums">
                <span>Marked Present: <strong>{presentCount}</strong></span>
                <span>Marked Absent: <strong>{absentCount}</strong></span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="secondary"
                size="md"
                onClick={() => setConfirmOpen(false)}
                disabled={saving}
              >
                Go back & review
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handleConfirmSubmit}
                loading={saving}
              >
                Save attendance
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
