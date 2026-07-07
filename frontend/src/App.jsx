import { lazy, Suspense, useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import { Menu } from 'lucide-react'
import Sidebar from './components/Sidebar'
import ProtectedRoute from './components/ProtectedRoute'
import { useAuth } from './context/AuthContext'

const Login = lazy(() => import('./pages/Login'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const PlatformDashboard = lazy(() => import('./pages/PlatformDashboard'))
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
  const [mobileOpen, setMobileOpen] = useState(false)
  return (
    <div className="flex">
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="flex-1 min-w-0">
        {/* Mobile top bar — hidden on desktop, gives access to the sidebar drawer */}
        <div className="lg:hidden flex items-center gap-3 p-4 border-b border-ink/10 bg-white sticky top-0 z-20">
          <button onClick={() => setMobileOpen(true)} className="text-ink">
            <Menu size={22} />
          </button>
          <span className="font-display font-bold text-ink">OS2 PlotPro</span>
        </div>
        <main className="p-4 sm:p-6 lg:p-8 min-h-screen overflow-y-auto bg-parchment">
          <Suspense fallback={<PageLoader />}>{children}</Suspense>
        </main>
      </div>
    </div>
  )
}

function HomeRoute() {
  const { user } = useAuth()
  return user?.role === 'platform_admin' ? <PlatformDashboard /> : <Dashboard />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={
        <Suspense fallback={<PageLoader />}><Login /></Suspense>
      } />
      <Route path="/" element={
        <ProtectedRoute><AdminLayout><HomeRoute /></AdminLayout></ProtectedRoute>
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
