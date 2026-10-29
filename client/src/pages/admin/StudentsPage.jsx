import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Link } from 'react-router-dom'
import * as adminService from '../../services/adminService.js'
import * as studentService from '../../services/studentService.js'
import { schoolConfig } from '../../config/schoolConfig.js'
import Button from '../../components/Button.jsx'

const PAGE_SIZE = 20

/**
 * People > Students
 * Route: /admin/students
 *
 * Admin view for inspecting student rosters by classroom and section,
 * adding new admissions, editing student records, toggling enrollment status,
 * and filtering records.
 */
export default function StudentsPage() {
  const [classes, setClasses] = useState([])
  const [loadingClasses, setLoadingClasses] = useState(true)
  const [selectedClassId, setSelectedClassId] = useState('')

  const [loadingStudents, setLoadingStudents] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)
  const [loadedClassInfo, setLoadedClassInfo] = useState(null)
  const [students, setStudents] = useState([])
  const [error, setError] = useState(null)
  const [successToast, setSuccessToast] = useState(null)

  // Search & Pagination
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  // Add / Edit Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingStudent, setEditingStudent] = useState(null)
  const [modalFormData, setModalFormData] = useState({
    name: '',
    roll: '',
    gender: '',
    guardianName: '',
    guardianPhone: '',
  })
  const [modalError, setModalError] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [statusLoadingId, setStatusLoadingId] = useState(null)

  const firstInputRef = useRef(null)

  useEffect(() => {
    document.title = `Students — ${schoolConfig.schoolName}`
  }, [])

  // Clear toast after 4s
  useEffect(() => {
    if (!successToast) return
    const timer = setTimeout(() => setSuccessToast(null), 4000)
    return () => clearTimeout(timer)
  }, [successToast])

  // Reset page when search or class changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, selectedClassId])

  // Focus trap / escape key listener for modal
  useEffect(() => {
    if (!isModalOpen) return

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleCloseModal()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    const timer = setTimeout(() => {
      firstInputRef.current?.focus()
    }, 50)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      clearTimeout(timer)
    }
  }, [isModalOpen])

  // Load classes for the dropdown on mount
  useEffect(() => {
    let isMounted = true

    async function fetchClasses() {
      try {
        setLoadingClasses(true)
        const res = await adminService.getClasses()
        if (isMounted) {
          const list = res.classes || []
          setClasses(list)
          if (list.length > 0 && !selectedClassId) {
            setSelectedClassId(list[0].id || list[0]._id)
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Unable to load school classes.')
        }
      } finally {
        if (isMounted) {
          setLoadingClasses(false)
        }
      }
    }

    fetchClasses()

    return () => {
      isMounted = false
    }
  }, [])

  const handleLoadStudents = useCallback(async () => {
    if (!selectedClassId) return

    setLoadingStudents(true)
    setError(null)

    try {
      const data = await studentService.getStudentsByClass(selectedClassId)
      setStudents(data.students || [])
      setLoadedClassInfo(data.class || null)
      setHasLoaded(true)
    } catch (err) {
      setError(err.message || 'Failed to load students for the selected class.')
    } finally {
      setLoadingStudents(false)
    }
  }, [selectedClassId])

  // Filter students by search query
  const filteredStudents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return students

    return students.filter((s) => {
      const nameMatch = (s.name || '').toLowerCase().includes(q)
      const rollMatch = String(s.roll || '').includes(q)
      return nameMatch || rollMatch
    })
  }, [students, searchQuery])

  // Pagination calculation
  const totalStudents = filteredStudents.length
  const totalPages = Math.max(1, Math.ceil(totalStudents / PAGE_SIZE))
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return filteredStudents.slice(start, start + PAGE_SIZE)
  }, [filteredStudents, currentPage])

  // Modal Open Handlers
  const handleOpenAddModal = () => {
    setEditingStudent(null)
    setModalFormData({
      name: '',
      roll: '',
      gender: '',
      guardianName: '',
      guardianPhone: '',
    })
    setModalError(null)
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (student) => {
    setEditingStudent(student)
    setModalFormData({
      name: student.name || '',
      roll: student.roll ?? '',
      gender: student.gender || '',
      guardianName: student.guardianName || '',
      guardianPhone: student.guardianPhone || '',
    })
    setModalError(null)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    if (isSaving) return
    setIsModalOpen(false)
    setEditingStudent(null)
    setModalError(null)
  }

  // Modal Submit (Add or Edit)
  const handleModalSubmit = async (e) => {
    e.preventDefault()
    setModalError(null)

    const name = modalFormData.name.trim()
    const roll = Number(modalFormData.roll)
    const phone = modalFormData.guardianPhone.trim()

    if (!name) {
      setModalError('Student name is required.')
      return
    }

    if (!modalFormData.roll || isNaN(roll) || roll <= 0) {
      setModalError('Roll number must be a valid positive integer.')
      return
    }

    if (phone && !/^\d{10}$/.test(phone)) {
      setModalError('Parent phone number must be exactly 10 digits.')
      return
    }

    setIsSaving(true)

    try {
      if (editingStudent) {
        // Edit student
        const studentId = editingStudent._id || editingStudent.id
        const res = await studentService.updateStudent(studentId, {
          name,
          roll,
          gender: modalFormData.gender,
          guardianName: modalFormData.guardianName.trim(),
          guardianPhone: phone,
        })

        const updatedStudent = res.student || res
        setStudents((prev) =>
          prev.map((s) => ((s._id || s.id) === studentId ? { ...s, ...updatedStudent } : s))
        )
        setSuccessToast(`Student "${name}" updated successfully.`)
      } else {
        // Add student
        const targetClassId = selectedClassId || loadedClassInfo?.id
        if (!targetClassId) {
          setModalError('Please select a class before adding a student.')
          setIsSaving(false)
          return
        }

        const newStudent = await studentService.createStudent({
          name,
          roll,
          gender: modalFormData.gender,
          guardianName: modalFormData.guardianName.trim(),
          guardianPhone: phone,
          classId: targetClassId,
        })

        setStudents((prev) => {
          const updated = [...prev, newStudent]
          return updated.sort((a, b) => (Number(a.roll) || 0) - (Number(b.roll) || 0))
        })
        setSuccessToast(`Student "${name}" (Roll #${roll}) added successfully.`)
      }

      setIsModalOpen(false)
    } catch (err) {
      setModalError(err.message || 'Operation failed. Please verify the information.')
    } finally {
      setIsSaving(false)
    }
  }

  // Toggle Active / Inactive Status
  const handleToggleStatus = async (student) => {
    const studentId = student._id || student.id
    const currentStatus = student.status || 'active'
    const newStatus = currentStatus === 'inactive' ? 'active' : 'inactive'

    setStatusLoadingId(studentId)
    try {
      const res = await studentService.setStudentStatus(studentId, newStatus)
      const updated = res.student || { ...student, status: newStatus }

      setStudents((prev) =>
        prev.map((s) => ((s._id || s.id) === studentId ? { ...s, status: updated.status } : s))
      )
      setSuccessToast(
        `Student "${student.name}" marked as ${newStatus === 'active' ? 'Active' : 'Inactive'}.`
      )
    } catch (err) {
      setError(err.message || `Failed to update status for ${student.name}.`)
    } finally {
      setStatusLoadingId(null)
    }
  }

  const activeCount = students.filter((s) => s.status !== 'inactive').length
  const inactiveCount = students.length - activeCount

  const loadedClassDisplayName = loadedClassInfo
    ? `${loadedClassInfo.name}${loadedClassInfo.section ? ` — Section ${loadedClassInfo.section}` : ''}`
    : null

  // Helpers for initials circle
  const getInitials = (name) => {
    if (!name) return '?'
    const parts = name.trim().split(/\s+/)
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-150 max-w-5xl pb-16">
      {/* ── Page Header ─────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <p className="text-[13px] text-slate-500 font-medium mb-1">
            People
          </p>
          <h1 className="text-[28px] font-bold text-slate-900 tracking-tight leading-tight">
            Students roster
          </h1>
          <p className="text-slate-600 text-sm mt-1 max-w-2xl leading-relaxed">
            School-wide student directory, roll numbers, guardian contact numbers, and enrollment records organized by classroom.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            to="/admin/import-students"
            className="text-xs text-blue-600 hover:text-blue-700 font-semibold underline underline-offset-2 transition-colors"
          >
            Import spreadsheet →
          </Link>
          {hasLoaded && (
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={handleOpenAddModal}
            >
              + Add student
            </Button>
          )}
        </div>
      </div>

      {/* ── Toast Banner ─────────────────────────────────── */}
      {successToast && (
        <div
          role="status"
          className="p-3.5 rounded-lg text-sm bg-[#E7F3EC] border border-[#166534]/20 text-[#166534] flex items-center justify-between gap-3 animate-in fade-in duration-150"
        >
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 shrink-0 text-[#166534]" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>{successToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessToast(null)}
            className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* ── Class Selector & Load Bar ─────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 sm:p-5 shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
        <div className="flex flex-col sm:flex-row sm:items-end gap-3.5">
          <div className="flex-1">
            <label
              htmlFor="admin-class-select"
              className="block text-xs font-semibold text-slate-700 mb-1.5"
            >
              Classroom and section
            </label>

            {loadingClasses ? (
              <div className="w-full min-h-[40px] px-3.5 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-500 text-xs flex items-center">
                Loading available classes...
              </div>
            ) : classes.length === 0 ? (
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600">
                No classes configured yet.{' '}
                <Link to="/admin/classes" className="text-blue-600 underline font-semibold">
                  Create classes
                </Link>
              </div>
            ) : (
              <div className="relative">
                <select
                  id="admin-class-select"
                  value={selectedClassId}
                  onChange={(e) => {
                    setSelectedClassId(e.target.value)
                  }}
                  className="w-full min-h-[40px] px-3.5 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 text-sm focus-visible:outline-2 focus-visible:outline-blue-600 focus-visible:outline-offset-2 cursor-pointer appearance-none pr-9"
                >
                  <option value="">Select a classroom...</option>
                  {classes.map((cls) => {
                    const id = cls.id || cls._id
                    const label = `${cls.name}${cls.section ? ` — Section ${cls.section}` : ''}`
                    return (
                      <option key={id} value={id}>
                        {label}
                      </option>
                    )
                  })}
                </select>
                <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                    <path
                      d="M3.5 5.25L7 8.75L10.5 5.25"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>
            )}
          </div>

          <div className="shrink-0">
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={handleLoadStudents}
              disabled={!selectedClassId || loadingStudents}
              loading={loadingStudents}
            >
              Load students
            </Button>
          </div>
        </div>
      </div>

      {/* ── Error Banner ──────────────────────────────────── */}
      {error && (
        <div
          role="alert"
          className="p-3.5 sm:p-4 rounded-lg text-sm bg-[#FBE9E9] border border-[#991B1B]/20 text-[#991B1B] flex items-center justify-between gap-3"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-xs font-semibold underline hover:text-slate-900 cursor-pointer shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ── Content View States ───────────────────────────── */}
      {loadingStudents ? (
        <div className="p-8 rounded-lg bg-white border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.06)] space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-10 bg-slate-100 rounded animate-pulse" />
          ))}
        </div>
      ) : !hasLoaded ? (
        /* ── Initial Idle State ────────────────────────────── */
        <div className="py-16 px-4 flex flex-col items-center justify-center text-center max-w-md mx-auto bg-white rounded-lg border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
          <h2 className="text-base font-semibold text-slate-900">
            Select a classroom to view students
          </h2>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed max-w-sm">
            Choose a grade and section from the dropdown above and click "Load students" to view the enrolled student directory.
          </p>
        </div>
      ) : students.length === 0 ? (
        /* ── Empty Class Roster ────────────────────────────── */
        <div className="py-16 px-4 flex flex-col items-center justify-center text-center max-w-md mx-auto bg-white rounded-lg border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
          <h2 className="text-base font-semibold text-slate-900">
            No students found in {loadedClassDisplayName || 'this class'}
          </h2>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed max-w-sm">
            There are currently no registered student records in this classroom. You can import students via spreadsheet or register new admissions.
          </p>

          <div className="mt-5 flex items-center gap-3">
            <Button variant="primary" size="md" onClick={handleOpenAddModal}>
              Add student
            </Button>
            <Link
              to="/admin/import-students"
              className="inline-flex items-center px-4 py-2 min-h-[40px] text-xs font-semibold rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Import spreadsheet →
            </Link>
          </div>
        </div>
      ) : (
        /* ── Populated Student Table ───────────────────────── */
        <div className="space-y-3.5">
          {/* Metadata bar & Search */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-3 sm:p-4 rounded-lg border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <span className="font-semibold text-slate-900">
                {loadedClassDisplayName}: {filteredStudents.length} student{filteredStudents.length === 1 ? '' : 's'}
              </span>
              <span className="text-slate-300" aria-hidden="true">•</span>
              <span className="text-[#166534] font-medium">{activeCount} active</span>
              {inactiveCount > 0 && (
                <>
                  <span className="text-slate-300" aria-hidden="true">•</span>
                  <span className="text-slate-500">{inactiveCount} inactive</span>
                </>
              )}
            </div>

            {/* Search Box */}
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search name or roll..."
                className="w-full min-h-[38px] pl-8 pr-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-900 text-xs focus-visible:outline-2 focus-visible:outline-blue-600 focus-visible:outline-offset-2 placeholder:text-slate-400"
              />
              <div className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M7 12C9.76142 12 12 9.76142 12 7C12 4.23858 9.76142 2 7 2C4.23858 2 2 4.23858 2 7C2 9.76142 4.23858 12 7 12Z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-xs cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-[#1E293B] text-[#FAF8F5] sticky top-0 text-xs">
                  <th className="py-3 px-4 font-semibold w-16">Roll</th>
                  <th className="py-3 px-4 font-semibold">Student</th>
                  <th className="py-3 px-4 font-semibold">Parent</th>
                  <th className="py-3 px-4 font-semibold">Parent phone</th>
                  <th className="py-3 px-4 font-semibold text-center w-28">Status</th>
                  <th className="py-3 px-4 font-semibold text-right w-44">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {paginatedStudents.map((student) => {
                  const studentId = student._id || student.id
                  const isActive = student.status !== 'inactive'
                  const isToggling = statusLoadingId === studentId

                  return (
                    <tr
                      key={studentId}
                      className={`transition-colors ${
                        isActive
                          ? 'hover:bg-slate-50'
                          : 'bg-slate-50/50 text-slate-500 opacity-75 hover:opacity-100'
                      }`}
                    >
                      {/* Roll */}
                      <td className="py-3.5 px-4 text-xs font-semibold text-slate-900 tabular-nums">
                        {student.roll}
                      </td>

                      {/* Name + Avatar */}
                      <td className="py-3.5 px-4 font-medium text-slate-900 text-sm">
                        <div className="flex items-center gap-2.5">
                          <span
                            className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 font-semibold text-xs flex items-center justify-center shrink-0"
                            aria-hidden="true"
                          >
                            {getInitials(student.name)}
                          </span>
                          <div>
                            <span className="font-semibold text-slate-900 block leading-tight">
                              {student.name}
                            </span>
                            {student.gender && (
                              <span className="text-[13px] text-slate-500 capitalize">
                                {student.gender}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Parent Name */}
                      <td className="py-3.5 px-4 text-xs text-slate-700">
                        {student.guardianName ? (
                          <span>{student.guardianName}</span>
                        ) : (
                          <span className="text-slate-400 italic">—</span>
                        )}
                      </td>

                      {/* Parent Phone */}
                      <td className="py-3.5 px-4 text-xs text-slate-600 tabular-nums">
                        {student.guardianPhone ? (
                          <span>{student.guardianPhone}</span>
                        ) : (
                          <span className="text-slate-400 italic">—</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            isActive
                              ? 'bg-[#E7F3EC] text-[#166534]'
                              : 'bg-[#FBE9E9] text-[#991B1B]'
                          }`}
                        >
                          {isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2.5">
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => handleOpenEditModal(student)}
                          >
                            Edit
                          </Button>

                          <button
                            type="button"
                            onClick={() => handleToggleStatus(student)}
                            disabled={isToggling}
                            className={`text-xs font-semibold underline underline-offset-2 transition-colors cursor-pointer ${
                              isToggling
                                ? 'opacity-40 cursor-not-allowed'
                                : isActive
                                ? 'text-[#991B1B] hover:text-red-800'
                                : 'text-blue-600 hover:text-blue-700'
                            }`}
                          >
                            {isToggling ? 'Updating...' : isActive ? 'Deactivate' : 'Activate'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* ── Pagination Controls ─────────────────────────── */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 pt-2">
              <div className="tabular-nums">
                Showing {(currentPage - 1) * PAGE_SIZE + 1} to{' '}
                {Math.min(currentPage * PAGE_SIZE, totalStudents)} of {totalStudents} students
              </div>

              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>

                <span className="px-2.5 py-1 text-xs font-semibold text-slate-900 tabular-nums">
                  Page {currentPage} of {totalPages}
                </span>

                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Add / Edit Student Modal ───────────────────────── */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
          aria-labelledby="admin-student-modal-title"
          onClick={handleCloseModal}
        >
          <div
            className="w-full max-w-md rounded-xl bg-white border border-slate-200 p-6 shadow-xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 id="admin-student-modal-title" className="text-xl font-bold text-slate-900">
                  {editingStudent ? 'Edit student' : 'Add new student'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {loadedClassDisplayName || 'Classroom'}
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                disabled={isSaving}
                className="w-7 h-7 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center text-lg leading-none cursor-pointer"
                aria-label="Close dialog"
              >
                ✕
              </button>
            </div>

            {/* Modal Inline Error */}
            {modalError && (
              <div
                role="alert"
                className="p-3 rounded-lg text-xs bg-[#FBE9E9] border border-[#991B1B]/20 text-[#991B1B]"
              >
                {modalError}
              </div>
            )}

            <form onSubmit={handleModalSubmit} className="space-y-4 text-sm">
              {/* Name (Required) */}
              <div>
                <label htmlFor="admin-modal-name" className="block text-xs font-semibold text-slate-700 mb-1">
                  Full name <span className="text-[#991B1B]">*</span>
                </label>
                <input
                  id="admin-modal-name"
                  ref={firstInputRef}
                  type="text"
                  required
                  value={modalFormData.name}
                  onChange={(e) => setModalFormData({ ...modalFormData, name: e.target.value })}
                  placeholder="e.g. Aarav Sharma"
                  className="w-full min-h-[40px] px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus-visible:outline-2 focus-visible:outline-blue-600 focus-visible:outline-offset-2 transition-all"
                  disabled={isSaving}
                />
              </div>

              {/* Roll & Gender Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="admin-modal-roll" className="block text-xs font-semibold text-slate-700 mb-1">
                    Roll number <span className="text-[#991B1B]">*</span>
                  </label>
                  <input
                    id="admin-modal-roll"
                    type="number"
                    min="1"
                    required
                    value={modalFormData.roll}
                    onChange={(e) => setModalFormData({ ...modalFormData, roll: e.target.value })}
                    placeholder="e.g. 1"
                    className="w-full min-h-[40px] px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 tabular-nums focus-visible:outline-2 focus-visible:outline-blue-600 focus-visible:outline-offset-2 transition-all"
                    disabled={isSaving}
                  />
                </div>

                <div>
                  <label htmlFor="admin-modal-gender" className="block text-xs font-semibold text-slate-700 mb-1">
                    Gender
                  </label>
                  <select
                    id="admin-modal-gender"
                    value={modalFormData.gender}
                    onChange={(e) => setModalFormData({ ...modalFormData, gender: e.target.value })}
                    className="w-full min-h-[40px] px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus-visible:outline-2 focus-visible:outline-blue-600 focus-visible:outline-offset-2 transition-all cursor-pointer"
                    disabled={isSaving}
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              {/* Parent Name */}
              <div>
                <label htmlFor="admin-modal-parent-name" className="block text-xs font-semibold text-slate-700 mb-1">
                  Parent or guardian name
                </label>
                <input
                  id="admin-modal-parent-name"
                  type="text"
                  value={modalFormData.guardianName}
                  onChange={(e) => setModalFormData({ ...modalFormData, guardianName: e.target.value })}
                  placeholder="e.g. Ram Sharma"
                  className="w-full min-h-[40px] px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus-visible:outline-2 focus-visible:outline-blue-600 focus-visible:outline-offset-2 transition-all"
                  disabled={isSaving}
                />
              </div>

              {/* Parent Phone */}
              <div>
                <label htmlFor="admin-modal-phone" className="block text-xs font-semibold text-slate-700 mb-1">
                  Parent phone number
                </label>
                <input
                  id="admin-modal-phone"
                  type="tel"
                  maxLength="10"
                  value={modalFormData.guardianPhone}
                  onChange={(e) => setModalFormData({ ...modalFormData, guardianPhone: e.target.value })}
                  placeholder="10-digit number (e.g. 9841234567)"
                  className="w-full min-h-[40px] px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 tabular-nums focus-visible:outline-2 focus-visible:outline-blue-600 focus-visible:outline-offset-2 transition-all"
                  disabled={isSaving}
                />
                <p className="text-xs text-slate-500 mt-1">Optional. Must be 10 digits if provided.</p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={handleCloseModal}
                  disabled={isSaving}
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  loading={isSaving}
                  disabled={isSaving}
                >
                  {editingStudent ? 'Save changes' : 'Add student'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
