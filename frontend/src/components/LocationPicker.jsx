import { useState, useRef } from 'react'
import { MapPin, Search, Check, Loader2 } from 'lucide-react'
import api from '../api/client'

/**
 * Address search that resolves to coordinates automatically — staff type a
 * real place name/address, pick the right match, and lat/lng are filled in
 * behind the scenes. No manual GPS number entry required.
 */
export default function LocationPicker({ latitude, longitude, onChange }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [selectedLabel, setSelectedLabel] = useState(
    latitude != null && longitude != null ? `${latitude.toFixed(5)}, ${longitude.toFixed(5)}` : ''
  )
  const debounceRef = useRef(null)

  const handleQueryChange = (value) => {
    setQuery(value)
    setSelectedLabel('')
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (value.trim().length < 3) {
      setResults([])
      return
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await api.get('/geocode', { params: { q: value } })
        setResults(res.data)
      } catch {
        setResults([])
      } finally {
        setSearching(false)
      }
    }, 500)
  }

  const selectResult = (r) => {
    onChange({ latitude: r.latitude, longitude: r.longitude })
    setSelectedLabel(r.display_name)
    setQuery('')
    setResults([])
  }

  return (
    <div>
      <label className="text-xs font-medium text-ink/70 uppercase tracking-wide block mb-1">
        Location (for live map)
      </label>

      {selectedLabel && (
        <div className="flex items-center gap-2 text-sm text-brand-600 bg-brand-50 rounded-lg px-3 py-2 mb-2">
          <Check size={14} className="flex-shrink-0" />
          <span className="truncate">{selectedLabel}</span>
        </div>
      )}

      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/30" />
        <input
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          placeholder="Type an address or place name..."
          className="w-full border border-ink/15 rounded-lg pl-9 pr-9 py-2 text-sm focus:border-brand-500 focus:outline-none"
        />
        {searching && <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/30 animate-spin" />}
      </div>

      {results.length > 0 && (
        <div className="border border-ink/15 rounded-lg mt-1 overflow-hidden">
          {results.map((r, i) => (
            <button
              key={i}
              type="button"
              onClick={() => selectResult(r)}
              className="w-full text-left px-3 py-2 text-sm hover:bg-brand-50 transition flex items-start gap-2 border-b border-ink/5 last:border-0"
            >
              <MapPin size={13} className="text-ink/30 flex-shrink-0 mt-0.5" />
              <span className="text-ink/80">{r.display_name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
