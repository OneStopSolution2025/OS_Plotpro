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
    <div className="w-64 bg-white border-r border-gray-200 h-screen flex flex-col">
      <div className="p-5 border-b border-gray-100">
        <h1 className="text-xl font-bold text-brand-700">OS2 PlotPro</h1>
        <p className="text-xs text-gray-400 mt-1">{user?.role?.replace('_', ' ')}</p>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
                isActive ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-50'
              }`
            }
          >
            <span>{link.icon}</span>
            {link.label}
          </NavLink>
        ))}
      </nav>
      <div className="p-3 border-t border-gray-100">
        <div className="text-sm text-gray-700 px-3 mb-2 truncate">{user?.full_name}</div>
        <button
          onClick={logout}
          className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
        >
          Log out
        </button>
      </div>
    </div>
  )
}
