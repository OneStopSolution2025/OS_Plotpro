import { useEffect, useState } from 'react'
import api from '../api/client'

export default function Staff() {
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
    load()
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Staff</h1>

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-left">
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
                <tr key={s.id} className="border-t border-gray-100">
                  <td className="px-4 py-2 font-medium text-gray-900">{s.full_name}</td>
                  <td className="px-4 py-2 text-gray-600">{s.role}</td>
                  <td className="px-4 py-2 text-gray-600">{s.monthly_target ?? '-'}</td>
                  <td className="px-4 py-2 text-gray-600">{s.commission_percent ?? '-'}</td>
                  <td className="px-4 py-2 space-x-3">
                    <button onClick={() => setTarget(s.id)} className="text-xs text-brand-700 hover:underline">Set target</button>
                    <button onClick={() => viewPerformance(s.id)} className="text-xs text-brand-700 hover:underline">Performance</button>
                  </td>
                </tr>
                {performance[s.id] && (
                  <tr className="bg-gray-50">
                    <td colSpan="5" className="px-4 py-2 text-xs text-gray-600">
                      Bookings: {performance[s.id].total_bookings} · Sales value: ₹{performance[s.id].total_sales_value.toLocaleString('en-IN')} · Commission earned: ₹{performance[s.id].commission_earned.toLocaleString('en-IN')}
                    </td>
                  </tr>
                )}
              </>
            ))}
            {staff.length === 0 && (
              <tr><td colSpan="5" className="px-4 py-6 text-center text-gray-400">No staff yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
