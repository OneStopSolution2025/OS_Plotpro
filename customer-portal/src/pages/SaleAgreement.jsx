import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../api/client'
import { formatMoney } from '../utils/currency'
import { useCustomerAuth } from '../context/CustomerAuthContext'

/**
 * A printable sale-agreement summary — not a legally binding contract (that
 * still needs the promoter's actual signed document, which is uploaded via
 * the legal documents module), but a clear, printable summary of the deal
 * terms the customer agreed to. Same print-to-PDF pattern as Receipt.jsx.
 */
export default function SaleAgreement() {
  const { bookingId } = useParams()
  const [data, setData] = useState(null)
  const { customer } = useCustomerAuth()
  const currency = customer?.tenant_currency || 'INR'

  useEffect(() => {
    api.get(`/customer-auth/booking-detail/${bookingId}`).then((res) => setData(res.data))
  }, [bookingId])

  if (!data) return <div className="p-6 text-neutral-500 text-sm">Loading agreement...</div>

  return (
    <div className="bg-white min-h-screen">
      <div className="print:hidden p-4 bg-neutral-100 border-b border-neutral-200 flex items-center justify-between">
        <Link to={`/ledger/${bookingId}`} className="text-sm text-brand-600 hover:underline">← Back</Link>
        <button onClick={() => window.print()} className="bg-brand-600 text-white px-4 py-2 text-sm">
          Print / Save as PDF
        </button>
      </div>

      <div className="max-w-2xl mx-auto p-10 font-sans text-neutral-900">
        <div className="border-b-2 border-neutral-900 pb-4 mb-6">
          <h1 className="font-display text-2xl font-semibold">Booking Agreement Summary</h1>
          <p className="text-xs text-neutral-500 font-mono mt-1">Booking #{bookingId.slice(0, 8)} · {new Date(data.booking.created_at).toLocaleDateString('en-IN')}</p>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <p className="text-xs uppercase tracking-wide text-neutral-400 mb-1">Buyer</p>
            <p className="font-medium">{data.customer.full_name}</p>
            <p className="text-sm text-neutral-600 font-mono">{data.customer.phone}</p>
            {data.customer.address && <p className="text-sm text-neutral-600">{data.customer.address}</p>}
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-neutral-400 mb-1">Project</p>
            <p className="font-medium">{data.project?.name}</p>
            <p className="text-sm text-neutral-600">{data.project?.location}</p>
          </div>
        </div>

        <table className="w-full text-sm mb-6 border-t border-neutral-200">
          <tbody className="font-mono">
            <tr className="border-b border-neutral-200">
              <td className="py-2 text-neutral-500 font-sans">Plot Number</td>
              <td className="py-2 text-right">{data.plot?.plot_number}</td>
            </tr>
            <tr className="border-b border-neutral-200">
              <td className="py-2 text-neutral-500 font-sans">Extent</td>
              <td className="py-2 text-right">{data.plot?.extent_sqft} sqft</td>
            </tr>
            <tr className="border-b border-neutral-200">
              <td className="py-2 text-neutral-500 font-sans">Facing</td>
              <td className="py-2 text-right">{data.plot?.facing || '-'}</td>
            </tr>
            {data.plot?.patta_number && (
              <tr className="border-b border-neutral-200">
                <td className="py-2 text-neutral-500 font-sans">Patta Number</td>
                <td className="py-2 text-right">{data.plot.patta_number}</td>
              </tr>
            )}
            {data.project?.survey_number && (
              <tr className="border-b border-neutral-200">
                <td className="py-2 text-neutral-500 font-sans">Survey Number</td>
                <td className="py-2 text-right">{data.project.survey_number}</td>
              </tr>
            )}
            {data.project?.dtcp_approval_no && (
              <tr className="border-b border-neutral-200">
                <td className="py-2 text-neutral-500 font-sans">DTCP Approval No.</td>
                <td className="py-2 text-right">{data.project.dtcp_approval_no}</td>
              </tr>
            )}
            <tr className="border-b border-neutral-200">
              <td className="py-2 text-neutral-500 font-sans">Total Sale Price</td>
              <td className="py-2 text-right font-medium">{formatMoney(data.booking.total_price, currency)}</td>
            </tr>
            <tr className="border-b border-neutral-200">
              <td className="py-2 text-neutral-500 font-sans">Token Advance Paid</td>
              <td className="py-2 text-right">{formatMoney(data.booking.token_advance, currency)}</td>
            </tr>
            <tr>
              <td className="py-2 text-neutral-500 font-sans">Booking Status</td>
              <td className="py-2 text-right uppercase">{data.booking.status}</td>
            </tr>
          </tbody>
        </table>

        <p className="text-xs text-neutral-400 mt-10 pt-4 border-t border-neutral-200">
          This is a system-generated summary of your booking terms, not a substitute for the
          registered sale deed. Contact your promoter for the official signed agreement.
        </p>
      </div>
    </div>
  )
}
