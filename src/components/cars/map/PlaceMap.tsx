import { useEffect, useRef, useState } from 'react'
import { Box } from '@mui/material'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

import { MAPBOX_AVAILABLE, MAPBOX_STYLE, MAPBOX_TOKEN } from '../../../lib/mapbox'
import { TOKENS } from '../../../constants/tokens'
import { MapUnavailable } from './MapUnavailable'
import { applyBrandTint, attachMapDiagnostics, mapContainerSx } from './mapRuntime'

/**
 * Un singur punct pe hartă, de privit.
 *
 * `FleetMap` arată o flotă întreagă și știe despre prețuri, carduri de anunț și „caută în zona
 * asta". Aici nu e nevoie de nimic din toate astea — e adresa unei firme pe mini-site-ul ei — iar
 * a trece un singur pin prin harta flotei ar fi însemnat să inventez un anunț fals ca să am ce-i
 * da.
 *
 * Fără interacțiune în afară de mutarea hărții: harta e ilustrația unei adrese, nu o unealtă.
 * Butonul de „deschide în aplicația de hărți" stă lângă ea, în pagină, unde se și vede.
 */
interface PlaceMapProps {
  latitude: number
  longitude: number
  /** Culoarea pinului. Pe mini-site vine din tema firmei. */
  accent?: string
  height?: number | string
  zoom?: number
  /** Oprește tot ce mișcă harta — pentru previzualizarea din editor. */
  interactive?: boolean
}

export function PlaceMap({
  latitude,
  longitude,
  accent = TOKENS.primary,
  height = 280,
  zoom = 14,
  interactive = true,
}: PlaceMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const markerRef = useRef<mapboxgl.Marker | null>(null)
  /** Motivul pentru care harta n-a pornit. Null cât timp e în regulă. */
  const [failure, setFailure] = useState<string | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!MAPBOX_AVAILABLE || !container || mapRef.current) return

    mapboxgl.accessToken = MAPBOX_TOKEN
    const map = new mapboxgl.Map({
      container,
      style: MAPBOX_STYLE,
      center: [longitude, latitude],
      zoom,
      interactive,
      attributionControl: true,
    })

    const detach = attachMapDiagnostics(map, container, setFailure)
    map.on('load', () => applyBrandTint(map))

    if (interactive) {
      map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right')
    }

    markerRef.current = new mapboxgl.Marker({ color: accent }).setLngLat([longitude, latitude]).addTo(map)
    mapRef.current = map

    return () => {
      detach()
      markerRef.current?.remove()
      markerRef.current = null
      map.remove()
      mapRef.current = null
    }
    // Harta se construiește o singură dată. Mutarea pinului și schimbarea culorii se fac în
    // efectele de mai jos, pe harta existentă: recrearea ei la fiecare atingere de cursor de
    // culoare ar fi însemnat o clipire și o cerere de tile-uri în plus la fiecare tastă.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!mapRef.current || !markerRef.current) return
    markerRef.current.setLngLat([longitude, latitude])
    mapRef.current.easeTo({ center: [longitude, latitude], duration: 400 })
  }, [latitude, longitude])

  useEffect(() => {
    const marker = markerRef.current
    if (!marker) return
    // Mapbox nu expune un setter pentru culoare, dar marker-ul implicit e un SVG cu un singur
    // `fill` — îl schimbăm acolo, în loc să distrugem și să recreăm marker-ul.
    const path = marker.getElement().querySelector('svg path[fill]')
    path?.setAttribute('fill', accent)
  }, [accent])

  if (!MAPBOX_AVAILABLE) {
    return <MapUnavailable />
  }

  return (
    <Box sx={{ position: 'relative', height, borderRadius: `${TOKENS.radius.lg}px`, overflow: 'hidden' }}>
      {failure ? (
        <MapUnavailable hint={failure} />
      ) : (
        <Box ref={containerRef} sx={{ ...mapContainerSx, height: '100%' }} />
      )}
    </Box>
  )
}
