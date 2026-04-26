import { Routes, Route } from 'react-router'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Pending from './pages/Pending'
import AdminLayout from './components/AdminLayout'
import AdminOverview from './pages/AdminOverview'
import AdminApprovals from './pages/AdminApprovals'
import AdminUsers from './pages/AdminUsers'
import CoachDashboard from './pages/CoachDashboard'
import CoachProfile from './pages/CoachProfile'
import CoachProfileEdit from './pages/CoachProfileEdit'
import AdminEnrollments from './pages/AdminEnrollments'
import StudentDashboard from './pages/StudentDashboard'
import StudentProfileEdit from './pages/StudentProfileEdit'
import CoachStudents from './pages/CoachStudents'
import CoachSchedule from './pages/CoachSchedule'
import CoachBookings from './pages/CoachBookings'
import StudentBooking from './pages/StudentBooking'
import ParentDashboard from './pages/ParentDashboard'
import ParentAddChild from './pages/ParentAddChild'
import ParentProfileEdit from './pages/ParentProfileEdit'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import NotFound from './pages/NotFound'
import ProtectedRoute from './components/ProtectedRoute'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/pending" element={<ProtectedRoute><Pending /></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/student" element={<ProtectedRoute><StudentDashboard /></ProtectedRoute>} />
      <Route path="/student/profile/edit" element={<ProtectedRoute><StudentProfileEdit /></ProtectedRoute>} />
      <Route path="/coach" element={<ProtectedRoute><CoachDashboard /></ProtectedRoute>} />
      <Route path="/coach/profile" element={<ProtectedRoute><CoachProfile /></ProtectedRoute>} />
      <Route path="/coach/profile/edit" element={<ProtectedRoute><CoachProfileEdit /></ProtectedRoute>} />
      <Route path="/coach/students" element={<ProtectedRoute><CoachStudents /></ProtectedRoute>} />
      <Route path="/coach/schedule" element={<ProtectedRoute><CoachSchedule /></ProtectedRoute>} />
      <Route path="/coach/bookings" element={<ProtectedRoute><CoachBookings /></ProtectedRoute>} />
      <Route path="/student/booking" element={<ProtectedRoute><StudentBooking /></ProtectedRoute>} />
      <Route path="/parent" element={<ProtectedRoute><ParentDashboard /></ProtectedRoute>} />
      <Route path="/parent/add-child" element={<ProtectedRoute><ParentAddChild /></ProtectedRoute>} />
      <Route path="/parent/profile/edit" element={<ProtectedRoute><ParentProfileEdit /></ProtectedRoute>} />

      <Route path="*" element={<NotFound />} />

      {/* Admin — shared layout with sidebar */}
      <Route element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
        <Route path="/admin" element={<AdminOverview />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/approvals" element={<AdminApprovals />} />
        <Route path="/admin/enrollments" element={<AdminEnrollments />} />
      </Route>
    </Routes>
  )
}
