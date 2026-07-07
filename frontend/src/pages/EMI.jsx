import { useEffect, useState } from 'react'
import api from '../api/client'

export default function EMI() {
  const [bookings, setBookings] = useState([])
  const [selected, setSelected] = useState('')
  const [schedule, setSchedule] = useState([])
  const [ledger, setLedger] = useState(null)
  const [genForm, setGenForm] = useState({ down_payment: '', number_of_installments: '', first_due_date: '', frequency_days: 30 })
  const [payForm, setPayForm] = useState({ installment_id: '', amount: '', payment_mode: 'cash' })

  useEffect(() => { api.get('/bookings').then((res) => setBookings(res.data)) }, [])

  const loadDetails = async (bookingId) => {
    setSelected(bookingId)
    const [sched, led] = await Promise.all([
      api.get(`/emi/schedule/${bookingId}`),
      api.get(`/emi/ledger/${bookingId}`),
    ])
    setSchedule(sched.data)
    setLedger(led.data)
  }

  const generate = async (e) => {
    e.preventDefault()
    await api.post('/emi/generate-schedule', {
      booking_id: selected,
      down_payment: parseFloat(genForm.down_payment),
      number_of_installments: parseInt(genForm.number_of_installments),
      first_due_date: genForm.first_due_date,
      frequency_days: parseInt(genForm.frequency_days),
    })
    loadDetails(selected)
  }

  const recordPayment = async (e) => {
    e.preventDefault()
    await api.post('/emi/payments', {
      booking_id: selected,
      installment_id: payForm.installment_id || null,
      amount: parseFloat(payForm.amount),
      payment_mode: payForm.payment_mode,
    })
    setPayForm({ installment_id: '', amount: '', payment_mode: 'cash' })
    loadDetails(selected)
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-4">EMI &amp; Payments</h1>

      <select value={selected} onChange={(e) => loadDetails(e.target.value)}
        className="border border-gray-300 rounded-lg px-3 py-2 text-sm mb-4">
        <option value="">Select a booking</option>
        {bookings.filter(b => b.status !== 'cancelled').map((b) => (
          <option key={b.id} value={b.id}>{b.id.slice(0, 8)} — ₹{b.total_price.toLocaleString('en-IN')}</option>
        ))}
      </select>

      {selected && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {schedule.length === 0 ? (
              <form onSubmit={generate} className="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
                <p className="text-sm font-medium text-gray-700 mb-2">Generate EMI schedule</p>
                <input placeholder="Down payment" type="number" required value={genForm.down_payment}
                  onChange={(e) => setGenForm({ ...genForm, down_payment: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                <input placeholder="Number of installments" type="number" required value={genForm.number_of_installments}
                  onChange={(e) => setGenForm({ ...genForm, number_of_installments: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                <input type="date" required value={genForm.first_due_date}
                  onChange={(e) => setGenForm({ ...genForm, first_due_date: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                <select value={genForm.frequency_days} onChange={(e) => setGenForm({ ...genForm, frequency_days: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  <option value={30}>Monthly</option>
                  <option value={90}>Quarterly</option>
                </select>
                <button type="submit" className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm">Generate</button>
              </form>
            ) : (
              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-500 text-left">
                    <tr>
                      <th className="px-4 py-2">#</th>
                      <th className="px-4 py-2">Due date</th>
                      <th className="px-4 py-2">Amount</th>
                      <th className="px-4 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schedule.map((s) => (
                      <tr key={s.id} className="border-t border-gray-100">
                        <td className="px-4 py-2">{s.installment_number}</td>
                        <td className="px-4 py-2">{s.due_date}</td>
                        <td className="px-4 py-2">₹{s.amount_due.toLocaleString('en-IN')}</td>
                        <td className="px-4 py-2">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            s.status === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                            s.status === 'overdue' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                          }`}>{s.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <form onSubmit={recordPayment} className="bg-white border border-gray-200 rounded-xl p-4 flex flex-wrap gap-2 items-end">
              <p className="w-full text-sm font-medium text-gray-700">Record a payment</p>
              <select value={payForm.installment_id} onChange={(e) => setPayForm({ ...payForm, installment_id: e.target.value })}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
                <option value="">General / no installment</option>
                {schedule.filter(s => s.status !== 'paid').map((s) => (
                  <option key={s.id} value={s.id}>#{s.installment_number} — ₹{s.amount_due}</option>
                ))}
              </select>
              <input placeholder="Amount" type="number" required value={payForm.amount}
                onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-32" />
              <select value={payForm.payment_mode} onChange={(e) => setPayForm({ ...payForm, payment_mode: e.target.value })}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
                {['cash', 'cheque', 'upi', 'gateway'].map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
              <button type="submit" className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm">Record</button>
            </form>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-5 h-fit">
            <h2 className="font-semibold text-gray-900 mb-3">Ledger snapshot</h2>
            {ledger && (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Total scheduled</span><span>₹{ledger.total_scheduled.toLocaleString('en-IN')}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Total paid</span><span className="text-emerald-600">₹{ledger.total_paid.toLocaleString('en-IN')}</span></div>
                <div className="flex justify-between font-medium"><span>Balance</span><span>₹{ledger.balance.toLocaleString('en-IN')}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Overdue installments</span><span className="text-red-600">{ledger.overdue_installments}</span></div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
