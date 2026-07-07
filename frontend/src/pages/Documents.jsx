import { useEffect, useState } from 'react'
import api from '../api/client'

const DOC_TYPES = ['encumbrance_certificate', 'patta', 'fmb_sketch', 'dtcp_approval', 'rera_approval', 'sale_deed', 'other']

export default function Documents() {
  const [docs, setDocs] = useState([])
  const [projects, setProjects] = useState([])
  const [file, setFile] = useState(null)
  const [docType, setDocType] = useState(DOC_TYPES[0])
  const [projectId, setProjectId] = useState('')

  const load = () => api.get('/uploads/legal-documents').then((res) => setDocs(res.data))
  useEffect(() => {
    load()
    api.get('/plots/projects').then((res) => setProjects(res.data))
  }, [])

  const upload = async (e) => {
    e.preventDefault()
    if (!file) return
    const formData = new FormData()
    formData.append('file', file)
    await api.post('/uploads/legal-document', formData, {
      params: { document_type: docType, project_id: projectId || undefined },
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    setFile(null)
    load()
  }

  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-widest text-brand-600 mb-1">Compliance</p>
      <h1 className="font-display text-3xl font-semibold text-ink mb-4">Legal Documents</h1>
      <p className="text-sm text-ink/50 mb-4">
        EC, patta, DTCP/RERA approvals — track validity and get renewal alerts.
        (EC status is uploaded manually since TN's registration portal has no public API.)
      </p>

      <form onSubmit={upload} className="bg-white border doc-card p-4 flex flex-wrap gap-2 items-end mb-4">
        <select value={docType} onChange={(e) => setDocType(e.target.value)} className="border border-ink/15 px-3 py-2 text-sm">
          {DOC_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
        </select>
        <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className="border border-ink/15 px-3 py-2 text-sm">
          <option value="">No specific project</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <input type="file" onChange={(e) => setFile(e.target.files[0])} className="text-sm" />
        <button type="submit" className="bg-brand-600 text-white px-4 py-2 text-sm">Upload</button>
      </form>

      <div className="doc-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-ink/5 text-ink/50 text-left font-mono text-xs uppercase tracking-wide">
            <tr>
              <th className="px-4 py-2">Type</th>
              <th className="px-4 py-2">Valid until</th>
              <th className="px-4 py-2">File</th>
            </tr>
          </thead>
          <tbody>
            {docs.map((d) => (
              <tr key={d.id} className="border-t border-ink/10">
                <td className="px-4 py-2 text-ink/70">{d.document_type.replace(/_/g, ' ')}</td>
                <td className="px-4 py-2 text-ink/60">{d.valid_until || '-'}</td>
                <td className="px-4 py-2">
                  <a href={d.file_url} target="_blank" rel="noreferrer" className="text-brand-700 hover:underline text-xs">View</a>
                </td>
              </tr>
            ))}
            {docs.length === 0 && (
              <tr><td colSpan="3" className="px-4 py-6 text-center text-ink/40">No documents uploaded yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
