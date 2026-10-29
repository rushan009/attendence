import { useState, useEffect, useRef } from 'react'
import * as studentService from '../../services/studentService.js'
import { schoolConfig } from '../../config/schoolConfig.js'
import Button from '../../components/Button.jsx'

/**
 * MY CLASS > Import students
 * Route: /teacher/import-students
 *
 * White upload card with a dashed #E2E8F0 drop zone,
 * a simple column guide, one blue Import button,
 * and skipped rows shown as a plain list with warning colors.
 */
export default function ImportStudentsPage() {
  const [assignedClasses, setAssignedClasses] = useState([])
  const [loadingClasses, setLoadingClasses] = useState(true)
  const [selectedClassId, setSelectedClassId] = useState('')
  const [file, setFile] = useState(null)
  const [dragActive, setDragActive] = useState(false)
  const [feedback, setFeedback] = useState(null)
  const [skipped, setSkipped] = useState([])
  const [processing, setProcessing] = useState(false)
  const fileInputRef = useRef(null)

  useEffect(() => {
    document.title = `Import Students — ${schoolConfig.schoolName}`
  }, [])

  useEffect(() => {
    let isMounted = true
    async function fetchTeacherClass() {
      try {
        setLoadingClasses(true)
        const res = await studentService.getMyClassStudents()
        if (isMounted) {
          const list = res.classes && res.classes.length > 0
            ? res.classes
            : res.class
            ? [res.class]
            : []
          setAssignedClasses(list)
          if (list.length > 0) {
            setSelectedClassId(list[0].id || list[0]._id || '')
          }
        }
      } catch (err) {
        if (isMounted) setAssignedClasses([])
      } finally {
        if (isMounted) setLoadingClasses(false)
      }
    }
    fetchTeacherClass()
    return () => {
      isMounted = false
    }
  }, [])

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleValidateAndSetFile(e.dataTransfer.files[0])
    }
  }

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleValidateAndSetFile(e.target.files[0])
    }
  }

  const handleValidateAndSetFile = (uploadedFile) => {
    const validExtensions = ['.xlsx', '.xls', '.csv']
    const fileName = uploadedFile.name.toLowerCase()
    const isValid = validExtensions.some((ext) => fileName.endsWith(ext))

    if (!isValid) {
      setFeedback({
        type: 'error',
        message: 'Invalid file type. Please upload an Excel spreadsheet (.xlsx, .xls) or a CSV (.csv) file.',
      })
      return
    }

    if (uploadedFile.size > 10 * 1024 * 1024) {
      setFeedback({
        type: 'error',
        message: 'File size exceeds 10MB limit. Please upload a smaller file.',
      })
      return
    }

    setFile(uploadedFile)
    setFeedback(null)
  }

  const handleRemoveFile = () => {
    setFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const handleDownloadTemplate = () => {
    const headers = 'Roll,Name,Gender,GuardianPhone\n'
    const sampleRows =
      '1,Aarav Sharma,male,9841000001\n2,Sita Adhikari,female,9841000002\n3,Bikash Thapa,male,9841000003\n'
    const blob = new Blob([headers + sampleRows], {
      type: 'text/csv;charset=utf-8;',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'student_roster_template.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!selectedClassId) {
      setFeedback({
        type: 'error',
        message: 'No classroom assigned to import students into.',
      })
      return
    }
    if (!file) {
      setFeedback({
        type: 'error',
        message: 'Please attach an Excel or CSV file to proceed.',
      })
      return
    }

    setProcessing(true)
    setFeedback(null)
    setSkipped([])

    try {
      const data = await studentService.importStudents(file, selectedClassId)
      setFeedback({
        type: 'success',
        message: `${data.inserted} student(s) imported successfully into your classroom.`,
      })
      setSkipped(data.skipped || [])
      handleRemoveFile()
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || err.message || 'Import failed. Please try again.',
      })
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="space-y-6 max-w-5xl animate-in fade-in duration-150">
      {/* ── Page Header ── */}
      <div>
        <h1 className="text-[28px] font-bold text-slate-900 tracking-tight">
          Import students
        </h1>
        <p className="text-slate-600 text-[15px] mt-1 max-w-2xl leading-relaxed">
          Batch student enrollment from an Excel spreadsheet or CSV roster file into your assigned classroom.
        </p>
      </div>

      <div className="h-px bg-slate-200" aria-hidden="true" />

      {/* ── Feedback Banner ── */}
      {feedback && (
        <div
          className={`p-4 rounded-xl text-[14px] border flex items-start justify-between gap-3 ${
            feedback.type === 'success'
              ? 'bg-[#E7F3EC] border-green-200 text-[#166534]'
              : 'bg-[#FBE9E9] border-red-200 text-[#991B1B]'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="font-semibold">{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-700 text-xs font-bold px-1 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* ── Skipped Rows Plain List with Warning Colors ── */}
      {skipped.length > 0 && (
        <div className="p-4 rounded-xl border border-amber-300 bg-[#FEF3C7] text-[#92400E] text-[14px] space-y-2">
          <p className="font-semibold">{skipped.length} row(s) skipped:</p>
          <ul className="list-disc pl-5 space-y-1 text-[13px]">
            {skipped.map((s, i) => (
              <li key={i}>
                {s.row ? <span className="font-semibold">Row {s.row}: </span> : ''}
                {s.reason}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Main Two-Column Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.35fr_1fr] gap-8 items-start">
        {/* Left Column: White Upload Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-7 shadow-[0_1px_2px_rgba(15,23,42,0.06)] space-y-6">
          <div>
            <h2 className="text-[18px] font-semibold text-slate-900">
              Upload student roster
            </h2>
            <p className="text-[13px] text-slate-500 mt-0.5">
              Choose your target class and attach your spreadsheet.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Class Selection */}
            <div className="space-y-1.5">
              <label
                htmlFor="target-class-select"
                className="block text-[13px] font-semibold text-slate-700"
              >
                Assigned Classroom *
              </label>

              {loadingClasses ? (
                <div className="w-full h-10 px-3.5 py-2 rounded-lg bg-slate-100 border border-slate-200 text-slate-500 text-[13px] animate-pulse" />
              ) : assignedClasses.length === 0 ? (
                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-[13px] text-slate-500">
                  No classroom currently assigned to your account.
                </div>
              ) : (
                <div className="relative">
                  <select
                    id="target-class-select"
                    value={selectedClassId}
                    onChange={(e) => setSelectedClassId(e.target.value)}
                    className="w-full h-10 px-3.5 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 text-[14px] font-medium focus-visible:outline-blue-600 cursor-pointer shadow-xs appearance-none pr-9"
                  >
                    {assignedClasses.map((cls) => {
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
                      <path d="M3.5 5.25L7 8.75L10.5 5.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
              )}
            </div>

            {/* File Picker with Dashed #E2E8F0 Drop Zone */}
            <div className="space-y-1.5">
              <label className="block text-[13px] font-semibold text-slate-700">
                Spreadsheet File (.xlsx, .xls, .csv) *
              </label>

              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileInputChange}
                className="hidden"
                id="spreadsheet-file-input"
              />

              {!file ? (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-150 ${
                    dragActive
                      ? 'border-blue-600 bg-blue-50/60'
                      : 'border-[#E2E8F0] hover:border-blue-400 bg-slate-50/50'
                  }`}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      fileInputRef.current?.click()
                    }
                  }}
                  aria-label="Upload Excel or CSV spreadsheet"
                >
                  <div className="w-12 h-12 mx-auto rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 mb-3">
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="12" y1="18" x2="12" y2="12" />
                      <line x1="9" y1="15" x2="15" y2="15" />
                    </svg>
                  </div>

                  <p className="text-[14px] font-semibold text-slate-900">
                    Click to browse or drag and drop your file here
                  </p>
                  <p className="text-[13px] text-slate-500 mt-1">
                    Supports Microsoft Excel (.xlsx, .xls) and CSV (.csv) up to 10MB
                  </p>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="8" y1="13" x2="16" y2="13" />
                        <line x1="8" y1="17" x2="16" y2="17" />
                        <polyline points="10 9 9 9 8 9" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[14px] font-semibold text-slate-900 truncate">
                        {file.name}
                      </p>
                      <p className="text-[12px] text-slate-500 tabular-nums">
                        {formatFileSize(file.size)} • Ready for import
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-[13px] text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
                    >
                      Change
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="p-1 text-slate-400 hover:text-[#991B1B] transition-colors rounded cursor-pointer"
                      title="Remove file"
                      aria-label="Remove attached file"
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
                        <line x1="4" y1="4" x2="12" y2="12" />
                        <line x1="12" y1="4" x2="4" y2="12" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons: One Blue Button */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <Button
                type="submit"
                variant="primary"
                size="md"
                loading={processing}
                disabled={!file || !selectedClassId || loadingClasses}
              >
                <span>Import students</span>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M7 2V10M10 7L7 10L4 7M2 12H12" />
                </svg>
              </Button>

              {file && (
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={handleRemoveFile}
                >
                  Clear file
                </Button>
              )}
            </div>
          </form>
        </div>

        {/* Right Column: Column Guide & Starter Template */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-[0_1px_2px_rgba(15,23,42,0.06)] space-y-4">
            <div>
              <h3 className="text-[16px] font-semibold text-slate-900">
                Column guide
              </h3>
              <p className="text-[13px] text-slate-500 mt-1 leading-relaxed">
                Ensure the first row of your spreadsheet contains these exact headers:
              </p>
            </div>

            <div className="border border-slate-200 rounded-lg overflow-hidden text-[13px]">
              <div className="grid grid-cols-[1.2fr_1fr] bg-slate-50 font-semibold text-slate-700 p-2.5 border-b border-slate-200">
                <span>Column Name</span>
                <span>Requirement</span>
              </div>
              <div className="divide-y divide-slate-100 bg-white">
                <div className="grid grid-cols-[1.2fr_1fr] p-2.5">
                  <span className="font-medium text-slate-900">Roll</span>
                  <span className="text-[#166534] font-medium">Required</span>
                </div>
                <div className="grid grid-cols-[1.2fr_1fr] p-2.5">
                  <span className="font-medium text-slate-900">Name</span>
                  <span className="text-[#166534] font-medium">Required</span>
                </div>
                <div className="grid grid-cols-[1.2fr_1fr] p-2.5">
                  <span className="font-medium text-slate-900">Gender</span>
                  <span className="text-slate-500">Optional (male / female)</span>
                </div>
                <div className="grid grid-cols-[1.2fr_1fr] p-2.5">
                  <span className="font-medium text-slate-900">GuardianPhone</span>
                  <span className="text-slate-500">Optional (10 digits)</span>
                </div>
              </div>
            </div>

            <p className="text-[12px] text-slate-500 leading-relaxed">
              * The system matches students by roll number within the selected class. Duplicate roll numbers will be validated automatically.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-[0_1px_2px_rgba(15,23,42,0.06)] space-y-3">
            <h3 className="text-[16px] font-semibold text-slate-900">
              Starter template
            </h3>
            <p className="text-[13px] text-slate-500 leading-relaxed">
              Download our sample template with pre-filled sample rows to ensure your data imports without formatting errors.
            </p>
            <div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleDownloadTemplate}
                className="w-full sm:w-auto"
              >
                <svg className="w-4 h-4 text-slate-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                <span>Download Sample Template (.csv)</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
