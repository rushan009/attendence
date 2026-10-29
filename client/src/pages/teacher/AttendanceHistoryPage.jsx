import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'
import { schoolConfig } from '../../config/schoolConfig.js'
import * as attendanceService from '../../services/attendanceService.js'
import * as studentService from '../../services/studentService.js'
import * as adminService from '../../services/adminService.js'
import Button from '../../components/Button.jsx'
import {
  getDualCalendarDate,
  parseBsDate,
  formatBsYearMonth,
  formatBsDayMonth,
  formatBsWithWeekday,
  getAdDateString,
  toAdDate,
} from '../../utils/nepaliDate.js'

export default function AttendanceHistoryPage({ roleOverride = null }) {
  const { user } = useAuth()
  const activeRole = roleOverride || user?.role || 'teacher'
  const isAdmin = activeRole === 'admin'

  // Class & Month State
  const [classes, setClasses] = useState([])
  const [selectedClassId, setSelectedClassId] = useState('')
  const [classesLoading, setClassesLoading] = useState(true)

  const [calendarYear, setCalendarYear] = useState(2083)
  const [calendarMonthIndex, setCalendarMonthIndex] = useState(6) // 6 = Kartik (0-indexed)

  // Active Tab: 'day' | 'student'
  const [activeTab, setActiveTab] = useState('day')

  // History Data State
  const [historyData, setHistoryData] = useState(null)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyError, setHistoryError] = useState(null)

  // Accordion expanded row IDs (Set of record IDs)
  const [expandedRecordIds, setExpandedRecordIds] = useState(new Set())

  // Tab 2: Students and selected student attendance state
  const [classStudents, setClassStudents] = useState([])
  const [studentsLoading, setStudentsLoading] = useState(false)
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [studentSearchQuery, setStudentSearchQuery] = useState('')
  const [studentAttendance, setStudentAttendance] = useState(null)
  const [studentLoading, setStudentLoading] = useState(false)
  const [studentError, setStudentError] = useState(null)

  // Admin Edit Modal State
  const [editModal, setEditModal] = useState({
    isOpen: false,
    record: null,
    absenteeIds: new Set(),
    saving: false,
    error: null,
  })

  // Format month string "YYYY-MM"
  const monthStr = useMemo(() => {
    return `${calendarYear}-${String(calendarMonthIndex + 1).padStart(2, '0')}`
  }, [calendarYear, calendarMonthIndex])

  // ─── Initialize Current BS Date on Mount ─────────────────────────────
  useEffect(() => {
    document.title = `Attendance History — ${schoolConfig.schoolName}`
    const today = getDualCalendarDate(new Date())
    const parsed = parseBsDate(today.bsDateOnly)
    if (parsed) {
      setCalendarYear(parsed.year)
      setCalendarMonthIndex(parsed.monthIndex)
    }
  }, [])

  // ─── Load Classes for User Role ──────────────────────────────────────
  const loadClasses = useCallback(async () => {
    try {
      setClassesLoading(true)
      let list = []
      if (isAdmin) {
        const res = await adminService.getClasses()
        list = res.classes || []
      } else {
        const res = await studentService.getMyClassStudents()
        if (res.classes && res.classes.length > 0) {
          list = res.classes
        } else if (res.class) {
          list = [res.class]
        }
      }
      setClasses(list)
      if (list.length > 0) {
        setSelectedClassId((prev) => prev || list[0]._id || list[0].id)
      }
    } catch (err) {
      setHistoryError(err.message || 'Unable to retrieve classrooms.')
    } finally {
      setClassesLoading(false)
    }
  }, [isAdmin])

  useEffect(() => {
    loadClasses()
  }, [loadClasses])

  // ─── Fetch Attendance History for Class & Month ──────────────────────
  const fetchHistory = useCallback(async () => {
    if (!selectedClassId || !monthStr) return

    try {
      setHistoryLoading(true)
      setHistoryError(null)

      const data = await attendanceService.getAttendanceHistory({
        classId: selectedClassId,
        month: monthStr,
      })
      setHistoryData(data)
    } catch (err) {
      setHistoryError(err.message || 'Failed to load attendance history.')
      setHistoryData(null)
    } finally {
      setHistoryLoading(false)
    }
  }, [selectedClassId, monthStr])

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  // ─── Fetch Students for Tab 2 (By student) ───────────────────────────
  const fetchClassStudents = useCallback(async () => {
    if (!selectedClassId) return
    try {
      setStudentsLoading(true)
      let list = []
      if (isAdmin) {
        const res = await studentService.getStudentsByClass(selectedClassId)
        list = res.students || []
      } else {
        const res = await studentService.getMyClassStudents()
        list = res.students || []
      }
      setClassStudents(list)
      if (list.length > 0) {
        setSelectedStudentId((prev) => {
          const exists = list.some((s) => (s._id || s.id) === prev)
          return exists ? prev : list[0]._id || list[0].id
        })
      } else {
        setSelectedStudentId('')
      }
    } catch (err) {
      // student load error handled gracefully
    } finally {
      setStudentsLoading(false)
    }
  }, [selectedClassId, isAdmin])

  useEffect(() => {
    fetchClassStudents()
  }, [fetchClassStudents])

  // ─── Fetch Individual Student Attendance for Month ───────────────────
  const fetchStudentHistory = useCallback(async () => {
    if (!selectedStudentId || !monthStr) return
    try {
      setStudentLoading(true)
      setStudentError(null)
      const data = await attendanceService.getStudentAttendance(
        selectedStudentId,
        { month: monthStr }
      )
      setStudentAttendance(data)
    } catch (err) {
      setStudentError(err.message || 'Failed to load student attendance record.')
      setStudentAttendance(null)
    } finally {
      setStudentLoading(false)
    }
  }, [selectedStudentId, monthStr])

  useEffect(() => {
    if (activeTab === 'student') {
      fetchStudentHistory()
    }
  }, [fetchStudentHistory, activeTab])

  // ─── Month Navigation ────────────────────────────────────────────────
  const handlePrevMonth = () => {
    if (calendarMonthIndex === 0) {
      setCalendarMonthIndex(11)
      setCalendarYear((y) => y - 1)
    } else {
      setCalendarMonthIndex((m) => m - 1)
    }
  }

  const handleNextMonth = () => {
    if (calendarMonthIndex === 11) {
      setCalendarMonthIndex(0)
      setCalendarYear((y) => y + 1)
    } else {
      setCalendarMonthIndex((m) => m + 1)
    }
  }

  // ─── Accordion Row Toggle ────────────────────────────────────────────
  const toggleRowExpanded = (id) => {
    setExpandedRecordIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  // ─── Combine & Sort Daily Timeline Rows (Newest First) ───────────────
  const timelineItems = useMemo(() => {
    if (!historyData) return []

    const items = []

    // 1. Saved Attendance Records
    for (const rec of historyData.records || []) {
      items.push({
        type: 'record',
        dateBs: rec.dateBs,
        record: rec,
      })
    }

    // 2. Expected School Days with No Record
    const recordedDatesSet = new Set(
      (historyData.records || []).map((r) => r.dateBs)
    )
    for (const dateBs of historyData.missingDates || []) {
      if (!recordedDatesSet.has(dateBs)) {
        items.push({
          type: 'missing',
          dateBs,
        })
      }
    }

    // 3. Holidays (show as thin muted row if no attendance session was taken)
    for (const hol of historyData.holidays || []) {
      if (!recordedDatesSet.has(hol.dateBs)) {
        items.push({
          type: 'holiday',
          dateBs: hol.dateBs,
          holidayName: hol.name,
        })
      }
    }

    // Sort descending by dateBs (newest first)
    items.sort((a, b) => (b.dateBs > a.dateBs ? 1 : b.dateBs < a.dateBs ? -1 : 0))

    return items
  }, [historyData])

  // ─── Student Streak Calculations ─────────────────────────────────────
  const absenceStreaks = useMemo(() => {
    const dates = studentAttendance?.absentDates || []
    if (dates.length < 2) return []

    const sorted = [...dates].sort()
    const streaks = []
    let current = [sorted[0]]

    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1]
      const curr = sorted[i]
      const prevAd = toAdDate(prev)
      const currAd = toAdDate(curr)
      const diff =
        prevAd && currAd
          ? Math.round((currAd - prevAd) / (1000 * 60 * 60 * 24))
          : 999

      if (diff === 1) {
        current.push(curr)
      } else {
        if (current.length >= 2) {
          streaks.push([...current])
        }
        current = [curr]
      }
    }

    if (current.length >= 2) {
      streaks.push([...current])
    }

    return streaks
  }, [studentAttendance?.absentDates])

  // Filter students by search in Tab 2
  const filteredStudents = useMemo(() => {
    if (!studentSearchQuery.trim()) return classStudents
    const q = studentSearchQuery.toLowerCase().trim()
    return classStudents.filter(
      (s) =>
        s.name?.toLowerCase().includes(q) ||
        String(s.roll || '').includes(q)
    )
  }, [classStudents, studentSearchQuery])

  // ─── Admin Edit Modal Handlers ───────────────────────────────────────
  const openEditModal = (rec) => {
    const absSet = new Set((rec.absentees || []).map((a) => a._id || a))
    setEditModal({
      isOpen: true,
      record: rec,
      absenteeIds: absSet,
      saving: false,
      error: null,
    })
  }

  const toggleAbsenteeInModal = (studentId) => {
    setEditModal((prev) => {
      const nextSet = new Set(prev.absenteeIds)
      if (nextSet.has(studentId)) {
        nextSet.delete(studentId)
      } else {
        nextSet.add(studentId)
      }
      return { ...prev, absenteeIds: nextSet }
    })
  }

  const handleSaveEdit = async () => {
    if (!editModal.record) return
    try {
      setEditModal((prev) => ({ ...prev, saving: true, error: null }))
      const absenteeArray = Array.from(editModal.absenteeIds)
      await attendanceService.updateAttendance(
        editModal.record._id,
        absenteeArray
      )
      setEditModal({
        isOpen: false,
        record: null,
        absenteeIds: new Set(),
        saving: false,
        error: null,
      })
      await fetchHistory()
    } catch (err) {
      setEditModal((prev) => ({
        ...prev,
        saving: false,
        error: err.message || 'Failed to update attendance record.',
      }))
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16 animate-in fade-in duration-150">
      {/* ── Page Header ─────────────────────────────────────── */}
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-[28px] font-bold text-slate-900 tracking-tight">
          Attendance history
        </h1>
        <p className="text-slate-600 text-[15px] mt-1">
          A day-by-day record of classroom attendance
        </p>
      </div>

      {/* ── Top Bar Controls: Class Select & Month Selector ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-1">
        {/* Class Select */}
        <div className="flex items-center gap-2.5">
          <label
            htmlFor="history-class-select"
            className="text-[13px] font-semibold text-slate-700 shrink-0"
          >
            Class:
          </label>
          {classesLoading ? (
            <div className="h-10 w-44 bg-white rounded-lg border border-slate-200 animate-pulse" />
          ) : classes.length === 0 ? (
            <span className="text-[13px] text-slate-500 italic">
              {isAdmin
                ? 'No classes available.'
                : 'No class assigned to your teacher account.'}
            </span>
          ) : (
            <select
              id="history-class-select"
              value={selectedClassId}
              onChange={(e) => {
                setSelectedClassId(e.target.value)
                setExpandedRecordIds(new Set())
              }}
              className="h-10 px-3 text-[14px] font-medium bg-white rounded-lg border border-slate-200 text-slate-900 focus-visible:outline-blue-600 cursor-pointer shadow-xs"
            >
              {classes.map((cls) => {
                const id = cls._id || cls.id
                return (
                  <option key={id} value={id}>
                    {cls.name}
                    {cls.section ? ` (${cls.section})` : ''}
                  </option>
                )
              })}
            </select>
          )}
        </div>

        {/* Month Selector */}
        <div className="inline-flex items-center gap-1.5 bg-white px-2 py-1 rounded-lg border border-slate-200 shrink-0 self-start sm:self-auto shadow-xs">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="w-8 h-8 inline-flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 cursor-pointer focus-visible:outline-blue-600 transition-colors"
            aria-label="Previous month"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          <span className="font-semibold text-[14px] text-slate-900 px-3 min-w-[140px] text-center select-none">
            {formatBsYearMonth(calendarYear, calendarMonthIndex)}
          </span>

          <button
            type="button"
            onClick={handleNextMonth}
            className="w-8 h-8 inline-flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 cursor-pointer focus-visible:outline-blue-600 transition-colors"
            aria-label="Next month"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── Slim Summary Strip (Plain Text, Not Cards) ───────── */}
      {historyData?.summary && (
        <div className="text-[14px] text-slate-600 font-medium py-1 tabular-nums">
          <span className="text-slate-900 font-semibold">
            {historyData.summary.recordedDays}{' '}
            {historyData.summary.recordedDays === 1 ? 'day' : 'days'} recorded
          </span>{' '}
          · average{' '}
          <span className="text-[#166534] font-semibold">
            {historyData.summary.averagePercentage !== null
              ? `${historyData.summary.averagePercentage}%`
              : '0%'}{' '}
            present
          </span>{' '}
          ·{' '}
          <span
            className={
              historyData.summary.missingDays > 0
                ? 'text-[#991B1B] font-semibold'
                : 'text-slate-900 font-semibold'
            }
          >
            {historyData.summary.missingDays}{' '}
            {historyData.summary.missingDays === 1 ? 'day' : 'days'} with no record
          </span>
        </div>
      )}

      {/* ── Tabs: By Day & By Student ─────────────────────────── */}
      <div className="border-b border-slate-200 flex items-center gap-6">
        <button
          type="button"
          onClick={() => setActiveTab('day')}
          className={`pb-2.5 text-[14px] font-medium border-b-2 transition-colors cursor-pointer ${
            activeTab === 'day'
              ? 'border-blue-600 text-blue-600 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          By day
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('student')}
          className={`pb-2.5 text-[14px] font-medium border-b-2 transition-colors cursor-pointer ${
            activeTab === 'student'
              ? 'border-blue-600 text-blue-600 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          By student
        </button>
      </div>

      {/* ── Error Banner ─────────────────────────────────────── */}
      {historyError && (
        <div className="p-4 rounded-xl bg-[#FBE9E9] border border-red-200 text-[#991B1B] text-[14px] flex items-start gap-3">
          <svg className="w-5 h-5 text-[#991B1B] shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <div className="flex-1">
            <p className="font-semibold text-[#991B1B]">Error</p>
            <p className="mt-0.5">{historyError}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchHistory}
              className="mt-2 text-xs"
            >
              Try again
            </Button>
          </div>
        </div>
      )}

      {/* ── Tab 1: By Day (Airy, List-Based Timeline) ─────────── */}
      {activeTab === 'day' && (
        <div className="space-y-3">
          {historyLoading ? (
            <div className="space-y-3 animate-pulse">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-16 bg-white rounded-xl border border-slate-200" />
              ))}
            </div>
          ) : timelineItems.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-500 text-[14px]">
              No attendance records or school sessions for this month.
            </div>
          ) : (
            <div className="space-y-2.5">
              {timelineItems.map((item) => {
                // Public Holiday Row
                if (item.type === 'holiday') {
                  return (
                    <div
                      key={`holiday-${item.dateBs}`}
                      className="px-4 py-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-[13px] text-slate-600"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                        <span className="font-medium text-slate-800">
                          {formatBsWithWeekday(item.dateBs)}
                        </span>
                        <span className="text-slate-400 tabular-nums">
                          ({getAdDateString(item.dateBs)})
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="italic text-slate-600">{item.holidayName}</span>
                      </div>
                      <span className="text-[12px] px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-medium">
                        Holiday
                      </span>
                    </div>
                  )
                }

                // Missing Expected School Day Row (Muted)
                if (item.type === 'missing') {
                  return (
                    <div
                      key={`missing-${item.dateBs}`}
                      className="px-4 py-2.5 rounded-lg bg-slate-50/70 border border-slate-200 flex items-center justify-between text-[13px] text-slate-500"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-2 h-2 rounded-full bg-slate-300 shrink-0" />
                        <span className="font-medium text-slate-600">
                          {formatBsWithWeekday(item.dateBs)}
                        </span>
                        <span className="text-slate-400 tabular-nums">
                          ({getAdDateString(item.dateBs)})
                        </span>
                      </div>
                      <span className="text-[12px] px-2 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200">
                        Not recorded
                      </span>
                    </div>
                  )
                }

                // Recorded Attendance Row (Airy Accordion)
                const rec = item.record
                const isExpanded = expandedRecordIds.has(rec._id)
                const total = (rec.present || 0) + (rec.absent || 0)
                const presentPercent = total > 0 ? ((rec.present || 0) / total) * 100 : 0
                const absentCount = rec.absent || 0

                let recordedTime = ''
                if (rec.createdAt) {
                  try {
                    recordedTime = new Date(rec.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  } catch (e) {}
                }

                let editedDate = ''
                if (rec.editedAt) {
                  try {
                    editedDate = new Date(rec.editedAt).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                    })
                  } catch (e) {}
                }

                return (
                  <div
                    key={rec._id}
                    className="bg-white rounded-xl border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.06)] transition-all overflow-hidden"
                  >
                    {/* Summary Header */}
                    <button
                      type="button"
                      onClick={() => toggleRowExpanded(rec._id)}
                      className="w-full px-4 sm:px-5 py-3.5 text-left flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 cursor-pointer focus-visible:outline-blue-600 transition-colors"
                      aria-expanded={isExpanded}
                    >
                      {/* Left: Date */}
                      <div className="flex items-center gap-3">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#166534] shrink-0" />
                        <div>
                          <p className="text-[15px] font-semibold text-slate-900 leading-tight">
                            {formatBsWithWeekday(rec.dateBs)}
                          </p>
                          <p className="text-[13px] text-slate-500 leading-tight mt-0.5 tabular-nums">
                            {getAdDateString(rec.dateBs)}
                          </p>
                        </div>
                      </div>

                      {/* Center: Small present/absent bar & live counts */}
                      <div className="flex items-center gap-3">
                        <div
                          className="w-24 sm:w-28 h-2 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex shrink-0"
                          title={`${Math.round(presentPercent)}% present`}
                        >
                          <div
                            className="bg-[#166534] h-full transition-all"
                            style={{ width: `${presentPercent}%` }}
                          />
                          {absentCount > 0 && (
                            <div className="bg-[#991B1B] h-full flex-1" />
                          )}
                        </div>

                        <span className="text-[13px] text-slate-700 tabular-nums">
                          <span className="text-[#166534] font-semibold">{rec.present} Present</span> ·{' '}
                          <span className={absentCount > 0 ? 'text-[#991B1B] font-semibold' : 'text-slate-500'}>
                            {absentCount} Absent
                          </span>
                        </span>
                      </div>

                      {/* Right: Status Tag + Chevron */}
                      <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                        <span className="text-[12px] px-2.5 py-0.5 rounded-full bg-[#E7F3EC] text-[#166534] border border-green-200 font-semibold">
                          Recorded
                        </span>

                        <svg
                          className={`w-4 h-4 text-slate-400 transition-transform duration-150 ${
                            isExpanded ? 'rotate-180' : ''
                          }`}
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </div>
                    </button>

                    {/* Accordion Detail Body */}
                    {isExpanded && (
                      <div className="px-4 sm:px-5 pb-4 pt-3 border-t border-slate-100 bg-slate-50/50 space-y-3">
                        {/* Absent Students Chips */}
                        <div>
                          <p className="text-[12px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                            Absent students
                          </p>
                          {!rec.absentees || rec.absentees.length === 0 ? (
                            <p className="text-[13px] text-[#166534] font-medium italic">
                              Everyone was present
                            </p>
                          ) : (
                            <div className="flex flex-wrap gap-1.5">
                              {rec.absentees.map((student) => {
                                const id = student._id || student
                                const name = student.name || 'Student'
                                const roll = student.roll
                                return (
                                  <span
                                    key={id}
                                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[13px] font-medium bg-[#FBE9E9] text-[#991B1B] border border-red-200"
                                  >
                                    <span>{name}</span>
                                    {roll !== undefined && (
                                      <span className="text-[12px] text-red-700/80 tabular-nums">
                                        (Roll {roll})
                                      </span>
                                    )}
                                  </span>
                                )
                              })}
                            </div>
                          )}
                        </div>

                        {/* Audit Footer with Locked Indicator */}
                        <div className="pt-2 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[13px] text-slate-500">
                          <div className="space-y-0.5">
                            <p>
                              Recorded by{' '}
                              <span className="text-slate-900 font-semibold">
                                {rec.teacher?.name || 'Teacher'}
                              </span>
                              {recordedTime && ` at ${recordedTime}`}
                            </p>
                            {rec.editedBy && (
                              <p className="text-[12px] text-slate-500">
                                Edited by{' '}
                                <span className="text-slate-800">
                                  {rec.editedBy.name || 'Admin'}
                                </span>
                                {editedDate && ` on ${editedDate}`}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-2 self-start sm:self-auto">
                            {/* Teacher: Locked indicator */}
                            {!isAdmin && (
                              <div
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[13px] bg-white border border-slate-200 text-slate-600 select-none shadow-2xs"
                                title="Saved attendance can only be modified by school administration"
                              >
                                <svg className="w-3.5 h-3.5 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                </svg>
                                <span>Locked</span>
                              </div>
                            )}

                            {/* Admin: Edit button */}
                            {isAdmin && (
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => openEditModal(rec)}
                              >
                                Edit register
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Tab 2: By Student ────────────────────────────────── */}
      {activeTab === 'student' && (
        <div className="space-y-5">
          {/* Student Picker Card */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.06)] space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <label
                htmlFor="student-picker-select"
                className="text-[14px] font-semibold text-slate-900"
              >
                Select student
              </label>

              <input
                type="text"
                value={studentSearchQuery}
                onChange={(e) => setStudentSearchQuery(e.target.value)}
                placeholder="Search name or roll..."
                className="h-9 px-3 text-[13px] bg-slate-50 rounded-lg border border-slate-200 text-slate-900 focus-visible:outline-blue-600 w-full sm:w-60"
              />
            </div>

            {studentsLoading ? (
              <div className="h-10 bg-slate-100 rounded-lg border border-slate-200 animate-pulse" />
            ) : filteredStudents.length === 0 ? (
              <p className="text-[13px] text-slate-500 italic">
                {classStudents.length === 0
                  ? 'No students found in this class.'
                  : 'No students matching search criteria.'}
              </p>
            ) : (
              <select
                id="student-picker-select"
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full h-10 px-3 text-[14px] font-medium bg-white rounded-lg border border-slate-200 text-slate-900 focus-visible:outline-blue-600 cursor-pointer shadow-xs"
              >
                {filteredStudents.map((s) => {
                  const id = s._id || s.id
                  return (
                    <option key={id} value={id}>
                      {s.roll !== undefined ? `Roll ${s.roll} — ` : ''}
                      {s.name}
                    </option>
                  )
                })}
              </select>
            )}
          </div>

          {/* Student Monthly History Display */}
          {studentLoading && (
            <div className="space-y-4 animate-pulse">
              <div className="h-12 bg-white rounded-xl border border-slate-200" />
              <div className="h-24 bg-white rounded-xl border border-slate-200" />
            </div>
          )}

          {studentError && (
            <div className="p-4 rounded-xl bg-[#FBE9E9] text-[#991B1B] text-[14px] border border-red-200">
              {studentError}
            </div>
          )}

          {!studentLoading && studentAttendance && (
            <div className="space-y-5">
              {/* Summary Strip */}
              <div className="p-4 bg-white rounded-xl border border-slate-200 text-[14px] text-slate-900 font-medium shadow-[0_1px_2px_rgba(15,23,42,0.06)] tabular-nums">
                <span className="font-semibold text-[#166534]">
                  {studentAttendance.present}{' '}
                  {studentAttendance.present === 1 ? 'day' : 'days'} present
                </span>{' '}
                ·{' '}
                <span
                  className={
                    studentAttendance.absent > 0
                      ? 'text-[#991B1B] font-semibold'
                      : 'text-slate-500'
                  }
                >
                  {studentAttendance.absent}{' '}
                  {studentAttendance.absent === 1 ? 'day' : 'days'} absent
                </span>{' '}
                ·{' '}
                <span className="text-slate-900 font-semibold">
                  {studentAttendance.percentage !== null
                    ? `${studentAttendance.percentage}% attendance`
                    : 'No sessions recorded'}
                </span>
              </div>

              {/* Day Dots Visual Strip for the Month */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.06)] space-y-3">
                <p className="text-[13px] font-semibold text-slate-700">
                  Monthly day timeline
                </p>

                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {(studentAttendance.dayStatuses || []).map((ds) => {
                    const parsed = parseBsDate(ds.dateBs)
                    const dayNum = parsed ? parsed.day : ds.dateBs

                    let dotClass = 'w-7 h-7 rounded-lg text-[12px] flex items-center justify-center font-medium cursor-default tabular-nums '
                    let label = ''

                    if (ds.status === 'present') {
                      dotClass += 'bg-[#E7F3EC] text-[#166534] border border-green-200'
                      label = `${formatBsDayMonth(ds.dateBs)}: Present`
                    } else if (ds.status === 'absent') {
                      dotClass += 'bg-[#FBE9E9] text-[#991B1B] border border-red-200 font-bold'
                      label = `${formatBsDayMonth(ds.dateBs)}: Absent`
                    } else {
                      dotClass += 'bg-slate-100 text-slate-400 border border-slate-200'
                      label = `${formatBsDayMonth(ds.dateBs)}: No record / Off`
                    }

                    return (
                      <div
                        key={ds.dateBs}
                        className={dotClass}
                        title={label}
                        aria-label={label}
                      >
                        {dayNum}
                      </div>
                    )
                  })}
                </div>

                {/* Dot Strip Legend */}
                <div className="pt-2 flex items-center gap-4 text-[13px] text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#166534] inline-block" />
                    <span>Present</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#991B1B] inline-block" />
                    <span>Absent</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-300 inline-block" />
                    <span>No record / Off</span>
                  </div>
                </div>
              </div>

              {/* Compact List of Absences */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.06)] space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-[16px] font-semibold text-slate-900">
                    Recorded absences
                  </h3>
                  <span className="text-[13px] text-slate-500 tabular-nums">
                    Total: {studentAttendance.absent}
                  </span>
                </div>

                {/* Streak notes */}
                {absenceStreaks.length > 0 && (
                  <div className="space-y-1.5">
                    {absenceStreaks.map((streak, idx) => {
                      const count = streak.length
                      const startDay = formatBsDayMonth(streak[0])
                      const endDay = formatBsDayMonth(streak[streak.length - 1])
                      return (
                        <div
                          key={idx}
                          className="px-3.5 py-2 rounded-lg bg-[#FEF3C7] border border-amber-300 text-[#92400E] text-[13px] font-medium flex items-center gap-2"
                        >
                          <svg className="w-4 h-4 text-[#92400E] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                          </svg>
                          <span>
                            Absent {count} days in a row, {startDay} to {endDay}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Absent Days List */}
                {!studentAttendance.absentDates ||
                studentAttendance.absentDates.length === 0 ? (
                  <p className="text-[14px] text-[#166534] font-medium italic py-2">
                    No absences this month
                  </p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {studentAttendance.absentDates.map((dateBs) => (
                      <div
                        key={dateBs}
                        className="py-2.5 flex items-center justify-between text-[14px]"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-[#991B1B] shrink-0" />
                          <span className="font-semibold text-slate-900">
                            {formatBsWithWeekday(dateBs)}
                          </span>
                          <span className="text-slate-500 text-[13px] tabular-nums">
                            ({getAdDateString(dateBs)})
                          </span>
                        </div>
                        <span className="text-[#991B1B] font-semibold text-[12px] px-2.5 py-0.5 rounded-full bg-[#FBE9E9] border border-red-200">
                          Absent
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Admin Edit Attendance Modal ──────────────────────── */}
      {isAdmin && editModal.isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-100"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-start justify-between border-b border-slate-200 pb-3">
              <div>
                <h2 className="text-[18px] font-semibold text-slate-900">
                  Edit attendance register
                </h2>
                <p className="text-[13px] text-slate-500 mt-0.5 tabular-nums">
                  {formatBsWithWeekday(editModal.record?.dateBs)} ({editModal.record?.dateBs} BS)
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setEditModal({
                    isOpen: false,
                    record: null,
                    absenteeIds: new Set(),
                    saving: false,
                    error: null,
                  })
                }
                className="text-slate-400 hover:text-slate-700 cursor-pointer p-1 text-lg leading-none"
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            {editModal.error && (
              <div className="p-3.5 rounded-lg bg-[#FBE9E9] text-[#991B1B] text-[13px] border border-red-200">
                {editModal.error}
              </div>
            )}

            <p className="text-[14px] text-slate-600 leading-relaxed">
              Check the students who were <span className="font-semibold text-[#991B1B]">absent</span> on this day. Unchecked students will be marked present.
            </p>

            {/* Students Checkbox List */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-lg bg-slate-50/50 p-2 max-h-64">
              {classStudents.map((student) => {
                const sId = student._id || student.id
                const isAbsent = editModal.absenteeIds.has(sId)
                return (
                  <label
                    key={sId}
                    className="flex items-center justify-between py-2 px-2 hover:bg-white rounded cursor-pointer transition-colors text-[13px]"
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={isAbsent}
                        onChange={() => toggleAbsenteeInModal(sId)}
                        className="rounded border-slate-300 text-red-600 focus:ring-red-500 cursor-pointer w-4 h-4"
                      />
                      <span className="font-medium text-slate-900">
                        {student.roll !== undefined && (
                          <span className="text-slate-500 mr-1.5 tabular-nums font-semibold">
                            #{student.roll}
                          </span>
                        )}
                        {student.name}
                      </span>
                    </div>

                    <span
                      className={`text-[12px] px-2 py-0.5 rounded-full font-medium ${
                        isAbsent
                          ? 'bg-[#FBE9E9] text-[#991B1B]'
                          : 'bg-[#E7F3EC] text-[#166534]'
                      }`}
                    >
                      {isAbsent ? 'Absent' : 'Present'}
                    </span>
                  </label>
                )
              })}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-200">
              <span className="text-[13px] text-slate-500 tabular-nums">
                {editModal.absenteeIds.size} absent ·{' '}
                {classStudents.length - editModal.absenteeIds.size} present
              </span>

              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={editModal.saving}
                  onClick={() =>
                    setEditModal({
                      isOpen: false,
                      record: null,
                      absenteeIds: new Set(),
                      saving: false,
                      error: null,
                    })
                  }
                >
                  Cancel
                </Button>

                <Button
                  variant="primary"
                  size="sm"
                  loading={editModal.saving}
                  onClick={handleSaveEdit}
                >
                  Save changes
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
