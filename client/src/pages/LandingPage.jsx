import { useState } from 'react'
import { Link } from 'react-router-dom'
import { schoolConfig } from '../config/schoolConfig.js'
import { SAMPLE_STUDENTS, SAMPLE_PREVIEW_META } from '../data/mockAttendance.js'
import BrandWordmark from '../components/BrandWordmark.jsx'

/* ─── Attendance Preview (Illustrative Sample Record) ─────────────────── */

function AttendancePreview() {
  const presentCount = SAMPLE_STUDENTS.filter((s) => s.present).length

  return (
    <div
      className="bg-white border border-slate-200 rounded-xl overflow-hidden max-w-md w-full select-none shadow-[0_1px_2px_rgba(15,23,42,0.06)]"
      role="img"
      aria-label={`दैनिक हाजिरी नमुना - ${schoolConfig.schoolName}`}
    >
      {/* Category Header */}
      <div className="px-5 pt-4 pb-3 bg-slate-50 border-b border-slate-200">
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="text-xs font-semibold text-blue-600">
            Daily attendance
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-500 font-medium">
            Sample preview
          </span>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <h3 className="text-slate-900 text-base sm:text-lg font-bold truncate">
            {SAMPLE_PREVIEW_META.classAndSection}
          </h3>
          <span className="text-xs text-slate-500 whitespace-nowrap tabular-nums">
            {SAMPLE_PREVIEW_META.sampleDate}
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-0.5 truncate">
          {schoolConfig.schoolName}, {schoolConfig.locationShort}
        </p>
      </div>

      {/* Attendance Table */}
      <div className="px-5 py-2.5">
        <div className="grid grid-cols-[2.5rem_1fr_auto] gap-x-3 text-sm">
          {/* Table Header */}
          <span className="text-xs text-slate-500 font-medium pb-2 border-b border-slate-200">
            रोल
          </span>
          <span className="text-xs text-slate-500 font-medium pb-2 border-b border-slate-200">
            Student
          </span>
          <span className="text-xs text-slate-500 font-medium pb-2 text-right border-b border-slate-200">
            स्थिति
          </span>

          {SAMPLE_STUDENTS.map((student) => (
            <AttendanceRow key={student.roll} student={student} />
          ))}
        </div>
      </div>

      {/* Summary Footer */}
      <div className="px-5 py-3 flex items-center justify-between bg-slate-50 border-t border-slate-200">
        <span className="text-xs text-slate-600 font-medium tabular-nums">
          {presentCount}/{SAMPLE_STUDENTS.length} present
        </span>
        <span className="text-xs text-slate-500 italic">
          {SAMPLE_PREVIEW_META.footerLabel}
        </span>
      </div>
    </div>
  )
}

function AttendanceRow({ student }) {
  return (
    <>
      <span className="text-slate-500 text-xs py-2 border-t border-slate-100 flex items-center tabular-nums">
        {student.roll}
      </span>
      <span className="text-slate-900 py-2 border-t border-slate-100 flex items-center gap-1.5 text-xs sm:text-sm">
        <span className="font-medium">{student.name}</span>
        <span className="text-xs text-slate-500 hidden sm:inline">
          ({student.ne})
        </span>
      </span>
      <span className="py-2 border-t border-slate-100 flex items-center justify-end">
        {student.present ? (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#166534] bg-[#E7F3EC] px-2 py-0.5 rounded-full">
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path
                d="M3.5 7L5.5 9L10.5 4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Present
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#991B1B] bg-[#FBE9E9] px-2 py-0.5 rounded-full">
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path
                d="M4.5 4.5L9.5 9.5M9.5 4.5L4.5 9.5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            Absent
          </span>
        )}
      </span>
    </>
  )
}

/* ─── Mobile Navigation Menu ───────────────────────────────────────── */

function MobileMenu({ isOpen, onClose }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={onClose} aria-hidden="true" />

      {/* Drawer Panel */}
      <nav
        className="absolute top-0 right-0 w-72 max-w-[85vw] h-full bg-white border-l border-slate-200 flex flex-col p-6 shadow-xl"
        aria-label="Mobile navigation"
      >
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200">
          <BrandWordmark size="sm" />
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 transition-colors"
            aria-label="मेनु बन्द गर्नुहोस्"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M5 5L15 15M15 5L5 15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="flex flex-col gap-1">
          <a
            href="#about-school"
            onClick={onClose}
            className="py-3 text-slate-900 font-medium hover:text-blue-600 transition-colors border-b border-slate-100 text-sm"
          >
            विद्यालयको परिचय
          </a>
          <a
            href="#vision-mission"
            onClick={onClose}
            className="py-3 text-slate-900 font-medium hover:text-blue-600 transition-colors border-b border-slate-100 text-sm"
          >
            हाम्रो दृष्टिकोण तथा ध्येय
          </a>
          <a
            href="#campus-gallery"
            onClick={onClose}
            className="py-3 text-slate-900 font-medium hover:text-blue-600 transition-colors border-b border-slate-100 text-sm"
          >
            Campus gallery
          </a>
          <a
            href="#roles"
            onClick={onClose}
            className="py-3 text-slate-900 font-medium hover:text-blue-600 transition-colors border-b border-slate-100 text-sm"
          >
            अधिकृत प्रयोगकर्ता
          </a>
          <a
            href="#how-it-works"
            onClick={onClose}
            className="py-3 text-slate-900 font-medium hover:text-blue-600 transition-colors border-b border-slate-100 text-sm"
          >
            दैनिक हाजिरी कार्यविधि
          </a>
        </div>

        <div className="mt-auto pt-6 border-t border-slate-200">
          <Link
            to="/login"
            onClick={onClose}
            className="block py-2.5 text-center bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors text-sm shadow-xs"
          >
            कर्मचारी लगइन
          </Link>
          <Link
            to="/register"
            onClick={onClose}
            className="block py-2.5 mt-2 text-center border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors text-sm"
          >
            शिक्षक दर्ता
          </Link>
          <p className="text-xs text-slate-500 text-center mt-3">
            {schoolConfig.schoolName}
          </p>
        </div>
      </nav>
    </div>
  )
}

/* ─── Main Landing Page ────────────────────────────────────────────── */

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      {/* ── Header ─────────────────────────────────── */}
      <header className="border-b border-slate-200 bg-[#FAF8F5]/90 sticky top-0 z-30 backdrop-blur-xs">
        <div className="max-w-[1240px] mx-auto px-5 md:px-8 lg:px-12 py-3.5 flex items-center justify-between">
          {/* School Identity Wordmark */}
          <div className="min-w-0 pr-4">
            <BrandWordmark size="md" showNepaliSubtitle />
          </div>

          {/* Desktop In-page Nav */}
          <nav className="hidden lg:flex items-center gap-7 text-sm shrink-0" aria-label="मुख्य नेभिगेसन">
            <a
              href="#about-school"
              className="text-slate-600 hover:text-blue-600 font-medium transition-colors"
            >
              विद्यालयको परिचय
            </a>
            <a
              href="#vision-mission"
              className="text-slate-600 hover:text-blue-600 font-medium transition-colors"
            >
              दृष्टिकोण तथा ध्येय
            </a>
            <a
              href="#campus-gallery"
              className="text-slate-600 hover:text-blue-600 font-medium transition-colors flex items-center gap-1.5"
            >
              <span>Campus gallery</span>
            </a>
            <a
              href="#roles"
              className="text-slate-600 hover:text-blue-600 font-medium transition-colors"
            >
              प्रयोगकर्ता
            </a>
            <a
              href="#how-it-works"
              className="text-slate-600 hover:text-blue-600 font-medium transition-colors"
            >
              हाजिरी कार्यविधि
            </a>
          </nav>

          {/* Staff Sign In Action */}
          <div className="hidden lg:flex items-center gap-3 shrink-0">
            <Link
              to="/register"
              className="text-sm font-semibold text-slate-700 hover:text-blue-600 transition-colors"
            >
              Register
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center min-h-[40px] px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 active:scale-[0.98] transition-all shadow-xs"
            >
              Login
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMenuOpen(true)}
            className="lg:hidden p-2 text-slate-800 hover:text-blue-600 transition-colors rounded-lg"
            aria-label="Open navigation menu"
          >
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
              <path d="M3 6H19M3 11H19M3 16H19" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </header>

      <MobileMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />

      <main>
        {/* ── Hero: School Identity as the Main Visual Focus ────── */}
        <section className="pt-12 pb-16 md:pt-18 md:pb-22 lg:pt-22 lg:pb-24">
          <div className="max-w-[1240px] mx-auto px-5 md:px-8 lg:px-12 grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-12 lg:gap-14 items-center">
            {/* Left — Hero Copy with School Name as the Headline */}
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-3">
                Welcome to our school • {schoolConfig.locationShort}
              </p>

              {/* Main Headline: The School Name */}
              <h1 className="text-[clamp(2.2rem,2rem+2.5vw,3.8rem)] leading-[1.1] font-bold text-slate-900 mb-6 tracking-tight">
                {schoolConfig.schoolName}
              </h1>

              {/* Supporting Paragraph */}
              <p className="text-base sm:text-lg text-slate-600 max-w-lg mb-8 leading-relaxed">
                A dedicated space for our school community to manage daily attendance,
                support classroom routines, and keep attendance records organized.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3.5 mb-6">
                <Link
                  to="/login"
                  className="inline-flex items-center min-h-[44px] px-7 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 active:scale-[0.98] transition-all text-sm shadow-xs"
                >
                  कर्मचारी लगइन
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center min-h-[44px] px-6 py-3 border border-slate-200 bg-white text-slate-700 font-semibold rounded-lg hover:bg-slate-50 hover:border-slate-300 active:scale-[0.98] transition-all text-sm shadow-xs"
                >
                  शिक्षक दर्ता
                </Link>
                <a
                  href="#campus-gallery"
                  className="inline-flex items-center gap-1.5 px-4 py-3 text-slate-500 hover:text-slate-800 transition-colors text-sm font-medium"
                >
                  <span>Explore campus photos</span>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                    <path d="M7 3V11M10 8L7 11L4 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </a>
              </div>

              {/* Status Notice */}
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="w-2 h-2 rounded-full bg-[#166534]" aria-hidden="true" />
                <span>Internal school workspace</span>
                <span className="text-slate-300">•</span>
                <span className="tabular-nums">{schoolConfig.academicYear}</span>
                <span className="text-slate-300">•</span>
                <span>साँगुरीगढी–५</span>
              </div>
            </div>

            {/* Right — Attendance Preview */}
            <div className="flex justify-center lg:justify-end">
              <AttendancePreview />
            </div>
          </div>

          {/* ── Editorial Photography Ribbon (3 Scenic Vignettes) ── */}
          <div className="max-w-[1240px] mx-auto px-5 md:px-8 lg:px-12 mt-12 md:mt-16">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-3 bg-white border border-slate-200 rounded-xl shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
              {/* Vignette 1: Himalayan Vista */}
              <a
                href="#campus-gallery"
                className="relative group overflow-hidden rounded-lg bg-slate-100 aspect-[16/10] block"
              >
                <img
                  src={himalayaSchoolView}
                  alt="Bhanu Secondary School campus beneath the Himalayan snow peaks in Dandabazar"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent flex items-end p-4">
                  <div className="text-white">
                    <p className="text-xs text-slate-300 font-semibold mb-0.5">
                      Mountain vista
                    </p>
                    <p className="text-sm font-bold leading-snug">
                      Campus & Himalayan Peaks
                    </p>
                    <p className="text-xs text-white/80 mt-0.5">
                      डाँडाबजारबाट देखिने मनमोहक हिमशृङ्खला
                    </p>
                  </div>
                </div>
              </a>

              {/* Vignette 2: Volleyball & Courtyard */}
              <a
                href="#campus-gallery"
                className="relative group overflow-hidden rounded-lg bg-slate-100 aspect-[16/10] block"
              >
                <img
                  src={campusVolleyball}
                  alt="Students playing volleyball on the central school grounds"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent flex items-end p-4">
                  <div className="text-white">
                    <p className="text-xs text-slate-300 font-semibold mb-0.5">
                      Student community
                    </p>
                    <p className="text-sm font-bold leading-snug">
                      Courtyard Sports & Assembly
                    </p>
                    <p className="text-xs text-white/80 mt-0.5">
                      प्राङ्गणमा भलिबल प्रतियोगिता र विद्यार्थीहरू
                    </p>
                  </div>
                </div>
              </a>

              {/* Vignette 3: Terraced Sunflower Gardens */}
              <a
                href="#campus-gallery"
                className="relative group overflow-hidden rounded-lg bg-slate-100 aspect-[16/10] block"
              >
                <img
                  src={sunflowerGardens}
                  alt="Terraced sunflower gardens and stone pathways of Bhanu Secondary School"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent flex items-end p-4">
                  <div className="text-white">
                    <p className="text-xs text-slate-300 font-semibold mb-0.5">
                      Campus grounds
                    </p>
                    <p className="text-sm font-bold leading-snug">
                      Terraced Mountain Gardens
                    </p>
                    <p className="text-xs text-white/80 mt-0.5">
                      सिँढीयुक्त बगैँचा र सूर्यमुखी फूलहरू
                    </p>
                  </div>
                </div>
              </a>
            </div>
          </div>
        </section>

        {/* ── Section A: About Our School ─────────────────────────── */}
        <section
          id="about-school"
          className="py-16 md:py-20 bg-white border-y border-slate-200 scroll-mt-14"
        >
          <div className="max-w-[1240px] mx-auto px-5 md:px-8 lg:px-12">
            <div className="max-w-2xl mb-12">
              <p className="text-xs font-semibold text-slate-500 mb-2">
                School information • विद्यालय परिचय
              </p>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 leading-tight">
                About our school
              </h2>
              <p className="text-slate-600 text-sm sm:text-base mt-3 leading-relaxed">
                Located in {schoolConfig.location}, this internal workspace centralizes our daily classroom roll call and period attendance
                records, enabling teachers to record attendance each morning and school leadership to maintain organized records.
              </p>
            </div>

            {/* Editorial Metadata Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 py-8 border-y border-slate-200">
              {/* School Name */}
              <div>
                <span className="text-xs font-semibold text-slate-500 block mb-1">
                  School name
                </span>
                <p className="font-semibold text-slate-900 text-sm">{schoolConfig.schoolName}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {schoolConfig.shortName}
                </p>
              </div>

              {/* Location */}
              <div>
                <span className="text-xs font-semibold text-slate-500 block mb-1">
                  Official location
                </span>
                <p className="font-semibold text-slate-900 text-sm">{schoolConfig.location}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {schoolConfig.province}
                </p>
              </div>

              {/* School Classification */}
              <div>
                <span className="text-xs font-semibold text-slate-500 block mb-1">
                  School level & session
                </span>
                <p className="font-semibold text-slate-900 text-sm">{schoolConfig.schoolType}</p>
                <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
                  Academic year: {schoolConfig.academicYear}
                </p>
              </div>

              {/* System Purpose */}
              <div>
                <span className="text-xs font-semibold text-slate-500 block mb-1">
                  System purpose
                </span>
                <p className="font-semibold text-blue-600 text-sm">
                  Daily Attendance Records
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  आन्तरिक कर्मचारी कार्यकक्ष
                </p>
              </div>
            </div>

            {/* Visual Campus Feature Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10">
              {/* Card 1: Academic Buildings */}
              <div className="bg-[#FAF8F5] border border-slate-200 rounded-xl overflow-hidden flex flex-col justify-between shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
                <div className="aspect-[16/10] bg-slate-100 overflow-hidden">
                  <img
                    src={academicBuildings}
                    alt="Bhanu Secondary School modern multi-storey academic buildings"
                    className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-500"
                  />
                </div>
                <div className="p-6">
                  <span className="text-xs font-semibold text-blue-600 block mb-1">
                    Learning infrastructure
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">
                    Model Technical & General Stream Facilities
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Multi-storey academic wings housing both general secondary education classrooms
                    and technical stream laboratories, serving students across Sangurigadhi Rural Municipality.
                  </p>
                  <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
                    <span>Dandabazar, Dhankuta</span>
                    <span className="tabular-nums">Elev. ~1,800m</span>
                  </div>
                </div>
              </div>

              {/* Card 2: Faculty & Leadership */}
              <div className="bg-[#FAF8F5] border border-slate-200 rounded-xl overflow-hidden flex flex-col justify-between shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
                <div className="aspect-[16/10] bg-slate-100 overflow-hidden">
                  <img
                    src={schoolLeadership}
                    alt="School leadership and faculty members outside the main building"
                    className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-500"
                  />
                </div>
                <div className="p-6">
                  <span className="text-xs font-semibold text-slate-600 block mb-1">
                    Educational leadership
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">
                    Dedicated Faculty & School Administration
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Experienced school leadership and teaching faculty committed to student discipline,
                    consistent daily classroom attendance, and high-quality educational delivery.
                  </p>
                  <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
                    <span>{schoolConfig.schoolName}</span>
                    <span className="tabular-nums">Session {schoolConfig.academicYear}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Section B: Official Vision and Mission ──────────────── */}
        <section
          id="vision-mission"
          className="py-14 md:py-20 scroll-mt-14"
        >
          <div className="max-w-[1240px] mx-auto px-5 md:px-8 lg:px-12">
            <div className="max-w-xl mb-12">
              <p className="text-xs font-semibold text-slate-500 mb-2">
                Institutional direction • दृष्टिकोण तथा ध्येय
              </p>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 leading-tight">
                Our Vision & Mission
              </h2>
              <p className="text-slate-600 text-sm sm:text-base mt-2">
                Official educational vision and mission of {schoolConfig.schoolName}:
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
              {/* Vision Card */}
              <div className="p-8 sm:p-10 rounded-xl bg-white border border-slate-200 flex flex-col justify-between shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-xs font-semibold text-blue-600">
                      विद्यालयको दृष्टिकोण (Vision)
                    </span>
                  </div>
                  <blockquote className="text-base sm:text-lg text-slate-900 font-medium leading-relaxed italic">
                    “{schoolConfig.vision}”
                  </blockquote>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-200 text-xs text-slate-500">
                  {schoolConfig.schoolName}, {schoolConfig.locationShort}
                </div>
              </div>

              {/* Mission Card */}
              <div className="p-8 sm:p-10 rounded-xl bg-white border border-slate-200 flex flex-col justify-between shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-xs font-semibold text-slate-700">
                      विद्यालयको ध्येय (Mission)
                    </span>
                  </div>
                  <blockquote className="text-sm sm:text-base text-slate-900 font-medium leading-relaxed">
                    “{schoolConfig.mission}”
                  </blockquote>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-200 text-xs text-slate-500">
                  २१ औँ शताब्दीका चुनौतीहरूसँग प्रतिस्पर्धा गर्न सक्षम जनशक्ति
                </div>
              </div>
            </div>

            {/* Daily School Motto & Discipline Feature */}
            <div className="mt-10 p-6 sm:p-8 rounded-xl bg-white border border-slate-200 grid grid-cols-1 md:grid-cols-[260px_1fr] gap-8 items-center shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
              <div className="rounded-lg overflow-hidden border border-slate-200 bg-slate-100 aspect-[3/4] max-w-[240px] mx-auto md:mx-0 shadow-xs">
                <img
                  src={schoolMottoBoard}
                  alt="School entrance motto board in Dandabazar"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <p className="text-xs font-semibold text-blue-600 mb-2">
                  Campus entry motto • विद्यार्थी प्रतिज्ञा
                </p>
                <blockquote className="text-xl sm:text-2xl text-slate-900 font-bold leading-snug mb-3">
                  “आज म विद्यालय आएँ, अनुशासित भएर हरेक घण्टीमा कम्तिमा एक एक वटा नयाँ कुरा सिक्ने छु ।”
                </blockquote>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4 italic">
                  “Today I came to school. Being disciplined, in every class period I will learn at least one new thing.”
                </p>
                <p className="text-xs text-slate-500 leading-relaxed border-t border-slate-200 pt-4">
                  This foundational pledge is displayed at the entrance of Bhanu Secondary School.
                  The digital attendance workspace supports this commitment by ensuring every classroom period
                  and morning roll call is accurately accounted for by teaching faculty.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Section C: Authorized Roles & Pathways ─────────────── */}
        <section id="roles" className="py-16 md:py-24 bg-white border-y border-slate-200 scroll-mt-14">
          <div className="max-w-[1240px] mx-auto px-5 md:px-8 lg:px-12">
            <div className="max-w-xl mb-12">
              <p className="text-xs font-semibold text-slate-500 mb-2">
                Intended users • प्रयोगकर्ताहरू
              </p>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 leading-tight">
                Authorized school roles
              </h2>
              <p className="text-slate-600 text-sm sm:text-base mt-2">
                This system is intended for authorized staff members of {schoolConfig.schoolName}.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-slate-200 rounded-xl overflow-hidden border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
              {/* Administrator Pathway */}
              <div className="bg-white p-8 lg:p-10 flex flex-col justify-between">
                <div>
                  <div className="mb-6 rounded-lg overflow-hidden aspect-[16/9] bg-slate-100 border border-slate-200">
                    <img
                      src={facultyMeeting}
                      alt="School administration and faculty conference meeting"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-500">
                      Administrative office
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      विद्यालय प्रशासक
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">
                    School Administrators
                  </h3>
                  <p className="text-slate-600 text-sm leading-relaxed mb-6">
                    Oversee school-wide attendance records, verify daily submissions across all
                    grades, and manage authorized staff accounts.
                  </p>
                  <ul className="space-y-2.5 text-slate-600 text-xs sm:text-sm mb-8">
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" aria-hidden="true" />
                      सबै कक्षा र सेक्सनको हाजिरी स्थिति अनुगमन
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" aria-hidden="true" />
                      शिक्षक दर्ता प्रमाणीकरण तथा कक्षा शिक्षक नियुक्ति
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" aria-hidden="true" />
                      मासिक तथा वार्षिक हाजिरी प्रतिवेदन सञ्चय
                    </li>
                  </ul>
                </div>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors group"
                >
                  <span>Administrator sign in</span>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="group-hover:translate-x-0.5 transition-transform" aria-hidden="true">
                    <path d="M3 7H11M8 4L11 7L8 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
              </div>

              {/* Teacher Pathway */}
              <div className="bg-[#FAF8F5] p-8 lg:p-10 flex flex-col justify-between">
                <div>
                  <div className="mb-6 rounded-lg overflow-hidden aspect-[16/9] bg-slate-100 border border-slate-200">
                    <img
                      src={assemblyStage}
                      alt="Teachers and students gathered for morning assembly"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-blue-600">
                      Classroom roster
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      कक्षा शिक्षक
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">
                    Class Teachers
                  </h3>
                  <p className="text-slate-600 text-sm leading-relaxed mb-6">
                    Take daily morning and period roll call for your assigned class section and submit
                    verified rosters directly to the school office.
                  </p>
                  <ul className="space-y-2.5 text-slate-600 text-xs sm:text-sm mb-8">
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" aria-hidden="true" />
                      तोकिएको कक्षा र सेक्सनको नामावली पहुँच
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" aria-hidden="true" />
                      उपस्थित तथा अनुपस्थित विद्यार्थी चिन्ह लगाउने (P/A)
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" aria-hidden="true" />
                      दैनिक हाजिरी सुरक्षित गरी प्रशासनमा बुझाउने
                    </li>
                  </ul>
                </div>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors group"
                >
                  <span>Teacher sign in</span>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="group-hover:translate-x-0.5 transition-transform" aria-hidden="true">
                    <path d="M3 7H11M8 4L11 7L8 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── Spotlight: Student Innovation & Cultural Preservation ─ */}
        <section className="py-16 md:py-20 bg-[#FAF8F5]">
          <div className="max-w-[1240px] mx-auto px-5 md:px-8 lg:px-12">
            <div className="p-8 sm:p-10 rounded-xl bg-white border border-slate-200 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
              <div>
                <span className="text-xs font-semibold text-blue-600 block mb-2">
                  Mission in action • व्यावहारिक र जीवनोपयोगी शिक्षा
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight mb-4">
                  Nurturing Innovation, Moral Character & Cultural Heritage
                </h2>
                <p className="text-slate-600 text-sm sm:text-base leading-relaxed mb-6">
                  In line with our school mission, Bhanu Secondary School emphasizes practical skills,
                  technical competencies, and cultural rootedness. From student handicraft creation
                  to our campus cultural heritage room, students learn to be self-reliant citizens.
                </p>
                <div className="space-y-3 border-t border-slate-200 pt-5 text-xs sm:text-sm text-slate-600">
                  <div className="flex items-center gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600" aria-hidden="true" />
                    <span>Hands-on technical and handicraft creative arts</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600" aria-hidden="true" />
                    <span>Preservation of indigenous traditions and cultural artifacts</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600" aria-hidden="true" />
                    <span>Moral discipline reinforced through regular daily attendance</span>
                  </div>
                </div>
              </div>

              {/* Photo Showcase (Student Craft + Museum Room) */}
              <div className="grid grid-cols-2 gap-4">
                <div className="relative rounded-lg overflow-hidden border border-slate-200 bg-slate-100 aspect-[3/4] shadow-xs">
                  <img
                    src={studentCraft}
                    alt="Student wearing Bhanu Secondary School crest polo showing handmade craft"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent flex items-end p-3">
                    <p className="text-xs text-white font-semibold leading-tight">
                      Student Creative Craft
                    </p>
                  </div>
                </div>
                <div className="relative rounded-lg overflow-hidden border border-slate-200 bg-slate-100 aspect-[3/4] shadow-xs">
                  <img
                    src={culturalMuseum}
                    alt="Bhanu Secondary School cultural heritage and craft room"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent flex items-end p-3">
                    <p className="text-xs text-white font-semibold leading-tight">
                      Cultural Heritage Room
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Section D: Daily Workflow ──────────────── */}
        <section id="how-it-works" className="py-16 md:py-24 border-t border-slate-200 bg-white scroll-mt-14">
          <div className="max-w-[1240px] mx-auto px-5 md:px-8 lg:px-12">
            <p className="text-xs font-semibold text-slate-500 mb-2">
              Daily attendance routine • दैनिक कार्यप्रणाली
            </p>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 mb-12 max-w-xl">
              Three steps every morning at {schoolConfig.shortName}.
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-0">
              {/* Step 1 */}
              <div className="md:border-r md:border-slate-200 md:pr-8">
                <span className="text-4xl font-bold text-slate-300 tabular-nums">01</span>
                <h3 className="text-slate-900 font-bold text-base mt-3 mb-2">Open assigned class</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Log in with your phone and password. Your class roster and today's date load automatically.
                </p>
              </div>

              {/* Step 2 */}
              <div className="md:border-r md:border-slate-200 md:px-8">
                <span className="text-4xl font-bold text-slate-300 tabular-nums">02</span>
                <h3 className="text-slate-900 font-bold text-base mt-3 mb-2">Record attendance</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Mark each student present or absent during morning roll call. Review counts before submitting.
                </p>
              </div>

              {/* Step 3 */}
              <div className="md:pl-8">
                <span className="text-4xl font-bold text-slate-300 tabular-nums">03</span>
                <h3 className="text-slate-900 font-bold text-base mt-3 mb-2">Submit to office</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Submit the record. The school administration office can view and verify class attendance in real time.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Section E: School Focus Closing Banner ───────────────── */}
        <section className="relative py-20 md:py-24 bg-[#1E293B] text-[#FAF8F5] overflow-hidden">
          {/* Subtle Background Image with Navy Overlay */}
          <div className="absolute inset-0 opacity-10 mix-blend-overlay pointer-events-none">
            <img
              src={himalayanPeaks}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>

          <div className="relative max-w-[1240px] mx-auto px-5 md:px-8 lg:px-12 text-center">
            <p className="text-xs font-semibold text-slate-400 mb-2">
              {schoolConfig.schoolName} • {schoolConfig.locationShort}
            </p>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#FAF8F5] mb-4 max-w-xl mx-auto leading-tight">
              Every school day, accounted for.
            </h2>
            <p className="text-slate-300 text-sm sm:text-base mb-8 max-w-md mx-auto leading-relaxed">
              Sign in to manage classroom attendance, verify student presence, and review daily academic records.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3.5">
              <Link
                to="/login"
                className="inline-flex items-center min-h-[44px] px-7 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 active:scale-[0.98] transition-all text-sm shadow-sm"
              >
                कर्मचारी लगइन
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center min-h-[44px] px-6 py-3 border border-slate-600 text-[#FAF8F5] font-semibold rounded-lg hover:bg-slate-800 active:scale-[0.98] transition-all text-sm"
              >
                शिक्षक दर्ता
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ───────────────────────────────── */}
      <footer className="border-t border-slate-200 py-10 md:py-14 bg-[#FAF8F5]">
        <div className="max-w-[1240px] mx-auto px-5 md:px-8 lg:px-12">
          <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr_1fr] gap-8">
            {/* School Identity */}
            <div>
              <div className="mb-3">
                <BrandWordmark size="md" />
              </div>
              <p className="text-xs text-slate-900 font-semibold">
                {schoolConfig.schoolName}
              </p>
              <p className="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed">
                साँगुरीगढी–५, डाँडाबजार, धनकुटा, कोशी प्रदेश।
              </p>
              <p className="text-xs text-slate-400 mt-2 tabular-nums">
                Academic session: {schoolConfig.academicYear}
              </p>
            </div>

            {/* In-page Sections */}
            <div>
              <h4 className="text-xs font-semibold text-slate-900 mb-3">
                Workspace sections
              </h4>
              <ul className="space-y-2 text-xs text-slate-600">
                <li>
                  <a href="#about-school" className="hover:text-blue-600 transition-colors">
                    विद्यालयको परिचय
                  </a>
                </li>
                <li>
                  <a href="#vision-mission" className="hover:text-blue-600 transition-colors">
                    हाम्रो दृष्टिकोण तथा ध्येय
                  </a>
                </li>
                <li>
                  <a href="#campus-gallery" className="hover:text-blue-600 transition-colors">
                    Campus gallery
                  </a>
                </li>
                <li>
                  <a href="#roles" className="hover:text-blue-600 transition-colors">
                    अधिकृत प्रयोगकर्ता
                  </a>
                </li>
                <li>
                  <a href="#how-it-works" className="hover:text-blue-600 transition-colors">
                    दैनिक हाजिरी कार्यविधि
                  </a>
                </li>
              </ul>
            </div>

            {/* Staff Access */}
            <div>
              <h4 className="text-xs font-semibold text-slate-900 mb-3">
                Staff access
              </h4>
              <ul className="space-y-2 text-xs text-slate-600">
                <li>
                  <Link to="/login" className="hover:text-blue-600 transition-colors font-semibold text-slate-900">
                    कर्मचारी लगइन
                  </Link>
                </li>
                <li>
                  <Link to="/register" className="hover:text-blue-600 transition-colors">
                    शिक्षक दर्ता आवेदन
                  </Link>
                </li>
                <li className="text-xs text-slate-400 pt-1">
                  प्रशासनबाट प्रमाणीकरण भएका कर्मचारीहरूका लागि मात्र
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-10 pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <p>
              © {new Date().getFullYear()} {schoolConfig.schoolName}। आन्तरिक हाजिरी प्रणाली।
            </p>
            <p className="text-xs">
              {schoolConfig.location}
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
