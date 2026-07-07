import { useEffect, useState } from 'react'
import { Building2, Users, Clock, CheckCircle2 } from 'lucide-react'
import api from '../api/client'
import { useToast } from '../context/ToastContext'
import { errorMessage } from '../utils/errors'

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="doc-card p-5 flex items-center gap-4">
      <div className="w-11 h-11 rounded-lg bg-brand-50 flex items-center justify-center text-brand-600 flex-shrink-0">
        <Icon size={20} />
      </div>
      <div>
        <p className="text-xs uppercase tracking-wide text-ink/50">{label}</p>
        <p className="font-mono text-2xl font-semibold text-ink mt-0.5">{value}</p>
      </div>
    </div>
  )
}

export default function PlatformDashboard() {
  const [tenants, setTenants] = useState([])
  const [loading, setLoading] = useState(true)
  const { showToast } = useToast()

  useEffect(() => {
    api.get('/tenants/overview').then((res) => setTenants(res.data))
      .catch((err) => showToast(errorMessage(err), 'error'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-6 text-ink/50 text-sm">Loading...</div>

  const activeCount = tenants.filter((t) => t.is_active).length
  const pendingCount = tenants.filter((t) => !t.is_active).length
  const totalStaff = tenants.reduce((sum, t) => sum + t.staff_count, 0)

  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-brand-600 font-medium mb-1">Supreme Admin</p>
      <h1 className="font-display text-3xl font-bold text-ink mb-6">Platform Overview</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Building2} label="Total Promoters" value={tenants.length} />
        <StatCard icon={CheckCircle2} label="Active" value={activeCount} />
        <StatCard icon={Clock} label="Pending Approval" value={pendingCount} />
        <StatCard icon={Users} label="Total Staff (all promoters)" value={totalStaff} />
      </div>

      {pendingCount > 0 && (
        <div className="doc-card p-4 mb-6 border-l-4 border-brand-500 flex items-center gap-3">
          <Clock className="text-brand-600 flex-shrink-0" size={18} />
          <p className="text-sm text-ink/70">
            <span className="font-medium">{pendingCount} promoter{pendingCount > 1 ? 's are' : ' is'}</span> waiting for approval —
            go to <a href="/tenants" className="text-brand-600 hover:underline font-medium">All Promoters</a> to review and activate.
          </p>
        </div>
      )}

      <div className="doc-card p-5">
        <h2 className="font-display font-semibold text-ink mb-3">Promoter Summary</h2>
        <div className="table-scroll">
          <table className="w-full text-sm min-w-[500px]">
            <thead className="text-ink/50 text-left text-xs uppercase tracking-wide">
              <tr>
                <th className="py-2 pr-4">Promoter</th>
                <th className="py-2 pr-4">Plan</th>
                <th className="py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((t) => (
                <tr key={t.id} className="border-t border-ink/10">
                  <td className="py-2 pr-4 font-medium text-ink">{t.company_name}</td>
                  <td className="py-2 pr-4 text-ink/60 capitalize">{t.subscription_plan}</td>
                  <td className="py-2">
                    <span className={`record-tag ${t.is_active ? 'text-brand-600' : 'text-rust-500'}`}>
                      {t.is_active ? 'active' : 'pending'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
