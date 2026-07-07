import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const links = [
  { to: '/', label: 'Dashboard', icon: '🏠' },
  { to: '/projects', label: 'Projects & Plots', icon: '🗺️' },
  { to: '/enquiries', label: 'Enquiries', icon: '📞' },
  { to: '/bookings', label: 'Bookings', icon: '📝' },
  { to: '/emi', label: 'EMI & Payments', icon: '💳' },
  { to: '/staff', label: 'Staff', icon: '👥' },
  { to: '/documents', label: 'Legal Documents', icon: '📄' },
]

export default function Sidebar() {
  const { user, logout } = useAuth()

  return (
    <div className="w-64 bg-ink h-screen flex flex-col border-r border-black/20">
      <div className="p-5 border-b border-white/10">
        <h1 className="font-display text-2xl font-semibold text-white tracking-tight">OS2 PlotPro</h1>
        <p className="text-[11px] font-mono uppercase tracking-widest text-brass-400 mt-1">
          {user?.role?.replace('_', ' ')}
        </p>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 text-sm font-medium transition border-l-2 ${
                isActive
                  ? 'bg-white/10 text-brass-400 border-brass-400'
                  : 'text-white/60 hover:text-white hover:bg-white/5 border-transparent'
              }`
            }
          >
            <span className="opacity-80">{link.icon}</span>
            {link.label}
          </NavLink>
        ))}
      </nav>
      <div className="p-3 border-t border-white/10">
        <div className="text-sm text-white/80 px-3 mb-2 truncate font-medium">{user?.full_name}</div>
        <button
          onClick={logout}
          className="w-full text-left px-3 py-2 text-sm text-rust-400 hover:bg-rust-500/10 rounded"
        >
          Log out
        </button>
      </div>
    </div>
  )
}
