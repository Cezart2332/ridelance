import { useEffect, useRef } from 'react'
import { Box, GlobalStyles } from '@mui/material'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

import { DEFAULT_CENTER, DEFAULT_ZOOM, MAPBOX_AVAILABLE, MAPBOX_STYLE, MAPBOX_TOKEN } from '../../../lib/mapbox'
import { TOKENS } from '../../../constants/tokens'
import { MapUnavailable } from './MapUnavailable'

/**
 * Harta flotei, cu un pin per mașină.
 *
 * Pinul e o pastilă cu prețul, nu un ac: pe o hartă cu douăzeci de mașini, prețul e informația
 * după care se alege, iar un ac te obligă să dai click pe fiecare ca s-o afli.
 *
 * Mapbox își gestionează singur DOM-ul; React nu are voie să-i randeze marker-ele, altfel se
 * ceartă pe aceleași noduri. De aceea marker-ele se creează imperativ, într-un efect, și se
 * distrug la fiecare schimbare de listă.
 */

export interface FleetMapPoint {
  id: string
  latitude: number
  longitude: number
  title: string
  pricePerWeek: number
  /** Subtitlul din popup: oraș, motorizare, status. */
  meta: string
  available: boolean
}

interface FleetMapProps {
  points: FleetMapPoint[]
  /** Mașina evidențiată din listă. Harta zboară la ea și îi ridică pinul. */
  activeId?: string | null
  onSelect?: (id: string) => void
  /** „Caută în această zonă" — apelantul primește marginile curente ale hărții. */
  onBoundsSearch?: (bounds: { west: number; south: number; east: number; north: number }) => void
  height?: number | string
}

const formatPrice = (value: number) => `${Math.round(value).toLocaleString('ro-RO')} lei`

export function FleetMap({ points, activeId, onSelect, onBoundsSearch, height = '100%' }: FleetMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map())
  const movedRef = useRef(false)
  const searchButtonRef = useRef<HTMLButtonElement | null>(null)

  // Callback-urile se citesc dintr-un ref: harta se creează o singură dată, iar dependența de
  // funcții recreate la fiecare randare ar fi distrus-o și reconstruit-o continuu.
  //
  // Scrierea se face după randare, nu în corpul ei: un ref citit sau scris în timpul randării
  // rupe randarea concurentă, unde React poate abandona un rezultat pe jumătate calculat.
  const handlers = useRef({ onSelect, onBoundsSearch })
  useEffect(() => {
    handlers.current = { onSelect, onBoundsSearch }
  })

  useEffect(() => {
    if (!MAPBOX_AVAILABLE || !containerRef.current || mapRef.current) return

    mapboxgl.accessToken = MAPBOX_TOKEN
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: MAPBOX_STYLE,
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      attributionControl: false,
    })
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right')
    mapRef.current = map

    // Butonul de căutare în zonă apare abia după ce utilizatorul a mișcat harta: înainte de
    // asta, „caută aici" ar însemna exact ce se vede deja.
    const onMove = () => {
      movedRef.current = true
      if (searchButtonRef.current) searchButtonRef.current.style.display = 'inline-flex'
    }
    map.on('dragend', onMove)
    map.on('zoomend', onMove)

    return () => {
      map.remove()
      mapRef.current = null
      markersRef.current.clear()
    }
  }, [])

  // Marker-ele se refac la fiecare schimbare a listei filtrate.
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    markersRef.current.forEach((marker) => marker.remove())
    markersRef.current.clear()

    points.forEach((point) => {
      const el = document.createElement('button')
      el.type = 'button'
      el.className = 'fleet-marker'
      el.setAttribute('aria-label', `${point.title}, ${formatPrice(point.pricePerWeek)} pe săptămână`)
      el.innerHTML =
        `<span class="fleet-marker__dot${point.available ? ' is-available' : ''}"></span>` +
        `<span>${formatPrice(point.pricePerWeek)}</span>`

      el.addEventListener('click', (event) => {
        event.stopPropagation()
        handlers.current.onSelect?.(point.id)
      })

      const popup = new mapboxgl.Popup({ offset: 18, closeButton: false }).setHTML(
        `<strong>${escapeHtml(point.title)}</strong><br><span>${escapeHtml(point.meta)}</span>`,
      )

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([point.longitude, point.latitude])
        .setPopup(popup)
        .addTo(map)

      markersRef.current.set(point.id, marker)
    })

    // Încadrarea se face doar cât timp utilizatorul n-a mișcat harta singur; altfel i-am muta
    // vederea de sub degete la fiecare schimbare de filtru.
    if (!movedRef.current && points.length > 0) {
      if (points.length === 1) {
        map.flyTo({ center: [points[0].longitude, points[0].latitude], zoom: 12.7 })
      } else {
        const bounds = new mapboxgl.LngLatBounds()
        points.forEach((p) => bounds.extend([p.longitude, p.latitude]))
        map.fitBounds(bounds, { padding: 64, duration: 600, maxZoom: 12 })
      }
    }
  }, [points])

  // Mașina selectată din listă: pin ridicat și hartă adusă peste el.
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    markersRef.current.forEach((marker, id) => {
      marker.getElement().classList.toggle('is-active', id === activeId)
    })

    const point = points.find((p) => p.id === activeId)
    if (point) {
      map.flyTo({ center: [point.longitude, point.latitude], zoom: Math.max(map.getZoom(), 12), duration: 600 })
    }
  }, [activeId, points])

  if (!MAPBOX_AVAILABLE) {
    return <MapUnavailable />
  }

  return (
    <Box sx={{ position: 'relative', height, minHeight: 260, borderRadius: `${TOKENS.radius.lg}px`, overflow: 'hidden' }}>
      {/* Marker-ele sunt noduri DOM create de Mapbox, nu componente React, deci au nevoie de CSS
          real. Stă aici, lângă componenta care le creează, nu într-un fișier global orfan. */}
      <GlobalStyles
        styles={{
          '.fleet-marker': {
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 10px',
            border: `1px solid ${TOKENS.border}`,
            borderRadius: 999,
            background: '#FFFFFF',
            color: TOKENS.ink,
            font: '700 0.78rem/1 inherit',
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(16,24,40,0.14)',
            transition: 'transform 140ms ease, box-shadow 140ms ease',
            whiteSpace: 'nowrap',
          },
          '.fleet-marker:hover': { transform: 'translateY(-2px)' },
          '.fleet-marker.is-active': {
            background: TOKENS.ink,
            color: '#FFFFFF',
            borderColor: TOKENS.ink,
            transform: 'translateY(-2px) scale(1.04)',
            boxShadow: '0 8px 22px rgba(16,24,40,0.28)',
          },
          '.fleet-marker__dot': {
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: TOKENS.textSubtle,
            flexShrink: 0,
          },
          // Verdele apare o singură dată, ca semnal de disponibilitate — restul pastilei e neutru.
          '.fleet-marker__dot.is-available': { background: '#16A34A' },
          '.mapboxgl-popup-content': {
            borderRadius: 12,
            padding: '10px 12px',
            font: '400 0.82rem/1.45 inherit',
            boxShadow: '0 10px 28px rgba(16,24,40,0.18)',
          },
          '.mapboxgl-popup-content strong': { color: TOKENS.ink },
        }}
      />

      <Box ref={containerRef} sx={{ position: 'absolute', inset: 0 }} />

      {onBoundsSearch && (
        <Box
          component="button"
          type="button"
          ref={searchButtonRef}
          onClick={() => {
            const map = mapRef.current
            if (!map) return
            const bounds = map.getBounds()
            if (!bounds) return
            handlers.current.onBoundsSearch?.({
              west: bounds.getWest(),
              south: bounds.getSouth(),
              east: bounds.getEast(),
              north: bounds.getNorth(),
            })
            if (searchButtonRef.current) searchButtonRef.current.style.display = 'none'
          }}
          sx={{
            display: 'none',
            position: 'absolute',
            top: 12,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 2,
            alignItems: 'center',
            gap: 0.6,
            px: 1.6,
            py: 0.9,
            border: 'none',
            borderRadius: `${TOKENS.radius.full}px`,
            bgcolor: TOKENS.ink,
            color: '#FFFFFF',
            fontSize: '0.82rem',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 6px 18px rgba(16,24,40,0.22)',
          }}
        >
          Caută în această zonă
        </Box>
      )}
    </Box>
  )
}

/** Popup-ul primește HTML, deci textul care vine din date trebuie escapat. */
function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char] ?? char,
  )
}
