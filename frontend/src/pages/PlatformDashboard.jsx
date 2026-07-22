import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Building2, CheckCircle2, Clock, Users, ArrowRight } from 'lucide-react'
import api from '../api/client'
import { useToast } from '../context/ToastContext'
import { errorMessage } from '../utils/errors'

function StatCard({ icon: Icon, label, value, tone = 'brand' }) {
  const toneClasses = {
    brand: 'bg-brand-50 text-brand-600',
    rust: 'bg-rust-50 text-rust-500',
  }
  return (
    <div className="doc-card p-5 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0 ${toneClasses[tone]}`}>
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

  const recentTenants = [...tenants]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5)

  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-brand-600 font-medium mb-1">Supreme Admin</p>
      <h1 className="font-display text-3xl font-bold text-ink mb-6">Platform Overview</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Building2} label="Total Promoters" value={tenants.length} />
        <StatCard icon={CheckCircle2} label="Active" value={activeCount} />
        <StatCard icon={Clock} label="Pending Approval" value={pendingCount} tone={pendingCount > 0 ? 'rust' : 'brand'} />
        <StatCard icon={Users} label="Total Staff" value={totalStaff} />
      </div>

      {pendingCount > 0 && (
        <Link
          to="/tenants"
          className="flex items-center justify-between doc-card p-4 mb-6 border-l-4 border-rust-500 hover:border-rust-600 transition group"
        >
          <div className="flex items-center gap-3">
            <Clock className="text-rust-500 flex-shrink-0" size={18} />
            <p className="text-sm text-ink/70">
              <span className="font-medium text-ink">{pendingCount} promoter{pendingCount > 1 ? 's' : ''}</span> waiting for review
            </p>
          </div>
          <ArrowRight size={16} className="text-rust-500 group-hover:translate-x-1 transition-transform" />
        </Link>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="doc-card p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-semibold text-ink">Recently Joined</h2>
            <Link to="/tenants" className="text-xs text-brand-600 hover:underline">View all →</Link>
          </div>
          <div className="space-y-2">
            {recentTenants.map((t) => (
              <div key={t.id} className="flex items-center justify-between py-2 border-b border-ink/5 last:border-0">
                <div>
                  <p className="text-sm font-medium text-ink">{t.company_name}</p>
                  <p className="text-xs text-ink/40 font-mono">{t.subdomain}</p>
                </div>
                <span className={`record-tag ${t.is_active ? 'text-brand-600' : 'text-rust-500'}`}>
                  {t.is_active ? 'active' : 'pending'}
                </span>
              </div>
            ))}
            {recentTenants.length === 0 && <p className="text-sm text-ink/40">No promoters yet.</p>}
          </div>
        </div>

        <div className="doc-card p-5">
          <h2 className="font-display font-semibold text-ink mb-3">By Plan</h2>
          <div className="space-y-2">
            {['trial', 'basic', 'pro', 'enterprise'].map((plan) => {
              const count = tenants.filter((t) => t.subscription_plan === plan).length
              const pct = tenants.length ? Math.round((count / tenants.length) * 100) : 0
              return (
                <div key={plan}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="capitalize text-ink/70">{plan}</span>
                    <span className="font-mono text-ink/50">{count}</span>
                  </div>
                  <div className="h-1.5 bg-ink/5 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-500 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
