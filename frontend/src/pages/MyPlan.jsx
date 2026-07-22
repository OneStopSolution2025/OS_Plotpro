import { useEffect, useState } from 'react'
import { Clock, CheckCircle2, AlertTriangle, ArrowUpCircle, X } from 'lucide-react'
import api from '../api/client'
import { useToast } from '../context/ToastContext'
import { errorMessage } from '../utils/errors'
import { formatMoney } from '../utils/currency'
import { useAuth } from '../context/AuthContext'

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true)
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

function UpgradeModal({ currentPlanKey, plans, currency, onClose, onUpgraded }) {
  const [upgrading, setUpgrading] = useState(null)
  const { showToast } = useToast()

  const upgrade = async (planKey) => {
    setUpgrading(planKey)
    try {
      const orderRes = await api.post('/tenants/upgrade-plan/create-order', { plan_key: planKey })

      const scriptLoaded = await loadRazorpayScript()
      if (!scriptLoaded) {
        showToast('Could not load payment gateway', 'error')
        setUpgrading(null)
        return
      }

      const rzp = new window.Razorpay({
        key: orderRes.data.razorpay_key_id,
        amount: orderRes.data.amount,
        currency: orderRes.data.currency,
        order_id: orderRes.data.razorpay_order_id,
        name: 'OS2 PlotPro Subscription',
        description: `Upgrade to ${planKey}`,
        handler: async (response) => {
          try {
            await api.post('/tenants/upgrade-plan/verify-payment', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            })
            showToast('Plan upgraded successfully!', 'success')
            onUpgraded()
            onClose()
          } catch (err) {
            showToast(errorMessage(err, 'Payment verification failed — contact support if amount was deducted'), 'error')
          }
        },
        modal: { ondismiss: () => setUpgrading(null) },
        theme: { color: '#F0A500' },
      })
      rzp.open()
    } catch (err) {
      showToast(errorMessage(err, 'Online upgrades are not available yet — contact OS2 Studio directly'), 'error')
      setUpgrading(null)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="doc-card max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <p className="font-display font-semibold text-ink text-lg">Choose a plan</p>
          <button onClick={onClose} className="text-ink/40 hover:text-ink"><X size={20} /></button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {plans.map((p) => (
            <div key={p.plan_key} className={`doc-card p-4 ${p.plan_key === currentPlanKey ? 'opacity-50' : ''}`}>
              <p className="font-display font-semibold text-ink">{p.display_name}</p>
              <p className="font-mono text-xl font-bold text-brand-500 mt-1">{formatMoney(p.price, currency)}<span className="text-xs text-ink/40 font-sans">/mo</span></p>
              <p className="text-xs text-ink/60 mt-2">{p.description}</p>
              {p.plan_key === currentPlanKey ? (
                <p className="text-xs text-ink/40 mt-3">Current plan</p>
              ) : (
                <button
                  onClick={() => upgrade(p.plan_key)}
                  disabled={upgrading === p.plan_key}
                  className="w-full bg-brand-600 hover:bg-brand-700 text-white px-3 py-2 rounded-lg text-sm mt-3 transition disabled:opacity-60"
                >
                  {upgrading === p.plan_key ? 'Processing...' : `Switch to ${p.display_name}`}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function MyPlan() {
  const { user } = useAuth()
  const currency = user?.tenant_currency || 'INR'
  const [myPlan, setMyPlan] = useState(null)
  const [allPlans, setAllPlans] = useState([])
  const [planConfig, setPlanConfig] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const { showToast } = useToast()

  const load = () => {
    Promise.all([
      api.get('/tenants/my-plan'),
      api.get('/subscription-plans'),
    ]).then(([planRes, configsRes]) => {
      setMyPlan(planRes.data)
      setAllPlans(configsRes.data)
      setPlanConfig(configsRes.data.find((c) => c.plan_key === planRes.data.subscription_plan))
    }).catch((err) => showToast(errorMessage(err), 'error'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  if (loading) return <div className="p-6 text-ink/50 text-sm">Loading...</div>
  if (!myPlan) return null

  const expiringSoon = myPlan.days_to_expiry != null && myPlan.days_to_expiry <= 14

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs uppercase tracking-wide text-brand-600 font-medium">Billing</p>
      </div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-3xl font-bold text-ink">My Plan</h1>
        <button onClick={() => setShowUpgrade(true)} className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-sm transition">
          <ArrowUpCircle size={15} /> Upgrade Plan
        </button>
      </div>

      {expiringSoon && (
        <div className="doc-card p-4 mb-5 border-l-4 border-rust-500 flex items-start gap-3">
          <AlertTriangle className="text-rust-500 flex-shrink-0 mt-0.5" size={18} />
          <div>
            <p className="font-medium text-ink text-sm">
              Your subscription {myPlan.days_to_expiry <= 0 ? 'has expired' : `expires in ${myPlan.days_to_expiry} day${myPlan.days_to_expiry === 1 ? '' : 's'}`}
            </p>
            <p className="text-sm text-ink/60">Upgrade or renew now to avoid service interruption.</p>
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
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-ink/40 uppercase tracking-wide">Start date</p>
              <p className="text-ink font-mono mt-0.5">{myPlan.subscription_started_at || '—'}</p>
            </div>
            <div>
              <p className="text-ink/40 uppercase tracking-wide">Expiry date</p>
              <p className={`font-mono mt-0.5 ${expiringSoon ? 'text-rust-500 font-medium' : 'text-ink'}`}>{myPlan.subscription_expires_at || '—'}</p>
            </div>
          </div>
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

      {showUpgrade && (
        <UpgradeModal
          currentPlanKey={myPlan.subscription_plan}
          plans={allPlans}
          currency={currency}
          onClose={() => setShowUpgrade(false)}
          onUpgraded={load}
        />
      )}
    </div>
  )
}
