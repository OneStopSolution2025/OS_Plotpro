import { useEffect, useState, useRef } from 'react'
import { MapPin, Upload, Grid3x3, Map as MapIcon, Search, Plus, FileSpreadsheet, X, ExternalLink, Image as ImageIcon } from 'lucide-react'
import api from '../api/client'
import { useToast } from '../context/ToastContext'
import { errorMessage } from '../utils/errors'
import { formatMoney } from '../utils/currency'
import { useAuth } from '../context/AuthContext'

const STATUS_COLORS = {
  available: 'bg-brand-600',
  hold: 'bg-brass-500',
  booked: 'bg-rust-500',
  sold: 'bg-ink',
  registered: 'bg-ink/50',
}

function NewProjectForm({ onCreated }) {
  const [form, setForm] = useState({ name: '', location: '', survey_number: '', description: '' })
  const [open, setOpen] = useState(false)
  const { showToast } = useToast()

  const submit = async (e) => {
    e.preventDefault()
    try {
      await api.post('/plots/projects', form)
      setForm({ name: '', location: '', survey_number: '', description: '' })
      setOpen(false)
      showToast(`Project "${form.name}" created`, 'success')
      onCreated()
    } catch (err) {
      showToast(errorMessage(err, 'Could not create project'), 'error')
    }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="flex items-center gap-1.5 text-sm text-brand-700 font-medium hover:underline">
        <Plus size={15} /> New project
      </button>
    )
  }

  return (
    <form onSubmit={submit} className="doc-card p-4 space-y-2 mb-4">
      <input placeholder="Project name" required value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        className="w-full border border-ink/15 px-3 py-2 text-sm transition focus:border-brand-500 focus:outline-none" />
      <input placeholder="Location" value={form.location}
        onChange={(e) => setForm({ ...form, location: e.target.value })}
        className="w-full border border-ink/15 px-3 py-2 text-sm transition focus:border-brand-500 focus:outline-none" />
      <input placeholder="Survey number" value={form.survey_number}
        onChange={(e) => setForm({ ...form, survey_number: e.target.value })}
        className="w-full border border-ink/15 px-3 py-2 text-sm transition focus:border-brand-500 focus:outline-none" />
      <textarea placeholder="Short description (shown to customers)" value={form.description} rows={2}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
        className="w-full border border-ink/15 px-3 py-2 text-sm transition focus:border-brand-500 focus:outline-none" />
      <div className="flex gap-2">
        <button type="submit" className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-1.5 text-sm transition">Create</button>
        <button type="button" onClick={() => setOpen(false)} className="text-sm text-ink/50 hover:text-ink">Cancel</button>
      </div>
    </form>
  )
}

function EditProjectForm({ project, onDone, onUpdated }) {
  const [form, setForm] = useState({
    name: project.name, location: project.location || '', survey_number: project.survey_number || '',
    dtcp_approval_no: project.dtcp_approval_no || '', rera_reg_no: project.rera_reg_no || '', description: project.description || '',
  })
  const { showToast } = useToast()

  const submit = async (e) => {
    e.preventDefault()
    try {
      await api.patch(`/plots/projects/${project.id}`, form)
      showToast('Project updated', 'success')
      onDone()
      onUpdated()
    } catch (err) {
      showToast(errorMessage(err, 'Could not update project'), 'error')
    }
  }

  return (
    <form onSubmit={submit} className="doc-card p-4 space-y-2 mb-4">
      <input placeholder="Project name" required value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        className="w-full border border-ink/15 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none" />
      <input placeholder="Location" value={form.location}
        onChange={(e) => setForm({ ...form, location: e.target.value })}
        className="w-full border border-ink/15 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none" />
      <input placeholder="Survey number" value={form.survey_number}
        onChange={(e) => setForm({ ...form, survey_number: e.target.value })}
        className="w-full border border-ink/15 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none" />
      <input placeholder="DTCP approval no." value={form.dtcp_approval_no}
        onChange={(e) => setForm({ ...form, dtcp_approval_no: e.target.value })}
        className="w-full border border-ink/15 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none" />
      <input placeholder="RERA registration no." value={form.rera_reg_no}
        onChange={(e) => setForm({ ...form, rera_reg_no: e.target.value })}
        className="w-full border border-ink/15 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none" />
      <textarea placeholder="Description" value={form.description} rows={2}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
        className="w-full border border-ink/15 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none" />
      <div className="flex gap-2">
        <button type="submit" className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-1.5 text-sm transition">Save changes</button>
        <button type="button" onClick={onDone} className="text-sm text-ink/50 hover:text-ink">Cancel</button>
      </div>
    </form>
  )
}

// Plot form used both for the classic grid flow (no position) and the
// map flow (pre-filled x/y percent from a click on the layout image).
function NewPlotForm({ projectId, presetPosition, onDone, onCreated }) {
  const [form, setForm] = useState({
    plot_number: '', extent_sqft: '', price_per_sqft: '', facing: '',
    description: '', amenities: '', patta_number: '', google_maps_link: '',
  })
  const [expanded, setExpanded] = useState(false)
  const { showToast } = useToast()

  const submit = async (e) => {
    e.preventDefault()
    try {
      await api.post('/plots', {
        project_id: projectId,
        plot_number: form.plot_number,
        extent_sqft: parseFloat(form.extent_sqft),
        price_per_sqft: parseFloat(form.price_per_sqft),
        facing: form.facing || null,
        description: form.description || null,
        amenities: form.amenities || null,
        patta_number: form.patta_number || null,
        google_maps_link: form.google_maps_link || null,
        map_x_percent: presetPosition?.x ?? null,
        map_y_percent: presetPosition?.y ?? null,
      })
      showToast(`Plot ${form.plot_number} added`, 'success')
      onDone?.()
      onCreated()
    } catch (err) {
      showToast(errorMessage(err, 'Could not add plot'), 'error')
    }
  }

  return (
    <form onSubmit={submit} className="doc-card p-4 grid grid-cols-2 gap-2 animate-[fadeIn_0.15s_ease-out]">
      <input placeholder="Plot no." required autoFocus value={form.plot_number}
        onChange={(e) => setForm({ ...form, plot_number: e.target.value })}
        className="border border-ink/15 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none" />
      <input placeholder="Facing" value={form.facing}
        onChange={(e) => setForm({ ...form, facing: e.target.value })}
        className="border border-ink/15 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none" />
      <input placeholder="Extent (sqft)" type="number" required value={form.extent_sqft}
        onChange={(e) => setForm({ ...form, extent_sqft: e.target.value })}
        className="border border-ink/15 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none" />
      <input placeholder="Price/sqft" type="number" required value={form.price_per_sqft}
        onChange={(e) => setForm({ ...form, price_per_sqft: e.target.value })}
        className="border border-ink/15 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none" />

      {!expanded ? (
        <button type="button" onClick={() => setExpanded(true)} className="col-span-2 text-xs text-brand-700 hover:underline text-left">
          + Add more details (description, amenities, patta no.)
        </button>
      ) : (
        <>
          <textarea placeholder="Description" value={form.description} rows={2}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="col-span-2 border border-ink/15 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none" />
          <input placeholder="Amenities (comma separated)" value={form.amenities}
            onChange={(e) => setForm({ ...form, amenities: e.target.value })}
            className="col-span-2 border border-ink/15 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none" />
          <input placeholder="Patta number" value={form.patta_number}
            onChange={(e) => setForm({ ...form, patta_number: e.target.value })}
            className="border border-ink/15 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none" />
          <input placeholder="Google Maps link" value={form.google_maps_link}
            onChange={(e) => setForm({ ...form, google_maps_link: e.target.value })}
            className="border border-ink/15 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none" />
        </>
      )}

      <div className="col-span-2 flex gap-2">
        <button type="submit" className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-1.5 text-sm transition">Add</button>
        <button type="button" onClick={onDone} className="text-sm text-ink/50 hover:text-ink">Cancel</button>
      </div>
    </form>
  )
}

function LayoutUpload({ projectId, onUploaded }) {
  const inputRef = useRef(null)
  const { showToast } = useToast()

  const handleFile = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    const formData = new FormData()
    formData.append('file', file)
    try {
      await api.post(`/uploads/project-layout/${projectId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      showToast('Layout image uploaded', 'success')
      onUploaded()
    } catch {
      showToast('Upload failed — check file type (JPEG/PNG/WebP)', 'error')
    }
  }

  return (
    <div className="doc-card p-10 text-center">
      <Upload className="mx-auto mb-3 text-ink/30" size={32} />
      <p className="text-sm text-ink/60 mb-3">
        Upload a site layout image to place plots visually — customers and staff will see the real layout instead of a plain grid.
      </p>
      <button
        onClick={() => inputRef.current.click()}
        className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 text-sm transition"
      >
        Upload layout image
      </button>
      <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
    </div>
  )
}

function BulkImportPlots({ projectId, onImported }) {
  const [busy, setBusy] = useState(false)
  const { showToast } = useToast()

  const handleFile = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setBusy(true)
    const formData = new FormData()
    formData.append('file', file)
    try {
      const res = await api.post('/plots/bulk-import', formData, {
        params: { project_id: projectId },
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      showToast(`Imported ${res.data.created} plots${res.data.errors.length ? ` (${res.data.errors.length} rows had errors)` : ''}`, res.data.errors.length ? 'error' : 'success')
      onImported()
    } catch (err) {
      showToast(errorMessage(err, 'CSV import failed'), 'error')
    } finally {
      setBusy(false)
      e.target.value = ''
    }
  }

  return (
    <label className={`flex items-center gap-1.5 text-sm font-medium hover:underline cursor-pointer ${busy ? 'text-ink/40' : 'text-brand-700'}`}>
      <FileSpreadsheet size={15} />
      {busy ? 'Importing...' : 'Bulk import (CSV)'}
      <input type="file" accept=".csv" onChange={handleFile} disabled={busy} className="hidden" />
    </label>
  )
}

function LayoutMap({ project, plots, onUpdated, onCreated, onViewDetail, currency }) {
  const [pendingPosition, setPendingPosition] = useState(null)
  const [openPlotId, setOpenPlotId] = useState(null)
  const imgRef = useRef(null)
  const { showToast } = useToast()

  const handleImageClick = (e) => {
    if (!imgRef.current) return
    const rect = imgRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setPendingPosition({ x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 })
    setOpenPlotId(null)
  }

  const changeStatus = async (plotId, status) => {
    try {
      await api.patch(`/plots/${plotId}`, { status })
      showToast('Plot status updated', 'success')
      setOpenPlotId(null)
      onUpdated()
    } catch (err) {
      showToast(errorMessage(err), 'error')
    }
  }

  const plottedPlots = plots.filter((p) => p.map_x_percent != null && p.map_y_percent != null)

  return (
    <div>
      <p className="text-xs text-ink/50 mb-2">Click anywhere on the layout to place a new plot marker.</p>
      <div className="relative inline-block w-full">
        <img
          ref={imgRef}
          src={project.layout_image_url}
          alt="Site layout"
          onClick={handleImageClick}
          className="w-full cursor-crosshair border border-ink/15"
        />
        {plottedPlots.map((plot) => (
          <button
            key={plot.id}
            onClick={(e) => { e.stopPropagation(); setOpenPlotId(openPlotId === plot.id ? null : plot.id); setPendingPosition(null) }}
            style={{ left: `${plot.map_x_percent}%`, top: `${plot.map_y_percent}%` }}
            className={`absolute -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-2 border-white font-mono text-[9px] text-white flex items-center justify-center shadow transition hover:scale-125 ${STATUS_COLORS[plot.status]}`}
            title={plot.plot_number}
          >
            {plot.plot_number.slice(-2)}
          </button>
        ))}

        {openPlotId && (() => {
          const plot = plots.find((p) => p.id === openPlotId)
          if (!plot) return null
          return (
            <div
              style={{ left: `${plot.map_x_percent}%`, top: `${plot.map_y_percent}%` }}
              className="absolute -translate-x-1/2 mt-4 doc-card p-3 w-48 text-xs shadow-lg z-10"
            >
              <p className="font-mono font-medium text-ink mb-1">Plot {plot.plot_number}</p>
              <p className="font-mono text-ink/60 mb-2">{formatMoney(plot.total_price, currency)}</p>
              <button onClick={() => onViewDetail(plot.id)} className="text-brand-700 hover:underline mb-2 block">
                View full details →
              </button>
              <div className="flex flex-wrap gap-1">
                {Object.keys(STATUS_COLORS).map((s) => (
                  <button key={s} onClick={() => changeStatus(plot.id, s)}
                    className={`px-2 py-1 ${STATUS_COLORS[s]} text-white text-[10px] font-mono transition hover:opacity-80`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )
        })()}

        {pendingPosition && (
          <div
            style={{ left: `${pendingPosition.x}%`, top: `${pendingPosition.y}%` }}
            className="absolute -translate-x-1/2 z-20 w-64"
          >
            <NewPlotForm
              projectId={project.id}
              presetPosition={pendingPosition}
              onDone={() => setPendingPosition(null)}
              onCreated={onCreated}
            />
          </div>
        )}
      </div>
    </div>
  )
}

function PlotDetailModal({ plotId, onClose, onUpdated, currency }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const inputRef = useRef(null)
  const { showToast } = useToast()

  const load = () => {
    setLoading(true)
    api.get(`/plots/${plotId}/detail`).then((res) => setData(res.data))
      .catch((err) => showToast(errorMessage(err, 'Could not load plot detail'), 'error'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [plotId])

  const uploadImage = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    const formData = new FormData()
    formData.append('file', file)
    try {
      await api.post(`/uploads/plot-image/${plotId}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      showToast('Plot photo uploaded', 'success')
      load()
      onUpdated()
    } catch {
      showToast('Upload failed — check file type', 'error')
    }
  }

  return (
    <div className="fixed inset-0 bg-ink/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="doc-card max-w-2xl w-full max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {loading || !data ? (
          <div className="p-10 text-center text-ink/40 text-sm">Loading plot details...</div>
        ) : (
          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="font-mono text-xs uppercase tracking-widest text-brand-600">Plot Detail</p>
                <h2 className="font-display text-2xl font-semibold text-ink">{data.plot.plot_number}</h2>
              </div>
              <button onClick={onClose} className="text-ink/40 hover:text-ink"><X size={20} /></button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-5">
              <div className="relative">
                {data.plot.image_url ? (
                  <img src={data.plot.image_url} alt={data.plot.plot_number} className="w-full h-40 object-cover border border-ink/15" />
                ) : (
                  <button onClick={() => inputRef.current.click()} className="w-full h-40 border border-dashed border-ink/25 flex flex-col items-center justify-center gap-1 text-ink/40 hover:border-brand-500 hover:text-brand-600 transition">
                    <ImageIcon size={24} />
                    <span className="text-xs">Add plot photo</span>
                  </button>
                )}
                <input ref={inputRef} type="file" accept="image/*" onChange={uploadImage} className="hidden" />
              </div>
              <div className="text-sm space-y-1.5 font-mono">
                <div className="flex justify-between"><span className="text-ink/50 font-sans">Extent</span><span>{data.plot.extent_sqft} sqft</span></div>
                <div className="flex justify-between"><span className="text-ink/50 font-sans">Price</span><span>{formatMoney(data.plot.total_price, currency)}</span></div>
                <div className="flex justify-between"><span className="text-ink/50 font-sans">Facing</span><span>{data.plot.facing || '-'}</span></div>
                <div className="flex justify-between"><span className="text-ink/50 font-sans">Status</span><span className="uppercase">{data.plot.status}</span></div>
                {data.plot.patta_number && <div className="flex justify-between"><span className="text-ink/50 font-sans">Patta No.</span><span>{data.plot.patta_number}</span></div>}
                {data.plot.google_maps_link && (
                  <a href={data.plot.google_maps_link} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-brand-700 hover:underline font-sans text-xs pt-1">
                    <MapPin size={12} /> View on Google Maps <ExternalLink size={10} />
                  </a>
                )}
              </div>
            </div>

            {data.plot.description && (
              <div className="mb-4">
                <p className="text-xs uppercase tracking-wide text-ink/40 mb-1">Description</p>
                <p className="text-sm text-ink/70">{data.plot.description}</p>
              </div>
            )}
            {data.plot.amenities && (
              <div className="mb-5">
                <p className="text-xs uppercase tracking-wide text-ink/40 mb-1">Amenities</p>
                <div className="flex flex-wrap gap-1.5">
                  {data.plot.amenities.split(',').map((a, i) => (
                    <span key={i} className="record-tag text-brand-600">{a.trim()}</span>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t border-ink/10 pt-4">
              <p className="font-display font-medium text-ink text-sm mb-2">Booking History</p>
              {data.bookings.length === 0 ? (
                <p className="text-sm text-ink/40">No bookings on this plot yet.</p>
              ) : (
                <div className="space-y-2">
                  {data.bookings.map((b) => (
                    <div key={b.id} className="bg-ink/5 p-3 text-sm flex justify-between items-center">
                      <div>
                        <p className="font-medium text-ink">{b.customer_name}</p>
                        <p className="text-xs text-ink/50 font-mono">{b.customer_phone}</p>
                      </div>
                      <div className="text-right">
                        <span className="record-tag text-brand-600">{b.status}</span>
                        <p className="text-xs text-ink/50 font-mono mt-1">{formatMoney(b.total_paid, currency)} paid</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {data.documents.length > 0 && (
              <div className="border-t border-ink/10 pt-4 mt-4">
                <p className="font-display font-medium text-ink text-sm mb-2">Linked Documents</p>
                <div className="space-y-1">
                  {data.documents.map((d) => (
                    <a key={d.id} href={d.file_url} target="_blank" rel="noreferrer" className="block text-sm text-brand-700 hover:underline">
                      {d.document_type.replace(/_/g, ' ')}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function Projects() {
  const { user } = useAuth()
  const currency = user?.tenant_currency || 'INR'
  const [projects, setProjects] = useState([])
  const [selectedProject, setSelectedProject] = useState(null)
  const [editingProject, setEditingProject] = useState(null)
  const [plots, setPlots] = useState([])
  const [view, setView] = useState('map') // 'map' | 'grid'
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [detailPlotId, setDetailPlotId] = useState(null)

  const loadProjects = () => api.get('/plots/projects').then((res) => {
    setProjects(res.data)
    if (selectedProject) {
      const updated = res.data.find((p) => p.id === selectedProject.id)
      if (updated) setSelectedProject(updated)
    }
  })
  const loadPlots = (projectId) => {
    setLoading(true)
    api.get('/plots', { params: { project_id: projectId } })
      .then((res) => setPlots(res.data))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadProjects() }, [])
  useEffect(() => {
    if (selectedProject) loadPlots(selectedProject.id)
  }, [selectedProject?.id])

  const { showToast } = useToast()
  const deleteProject = async (project) => {
    if (!window.confirm(`Delete "${project.name}"? This only works if it has no plots.`)) return
    try {
      await api.delete(`/plots/projects/${project.id}`)
      showToast('Project deleted', 'success')
      if (selectedProject?.id === project.id) setSelectedProject(null)
      loadProjects()
    } catch (err) {
      showToast(errorMessage(err, 'Could not delete project'), 'error')
    }
  }

  const filteredPlots = plots.filter((p) =>
    p.plot_number.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-widest text-brand-600 mb-1">Inventory</p>
      <h1 className="font-display text-3xl font-semibold text-ink mb-4">Projects &amp; Plots</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Project list */}
        <div className="lg:col-span-1">
          <NewProjectForm onCreated={loadProjects} />
          <div className="space-y-2 mt-3">
            {projects.map((p) => (
              editingProject?.id === p.id ? (
                <EditProjectForm
                  key={p.id}
                  project={p}
                  onDone={() => setEditingProject(null)}
                  onUpdated={loadProjects}
                />
              ) : (
                <div
                  key={p.id}
                  className={`w-full text-left p-3 border transition ${
                    selectedProject?.id === p.id ? 'border-brand-600 bg-brand-50' : 'border-ink/10 bg-white hover:border-ink/25'
                  }`}
                >
                  <button onClick={() => setSelectedProject(p)} className="w-full text-left">
                    <p className="font-medium text-ink text-sm">{p.name}</p>
                    <p className="text-xs text-ink/50 flex items-center gap-1"><MapPin size={11} />{p.location || 'No location set'}</p>
                  </button>
                  <div className="flex gap-3 mt-1.5">
                    <button onClick={() => setEditingProject(p)} className="text-xs text-brand-700 hover:underline">Edit</button>
                    <button onClick={() => deleteProject(p)} className="text-xs text-rust-500 hover:underline">Delete</button>
                  </div>
                </div>
              )
            ))}
            {projects.length === 0 && <p className="text-sm text-ink/40">No projects yet — create one to get started.</p>}
          </div>
        </div>

        {/* Plot view for selected project */}
        <div className="lg:col-span-2">
          {!selectedProject ? (
            <div className="doc-card p-10 text-center text-ink/40 text-sm">
              Select a project to view and manage its plots.
            </div>
          ) : (
            <div className="doc-card p-5">
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <h2 className="font-display font-semibold text-ink">{selectedProject.name}</h2>
                <div className="flex items-center gap-3">
                  {selectedProject.layout_image_url && (
                    <div className="flex text-xs font-mono border border-ink/15">
                      <button onClick={() => setView('map')}
                        className={`px-2 py-1 flex items-center gap-1 transition ${view === 'map' ? 'bg-ink text-white' : 'text-ink/60 hover:bg-ink/5'}`}>
                        <MapIcon size={12} /> map
                      </button>
                      <button onClick={() => setView('grid')}
                        className={`px-2 py-1 flex items-center gap-1 transition ${view === 'grid' ? 'bg-ink text-white' : 'text-ink/60 hover:bg-ink/5'}`}>
                        <Grid3x3 size={12} /> grid
                      </button>
                    </div>
                  )}
                  <div className="relative">
                    <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-ink/30" />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search plot no."
                      className="border border-ink/15 pl-6 pr-2 py-1 text-xs w-32 font-mono focus:border-brand-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Legend */}
              <div className="flex gap-4 mb-4 text-xs text-ink/60 font-mono flex-wrap">
                {Object.entries(STATUS_COLORS).map(([status, color]) => (
                  <div key={status} className="flex items-center gap-1.5">
                    <span className={`w-2.5 h-2.5 ${color}`} />
                    {status}
                  </div>
                ))}
              </div>

              {loading ? (
                <p className="text-sm text-ink/40">Loading plots...</p>
              ) : selectedProject.layout_image_url && view === 'map' ? (
                <LayoutMap project={selectedProject} plots={plots} onUpdated={() => loadPlots(selectedProject.id)} onCreated={() => loadPlots(selectedProject.id)} onViewDetail={setDetailPlotId} currency={currency} />
              ) : !selectedProject.layout_image_url ? (
                <>
                  <LayoutUpload projectId={selectedProject.id} onUploaded={loadProjects} />
                  <div className="mt-4">
                    <div className="flex items-center gap-4">
                      <NewPlotFormToggle projectId={selectedProject.id} onCreated={() => loadPlots(selectedProject.id)} />
                      <BulkImportPlots projectId={selectedProject.id} onImported={() => loadPlots(selectedProject.id)} />
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 mt-3 grid-paper p-2">
                      {filteredPlots.map((plot) => (
                        <PlotCell key={plot.id} plot={plot} onUpdated={() => loadPlots(selectedProject.id)} onViewDetail={() => setDetailPlotId(plot.id)} currency={currency} />
                      ))}
                    </div>
                    {filteredPlots.length === 0 && <p className="text-sm text-ink/40 mt-2">No plots added yet.</p>}
                  </div>
                </>
              ) : (
                <div className="grid-paper p-2">
                  <div className="flex items-center gap-4">
                    <NewPlotFormToggle projectId={selectedProject.id} onCreated={() => loadPlots(selectedProject.id)} />
                    <BulkImportPlots projectId={selectedProject.id} onImported={() => loadPlots(selectedProject.id)} />
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 mt-3">
                    {filteredPlots.map((plot) => (
                      <PlotCell key={plot.id} plot={plot} onUpdated={() => loadPlots(selectedProject.id)} onViewDetail={() => setDetailPlotId(plot.id)} currency={currency} />
                    ))}
                  </div>
                  {filteredPlots.length === 0 && <p className="text-sm text-ink/40 mt-2">No plots match.</p>}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {detailPlotId && (
        <PlotDetailModal
          plotId={detailPlotId}
          onClose={() => setDetailPlotId(null)}
          onUpdated={() => selectedProject && loadPlots(selectedProject.id)}
          currency={currency}
        />
      )}
    </div>
  )
}

function NewPlotFormToggle({ projectId, onCreated }) {
  const [open, setOpen] = useState(false)
  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="flex items-center gap-1.5 text-sm text-brand-700 font-medium hover:underline">
        <Plus size={15} /> Add plot
      </button>
    )
  }
  return <NewPlotForm projectId={projectId} onDone={() => setOpen(false)} onCreated={onCreated} />
}

function PlotCell({ plot, onUpdated, onViewDetail, currency }) {
  const [open, setOpen] = useState(false)
  const { showToast } = useToast()

  const changeStatus = async (status) => {
    try {
      await api.patch(`/plots/${plot.id}`, { status })
      showToast('Plot status updated', 'success')
      setOpen(false)
      onUpdated()
    } catch (err) {
      showToast(errorMessage(err), 'error')
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`w-full aspect-square text-white font-mono flex flex-col items-center justify-center border border-black/10 transition hover:brightness-110 hover:scale-[1.03] ${STATUS_COLORS[plot.status]}`}
        title={`Plot ${plot.plot_number} — ${plot.extent_sqft} sqft`}
      >
        <span className="text-xs font-medium">{plot.plot_number}</span>
        <span className="text-[10px] opacity-80">{plot.extent_sqft} sqft</span>
      </button>

      {open && (
        <div className="absolute z-10 top-full mt-1 left-0 doc-card p-3 w-48 text-xs shadow-lg">
          <p className="font-mono font-medium text-ink mb-1">Plot {plot.plot_number}</p>
          <p className="font-mono text-ink/60 mb-2">{formatMoney(plot.total_price, currency)}</p>
          <button onClick={onViewDetail} className="text-brand-700 hover:underline mb-2 block">View full details →</button>
          <p className="text-ink/40 mb-2 uppercase tracking-wide text-[10px]">Change status:</p>
          <div className="flex flex-wrap gap-1">
            {Object.keys(STATUS_COLORS).map((s) => (
              <button
                key={s}
                onClick={() => changeStatus(s)}
                className={`px-2 py-1 ${STATUS_COLORS[s]} text-white text-[10px] font-mono transition hover:opacity-80`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
