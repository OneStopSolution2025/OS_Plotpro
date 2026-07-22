import { useEffect, useState } from 'react'
import { Pencil } from 'lucide-react'
import api from '../api/client'
import { useToast } from '../context/ToastContext'
import { errorMessage } from '../utils/errors'
import { formatMoney } from '../utils/currency'

function Field({ label, hint, children }) {
  return (
    <div>
      <label className="text-xs font-medium text-ink/70 uppercase tracking-wide block mb-1">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-ink/40 mt-1">{hint}</p>}
    </div>
  )
}

const fieldInput = "w-full border border-ink/15 px-3 py-2 text-sm rounded-lg bg-transparent focus:border-brand-500 focus:outline-none"

function EditPlanForm({ plan, onDone, onUpdated }) {
  const [form, setForm] = useState({
    display_name: plan.display_name,
    price: plan.price,
    max_projects: plan.max_projects ?? '',
    max_staff: plan.max_staff ?? '',
    max_plots: plan.max_plots ?? '',
    description: plan.description || '',
    features: plan.features.join(', '),
  })
  const { showToast } = useToast()

  const submit = async (e) => {
    e.preventDefault()
    try {
      await api.patch(`/subscription-plans/${plan.plan_key}`, {
        display_name: form.display_name,
        price: parseFloat(form.price),
        max_projects: form.max_projects === '' ? null : parseInt(form.max_projects),
        max_staff: form.max_staff === '' ? null : parseInt(form.max_staff),
        max_plots: form.max_plots === '' ? null : parseInt(form.max_plots),
        description: form.description,
        features: form.features,
      })
      showToast(`${plan.display_name} plan updated`, 'success')
      onDone()
      onUpdated()
    } catch (err) {
      showToast(errorMessage(err, 'Could not update plan'), 'error')
    }
  }

  return (
    <form onSubmit={submit} className="doc-card p-5 space-y-3">
      <p className="font-display font-semibold text-ink mb-1">Edit {plan.display_name}</p>
      <Field label="Display name">
        <input value={form.display_name}
          onChange={(e) => setForm({ ...form, display_name: e.target.value })}
          className={fieldInput} />
      </Field>
      <Field label="Price per month" hint="in the plan's billing currency">
        <input type="number" value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
          className={`${fieldInput} font-mono`} />
      </Field>
      <div className="grid grid-cols-3 gap-2">
        <Field label="Max projects">
          <input type="number" value={form.max_projects}
            onChange={(e) => setForm({ ...form, max_projects: e.target.value })}
            className={`${fieldInput} font-mono`} />
        </Field>
        <Field label="Max staff">
          <input type="number" value={form.max_staff}
            onChange={(e) => setForm({ ...form, max_staff: e.target.value })}
            className={`${fieldInput} font-mono`} />
        </Field>
        <Field label="Max plots">
          <input type="number" value={form.max_plots}
            onChange={(e) => setForm({ ...form, max_plots: e.target.value })}
            className={`${fieldInput} font-mono`} />
        </Field>
      </div>
      <p className="text-[11px] text-ink/40 -mt-1">Leave any limit blank for "unlimited"</p>
      <Field label="Description" hint="One line shown under the plan name">
        <textarea value={form.description} rows={2}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className={fieldInput} />
      </Field>
      <Field label="Features" hint="Comma-separated — each becomes a checklist bullet">
        <input value={form.features}
          onChange={(e) => setForm({ ...form, features: e.target.value })}
          className={fieldInput} />
      </Field>
      <div className="flex gap-2 pt-1">
        <button type="submit" className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-1.5 rounded-lg text-sm transition">Save</button>
        <button type="button" onClick={onDone} className="text-sm text-ink/50 hover:text-ink">Cancel</button>
      </div>
    </form>
  )
}

export default function SubscriptionPlans() {
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingKey, setEditingKey] = useState(null)
  const { showToast } = useToast()

  const load = () => {
    setLoading(true)
    api.get('/subscription-plans').then((res) => setPlans(res.data))
      .catch((err) => showToast(errorMessage(err), 'error'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  if (loading) return <div className="p-6 text-ink/50 text-sm">Loading...</div>

  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-brand-600 font-medium mb-1">Platform Admin</p>
      <h1 className="font-display text-3xl font-bold text-ink mb-4">Subscription Plans</h1>
      <p className="text-sm text-ink/60 mb-6">
        Define what each plan tier includes — price, limits, and features. Promoters see these
        details on their own "My Plan" page.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {plans.map((p) => (
          editingKey === p.plan_key ? (
            <EditPlanForm key={p.plan_key} plan={p} onDone={() => setEditingKey(null)} onUpdated={load} />
          ) : (
            <div key={p.plan_key} className="doc-card p-5">
              <p className="font-display font-semibold text-ink text-lg">{p.display_name}</p>
              <p className="font-mono text-2xl font-bold text-brand-500 mt-1">{formatMoney(p.price, p.currency)}<span className="text-xs text-ink/40 font-sans">/mo</span></p>
              <p className="text-sm text-ink/60 mt-2">{p.description}</p>
              <div className="text-xs text-ink/50 font-mono mt-3 space-y-1">
                <p>{p.max_projects ?? 'Unlimited'} projects</p>
                <p>{p.max_staff ?? 'Unlimited'} staff</p>
                <p>{p.max_plots ?? 'Unlimited'} plots</p>
              </div>
              {p.features.length > 0 && (
                <div className="mt-3 space-y-1">
                  {p.features.map((f, i) => (
                    <p key={i} className="text-xs text-ink/70 flex items-start gap-1">
                      <span className="text-brand-500">✓</span> {f.trim()}
                    </p>
                  ))}
                </div>
              )}
              <button onClick={() => setEditingKey(p.plan_key)} className="flex items-center gap-1.5 text-xs font-medium text-ink/60 hover:underline mt-4">
                <Pencil size={12} /> Edit plan
              </button>
            </div>
          )
        ))}
      </div>
    </div>
  )
}
