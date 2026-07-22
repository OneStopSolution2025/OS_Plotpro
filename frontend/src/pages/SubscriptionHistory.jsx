import { useEffect, useState } from 'react'
import api from '../api/client'
import { useToast } from '../context/ToastContext'
import { errorMessage } from '../utils/errors'

export default function SubscriptionHistory() {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const { showToast } = useToast()

  useEffect(() => {
    api.get('/tenants/all-plan-history').then((res) => setHistory(res.data))
      .catch((err) => showToast(errorMessage(err), 'error'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-6 text-ink/50 text-sm">Loading...</div>

  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-brand-600 font-medium mb-1">Platform Admin</p>
      <h1 className="font-display text-3xl font-bold text-ink mb-4">Subscription History</h1>
      <p className="text-sm text-ink/60 mb-6">Every plan and expiry change across all promoters, in one place.</p>

      <div className="doc-card overflow-hidden">
        <div className="table-scroll">
          <table className="w-full text-sm min-w-[700px]">
            <thead className="bg-ink/5 text-ink/50 text-left text-xs uppercase tracking-wide">
              <tr>
                <th className="px-4 py-2">Date</th>
                <th className="px-4 py-2">Promoter</th>
                <th className="px-4 py-2">Plan Change</th>
                <th className="px-4 py-2">Expiry Change</th>
                <th className="px-4 py-2">Changed By</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h) => (
                <tr key={h.id} className="border-t border-ink/10">
                  <td className="px-4 py-2 text-ink/60 font-mono text-xs">{new Date(h.changed_at).toLocaleString()}</td>
                  <td className="px-4 py-2 font-medium text-ink">{h.company_name}</td>
                  <td className="px-4 py-2 text-ink/70">
                    {h.old_plan !== h.new_plan ? (
                      <span className="capitalize">{h.old_plan || '—'} → <span className="text-brand-500 font-medium">{h.new_plan}</span></span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-2 text-ink/70 font-mono text-xs">
                    {h.old_expires_at !== h.new_expires_at ? `${h.old_expires_at || '—'} → ${h.new_expires_at || '—'}` : '—'}
                  </td>
                  <td className="px-4 py-2 text-ink/50 text-xs">{h.changed_by_email}</td>
                </tr>
              ))}
              {history.length === 0 && (
                <tr><td colSpan="5" className="px-4 py-6 text-center text-ink/40">No plan changes recorded yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
