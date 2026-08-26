import { useEffect, useRef, useState } from 'react'
import { Box } from '@mui/material'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

import { DEFAULT_CENTER, DEFAULT_ZOOM, MAPBOX_AVAILABLE, MAPBOX_STYLE, MAPBOX_TOKEN } from '../../../lib/mapbox'
import { TOKENS } from '../../../constants/tokens'
import { MapUnavailable } from './MapUnavailable'
import { attachMapDiagnostics, mapContainerSx } from './mapRuntime'

/**
 * Alegerea locului de preluare prin click pe hartă.
 *
 * Un click pune pinul, tragerea lui îl mută. Nu există „confirmă": pinul **e** valoarea, iar un
 * buton în plus ar fi lăsat loc pentru starea în care harta arată una și formularul are alta.
 */
interface PinPickerProps {
  latitude: number | null
  longitude: number | null
  onChange: (latitude: number, longitude: number) => void
  height?: number
}

export function PinPicker({ latitude, longitude, onChange, height = 300 }: PinPickerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const markerRef = useRef<mapboxgl.Marker | null>(null)
  const onChangeRef = useRef(onChange)
  /** Motivul pentru care harta n-a pornit. Null cât timp e în regulă. */
  const [failure, setFailure] = useState<string | null>(null)

  useEffect(() => {
    onChangeRef.current = onChange
  })

  useEffect(() => {
    if (!MAPBOX_AVAILABLE || !containerRef.current || mapRef.current) return

    mapboxgl.accessToken = MAPBOX_TOKEN
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: MAPBOX_STYLE,
      center: latitude != null && longitude != null ? [longitude, latitude] : DEFAULT_CENTER,
      zoom: latitude != null && longitude != null ? 13 : DEFAULT_ZOOM,
      attributionControl: false,
    })
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right')

    map.on('click', (event) => {
      onChangeRef.current(Number(event.lngLat.lat.toFixed(6)), Number(event.lngLat.lng.toFixed(6)))
    })

    mapRef.current = map

    const detach = attachMapDiagnostics(map, containerRef.current, setFailure)

    return () => {
      detach()
      map.remove()
      mapRef.current = null
      markerRef.current = null
    }
    // Centrul inițial se citește o singură dată, la montare: refacerea hărții la fiecare
    // modificare de coordonate ar fi rupt tragerea pinului la jumătate.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Pinul urmărește valoarea din formular, indiferent dacă a venit din click sau din câmpuri.
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    if (latitude == null || longitude == null) {
      markerRef.current?.remove()
      markerRef.current = null
      return
    }

    if (!markerRef.current) {
      const marker = new mapboxgl.Marker({ color: TOKENS.primaryStrong, draggable: true })
        .setLngLat([longitude, latitude])
        .addTo(map)

      marker.on('dragend', () => {
        const position = marker.getLngLat()
        onChangeRef.current(Number(position.lat.toFixed(6)), Number(position.lng.toFixed(6)))
      })

      markerRef.current = marker
      return
    }

    markerRef.current.setLngLat([longitude, latitude])
  }, [latitude, longitude])

  if (!MAPBOX_AVAILABLE) {
    return (
      <MapUnavailable hint="Fără hartă poți completa manual latitudinea și longitudinea de mai sus." />
    )
  }

  if (failure) {
    return <MapUnavailable hint={`${failure} Între timp poți completa manual latitudinea și longitudinea de mai sus.`} />
  }

  return (
    <Box
      sx={{
        position: 'relative',
        height,
        borderRadius: `${TOKENS.radius.lg}px`,
        overflow: 'hidden',
        border: `1px solid ${TOKENS.border}`,
      }}
    >
      <Box ref={containerRef} sx={mapContainerSx} />
    </Box>
  )
}
