import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import ProtectedRoute from './components/routes/ProtectedRoute.jsx'
import PublicOnlyRoute from './components/routes/PublicOnlyRoute.jsx'
import LandingPage from './pages/LandingPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import SignupPage from './pages/SignupPage.jsx'
import AdminLayout from './components/admin/AdminLayout.jsx'
import AdminDashboardPage from './pages/admin/AdminDashboardPage.jsx'
import PendingApprovalsPage from './pages/admin/PendingApprovalsPage.jsx'
import TeachersPage from './pages/admin/TeachersPage.jsx'
import StudentsPage from './pages/admin/StudentsPage.jsx'
import ImportStudentsPage from './pages/admin/ImportStudentsPage.jsx'
import ClassesPage from './pages/admin/ClassesPage.jsx'
import HolidaysPage from './pages/admin/HolidaysPage.jsx'
import SchoolSettingsPage from './pages/admin/SchoolSettingsPage.jsx'
import AttendanceReportsPage from './pages/admin/AttendanceReportsPage.jsx'
import TeacherLayout from './components/teacher/TeacherLayout.jsx'
import TeacherDashboardPage from './pages/teacher/TeacherDashboardPage.jsx'
import TakeAttendancePage from './pages/teacher/TakeAttendancePage.jsx'
import AttendanceHistoryPage from './pages/teacher/AttendanceHistoryPage.jsx'
import ClassRosterPage from './pages/teacher/ClassRosterPage.jsx'
import TeacherImportStudentsPage from './pages/teacher/ImportStudentsPage.jsx'
import ClassReportsPage from './pages/teacher/ClassReportsPage.jsx'
import TeacherProfilePage from './pages/teacher/TeacherProfilePage.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'

/**
 * Main Application Router with Authentication and Role Guards.
 *
 * Public Routes:
 * - / (Landing Page)
 *
 * Guest-Only Routes (redirects authenticated users to their role dashboard):
 * - /login
 * - /register
 *
 * Protected Admin Routes (nested under AdminLayout):
 * - /admin (Redirects to /admin/dashboard)
 * - /admin/dashboard (Overview > Dashboard)
 * - /admin/pending-approvals (People > Pending Approvals)
 * - /admin/teachers (People > Teachers)
 * - /admin/students (People > Students)
 * - /admin/import-students (People > Import Students)
 * - /admin/classes (School > Classes)
 * - /admin/holidays (School > Holidays)
 * - /admin/settings (School > Settings)
 * - /admin/reports (Reports > Attendance Reports)
 *
 * Protected Teacher Routes:
 * - /teacher/dashboard (Teacher role only — shared route for all teachers)
 *
 * Fallback Route:
 * - * (404 Page Not Found)
 */
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Landing Page */}
          <Route path="/" element={<LandingPage />} />

          {/* Guest-only routes */}
          <Route element={<PublicOnlyRoute />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<SignupPage />} />
          </Route>

          {/* Admin Protected Routes */}
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
              <Route path="/admin/pending-approvals" element={<PendingApprovalsPage />} />
              <Route path="/admin/teachers" element={<TeachersPage />} />
              <Route path="/admin/students" element={<StudentsPage />} />
              <Route path="/admin/import-students" element={<ImportStudentsPage />} />
              <Route path="/admin/classes" element={<ClassesPage />} />
              <Route path="/admin/holidays" element={<HolidaysPage />} />
              <Route path="/admin/settings" element={<SchoolSettingsPage />} />
              <Route path="/admin/reports" element={<AttendanceReportsPage />} />
              <Route path="/admin/attendance-history" element={<AttendanceHistoryPage roleOverride="admin" />} />
            </Route>
          </Route>

          {/* Teacher Protected Routes */}
          <Route element={<ProtectedRoute allowedRoles={['teacher']} />}>
            <Route element={<TeacherLayout />}>
              <Route path="/teacher" element={<Navigate to="/teacher/dashboard" replace />} />
              <Route path="/teacher/dashboard" element={<TeacherDashboardPage />} />
              <Route path="/teacher/today" element={<Navigate to="/teacher/dashboard" replace />} />
              <Route path="/teacher/take-attendance" element={<TakeAttendancePage />} />
              <Route path="/teacher/attendance-history" element={<AttendanceHistoryPage />} />
              <Route path="/teacher/roster" element={<ClassRosterPage />} />
              <Route path="/teacher/import-students" element={<TeacherImportStudentsPage />} />
              <Route path="/teacher/reports" element={<ClassReportsPage />} />
              <Route path="/teacher/profile" element={<TeacherProfilePage />} />
            </Route>
          </Route>

          {/* 404 Fallback */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
