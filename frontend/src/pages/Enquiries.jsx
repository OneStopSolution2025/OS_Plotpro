import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'
import { useToast } from '../context/ToastContext'
import { errorMessage } from '../utils/errors'

const STAGES = ['new', 'site_visit_scheduled', 'site_visit_done', 'negotiation', 'converted', 'lost']

function NewEnquiryForm({ onCreated }) {
  const [form, setForm] = useState({ customer_name: '', customer_phone: '', source: 'phone' })
  const [open, setOpen] = useState(false)
  const { showToast } = useToast()

  const submit = async (e) => {
    e.preventDefault()
    try {
      await api.post('/enquiries', form)
      setForm({ customer_name: '', customer_phone: '', source: 'phone' })
      setOpen(false)
      showToast('Enquiry added', 'success')
      onCreated()
    } catch (err) {
      showToast(errorMessage(err, 'Could not add enquiry'), 'error')
    }
  }

  if (!open) {
    return <button onClick={() => setOpen(true)} className="text-sm text-brand-700 font-medium hover:underline">+ New enquiry</button>
  }

  return (
    <form onSubmit={submit} className="doc-card p-4 flex flex-wrap gap-2 mb-4 items-end">
      <input placeholder="Customer name" required value={form.customer_name}
        onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
        className="border border-ink/15 px-3 py-2 text-sm" />
      <input placeholder="Phone" required value={form.customer_phone}
        onChange={(e) => setForm({ ...form, customer_phone: e.target.value })}
        className="border border-ink/15 px-3 py-2 text-sm font-mono" />
      <select value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}
        className="border border-ink/15 px-3 py-2 text-sm">
        {['phone', 'walk_in', 'website', 'referral', 'social_media'].map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
      <button type="submit" className="bg-brand-600 text-white px-4 py-2 text-sm">Save</button>
      <button type="button" onClick={() => setOpen(false)} className="text-sm text-ink/50 px-2">Cancel</button>
    </form>
  )
}

function ConvertModal({ enquiry, onClose, onConverted }) {
  const [plots, setPlots] = useState([])
  const [plotId, setPlotId] = useState('')
  const [tokenAdvance, setTokenAdvance] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { showToast } = useToast()

  useEffect(() => {
    api.get('/plots', { params: { status_filter: 'available' } }).then((res) => setPlots(res.data))
  }, [])

  const submit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await api.post(`/enquiries/${enquiry.id}/convert-to-booking`, {
        plot_id: plotId,
        token_advance: parseFloat(tokenAdvance || 0),
      })
      showToast(`Converted — booking created for ${enquiry.customer_name}`, 'success')
      onConverted()
      onClose()
    } catch (err) {
      showToast(errorMessage(err, 'Could not convert this enquiry'), 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-ink/40 flex items-center justify-center z-50 p-4">
      <div className="doc-card p-6 w-full max-w-md">
        <h2 className="font-display font-semibold text-ink mb-1">Convert to Booking</h2>
        <p className="text-sm text-ink/60 mb-4">{enquiry.customer_name} · {enquiry.customer_phone}</p>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="text-xs font-medium text-ink/70 uppercase tracking-wide">Plot</label>
            <select required value={plotId} onChange={(e) => setPlotId(e.target.value)}
              className="w-full border border-ink/15 px-3 py-2 text-sm mt-1">
              <option value="">Select available plot</option>
              {plots.map((p) => <option key={p.id} value={p.id}>{p.plot_number} — ₹{p.total_price.toLocaleString('en-IN')}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-ink/70 uppercase tracking-wide">Token advance</label>
            <input type="number" value={tokenAdvance} onChange={(e) => setTokenAdvance(e.target.value)}
              className="w-full border border-ink/15 px-3 py-2 text-sm mt-1 font-mono" />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="submit" disabled={submitting} className="bg-brand-600 text-white px-4 py-2 text-sm disabled:opacity-60">
              {submitting ? 'Converting...' : 'Confirm & create booking'}
            </button>
            <button type="button" onClick={onClose} className="text-sm text-ink/50 px-2">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Enquiries() {
  const [enquiries, setEnquiries] = useState([])
  const [search, setSearch] = useState('')
  const [stageFilter, setStageFilter] = useState('')
  const [selected, setSelected] = useState([])
  const [converting, setConverting] = useState(null)
  const { showToast } = useToast()
  const navigate = useNavigate()

  const load = () => {
    const params = {}
    if (search) params.search = search
    if (stageFilter) params.stage = stageFilter
    api.get('/enquiries', { params }).then((res) => setEnquiries(res.data))
      .catch((err) => showToast(errorMessage(err, 'Could not load enquiries'), 'error'))
  }

  useEffect(() => { load() }, [search, stageFilter])

  const updateStage = async (id, stage) => {
    try {
      await api.patch(`/enquiries/${id}`, { stage })
      load()
    } catch (err) {
      showToast(errorMessage(err), 'error')
    }
  }

  const toggleSelect = (id) => {
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])
  }

  const bulkUpdate = async (stage) => {
    if (selected.length === 0) return
    try {
      await api.post('/enquiries/bulk-update-stage', { enquiry_ids: selected, stage })
      showToast(`Updated ${selected.length} enquiries`, 'success')
      setSelected([])
      load()
    } catch (err) {
      showToast(errorMessage(err), 'error')
    }
  }

  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-widest text-brand-600 mb-1">CRM</p>
      <h1 className="font-display text-3xl font-semibold text-ink mb-4">Enquiries</h1>

      <NewEnquiryForm onCreated={load} />

      <div className="flex flex-wrap gap-2 mb-3 items-center">
        <input
          placeholder="Search by name or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-ink/15 px-3 py-2 text-sm w-64"
        />
        <select value={stageFilter} onChange={(e) => setStageFilter(e.target.value)} className="border border-ink/15 px-3 py-2 text-sm">
          <option value="">All stages</option>
          {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>

        {selected.length > 0 && (
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-xs text-ink/50 font-mono">{selected.length} selected</span>
            <select
              onChange={(e) => e.target.value && bulkUpdate(e.target.value)}
              defaultValue=""
              className="border border-ink/15 px-2 py-1.5 text-xs"
            >
              <option value="" disabled>Bulk set stage...</option>
              {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        )}
      </div>

      <div className="doc-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-ink/5 text-ink/50 text-left font-mono text-xs uppercase tracking-wide">
            <tr>
              <th className="px-4 py-2 w-8"></th>
              <th className="px-4 py-2">Customer</th>
              <th className="px-4 py-2">Phone</th>
              <th className="px-4 py-2">Source</th>
              <th className="px-4 py-2">Stage</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {enquiries.map((e) => (
              <tr key={e.id} className="border-t border-ink/10">
                <td className="px-4 py-2">
                  <input type="checkbox" checked={selected.includes(e.id)} onChange={() => toggleSelect(e.id)} />
                </td>
                <td className="px-4 py-2 font-medium text-ink">{e.customer_name}</td>
                <td className="px-4 py-2 text-ink/60 font-mono">{e.customer_phone}</td>
                <td className="px-4 py-2 text-ink/60">{e.source}</td>
                <td className="px-4 py-2">
                  <select
                    value={e.stage}
                    onChange={(ev) => updateStage(e.id, ev.target.value)}
                    className="border border-ink/15 text-xs px-2 py-1"
                  >
                    {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
                <td className="px-4 py-2">
                  {e.stage !== 'converted' && (
                    <button onClick={() => setConverting(e)} className="text-xs text-brand-700 font-medium hover:underline">
                      Convert to Booking →
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {enquiries.length === 0 && (
              <tr><td colSpan="6" className="px-4 py-6 text-center text-ink/40">No enquiries match your filters</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {converting && (
        <ConvertModal
          enquiry={converting}
          onClose={() => setConverting(null)}
          onConverted={load}
        />
      )}
    </div>
  )
}
