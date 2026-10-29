import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import * as adminService from '../../services/adminService.js'
import { schoolConfig } from '../../config/schoolConfig.js'
import Button from '../../components/Button.jsx'

/**
 * People > Teachers
 * Route: /admin/teachers
 *
 * Displays active and approved faculty members, their phone numbers,
 * and their assigned class responsibilities.
 */
export default function TeachersPage() {
  const [teachers, setTeachers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadTeachers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await adminService.getTeachers('approved')
      setTeachers(res.teachers || [])
    } catch (err) {
      setError(err.message || 'Unable to load school faculty.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    document.title = `Teachers — ${schoolConfig.schoolName}`
    loadTeachers()
  }, [loadTeachers])

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
            Teachers
          </h1>
          <p className="text-slate-600 text-sm mt-1 max-w-2xl leading-relaxed">
            Faculty directory, active teacher accounts, contact details, and assigned classroom responsibilities.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            to="/admin/pending-approvals"
            className="text-xs text-blue-600 hover:text-blue-700 font-semibold underline underline-offset-2"
          >
            Review pending requests →
          </Link>
        </div>
      </div>

      {/* ── Error Message ─────────────────────────────────── */}
      {error && (
        <div role="alert" className="p-3.5 rounded-lg text-sm text-[#991B1B] bg-[#FBE9E9] border border-[#991B1B]/20">
          {error}
        </div>
      )}

      {/* ── Teachers Directory ────────────────────────────── */}
      {loading ? (
        <div className="p-8 rounded-lg bg-white border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.06)] space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-14 bg-slate-100 rounded animate-pulse" />
          ))}
        </div>
      ) : teachers.length === 0 ? (
        <div className="py-16 px-4 flex flex-col items-center justify-center text-center max-w-md mx-auto bg-white rounded-lg border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
          <h2 className="text-base font-semibold text-slate-900">
            No approved teachers yet
          </h2>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed max-w-sm">
            Once teacher registration requests are reviewed and approved, faculty members will appear here.
          </p>
          <div className="mt-5">
            <Link to="/admin/pending-approvals">
              <Button variant="primary" size="md">
                Check pending registrations
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-[#1E293B] text-[#FAF8F5] sticky top-0 text-xs">
                <th className="py-3 px-4 font-semibold">Teacher</th>
                <th className="py-3 px-4 font-semibold">Phone number</th>
                <th className="py-3 px-4 font-semibold">Assigned class</th>
                <th className="py-3 px-4 font-semibold text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {teachers.map((teacher) => {
                const assignedClassLabel = teacher.class
                  ? typeof teacher.class === 'object'
                    ? `${teacher.class.name}${teacher.class.section ? ` — Section ${teacher.class.section}` : ''}`
                    : 'Assigned'
                  : 'No class assigned'

                return (
                  <tr key={teacher.id} className="hover:bg-slate-50 transition-colors">
                    {/* Name + Avatar */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-semibold text-xs flex items-center justify-center shrink-0"
                          aria-hidden="true"
                        >
                          {getInitials(teacher.name)}
                        </span>
                        <div>
                          <p className="font-semibold text-slate-900 text-sm">
                            {teacher.name}
                          </p>
                          <p className="text-xs text-slate-500">
                            Faculty Member
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Phone */}
                    <td className="py-3.5 px-4 text-xs text-slate-600 tabular-nums">
                      +977 {teacher.phone}
                    </td>

                    {/* Class */}
                    <td className="py-3.5 px-4 text-xs text-slate-900">
                      {teacher.class ? (
                        <span className="font-medium">{assignedClassLabel}</span>
                      ) : (
                        <span className="text-slate-400 italic">No class assigned</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 text-right">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#E7F3EC] text-[#166534]">
                        Active faculty
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
