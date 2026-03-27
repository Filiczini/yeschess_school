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
import ProtectedRoute from './components/ProtectedRoute'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/pending" element={<ProtectedRoute><Pending /></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/coach" element={<ProtectedRoute><CoachDashboard /></ProtectedRoute>} />
      <Route path="/coach/profile" element={<ProtectedRoute><CoachProfile /></ProtectedRoute>} />
      <Route path="/coach/profile/edit" element={<ProtectedRoute><CoachProfileEdit /></ProtectedRoute>} />

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
