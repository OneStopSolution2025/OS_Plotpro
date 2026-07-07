import { useEffect, useState } from 'react'
import { Download, DollarSign } from 'lucide-react'
import api from '../api/client'
import { useToast } from '../context/ToastContext'
import { errorMessage } from '../utils/errors'
import { formatMoney } from '../utils/currency'
import { useAuth } from '../context/AuthContext'

function PayoutModal({ staff, onClose, onRecorded }) {
  const [payouts, setPayouts] = useState(null)
  const [form, setForm] = useState({ amount: '', period_label: '', paid_date: new Date().toISOString().slice(0, 10), payment_mode: 'bank_transfer' })
  const { showToast } = useToast()
  const { user } = useAuth()
  const currency = user?.tenant_currency || 'INR'

  const load = () => api.get(`/staff/${staff.id}/payouts`).then((res) => setPayouts(res.data))
  useEffect(() => { load() }, [])

  const submit = async (e) => {
    e.preventDefault()
    try {
      await api.post('/staff/commission-payouts', { staff_id: staff.id, ...form, amount: parseFloat(form.amount) })
      showToast('Payout recorded', 'success')
      setForm({ ...form, amount: '', period_label: '' })
      load()
      onRecorded()
    } catch (err) {
      showToast(errorMessage(err), 'error')
    }
  }

  return (
    <div className="fixed inset-0 bg-ink/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="doc-card max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-display font-semibold text-ink mb-1">Commission Payouts — {staff.full_name}</h2>
        {payouts && (
          <p className="text-sm text-ink/50 mb-4">Total paid to date: <span className="font-mono text-brand-600">{formatMoney(payouts.total_paid, currency)}</span></p>
        )}

        <form onSubmit={submit} className="grid grid-cols-2 gap-2 mb-5">
          <input placeholder="Amount" type="number" required value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            className="border border-ink/15 px-3 py-2 text-sm font-mono" />
          <input placeholder="Period (e.g. July 2026)" value={form.period_label}
            onChange={(e) => setForm({ ...form, period_label: e.target.value })}
            className="border border-ink/15 px-3 py-2 text-sm" />
          <input type="date" value={form.paid_date}
            onChange={(e) => setForm({ ...form, paid_date: e.target.value })}
            className="border border-ink/15 px-3 py-2 text-sm" />
          <select value={form.payment_mode} onChange={(e) => setForm({ ...form, payment_mode: e.target.value })}
            className="border border-ink/15 px-3 py-2 text-sm">
            {['bank_transfer', 'cash', 'cheque', 'upi'].map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
          <button type="submit" className="col-span-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 text-sm transition">
            Record payout
          </button>
        </form>

        <p className="font-display font-medium text-ink text-sm mb-2">History</p>
        <div className="space-y-1.5 max-h-48 overflow-y-auto">
          {payouts?.payouts.map((p) => (
            <div key={p.id} className="flex justify-between text-sm bg-ink/5 px-3 py-2">
              <span className="text-ink/70">{p.period_label || p.paid_date}</span>
              <span className="font-mono text-brand-600">{formatMoney(p.amount, currency)}</span>
            </div>
          ))}
          {payouts?.payouts.length === 0 && <p className="text-sm text-ink/40">No payouts recorded yet.</p>}
        </div>

        <button onClick={onClose} className="text-sm text-ink/50 hover:text-ink mt-4">Close</button>
      </div>
    </div>
  )
}

export default function Staff() {
  const { showToast } = useToast()
  const { user } = useAuth()
  const currency = user?.tenant_currency || 'INR'
  const [staff, setStaff] = useState([])
  const [performance, setPerformance] = useState({})
  const [payoutStaff, setPayoutStaff] = useState(null)

  const load = () => api.get('/staff').then((res) => setStaff(res.data))
    .catch((err) => showToast(errorMessage(err), 'error'))
  useEffect(() => { load() }, [])

  const viewPerformance = async (id) => {
    try {
      const res = await api.get(`/staff/${id}/performance`)
      setPerformance((prev) => ({ ...prev, [id]: res.data }))
    } catch (err) {
      showToast(errorMessage(err), 'error')
    }
  }

  const setTarget = async (id) => {
    const target = window.prompt('Monthly target?')
    const commission = window.prompt('Commission % on sales?')
    if (!target && !commission) return
    try {
      await api.patch(`/staff/${id}/target`, {
        monthly_target: target ? parseInt(target) : undefined,
        commission_percent: commission ? parseFloat(commission) : undefined,
      })
      showToast('Target updated', 'success')
      load()
    } catch (err) {
      showToast(errorMessage(err), 'error')
    }
  }

  const exportCsv = async () => {
    try {
      const res = await api.get('/staff/export/commissions.csv', { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'commissions.csv')
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch {
      showToast('Could not export commissions', 'error')
    }
  }

  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-widest text-brand-600 mb-1">Team</p>
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-display text-3xl font-semibold text-ink">Staff</h1>
        <button onClick={exportCsv} className="flex items-center gap-1.5 text-sm text-brand-700 font-medium hover:underline">
          <Download size={14} /> Export commissions (CSV)
        </button>
      </div>

      <div className="doc-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-ink/5 text-ink/50 text-left font-mono text-xs uppercase tracking-wide">
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Role</th>
              <th className="px-4 py-2">Target</th>
              <th className="px-4 py-2">Commission %</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {staff.map((s) => (
              <>
                <tr key={s.id} className="border-t border-ink/10">
                  <td className="px-4 py-2 font-medium text-ink">{s.full_name}</td>
                  <td className="px-4 py-2 text-ink/60">{s.role}</td>
                  <td className="px-4 py-2 text-ink/60 font-mono">{s.monthly_target ?? '-'}</td>
                  <td className="px-4 py-2 text-ink/60 font-mono">{s.commission_percent ?? '-'}</td>
                  <td className="px-4 py-2 space-x-3">
                    <button onClick={() => setTarget(s.id)} className="text-xs text-brand-700 hover:underline">Set target</button>
                    <button onClick={() => viewPerformance(s.id)} className="text-xs text-brand-700 hover:underline">Performance</button>
                    <button onClick={() => setPayoutStaff(s)} className="text-xs text-brass-600 hover:underline inline-flex items-center gap-1">
                      <DollarSign size={11} /> Payouts
                    </button>
                  </td>
                </tr>
                {performance[s.id] && (
                  <tr className="bg-ink/5">
                    <td colSpan="5" className="px-4 py-2 text-xs text-ink/60 font-mono">
                      Bookings: {performance[s.id].total_bookings} · Sales: {formatMoney(performance[s.id].total_sales_value, currency)} · Commission owed: {formatMoney(performance[s.id].commission_earned, currency)}
                    </td>
                  </tr>
                )}
              </>
            ))}
            {staff.length === 0 && (
              <tr><td colSpan="5" className="px-4 py-6 text-center text-ink/40">No staff yet</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {payoutStaff && (
        <PayoutModal staff={payoutStaff} onClose={() => setPayoutStaff(null)} onRecorded={load} />
      )}
    </div>
  )
}
