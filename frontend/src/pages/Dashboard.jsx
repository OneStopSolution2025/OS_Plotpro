import { useEffect, useState } from 'react'
import api from '../api/client'

function StatCard({ label, value, sub }) {
  return (
    <div className="doc-card p-5">
      <p className="text-xs font-mono uppercase tracking-widest text-ink/50">{label}</p>
      <p className="font-mono text-3xl font-medium text-ink mt-2">{value}</p>
      {sub && <p className="text-xs text-ink/40 mt-1">{sub}</p>}
    </div>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState({ plots: 0, enquiries: 0, bookings: 0, available: 0 })

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
    }).catch(() => {})
  }, [])

  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-widest text-brand-600 mb-1">Overview</p>
      <h1 className="font-display text-3xl font-semibold text-ink mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Plots" value={stats.plots} />
        <StatCard label="Available" value={stats.available} sub="Ready to sell" />
        <StatCard label="Open Enquiries" value={stats.enquiries} />
        <StatCard label="Total Bookings" value={stats.bookings} />
      </div>

      <div className="mt-8 doc-card p-6">
        <h2 className="font-display font-semibold text-ink mb-2">Quick links</h2>
        <p className="text-sm text-ink/60">
          Use the sidebar to manage projects &amp; plots, track enquiries through to booking,
          generate EMI schedules, and manage staff and legal documents.
        </p>
      </div>
    </div>
  )
}
