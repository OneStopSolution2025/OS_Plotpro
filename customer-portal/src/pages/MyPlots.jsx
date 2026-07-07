import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/client'

const STATUS_LABELS = {
  token_paid: { label: 'Token Paid', color: 'bg-amber-100 text-amber-700' },
  confirmed: { label: 'Confirmed', color: 'bg-emerald-100 text-emerald-700' },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700' },
  registered: { label: 'Registered', color: 'bg-blue-100 text-blue-700' },
}

export default function MyPlots() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/customer-auth/my-bookings')
      .then((res) => setBookings(res.data))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-6 text-gray-500 text-sm">Loading your plots...</div>

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-xl font-bold text-gray-900 mb-4">My Plots</h1>

      {bookings.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center text-gray-400 text-sm">
          No bookings found on your account yet.
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => {
            const status = STATUS_LABELS[b.status] || { label: b.status, color: 'bg-gray-100 text-gray-600' }
            return (
              <Link
                key={b.id}
                to={`/ledger/${b.id}`}
                className="block bg-white border border-gray-200 rounded-2xl p-5 hover:border-brand-400 transition"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-400 font-mono">Booking #{b.id.slice(0, 8)}</p>
                    <p className="text-lg font-semibold text-gray-900 mt-1">
                      ₹{b.total_price.toLocaleString('en-IN')}
                    </p>
                  </div>
                  <span className={`text-xs px-3 py-1 rounded-full font-medium ${status.color}`}>
                    {status.label}
                  </span>
                </div>
                <p className="text-sm text-brand-700 mt-3">View EMI schedule & payment history →</p>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
