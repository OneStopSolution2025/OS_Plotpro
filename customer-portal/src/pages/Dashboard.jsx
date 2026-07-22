import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, AlertTriangle, Clock, ArrowRight, LifeBuoy, Wallet, TrendingUp } from 'lucide-react'
import api from '../api/client'
import { useCustomerAuth } from '../context/CustomerAuthContext'
import { formatMoney } from '../utils/currency'

export default function Dashboard() {
  const [bookings, setBookings] = useState([])
  const [ledgers, setLedgers] = useState({})
  const [loading, setLoading] = useState(true)
  const { customer } = useCustomerAuth()
  const currency = customer?.tenant_currency || 'INR'

  useEffect(() => {
    api.get('/customer-auth/my-bookings').then(async (res) => {
      setBookings(res.data)
      const entries = await Promise.all(
        res.data.map((b) => api.get(`/customer-auth/my-ledger/${b.id}`).then((r) => [b.id, r.data]).catch(() => [b.id, null]))
      )
      setLedgers(Object.fromEntries(entries))
      setLoading(false)
    })
  }, [])

  if (loading) return <div className="p-6 text-ink/50 text-sm">Loading your dashboard...</div>

  const totalPaid = Object.values(ledgers).reduce((sum, l) => sum + (l?.payments.reduce((s, p) => s + p.amount, 0) || 0), 0)
  const totalDue = Object.values(ledgers).reduce((sum, l) => sum + (l?.installments.reduce((s, i) => s + i.amount_due, 0) || 0), 0)

  const overdueItems = []
  const upcomingItems = []
  Object.entries(ledgers).forEach(([bookingId, ledger]) => {
    if (!ledger) return
    ledger.installments.forEach((i) => {
      if (i.status === 'overdue') overdueItems.push({ bookingId, ...i })
      if (i.status === 'pending') {
        const daysUntil = (new Date(i.due_date) - new Date()) / (1000 * 60 * 60 * 24)
        if (daysUntil <= 7 && daysUntil >= 0) upcomingItems.push({ bookingId, ...i })
      }
    })
  })

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <p className="text-xs uppercase tracking-wide text-brand-600 font-medium mb-1">My Account</p>
      <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink mb-5">Dashboard</h1>

      {overdueItems.length > 0 && (
        <div className="doc-card p-4 mb-3 border-l-4 border-rust-500 flex items-start gap-3">
          <AlertTriangle className="text-rust-500 flex-shrink-0 mt-0.5" size={18} />
          <div>
            <p className="font-medium text-ink text-sm">{overdueItems.length} overdue installment{overdueItems.length > 1 ? 's' : ''}</p>
            <p className="text-sm text-ink/60">Please clear these as soon as possible to avoid late fees.</p>
          </div>
        </div>
      )}
      {upcomingItems.length > 0 && (
        <div className="doc-card p-4 mb-5 border-l-4 border-brand-500 flex items-start gap-3">
          <Clock className="text-brand-600 flex-shrink-0 mt-0.5" size={18} />
          <div>
            <p className="font-medium text-ink text-sm">{upcomingItems.length} installment{upcomingItems.length > 1 ? 's' : ''} due within 7 days</p>
            <p className="text-sm text-ink/60">Next due: {upcomingItems[0].due_date}, {formatMoney(upcomingItems[0].amount_due, currency)}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="doc-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center flex-shrink-0">
            <TrendingUp size={18} />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-ink/50">Total Paid</p>
            <p className="font-mono text-lg font-semibold text-brand-600 mt-0.5">{formatMoney(totalPaid, currency)}</p>
          </div>
        </div>
        <div className="doc-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-ink/5 text-ink/60 flex items-center justify-center flex-shrink-0">
            <Wallet size={18} />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-ink/50">Balance Due</p>
            <p className="font-mono text-lg font-semibold text-ink mt-0.5">{formatMoney(totalDue - totalPaid, currency)}</p>
          </div>
        </div>
      </div>

      <p className="font-display font-semibold text-ink mb-2">My Plots</p>
      <div className="space-y-3 mb-6">
        {bookings.map((b) => {
          const ledger = ledgers[b.id]
          const paid = ledger?.payments.reduce((s, p) => s + p.amount, 0) || 0
          const pct = b.total_price > 0 ? Math.min(100, Math.round((paid / b.total_price) * 100)) : 0
          return (
            <Link key={b.id} to={`/ledger/${b.id}`} className="flex gap-4 doc-card p-4 hover:border-brand-400 transition group">
              {b.image_url ? (
                <img src={b.image_url} alt={b.plot_number} className="w-20 h-20 object-cover rounded-lg flex-shrink-0" />
              ) : (
                <div className="w-20 h-20 bg-ink/5 rounded-lg flex items-center justify-center flex-shrink-0">
                  <MapPin size={20} className="text-ink/20" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs text-ink/40 font-mono">Plot {b.plot_number} · {b.project_name}</p>
                <p className="font-mono font-semibold text-ink mt-1">{formatMoney(b.total_price, currency)}</p>
                <div className="h-1.5 bg-ink/5 rounded-full overflow-hidden mt-2">
                  <div className="h-full bg-brand-500 rounded-full" style={{ width: `${pct}%` }} />
                </div>
                <p className="text-xs text-ink/40 mt-1">{pct}% paid</p>
              </div>
              <ArrowRight size={16} className="text-ink/30 group-hover:text-brand-600 group-hover:translate-x-1 transition-all flex-shrink-0 self-center" />
            </Link>
          )
        })}
        {bookings.length === 0 && (
          <div className="doc-card p-8 text-center text-ink/40 text-sm">No bookings on your account yet.</div>
        )}
      </div>

      <Link to="/support" className="flex items-center gap-2 doc-card p-4 hover:border-brand-400 transition text-sm text-ink">
        <LifeBuoy size={16} className="text-brand-600" /> Need help? Raise a support request
      </Link>
    </div>
  )
}
