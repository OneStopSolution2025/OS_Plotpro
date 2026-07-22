import { useState } from 'react'
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
// Two tabs: a colored-pin map (matches the admin's live map), and a
// Google Maps embed the customer can drag the street-view pegman onto,
// giving a real look at the surrounding area — no API key required.
export default function PlotLocationMap({ latitude, longitude, plotNumber, status }) {
  const [tab, setTab] = useState('map')
  if (latitude == null || longitude == null) return null

  return (
    <div className="mb-4">
      <div className="flex gap-1 mb-2 text-xs font-mono border border-ink/15 rounded-lg overflow-hidden w-fit">
        <button onClick={() => setTab('map')} className={`px-3 py-1 transition ${tab === 'map' ? 'bg-panel text-white' : 'text-ink/60 hover:bg-ink/5'}`}>
          Map
        </button>
        <button onClick={() => setTab('street')} className={`px-3 py-1 transition ${tab === 'street' ? 'bg-panel text-white' : 'text-ink/60 hover:bg-ink/5'}`}>
          Street View
        </button>
      </div>

      {tab === 'map' ? (
        <div className="rounded-lg overflow-hidden border border-ink/10" style={{ height: '260px' }}>
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
      ) : (
        <div className="rounded-lg overflow-hidden border border-ink/10" style={{ height: '260px' }}>
          <iframe
            title="Plot street view"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            loading="lazy"
            src={`https://maps.google.com/maps?q=${latitude},${longitude}&z=18&output=embed`}
          />
        </div>
      )}
    </div>
  )
}
