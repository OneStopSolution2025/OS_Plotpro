import { NavLink } from 'react-router-dom'
import { LayoutDashboard, MapPinned, Phone, FileSignature, CreditCard, Users, FileText, LifeBuoy, Building2, LogOut, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const links = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/projects', label: 'Projects & Plots', icon: MapPinned },
  { to: '/enquiries', label: 'Enquiries', icon: Phone },
  { to: '/bookings', label: 'Bookings', icon: FileSignature },
  { to: '/emi', label: 'EMI & Payments', icon: CreditCard },
  { to: '/staff', label: 'Staff', icon: Users },
  { to: '/documents', label: 'Legal Documents', icon: FileText },
  { to: '/support', label: 'Support Tickets', icon: LifeBuoy },
]

const platformLinks = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/tenants', label: 'All Promoters', icon: Building2 },
  { to: '/support', label: 'Support Tickets', icon: LifeBuoy },
]

export default function Sidebar({ mobileOpen, onClose }) {
  const { user, logout } = useAuth()
  const isPlatformAdmin = user?.role === 'platform_admin'
  const navLinks = isPlatformAdmin ? platformLinks : links

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={onClose} />
      )}

      <div
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-ink h-screen flex flex-col border-r border-black/20 transition-transform duration-200 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-5 border-b border-white/10 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-brand-500 rounded flex items-center justify-center font-display font-bold text-ink text-sm">P</div>
              <h1 className="font-display text-xl font-bold text-white tracking-tight">OS2 PlotPro</h1>
            </div>
            <p className="text-[11px] uppercase tracking-widest text-brand-400 font-medium mt-2">
              {isPlatformAdmin ? 'Supreme Admin' : user?.role?.replace('_', ' ')}
            </p>
          </div>
          <button onClick={onClose} className="lg:hidden text-white/60 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-brand-500/15 text-brand-400'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`
              }
            >
              <link.icon size={16} strokeWidth={2} />
              {link.label}
            </NavLink>
          ))}

          {isPlatformAdmin && (
            <div className="mx-1 mt-4 p-3 rounded-lg bg-brand-500/10 border border-brand-500/20 text-xs text-white/60 leading-relaxed">
              This account manages promoter subscriptions and support only. To work on a
              specific promoter's plots, bookings, or staff, log in with that promoter's
              own admin email/password.
            </div>
          )}
        </nav>

        <div className="p-3 border-t border-white/10">
          <div className="text-sm text-white/80 px-3 mb-2 truncate font-medium">{user?.full_name}</div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 text-left px-3 py-2 rounded-lg text-sm text-rust-400 hover:bg-rust-500/10 transition"
          >
            <LogOut size={14} /> Log out
          </button>
        </div>
      </div>
    </>
  )
}
