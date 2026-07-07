import { useEffect, useState } from 'react'
import { Trash2, FileText, Upload } from 'lucide-react'
import api from '../api/client'
import { useToast } from '../context/ToastContext'
import { errorMessage } from '../utils/errors'

const DOC_TYPES = ['encumbrance_certificate', 'patta', 'fmb_sketch', 'dtcp_approval', 'rera_approval', 'sale_deed', 'other']

export default function Documents() {
  const [docs, setDocs] = useState([])
  const [projects, setProjects] = useState([])
  const [file, setFile] = useState(null)
  const [docType, setDocType] = useState(DOC_TYPES[0])
  const [projectId, setProjectId] = useState('')
  const [uploading, setUploading] = useState(false)
  const { showToast } = useToast()

  const load = () => api.get('/uploads/legal-documents').then((res) => setDocs(res.data))
    .catch((err) => showToast(errorMessage(err), 'error'))

  useEffect(() => {
    load()
    api.get('/plots/projects').then((res) => setProjects(res.data))
  }, [])

  const upload = async (e) => {
    e.preventDefault()
    if (!file) return
    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    try {
      await api.post('/uploads/legal-document', formData, {
        params: { document_type: docType, project_id: projectId || undefined },
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setFile(null)
      showToast('Document uploaded', 'success')
      load()
    } catch (err) {
      showToast(errorMessage(err, 'Upload failed — check file type (PDF/JPEG/PNG)'), 'error')
    } finally {
      setUploading(false)
    }
  }

  const remove = async (id) => {
    if (!window.confirm('Delete this document permanently?')) return
    try {
      await api.delete(`/uploads/legal-document/${id}`)
      showToast('Document deleted', 'success')
      load()
    } catch (err) {
      showToast(errorMessage(err), 'error')
    }
  }

  const isExpiringSoon = (validUntil) => {
    if (!validUntil) return false
    const days = (new Date(validUntil) - new Date()) / (1000 * 60 * 60 * 24)
    return days <= 30 && days >= 0
  }

  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-widest text-brand-600 mb-1">Compliance</p>
      <h1 className="font-display text-3xl font-semibold text-ink mb-4">Legal Documents</h1>
      <p className="text-sm text-ink/50 mb-4">
        EC, patta, DTCP/RERA approvals — track validity and get renewal alerts.
        (EC status is uploaded manually since TN's registration portal has no public API.)
      </p>

      <form onSubmit={upload} className="doc-card p-4 flex flex-wrap gap-2 items-end mb-4">
        <select value={docType} onChange={(e) => setDocType(e.target.value)} className="border border-ink/15 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none">
          {DOC_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
        </select>
        <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className="border border-ink/15 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none">
          <option value="">No specific project</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <input type="file" onChange={(e) => setFile(e.target.files[0])} className="text-sm" />
        <button type="submit" disabled={uploading} className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 text-sm transition disabled:opacity-60">
          <Upload size={14} /> {uploading ? 'Uploading...' : 'Upload'}
        </button>
      </form>

      <div className="doc-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-ink/5 text-ink/50 text-left font-mono text-xs uppercase tracking-wide">
            <tr>
              <th className="px-4 py-2">Type</th>
              <th className="px-4 py-2">Valid until</th>
              <th className="px-4 py-2">File</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {docs.map((d) => (
              <tr key={d.id} className="border-t border-ink/10">
                <td className="px-4 py-2 text-ink/70 flex items-center gap-1.5"><FileText size={14} className="text-ink/30" />{d.document_type.replace(/_/g, ' ')}</td>
                <td className={`px-4 py-2 ${isExpiringSoon(d.valid_until) ? 'text-rust-500 font-medium' : 'text-ink/60'}`}>
                  {d.valid_until || '-'} {isExpiringSoon(d.valid_until) && '(expiring soon)'}
                </td>
                <td className="px-4 py-2">
                  <a href={d.file_url} target="_blank" rel="noreferrer" className="text-brand-700 hover:underline text-xs">View</a>
                </td>
                <td className="px-4 py-2">
                  <button onClick={() => remove(d.id)} className="text-ink/30 hover:text-rust-500 transition">
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
            {docs.length === 0 && (
              <tr><td colSpan="4" className="px-4 py-6 text-center text-ink/40">No documents uploaded yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
