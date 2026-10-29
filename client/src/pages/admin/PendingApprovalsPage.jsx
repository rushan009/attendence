import { useCallback, useEffect, useState } from 'react'
import * as adminService from '../../services/adminService.js'
import { schoolConfig } from '../../config/schoolConfig.js'
import Button from '../../components/Button.jsx'

/**
 * People > Pending Approvals
 * Route: /admin/pending-approvals
 *
 * Displays all unapproved teacher registrations awaiting review.
 */
export default function PendingApprovalsPage() {
  const [teachers, setTeachers] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionKey, setActionKey] = useState(null)
  const [feedback, setFeedback] = useState(null)

  const loadPendingTeachers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await adminService.getTeachers('pending')
      setTeachers(res.teachers || [])
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Unable to load pending teacher registrations.',
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    document.title = `Pending Approvals — ${schoolConfig.schoolName}`
    loadPendingTeachers()
  }, [loadPendingTeachers])

  const handleStatusChange = async (teacherId, teacherName, status) => {
    setActionKey(`${teacherId}-${status}`)
    setFeedback(null)
    try {
      await adminService.updateTeacherStatus(teacherId, status)
      setFeedback({
        type: 'success',
        message: `Teacher "${teacherName}" has been ${status === 'approved' ? 'approved' : 'rejected'}.`,
      })
      await loadPendingTeachers()
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || `Unable to ${status} teacher.`,
      })
    } finally {
      setActionKey(null)
    }
  }

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
            Pending approvals
          </h1>
          <p className="text-slate-600 text-sm mt-1 max-w-2xl leading-relaxed">
            Review new teacher registrations, verify staff credentials, and authorize classroom attendance privileges.
          </p>
        </div>

        <div className="shrink-0 text-xs text-slate-500 font-medium tabular-nums">
          {teachers.length} pending request{teachers.length === 1 ? '' : 's'}
        </div>
      </div>

      {/* ── Feedback Notification ─────────────────────────── */}
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

      {/* ── Pending Teachers List ─────────────────────────── */}
      {loading ? (
        <div className="p-8 rounded-lg bg-white border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.06)] space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-slate-100 rounded animate-pulse" />
          ))}
        </div>
      ) : teachers.length === 0 ? (
        /* Empty State */
        <div className="py-16 px-4 flex flex-col items-center justify-center text-center max-w-md mx-auto bg-white rounded-lg border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
          <h2 className="text-base font-semibold text-slate-900">
            No pending teacher registrations
          </h2>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed max-w-sm">
            All teacher accounts are up to date. When a teacher registers on the sign-up page, their unapproved account will appear here for verification.
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.06)] divide-y divide-slate-200">
          {teachers.map((teacher) => {
            const isApproving = actionKey === `${teacher.id}-approved`
            const isRejecting = actionKey === `${teacher.id}-rejected`

            return (
              <div
                key={teacher.id}
                className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:bg-slate-50 transition-colors"
              >
                <div className="min-w-0 flex items-start gap-3">
                  <span
                    className="w-10 h-10 rounded-full bg-slate-100 text-slate-700 font-semibold text-sm flex items-center justify-center shrink-0 mt-0.5"
                    aria-hidden="true"
                  >
                    {getInitials(teacher.name)}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-900 text-base">
                        {teacher.name}
                      </h3>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#FEF3C7] text-[#92400E]">
                        Pending review
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mt-1">
                      <span className="tabular-nums">+977 {teacher.phone}</span>
                      <span className="text-slate-300" aria-hidden="true">•</span>
                      <span>
                        Registered: {teacher.createdAt ? new Date(teacher.createdAt).toLocaleDateString() : 'Recently'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
                  <Button
                    size="md"
                    variant="primary"
                    loading={isApproving}
                    disabled={isRejecting}
                    onClick={() => handleStatusChange(teacher.id, teacher.name, 'approved')}
                    className="flex items-center gap-1.5"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>Approve</span>
                  </Button>

                  <Button
                    variant="secondary"
                    size="md"
                    loading={isRejecting}
                    disabled={isApproving}
                    onClick={() => handleStatusChange(teacher.id, teacher.name, 'rejected')}
                  >
                    Reject
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
