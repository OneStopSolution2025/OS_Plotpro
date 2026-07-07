import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { useCustomerAuth } from '../context/CustomerAuthContext'

export default function Header() {
  const { customer, logout } = useCustomerAuth()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  const navItem = (to, label) => (
    <Link
      to={to}
      onClick={() => setMobileOpen(false)}
      className={location.pathname === to ? 'text-brand-400' : 'text-white/60 hover:text-white'}
    >
      {label}
    </Link>
  )

  return (
    <header className="bg-ink px-4 sm:px-6 py-4 print:hidden relative z-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-brand-500 rounded flex items-center justify-center font-display font-bold text-ink text-xs">P</div>
            <span className="font-display text-lg font-bold text-white">My Plot</span>
          </Link>
          <nav className="hidden sm:flex gap-5 text-sm">
            {navItem('/', 'Dashboard')}
            {navItem('/my-plots', 'My Plots')}
            {navItem('/support', 'Support')}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-white/70 hidden sm:inline">{customer?.full_name}</span>
          <button onClick={logout} className="hidden sm:inline text-sm text-rust-400 hover:text-rust-500">Log out</button>
          <button onClick={() => setMobileOpen(!mobileOpen)} className="sm:hidden text-white">
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav className="sm:hidden mt-4 flex flex-col gap-3 text-sm pb-2">
          {navItem('/', 'Dashboard')}
          {navItem('/my-plots', 'My Plots')}
          {navItem('/support', 'Support')}
          <button onClick={logout} className="text-left text-rust-400">Log out</button>
        </nav>
      )}
    </header>
  )
}
