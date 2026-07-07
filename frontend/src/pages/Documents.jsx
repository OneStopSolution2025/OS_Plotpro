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
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Legal Documents</h1>
      <p className="text-sm text-gray-500 mb-4">
        EC, patta, DTCP/RERA approvals — track validity and get renewal alerts.
        (EC status is uploaded manually since TN's registration portal has no public API.)
      </p>

      <form onSubmit={upload} className="bg-white border border-gray-200 rounded-xl p-4 flex flex-wrap gap-2 items-end mb-4">
        <select value={docType} onChange={(e) => setDocType(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
          {DOC_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
        </select>
        <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
          <option value="">No specific project</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <input type="file" onChange={(e) => setFile(e.target.files[0])} className="text-sm" />
        <button type="submit" className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm">Upload</button>
      </form>

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-left">
            <tr>
              <th className="px-4 py-2">Type</th>
              <th className="px-4 py-2">Valid until</th>
              <th className="px-4 py-2">File</th>
            </tr>
          </thead>
          <tbody>
            {docs.map((d) => (
              <tr key={d.id} className="border-t border-gray-100">
                <td className="px-4 py-2 text-gray-700">{d.document_type.replace(/_/g, ' ')}</td>
                <td className="px-4 py-2 text-gray-600">{d.valid_until || '-'}</td>
                <td className="px-4 py-2">
                  <a href={d.file_url} target="_blank" rel="noreferrer" className="text-brand-700 hover:underline text-xs">View</a>
                </td>
              </tr>
            ))}
            {docs.length === 0 && (
              <tr><td colSpan="3" className="px-4 py-6 text-center text-gray-400">No documents uploaded yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
