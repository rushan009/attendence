import { useState, useEffect, useCallback, useMemo } from 'react'
import { schoolConfig } from '../../config/schoolConfig.js'
import * as adminService from '../../services/adminService.js'
import * as attendanceService from '../../services/attendanceService.js'
import * as studentService from '../../services/studentService.js'
import { formatBsDate, toDevanagariDigits } from '../../utils/nepaliDate.js'
import Button from '../../components/Button.jsx'
import ClassReportsPage from '../teacher/ClassReportsPage.jsx'

/**
 * Admin: Attendance Reports & Record Editor
 * Route: /admin/reports
 *
 * Requirements:
 * - Admin picks a class and a date range
 * - Views attendance registers sorted by date descending
 * - Opens a record to edit its absentees (the only place editing exists in the system)
 * - Recalculates present/absent on server
 * - Shows "Edited by X at <time>" when editedBy is set
 * - Loading, empty, and error states everywhere
 */
export default function AttendanceReportsPage() {
  const [classes, setClasses] = useState([])
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [tableLoading, setTableLoading] = useState(false)
  const [error, setError] = useState(null)
  const [feedback, setFeedback] = useState(null)
  const [todayBs, setTodayBs] = useState('')
  const [viewMode, setViewMode] = useState('report') // 'report' | 'registers'

  // Filter criteria
  const [selectedClassId, setSelectedClassId] = useState('')
  const [fromBs, setFromBs] = useState('')
  const [toBs, setToBs] = useState('')

  // Edit Modal State
  const [editModal, setEditModal] = useState({
    isOpen: false,
    record: null,
    students: [],
    absenteeIds: new Set(),
    loadingStudents: false,
    saving: false,
    error: null,
  })

  // View Absentees Detail Modal State
  const [viewRecord, setViewRecord] = useState(null)

  // ─── Initial Load ───────────────────────────────────────────────────

  const loadClassesAndRecords = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const [classRes, attendanceRes] = await Promise.all([
        adminService.getClasses(),
        attendanceService.getAttendanceRecords(),
      ])

      setClasses(classRes.classes || [])
      setRecords(attendanceRes.records || [])
      if (attendanceRes.dateBs) {
        setTodayBs(attendanceRes.dateBs)
      }
    } catch (err) {
      setError(err.message || 'Unable to load attendance records.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    document.title = `Attendance Reports — ${schoolConfig.schoolName}`
    loadClassesAndRecords()
  }, [loadClassesAndRecords])

  // ─── Filter Handler ─────────────────────────────────────────────────

  const handleApplyFilter = async (e) => {
    e?.preventDefault()
    try {
      setTableLoading(true)
      setError(null)
      const params = {}
      if (selectedClassId) params.classId = selectedClassId
      if (fromBs.trim()) params.from = fromBs.trim()
      if (toBs.trim()) params.to = toBs.trim()

      const data = await attendanceService.getAttendanceRecords(params)
      setRecords(data.records || [])
    } catch (err) {
      setError(err.message || 'Failed to filter records.')
    } finally {
      setTableLoading(false)
    }
  }

  const handleResetFilter = async () => {
    setSelectedClassId('')
    setFromBs('')
    setToBs('')
    try {
      setTableLoading(true)
      const data = await attendanceService.getAttendanceRecords()
      setRecords(data.records || [])
    } catch (err) {
      setError(err.message || 'Failed to reload records.')
    } finally {
      setTableLoading(false)
    }
  }

  const handleTodayPreset = () => {
    if (!todayBs) return
    setFromBs(todayBs)
    setToBs(todayBs)
    handleApplyFilter()
  }

  // ─── Open Edit Modal ────────────────────────────────────────────────

  const handleOpenEdit = async (record) => {
    const classId = record.class?._id || record.class?.id || record.class
    const currentAbsentees = new Set(
      (record.absentees || []).map((s) => (typeof s === 'object' ? s._id || s.id : String(s)))
    )

    setEditModal({
      isOpen: true,
      record,
      students: [],
      absenteeIds: currentAbsentees,
      loadingStudents: true,
      saving: false,
      error: null,
    })

    try {
      // Fetch active students enrolled in this class
      const res = await studentService.getStudentsByClass(classId)
      const activeOnly = (res.students || []).filter(
        (s) => !s.status || s.status === 'active'
      )
      setEditModal((prev) => ({
        ...prev,
        students: activeOnly,
        loadingStudents: false,
      }))
    } catch (err) {
      setEditModal((prev) => ({
        ...prev,
        loadingStudents: false,
        error: err.message || 'Unable to load class students for editing.',
      }))
    }
  }

  const handleToggleEditAbsentee = (studentId) => {
    setEditModal((prev) => {
      const next = new Set(prev.absenteeIds)
      if (next.has(studentId)) {
        next.delete(studentId)
      } else {
        next.add(studentId)
      }
      return { ...prev, absenteeIds: next }
    })
  }

  const handleSaveEdit = async () => {
    const { record, absenteeIds } = editModal
    if (!record) return

    try {
      setEditModal((prev) => ({ ...prev, saving: true, error: null }))
      const recordId = record._id || record.id
      const res = await attendanceService.updateAttendance(
        recordId,
        Array.from(absenteeIds)
      )

      // Update record in local state
      setRecords((prev) =>
        prev.map((r) =>
          (r._id || r.id) === recordId ? res.attendance : r
        )
      )

      setFeedback({
        type: 'success',
        message: `Attendance for ${record.class?.name || 'class'} updated successfully.`,
      })

      setEditModal({
        isOpen: false,
        record: null,
        students: [],
        absenteeIds: new Set(),
        loadingStudents: false,
        saving: false,
        error: null,
      })
    } catch (err) {
      setEditModal((prev) => ({
        ...prev,
        saving: false,
        error: err.message || 'Failed to update attendance record.',
      }))
    }
  }

  // Auto-clear feedback
  useEffect(() => {
    if (!feedback) return
    const timer = setTimeout(() => setFeedback(null), 5000)
    return () => clearTimeout(timer)
  }, [feedback])

  // ─── Summary Metrics ────────────────────────────────────────────────

  const metrics = useMemo(() => {
    const totalSessions = records.length
    if (totalSessions === 0) {
      return { totalSessions: 0, totalPresent: 0, totalAbsent: 0, avgRate: 0 }
    }
    const totalPresent = records.reduce((acc, r) => acc + (r.present || 0), 0)
    const totalAbsent = records.reduce((acc, r) => acc + (r.absent || 0), 0)
    const totalHeadcount = totalPresent + totalAbsent
    const avgRate =
      totalHeadcount > 0 ? Math.round((totalPresent / totalHeadcount) * 100) : 0

    return { totalSessions, totalPresent, totalAbsent, avgRate }
  }, [records])

  return (
    <div className="max-w-[1360px] mx-auto space-y-6 sm:space-y-7 animate-in fade-in duration-150 pb-16">
      {/* ── View Switcher Navigation ──────────────────────── */}
      <div className="flex items-center gap-6 border-b border-slate-200 pb-1 no-print">
        <button
          type="button"
          onClick={() => setViewMode('report')}
          className={`pb-2.5 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
            viewMode === 'report'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Class attendance report
        </button>
        <button
          type="button"
          onClick={() => setViewMode('registers')}
          className={`pb-2.5 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
            viewMode === 'registers'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Daily registers & absentee editor
        </button>
      </div>

      {viewMode === 'report' ? (
        <ClassReportsPage roleOverride="admin" />
      ) : (
        <>
          {/* ── Page Header ─────────────────────────────────── */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <p className="text-[13px] text-slate-500 font-medium mb-1">
                Reports
              </p>
              <h1 className="text-[28px] font-bold text-slate-900 tracking-tight leading-tight">
                School attendance registers
              </h1>
              <p className="text-slate-600 text-sm mt-1 max-w-2xl leading-relaxed">
                School-wide daily classroom attendance registers, teacher submission records, and administrative correction portal.
              </p>
            </div>

            {todayBs && (
              <div className="shrink-0 p-3 rounded-lg bg-white border border-slate-200 text-right shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
                <span className="text-xs text-slate-500 block">Today's date</span>
                <span className="text-sm font-semibold text-slate-900 tabular-nums">{todayBs} BS</span>
              </div>
            )}
          </div>

          {/* ── Feedback Banner ─────────────────────────────── */}
          {feedback && (
            <div
              className={`p-3.5 rounded-lg text-sm flex items-center justify-between border ${
                feedback.type === 'success'
                  ? 'bg-[#E7F3EC] border-[#166534]/20 text-[#166534]'
                  : 'bg-[#FBE9E9] border-[#991B1B]/20 text-[#991B1B]'
              }`}
            >
              <span>{feedback.message}</span>
              <button
                onClick={() => setFeedback(null)}
                className="font-bold text-sm px-1 cursor-pointer"
              >
                ×
              </button>
            </div>
          )}

          {/* ── Error Banner ────────────────────────────────── */}
          {error && (
            <div className="p-4 rounded-lg bg-[#FBE9E9] border border-[#991B1B]/20 text-[#991B1B] text-sm flex items-center justify-between">
              <span>{error}</span>
              <Button variant="secondary" size="sm" onClick={loadClassesAndRecords}>
                Retry
              </Button>
            </div>
          )}

          {/* ── Class & Date Filter Bar ─────────────────────── */}
          <div className="p-4 sm:p-5 rounded-lg bg-white border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.06)] space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
              <span className="text-xs font-semibold text-slate-700">
                Filter registers
              </span>
              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={handleTodayPreset}
                  className="text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
                >
                  Today only
                </button>
                <span className="text-slate-300">•</span>
                <button
                  type="button"
                  onClick={handleResetFilter}
                  className="text-slate-500 hover:text-slate-800 font-medium cursor-pointer"
                >
                  All records
                </button>
              </div>
            </div>

            <form onSubmit={handleApplyFilter} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end text-sm">
              {/* Class Picker */}
              <div>
                <label htmlFor="filter-class" className="block text-xs font-semibold text-slate-700 mb-1">
                  Select class
                </label>
                <select
                  id="filter-class"
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="w-full min-h-[40px] px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus-visible:outline-2 focus-visible:outline-blue-600 focus-visible:outline-offset-2 transition-all cursor-pointer"
                >
                  <option value="">All classes and sections</option>
                  {classes.map((cls) => (
                    <option key={cls.id || cls._id} value={cls.id || cls._id}>
                      {cls.name} {cls.section ? `(Section ${cls.section})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* From BS Date */}
              <div>
                <label htmlFor="admin-filter-from" className="block text-xs font-semibold text-slate-700 mb-1">
                  From BS date
                </label>
                <input
                  id="admin-filter-from"
                  type="text"
                  placeholder="e.g. 2083-07-01"
                  value={fromBs}
                  onChange={(e) => setFromBs(e.target.value)}
                  className="w-full min-h-[40px] px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 tabular-nums focus-visible:outline-2 focus-visible:outline-blue-600 focus-visible:outline-offset-2 transition-all"
                />
              </div>

              {/* To BS Date */}
              <div>
                <label htmlFor="admin-filter-to" className="block text-xs font-semibold text-slate-700 mb-1">
                  To BS date
                </label>
                <input
                  id="admin-filter-to"
                  type="text"
                  placeholder="e.g. 2083-07-30"
                  value={toBs}
                  onChange={(e) => setToBs(e.target.value)}
                  className="w-full min-h-[40px] px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 tabular-nums focus-visible:outline-2 focus-visible:outline-blue-600 focus-visible:outline-offset-2 transition-all"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Button type="submit" variant="primary" size="md" loading={tableLoading} className="flex-1">
                  Filter records
                </Button>
                {(selectedClassId || fromBs || toBs) && (
                  <Button type="button" variant="secondary" size="md" onClick={handleResetFilter}>
                    Clear
                  </Button>
                )}
              </div>
            </form>
          </div>

          {/* ── Overview Metrics ────────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-5 rounded-lg bg-white border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.06)] space-y-1">
              <span className="text-xs text-slate-500 font-medium">
                Total registers
              </span>
              <p className="text-2xl sm:text-3xl font-bold text-slate-900 tabular-nums">
                {metrics.totalSessions}
              </p>
            </div>

            <div className="p-5 rounded-lg bg-white border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.06)] space-y-1">
              <span className="text-xs text-slate-500 font-medium">
                Overall presence rate
              </span>
              <p className="text-2xl sm:text-3xl font-bold text-blue-600 tabular-nums">
                {metrics.avgRate}%
              </p>
            </div>

            <div className="p-5 rounded-lg bg-white border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.06)] space-y-1">
              <span className="text-xs text-slate-500 font-medium">
                Total present markings
              </span>
              <p className="text-2xl sm:text-3xl font-bold text-[#166534] tabular-nums">
                {metrics.totalPresent}
              </p>
            </div>

            <div className="p-5 rounded-lg bg-white border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.06)] space-y-1">
              <span className="text-xs text-slate-500 font-medium">
                Total absent markings
              </span>
              <p className="text-2xl sm:text-3xl font-bold text-[#991B1B] tabular-nums">
                {metrics.totalAbsent}
              </p>
            </div>
          </div>

          {/* ── Records Table Section ───────────────────────── */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">
                Classroom attendance registers ({records.length})
              </h2>
              <span className="text-xs text-slate-500">
                Only administrators can edit attendance records
              </span>
            </div>

            {loading || tableLoading ? (
              <div className="p-8 rounded-lg bg-white border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.06)] space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-12 bg-slate-100 rounded animate-pulse" />
                ))}
              </div>
            ) : records.length === 0 ? (
              <div className="p-12 text-center rounded-lg bg-white border border-slate-200 space-y-2 shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
                <p className="text-base text-slate-900 font-semibold">
                  No attendance records found
                </p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                  No attendance registers match the selected classroom or date range criteria.
                </p>
              </div>
            ) : (
              <div className="border border-slate-200 rounded-lg bg-white overflow-hidden shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-[#1E293B] text-[#FAF8F5] sticky top-0">
                        <th className="py-3 px-4 font-semibold">Date (BS & AD)</th>
                        <th className="py-3 px-4 font-semibold">Classroom</th>
                        <th className="py-3 px-4 font-semibold">Submitted by</th>
                        <th className="py-3 px-4 font-semibold text-center">Present</th>
                        <th className="py-3 px-4 font-semibold text-center">Absent</th>
                        <th className="py-3 px-4 font-semibold text-center">Rate</th>
                        <th className="py-3 px-4 font-semibold">Audit status</th>
                        <th className="py-3 px-4 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {records.map((record) => {
                        const totalHead = (record.present || 0) + (record.absent || 0)
                        const percent =
                          totalHead > 0
                            ? Math.round(((record.present || 0) / totalHead) * 100)
                            : 0
                        const bsInfo = formatBsDate(record.dateBs)
                        const adFormatted = record.dateAd
                          ? new Date(record.dateAd).toLocaleDateString('en-US', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })
                          : '—'

                        return (
                          <tr key={record._id || record.id} className="hover:bg-slate-50 transition-colors">
                            {/* Date */}
                            <td className="py-3.5 px-4">
                              <div className="font-semibold text-slate-900 text-sm">
                                {bsInfo.formatted || record.dateBs}
                              </div>
                              <div className="text-xs text-slate-500 mt-0.5 tabular-nums">
                                {record.dateBs} BS • {adFormatted}
                              </div>
                            </td>

                            {/* Classroom */}
                            <td className="py-3.5 px-4 font-semibold text-slate-900">
                              {record.class?.name || 'Class'}
                              {record.class?.section ? ` (${record.class.section})` : ''}
                            </td>

                            {/* Teacher */}
                            <td className="py-3.5 px-4 text-slate-600">
                              <span className="font-medium text-slate-900">
                                {record.teacher?.name || 'Class Teacher'}
                              </span>
                            </td>

                            {/* Present */}
                            <td className="py-3.5 px-4 text-center tabular-nums">
                              <span className="font-semibold text-[#166534] text-sm">
                                {record.present}
                              </span>
                            </td>

                            {/* Absent */}
                            <td className="py-3.5 px-4 text-center tabular-nums">
                              <span
                                className={`font-semibold text-sm ${
                                  record.absent > 0 ? 'text-[#991B1B]' : 'text-slate-500'
                                }`}
                              >
                                {record.absent}
                              </span>
                            </td>

                            {/* Rate */}
                            <td className="py-3.5 px-4 text-center tabular-nums">
                              <span className="font-semibold text-slate-900">{percent}%</span>
                            </td>

                            {/* Audit Status */}
                            <td className="py-3.5 px-4">
                              {record.editedBy ? (
                                <div className="text-xs text-[#92400E]">
                                  <p className="font-semibold flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#92400E]" />
                                    Edited by {record.editedBy.name}
                                  </p>
                                  <p className="text-[13px] text-slate-500 mt-0.5 tabular-nums">
                                    at {new Date(record.editedAt).toLocaleString([], {
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </p>
                                </div>
                              ) : (
                                <span className="text-xs text-slate-400">
                                  Original submission
                                </span>
                              )}
                            </td>

                            {/* Actions */}
                            <td className="py-3.5 px-4 text-right">
                              <div className="inline-flex items-center gap-2">
                                {record.absent > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => setViewRecord(record)}
                                    className="text-xs font-semibold text-slate-600 hover:text-slate-900 hover:underline cursor-pointer"
                                  >
                                    View ({record.absent})
                                  </button>
                                )}
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => handleOpenEdit(record)}
                                >
                                  Edit absentees
                                </Button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* ── Admin Edit Absentees Modal (The ONLY place editing exists) ─ */}
          {editModal.isOpen && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150"
              role="dialog"
              aria-modal="true"
              aria-labelledby="edit-attendance-title"
            >
              <div className="w-full max-w-xl rounded-xl bg-white border border-slate-200 p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
                {/* Modal Header */}
                <div className="flex items-start justify-between border-b border-slate-200 pb-3">
                  <div>
                    <span className="text-xs font-semibold text-blue-600">
                      Administrative correction
                    </span>
                    <h3 id="edit-attendance-title" className="text-lg font-bold text-slate-900">
                      Edit absentees: {editModal.record?.class?.name}
                      {editModal.record?.class?.section ? ` (${editModal.record.class.section})` : ''}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
                      Date: {editModal.record?.dateBs} BS ({formatBsDate(editModal.record?.dateBs).formatted})
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditModal((prev) => ({ ...prev, isOpen: false }))}
                    className="w-7 h-7 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center text-lg leading-none cursor-pointer"
                    aria-label="Close modal"
                  >
                    ×
                  </button>
                </div>

                {/* Audit Notice */}
                <div className="p-3.5 rounded-lg bg-[#FEF3C7] border border-[#92400E]/20 text-xs text-[#92400E] space-y-1">
                  <p className="font-semibold">
                    Administrative audit log active
                  </p>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    Saving changes here will replace the absentee roster, recalculate present and absent counts, and record your admin profile under "Edited by". The original teacher will remain preserved as the recording faculty.
                  </p>
                </div>

                {/* Error in modal */}
                {editModal.error && (
                  <div className="p-3 rounded-lg bg-[#FBE9E9] border border-[#991B1B]/20 text-[#991B1B] text-xs">
                    {editModal.error}
                  </div>
                )}

                {/* Live Count Bar during editing */}
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs tabular-nums">
                  <span>Total: <strong>{editModal.students.length}</strong></span>
                  <span className="text-[#166534]">
                    Present: <strong>{Math.max(0, editModal.students.length - editModal.absenteeIds.size)}</strong>
                  </span>
                  <span className="text-[#991B1B]">
                    Absent: <strong>{editModal.absenteeIds.size}</strong>
                  </span>
                </div>

                {/* Student Toggle List */}
                <div className="flex-1 overflow-y-auto divide-y divide-slate-200 border border-slate-200 rounded-lg bg-white pr-1">
                  {editModal.loadingStudents ? (
                    <div className="py-12 text-center text-xs text-slate-500">
                      Loading active student roster...
                    </div>
                  ) : editModal.students.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-500">
                      No active students found in this class.
                    </div>
                  ) : (
                    editModal.students.map((student) => {
                      const studentId = student._id || student.id
                      const isAbsent = editModal.absenteeIds.has(studentId)

                      return (
                        <div
                          key={studentId}
                          className={`p-3 flex items-center justify-between transition-colors ${
                            isAbsent ? 'bg-[#FBE9E9]/40' : 'hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span
                              className={`w-7 h-7 rounded flex items-center justify-center font-semibold text-xs tabular-nums border ${
                                isAbsent
                                  ? 'bg-[#FBE9E9] border-[#991B1B]/30 text-[#991B1B]'
                                  : 'bg-[#E7F3EC] border-[#166534]/30 text-[#166534]'
                              }`}
                            >
                              #{student.roll}
                            </span>
                            <div>
                              <p className="text-xs font-semibold text-slate-900">
                                {student.name}
                              </p>
                              <p className="text-[13px] text-slate-500">
                                Roll {toDevanagariDigits(student.roll)}
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleToggleEditAbsentee(studentId)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer border transition-colors ${
                              isAbsent
                                ? 'bg-[#991B1B] text-white border-[#991B1B] hover:bg-red-800'
                                : 'bg-[#E7F3EC] text-[#166534] border-[#166534]/30 hover:bg-[#166534] hover:text-white'
                            }`}
                          >
                            {isAbsent ? 'Absent (अनुपस्थित)' : 'Present (उपस्थित)'}
                          </button>
                        </div>
                      )
                    })
                  )}
                </div>

                {/* Modal Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setEditModal((prev) => ({ ...prev, absenteeIds: new Set() }))}
                    className="text-xs text-slate-600 hover:text-slate-900 font-medium cursor-pointer"
                  >
                    Mark all present
                  </button>

                  <div className="flex items-center gap-2.5">
                    <Button
                      variant="secondary"
                      size="md"
                      onClick={() => setEditModal((prev) => ({ ...prev, isOpen: false }))}
                      disabled={editModal.saving}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      size="md"
                      onClick={handleSaveEdit}
                      loading={editModal.saving}
                      disabled={editModal.loadingStudents}
                    >
                      Save corrections
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── View Absentees Details Modal ────────────────── */}
          {viewRecord && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150"
              role="dialog"
              aria-modal="true"
            >
              <div className="w-full max-w-md rounded-xl bg-white border border-slate-200 p-6 shadow-xl space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      Absentees list
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
                      Class: {viewRecord.class?.name} • {viewRecord.dateBs} BS
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setViewRecord(null)}
                    className="w-7 h-7 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center text-lg leading-none cursor-pointer"
                  >
                    ×
                  </button>
                </div>

                <div className="divide-y divide-slate-200 border border-slate-200 rounded-lg max-h-60 overflow-y-auto">
                  {viewRecord.absentees && viewRecord.absentees.length > 0 ? (
                    viewRecord.absentees.map((s) => (
                      <div key={s._id || s.id} className="p-3 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-semibold px-2 py-0.5 rounded bg-[#FBE9E9] text-[#991B1B] tabular-nums">
                            Roll #{s.roll}
                          </span>
                          <span className="font-semibold text-slate-900">{s.name}</span>
                        </div>
                        <span className="text-xs font-semibold text-[#991B1B]">
                          Absent
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-xs text-slate-500">
                      No absentees recorded.
                    </div>
                  )}
                </div>

                <div className="flex justify-end">
                  <Button variant="secondary" size="md" onClick={() => setViewRecord(null)}>
                    Close
                  </Button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
