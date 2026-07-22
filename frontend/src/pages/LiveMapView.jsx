import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { formatMoney } from '../utils/currency'

const STATUS_COLORS = {
  available: '#F0A500',
  hold: '#B5DE00',
  booked: '#D6362A',
  sold: '#0D0D0D',
  registered: '#8A8A80',
}

// India centroid — used only if neither the project nor any of its plots
// have coordinates set yet, so the map still renders something sensible.
const FALLBACK_CENTER = [20.5937, 78.9629]

export default function LiveMapView({ project, plots, currency, onViewDetail }) {
  const plottedPlots = plots.filter((p) => p.latitude != null && p.longitude != null)
  const unplottedCount = plots.length - plottedPlots.length

  let center = FALLBACK_CENTER
  let zoom = 5
  if (project.latitude != null && project.longitude != null) {
    center = [project.latitude, project.longitude]
    zoom = 16
  } else if (plottedPlots.length > 0) {
    const avgLat = plottedPlots.reduce((s, p) => s + p.latitude, 0) / plottedPlots.length
    const avgLng = plottedPlots.reduce((s, p) => s + p.longitude, 0) / plottedPlots.length
    center = [avgLat, avgLng]
    zoom = 17
  }

  return (
    <div>
      <div className="flex gap-4 mb-3 text-xs text-ink/60 font-mono flex-wrap">
        {Object.entries(STATUS_COLORS).map(([status, color]) => (
          <div key={status} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
            {status}
          </div>
        ))}
      </div>

      {plottedPlots.length === 0 ? (
        <div className="doc-card p-10 text-center text-ink/40 text-sm">
          No plots have GPS coordinates set yet. Add latitude/longitude when creating or editing a plot to see them on the live map.
        </div>
      ) : (
        <>
          <div className="rounded-lg overflow-hidden border border-ink/10" style={{ height: '420px' }}>
            <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              {plottedPlots.map((plot) => (
                <CircleMarker
                  key={plot.id}
                  center={[plot.latitude, plot.longitude]}
                  radius={10}
                  pathOptions={{
                    color: '#fff',
                    weight: 2,
                    fillColor: STATUS_COLORS[plot.status] || '#8A8A80',
                    fillOpacity: 1,
                  }}
                >
                  <Popup>
                    <div style={{ fontFamily: 'inherit', minWidth: '140px' }}>
                      <p style={{ fontWeight: 600, marginBottom: 4 }}>Plot {plot.plot_number}</p>
                      <p style={{ fontSize: 13, color: '#555', marginBottom: 4 }}>
                        {formatMoney(plot.total_price, currency)} · {plot.status}
                      </p>
                      <button
                        onClick={() => onViewDetail(plot.id)}
                        style={{ fontSize: 12, color: '#F0A500', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                      >
                        View full details →
                      </button>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
            </MapContainer>
          </div>
          {unplottedCount > 0 && (
            <p className="text-xs text-ink/40 mt-2">
              {unplottedCount} plot{unplottedCount > 1 ? 's don\'t' : ' doesn\'t'} have GPS coordinates set yet, so {unplottedCount > 1 ? 'they aren\'t' : 'it isn\'t'} shown here.
            </p>
          )}
        </>
      )}
    </div>
  )
}
