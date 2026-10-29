import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'
import { schoolConfig } from '../../config/schoolConfig.js'
import * as attendanceService from '../../services/attendanceService.js'
import * as studentService from '../../services/studentService.js'
import * as adminService from '../../services/adminService.js'
import Button from '../../components/Button.jsx'
import { getHolidayByBsDate } from '../../config/holidays.config.js'
import {
  ATTENDANCE_THRESHOLD,
  getDualCalendarDate,
  formatBsDayMonth,
  formatBsYearMonth,
  formatBsRangeHeading,
  getDaysInBsMonth,
  getBsMonthFirstDayOfWeek,
  parseBsDate,
} from '../../utils/nepaliDate.js'

const PAGE_SIZE = 15

export default function ClassReportsPage({ roleOverride = null }) {
  const { user } = useAuth()
  const activeRole = roleOverride || user?.role || 'teacher'

  // Classes state
  const [classes, setClasses] = useState([])
  const [selectedClassId, setSelectedClassId] = useState('')
  const [classesLoading, setClassesLoading] = useState(true)

  // Calendar & Range state
  const [todayBs, setTodayBs] = useState('')
  const [calendarYear, setCalendarYear] = useState(2083)
  const [calendarMonthIndex, setCalendarMonthIndex] = useState(6) // 6 = Kartik (0-indexed)
  const [fromBs, setFromBs] = useState('')
  const [toBs, setToBs] = useState('')
  const [selectingEnd, setSelectingEnd] = useState(false)

  // Report Data state
  const [reportData, setReportData] = useState(null)
  const [loadingReport, setLoadingReport] = useState(false)
  const [reportError, setReportError] = useState(null)
  const [isExporting, setIsExporting] = useState(false)

  // Active filter tab: 'all' | 'below75'
  const [activeTab, setActiveTab] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)

  // ─── Initialize Dates on Mount ───────────────────────────────────────
  useEffect(() => {
    document.title = `Attendance Report — ${schoolConfig.schoolName}`
    const todayInfo = getDualCalendarDate(new Date())
    const todayBsStr = todayInfo.bsDateOnly // "YYYY-MM-DD"
    setTodayBs(todayBsStr)

    const parsed = parseBsDate(todayBsStr)
    if (parsed) {
      setCalendarYear(parsed.year)
      setCalendarMonthIndex(parsed.monthIndex)
      // Default range: 1st of current month to today
      const defaultFrom = `${parsed.year}-${String(parsed.monthIndex + 1).padStart(2, '0')}-01`
      setFromBs(defaultFrom)
      setToBs(todayBsStr)
    } else {
      setFromBs('2083-07-01')
      setToBs('2083-07-30')
    }
  }, [])

  // ─── Load Available Classes ──────────────────────────────────────────
  const loadClasses = useCallback(async () => {
    try {
      setClassesLoading(true)
      let classList = []

      if (activeRole === 'admin') {
        const res = await adminService.getClasses()
        classList = res.classes || []
      } else {
        const res = await studentService.getMyClassStudents()
        if (res.classes && res.classes.length > 0) {
          classList = res.classes
        } else if (res.class) {
          classList = [res.class]
        }
      }

      setClasses(classList)
      if (classList.length > 0) {
        setSelectedClassId((prev) => prev || classList[0]._id || classList[0].id)
      }
    } catch (err) {
      setReportError(err.message || 'Failed to load class list.')
    } finally {
      setClassesLoading(false)
    }
  }, [activeRole])

  useEffect(() => {
    loadClasses()
  }, [loadClasses])

  // ─── Fetch Attendance Report ─────────────────────────────────────────
  const fetchReport = useCallback(async () => {
    if (!selectedClassId || !fromBs || !toBs) return

    try {
      setLoadingReport(true)
      setReportError(null)

      const data = await attendanceService.getAttendanceReport({
        classId: selectedClassId,
        from: fromBs,
        to: toBs,
      })

      setReportData(data)
      setCurrentPage(1)
    } catch (err) {
      setReportError(err.message || 'Failed to generate attendance report.')
      setReportData(null)
    } finally {
      setLoadingReport(false)
    }
  }, [selectedClassId, fromBs, toBs])

  useEffect(() => {
    if (selectedClassId && fromBs && toBs) {
      fetchReport()
    }
  }, [fetchReport, selectedClassId, fromBs, toBs])

  // ─── Month Calendar Navigation ──────────────────────────────────────
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

  // ─── Range Selection on Calendar ────────────────────────────────────
  const handleDayClick = (dateStr, isSaturday) => {
    if (isSaturday) return

    if (!selectingEnd) {
      setFromBs(dateStr)
      setToBs(dateStr)
      setSelectingEnd(true)
    } else {
      if (dateStr < fromBs) {
        setToBs(fromBs)
        setFromBs(dateStr)
      } else {
        setToBs(dateStr)
      }
      setSelectingEnd(false)
    }
  }

  // ─── Calendar Grid Computation ──────────────────────────────────────
  const daysInMonth = useMemo(
    () => getDaysInBsMonth(calendarYear, calendarMonthIndex),
    [calendarYear, calendarMonthIndex]
  )

  const firstDayOfWeek = useMemo(
    () => getBsMonthFirstDayOfWeek(calendarYear, calendarMonthIndex),
    [calendarYear, calendarMonthIndex]
  )

  const recordedDatesSet = useMemo(() => {
    return new Set(reportData?.recordedDates || [])
  }, [reportData?.recordedDates])

  // ─── Selected Class Display Name ────────────────────────────────────
  const selectedClassObj = useMemo(() => {
    return classes.find(
      (c) => (c._id || c.id)?.toString() === selectedClassId?.toString()
    )
  }, [classes, selectedClassId])

  const selectedClassName = useMemo(() => {
    if (reportData?.class) {
      return `${reportData.class.name}${
        reportData.class.section ? ` ${reportData.class.section}` : ''
      }`.trim()
    }
    if (selectedClassObj) {
      return `${selectedClassObj.name}${
        selectedClassObj.section ? ` ${selectedClassObj.section}` : ''
      }`.trim()
    }
    return 'Class'
  }, [reportData, selectedClassObj])

  // ─── Filtered Table Rows & Pagination ───────────────────────────────
  const allRows = reportData?.rows || []

  const filteredRows = useMemo(() => {
    if (activeTab === 'below75') {
      return allRows.filter(
        (r) => r.percentage !== null && r.percentage < ATTENDANCE_THRESHOLD
      )
    }
    return allRows
  }, [allRows, activeTab])

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE))
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return filteredRows.slice(start, start + PAGE_SIZE)
  }, [filteredRows, currentPage])

  // ─── Actions: Export & Print ────────────────────────────────────────
  const handleExport = async () => {
    if (!selectedClassId || !fromBs || !toBs) return
    try {
      setIsExporting(true)
      const blob = await attendanceService.downloadAttendanceReport({
        classId: selectedClassId,
        from: fromBs,
        to: toBs,
      })

      const url = window.URL.createObjectURL(new Blob([blob]))
      const link = document.createElement('a')
      link.href = url
      const safeClass = selectedClassName.replace(/[^a-zA-Z0-9_-]/g, '_')
      link.setAttribute('download', `attendance-report-${safeClass}-${fromBs}_to_${toBs}.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      alert(err.message || 'Failed to download Excel report.')
    } finally {
      setIsExporting(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="max-w-[1240px] mx-auto space-y-6 pb-16 animate-in fade-in duration-150">
      {/* ─── Header: Title + Actions ─────────────────────────────────── */}
      <div className="border-b border-slate-200 pb-5 no-print">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-[28px] font-bold text-slate-900 tracking-tight">
              Class reports
            </h1>
            <p className="text-slate-600 text-[15px] mt-0.5">
              Per-student attendance report for a designated class and date range
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Button
              variant="secondary"
              size="md"
              onClick={handlePrint}
              disabled={loadingReport || !reportData}
              className="gap-2"
              aria-label="Print view"
            >
              <svg className="w-4 h-4 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="6 9 6 2 18 2 18 9" />
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                <rect x="6" y="14" width="12" height="8" />
              </svg>
              <span>Print view</span>
            </Button>

            <Button
              variant="primary"
              size="md"
              onClick={handleExport}
              loading={isExporting}
              disabled={loadingReport || !reportData || reportData.schoolDays === 0}
              className="gap-2"
              aria-label="Download Excel"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span>Download Excel</span>
            </Button>
          </div>
        </div>
      </div>

      {/* ─── Printable Document Header (Only on paper print) ────────── */}
      <div className="hidden print:block mb-6 border-b pb-4">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold">{schoolConfig.schoolName}</h1>
          <p className="text-sm text-gray-600">{schoolConfig.location}</p>
          <div className="mt-3 py-1 border-y border-gray-300 font-semibold text-base">
            Class Attendance Report — {selectedClassName}
          </div>
          <p className="text-xs text-gray-600 mt-1">
            Date Range (BS): {fromBs} to {toBs} &nbsp;|&nbsp; School Days Recorded: {reportData?.schoolDays || 0} &nbsp;|&nbsp; Generated on: {todayBs} BS
          </p>
        </div>
      </div>

      {/* ─── Two-Column Layout: Left (Calendar/Filters), Right (Stats/Table) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ── Left Column: Class Select & BS Calendar ── */}
        <div className="lg:col-span-4 space-y-5 no-print">
          {/* Class Select */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-[0_1px_2px_rgba(15,23,42,0.06)] space-y-2">
            <label
              htmlFor="report-class-select"
              className="block text-[13px] font-semibold text-slate-700"
            >
              Class
            </label>
            {classesLoading ? (
              <div className="h-10 bg-slate-100 rounded-lg border border-slate-200 animate-pulse" />
            ) : classes.length === 0 ? (
              <p className="text-[13px] text-slate-500 italic">
                {activeRole === 'teacher'
                  ? 'No class assigned to your teacher account.'
                  : 'No classes configured in the system.'}
              </p>
            ) : (
              <select
                id="report-class-select"
                value={selectedClassId}
                onChange={(e) => {
                  setSelectedClassId(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full h-10 px-3 text-[14px] font-medium bg-white rounded-lg border border-slate-200 text-slate-900 focus-visible:outline-blue-600 cursor-pointer shadow-xs"
              >
                {classes.map((cls) => {
                  const id = cls._id || cls.id
                  const label = `${cls.name}${cls.section ? ` (${cls.section})` : ''}`
                  return (
                    <option key={id} value={id}>
                      {label}
                    </option>
                  )
                })}
              </select>
            )}
          </div>

          {/* Date Range Boxes: From & To */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
              <span className="block text-[12px] text-slate-500 font-medium">
                From
              </span>
              <p className="text-[16px] font-bold text-blue-600 mt-0.5">
                {formatBsDayMonth(fromBs) || 'Select date'}
              </p>
              <span className="text-[12px] text-slate-400 tabular-nums">
                {fromBs ? `${fromBs} BS` : '—'}
              </span>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
              <span className="block text-[12px] text-slate-500 font-medium">
                To
              </span>
              <p className="text-[16px] font-bold text-blue-600 mt-0.5">
                {formatBsDayMonth(toBs) || 'Select date'}
              </p>
              <span className="text-[12px] text-slate-400 tabular-nums">
                {toBs ? `${toBs} BS` : '—'}
              </span>
            </div>
          </div>

          {/* Month Calendar (BS) */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-[0_1px_2px_rgba(15,23,42,0.06)] space-y-3.5">
            {/* Calendar Month Header */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="w-8 h-8 inline-flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer focus-visible:outline-blue-600"
                aria-label="Previous month"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>

              <h2 className="text-[15px] font-semibold text-slate-900">
                {formatBsYearMonth(calendarYear, calendarMonthIndex)}
              </h2>

              <button
                type="button"
                onClick={handleNextMonth}
                className="w-8 h-8 inline-flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer focus-visible:outline-blue-600"
                aria-label="Next month"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>

            {/* Sun to Sat Header */}
            <div className="grid grid-cols-7 text-center text-[12px] font-medium text-slate-500">
              <span>Sun</span>
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span className="text-red-700 font-semibold">Sat</span>
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1 text-center text-[13px]">
              {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
                <div key={`blank-${idx}`} className="h-8" />
              ))}

              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1
                const dayOfWeek = (firstDayOfWeek + i) % 7
                const isSaturday = dayOfWeek === 6
                const dateStr = `${calendarYear}-${String(
                  calendarMonthIndex + 1
                ).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`

                const isToday = dateStr === todayBs
                const isStart = dateStr === fromBs
                const isEnd = dateStr === toBs
                const isSelectedEnd = isStart || isEnd
                const isInRange = fromBs && toBs && dateStr > fromBs && dateStr < toBs
                const holiday = getHolidayByBsDate(dateStr)
                const isHoliday = Boolean(holiday)
                const hasAttendance = recordedDatesSet.has(dateStr)

                let cellStyles = 'relative h-8 sm:h-9 flex flex-col items-center justify-center rounded-lg transition-all select-none tabular-nums '

                if (isSaturday) {
                  cellStyles += 'bg-slate-100 text-slate-400 cursor-not-allowed'
                } else if (isSelectedEnd) {
                  cellStyles += 'bg-blue-600 text-white font-bold shadow-xs cursor-pointer'
                } else if (isInRange) {
                  cellStyles += 'bg-blue-100 text-blue-900 font-semibold cursor-pointer'
                } else {
                  cellStyles += 'text-slate-900 hover:bg-slate-100 cursor-pointer'
                }

                if (isToday) {
                  cellStyles += ' ring-2 ring-blue-600 ring-offset-1'
                }

                return (
                  <button
                    key={dateStr}
                    type="button"
                    disabled={isSaturday}
                    onClick={() => handleDayClick(dateStr, isSaturday)}
                    title={
                      isSaturday
                        ? 'Saturday (Weekly off)'
                        : holiday
                        ? `${dayNum} — ${holiday.name}`
                        : hasAttendance
                        ? `${dayNum} — Attendance recorded`
                        : `${dayNum}`
                    }
                    className={cellStyles}
                  >
                    <span className="leading-none text-[13px]">{dayNum}</span>

                    {/* Indicators */}
                    <div className="flex items-center gap-0.5 mt-0.5 h-1">
                      {isHoliday && (
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isSelectedEnd ? 'bg-white' : 'bg-red-600'
                          }`}
                          aria-label={`Public holiday: ${holiday?.name}`}
                        />
                      )}
                      {hasAttendance && (
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isSelectedEnd ? 'bg-amber-300' : 'bg-[#166534]'
                          }`}
                          aria-label="Attendance recorded"
                        />
                      )}
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Calendar Legend */}
            <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between gap-y-1.5 text-[12px] text-slate-500">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded border-2 border-blue-600 inline-block" />
                <span>Today</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-600 inline-block" />
                <span>Public holiday</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#166534] inline-block" />
                <span>Recorded</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-slate-100 inline-block" />
                <span>Weekly off</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right Column: Report Stats, Tabs, Table ──────────── */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-baseline justify-between no-print">
            <h2 className="text-[20px] font-bold text-slate-900 tracking-tight">
              {formatBsRangeHeading(fromBs, toBs, selectedClassName)}
            </h2>
          </div>

          {/* Error Banner */}
          {reportError && (
            <div className="p-4 rounded-xl bg-[#FBE9E9] border border-red-200 text-[#991B1B] text-[14px] flex items-start gap-3">
              <svg className="w-5 h-5 text-[#991B1B] shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <div className="flex-1">
                <p className="font-semibold text-[#991B1B]">Report Error</p>
                <p className="mt-0.5">{reportError}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchReport}
                  className="mt-2 text-xs"
                >
                  Try again
                </Button>
              </div>
            </div>
          )}

          {/* Loading Skeletons */}
          {loadingReport && (
            <div className="space-y-6 animate-pulse">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-20 bg-white rounded-xl border border-slate-200" />
                ))}
              </div>
              <div className="h-64 bg-white rounded-xl border border-slate-200" />
            </div>
          )}

          {/* Loaded Content */}
          {!loadingReport && reportData && (
            <>
              {/* Four Clean White Stat Cards (No restating captions!) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {/* School days */}
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
                  <span className="block text-[13px] text-slate-500 font-medium">
                    School days
                  </span>
                  <p className="text-[26px] font-bold text-slate-900 mt-1 tabular-nums">
                    {reportData.schoolDays}
                  </p>
                </div>

                {/* Students */}
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
                  <span className="block text-[13px] text-slate-500 font-medium">
                    Students
                  </span>
                  <p className="text-[26px] font-bold text-slate-900 mt-1 tabular-nums">
                    {reportData.studentCount}
                  </p>
                </div>

                {/* Average attendance % */}
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
                  <span className="block text-[13px] text-[#166534] font-medium">
                    Avg attendance
                  </span>
                  <p className="text-[26px] font-bold text-[#166534] mt-1 tabular-nums">
                    {reportData.schoolDays > 0 && reportData.averagePercentage !== null
                      ? `${reportData.averagePercentage}%`
                      : 'No data'}
                  </p>
                </div>

                {/* Below 75% */}
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
                  <span className="block text-[13px] text-slate-500 font-medium">
                    Below 75%
                  </span>
                  <p className={`text-[26px] font-bold mt-1 tabular-nums ${
                    reportData.belowThresholdCount > 0 ? 'text-[#991B1B]' : 'text-slate-900'
                  }`}>
                    {reportData.belowThresholdCount}
                  </p>
                </div>
              </div>

              {/* Empty State when schoolDays === 0 */}
              {reportData.schoolDays === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 p-8 sm:p-12 text-center space-y-3 shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
                  <div className="w-12 h-12 mx-auto rounded-full bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-200">
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                  </div>
                  <h3 className="text-[18px] font-semibold text-slate-900">
                    No attendance recorded in this range
                  </h3>
                  <p className="text-slate-600 text-[14px] max-w-md mx-auto leading-relaxed">
                    There are no saved attendance registers for {selectedClassName} between{' '}
                    <span className="font-semibold text-slate-900">{fromBs}</span> and{' '}
                    <span className="font-semibold text-slate-900">{toBs}</span>. Select a different date range on the calendar or record today's attendance.
                  </p>
                </div>
              ) : (
                /* Tab Controls & Attendance Table */
                <div className="space-y-4">
                  {/* Tabs Header */}
                  <div className="flex items-center justify-between border-b border-slate-200 no-print">
                    <div className="flex items-center gap-6">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('all')
                          setCurrentPage(1)
                        }}
                        className={`pb-2.5 text-[14px] font-medium transition-colors border-b-2 cursor-pointer ${
                          activeTab === 'all'
                            ? 'border-blue-600 text-blue-600 font-semibold'
                            : 'border-transparent text-slate-500 hover:text-slate-900'
                        }`}
                      >
                        All ({allRows.length})
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('below75')
                          setCurrentPage(1)
                        }}
                        className={`pb-2.5 text-[14px] font-medium transition-colors border-b-2 cursor-pointer flex items-center gap-1.5 ${
                          activeTab === 'below75'
                            ? 'border-[#991B1B] text-[#991B1B] font-semibold'
                            : 'border-transparent text-slate-500 hover:text-slate-900'
                        }`}
                      >
                        <span>Below 75% ({reportData.belowThresholdCount})</span>
                        <span className="text-[12px] font-normal text-slate-400">
                          (Threshold: {ATTENDANCE_THRESHOLD}%)
                        </span>
                      </button>
                    </div>

                    <span className="text-[13px] text-slate-500 tabular-nums">
                      Showing {filteredRows.length} {filteredRows.length === 1 ? 'student' : 'students'}
                    </span>
                  </div>

                  {/* Table with Navy Header and Cream Text */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.06)] overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-[14px]">
                        <thead className="sticky top-0 z-10">
                          <tr className="bg-[#1E293B] text-[#FAF8F5] text-[13px] font-semibold">
                            <th scope="col" className="py-3 px-4 w-16 text-center font-medium">
                              Roll
                            </th>
                            <th scope="col" className="py-3 px-4 font-medium">
                              Student
                            </th>
                            <th scope="col" className="py-3 px-4 text-center font-medium">
                              Present
                            </th>
                            <th scope="col" className="py-3 px-4 text-center font-medium">
                              Absent
                            </th>
                            <th scope="col" className="py-3 px-4 text-right font-medium">
                              Attendance %
                            </th>
                          </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-200">
                          {paginatedRows.length === 0 ? (
                            <tr>
                              <td colSpan="5" className="py-8 text-center text-slate-500 text-[14px] italic">
                                {activeTab === 'below75'
                                  ? 'No students below the 75% attendance threshold in this date range.'
                                  : 'No student records available.'}
                              </td>
                            </tr>
                          ) : (
                            paginatedRows.map((student) => {
                              const isLow =
                                student.percentage !== null &&
                                student.percentage < ATTENDANCE_THRESHOLD

                              const initials = (student.name || 'S')
                                .split(' ')
                                .map((n) => n[0])
                                .slice(0, 2)
                                .join('')
                                .toUpperCase()

                              return (
                                <tr
                                  key={student.studentId}
                                  className={`transition-colors hover:bg-slate-50/80 ${
                                    isLow ? 'bg-[#FEF3C7]/20 hover:bg-[#FEF3C7]/30' : ''
                                  }`}
                                >
                                  {/* Roll */}
                                  <td className="py-3 px-4 text-center tabular-nums text-slate-500">
                                    {student.roll ?? '—'}
                                  </td>

                                  {/* Student Name with Avatar Initials */}
                                  <td className="py-3 px-4">
                                    <div className="flex items-center gap-2.5">
                                      <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 border border-blue-200 text-[13px] font-semibold flex items-center justify-center shrink-0">
                                        {initials}
                                      </div>
                                      <span className="font-semibold text-slate-900">
                                        {student.name}
                                      </span>
                                    </div>
                                  </td>

                                  {/* Present */}
                                  <td className="py-3 px-4 text-center tabular-nums font-semibold text-[#166534]">
                                    {student.present}
                                  </td>

                                  {/* Absent */}
                                  <td className="py-3 px-4 text-center tabular-nums">
                                    <span
                                      className={
                                        student.absent > 0
                                          ? 'text-[#991B1B] font-semibold'
                                          : 'text-slate-500'
                                      }
                                    >
                                      {student.absent}
                                    </span>
                                  </td>

                                  {/* Attendance % with Status Badge */}
                                  <td className="py-3 px-4 text-right tabular-nums">
                                    {student.percentage === null ? (
                                      <span className="text-slate-400 text-[13px]">No data</span>
                                    ) : isLow ? (
                                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FEF3C7] text-[#92400E] border border-amber-300 text-[13px] font-semibold">
                                        <span>{student.percentage}%</span>
                                        <span className="text-[11px] font-medium">
                                          · Low
                                        </span>
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#E7F3EC] text-[#166534] border border-green-200 text-[13px] font-semibold">
                                        <span>{student.percentage}%</span>
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              )
                            })
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination Bar */}
                    {totalPages > 1 && (
                      <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[13px] text-slate-600 no-print tabular-nums">
                        <span>
                          Page {currentPage} of {totalPages}
                        </span>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            className="px-3 py-1 rounded-lg border border-slate-200 bg-white text-slate-800 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer text-[13px] font-medium"
                          >
                            Previous
                          </button>
                          <button
                            type="button"
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            className="px-3 py-1 rounded-lg border border-slate-200 bg-white text-slate-800 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer text-[13px] font-medium"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
