import { useEffect, useState } from 'react'
import api from '../api/client'

export default function Bookings() {
  const [bookings, setBookings] = useState([])
  const [plots, setPlots] = useState([])
  const [form, setForm] = useState({
    plot_id: '', customer_name: '', customer_phone: '', token_advance: '',
  })
  const [open, setOpen] = useState(false)

  const loadBookings = () => api.get('/bookings').then((res) => setBookings(res.data))
  const loadPlots = () => api.get('/plots', { params: { status_filter: 'available' } }).then((res) => setPlots(res.data))

  useEffect(() => { loadBookings(); loadPlots() }, [])

  const submit = async (e) => {
    e.preventDefault()
    await api.post('/bookings', {
      plot_id: form.plot_id,
      customer: { full_name: form.customer_name, phone: form.customer_phone },
      token_advance: parseFloat(form.token_advance || 0),
    })
    setForm({ plot_id: '', customer_name: '', customer_phone: '', token_advance: '' })
    setOpen(false)
    loadBookings()
    loadPlots()
  }

  const cancelBooking = async (id) => {
    const reason = window.prompt('Cancellation reason?')
    if (!reason) return
    await api.post(`/bookings/${id}/cancel`, { reason })
    loadBookings()
    loadPlots()
  }

  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-widest text-brand-600 mb-1">Sales</p>
      <h1 className="font-display text-3xl font-semibold text-ink mb-4">Bookings</h1>

      {!open ? (
        <button onClick={() => setOpen(true)} className="text-sm text-brand-700 font-medium hover:underline mb-4">
          + New booking
        </button>
      ) : (
        <form onSubmit={submit} className="bg-white border doc-card p-4 flex flex-wrap gap-2 mb-4 items-end">
          <select required value={form.plot_id} onChange={(e) => setForm({ ...form, plot_id: e.target.value })}
            className="border border-ink/15 px-3 py-2 text-sm">
            <option value="">Select available plot</option>
            {plots.map((p) => <option key={p.id} value={p.id}>{p.plot_number} — ₹{p.total_price.toLocaleString('en-IN')}</option>)}
          </select>
          <input placeholder="Customer name" required value={form.customer_name}
            onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
            className="border border-ink/15 px-3 py-2 text-sm" />
          <input placeholder="Phone" required value={form.customer_phone}
            onChange={(e) => setForm({ ...form, customer_phone: e.target.value })}
            className="border border-ink/15 px-3 py-2 text-sm" />
          <input placeholder="Token advance" type="number" value={form.token_advance}
            onChange={(e) => setForm({ ...form, token_advance: e.target.value })}
            className="border border-ink/15 px-3 py-2 text-sm w-32" />
          <button type="submit" className="bg-brand-600 text-white px-4 py-2 text-sm">Book</button>
          <button type="button" onClick={() => setOpen(false)} className="text-sm text-gray-500 px-2">Cancel</button>
        </form>
      )}

      <div className="doc-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-ink/5 text-ink/50 text-left font-mono text-xs uppercase tracking-wide">
            <tr>
              <th className="px-4 py-2">Booking ID</th>
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
                <td className="px-4 py-2 text-ink font-mono">₹{b.total_price.toLocaleString('en-IN')}</td>
                <td className="px-4 py-2 text-ink/60 font-mono">₹{b.token_advance.toLocaleString('en-IN')}</td>
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
              <tr><td colSpan="5" className="px-4 py-6 text-center text-ink/40">No bookings yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
