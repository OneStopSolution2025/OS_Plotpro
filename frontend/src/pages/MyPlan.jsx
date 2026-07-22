import { useEffect, useState } from 'react'
import { Clock, CheckCircle2, AlertTriangle } from 'lucide-react'
import api from '../api/client'
import { useToast } from '../context/ToastContext'
import { errorMessage } from '../utils/errors'
import { formatMoney } from '../utils/currency'
import { useAuth } from '../context/AuthContext'

export default function MyPlan() {
  const { user } = useAuth()
  const currency = user?.tenant_currency || 'INR'
  const [myPlan, setMyPlan] = useState(null)
  const [planConfig, setPlanConfig] = useState(null)
  const [loading, setLoading] = useState(true)
  const { showToast } = useToast()

  useEffect(() => {
    Promise.all([
      api.get('/tenants/my-plan'),
      api.get('/subscription-plans'),
    ]).then(([planRes, configsRes]) => {
      setMyPlan(planRes.data)
      setPlanConfig(configsRes.data.find((c) => c.plan_key === planRes.data.subscription_plan))
    }).catch((err) => showToast(errorMessage(err), 'error'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-6 text-ink/50 text-sm">Loading...</div>
  if (!myPlan) return null

  const expiringSoon = myPlan.days_to_expiry != null && myPlan.days_to_expiry <= 14

  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-brand-600 font-medium mb-1">Billing</p>
      <h1 className="font-display text-3xl font-bold text-ink mb-6">My Plan</h1>

      {expiringSoon && (
        <div className="doc-card p-4 mb-5 border-l-4 border-rust-500 flex items-start gap-3">
          <AlertTriangle className="text-rust-500 flex-shrink-0 mt-0.5" size={18} />
          <div>
            <p className="font-medium text-ink text-sm">
              Your subscription {myPlan.days_to_expiry <= 0 ? 'has expired' : `expires in ${myPlan.days_to_expiry} day${myPlan.days_to_expiry === 1 ? '' : 's'}`}
            </p>
            <p className="text-sm text-ink/60">Contact OS2 Studio to renew and avoid service interruption.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="doc-card p-6">
          <div className="flex items-center justify-between mb-3">
            <p className="font-display font-semibold text-ink text-lg">{planConfig?.display_name || myPlan.subscription_plan}</p>
            <span className={`record-tag ${myPlan.is_active ? 'text-brand-500' : 'text-rust-500'}`}>
              {myPlan.is_active ? 'active' : 'suspended'}
            </span>
          </div>
          {planConfig && (
            <p className="font-mono text-2xl font-bold text-brand-500 mb-2">
              {formatMoney(planConfig.price, currency)}<span className="text-xs text-ink/40 font-sans">/mo</span>
            </p>
          )}
          <p className="text-sm text-ink/60 mb-4">{planConfig?.description}</p>
          {myPlan.subscription_expires_at && (
            <p className="text-xs text-ink/50 flex items-center gap-1">
              <Clock size={11} /> Renews / expires on {myPlan.subscription_expires_at}
            </p>
          )}
        </div>

        {planConfig && (
          <div className="doc-card p-6">
            <p className="font-display font-semibold text-ink mb-3">What's included</p>
            <div className="text-sm text-ink/70 space-y-1.5 mb-3 font-mono">
              <p>{planConfig.max_projects ?? 'Unlimited'} projects</p>
              <p>{planConfig.max_staff ?? 'Unlimited'} staff logins</p>
              <p>{planConfig.max_plots ?? 'Unlimited'} plots</p>
            </div>
            {planConfig.features.length > 0 && (
              <div className="space-y-1.5 pt-2 border-t border-ink/10">
                {planConfig.features.map((f, i) => (
                  <p key={i} className="text-sm text-ink/70 flex items-start gap-1.5">
                    <CheckCircle2 size={14} className="text-brand-500 flex-shrink-0 mt-0.5" /> {f.trim()}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="doc-card p-5">
        <p className="font-display font-semibold text-ink mb-3">Plan History</p>
        {myPlan.history.length === 0 ? (
          <p className="text-sm text-ink/40">No plan changes yet.</p>
        ) : (
          <div className="space-y-2">
            {myPlan.history.map((h, i) => (
              <div key={i} className="bg-ink/5 rounded-lg p-3 text-xs">
                <p className="text-ink/50 font-mono">{new Date(h.changed_at).toLocaleString()}</p>
                {h.old_plan !== h.new_plan && (
                  <p className="text-ink mt-1">Plan: <span className="capitalize">{h.old_plan || '—'}</span> → <span className="capitalize font-medium text-brand-500">{h.new_plan}</span></p>
                )}
                {h.old_expires_at !== h.new_expires_at && (
                  <p className="text-ink mt-1">Expiry updated to <span className="font-medium text-brand-500">{h.new_expires_at || '—'}</span></p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
