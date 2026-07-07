import { Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import MyPlots from './pages/MyPlots'
import Ledger from './pages/Ledger'
import Receipt from './pages/Receipt'
import Support from './pages/Support'
import Header from './components/Header'
import ProtectedRoute from './components/ProtectedRoute'

function PortalLayout({ children }) {
  return (
    <div className="min-h-screen bg-parchment">
      <Header />
      {children}
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={
        <ProtectedRoute><PortalLayout><MyPlots /></PortalLayout></ProtectedRoute>
      } />
      <Route path="/ledger/:bookingId" element={
        <ProtectedRoute><PortalLayout><Ledger /></PortalLayout></ProtectedRoute>
      } />
      <Route path="/receipt/:bookingId" element={
        <ProtectedRoute><Receipt /></ProtectedRoute>
      } />
      <Route path="/support" element={
        <ProtectedRoute><PortalLayout><Support /></PortalLayout></ProtectedRoute>
      } />
    </Routes>
  )
}
