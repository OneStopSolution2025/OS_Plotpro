import { useEffect, useState } from 'react'
import { Plus, CheckCircle2, Ban, Pencil, Trash2, History, Clock } from 'lucide-react'
import api from '../api/client'
import { useToast } from '../context/ToastContext'
import { errorMessage } from '../utils/errors'

const CURRENCIES = ['INR', 'MYR', 'SGD', 'AED', 'AUD', 'LKR']
const PLANS = ['trial', 'basic', 'pro', 'enterprise']

function PlanHistoryModal({ tenant, onClose }) {
  const [history, setHistory] = useState(null)
  const { showToast } = useToast()

  useEffect(() => {
    api.get(`/tenants/${tenant.id}/plan-history`).then((res) => setHistory(res.data))
      .catch((err) => showToast(errorMessage(err), 'error'))
  }, [])

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="doc-card max-w-md w-full max-h-[80vh] overflow-y-auto p-5" onClick={(e) => e.stopPropagation()}>
        <p className="font-display font-semibold text-ink mb-3">Plan History — {tenant.company_name}</p>
        {!history ? (
          <p className="text-sm text-ink/40">Loading...</p>
        ) : history.length === 0 ? (
          <p className="text-sm text-ink/40">No plan changes recorded yet.</p>
        ) : (
          <div className="space-y-2">
            {history.map((h) => (
              <div key={h.id} className="bg-ink/5 rounded-lg p-3 text-xs">
                <p className="text-ink/50 font-mono">{new Date(h.changed_at).toLocaleString()}</p>
                {h.old_plan !== h.new_plan && (
                  <p className="text-ink mt-1">Plan: <span className="capitalize">{h.old_plan || '—'}</span> → <span className="capitalize font-medium text-brand-500">{h.new_plan}</span></p>
                )}
                {h.old_expires_at !== h.new_expires_at && (
                  <p className="text-ink mt-1">Expiry: {h.old_expires_at || '—'} → <span className="font-medium text-brand-500">{h.new_expires_at || '—'}</span></p>
                )}
                <p className="text-ink/40 mt-1">by {h.changed_by_email}</p>
              </div>
            ))}
          </div>
        )}
        <button onClick={onClose} className="text-sm text-ink/50 hover:text-ink mt-4">Close</button>
      </div>
    </div>
  )
}

function EditTenantForm({ tenant, onDone, onUpdated }) {
  const [form, setForm] = useState({
    company_name: tenant.company_name,
    contact_email: '',
    contact_phone: '',
    country: '',
    currency: '',
    subscription_plan: tenant.subscription_plan,
    subscription_expires_at: tenant.subscription_expires_at || '',
  })
  const { showToast } = useToast()

  const submit = async (e) => {
    e.preventDefault()
    try {
      const payload = Object.fromEntries(Object.entries(form).filter(([, v]) => v !== ''))
      await api.patch(`/tenants/${tenant.id}`, payload)
      showToast('Promoter details updated', 'success')
      onDone()
      onUpdated()
    } catch (err) {
      showToast(errorMessage(err, 'Could not update promoter'), 'error')
    }
  }

  return (
    <form onSubmit={submit} className="doc-card p-5 space-y-2">
      <p className="font-display font-semibold text-ink mb-1">Edit {tenant.company_name}</p>
      <input placeholder="Company name" value={form.company_name}
        onChange={(e) => setForm({ ...form, company_name: e.target.value })}
        className="w-full border border-ink/15 px-3 py-2 text-sm rounded-lg bg-transparent focus:border-brand-500 focus:outline-none" />
      <input placeholder="Contact email (leave blank to keep)" value={form.contact_email}
        onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
        className="w-full border border-ink/15 px-3 py-2 text-sm rounded-lg bg-transparent focus:border-brand-500 focus:outline-none" />
      <input placeholder="Contact phone (leave blank to keep)" value={form.contact_phone}
        onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
        className="w-full border border-ink/15 px-3 py-2 text-sm rounded-lg font-mono bg-transparent focus:border-brand-500 focus:outline-none" />
      <select value={form.subscription_plan} onChange={(e) => setForm({ ...form, subscription_plan: e.target.value })}
        className="w-full border border-ink/15 px-3 py-2 text-sm rounded-lg bg-surface focus:border-brand-500 focus:outline-none">
        {PLANS.map((p) => <option key={p} value={p}>{p}</option>)}
      </select>
      <div>
        <label className="text-xs text-ink/50 uppercase tracking-wide">Subscription expires on</label>
        <input type="date" value={form.subscription_expires_at}
          onChange={(e) => setForm({ ...form, subscription_expires_at: e.target.value })}
          className="w-full border border-ink/15 px-3 py-2 text-sm rounded-lg mt-1 bg-transparent focus:border-brand-500 focus:outline-none" />
      </div>
      <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}
        className="w-full border border-ink/15 px-3 py-2 text-sm rounded-lg bg-surface focus:border-brand-500 focus:outline-none">
        <option value="">Keep current currency</option>
        {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
      </select>
      <div className="flex gap-2 pt-1">
        <button type="submit" className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-1.5 rounded-lg text-sm transition">Save</button>
        <button type="button" onClick={onDone} className="text-sm text-ink/50 hover:text-ink">Cancel</button>
      </div>
    </form>
  )
}

function NewPromoterForm({ onCreated }) {
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    company_name: '', subdomain: '', contact_email: '', contact_phone: '',
    country: 'India', currency: 'INR', admin_full_name: '', admin_password: '',
  })
  const { showToast } = useToast()

  const submit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await api.post('/tenants/onboard', form)
      showToast(`${form.company_name} onboarded — pending your approval to activate`, 'success')
      setForm({ company_name: '', subdomain: '', contact_email: '', contact_phone: '', country: 'India', currency: 'INR', admin_full_name: '', admin_password: '' })
      setOpen(false)
      onCreated()
    } catch (err) {
      showToast(errorMessage(err, 'Could not onboard promoter'), 'error')
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="flex items-center gap-1.5 text-sm text-brand-500 font-medium hover:underline mb-4">
        <Plus size={15} /> Onboard new promoter
      </button>
    )
  }

  return (
    <form onSubmit={submit} className="doc-card p-5 grid grid-cols-2 gap-3 mb-6">
      <p className="col-span-2 font-display font-semibold text-ink">New Promoter</p>
      <input placeholder="Company name" required value={form.company_name}
        onChange={(e) => setForm({ ...form, company_name: e.target.value, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '') })}
        className="border border-ink/15 px-3 py-2 text-sm rounded-lg bg-transparent focus:border-brand-500 focus:outline-none" />
      <div>
        <input placeholder="Account code (auto-filled)" required value={form.subdomain}
          onChange={(e) => setForm({ ...form, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '') })}
          className="w-full border border-ink/15 px-3 py-2 text-sm rounded-lg font-mono bg-transparent focus:border-brand-500 focus:outline-none" />
        <p className="text-[11px] text-ink/40 mt-0.5">Just an internal ID — customers never see this</p>
      </div>
      <input placeholder="Contact email" type="email" required value={form.contact_email}
        onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
        className="border border-ink/15 px-3 py-2 text-sm rounded-lg bg-transparent focus:border-brand-500 focus:outline-none" />
      <input placeholder="Contact phone" value={form.contact_phone}
        onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
        className="border border-ink/15 px-3 py-2 text-sm rounded-lg font-mono bg-transparent focus:border-brand-500 focus:outline-none" />
      <input placeholder="Country" value={form.country}
        onChange={(e) => setForm({ ...form, country: e.target.value })}
        className="border border-ink/15 px-3 py-2 text-sm rounded-lg bg-transparent focus:border-brand-500 focus:outline-none" />
      <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}
        className="border border-ink/15 px-3 py-2 text-sm rounded-lg bg-surface focus:border-brand-500 focus:outline-none">
        {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
      </select>
      <input placeholder="Admin full name" required value={form.admin_full_name}
        onChange={(e) => setForm({ ...form, admin_full_name: e.target.value })}
        className="border border-ink/15 px-3 py-2 text-sm rounded-lg bg-transparent focus:border-brand-500 focus:outline-none" />
      <input placeholder="Admin password" type="password" required value={form.admin_password}
        onChange={(e) => setForm({ ...form, admin_password: e.target.value })}
        className="border border-ink/15 px-3 py-2 text-sm rounded-lg bg-transparent focus:border-brand-500 focus:outline-none" />
      <div className="col-span-2 flex gap-2">
        <button type="submit" disabled={submitting} className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-sm transition disabled:opacity-60">
          {submitting ? 'Onboarding...' : 'Create promoter (pending approval)'}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-sm text-ink/50 hover:text-ink">Cancel</button>
      </div>
    </form>
  )
}

export default function Tenants() {
  const [tenants, setTenants] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingTenant, setEditingTenant] = useState(null)
  const [historyTenant, setHistoryTenant] = useState(null)
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
      showToast(!current ? 'Promoter approved and activated' : 'Promoter suspended', 'success')
      load()
    } catch (err) {
      showToast(errorMessage(err), 'error')
    }
  }

  const deleteTenant = async (tenant) => {
    if (!window.confirm(`Permanently delete "${tenant.company_name}"? This only works if they have no plots or bookings.`)) return
    try {
      await api.delete(`/tenants/${tenant.id}`)
      showToast('Promoter deleted', 'success')
      load()
    } catch (err) {
      showToast(errorMessage(err, 'Could not delete promoter'), 'error')
    }
  }

  if (loading) return <div className="p-6 text-ink/50 text-sm">Loading...</div>

  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-brand-600 font-medium mb-1">Platform Admin</p>
      <h1 className="font-display text-3xl font-bold text-ink mb-4">All Promoters</h1>

      <NewPromoterForm onCreated={load} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tenants.map((t) => (
          editingTenant?.id === t.id ? (
            <EditTenantForm
              key={t.id}
              tenant={t}
              onDone={() => setEditingTenant(null)}
              onUpdated={load}
            />
          ) : (
          <div key={t.id} className="doc-card p-5">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="font-display font-semibold text-ink">{t.company_name}</p>
                <p className="text-xs text-ink/50 font-mono">{t.subdomain}</p>
              </div>
              <span className={`record-tag ${t.is_active ? 'text-brand-600' : 'text-rust-500'}`}>
                {t.is_active ? 'active' : 'pending'}
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
            <p className="text-xs text-ink/50 mb-1">Plan: <span className="font-mono capitalize">{t.subscription_plan}</span></p>
            {t.subscription_expires_at && (
              <p className={`text-xs mb-3 flex items-center gap-1 ${t.days_to_expiry != null && t.days_to_expiry <= 14 ? 'text-rust-500' : 'text-ink/50'}`}>
                <Clock size={11} /> Expires {t.subscription_expires_at}
                {t.days_to_expiry != null && t.days_to_expiry <= 14 && ` (${t.days_to_expiry <= 0 ? 'expired' : `${t.days_to_expiry}d left`})`}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-4">
              <button
                onClick={() => toggleStatus(t.id, t.is_active)}
                className={`flex items-center gap-1.5 text-xs font-medium hover:underline ${t.is_active ? 'text-rust-500' : 'text-brand-500'}`}
              >
                {t.is_active ? <><Ban size={12} /> Suspend</> : <><CheckCircle2 size={12} /> Approve & activate</>}
              </button>
              <button onClick={() => setEditingTenant(t)} className="flex items-center gap-1.5 text-xs font-medium text-ink/60 hover:underline">
                <Pencil size={12} /> Edit
              </button>
              <button onClick={() => setHistoryTenant(t)} className="flex items-center gap-1.5 text-xs font-medium text-ink/60 hover:underline">
                <History size={12} /> History
              </button>
              <button onClick={() => deleteTenant(t)} className="flex items-center gap-1.5 text-xs font-medium text-rust-500 hover:underline">
                <Trash2 size={12} /> Delete
              </button>
            </div>
          </div>
          )
        ))}
        {tenants.length === 0 && (
          <p className="text-sm text-ink/40 col-span-full">No promoters onboarded yet.</p>
        )}
      </div>

      {historyTenant && (
        <PlanHistoryModal tenant={historyTenant} onClose={() => setHistoryTenant(null)} />
      )}
    </div>
  )
}
