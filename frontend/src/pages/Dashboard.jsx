import { useEffect, useState } from 'react'
import api from '../api/client'

function StatCard({ label, value, sub }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
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
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Plots" value={stats.plots} />
        <StatCard label="Available Plots" value={stats.available} sub="Ready to sell" />
        <StatCard label="Open Enquiries" value={stats.enquiries} />
        <StatCard label="Total Bookings" value={stats.bookings} />
      </div>

      <div className="mt-8 bg-white border border-gray-200 rounded-2xl p-6">
        <h2 className="font-semibold text-gray-900 mb-2">Quick links</h2>
        <p className="text-sm text-gray-500">
          Use the sidebar to manage projects &amp; plots, track enquiries through to booking,
          generate EMI schedules, and manage staff and legal documents.
        </p>
      </div>
    </div>
  )
}
