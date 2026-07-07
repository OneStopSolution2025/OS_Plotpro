import { Link, useLocation } from 'react-router-dom'
import { useCustomerAuth } from '../context/CustomerAuthContext'

export default function Header() {
  const { customer, logout } = useCustomerAuth()
  const location = useLocation()

  return (
    <header className="bg-ink px-6 py-4 flex items-center justify-between print:hidden">
      <div className="flex items-center gap-6">
        <Link to="/" className="font-display text-xl font-semibold text-white">My Plot</Link>
        <nav className="hidden sm:flex gap-4 text-sm">
          <Link to="/" className={location.pathname === '/' ? 'text-brass-400' : 'text-white/60 hover:text-white'}>
            My Plots
          </Link>
          <Link to="/support" className={location.pathname === '/support' ? 'text-brass-400' : 'text-white/60 hover:text-white'}>
            Support
          </Link>
        </nav>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-white/70 hidden sm:inline">{customer?.full_name}</span>
        <button onClick={logout} className="text-sm text-rust-400 hover:text-rust-500">Log out</button>
      </div>
    </header>
  )
}
