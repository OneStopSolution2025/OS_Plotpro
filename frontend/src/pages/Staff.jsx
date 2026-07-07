import { useEffect, useState } from 'react'
import api from '../api/client'
import { useToast } from '../context/ToastContext'

export default function Staff() {
  const { showToast } = useToast()
  const [staff, setStaff] = useState([])
  const [performance, setPerformance] = useState({})

  const load = () => api.get('/staff').then((res) => setStaff(res.data))
  useEffect(() => { load() }, [])

  const viewPerformance = async (id) => {
    const res = await api.get(`/staff/${id}/performance`)
    setPerformance((prev) => ({ ...prev, [id]: res.data }))
  }

  const setTarget = async (id) => {
    const target = window.prompt('Monthly target (₹)?')
    const commission = window.prompt('Commission % on sales?')
    if (!target && !commission) return
    await api.patch(`/staff/${id}/target`, {
      monthly_target: target ? parseInt(target) : undefined,
      commission_percent: commission ? parseFloat(commission) : undefined,
    })
    showToast('Target updated')
    load()
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
        <button onClick={exportCsv} className="text-sm text-brand-700 font-medium hover:underline">
          ⬇ Export commissions (CSV)
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
                  <td className="px-4 py-2 text-ink/60">{s.monthly_target ?? '-'}</td>
                  <td className="px-4 py-2 text-ink/60">{s.commission_percent ?? '-'}</td>
                  <td className="px-4 py-2 space-x-3">
                    <button onClick={() => setTarget(s.id)} className="text-xs text-brand-700 hover:underline">Set target</button>
                    <button onClick={() => viewPerformance(s.id)} className="text-xs text-brand-700 hover:underline">Performance</button>
                  </td>
                </tr>
                {performance[s.id] && (
                  <tr className="bg-gray-50">
                    <td colSpan="5" className="px-4 py-2 text-xs text-ink/60">
                      Bookings: {performance[s.id].total_bookings} · Sales value: ₹{performance[s.id].total_sales_value.toLocaleString('en-IN')} · Commission earned: ₹{performance[s.id].commission_earned.toLocaleString('en-IN')}
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
    </div>
  )
}
