import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { MapPinned, Phone, FileSignature, Plus, Clock } from 'lucide-react'
import api from '../api/client'
import { useToast } from '../context/ToastContext'
import { errorMessage } from '../utils/errors'
import { formatMoney } from '../utils/currency'
import { useAuth } from '../context/AuthContext'

function StatCard({ icon: Icon, label, value, sub }) {
  return (
    <div className="doc-card p-5 flex items-center gap-4">
      <div className="w-11 h-11 rounded-lg bg-brand-500/15 flex items-center justify-center text-brand-600 flex-shrink-0">
        <Icon size={20} />
      </div>
      <div>
        <p className="text-xs uppercase tracking-wide text-ink/50">{label}</p>
        <p className="font-mono text-2xl font-semibold text-ink mt-0.5">{value}</p>
        {sub && <p className="text-xs text-ink/40 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

function QuickAction({ to, icon: Icon, label }) {
  return (
    <Link to={to} className="flex items-center gap-2 doc-card px-4 py-3 hover:border-brand-400 transition text-sm font-medium text-ink">
      <div className="w-7 h-7 rounded-md bg-brand-500/15 text-brand-600 flex items-center justify-center">
        <Icon size={14} />
      </div>
      {label}
    </Link>
  )
}

const STATUS_CHART_COLORS = {
  available: '#F0A500',
  hold: '#B5DE00',
  booked: '#D6362A',
  sold: '#0D0D0D',
  registered: '#8A8A80',
}

export default function Dashboard() {
  const { user } = useAuth()
  const currency = user?.tenant_currency || 'INR'
  const [stats, setStats] = useState({ plots: 0, enquiries: 0, bookings: 0, available: 0 })
  const [statusBreakdown, setStatusBreakdown] = useState([])
  const [recentActivity, setRecentActivity] = useState([])
  const [loading, setLoading] = useState(true)
  const { showToast } = useToast()

  useEffect(() => {
    Promise.all([
      api.get('/plots'),
      api.get('/enquiries'),
      api.get('/bookings'),
    ]).then(([plots, enquiries, bookings]) => {
      setStats({
        plots: plots.data.length,
        available: plots.data.filter((p) => p.status === 'available').length,
        enquiries: enquiries.data.length,
        bookings: bookings.data.length,
      })

      const counts = {}
      plots.data.forEach((p) => { counts[p.status] = (counts[p.status] || 0) + 1 })
      setStatusBreakdown(Object.entries(counts).map(([status, count]) => ({ name: status, value: count })))

      // Real recent activity — latest enquiries and bookings, merged and sorted,
      // instead of a placeholder chart with no real per-month data behind it.
      const activity = [
        ...enquiries.data.slice(0, 5).map((e) => ({
          type: 'enquiry', label: e.customer_name, detail: e.stage, id: e.id,
        })),
        ...bookings.data.slice(0, 5).map((b) => ({
          type: 'booking', label: b.customer_name || 'Booking', detail: formatMoney(b.total_price, currency), id: b.id,
        })),
      ].slice(0, 6)
      setRecentActivity(activity)
    }).catch((err) => showToast(errorMessage(err, 'Could not load dashboard data'), 'error'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-brand-600 font-medium mb-1">Overview</p>
      <h1 className="font-display text-3xl font-bold text-ink mb-5">Dashboard</h1>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <QuickAction to="/enquiries" icon={Phone} label="New Enquiry" />
        <QuickAction to="/bookings" icon={FileSignature} label="New Booking" />
        <QuickAction to="/projects" icon={MapPinned} label="Add Plot" />
        <QuickAction to="/projects" icon={Plus} label="New Project" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={MapPinned} label="Total Plots" value={stats.plots} />
        <StatCard icon={MapPinned} label="Available" value={stats.available} sub="Ready to sell" />
        <StatCard icon={Phone} label="Open Enquiries" value={stats.enquiries} />
        <StatCard icon={FileSignature} label="Total Bookings" value={stats.bookings} />
      </div>

      {!loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="doc-card p-5">
            <h2 className="font-display font-semibold text-ink mb-3 text-sm">Plot Inventory Breakdown</h2>
            {statusBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={statusBreakdown} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
                    {statusBreakdown.map((entry, i) => (
                      <Cell key={i} fill={STATUS_CHART_COLORS[entry.name] || '#8A8A80'} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-ink/40 py-14 text-center">No plots yet — add your first project and plot.</p>
            )}
            <div className="flex flex-wrap gap-3 mt-2 text-xs font-mono">
              {statusBreakdown.map((s) => (
                <div key={s.name} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: STATUS_CHART_COLORS[s.name] || '#8A8A80' }} />
                  {s.name} ({s.value})
                </div>
              ))}
            </div>
          </div>

          <div className="doc-card p-5">
            <h2 className="font-display font-semibold text-ink mb-3 text-sm">Recent Activity</h2>
            {recentActivity.length > 0 ? (
              <div className="space-y-2">
                {recentActivity.map((a, i) => (
                  <div key={i} className="flex items-center gap-3 py-1.5 border-b border-ink/5 last:border-0">
                    <div className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 ${
                      a.type === 'booking' ? 'bg-brand-500/15 text-brand-600' : 'bg-ink/5 text-ink/50'
                    }`}>
                      {a.type === 'booking' ? <FileSignature size={13} /> : <Phone size={13} />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-ink truncate">{a.label}</p>
                    </div>
                    <span className="text-xs text-ink/40 font-mono flex-shrink-0">{a.detail}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-ink/40 py-14 text-center">No activity yet.</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
