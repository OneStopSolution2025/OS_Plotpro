import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, ArrowRight } from 'lucide-react'
import api from '../api/client'
import { useCustomerAuth } from '../context/CustomerAuthContext'
import { formatMoney } from '../utils/currency'

const STATUS_LABELS = {
  token_paid: { label: 'Token Paid', color: 'text-brass-600' },
  confirmed: { label: 'Confirmed', color: 'text-brand-600' },
  cancelled: { label: 'Cancelled', color: 'text-rust-500' },
  registered: { label: 'Registered', color: 'text-ink/60' },
}

export default function MyPlots() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const { customer } = useCustomerAuth()
  const currency = customer?.tenant_currency || 'INR'

  useEffect(() => {
    api.get('/customer-auth/my-bookings')
      .then((res) => setBookings(res.data))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-6 text-ink/50 text-sm">Loading your plots...</div>

  return (
    <div className="p-6 max-w-3xl mx-auto bg-parchment min-h-[calc(100vh-64px)]">
      <p className="font-mono text-xs uppercase tracking-widest text-brand-600 mb-1">Account</p>
      <h1 className="font-display text-2xl font-semibold text-ink mb-4">My Plots</h1>

      {bookings.length === 0 ? (
        <div className="doc-card p-8 text-center text-ink/40 text-sm">
          No bookings found on your account yet.
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => {
            const status = STATUS_LABELS[b.status] || { label: b.status, color: 'text-ink/50' }
            return (
              <Link
                key={b.id}
                to={`/ledger/${b.id}`}
                className="flex gap-4 doc-card p-4 hover:border-brand-500 transition group"
              >
                {b.image_url ? (
                  <img src={b.image_url} alt={b.plot_number} className="w-24 h-24 object-cover flex-shrink-0 border border-ink/10" />
                ) : (
                  <div className="w-24 h-24 bg-ink/5 flex items-center justify-center flex-shrink-0 border border-ink/10">
                    <MapPin size={24} className="text-ink/20" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-ink/40 font-mono">Plot {b.plot_number} · {b.project_name}</p>
                      <p className="text-lg font-mono font-medium text-ink mt-1">
                        {formatMoney(b.total_price, currency)}
                      </p>
                      {b.extent_sqft && <p className="text-xs text-ink/50 mt-0.5">{b.extent_sqft} sqft</p>}
                    </div>
                    <span className={`record-tag ${status.color}`}>{status.label}</span>
                  </div>
                  <p className="text-sm text-brand-600 mt-3 flex items-center gap-1 group-hover:gap-2 transition-all">
                    View EMI schedule & payment history <ArrowRight size={13} />
                  </p>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
