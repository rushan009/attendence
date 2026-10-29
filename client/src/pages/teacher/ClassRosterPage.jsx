import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Link } from 'react-router-dom'
import { schoolConfig } from '../../config/schoolConfig.js'
import * as studentService from '../../services/studentService.js'
import Button from '../../components/Button.jsx'

const PAGE_SIZE = 20

/**
 * MY CLASS > Class roster
 * Route: /teacher/roster
 *
 * Clean table with Active/Inactive badges, Edit button and Deactivate link,
 * white modal on dimmed backdrop, one column, labels above inputs.
 */
export default function ClassRosterPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [successToast, setSuccessToast] = useState(null)
  const [assignedClasses, setAssignedClasses] = useState([])
  const [selectedClassId, setSelectedClassId] = useState('')
  const [students, setStudents] = useState([])
  const [noClassMessage, setNoClassMessage] = useState('')

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

  const loadRoster = useCallback(async () => {
    setLoading(true)
    setError(null)
    setNoClassMessage('')

    try {
      const data = await studentService.getMyClassStudents()
      if (data.class || (data.classes && data.classes.length > 0)) {
        const classesList = data.classes && data.classes.length > 0
          ? data.classes
          : [data.class]
        setAssignedClasses(classesList)
        setSelectedClassId((prev) => prev || classesList[0]?.id || classesList[0]?._id || '')
        setStudents(data.students || [])
      } else {
        setAssignedClasses([])
        setSelectedClassId('')
        setStudents([])
        setNoClassMessage(
          data.message || 'No classroom is currently assigned to your teacher account.'
        )
      }
    } catch (err) {
      setError(err.message || 'Failed to load class roster. Please check your connection.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    document.title = `Class Roster — ${schoolConfig.schoolName}`
    loadRoster()
  }, [loadRoster])

  // Clear toast after 4 seconds
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

  // Filter students by selected class and search query
  const filteredStudents = useMemo(() => {
    let list = students

    if (selectedClassId) {
      list = list.filter((s) => {
        const cId = s.class?._id || s.class?.id || s.class
        return String(cId) === String(selectedClassId)
      })
    }

    const q = searchQuery.trim().toLowerCase()
    if (q) {
      list = list.filter((s) => {
        const nameMatch = (s.name || '').toLowerCase().includes(q)
        const rollMatch = String(s.roll || '').includes(q)
        return nameMatch || rollMatch
      })
    }

    return list
  }, [students, selectedClassId, searchQuery])

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
      setModalError('Roll number must be a valid positive number.')
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
        if (!selectedClassId) {
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
          classId: selectedClassId,
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

  const selectedClassObj = assignedClasses.find(
    (c) => String(c.id || c._id) === String(selectedClassId)
  )
  const classDisplayName = selectedClassObj
    ? `${selectedClassObj.name}${selectedClassObj.section ? ` — Section ${selectedClassObj.section}` : ''}`
    : 'Assigned Classroom'

  const activeCount = filteredStudents.filter((s) => s.status !== 'inactive').length
  const inactiveCount = filteredStudents.length - activeCount

  return (
    <div className="space-y-6 max-w-5xl animate-in fade-in duration-150">
      {/* ── Page Header Row ───────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold text-slate-900 tracking-tight">
            Class roster
          </h1>
          <p className="text-slate-600 text-[15px] mt-0.5">
            Students enrolled in the classes assigned to you
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link to="/teacher/import-students">
            <Button type="button" variant="secondary" size="md">
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="-ml-0.5 mr-1.5">
                <path d="M2.5 10.5V13.5H13.5V10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M8 2.5V10.5M8 10.5L5 7.5M8 10.5L11 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Import from Excel
            </Button>
          </Link>

          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={handleOpenAddModal}
            disabled={!selectedClassId}
          >
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="-ml-0.5 mr-1.5">
              <path d="M8 3.5V12.5M3.5 8H12.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Add student
          </Button>
        </div>
      </div>

      <div className="h-px bg-slate-200" aria-hidden="true" />

      {/* ── Toast Banner ─────────────────────────────────── */}
      {successToast && (
        <div
          role="status"
          className="p-4 rounded-xl text-[14px] bg-[#E7F3EC] border border-green-200 text-[#166534] flex items-center justify-between gap-3 animate-in fade-in duration-150"
        >
          <div className="flex items-center gap-2.5">
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">{successToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessToast(null)}
            className="text-slate-400 hover:text-slate-700 cursor-pointer font-bold px-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* ── Error Banner ─────────────────────────────────── */}
      {error && (
        <div
          role="alert"
          className="p-4 rounded-xl text-[14px] bg-[#FBE9E9] border border-red-200 text-[#991B1B] flex items-center justify-between gap-3"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={loadRoster}
            className="text-[13px] font-semibold underline hover:text-red-900 cursor-pointer shrink-0"
          >
            Try again
          </button>
        </div>
      )}

      {/* ── Loading State ─────────────────────────────────── */}
      {loading ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-16 bg-white rounded-xl border border-slate-200" />
          <div className="h-64 bg-white rounded-xl border border-slate-200" />
        </div>
      ) : assignedClasses.length === 0 ? (
        /* ── No Assigned Class Friendly State ──────────────── */
        <div className="py-16 px-4 bg-white rounded-xl border border-slate-200 text-center max-w-md mx-auto shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
          <div
            className="w-12 h-12 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 mb-4 mx-auto"
            aria-hidden="true"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <h2 className="text-[18px] text-slate-900 font-semibold">
            No classroom assigned yet
          </h2>
          <p className="text-[14px] text-slate-600 mt-1.5 leading-relaxed">
            {noClassMessage ||
              'Your faculty account does not have a classroom assigned. Please contact the school administrator to assign you as a class teacher.'}
          </p>
        </div>
      ) : (
        /* ── Toolbar & Table Content ───────────────────────── */
        <div className="space-y-4">
          {/* Toolbar: Class Dropdown + Search Box */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              {/* Class Dropdown */}
              <div className="flex items-center gap-2">
                <label htmlFor="roster-class-select" className="text-[13px] font-semibold text-slate-700 shrink-0">
                  Class:
                </label>
                <div className="relative min-w-[190px]">
                  <select
                    id="roster-class-select"
                    value={selectedClassId}
                    onChange={(e) => setSelectedClassId(e.target.value)}
                    className="w-full h-10 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-900 text-[14px] font-medium focus:outline-blue-600 cursor-pointer shadow-xs appearance-none pr-8"
                  >
                    {assignedClasses.map((cls) => {
                      const id = cls.id || cls._id
                      const label = `${cls.name}${cls.section ? ` — Sec ${cls.section}` : ''}`
                      return (
                        <option key={id} value={id}>
                          {label}
                        </option>
                      )
                    })}
                  </select>
                  <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                      <path d="M3.5 5.25L7 8.75L10.5 5.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Counts metadata chip */}
              <div className="text-[13px] text-slate-500 tabular-nums flex items-center gap-2">
                <span className="text-slate-900 font-semibold">{filteredStudents.length} student{filteredStudents.length === 1 ? '' : 's'}</span>
                <span>•</span>
                <span className="text-[#166534] font-semibold">{activeCount} active</span>
                {inactiveCount > 0 && (
                  <>
                    <span>•</span>
                    <span className="text-[#991B1B] font-semibold">{inactiveCount} inactive</span>
                  </>
                )}
              </div>
            </div>

            {/* Search Box */}
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search name or roll..."
                className="w-full h-10 pl-9 pr-3 rounded-lg bg-white border border-slate-200 text-slate-900 text-[14px] focus:outline-blue-600 placeholder:text-slate-400"
              />
              <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M7 12C9.76142 12 12 9.76142 12 7C12 4.23858 9.76142 2 7 2C4.23858 2 2 4.23858 2 7C2 9.76142 4.23858 12 7 12Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-xs cursor-pointer"
                  aria-label="Clear search"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* ── Table Container ─────────────────────────────── */}
          {filteredStudents.length === 0 ? (
            <div className="py-14 px-4 text-center rounded-xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
              <p className="text-[16px] text-slate-900 font-semibold">
                {searchQuery ? 'No matching students found' : 'No students in this class'}
              </p>
              <p className="text-[14px] text-slate-500 mt-1 max-w-sm mx-auto">
                {searchQuery
                  ? `No student in ${classDisplayName} matches "${searchQuery}".`
                  : `Add your first student or import from Excel spreadsheet.`}
              </p>
              <div className="mt-4 flex items-center justify-center gap-2">
                {searchQuery ? (
                  <Button variant="secondary" size="sm" onClick={() => setSearchQuery('')}>
                    Clear search
                  </Button>
                ) : (
                  <Button variant="primary" size="sm" onClick={handleOpenAddModal}>
                    Add student
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
              <table className="w-full text-left text-[14px]">
                <thead>
                  <tr className="bg-[#1E293B] text-[#FAF8F5] text-[13px] font-semibold">
                    <th className="py-3 px-4 w-16 text-center font-medium">Roll</th>
                    <th className="py-3 px-4 font-medium">Name</th>
                    <th className="py-3 px-4 font-medium">Parent</th>
                    <th className="py-3 px-4 font-medium">Parent Phone</th>
                    <th className="py-3 px-4 font-medium text-center w-28">Status</th>
                    <th className="py-3 px-4 font-medium text-right w-44">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {paginatedStudents.map((student) => {
                    const studentId = student._id || student.id
                    const isActive = student.status !== 'inactive'
                    const isToggling = statusLoadingId === studentId
                    const initials = (student.name || 'S')
                      .split(' ')
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase()

                    return (
                      <tr
                        key={studentId}
                        className={`transition-colors ${
                          isActive
                            ? 'hover:bg-slate-50/80 bg-white'
                            : 'bg-slate-50/50 text-slate-500 hover:bg-slate-50'
                        }`}
                      >
                        {/* Roll */}
                        <td className="py-3.5 px-4 text-center tabular-nums font-semibold text-slate-600">
                          {student.roll}
                        </td>

                        {/* Name with Avatar Initials */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 border border-blue-200 text-[12px] font-semibold flex items-center justify-center shrink-0">
                              {initials}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900 text-[14px]">
                                {student.name}
                              </p>
                              {student.gender && (
                                <p className="text-[12px] text-slate-400 capitalize">
                                  {student.gender}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Parent */}
                        <td className="py-3.5 px-4 text-slate-700">
                          {student.guardianName || <span className="text-slate-400 italic">—</span>}
                        </td>

                        {/* Parent Phone */}
                        <td className="py-3.5 px-4 tabular-nums text-slate-600">
                          {student.guardianPhone || <span className="text-slate-400 italic">—</span>}
                        </td>

                        {/* Status Badge */}
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[12px] font-medium border ${
                              isActive
                                ? 'bg-[#E7F3EC] text-[#166534] border-green-200'
                                : 'bg-[#FBE9E9] text-[#991B1B] border-red-200'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-[#166534]' : 'bg-[#991B1B]'}`} />
                            {isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-3">
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(student)}
                              className="px-2.5 py-1 text-[13px] font-medium rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-800 transition-colors cursor-pointer"
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() => handleToggleStatus(student)}
                              disabled={isToggling}
                              className={`text-[13px] font-medium underline underline-offset-2 transition-colors cursor-pointer ${
                                isToggling
                                  ? 'opacity-40 cursor-not-allowed'
                                  : isActive
                                  ? 'text-[#991B1B] hover:text-red-900'
                                  : 'text-[#166534] hover:text-green-900'
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
          )}

          {/* ── Pagination Controls ─────────────────────────── */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-[13px] text-slate-500 tabular-nums pt-2">
              <div>
                Showing {(currentPage - 1) * PAGE_SIZE + 1} to{' '}
                {Math.min(currentPage * PAGE_SIZE, totalStudents)} of {totalStudents} students
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>

                <span className="px-2 py-1 text-[13px] font-medium text-slate-900">
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

      {/* ── Add / Edit Student Modal: White modal on dimmed backdrop, one column ── */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
          aria-labelledby="student-modal-title"
          onClick={handleCloseModal}
        >
          <div
            className="w-full max-w-md rounded-xl bg-white border border-slate-200 p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 id="student-modal-title" className="text-[18px] font-bold text-slate-900">
                  {editingStudent ? 'Edit student' : 'Add new student'}
                </h3>
                <p className="text-[13px] text-slate-500 mt-0.5">
                  {classDisplayName}
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                disabled={isSaving}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center text-lg leading-none cursor-pointer"
                aria-label="Close dialog"
              >
                ✕
              </button>
            </div>

            {/* Modal Inline Error */}
            {modalError && (
              <div
                role="alert"
                className="p-3.5 rounded-lg text-[13px] bg-[#FBE9E9] border border-red-200 text-[#991B1B]"
              >
                {modalError}
              </div>
            )}

            {/* One-column form with labels above inputs */}
            <form onSubmit={handleModalSubmit} className="space-y-4 text-[14px]">
              {/* Name */}
              <div className="space-y-1.5">
                <label htmlFor="student-name-input" className="block text-slate-700 text-[13px] font-semibold">
                  Full Name <span className="text-[#991B1B]">*</span>
                </label>
                <input
                  id="student-name-input"
                  ref={firstInputRef}
                  type="text"
                  required
                  value={modalFormData.name}
                  onChange={(e) => setModalFormData({ ...modalFormData, name: e.target.value })}
                  placeholder="e.g. Aarav Sharma"
                  className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-[14px] text-slate-900 focus:outline-blue-600"
                  disabled={isSaving}
                />
              </div>

              {/* Roll Number */}
              <div className="space-y-1.5">
                <label htmlFor="student-roll-input" className="block text-slate-700 text-[13px] font-semibold">
                  Roll Number <span className="text-[#991B1B]">*</span>
                </label>
                <input
                  id="student-roll-input"
                  type="number"
                  min="1"
                  required
                  value={modalFormData.roll}
                  onChange={(e) => setModalFormData({ ...modalFormData, roll: e.target.value })}
                  placeholder="e.g. 1"
                  className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-[14px] text-slate-900 tabular-nums focus:outline-blue-600"
                  disabled={isSaving}
                />
              </div>

              {/* Gender */}
              <div className="space-y-1.5">
                <label htmlFor="student-gender-select" className="block text-slate-700 text-[13px] font-semibold">
                  Gender
                </label>
                <select
                  id="student-gender-select"
                  value={modalFormData.gender}
                  onChange={(e) => setModalFormData({ ...modalFormData, gender: e.target.value })}
                  className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-[14px] text-slate-900 focus:outline-blue-600 cursor-pointer shadow-xs"
                  disabled={isSaving}
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Parent Name */}
              <div className="space-y-1.5">
                <label htmlFor="student-parent-input" className="block text-slate-700 text-[13px] font-semibold">
                  Parent / Guardian Name
                </label>
                <input
                  id="student-parent-input"
                  type="text"
                  value={modalFormData.guardianName}
                  onChange={(e) => setModalFormData({ ...modalFormData, guardianName: e.target.value })}
                  placeholder="e.g. Ram Sharma"
                  className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-[14px] text-slate-900 focus:outline-blue-600"
                  disabled={isSaving}
                />
              </div>

              {/* Parent Phone */}
              <div className="space-y-1.5">
                <label htmlFor="student-phone-input" className="block text-slate-700 text-[13px] font-semibold">
                  Parent Phone Number
                </label>
                <input
                  id="student-phone-input"
                  type="tel"
                  maxLength="10"
                  value={modalFormData.guardianPhone}
                  onChange={(e) => setModalFormData({ ...modalFormData, guardianPhone: e.target.value })}
                  placeholder="10-digit number (e.g. 9841234567)"
                  className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-[14px] text-slate-900 tabular-nums focus:outline-blue-600"
                  disabled={isSaving}
                />
                <p className="text-[12px] text-slate-500">Optional. 10-digit mobile number.</p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
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
