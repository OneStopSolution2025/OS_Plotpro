import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

const STATUS_COLORS = {
  token_paid: '#F0A500',
  confirmed: '#F0A500',
  cancelled: '#D6362A',
  registered: '#0D0D0D',
}

// Shows a single plot's real GPS location and current booking status —
// only renders if the plot actually has coordinates set by the promoter.
export default function PlotLocationMap({ latitude, longitude, plotNumber, status }) {
  if (latitude == null || longitude == null) return null

  return (
    <div className="rounded-lg overflow-hidden border border-ink/10 mb-4" style={{ height: '260px' }}>
      <MapContainer center={[latitude, longitude]} zoom={17} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <CircleMarker
          center={[latitude, longitude]}
          radius={12}
          pathOptions={{
            color: '#fff',
            weight: 2,
            fillColor: STATUS_COLORS[status] || '#8A8A80',
            fillOpacity: 1,
          }}
        >
          <Popup>
            <div style={{ fontFamily: 'inherit' }}>
              <p style={{ fontWeight: 600 }}>Plot {plotNumber}</p>
              <p style={{ fontSize: 13, color: '#555' }}>Status: {status}</p>
            </div>
          </Popup>
        </CircleMarker>
      </MapContainer>
    </div>
  )
}
