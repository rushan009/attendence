import { useCallback, useEffect, useState } from 'react'
import * as adminService from '../../services/adminService.js'
import { schoolConfig } from '../../config/schoolConfig.js'
import Button from '../../components/Button.jsx'

const STANDARD_GRADES = [
  'Class 1',
  'Class 2',
  'Class 3',
  'Class 4',
  'Class 5',
  'Class 6',
  'Class 7',
  'Class 8',
  'Class 9',
  'Class 10',
]

/**
 * School > Classes
 * Route: /admin/classes
 *
 * Clean, lightweight row-based overview of school grades, sections,
 * student counts, assigned class teachers, and edit options.
 */
export default function ClassesPage() {
  const [classes, setClasses] = useState([])
  const [teachers, setTeachers] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [feedback, setFeedback] = useState(null)

  // Class form modal (Add / Edit)
  const [modal, setModal] = useState({
    isOpen: false,
    mode: 'add', // 'add' | 'edit'
    classData: null,
  })

  // Delete confirmation modal
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  // ─── Data Loading ───────────────────────────────────────────────────

  const loadClassesAndTeachers = useCallback(async () => {
    setLoading(true)
    try {
      const [classRes, teacherRes] = await Promise.all([
        adminService.getClasses(),
        adminService.getTeachers('approved'),
      ])
      setClasses(classRes.classes || [])
      setTeachers(teacherRes.teachers || [])
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Unable to load school classes.',
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    document.title = `Classes and sections — ${schoolConfig.schoolName}`
    loadClassesAndTeachers()
  }, [loadClassesAndTeachers])

  useEffect(() => {
    if (!feedback) return
    const timer = setTimeout(() => setFeedback(null), 5000)
    return () => clearTimeout(timer)
  }, [feedback])

  // ─── Actions ────────────────────────────────────────────────────────

  const handleOpenAdd = () => {
    setModal({
      isOpen: true,
      mode: 'add',
      classData: { name: '', section: 'A', teacherId: '' },
    })
  }

  const handleOpenEdit = (classRecord) => {
    setModal({
      isOpen: true,
      mode: 'edit',
      classData: {
        id: classRecord.id,
        name: classRecord.name,
        section: classRecord.section || '',
        teacherId: classRecord.teacher?.id || '',
      },
    })
  }

  const handleSaveClass = async (formData) => {
    setActionLoading(true)
    setFeedback(null)
    try {
      if (modal.mode === 'add') {
        await adminService.createClass(formData)
        setFeedback({
          type: 'success',
          message: `Class "${formData.name}${formData.section ? ` - ${formData.section}` : ''}" added successfully.`,
        })
      } else {
        await adminService.updateClass(modal.classData.id, formData)
        setFeedback({
          type: 'success',
          message: `Class "${formData.name}${formData.section ? ` - ${formData.section}` : ''}" updated successfully.`,
        })
      }
      setModal({ isOpen: false, mode: 'add', classData: null })
      await loadClassesAndTeachers()
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to save class details.',
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeleteClass = async (classId) => {
    setActionLoading(true)
    setFeedback(null)
    try {
      await adminService.deleteClass(classId)
      setFeedback({
        type: 'success',
        message: 'Class deleted successfully.',
      })
      setDeleteConfirm(null)
      await loadClassesAndTeachers()
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to delete class.',
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleInitializeStandardGrades = async () => {
    if (!window.confirm('Create standard Classes 1 to 10 (Section A)? Existing classes will not be duplicated.')) {
      return
    }
    setActionLoading(true)
    setFeedback(null)
    try {
      let createdCount = 0
      for (const gradeName of STANDARD_GRADES) {
        const alreadyExists = classes.some((c) => c.name === gradeName && (c.section === 'A' || !c.section))
        if (!alreadyExists) {
          try {
            await adminService.createClass({ name: gradeName, section: 'A' })
            createdCount++
          } catch {
            // continue
          }
        }
      }
      setFeedback({
        type: 'success',
        message: `${createdCount} standard classes initialized.`,
      })
      await loadClassesAndTeachers()
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Error initializing standard grades.',
      })
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-150 max-w-5xl pb-16">
      {/* ── Page Header ─────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <p className="text-[13px] text-slate-500 font-medium mb-1">
            School
          </p>
          <h1 className="text-[28px] font-bold text-slate-900 tracking-tight leading-tight">
            Classes and sections
          </h1>
          <p className="text-slate-600 text-sm mt-1 max-w-2xl leading-relaxed">
            School grade levels, section identifiers, enrolled student numbers, and assigned class teachers.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="md"
            variant="primary"
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>Add class</span>
          </Button>
        </div>
      </div>

      {/* ── Feedback Alert ─────────────────────────────────── */}
      {feedback && (
        <div
          role="alert"
          className={`p-3.5 rounded-lg text-sm flex items-center justify-between border ${
            feedback.type === 'success'
              ? 'bg-[#E7F3EC] border-[#166534]/20 text-[#166534]'
              : 'bg-[#FBE9E9] border-[#991B1B]/20 text-[#991B1B]'
          }`}
        >
          <span>{feedback.message}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-slate-500 hover:text-slate-800 ml-2 p-0.5 text-xs cursor-pointer"
            aria-label="Dismiss message"
          >
            ✕
          </button>
        </div>
      )}

      {/* ── Classes Rows List ─────────────────────────────── */}
      {loading ? (
        <div className="p-8 rounded-lg bg-white border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.06)] space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-slate-100 rounded animate-pulse" />
          ))}
        </div>
      ) : classes.length === 0 ? (
        /* Empty State */
        <div className="py-16 px-4 flex flex-col items-center justify-center text-center max-w-md mx-auto bg-white rounded-lg border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
          <h2 className="text-base font-semibold text-slate-900">
            No classes or sections configured yet
          </h2>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed max-w-sm">
            Set up grades and sections for {schoolConfig.schoolName} to assign teachers and track attendance.
          </p>

          <div className="mt-5 flex flex-col sm:flex-row gap-2.5 w-full sm:w-auto">
            <Button size="md" variant="primary" onClick={handleOpenAdd}>
              Add class
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={handleInitializeStandardGrades}
              loading={actionLoading}
            >
              Set up Classes 1–10
            </Button>
          </div>
        </div>
      ) : (
        /* Clean Row-Form Table */
        <div className="space-y-3.5">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-medium">{classes.length} registered class{classes.length === 1 ? '' : 'es'}</span>
            {classes.length < 10 && (
              <button
                type="button"
                onClick={handleInitializeStandardGrades}
                disabled={actionLoading}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 underline cursor-pointer"
              >
                + Add remaining standard classes (1–10)
              </button>
            )}
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-[#1E293B] text-[#FAF8F5] sticky top-0 text-xs">
                  <th className="py-3 px-4 font-semibold">Class</th>
                  <th className="py-3 px-4 font-semibold">Section</th>
                  <th className="py-3 px-4 font-semibold">Students</th>
                  <th className="py-3 px-4 font-semibold">Teacher</th>
                  <th className="py-3 px-4 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {classes.map((classRecord) => (
                  <tr
                    key={classRecord.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    {/* Class */}
                    <td className="py-3.5 px-4 font-semibold text-slate-900 text-sm">
                      {classRecord.name}
                    </td>

                    {/* Section */}
                    <td className="py-3.5 px-4">
                      {classRecord.section ? (
                        <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                          Section {classRecord.section}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 italic">—</span>
                      )}
                    </td>

                    {/* Number of Students in class */}
                    <td className="py-3.5 px-4 text-xs text-slate-900 tabular-nums">
                      <span className="font-semibold">{classRecord.studentCount || 0}</span>{' '}
                      <span className="text-slate-500">students</span>
                    </td>

                    {/* Teacher */}
                    <td className="py-3.5 px-4 text-xs">
                      {classRecord.teacher?.name ? (
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-slate-900">{classRecord.teacher.name}</span>
                          <span className="text-slate-500 tabular-nums">
                            (+977 {classRecord.teacher.phone})
                          </span>
                        </div>
                      ) : (
                        <span className="italic text-slate-400">
                          Unassigned
                        </span>
                      )}
                    </td>

                    {/* Edit Option */}
                    <td className="py-3.5 px-4 text-right">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleOpenEdit(classRecord)}
                      >
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Add / Edit Class Modal ─────────────────────────── */}
      {modal.isOpen && (
        <ClassFormModal
          isOpen={modal.isOpen}
          mode={modal.mode}
          initialData={modal.classData}
          teachers={teachers}
          loading={actionLoading}
          onClose={() => setModal({ isOpen: false, mode: 'add', classData: null })}
          onSubmit={handleSaveClass}
          onDelete={(target) => setDeleteConfirm(target)}
        />
      )}

      {/* ── Delete Confirmation Dialog ─────────────────────── */}
      {deleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white border border-slate-200 rounded-xl p-6 max-w-sm w-full space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900">
              Confirm deletion
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Are you sure you want to remove <strong className="text-slate-900 font-semibold">{deleteConfirm.name}</strong>?
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
              <Button
                variant="secondary"
                size="md"
                onClick={() => setDeleteConfirm(null)}
                disabled={actionLoading}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="md"
                onClick={() => handleDeleteClass(deleteConfirm.id)}
                loading={actionLoading}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Class Form Modal Component ──────────────────────────────────────

function ClassFormModal({
  isOpen,
  mode,
  initialData,
  teachers,
  loading,
  onClose,
  onSubmit,
  onDelete,
}) {
  const [name, setName] = useState(initialData?.name || '')
  const [section, setSection] = useState(initialData?.section || 'A')
  const [teacherId, setTeacherId] = useState(initialData?.teacherId || '')
  const [error, setError] = useState('')

  if (!isOpen) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Class name is required.')
      return
    }
    setError('')
    onSubmit({
      name: name.trim(),
      section: section.trim(),
      teacherId: teacherId || null,
    })
  }

  const handleDelete = () => {
    if (onDelete && initialData?.id) {
      onClose()
      onDelete({
        id: initialData.id,
        name: `${initialData.name}${initialData.section ? ` - Section ${initialData.section}` : ''}`,
      })
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="class-modal-title"
    >
      <div className="bg-white border border-slate-200 rounded-xl p-6 max-w-md w-full space-y-4 shadow-xl animate-in fade-in duration-100">
        <div>
          <h3 id="class-modal-title" className="text-xl font-bold text-slate-900">
            {mode === 'add' ? 'Add class or section' : 'Edit class details'}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Specify the grade name, section, and assigned class teacher.
          </p>
        </div>

        {error && (
          <p className="text-xs text-[#991B1B] p-3 rounded-lg bg-[#FBE9E9] border border-[#991B1B]/20">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          <div>
            <label htmlFor="modal-class-name" className="block text-xs font-semibold text-slate-700 mb-1">
              Class / Grade name *
            </label>
            <input
              id="modal-class-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Class 1, Class 8, Grade 10"
              list="grade-suggestions"
              className="w-full min-h-[40px] px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 focus-visible:outline-2 focus-visible:outline-blue-600 focus-visible:outline-offset-2 transition-all"
            />
            <datalist id="grade-suggestions">
              {STANDARD_GRADES.map((g) => (
                <option key={g} value={g} />
              ))}
              <option value="Nursery" />
              <option value="LKG" />
              <option value="UKG" />
            </datalist>
          </div>

          <div>
            <label htmlFor="modal-class-section" className="block text-xs font-semibold text-slate-700 mb-1">
              Section identifier
            </label>
            <input
              id="modal-class-section"
              type="text"
              value={section}
              onChange={(e) => setSection(e.target.value.toUpperCase())}
              placeholder="e.g. A, B, C (optional)"
              maxLength={4}
              className="w-full min-h-[40px] px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 focus-visible:outline-2 focus-visible:outline-blue-600 focus-visible:outline-offset-2 transition-all"
            />
          </div>

          <div>
            <label htmlFor="modal-class-teacher" className="block text-xs font-semibold text-slate-700 mb-1">
              Assigned class teacher
            </label>
            <select
              id="modal-class-teacher"
              value={teacherId}
              onChange={(e) => setTeacherId(e.target.value)}
              className="w-full min-h-[40px] px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 focus-visible:outline-2 focus-visible:outline-blue-600 focus-visible:outline-offset-2 transition-all"
            >
              <option value="">No teacher assigned yet</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} (+977 {t.phone})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-200">
            <div>
              {mode === 'edit' && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="text-xs font-medium text-[#991B1B] hover:underline cursor-pointer"
                >
                  Delete class
                </button>
              )}
            </div>
            <div className="flex items-center gap-2.5">
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                loading={loading}
              >
                {mode === 'add' ? 'Add class' : 'Save changes'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
