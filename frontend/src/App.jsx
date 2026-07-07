import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import ProtectedRoute from './components/ProtectedRoute'

// Route-level code splitting — each page (and its dependencies, like
// recharts on Dashboard) only downloads when the user actually visits it,
// instead of all bundling into one 690KB file loaded upfront on login.
const Login = lazy(() => import('./pages/Login'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Projects = lazy(() => import('./pages/Projects'))
const Enquiries = lazy(() => import('./pages/Enquiries'))
const Bookings = lazy(() => import('./pages/Bookings'))
const EMI = lazy(() => import('./pages/EMI'))
const Staff = lazy(() => import('./pages/Staff'))
const Documents = lazy(() => import('./pages/Documents'))
const SupportTickets = lazy(() => import('./pages/SupportTickets'))
const Tenants = lazy(() => import('./pages/Tenants'))

function PageLoader() {
  return <div className="p-8 text-ink/40 text-sm">Loading...</div>
}

function AdminLayout({ children }) {
  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 p-8 h-screen overflow-y-auto bg-parchment">
        <Suspense fallback={<PageLoader />}>{children}</Suspense>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={
        <Suspense fallback={<PageLoader />}><Login /></Suspense>
      } />
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
      <Route path="/support" element={
        <ProtectedRoute><AdminLayout><SupportTickets /></AdminLayout></ProtectedRoute>
      } />
      <Route path="/tenants" element={
        <ProtectedRoute><AdminLayout><Tenants /></AdminLayout></ProtectedRoute>
      } />
    </Routes>
  )
}
