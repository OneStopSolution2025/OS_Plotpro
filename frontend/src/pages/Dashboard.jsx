import { useEffect, useState } from 'react'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { errorMessage } from '../utils/errors'

function StatCard({ label, value, sub }) {
  return (
    <div className="doc-card p-5">
      <p className="text-xs font-mono uppercase tracking-widest text-ink/50">{label}</p>
      <p className="font-mono text-3xl font-medium text-ink mt-2">{value}</p>
      {sub && <p className="text-xs text-ink/40 mt-1">{sub}</p>}
    </div>
  )
}

const STATUS_CHART_COLORS = {
  available: '#2F6B4F',
  hold: '#B8863B',
  booked: '#A6432B',
  sold: '#16231F',
  registered: '#8A8A80',
}

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState({ plots: 0, enquiries: 0, bookings: 0, available: 0 })
  const [statusBreakdown, setStatusBreakdown] = useState([])
  const [salesTrend, setSalesTrend] = useState([])
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

      // Plot status breakdown for the pie chart
      const counts = {}
      plots.data.forEach((p) => { counts[p.status] = (counts[p.status] || 0) + 1 })
      setStatusBreakdown(Object.entries(counts).map(([status, count]) => ({ name: status, value: count })))

      // Bookings-by-month trend for the bar chart (last 6 months, from booking created_at if present, else fallback to count only)
      const monthMap = {}
      bookings.data.forEach((b) => {
        // booking list doesn't include created_at in the current schema response;
        // fall back to a flat total if per-month data isn't available
        monthMap['All bookings'] = (monthMap['All bookings'] || 0) + 1
      })
      setSalesTrend(Object.entries(monthMap).map(([month, count]) => ({ month, count })))
    }).catch((err) => showToast(errorMessage(err, 'Could not load dashboard data'), 'error'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-widest text-brand-600 mb-1">Overview</p>
      <h1 className="font-display text-3xl font-semibold text-ink mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Plots" value={stats.plots} />
        <StatCard label="Available" value={stats.available} sub="Ready to sell" />
        <StatCard label="Open Enquiries" value={stats.enquiries} />
        <StatCard label="Total Bookings" value={stats.bookings} />
      </div>

      {!loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <div className="doc-card p-5">
            <h2 className="font-display font-semibold text-ink mb-3 text-sm">Plot Inventory Breakdown</h2>
            {statusBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
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
              <p className="text-sm text-ink/40 py-16 text-center">No plot data yet</p>
            )}
            <div className="flex flex-wrap gap-3 mt-2 text-xs font-mono">
              {statusBreakdown.map((s) => (
                <div key={s.name} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5" style={{ background: STATUS_CHART_COLORS[s.name] || '#8A8A80' }} />
                  {s.name} ({s.value})
                </div>
              ))}
            </div>
          </div>

          <div className="doc-card p-5">
            <h2 className="font-display font-semibold text-ink mb-3 text-sm">Bookings Summary</h2>
            {salesTrend.length > 0 && salesTrend[0].count > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={salesTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#16231F1A" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fontFamily: 'IBM Plex Mono' }} />
                  <YAxis tick={{ fontSize: 12, fontFamily: 'IBM Plex Mono' }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#2F6B4F" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-ink/40 py-16 text-center">No bookings yet</p>
            )}
          </div>
        </div>
      )}

      <div className="doc-card p-6">
        <h2 className="font-display font-semibold text-ink mb-2">Quick links</h2>
        <p className="text-sm text-ink/60">
          Use the sidebar to manage projects &amp; plots, track enquiries through to booking,
          generate EMI schedules, and manage staff and legal documents.
        </p>
      </div>
    </div>
  )
}
