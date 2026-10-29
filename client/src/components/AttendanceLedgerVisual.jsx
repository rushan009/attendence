import { schoolConfig } from '../config/schoolConfig.js'

/**
 * Restrained, tactile attendance register visual inspired by
 * Nepali school registers (दैनिक हाजिर खाता).
 */
export default function AttendanceLedgerVisual({ className = '' }) {
  const students = [
    { roll: '०१', name: 'Aarav Sharma', ne: 'आरव शर्मा', status: 'P', present: true },
    { roll: '०२', name: 'Sita Adhikari', ne: 'सीता अधिकारी', status: 'P', present: true },
    { roll: '०३', name: 'Bikash Thapa', ne: 'बिकश थापा', status: 'P', present: true },
    { roll: '०४', name: 'Manisha Rai', ne: 'मनिषा राई', status: 'A', present: false },
    { roll: '०५', name: 'Roshan K.C.', ne: 'रोशन के.सी.', status: 'P', present: true },
  ]

  return (
    <div
      className={`bg-white border border-slate-200 rounded-xl overflow-hidden select-none shadow-[0_1px_2px_rgba(15,23,42,0.06)] ${className}`}
      aria-label={`${schoolConfig.schoolName} - दैनिक हाजिर खाता`}
      role="img"
    >
      {/* Ledger Header Band */}
      <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-900">
            दैनिक हाजिर खाता
          </span>
          <span className="text-xs text-slate-500">• कक्षा १० 'ए'</span>
        </div>
        <div className="text-right">
          <span className="text-xs text-slate-500 tabular-nums">
            २०८३/०७/०६ BS
          </span>
        </div>
      </div>

      {/* Register Meta Banner */}
      <div className="px-4 py-2.5 bg-white border-b border-slate-200 flex items-center justify-between text-xs">
        <div>
          <p className="text-xs font-semibold text-slate-900">
            {schoolConfig.schoolName}
          </p>
          <p className="text-[13px] text-slate-500">
            {schoolConfig.locationShort}
          </p>
        </div>
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#E7F3EC] text-[#166534]">
          प्रमाणित (Verified)
        </span>
      </div>

      {/* Ruled Register Table */}
      <div className="divide-y divide-slate-100 text-xs">
        {/* Table Head */}
        <div className="grid grid-cols-[2.5rem_1fr_3.5rem] px-4 py-2 bg-slate-50 text-slate-500 text-xs font-semibold">
          <span>रोल</span>
          <span>विद्यार्थी (Student)</span>
          <span className="text-right">हाजिर</span>
        </div>

        {/* Student Rows */}
        {students.map((student) => (
          <div
            key={student.roll}
            className="grid grid-cols-[2.5rem_1fr_3.5rem] items-center px-4 py-2 hover:bg-slate-50 transition-colors"
          >
            <span className="text-xs text-slate-500 tabular-nums">
              {student.roll}
            </span>
            <div className="flex items-baseline gap-1.5 min-w-0">
              <span className="text-slate-900 font-medium truncate text-xs">
                {student.name}
              </span>
              <span className="text-[13px] text-slate-500 hidden sm:inline">
                {student.ne}
              </span>
            </div>
            <div className="flex justify-end">
              {student.present ? (
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#E7F3EC] text-[#166534] font-semibold text-xs">
                  P
                </span>
              ) : (
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#FBE9E9] text-[#991B1B] font-semibold text-xs">
                  A
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Ledger Footer Ledger Stamp */}
      <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-600">
            कुल उपस्थिति: <strong className="text-[#166534] font-semibold">४/५ उपस्थित</strong>
          </span>
        </div>
        <div className="flex items-center gap-1 text-slate-500 text-xs">
          <span>Daily record closed</span>
        </div>
      </div>
    </div>
  )
}
