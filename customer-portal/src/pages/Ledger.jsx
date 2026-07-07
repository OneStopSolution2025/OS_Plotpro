import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../api/client'

const INSTALLMENT_COLORS = {
  paid: 'text-brand-600',
  pending: 'text-ink/50',
  overdue: 'text-rust-500',
  waived: 'text-brass-600',
}

export default function Ledger() {
  const { bookingId } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get(`/customer-auth/my-ledger/${bookingId}`)
      .then((res) => setData(res.data))
      .catch(() => setError('Could not load this booking.'))
      .finally(() => setLoading(false))
  }, [bookingId])

  if (loading) return <div className="p-6 text-ink/50 text-sm">Loading...</div>
  if (error) return <div className="p-6 text-rust-500 text-sm">{error}</div>

  const totalDue = data.installments.reduce((sum, i) => sum + i.amount_due, 0)
  const totalPaid = data.payments.reduce((sum, p) => sum + p.amount, 0)

  return (
    <div className="p-6 max-w-3xl mx-auto bg-parchment min-h-[calc(100vh-64px)]">
      <Link to="/" className="text-sm text-brand-600 hover:underline">← Back to my plots</Link>
      <p className="font-mono text-xs uppercase tracking-widest text-brand-600 mt-3 mb-1">Booking Detail</p>
      <h1 className="font-display text-2xl font-semibold text-ink mb-4">EMI Schedule & Payments</h1>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="doc-card p-4">
          <p className="text-xs font-mono uppercase tracking-widest text-ink/50">Total Scheduled</p>
          <p className="text-lg font-mono font-medium text-ink mt-1">₹{totalDue.toLocaleString('en-IN')}</p>
        </div>
        <div className="doc-card p-4">
          <p className="text-xs font-mono uppercase tracking-widest text-ink/50">Total Paid</p>
          <p className="text-lg font-mono font-medium text-brand-600 mt-1">₹{totalPaid.toLocaleString('en-IN')}</p>
        </div>
      </div>

      <div className="doc-card overflow-hidden mb-6">
        <div className="px-5 py-3 border-b border-ink/10 font-display font-medium text-ink text-sm">Installment Schedule</div>
        <table className="w-full text-sm">
          <thead className="bg-ink/5 text-ink/50 text-left font-mono text-xs uppercase tracking-wide">
            <tr>
              <th className="px-5 py-2">#</th>
              <th className="px-5 py-2">Due date</th>
              <th className="px-5 py-2">Amount</th>
              <th className="px-5 py-2">Status</th>
            </tr>
          </thead>
          <tbody className="font-mono">
            {data.installments.map((i) => (
              <tr key={i.number} className="border-t border-ink/10">
                <td className="px-5 py-2">{i.number}</td>
                <td className="px-5 py-2">{i.due_date}</td>
                <td className="px-5 py-2">₹{i.amount_due.toLocaleString('en-IN')}</td>
                <td className="px-5 py-2">
                  <span className={`record-tag ${INSTALLMENT_COLORS[i.status] || ''}`}>
                    {i.status}
                  </span>
                </td>
              </tr>
            ))}
            {data.installments.length === 0 && (
              <tr><td colSpan="4" className="px-5 py-6 text-center text-ink/40 font-sans">No schedule generated yet</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="doc-card overflow-hidden">
        <div className="px-5 py-3 border-b border-ink/10 font-display font-medium text-ink text-sm">Payment History</div>
        <table className="w-full text-sm">
          <thead className="bg-ink/5 text-ink/50 text-left font-mono text-xs uppercase tracking-wide">
            <tr>
              <th className="px-5 py-2">Receipt No.</th>
              <th className="px-5 py-2">Amount</th>
              <th className="px-5 py-2">Mode</th>
            </tr>
          </thead>
          <tbody className="font-mono">
            {data.payments.map((p, idx) => (
              <tr key={idx} className="border-t border-ink/10">
                <td className="px-5 py-2 text-xs">{p.receipt_number}</td>
                <td className="px-5 py-2">₹{p.amount.toLocaleString('en-IN')}</td>
                <td className="px-5 py-2 text-ink/60">{p.mode}</td>
              </tr>
            ))}
            {data.payments.length === 0 && (
              <tr><td colSpan="3" className="px-5 py-6 text-center text-ink/40 font-sans">No payments recorded yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
