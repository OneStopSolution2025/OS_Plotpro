import { Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Projects from './pages/Projects'
import Enquiries from './pages/Enquiries'
import Bookings from './pages/Bookings'
import EMI from './pages/EMI'
import Staff from './pages/Staff'
import Documents from './pages/Documents'
import Sidebar from './components/Sidebar'
import ProtectedRoute from './components/ProtectedRoute'

function AdminLayout({ children }) {
  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 p-8 h-screen overflow-y-auto">{children}</main>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={
        <ProtectedRoute><AdminLayout><Dashboard /></AdminLayout></ProtectedRoute>
      } />
      <Route path="/projects" element={
        <ProtectedRoute><AdminLayout><Projects /></AdminLayout></ProtectedRoute>
      } />
      <Route path="/enquiries" element={
        <ProtectedRoute><AdminLayout><Enquiries /></AdminLayout></ProtectedRoute>
      } />
      <Route path="/bookings" element={
        <ProtectedRoute><AdminLayout><Bookings /></AdminLayout></ProtectedRoute>
      } />
      <Route path="/emi" element={
        <ProtectedRoute><AdminLayout><EMI /></AdminLayout></ProtectedRoute>
      } />
      <Route path="/staff" element={
        <ProtectedRoute><AdminLayout><Staff /></AdminLayout></ProtectedRoute>
      } />
      <Route path="/documents" element={
        <ProtectedRoute><AdminLayout><Documents /></AdminLayout></ProtectedRoute>
      } />
    </Routes>
  )
}
