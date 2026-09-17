import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Box, GlobalStyles } from '@mui/material'
import { alpha } from '@mui/material/styles'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

import { DEFAULT_CENTER, MAPBOX_AVAILABLE, MAPBOX_STYLE, MAPBOX_TOKEN } from '../../../lib/mapbox'
import { TOKENS } from '../../../constants/tokens'
import type { EldriveStation } from '../../../data/eldrive'
import { MapUnavailable } from '../../cars/map/MapUnavailable'
import { applyBrandTint, attachMapDiagnostics, mapContainerSx } from '../../cars/map/mapRuntime'
import { EldriveStationCard } from './EldriveStationCard'
import { DAY_PRICE, NIGHT_PRICE, NONSTOP_COLOR, NONSTOP_PRICE, stationRateLabel } from './stationRates'

/**
 * Harta stațiilor Eldrive: pinuri pe stilul nostru de hartă, un card la pinul ales.
 *
 * Aceeași mecanică ca harta flotei — un singur popup mutat între pinuri, cardul randat prin portal
 * ca să rămână în arborele React — dar fără nimic din ce ține de mașini.
 */
interface EldriveStationsMapProps {
  stations: EldriveStation[]
  activeId: string | null
  onSelect: (id: string | null) => void
}

const COMPACT_BELOW_ZOOM = 11.5

/** Fulgerul din lista de stații (BoltRounded), ca SVG: emoji-ul ieșea portocaliu, în afara paletei. */
const BOLT_SVG =
  '<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" fill="currentColor">' +
  '<path d="M11 21h-1l1-7H7.5c-.88 0-.33-.75-.31-.78C8.48 10.94 10.42 7.54 13.01 3h1l-1 7h3.51c.4 0 .62.19.4.66C12.97 17.55 11 21 11 21z"/></svg>'

/** România, cu o margine: harta nu are ce arăta în afara ei. */
const ROMANIA_BOUNDS: [[number, number], [number, number]] = [
  [20.15, 43.35],
  [30.05, 48.35],
]

/**
 * Stațiile cu același punct (Bragadiru 1 și 2 sunt vecine) se desfac pe verticală, ca fiecare pin
 * să poată fi apăsat. Fără asta, unul l-ar acoperi complet pe celălalt.
 */
function spreadOffsets(stations: EldriveStation[]): Map<string, [number, number]> {
  const groups = new Map<string, EldriveStation[]>()
  for (const station of stations) {
    const key = `${station.latitude},${station.longitude}`
    groups.set(key, [...(groups.get(key) ?? []), station])
  }

  const offsets = new Map<string, [number, number]>()
  for (const group of groups.values()) {
    group.forEach((station, index) => {
      offsets.set(station.id, [0, (index - (group.length - 1) / 2) * 34])
    })
  }
  return offsets
}

export function EldriveStationsMap({ stations, activeId, onSelect }: EldriveStationsMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map())
  const popupRef = useRef<mapboxgl.Popup | null>(null)
  const [popupHost] = useState(() => document.createElement('div'))
  const [failure, setFailure] = useState<string | null>(null)
  const onSelectRef = useRef(onSelect)

  useEffect(() => {
    onSelectRef.current = onSelect
  }, [onSelect])

  useEffect(() => {
    const container = containerRef.current
    if (!MAPBOX_AVAILABLE || !container || mapRef.current) return

    mapboxgl.accessToken = MAPBOX_TOKEN
    const map = new mapboxgl.Map({
      container,
      style: MAPBOX_STYLE,
      center: DEFAULT_CENTER,
      zoom: 9.6,
      minZoom: 6.1,
      maxZoom: 18,
      maxBounds: ROMANIA_BOUNDS,
      renderWorldCopies: false,
      // Pe pagină, rotița derulează pagina; harta se mărește din butoane sau cu ctrl.
      cooperativeGestures: true,
    })
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right')

    const detach = attachMapDiagnostics(map, container, setFailure)
    map.on('style.load', () => applyBrandTint(map))

    const popup = new mapboxgl.Popup({
      offset: 20,
      closeButton: true,
      closeOnClick: false,
      maxWidth: 'none',
      className: 'eldrive-popup',
    }).setDOMContent(popupHost)
    popup.on('close', () => onSelectRef.current(null))
    popupRef.current = popup

    map.on('click', () => onSelectRef.current(null))

    // De departe, 17 pastile cu prețuri se suprapun în centrul Bucureștiului. Sub pragul ăsta
    // pinurile rămân doar fulgerul; prețul apare când harta e destul de aproape ca să încapă.
    const syncCompact = () => container.classList.toggle('eldrive-compact', map.getZoom() < COMPACT_BELOW_ZOOM)
    map.on('zoom', syncCompact)
    syncCompact()
    mapRef.current = map

    const markers = markersRef.current
    return () => {
      detach()
      markers.forEach((marker) => marker.remove())
      markers.clear()
      popup.remove()
      popupRef.current = null
      map.remove()
      mapRef.current = null
    }
  }, [popupHost])

  // Pinurile urmează lista filtrată.
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    markersRef.current.forEach((marker) => marker.remove())
    markersRef.current.clear()

    const offsets = spreadOffsets(stations)

    stations.forEach((station) => {
      const el = document.createElement('button')
      el.type = 'button'
      el.className = 'eldrive-marker'
      el.setAttribute('aria-label', `${station.name}, ${stationRateLabel(station)}`)
      // Stilul stă pe pastila din interior: pe buton, Mapbox scrie `transform` la fiecare cadru ca să-l
      // poziționeze, iar o tranziție pe el ar fi făcut pinurile să rămână în urma hărții la mutare.
      el.innerHTML =
        '<span class="eldrive-marker__pill">' +
        `<span class="eldrive-marker__bolt${station.tariff === 'nonstop' ? ' is-nonstop' : ''}">${BOLT_SVG}</span>` +
        `<span class="eldrive-marker__label">${station.tariff === 'nonstop' ? NONSTOP_PRICE : `${NIGHT_PRICE} – ${DAY_PRICE}`}</span>` +
        '</span>'
      el.addEventListener('click', (event) => {
        event.stopPropagation()
        onSelectRef.current(station.id)
      })

      const marker = new mapboxgl.Marker({ element: el, offset: offsets.get(station.id) })
        .setLngLat([station.longitude, station.latitude])
        .addTo(map)
      markersRef.current.set(station.id, marker)
    })

    if (stations.length === 1) {
      map.easeTo({ center: [stations[0].longitude, stations[0].latitude], zoom: 13, duration: 600 })
    } else if (stations.length > 1) {
      const bounds = new mapboxgl.LngLatBounds()
      stations.forEach((s) => bounds.extend([s.longitude, s.latitude]))
      map.fitBounds(bounds, { padding: 56, duration: 600, maxZoom: 12.5 })
    }
  }, [stations])

  const active = stations.find((s) => s.id === activeId) ?? null

  // Pinul ales: evidențiat, adus în centru, cu cardul deschis.
  useEffect(() => {
    const map = mapRef.current
    const popup = popupRef.current
    if (!map || !popup) return

    markersRef.current.forEach((marker, id) => {
      marker.getElement().classList.toggle('is-active', id === activeId)
    })

    if (!active) {
      popup.remove()
      return
    }

    const offset = markersRef.current.get(active.id)?.getOffset()
    popup
      .setOffset(offset ? { bottom: [offset.x, offset.y - 20], top: [offset.x, offset.y + 20] } : 20)
      .setLngLat([active.longitude, active.latitude])
      .addTo(map)
    map.easeTo({ center: [active.longitude, active.latitude], zoom: Math.max(map.getZoom(), 13), duration: 600 })
  }, [active, activeId])

  if (!MAPBOX_AVAILABLE) return <MapUnavailable />
  if (failure) return <MapUnavailable hint={failure} />

  return (
    <Box sx={{ position: 'absolute', inset: 0 }}>
      <GlobalStyles
        styles={{
          '.eldrive-marker': { padding: 0, border: 0, background: 'none', cursor: 'pointer', font: 'inherit' },
          '.eldrive-marker__pill': {
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '5px 10px 5px 5px',
            border: `1px solid ${TOKENS.border}`,
            borderRadius: 999,
            background: '#FFFFFF',
            color: TOKENS.ink,
            font: '700 0.76rem/1 inherit',
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(0,0,0,0.35)',
            transition: 'transform 140ms ease, box-shadow 140ms ease',
            whiteSpace: 'nowrap',
          },
          '.eldrive-compact .eldrive-marker__label': { display: 'none' },
          '.eldrive-compact .eldrive-marker__pill': { padding: 4 },
          '.eldrive-compact .eldrive-marker.is-active .eldrive-marker__label': { display: 'inline' },
          '.eldrive-compact .eldrive-marker.is-active .eldrive-marker__pill': { padding: '5px 10px 5px 5px' },
          '.eldrive-marker:hover .eldrive-marker__pill': { transform: 'translateY(-2px)' },
          '.eldrive-marker:hover, .eldrive-marker.is-active': { zIndex: 4 },
          '.eldrive-marker.is-active .eldrive-marker__pill': {
            background: TOKENS.primary,
            borderColor: TOKENS.primaryStrong,
            transform: 'translateY(-2px) scale(1.05)',
            boxShadow: '0 8px 22px rgba(0,0,0,0.45)',
          },
          '.eldrive-marker__bolt': {
            display: 'grid',
            placeItems: 'center',
            width: 20,
            height: 20,
            borderRadius: '50%',
            fontSize: '0.7rem',
            background: alpha(TOKENS.primary, 0.18),
            color: TOKENS.primaryStrong,
          },
          // Verdele marchează doar tariful non-stop, ca în listă.
          '.eldrive-marker__bolt.is-nonstop': { background: alpha(NONSTOP_COLOR, 0.2), color: NONSTOP_COLOR },
          '.eldrive-marker.is-active .eldrive-marker__bolt': { background: 'rgba(255,255,255,0.7)' },
          '.eldrive-popup .mapboxgl-popup-content': {
            padding: 0,
            borderRadius: `${TOKENS.radius.lg}px`,
            overflow: 'hidden',
            boxShadow: '0 12px 34px rgba(16,24,40,0.22)',
            font: 'inherit',
          },
          '.eldrive-popup .mapboxgl-popup-close-button': {
            width: 26,
            height: 26,
            top: 8,
            right: 8,
            borderRadius: '50%',
            color: TOKENS.textMuted,
            font: '700 1rem/1 inherit',
          },
          '.eldrive-popup .mapboxgl-popup-tip': { borderTopColor: TOKENS.paper, borderBottomColor: TOKENS.paper },
        }}
      />
      <Box ref={containerRef} sx={mapContainerSx} />
      {active && createPortal(<EldriveStationCard station={active} />, popupHost)}
    </Box>
  )
}
