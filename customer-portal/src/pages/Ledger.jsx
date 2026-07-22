import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../api/client'
import { useToast } from '../context/ToastContext'
import { errorMessage } from '../utils/errors'
import { formatMoney } from '../utils/currency'
import { useCustomerAuth } from '../context/CustomerAuthContext'
import PlotLocationMap from '../components/PlotLocationMap'

const INSTALLMENT_COLORS = {
  paid: 'text-brand-600',
  pending: 'text-ink/50',
  overdue: 'text-rust-500',
  waived: 'text-brass-600',
}

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true)
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

export default function Ledger() {
  const { bookingId } = useParams()
  const [data, setData] = useState(null)
  const [bookingDetail, setBookingDetail] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [payingId, setPayingId] = useState(null)
  const { showToast } = useToast()
  const { customer } = useCustomerAuth()
  const currency = customer?.tenant_currency || 'INR'

  const load = () => {
    Promise.all([
      api.get(`/customer-auth/my-ledger/${bookingId}`),
      api.get(`/customer-auth/booking-detail/${bookingId}`).catch(() => ({ data: null })),
    ]).then(([ledgerRes, detailRes]) => {
      setData(ledgerRes.data)
      setBookingDetail(detailRes.data)
    }).catch(() => setError('Could not load this booking.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [bookingId])

  const payInstallment = async (installment) => {
    setPayingId(installment.id || installment.number)
    try {
      const orderRes = await api.post('/payment-gateway/create-order', {
        booking_id: bookingId,
        installment_id: installment.id,
        amount: installment.amount_due,
      })

      const scriptLoaded = await loadRazorpayScript()
      if (!scriptLoaded) {
        showToast('Could not load payment gateway. Check your connection.', 'error')
        setPayingId(null)
        return
      }

      const rzp = new window.Razorpay({
        key: orderRes.data.razorpay_key_id,
        amount: orderRes.data.amount,
        currency: orderRes.data.currency,
        order_id: orderRes.data.razorpay_order_id,
        name: 'OS2 PlotPro',
        description: `Installment #${installment.installment_number}`,
        handler: async (response) => {
          try {
            await api.post('/payment-gateway/verify-payment', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            })
            showToast('Payment successful!', 'success')
            load()
          } catch (err) {
            showToast(errorMessage(err, 'Payment verification failed — contact support if amount was deducted'), 'error')
          }
        },
        modal: { ondismiss: () => setPayingId(null) },
        theme: { color: '#F0A500' },
      })
      rzp.open()
    } catch (err) {
      showToast(errorMessage(err, 'Online payment is not available yet — please pay your promoter directly'), 'error')
      setPayingId(null)
    }
  }

  if (loading) return <div className="p-6 text-ink/50 text-sm">Loading...</div>
  if (error) return <div className="p-6 text-rust-500 text-sm">{error}</div>

  const totalDue = data.installments.reduce((sum, i) => sum + i.amount_due, 0)
  const totalPaid = data.payments.reduce((sum, p) => sum + p.amount, 0)
  const plot = bookingDetail?.plot

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto bg-parchment min-h-[calc(100vh-64px)]">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <Link to="/my-plots" className="text-sm text-brand-600 hover:underline">← Back to my plots</Link>
        <div className="flex gap-4">
          <Link to={`/agreement/${bookingId}`} className="text-sm text-brand-600 hover:underline">Booking agreement →</Link>
          <Link to={`/receipt/${bookingId}`} className="text-sm text-brand-600 hover:underline">Printable receipt →</Link>
        </div>
      </div>
      <p className="text-xs uppercase tracking-wide text-brand-600 font-medium mt-3 mb-1">Booking Detail</p>
      <h1 className="font-display text-2xl font-bold text-ink mb-4">EMI Schedule & Payments</h1>

      {plot?.latitude != null && plot?.longitude != null && (
        <PlotLocationMap
          latitude={plot.latitude}
          longitude={plot.longitude}
          plotNumber={plot.plot_number}
          status={bookingDetail.booking.status}
        />
      )}

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="doc-card p-4">
          <p className="text-xs uppercase tracking-wide text-ink/50">Total Scheduled</p>
          <p className="font-mono text-lg font-semibold text-ink mt-1">{formatMoney(totalDue, currency)}</p>
        </div>
        <div className="doc-card p-4">
          <p className="text-xs uppercase tracking-wide text-ink/50">Total Paid</p>
          <p className="font-mono text-lg font-semibold text-brand-600 mt-1">{formatMoney(totalPaid, currency)}</p>
        </div>
      </div>

      <div className="doc-card overflow-hidden mb-6">
        <div className="px-5 py-3 border-b border-ink/10 font-display font-medium text-ink text-sm">Installment Schedule</div>
        <table className="w-full text-sm">
          <thead className="bg-ink/5 text-ink/50 text-left text-xs uppercase tracking-wide">
            <tr>
              <th className="px-5 py-2">#</th>
              <th className="px-5 py-2">Due date</th>
              <th className="px-5 py-2">Amount</th>
              <th className="px-5 py-2">Status</th>
              <th className="px-5 py-2"></th>
            </tr>
          </thead>
          <tbody className="font-mono">
            {data.installments.map((i) => (
              <tr key={i.number} className="border-t border-ink/10">
                <td className="px-5 py-2">{i.number}</td>
                <td className="px-5 py-2">{i.due_date}</td>
                <td className="px-5 py-2">{formatMoney(i.amount_due, currency)}</td>
                <td className="px-5 py-2">
                  <span className={`record-tag ${INSTALLMENT_COLORS[i.status] || ''}`}>
                    {i.status}
                  </span>
                </td>
                <td className="px-5 py-2">
                  {(i.status === 'pending' || i.status === 'overdue') && (
                    <button
                      onClick={() => payInstallment(i)}
                      disabled={payingId === (i.id || i.number)}
                      className="bg-brand-600 hover:bg-brand-700 text-white px-3 py-1 rounded-lg text-xs transition disabled:opacity-60"
                    >
                      {payingId === (i.id || i.number) ? 'Processing...' : 'Pay Now'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {data.installments.length === 0 && (
              <tr><td colSpan="5" className="px-5 py-6 text-center text-ink/40 font-sans">No schedule generated yet</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="doc-card overflow-hidden">
        <div className="px-5 py-3 border-b border-ink/10 font-display font-medium text-ink text-sm">Payment History</div>
        <table className="w-full text-sm">
          <thead className="bg-ink/5 text-ink/50 text-left text-xs uppercase tracking-wide">
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
                <td className="px-5 py-2">{formatMoney(p.amount, currency)}</td>
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
