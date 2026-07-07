import { Link } from 'react-router-dom'
import { useCustomerAuth } from '../context/CustomerAuthContext'

export default function Header() {
  const { customer, logout } = useCustomerAuth()

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
      <Link to="/" className="text-lg font-bold text-brand-700">My Plot</Link>
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600 hidden sm:inline">{customer?.full_name}</span>
        <button onClick={logout} className="text-sm text-red-600 hover:underline">Log out</button>
      </div>
    </header>
  )
}
