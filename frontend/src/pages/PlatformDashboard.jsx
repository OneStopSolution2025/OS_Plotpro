import { useEffect, useState } from 'react'
import { Building2, MapPinned, FileSignature, Users } from 'lucide-react'
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

  const totalPlots = tenants.reduce((sum, t) => sum + t.plot_count, 0)
  const totalBookings = tenants.reduce((sum, t) => sum + t.booking_count, 0)
  const totalStaff = tenants.reduce((sum, t) => sum + t.staff_count, 0)
  const activeCount = tenants.filter((t) => t.is_active).length

  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-brand-600 font-medium mb-1">Supreme Admin</p>
      <h1 className="font-display text-3xl font-bold text-ink mb-6">Platform Overview</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Building2} label="Promoters" value={`${activeCount}/${tenants.length}`} />
        <StatCard icon={MapPinned} label="Total Plots" value={totalPlots} />
        <StatCard icon={FileSignature} label="Total Bookings" value={totalBookings} />
        <StatCard icon={Users} label="Total Staff" value={totalStaff} />
      </div>

      <div className="doc-card p-5">
        <h2 className="font-display font-semibold text-ink mb-3">Promoter Summary</h2>
        <div className="table-scroll">
          <table className="w-full text-sm min-w-[600px]">
            <thead className="text-ink/50 text-left text-xs uppercase tracking-wide">
              <tr>
                <th className="py-2 pr-4">Promoter</th>
                <th className="py-2 pr-4">Plan</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Plots</th>
                <th className="py-2 pr-4">Bookings</th>
                <th className="py-2">Staff</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((t) => (
                <tr key={t.id} className="border-t border-ink/10">
                  <td className="py-2 pr-4 font-medium text-ink">{t.company_name}</td>
                  <td className="py-2 pr-4 text-ink/60 capitalize">{t.subscription_plan}</td>
                  <td className="py-2 pr-4">
                    <span className={`record-tag ${t.is_active ? 'text-brand-600' : 'text-rust-500'}`}>
                      {t.is_active ? 'active' : 'suspended'}
                    </span>
                  </td>
                  <td className="py-2 pr-4 font-mono">{t.plot_count}</td>
                  <td className="py-2 pr-4 font-mono">{t.booking_count}</td>
                  <td className="py-2 font-mono">{t.staff_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
