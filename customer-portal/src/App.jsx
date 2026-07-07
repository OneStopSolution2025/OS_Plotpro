import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import ProtectedRoute from './components/ProtectedRoute'

const Login = lazy(() => import('./pages/Login'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const MyPlots = lazy(() => import('./pages/MyPlots'))
const Ledger = lazy(() => import('./pages/Ledger'))
const Receipt = lazy(() => import('./pages/Receipt'))
const SaleAgreement = lazy(() => import('./pages/SaleAgreement'))
const Support = lazy(() => import('./pages/Support'))

function PageLoader() {
  return <div className="p-8 text-ink/40 text-sm">Loading...</div>
}

function PortalLayout({ children }) {
  return (
    <div className="min-h-screen bg-parchment">
      <Header />
      <Suspense fallback={<PageLoader />}>{children}</Suspense>
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
        <ProtectedRoute><PortalLayout><Dashboard /></PortalLayout></ProtectedRoute>
      } />
      <Route path="/my-plots" element={
        <ProtectedRoute><PortalLayout><MyPlots /></PortalLayout></ProtectedRoute>
      } />
      <Route path="/ledger/:bookingId" element={
        <ProtectedRoute><PortalLayout><Ledger /></PortalLayout></ProtectedRoute>
      } />
      <Route path="/receipt/:bookingId" element={
        <ProtectedRoute><Suspense fallback={<PageLoader />}><Receipt /></Suspense></ProtectedRoute>
      } />
      <Route path="/agreement/:bookingId" element={
        <ProtectedRoute><Suspense fallback={<PageLoader />}><SaleAgreement /></Suspense></ProtectedRoute>
      } />
      <Route path="/support" element={
        <ProtectedRoute><PortalLayout><Support /></PortalLayout></ProtectedRoute>
      } />
    </Routes>
  )
}
