import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../api/client'

/**
 * Printable receipt — deliberately plain, high-contrast, print-optimized
 * layout. Customer clicks "Print / Save as PDF" and uses the browser's
 * native print dialog (Ctrl+P) to save as PDF. Avoids needing a backend
 * PDF library or extra dependency for a one-page document.
 */
export default function Receipt() {
  const { bookingId } = useParams()
  const [data, setData] = useState(null)
  const [customer, setCustomer] = useState(null)

  useEffect(() => {
    Promise.all([
      api.get(`/customer-auth/my-ledger/${bookingId}`),
      api.get('/customer-auth/me'),
    ]).then(([ledgerRes, meRes]) => {
      setData(ledgerRes.data)
      setCustomer(meRes.data)
    })
  }, [bookingId])

  if (!data) return <div className="p-6 text-ink/50 text-sm">Loading receipt...</div>

  const totalPaid = data.payments.reduce((sum, p) => sum + p.amount, 0)

  return (
    <div className="bg-white min-h-screen">
      <div className="print:hidden p-4 bg-parchment border-b border-ink/10 flex items-center justify-between">
        <Link to={`/ledger/${bookingId}`} className="text-sm text-brand-600 hover:underline">← Back</Link>
        <button onClick={() => window.print()} className="bg-brand-600 text-white px-4 py-2 text-sm">
          Print / Save as PDF
        </button>
      </div>

      <div className="max-w-2xl mx-auto p-10 font-sans text-ink">
        <div className="flex items-center justify-between border-b-2 border-ink pb-4 mb-6">
          <div>
            <h1 className="font-display text-2xl font-semibold">Payment Receipt</h1>
            <p className="text-xs text-ink/50 font-mono mt-1">Booking #{bookingId.slice(0, 8)}</p>
          </div>
          <p className="text-xs text-ink/50 font-mono">{new Date().toLocaleDateString('en-IN')}</p>
        </div>

        <div className="mb-6">
          <p className="text-xs uppercase tracking-wide text-ink/40 mb-1">Billed to</p>
          <p className="font-medium">{customer?.full_name}</p>
          <p className="text-sm text-ink/60 font-mono">{customer?.phone}</p>
        </div>

        <table className="w-full text-sm mb-6 border-t border-ink/15">
          <thead>
            <tr className="border-b border-ink/15 text-left text-xs uppercase tracking-wide text-ink/50">
              <th className="py-2">Receipt No.</th>
              <th className="py-2">Mode</th>
              <th className="py-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="font-mono">
            {data.payments.map((p, i) => (
              <tr key={i} className="border-b border-ink/10">
                <td className="py-2">{p.receipt_number}</td>
                <td className="py-2 text-ink/60">{p.mode}</td>
                <td className="py-2 text-right">₹{p.amount.toLocaleString('en-IN')}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end">
          <div className="w-56">
            <div className="flex justify-between text-sm font-mono py-1">
              <span className="text-ink/60">Total Paid</span>
              <span className="font-medium">₹{totalPaid.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        <p className="text-xs text-ink/40 mt-10 pt-4 border-t border-ink/10">
          This is a system-generated receipt from OS2 PlotPro on behalf of your promoter.
        </p>
      </div>
    </div>
  )
}
