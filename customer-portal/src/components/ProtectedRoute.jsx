import { Navigate } from 'react-router-dom'
import { useCustomerAuth } from '../context/CustomerAuthContext'

export default function ProtectedRoute({ children }) {
  const { customer, loading } = useCustomerAuth()

  if (loading) {
    return <div className="flex items-center justify-center h-screen text-gray-500">Loading...</div>
  }
  if (!customer) {
    return <Navigate to="/login" replace />
  }
  return children
}
