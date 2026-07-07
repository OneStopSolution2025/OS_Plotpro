import { useEffect, useState } from 'react'
import api from '../api/client'

const STATUS_COLORS = {
  available: 'bg-brand-600',
  hold: 'bg-brass-500',
  booked: 'bg-rust-500',
  sold: 'bg-ink',
  registered: 'bg-ink/50',
}

function NewProjectForm({ onCreated }) {
  const [form, setForm] = useState({ name: '', location: '', survey_number: '' })
  const [open, setOpen] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    await api.post('/plots/projects', form)
    setForm({ name: '', location: '', survey_number: '' })
    setOpen(false)
    onCreated()
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="text-sm text-brand-700 font-medium hover:underline">
        + New project
      </button>
    )
  }

  return (
    <form onSubmit={submit} className="bg-white border border-gray-200 rounded-xl p-4 space-y-2 mb-4">
      <input placeholder="Project name" required value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
      <input placeholder="Location" value={form.location}
        onChange={(e) => setForm({ ...form, location: e.target.value })}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
      <input placeholder="Survey number" value={form.survey_number}
        onChange={(e) => setForm({ ...form, survey_number: e.target.value })}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
      <div className="flex gap-2">
        <button type="submit" className="bg-brand-600 text-white px-4 py-1.5 rounded-lg text-sm">Create</button>
        <button type="button" onClick={() => setOpen(false)} className="text-sm text-gray-500">Cancel</button>
      </div>
    </form>
  )
}

function NewPlotForm({ projectId, onCreated }) {
  const [form, setForm] = useState({ plot_number: '', extent_sqft: '', price_per_sqft: '', facing: '' })
  const [open, setOpen] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    await api.post('/plots', {
      project_id: projectId,
      plot_number: form.plot_number,
      extent_sqft: parseFloat(form.extent_sqft),
      price_per_sqft: parseFloat(form.price_per_sqft),
      facing: form.facing || null,
    })
    setForm({ plot_number: '', extent_sqft: '', price_per_sqft: '', facing: '' })
    setOpen(false)
    onCreated()
  }

  if (!open) {
    return <button onClick={() => setOpen(true)} className="text-sm text-brand-700 font-medium hover:underline">+ Add plot</button>
  }

  return (
    <form onSubmit={submit} className="bg-gray-50 border border-gray-200 rounded-xl p-4 grid grid-cols-2 gap-2 mb-4">
      <input placeholder="Plot no." required value={form.plot_number}
        onChange={(e) => setForm({ ...form, plot_number: e.target.value })}
        className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
      <input placeholder="Facing" value={form.facing}
        onChange={(e) => setForm({ ...form, facing: e.target.value })}
        className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
      <input placeholder="Extent (sqft)" type="number" required value={form.extent_sqft}
        onChange={(e) => setForm({ ...form, extent_sqft: e.target.value })}
        className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
      <input placeholder="Price/sqft" type="number" required value={form.price_per_sqft}
        onChange={(e) => setForm({ ...form, price_per_sqft: e.target.value })}
        className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
      <div className="col-span-2 flex gap-2">
        <button type="submit" className="bg-brand-600 text-white px-4 py-1.5 rounded-lg text-sm">Add</button>
        <button type="button" onClick={() => setOpen(false)} className="text-sm text-gray-500">Cancel</button>
      </div>
    </form>
  )
}

export default function Projects() {
  const [projects, setProjects] = useState([])
  const [selectedProject, setSelectedProject] = useState(null)
  const [plots, setPlots] = useState([])

  const loadProjects = () => api.get('/plots/projects').then((res) => setProjects(res.data))
  const loadPlots = (projectId) => api.get('/plots', { params: { project_id: projectId } }).then((res) => setPlots(res.data))

  useEffect(() => { loadProjects() }, [])
  useEffect(() => {
    if (selectedProject) loadPlots(selectedProject.id)
  }, [selectedProject])

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
              <button
                key={p.id}
                onClick={() => setSelectedProject(p)}
                className={`w-full text-left p-3 border transition ${
                  selectedProject?.id === p.id ? 'border-brand-600 bg-brand-50' : 'border-ink/10 bg-white hover:border-ink/25'
                }`}
              >
                <p className="font-medium text-ink text-sm">{p.name}</p>
                <p className="text-xs text-ink/50">{p.location || 'No location set'}</p>
              </button>
            ))}
            {projects.length === 0 && <p className="text-sm text-ink/40">No projects yet — create one to get started.</p>}
          </div>
        </div>

        {/* Plot grid for selected project */}
        <div className="lg:col-span-2">
          {!selectedProject ? (
            <div className="doc-card p-10 text-center text-ink/40 text-sm">
              Select a project to view and manage its plots.
            </div>
          ) : (
            <div className="doc-card p-5 grid-paper">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-display font-semibold text-ink">{selectedProject.name} — plots</h2>
                <NewPlotForm projectId={selectedProject.id} onCreated={() => loadPlots(selectedProject.id)} />
              </div>

              {/* Legend */}
              <div className="flex gap-4 mb-4 text-xs text-ink/60 font-mono">
                {Object.entries(STATUS_COLORS).map(([status, color]) => (
                  <div key={status} className="flex items-center gap-1.5">
                    <span className={`w-2.5 h-2.5 ${color}`} />
                    {status}
                  </div>
                ))}
              </div>

              {/* Plot grid - visual card per plot, click to see details/status change */}
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {plots.map((plot) => (
                  <PlotCell key={plot.id} plot={plot} onUpdated={() => loadPlots(selectedProject.id)} />
                ))}
              </div>
              {plots.length === 0 && <p className="text-sm text-gray-400 mt-2">No plots added yet.</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function PlotCell({ plot, onUpdated }) {
  const [open, setOpen] = useState(false)

  const changeStatus = async (status) => {
    await api.patch(`/plots/${plot.id}`, { status })
    setOpen(false)
    onUpdated()
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`w-full aspect-square text-white font-mono flex flex-col items-center justify-center border border-black/10 ${STATUS_COLORS[plot.status]}`}
        title={`Plot ${plot.plot_number} — ${plot.extent_sqft} sqft`}
      >
        <span className="text-xs font-medium">{plot.plot_number}</span>
        <span className="text-[10px] opacity-80">{plot.extent_sqft} sqft</span>
      </button>

      {open && (
        <div className="absolute z-10 top-full mt-1 left-0 doc-card p-3 w-48 text-xs shadow-lg">
          <p className="font-mono font-medium text-ink mb-1">Plot {plot.plot_number}</p>
          <p className="font-mono text-ink/60 mb-2">₹{plot.total_price.toLocaleString('en-IN')}</p>
          <p className="text-ink/40 mb-2 uppercase tracking-wide text-[10px]">Change status:</p>
          <div className="flex flex-wrap gap-1">
            {Object.keys(STATUS_COLORS).map((s) => (
              <button
                key={s}
                onClick={() => changeStatus(s)}
                className={`px-2 py-1 ${STATUS_COLORS[s]} text-white text-[10px] font-mono`}
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
