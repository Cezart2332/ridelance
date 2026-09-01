import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Box, GlobalStyles } from '@mui/material'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

import { DEFAULT_CENTER, DEFAULT_ZOOM, MAPBOX_AVAILABLE, MAPBOX_STYLE, MAPBOX_TOKEN } from '../../../lib/mapbox'
import { alpha } from '@mui/material/styles'

import { TOKENS } from '../../../constants/tokens'
import { spreadOffsets } from './spreadOverlapping'
import { MapUnavailable } from './MapUnavailable'
import { CarMapCard } from './CarMapCard'
import { applyBrandTint, attachMapDiagnostics, mapContainerSx } from './mapRuntime'

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
  /** Pentru linkul din card către anunț. */
  slug: string
  latitude: number
  longitude: number
  title: string
  pricePerWeek: number
  oldPrice?: number
  /** Prima poză a anunțului, brută; cardul o trece prin `getCarImageUrl`. */
  imageUrl?: string
  /** Chipurile din card: oraș, motorizare, cutie. Scurte, nu o frază. */
  specs: string[]
  statusLabel: string
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
  /** Motivul pentru care harta n-a pornit. Null cât timp e în regulă. */
  const [failure, setFailure] = useState<string | null>(null)
  /** Mașina al cărei card e deschis. Ținem id-ul, nu obiectul: dacă filtrele scot mașina din
      listă, `openPoint` devine null de la sine și cardul se închide fără efect care s-o observe. */
  const [openId, setOpenId] = useState<string | null>(null)
  /** Nodul în care React randează cardul, dat lui Mapbox drept conținut de popup. Creat o
      singură dată, prin inițializator leneș — nu în corpul randării. */
  const [popupHost] = useState(() => document.createElement('div'))
  const popupRef = useRef<mapboxgl.Popup | null>(null)

  const openPoint = points.find((p) => p.id === openId) ?? null

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

    const detach = attachMapDiagnostics(map, containerRef.current, setFailure)

    // Recolorarea cere stilul deja încărcat; înainte de `style.load` nu există straturi.
    map.on('style.load', () => applyBrandTint(map))

    // Un singur popup, mutat de la un pin la altul. Câte unul per marker ar însemna să reconstruim
    // cardul la fiecare schimbare de filtru, pentru mașini pe care nu dă nimeni click.
    const popup = new mapboxgl.Popup({
      offset: 22,
      closeButton: true,
      maxWidth: 'none',
      className: 'fleet-popup',
    }).setDOMContent(popupHost)
    popup.on('close', () => setOpenId(null))
    popupRef.current = popup

    // Click pe hartă, lângă pinuri: închide cardul. Altfel rămâne agățat peste zona explorată.
    map.on('click', () => setOpenId(null))

    // Butonul de căutare în zonă apare abia după ce utilizatorul a mișcat harta: înainte de
    // asta, „caută aici" ar însemna exact ce se vede deja.
    const onMove = () => {
      movedRef.current = true
      if (searchButtonRef.current) searchButtonRef.current.style.display = 'inline-flex'
    }
    map.on('dragend', onMove)
    map.on('zoomend', onMove)

    return () => {
      detach()
      popup.remove()
      popupRef.current = null
      map.remove()
      mapRef.current = null
      markersRef.current.clear()
    }
  }, [popupHost])

  /**
   * Desface pinurile care s-ar suprapune, la zoomul curent.
   *
   * Se ține într-un ref, nu într-un efect propriu: o cheamă și bucla care creează markerele, și
   * ascultătorul de zoom. Gruparea se face în pixeli, deci se schimbă la fiecare apropiere —
   * mașinile din aceeași curte rămân desfăcute doar cât timp chiar se calcă pe picioare.
   */
  const applySpreadRef = useRef<() => void>(() => {})

  useEffect(() => {
    applySpreadRef.current = () => {
      const map = mapRef.current
      if (!map) return

      const offsets = spreadOffsets(points, (lngLat) => map.project(lngLat))

      for (const [id, offset] of offsets) {
        const marker = markersRef.current.get(id)
        if (!marker) continue

        marker.setOffset(offset)
        // Pinurile desfăcute se leagă vizual între ele: fără semnul ăsta, evantaiul arată ca patru
        // mașini în patru locuri apropiate, nu ca patru mașini în același loc.
        marker.getElement().dataset.spread = offset[0] === 0 && offset[1] === 0 ? 'false' : 'true'
      }
    }
  }, [points])

  // Zoomul schimbă distanțele pe ecran, deci și ce se suprapune.
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const onZoom = () => applySpreadRef.current()
    map.on('zoomend', onZoom)
    return () => {
      map.off('zoomend', onZoom)
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
        // Fără asta, click-ul urcă la hartă, unde handlerul de închidere l-ar anula imediat.
        event.stopPropagation()
        handlers.current.onSelect?.(point.id)
        setOpenId(point.id)
      })

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([point.longitude, point.latitude])
        .addTo(map)

      markersRef.current.set(point.id, marker)
    })

    // Deplasările se calculează după ce toate markerele există: gruparea le compară între ele.
    applySpreadRef.current()

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

  // Cardul urmează punctul deschis: îl mută la pinul lui, sau îl scoate de tot.
  useEffect(() => {
    const map = mapRef.current
    const popup = popupRef.current
    if (!map || !popup) return

    if (!openPoint) {
      popup.remove()
      return
    }

    popup.setLngLat([openPoint.longitude, openPoint.latitude]).addTo(map)
  }, [openPoint])

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

  if (failure) {
    return <MapUnavailable hint={failure} />
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
            boxShadow: '0 4px 14px rgba(0,0,0,0.35)',
            transition: 'transform 140ms ease, box-shadow 140ms ease',
            whiteSpace: 'nowrap',
          },
          '.fleet-marker:hover': { transform: 'translateY(-2px)', zIndex: 3 },
          /*
           * Pinurile desfăcute dintr-un loc comun.
           *
           * Inelul subțire spune că pastila a fost mutată din locul ei exact — altfel evantaiul
           * s-ar citi ca mașini aflate în locuri diferite, adică fix minciuna pe care o repară.
           */
          '.fleet-marker[data-spread="true"]': {
            boxShadow: `0 0 0 2px ${TOKENS.paper}, 0 0 0 3px ${alpha(TOKENS.primary, 0.55)}, 0 4px 14px rgba(0,0,0,0.35)`,
          },
          // Pe fondul întunecat, starea activă nu mai poate fi ink: ar fi însemnat să stingem
          // pinul selectat în hartă. Trece pe albastrul brandului, singura culoare din paletă
          // care iese și din negru, și din albul celorlalte pastile.
          '.fleet-marker.is-active': {
            background: TOKENS.primary,
            color: TOKENS.ink,
            borderColor: TOKENS.primaryStrong,
            transform: 'translateY(-2px) scale(1.04)',
            boxShadow: '0 8px 22px rgba(0,0,0,0.45)',
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
          // Popup-ul devine ramă pentru card: Mapbox îi dă padding și colțuri proprii, care ar
          // fi apărut ca un chenar alb în jurul pozei care merge până la margine.
          '.fleet-popup .mapboxgl-popup-content': {
            padding: 0,
            borderRadius: `${TOKENS.radius.xl}px`,
            overflow: 'hidden',
            boxShadow: '0 12px 34px rgba(16,24,40,0.22)',
            font: 'inherit',
          },
          '.fleet-popup .mapboxgl-popup-close-button': {
            width: 26,
            height: 26,
            top: 6,
            right: 6,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.92)',
            color: TOKENS.ink,
            font: '700 1rem/1 inherit',
            boxShadow: '0 2px 8px rgba(16,24,40,0.18)',
          },
          '.fleet-popup .mapboxgl-popup-close-button:hover': { background: '#FFFFFF' },
          '.fleet-popup .mapboxgl-popup-tip': { borderTopColor: TOKENS.paper, borderBottomColor: TOKENS.paper },
        }}
      />

      <Box ref={containerRef} sx={mapContainerSx} />

      {/* Cardul trăiește în arborele React, dar e randat în nodul pe care îl ține Mapbox. Un
          `createRoot` separat ar fi rupt contextul: cardul are nevoie de router pentru link. */}
      {openPoint && createPortal(<CarMapCard point={openPoint} />, popupHost)}

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
            // Alb pe hartă întunecată, nu ink pe ink.
            bgcolor: TOKENS.paper,
            color: TOKENS.ink,
            fontSize: '0.82rem',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 6px 18px rgba(0,0,0,0.4)',
          }}
        >
          Caută în această zonă
        </Box>
      )}
    </Box>
  )
}

