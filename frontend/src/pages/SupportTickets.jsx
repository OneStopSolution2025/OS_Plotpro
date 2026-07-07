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

export default function SupportTickets() {
  const [tickets, setTickets] = useState([])
  const [replying, setReplying] = useState(null)
  const [replyText, setReplyText] = useState('')
  const { showToast } = useToast()

  const load = () => api.get('/support-tickets').then((res) => setTickets(res.data))
    .catch((err) => showToast(errorMessage(err), 'error'))

  useEffect(() => { load() }, [])

  const submitReply = async (id) => {
    try {
      await api.patch(`/support-tickets/${id}`, { staff_reply: replyText, status: 'resolved' })
      showToast('Reply sent', 'success')
      setReplying(null)
      setReplyText('')
      load()
    } catch (err) {
      showToast(errorMessage(err), 'error')
    }
  }

  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-widest text-brand-600 mb-1">Support</p>
      <h1 className="font-display text-3xl font-semibold text-ink mb-4">Support Tickets</h1>

      <div className="space-y-3">
        {tickets.map((t) => (
          <div key={t.id} className="doc-card p-5">
            <div className="flex items-center justify-between mb-1">
              <p className="font-medium text-ink">{t.subject}</p>
              <span className={`record-tag ${STATUS_COLORS[t.status] || ''}`}>{t.status}</span>
            </div>
            <p className="text-sm text-ink/70 mb-3">{t.message}</p>

            {t.staff_reply ? (
              <div className="bg-ink/5 p-3 text-sm text-ink/70 border-l-2 border-brand-600">
                <span className="font-mono text-xs uppercase tracking-wide text-brand-600 block mb-1">Your reply</span>
                {t.staff_reply}
              </div>
            ) : replying === t.id ? (
              <div className="space-y-2">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  rows={3}
                  placeholder="Type your reply..."
                  className="w-full border border-ink/15 px-3 py-2 text-sm"
                />
                <div className="flex gap-2">
                  <button onClick={() => submitReply(t.id)} className="bg-brand-600 text-white px-4 py-1.5 text-sm">Send reply</button>
                  <button onClick={() => setReplying(null)} className="text-sm text-ink/50">Cancel</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setReplying(t.id)} className="text-sm text-brand-700 font-medium hover:underline">
                Reply
              </button>
            )}
          </div>
        ))}
        {tickets.length === 0 && (
          <div className="doc-card p-8 text-center text-ink/40 text-sm">No support tickets yet</div>
        )}
      </div>
    </div>
  )
}
