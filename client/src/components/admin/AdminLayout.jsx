import { useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { schoolConfig } from '../../config/schoolConfig.js'
import BrandWordmark from '../BrandWordmark.jsx'
import { getDualCalendarDate } from '../../utils/nepaliDate.js'

/**
 * Navigation structure for Admin Workspace.
 * Sections: Overview, People, School, Reports.
 */
const ADMIN_NAV_SECTIONS = [
  {
    heading: 'Overview',
    items: [
      {
        to: '/admin/dashboard',
        label: 'Dashboard',
        icon: (
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
          </svg>
        ),
      },
    ],
  },
  {
    heading: 'People',
    items: [
      {
        to: '/admin/pending-approvals',
        label: 'Pending Approvals',
        icon: (
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <circle cx="19" cy="11" r="2" />
            <path d="M19 13v2" />
          </svg>
        ),
      },
      {
        to: '/admin/teachers',
        label: 'Teachers',
        icon: (
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        ),
      },
      {
        to: '/admin/students',
        label: 'Students',
        icon: (
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
            <path d="M6 12v5c3 3 9 3 12 0v-5" />
          </svg>
        ),
      },
      {
        to: '/admin/import-students',
        label: 'Import Students',
        icon: (
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        ),
      },
    ],
  },
  {
    heading: 'School',
    items: [
      {
        to: '/admin/classes',
        label: 'Classes',
        icon: (
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 21h18" />
            <path d="M5 21V7l8-4v18" />
            <path d="M19 21V11l-6-3" />
            <path d="M9 9v.01" />
            <path d="M9 13v.01" />
            <path d="M9 17v.01" />
          </svg>
        ),
      },
      {
        to: '/admin/holidays',
        label: 'Holidays',
        icon: (
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        ),
      },
      {
        to: '/admin/settings',
        label: 'Settings',
        icon: (
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="4" y1="21" x2="4" y2="14" />
            <line x1="4" y1="10" x2="4" y2="3" />
            <line x1="12" y1="21" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12" y2="3" />
            <line x1="20" y1="21" x2="20" y2="16" />
            <line x1="20" y1="12" x2="20" y2="3" />
            <line x1="1" y1="14" x2="7" y2="14" />
            <line x1="9" y1="8" x2="15" y2="8" />
            <line x1="17" y1="16" x2="23" y2="16" />
          </svg>
        ),
      },
    ],
  },
  {
    heading: 'Reports',
    items: [
      {
        to: '/admin/reports',
        label: 'Attendance Reports',
        icon: (
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
        ),
      },
      {
        to: '/admin/attendance-history',
        label: 'Attendance History',
        icon: (
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        ),
      },
    ],
  },
]

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Current dual date
  const todayDate = getDualCalendarDate()

  const handleSignOut = async () => {
    try {
      await logout()
      navigate('/login', { replace: true })
    } catch {
      navigate('/login', { replace: true })
    }
  }

  // User initials for avatar circle
  const initials = (user?.name || 'A')
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-slate-900 flex flex-col font-sans">
      {/* ── Top Bar (Navy, Slim) ─────────────────────────── */}
      <header className="bg-[#1E293B] text-[#FAF8F5] border-b border-[#334155] sticky top-0 z-30">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
          {/* Left: Mobile Toggle + School Name */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-1.5 -ml-1 text-[#94A3B8] hover:text-[#FAF8F5] focus-visible:outline-blue-400 rounded-lg cursor-pointer"
              aria-label="Open navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true">
                <line x1="3" y1="5" x2="17" y2="5" />
                <line x1="3" y1="10" x2="17" y2="10" />
                <line x1="3" y1="15" x2="17" y2="15" />
              </svg>
            </button>

            <BrandWordmark to="/admin/dashboard" size="sm" showNepaliSubtitle onDark />
          </div>

          {/* Center: BS Date and AD Date underneath */}
          <div className="hidden md:flex flex-col items-center justify-center text-center shrink-0">
            <span className="font-medium text-[#FAF8F5] text-[14px] leading-tight">
              {todayDate.bsDateFormatted}
            </span>
            <span className="text-[13px] text-[#94A3B8] leading-tight mt-0.5">
              {todayDate.adWithDay}
            </span>
          </div>

          {/* Right: User Chip + Sign out */}
          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-semibold text-[13px] flex items-center justify-center shadow-xs">
                {initials}
              </div>
              <div className="hidden sm:block text-left leading-tight">
                <p className="text-[13px] font-semibold text-[#FAF8F5]">
                  {user?.name || 'Administrator'}
                </p>
                <p className="text-[13px] text-[#94A3B8]">
                  विद्यालय प्रशासक
                </p>
              </div>
            </div>

            <div className="h-4 w-px bg-[#334155] hidden sm:block" aria-hidden="true" />

            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium text-[#FAF8F5] bg-[#334155]/60 hover:bg-[#334155] rounded-lg border border-[#334155] transition-colors focus-visible:outline-blue-400 cursor-pointer"
              aria-label="Sign out"
            >
              <svg className="w-3.5 h-3.5 shrink-0 text-[#94A3B8]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span>Sign out</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Main Workspace: Navy Sidebar + Content Area ─────── */}
      <div className="flex-1 flex w-full">
        {/* Desktop Sidebar (Navy) */}
        <aside
          className="hidden lg:flex flex-col justify-between w-60 shrink-0 bg-[#1E293B] border-r border-[#334155] py-6 px-3.5 select-none"
          aria-label="Admin workspace navigation"
        >
          <nav className="space-y-6">
            {ADMIN_NAV_SECTIONS.map((section) => (
              <div key={section.heading}>
                <h2 className="text-[12px] font-medium text-[#94A3B8] px-3 mb-1.5">
                  {section.heading}
                </h2>
                <ul className="space-y-1">
                  {section.items.map((item) => {
                    const isItemActive =
                      location.pathname === item.to ||
                      (item.to === '/admin/dashboard' && location.pathname === '/admin')

                    return (
                      <li key={item.to}>
                        <NavLink
                          to={item.to}
                          className={`group flex items-center gap-2.5 px-3 py-2 text-[14px] rounded-lg transition-colors relative ${
                            isItemActive
                              ? 'bg-[#334155] text-[#FAF8F5] font-semibold pl-3.5 before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-[3px] before:bg-[#3B82F6] before:rounded-r'
                              : 'text-[#94A3B8] hover:text-[#FAF8F5] hover:bg-[#334155]/60 font-medium'
                          }`}
                        >
                          <span
                            className={
                              isItemActive
                                ? 'text-[#3B82F6]'
                                : 'text-[#94A3B8] group-hover:text-[#FAF8F5]'
                            }
                          >
                            {item.icon}
                          </span>
                          <span className="truncate">{item.label}</span>
                        </NavLink>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
          </nav>

          {/* School Address at bottom */}
          <div className="pt-5 border-t border-[#334155] px-3 text-[13px] text-[#94A3B8] leading-relaxed">
            <p className="font-medium text-[#FAF8F5] truncate">
              {schoolConfig.schoolNameNepali}
            </p>
            <p className="text-[#94A3B8] truncate mt-0.5">
              {schoolConfig.locationNepali}
            </p>
            <p className="text-[#94A3B8]/80 text-[12px] mt-1">
              प्रशासनिक कार्यकक्ष
            </p>
          </div>
        </aside>

        {/* ── Content Area: Cream background, max-w ~1200px ── */}
        <main className="flex-1 min-w-0 bg-[#FAF8F5] p-6 sm:p-8 lg:p-9">
          <div className="max-w-[1200px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {/* ── Mobile Navigation Drawer ───────────────────────── */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation drawer">
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />

          <div className="absolute top-0 left-0 w-72 max-w-[85vw] h-full bg-[#1E293B] border-r border-[#334155] text-[#FAF8F5] flex flex-col p-5 shadow-xl overflow-y-auto">
            <div className="flex items-center justify-between pb-3.5 border-b border-[#334155] mb-4">
              <BrandWordmark to="/admin/dashboard" size="sm" onDark />
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 text-[#94A3B8] hover:text-[#FAF8F5] rounded-lg cursor-pointer"
                aria-label="Close menu"
              >
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="5" y1="5" x2="15" y2="15" />
                  <line x1="15" y1="5" x2="5" y2="15" />
                </svg>
              </button>
            </div>

            <div className="mb-4 p-3 rounded-lg bg-[#334155]/60 border border-[#334155] text-[13px]">
              <p className="font-medium text-[#FAF8F5]">
                {todayDate.bsDateWithDay}
              </p>
              <p className="text-[12px] text-[#94A3B8] mt-0.5">
                {todayDate.adFormatted}
              </p>
            </div>

            <nav className="space-y-5 flex-1">
              {ADMIN_NAV_SECTIONS.map((section) => (
                <div key={section.heading}>
                  <p className="text-[12px] font-medium text-[#94A3B8] px-2.5 mb-1.5">
                    {section.heading}
                  </p>
                  <ul className="space-y-1">
                    {section.items.map((item) => {
                      const isItemActive =
                        location.pathname === item.to ||
                        (item.to === '/admin/dashboard' && location.pathname === '/admin')

                      return (
                        <li key={item.to}>
                          <NavLink
                            to={item.to}
                            onClick={() => setMobileMenuOpen(false)}
                            className={`flex items-center gap-2.5 px-3 py-2 text-[14px] rounded-lg transition-colors relative ${
                              isItemActive
                                ? 'bg-[#334155] text-[#FAF8F5] font-semibold pl-3.5 before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-[3px] before:bg-[#3B82F6] before:rounded-r'
                                : 'text-[#94A3B8] hover:text-[#FAF8F5] hover:bg-[#334155]/60 font-medium'
                            }`}
                          >
                            <span className={isItemActive ? 'text-[#3B82F6]' : 'text-[#94A3B8]'}>
                              {item.icon}
                            </span>
                            <span>{item.label}</span>
                          </NavLink>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              ))}
            </nav>

            <div className="mt-6 pt-4 border-t border-[#334155] space-y-3">
              <div>
                <p className="text-[13px] font-semibold text-[#FAF8F5]">{user?.name || 'Administrator'}</p>
                <p className="text-[12px] text-[#94A3B8]">
                  विद्यालय प्रशासक
                </p>
              </div>
              <button
                type="button"
                onClick={handleSignOut}
                className="w-full py-2 px-3 text-[13px] font-medium text-center text-[#FAF8F5] bg-[#334155] hover:bg-[#334155]/80 rounded-lg border border-slate-600 transition-colors cursor-pointer"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
