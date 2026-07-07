import { useEffect, useState } from 'react'
import api from '../api/client'
import { useToast } from '../context/ToastContext'
import { errorMessage } from '../utils/errors'

const STATUS_COLORS = {
  open: 'text-rust-500',
  in_progress: 'text-brass-600',
  resolved: 'text-brand-600',
  closed: 'text-ink/40',
}

export default function Support() {
  const [tickets, setTickets] = useState([])
  const [form, setForm] = useState({ subject: '', message: '' })
  const [submitting, setSubmitting] = useState(false)
  const { showToast } = useToast()

  const load = () => api.get('/customer-auth/support-tickets').then((res) => setTickets(res.data))
    .catch((err) => showToast(errorMessage(err, 'Could not load your tickets'), 'error'))

  useEffect(() => { load() }, [])

  const submit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await api.post('/customer-auth/support-tickets', form)
      setForm({ subject: '', message: '' })
      showToast('Support request sent — we\'ll get back to you soon', 'success')
      load()
    } catch (err) {
      showToast(errorMessage(err, 'Could not send your request'), 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto bg-parchment min-h-[calc(100vh-64px)]">
      <p className="font-mono text-xs uppercase tracking-widest text-brand-600 mb-1">Help</p>
      <h1 className="font-display text-2xl font-semibold text-ink mb-4">Support</h1>

      <form onSubmit={submit} className="doc-card p-5 space-y-3 mb-6">
        <p className="font-display font-medium text-ink text-sm">Raise a new request</p>
        <input
          placeholder="What's this about?"
          required
          value={form.subject}
          onChange={(e) => setForm({ ...form, subject: e.target.value })}
          className="w-full border border-ink/15 px-3 py-2 text-sm"
        />
        <textarea
          placeholder="Describe your issue or question..."
          required
          rows={4}
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          className="w-full border border-ink/15 px-3 py-2 text-sm"
        />
        <button type="submit" disabled={submitting} className="bg-brand-600 text-white px-4 py-2 text-sm disabled:opacity-60">
          {submitting ? 'Sending...' : 'Send request'}
        </button>
      </form>

      <p className="font-display font-medium text-ink text-sm mb-2">Your requests</p>
      <div className="space-y-3">
        {tickets.map((t) => (
          <div key={t.id} className="doc-card p-4">
            <div className="flex items-center justify-between mb-1">
              <p className="font-medium text-ink text-sm">{t.subject}</p>
              <span className={`record-tag ${STATUS_COLORS[t.status] || ''}`}>{t.status}</span>
            </div>
            <p className="text-sm text-ink/60 mb-2">{t.message}</p>
            {t.staff_reply && (
              <div className="bg-ink/5 p-2.5 text-sm text-ink/70 border-l-2 border-brand-600 mt-2">
                <span className="font-mono text-[10px] uppercase tracking-wide text-brand-600 block mb-1">Reply</span>
                {t.staff_reply}
              </div>
            )}
          </div>
        ))}
        {tickets.length === 0 && (
          <p className="text-sm text-ink/40">No requests yet.</p>
        )}
      </div>
    </div>
  )
}
