import { useEffect, useState } from 'react'
import api from '../api/client'

const STAGES = ['new', 'site_visit_scheduled', 'site_visit_done', 'negotiation', 'converted', 'lost']

function NewEnquiryForm({ onCreated }) {
  const [form, setForm] = useState({ customer_name: '', customer_phone: '', source: 'phone' })
  const [open, setOpen] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    await api.post('/enquiries', form)
    setForm({ customer_name: '', customer_phone: '', source: 'phone' })
    setOpen(false)
    onCreated()
  }

  if (!open) {
    return <button onClick={() => setOpen(true)} className="text-sm text-brand-700 font-medium hover:underline">+ New enquiry</button>
  }

  return (
    <form onSubmit={submit} className="bg-white border doc-card p-4 flex flex-wrap gap-2 mb-4 items-end">
      <input placeholder="Customer name" required value={form.customer_name}
        onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
        className="border border-ink/15 px-3 py-2 text-sm" />
      <input placeholder="Phone" required value={form.customer_phone}
        onChange={(e) => setForm({ ...form, customer_phone: e.target.value })}
        className="border border-ink/15 px-3 py-2 text-sm" />
      <select value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}
        className="border border-ink/15 px-3 py-2 text-sm">
        {['phone', 'walk_in', 'website', 'referral', 'social_media'].map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
      <button type="submit" className="bg-brand-600 text-white px-4 py-2 text-sm">Save</button>
      <button type="button" onClick={() => setOpen(false)} className="text-sm text-gray-500 px-2">Cancel</button>
    </form>
  )
}

export default function Enquiries() {
  const [enquiries, setEnquiries] = useState([])

  const load = () => api.get('/enquiries').then((res) => setEnquiries(res.data))
  useEffect(() => { load() }, [])

  const updateStage = async (id, stage) => {
    await api.patch(`/enquiries/${id}`, { stage })
    load()
  }

  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-widest text-brand-600 mb-1">CRM</p>
      <h1 className="font-display text-3xl font-semibold text-ink mb-4">Enquiries</h1>
      <NewEnquiryForm onCreated={load} />

      <div className="doc-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-ink/5 text-ink/50 text-left font-mono text-xs uppercase tracking-wide">
            <tr>
              <th className="px-4 py-2">Customer</th>
              <th className="px-4 py-2">Phone</th>
              <th className="px-4 py-2">Source</th>
              <th className="px-4 py-2">Stage</th>
            </tr>
          </thead>
          <tbody>
            {enquiries.map((e) => (
              <tr key={e.id} className="border-t border-ink/10">
                <td className="px-4 py-2 font-medium text-ink">{e.customer_name}</td>
                <td className="px-4 py-2 text-ink/60">{e.customer_phone}</td>
                <td className="px-4 py-2 text-ink/60">{e.source}</td>
                <td className="px-4 py-2">
                  <select
                    value={e.stage}
                    onChange={(ev) => updateStage(e.id, ev.target.value)}
                    className="border border-gray-200 rounded-lg text-xs px-2 py-1"
                  >
                    {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
              </tr>
            ))}
            {enquiries.length === 0 && (
              <tr><td colSpan="4" className="px-4 py-6 text-center text-ink/40">No enquiries yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
