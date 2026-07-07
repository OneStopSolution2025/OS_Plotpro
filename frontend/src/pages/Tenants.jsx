import { useEffect, useState } from 'react'
import api from '../api/client'
import { useToast } from '../context/ToastContext'
import { errorMessage } from '../utils/errors'

export default function Tenants() {
  const [tenants, setTenants] = useState([])
  const [loading, setLoading] = useState(true)
  const { showToast } = useToast()

  const load = () => {
    setLoading(true)
    api.get('/tenants/overview').then((res) => setTenants(res.data))
      .catch((err) => showToast(errorMessage(err, 'Could not load tenants — platform admin only'), 'error'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const toggleStatus = async (id, current) => {
    try {
      await api.patch(`/tenants/${id}/status`, null, { params: { is_active: !current } })
      showToast(`Promoter ${!current ? 'reactivated' : 'suspended'}`, 'success')
      load()
    } catch (err) {
      showToast(errorMessage(err), 'error')
    }
  }

  if (loading) return <div className="p-6 text-ink/50 text-sm">Loading...</div>

  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-widest text-brand-600 mb-1">Platform Admin</p>
      <h1 className="font-display text-3xl font-semibold text-ink mb-4">All Promoters</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tenants.map((t) => (
          <div key={t.id} className="doc-card p-5">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="font-display font-semibold text-ink">{t.company_name}</p>
                <p className="text-xs text-ink/50 font-mono">{t.subdomain}</p>
              </div>
              <span className={`record-tag ${t.is_active ? 'text-brand-600' : 'text-rust-500'}`}>
                {t.is_active ? 'active' : 'suspended'}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center my-3 font-mono">
              <div>
                <p className="text-lg font-medium text-ink">{t.plot_count}</p>
                <p className="text-[10px] text-ink/40 uppercase">Plots</p>
              </div>
              <div>
                <p className="text-lg font-medium text-ink">{t.booking_count}</p>
                <p className="text-[10px] text-ink/40 uppercase">Bookings</p>
              </div>
              <div>
                <p className="text-lg font-medium text-ink">{t.staff_count}</p>
                <p className="text-[10px] text-ink/40 uppercase">Staff</p>
              </div>
            </div>
            <p className="text-xs text-ink/50 mb-3">Plan: <span className="font-mono">{t.subscription_plan}</span></p>
            <button
              onClick={() => toggleStatus(t.id, t.is_active)}
              className={`text-xs font-medium hover:underline ${t.is_active ? 'text-rust-500' : 'text-brand-600'}`}
            >
              {t.is_active ? 'Suspend access' : 'Reactivate access'}
            </button>
          </div>
        ))}
        {tenants.length === 0 && (
          <p className="text-sm text-ink/40 col-span-full">No promoters onboarded yet.</p>
        )}
      </div>
    </div>
  )
}
