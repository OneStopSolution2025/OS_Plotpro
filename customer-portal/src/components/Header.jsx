import { Link } from 'react-router-dom'
import { useCustomerAuth } from '../context/CustomerAuthContext'

export default function Header() {
  const { customer, logout } = useCustomerAuth()

  return (
    <header className="bg-ink px-6 py-4 flex items-center justify-between">
      <Link to="/" className="font-display text-xl font-semibold text-white">My Plot</Link>
      <div className="flex items-center gap-4">
        <span className="text-sm text-white/70 hidden sm:inline">{customer?.full_name}</span>
        <button onClick={logout} className="text-sm text-rust-400 hover:text-rust-500">Log out</button>
      </div>
    </header>
  )
}
