import { useEffect, useState } from 'react'
import { Plus, CheckCircle2, Ban } from 'lucide-react'
import api from '../api/client'
import { useToast } from '../context/ToastContext'
import { errorMessage } from '../utils/errors'

const CURRENCIES = ['INR', 'MYR', 'SGD', 'AED', 'AUD', 'LKR']

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
      const res = await api.post('/tenants/onboard', form)
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
      <button onClick={() => setOpen(true)} className="flex items-center gap-1.5 text-sm text-brand-600 font-medium hover:underline mb-4">
        <Plus size={15} /> Onboard new promoter
      </button>
    )
  }

  return (
    <form onSubmit={submit} className="doc-card p-5 grid grid-cols-2 gap-3 mb-6">
      <p className="col-span-2 font-display font-semibold text-ink">New Promoter</p>
      <input placeholder="Company name" required value={form.company_name}
        onChange={(e) => setForm({ ...form, company_name: e.target.value })}
        className="border border-ink/15 px-3 py-2 text-sm rounded-lg focus:border-brand-500 focus:outline-none" />
      <input placeholder="Subdomain (e.g. dreamcity)" required value={form.subdomain}
        onChange={(e) => setForm({ ...form, subdomain: e.target.value.toLowerCase().replace(/\s+/g, '') })}
        className="border border-ink/15 px-3 py-2 text-sm rounded-lg font-mono focus:border-brand-500 focus:outline-none" />
      <input placeholder="Contact email" type="email" required value={form.contact_email}
        onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
        className="border border-ink/15 px-3 py-2 text-sm rounded-lg focus:border-brand-500 focus:outline-none" />
      <input placeholder="Contact phone" value={form.contact_phone}
        onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
        className="border border-ink/15 px-3 py-2 text-sm rounded-lg font-mono focus:border-brand-500 focus:outline-none" />
      <input placeholder="Country" value={form.country}
        onChange={(e) => setForm({ ...form, country: e.target.value })}
        className="border border-ink/15 px-3 py-2 text-sm rounded-lg focus:border-brand-500 focus:outline-none" />
      <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}
        className="border border-ink/15 px-3 py-2 text-sm rounded-lg focus:border-brand-500 focus:outline-none">
        {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
      </select>
      <input placeholder="Admin full name" required value={form.admin_full_name}
        onChange={(e) => setForm({ ...form, admin_full_name: e.target.value })}
        className="border border-ink/15 px-3 py-2 text-sm rounded-lg focus:border-brand-500 focus:outline-none" />
      <input placeholder="Admin password" type="password" required value={form.admin_password}
        onChange={(e) => setForm({ ...form, admin_password: e.target.value })}
        className="border border-ink/15 px-3 py-2 text-sm rounded-lg focus:border-brand-500 focus:outline-none" />
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

  if (loading) return <div className="p-6 text-ink/50 text-sm">Loading...</div>

  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-brand-600 font-medium mb-1">Platform Admin</p>
      <h1 className="font-display text-3xl font-bold text-ink mb-4">All Promoters</h1>

      <NewPromoterForm onCreated={load} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tenants.map((t) => (
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
            <p className="text-xs text-ink/50 mb-3">Plan: <span className="font-mono">{t.subscription_plan}</span></p>
            <button
              onClick={() => toggleStatus(t.id, t.is_active)}
              className={`flex items-center gap-1.5 text-xs font-medium hover:underline ${t.is_active ? 'text-rust-500' : 'text-brand-600'}`}
            >
              {t.is_active ? <><Ban size={12} /> Suspend access</> : <><CheckCircle2 size={12} /> Approve & activate</>}
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
