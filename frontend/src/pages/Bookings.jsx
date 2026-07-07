import { useEffect, useState } from 'react'
import api from '../api/client'
import { formatMoney } from '../utils/currency'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { errorMessage } from '../utils/errors'

export default function Bookings() {
  const { user } = useAuth()
  const currency = user?.tenant_currency || 'INR'
  const [bookings, setBookings] = useState([])
  const [plots, setPlots] = useState([])
  const [search, setSearch] = useState('')
  const [form, setForm] = useState({
    plot_id: '', customer_name: '', customer_phone: '', token_advance: '',
  })
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const { showToast } = useToast()

  const loadBookings = () => {
    const params = search ? { search } : {}
    api.get('/bookings', { params }).then((res) => setBookings(res.data))
      .catch((err) => showToast(errorMessage(err, 'Could not load bookings'), 'error'))
  }
  const loadPlots = () => api.get('/plots', { params: { status_filter: 'available' } }).then((res) => setPlots(res.data))

  useEffect(() => { loadBookings() }, [search])
  useEffect(() => { loadPlots() }, [])

  const submit = async (e) => {
    e.preventDefault()
    if (submitting) return
    setSubmitting(true)
    try {
      await api.post('/bookings', {
        plot_id: form.plot_id,
        customer: { full_name: form.customer_name, phone: form.customer_phone },
        token_advance: parseFloat(form.token_advance || 0),
      })
      setForm({ plot_id: '', customer_name: '', customer_phone: '', token_advance: '' })
      setOpen(false)
      showToast('Booking created', 'success')
      loadBookings()
      loadPlots()
    } catch (err) {
      showToast(errorMessage(err, 'Could not create booking'), 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const cancelBooking = async (id) => {
    const reason = window.prompt('Cancellation reason?')
    if (!reason) return
    try {
      await api.post(`/bookings/${id}/cancel`, { reason })
      showToast('Booking cancelled', 'success')
      loadBookings()
      loadPlots()
    } catch (err) {
      showToast(errorMessage(err), 'error')
    }
  }

  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-widest text-brand-600 mb-1">Sales</p>
      <h1 className="font-display text-3xl font-semibold text-ink mb-4">Bookings</h1>

      <div className="flex items-center gap-2 mb-4">
        <input
          placeholder="Search by booking ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-ink/15 px-3 py-2 text-sm w-64 font-mono"
        />
        {!open && (
          <button onClick={() => setOpen(true)} className="text-sm text-brand-700 font-medium hover:underline ml-auto">
            + New booking
          </button>
        )}
      </div>

      {open && (
        <form onSubmit={submit} className="doc-card p-4 flex flex-wrap gap-2 mb-4 items-end">
          <select required value={form.plot_id} onChange={(e) => setForm({ ...form, plot_id: e.target.value })}
            className="border border-ink/15 px-3 py-2 text-sm">
            <option value="">Select available plot</option>
            {plots.map((p) => <option key={p.id} value={p.id}>{p.plot_number} — {formatMoney(p.total_price, currency)}</option>)}
          </select>
          <input placeholder="Customer name" required value={form.customer_name}
            onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
            className="border border-ink/15 px-3 py-2 text-sm" />
          <input placeholder="Phone" required value={form.customer_phone}
            onChange={(e) => setForm({ ...form, customer_phone: e.target.value })}
            className="border border-ink/15 px-3 py-2 text-sm font-mono" />
          <input placeholder="Token advance" type="number" value={form.token_advance}
            onChange={(e) => setForm({ ...form, token_advance: e.target.value })}
            className="border border-ink/15 px-3 py-2 text-sm w-32 font-mono" />
          <button type="submit" disabled={submitting} className="bg-brand-600 text-white px-4 py-2 text-sm disabled:opacity-60">
            {submitting ? 'Booking...' : 'Book'}
          </button>
          <button type="button" onClick={() => setOpen(false)} className="text-sm text-ink/50 px-2">Cancel</button>
        </form>
      )}

      <div className="doc-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-ink/5 text-ink/50 text-left font-mono text-xs uppercase tracking-wide">
            <tr>
              <th className="px-4 py-2">Booking ID</th>
              <th className="px-4 py-2">Customer</th>
              <th className="px-4 py-2">Plot</th>
              <th className="px-4 py-2">Total Price</th>
              <th className="px-4 py-2">Token Advance</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((b) => (
              <tr key={b.id} className="border-t border-ink/10">
                <td className="px-4 py-2 text-ink/50 font-mono text-xs">{b.id.slice(0, 8)}</td>
                <td className="px-4 py-2">
                  <p className="font-medium text-ink">{b.customer_name || '—'}</p>
                  <p className="text-xs text-ink/50 font-mono">{b.customer_phone || ''}</p>
                </td>
                <td className="px-4 py-2 text-ink/70 font-mono">{b.plot_number || '—'}</td>
                <td className="px-4 py-2 text-ink font-mono">{formatMoney(b.total_price, currency)}</td>
                <td className="px-4 py-2 text-ink/60 font-mono">{formatMoney(b.token_advance, currency)}</td>
                <td className="px-4 py-2">
                  <span className={`record-tag ${
                    b.status === 'cancelled' ? 'text-rust-500' : 'text-brand-600'
                  }`}>{b.status}</span>
                </td>
                <td className="px-4 py-2">
                  {b.status !== 'cancelled' && (
                    <button onClick={() => cancelBooking(b.id)} className="text-xs text-rust-500 hover:underline">Cancel</button>
                  )}
                </td>
              </tr>
            ))}
            {bookings.length === 0 && (
              <tr><td colSpan="7" className="px-4 py-6 text-center text-ink/40">No bookings found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
