import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../api/client'

const INSTALLMENT_COLORS = {
  paid: 'bg-emerald-100 text-emerald-700',
  pending: 'bg-gray-100 text-gray-600',
  overdue: 'bg-red-100 text-red-700',
  waived: 'bg-blue-100 text-blue-700',
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

  if (loading) return <div className="p-6 text-gray-500 text-sm">Loading...</div>
  if (error) return <div className="p-6 text-red-600 text-sm">{error}</div>

  const totalDue = data.installments.reduce((sum, i) => sum + i.amount_due, 0)
  const totalPaid = data.payments.reduce((sum, p) => sum + p.amount, 0)

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <Link to="/" className="text-sm text-brand-700 hover:underline">← Back to my plots</Link>
      <h1 className="text-xl font-bold text-gray-900 mt-2 mb-4">EMI Schedule & Payments</h1>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500">Total Scheduled</p>
          <p className="text-lg font-semibold text-gray-900">₹{totalDue.toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500">Total Paid</p>
          <p className="text-lg font-semibold text-emerald-600">₹{totalPaid.toLocaleString('en-IN')}</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden mb-6">
        <div className="px-5 py-3 border-b border-gray-100 font-medium text-gray-900 text-sm">Installment Schedule</div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-left">
            <tr>
              <th className="px-5 py-2">#</th>
              <th className="px-5 py-2">Due date</th>
              <th className="px-5 py-2">Amount</th>
              <th className="px-5 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {data.installments.map((i) => (
              <tr key={i.number} className="border-t border-gray-100">
                <td className="px-5 py-2">{i.number}</td>
                <td className="px-5 py-2">{i.due_date}</td>
                <td className="px-5 py-2">₹{i.amount_due.toLocaleString('en-IN')}</td>
                <td className="px-5 py-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${INSTALLMENT_COLORS[i.status] || ''}`}>
                    {i.status}
                  </span>
                </td>
              </tr>
            ))}
            {data.installments.length === 0 && (
              <tr><td colSpan="4" className="px-5 py-6 text-center text-gray-400">No schedule generated yet</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 font-medium text-gray-900 text-sm">Payment History</div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-left">
            <tr>
              <th className="px-5 py-2">Receipt No.</th>
              <th className="px-5 py-2">Amount</th>
              <th className="px-5 py-2">Mode</th>
            </tr>
          </thead>
          <tbody>
            {data.payments.map((p, idx) => (
              <tr key={idx} className="border-t border-gray-100">
                <td className="px-5 py-2 font-mono text-xs">{p.receipt_number}</td>
                <td className="px-5 py-2">₹{p.amount.toLocaleString('en-IN')}</td>
                <td className="px-5 py-2 text-gray-600">{p.mode}</td>
              </tr>
            ))}
            {data.payments.length === 0 && (
              <tr><td colSpan="3" className="px-5 py-6 text-center text-gray-400">No payments recorded yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
