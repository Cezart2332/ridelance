import { useEffect, useRef, useState } from 'react'
import { Box, GlobalStyles } from '@mui/material'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

import { MAPBOX_AVAILABLE, MAPBOX_STYLE, MAPBOX_TOKEN } from '../../lib/mapbox'
import { TOKENS } from '../../constants/tokens'
import { MapUnavailable } from '../cars/map/MapUnavailable'
import { applyBrandTint, attachMapDiagnostics, mapContainerSx } from '../cars/map/mapRuntime'
import { MAP_FRAME_SX } from './mapFrame'
import {
  PLATFORMS,
  type PlatformId,
  type RidesharingLocation,
} from '../../data/ridesharingCities'

/**
 * Harta acoperirii: fiecare oraș din listă, pe harta reală a țării.
 *
 * Aceeași infrastructură ca harta flotei — token, stil întunecat recolorat cu culorile noastre,
 * diagnostice, mesaj când lipsește tokenul. Un al doilea mod de a porni Mapbox ar fi însemnat că
 * următorul bug de încărcare trebuie găsit de două ori.
 *
 * Mărimea punctului spune pe câte platforme e disponibil orașul, nu culoarea. Trei culori de marcă
 * împrăștiate pe hartă ar fi făcut-o un tablou de puncte colorate; întrebarea la care răspunde
 * harta e „cât de acoperit e locul ăsta", iar mărcile își spun numele în card și în popup.
 */

/** Încadrarea inițială: colțurile României, nu un centru cu zoom ghicit. */
const ROMANIA_BOUNDS: [[number, number], [number, number]] = [
  [20.26, 43.62],
  [29.69, 48.27],
]

/**
 * Cât de departe se poate plimba harta: țara, cu o margine subțire.
 *
 * `maxBounds` din Mapbox ține **cadrul** în dreptunghi, nu centrul, și n-are milă când nu încape:
 * mărește zoomul până intră, iar dacă tot nu poate, blochează harta pe loc. Marginea trebuie deci
 * să fie mai mare decât încadrarea pe țară, care e ea însăși mai largă decât granițele — are spațiu
 * de respirație pe margini. Prea strânsă, harta pornea apropiată cu forța și nu mai zbura nicăieri
 * la apăsarea unui oraș. Joc rămas: sub un grad, cât să nu pară un zid.
 *
 * Restul îl face forma cutiei. Fiind exact raportul României (vezi `mapFrame.ts`), vederea pe
 * țară încape în dreptunghi pe ambele axe, deci constrângerea prinde și pe orizontală, și pe
 * verticală. Cu o cutie mai înaltă, axa verticală rămânea liberă și se ajungea în Turcia.
 */
const PAN_LIMIT: [[number, number], [number, number]] = [
  [18.76, 42.52],
  [31.19, 49.37],
]

interface CoverageMapProps {
  locations: RidesharingLocation[]
  /** Platforma din filtru. `null` = toate; atunci nimic nu se estompează. */
  activePlatform: PlatformId | null
  /** Orașul ales dintr-un card sau de pe hartă. */
  selected: string | null
  onSelect: (name: string | null) => void
}

export function CoverageMap({
  locations,
  activePlatform,
  selected,
  onSelect,
}: CoverageMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const markersRef = useRef<globalThis.Map<string, mapboxgl.Marker>>(new globalThis.Map())
  const popupRef = useRef<mapboxgl.Popup | null>(null)
  const [popupHost] = useState(() => document.createElement('div'))
  const [failure, setFailure] = useState<string | null>(null)
  /** Cât timp e adevărat, harta se reîncadrează pe țară la fiecare redimensionare. */
  const autoFitRef = useRef(true)
  /**
   * Callback-ul de selecție, ținut într-un ref.
   *
   * Marker-ele se creează o dată, în DOM, nu la fiecare randare. Fără ref, handlerul lor ar fi
   * închis peste primul `onSelect` primit și ar fi rămas acolo — vezi același tipar în `FleetMap`.
   */
  const onSelectRef = useRef(onSelect)
  // Într-un efect, nu în corpul randării: scrierea unui ref în timpul randării e exact tiparul
  // care rupe randarea concurentă, iar aici n-avem nevoie de valoarea nouă mai devreme de
  // următorul click.
  useEffect(() => {
    onSelectRef.current = onSelect
  }, [onSelect])

  useEffect(() => {
    const container = containerRef.current
    if (!MAPBOX_AVAILABLE || !container || mapRef.current) return

    // Copiat local pentru curățare: până rulează ea, `markersRef.current` poate fi alt obiect.
    const markers = markersRef.current

    mapboxgl.accessToken = MAPBOX_TOKEN
    const map = new mapboxgl.Map({
      container,
      style: MAPBOX_STYLE,
      center: [25.0, 45.9],
      zoom: 5,
      // Limita de plimbare se pune abia după încadrare, în `fitRomania`.
      // Peste atât, harta arată străzi dintr-un cartier — altă întrebare decât cea a paginii.
      maxZoom: 11,
      // Fără rotire: harta se citește doar cu nordul sus, iar o hartă rotită accidental din două
      // degete pe telefon e imposibil de readus fără un buton de resetare.
      dragRotate: false,
      touchPitch: false,
      attributionControl: true,
      /**
       * Rotița derulează pagina; harta se apropie doar cu Ctrl apăsat.
       *
       * Fără asta, harta lată cât pagina înghite fiecare derulare care trece peste ea: cine vrea
       * să ajungă la carduri se trezește că a ieșit din țară și nu mai are cum să coboare. Pe
       * telefon, la fel — un deget mută pagina, două mută harta.
       */
      cooperativeGestures: true,
      locale: {
        'ScrollZoomBlocker.CtrlMessage': 'Ține Ctrl apăsat și derulează pentru zoom',
        'ScrollZoomBlocker.CmdMessage': 'Ține ⌘ apăsat și derulează pentru zoom',
        'TouchPanBlocker.Message': 'Folosește două degete ca să miști harta',
      },
    })
    map.touchZoomRotate.disableRotation()
    mapRef.current = map

    /**
     * Încadrarea pe țară se face **după** ce containerul are dimensiune, nu din constructor.
     *
     * `bounds` la construcție se calculează pe mărimea de atunci a containerului, iar componenta
     * se montează sub `Suspense`, deci ajunge să se măsoare pe 0×0. Rezultatul era o hartă prea
     * apropiată, cu Aradul tăiat de marginea din stânga: `resize` de mai târziu păstrează centrul
     * și zoomul, nu reface potrivirea.
     *
     * Se reface și la fiecare redimensionare — rotirea telefonului, panoul care își schimbă
     * lățimea — dar numai cât timp utilizatorul n-a mișcat singur harta.
     */
    const fitRomania = () => {
      if (!autoFitRef.current) return

      // `minZoom` se scoate mai întâi, altfel cel pus la potrivirea anterioară — de pe un ecran
      // mai îngust — ar împiedica potrivirea nouă să se depărteze cât trebuie.
      map.setMinZoom(0)
      map.fitBounds(ROMANIA_BOUNDS, { padding: 28, duration: 0 })

      // Vederea pe țară devine limita de depărtare: sub ea n-ar mai fi o hartă a României, ci a
      // Europei de Est. `duration: 0` de mai sus face potrivirea sincronă, deci zoomul e deja cel
      // final când îl citim.
      map.setMinZoom(map.getZoom())

      // Limita de plimbare se pune abia acum, nu din constructor. Acolo ar fi prins camera
      // inițială — centrul și zoomul scrise mai sus, care n-o respectă — iar Mapbox ar fi corectat
      // vederea înainte să apucăm s-o încadrăm noi. Aici, cadrul e deja pe țară și încape în ea.
      map.setMaxBounds(PAN_LIMIT)
    }

    /*
     * Încadrarea se face acum, nu doar la un eveniment.
     *
     * Efectele React rulează după ce browserul a așezat pagina, deci containerul are deja
     * dimensiunea lui — o citește și Mapbox, la construcție. Așa, prima vedere e cea corectă din
     * primul cadru, fără să depindă de momentul în care sosește `load`.
     *
     * `load` și `resize` rămân legate pentru ce vine după: stilul care se încarcă târziu, rotirea
     * telefonului, panoul care își schimbă lățimea.
     */
    fitRomania()

    map.on('load', fitRomania)
    map.on('resize', fitRomania)

    // Doar gesturile omului opresc reîncadrarea. `fitBounds` și `flyTo` produc aceleași
    // evenimente, dar fără `originalEvent` — fără garda asta, harta s-ar bloca singură.
    const markMoved = (event: unknown) => {
      // `zoomstart` e tipat fără `originalEvent`, deși îl poartă la gesturile reale. Citirea se
      // face defensiv, nu prin `as`: dacă tipul se schimbă, aici nu se strică nimic.
      if ((event as { originalEvent?: unknown }).originalEvent) autoFitRef.current = false
    }
    map.on('dragstart', markMoved)
    map.on('zoomstart', markMoved)

    const detach = attachMapDiagnostics(map, container, setFailure)
    map.on('style.load', () => applyBrandTint(map))

    const popup = new mapboxgl.Popup({
      offset: 16,
      closeButton: false,
      maxWidth: 'none',
      className: 'coverage-popup',
    }).setDOMContent(popupHost)
    popupRef.current = popup

    // Click pe hartă, lângă puncte: deselectează. Altfel cardul rămâne evidențiat fără motiv.
    map.on('click', () => onSelectRef.current(null))

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right')

    return () => {
      detach()
      popup.remove()
      popupRef.current = null
      map.remove()
      mapRef.current = null
      markers.clear()
    }
  }, [popupHost])

  // Punctele se construiesc o singură dată: lista de orașe nu se schimbă, doar starea lor.
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    markersRef.current.forEach((marker) => marker.remove())
    markersRef.current.clear()

    for (const location of locations) {
      const el = document.createElement('button')
      el.type = 'button'
      el.className = 'coverage-marker'
      el.dataset.size =
        location.platforms.length >= 3 ? 'lg' : location.platforms.length === 2 ? 'md' : 'sm'
      el.setAttribute(
        'aria-label',
        `${location.name} — ${location.platforms.length} ${location.platforms.length === 1 ? 'platformă' : 'platforme'}`,
      )

      el.addEventListener('click', (event) => {
        // Fără asta, click-ul urcă la hartă, unde handlerul de deselectare l-ar anula imediat.
        event.stopPropagation()
        onSelectRef.current(location.name)
      })

      markersRef.current.set(
        location.name,
        new mapboxgl.Marker({ element: el }).setLngLat([location.lon, location.lat]).addTo(map),
      )
    }
  }, [locations])

  // Filtrul stinge punctele neacoperite, în loc să le scoată: un oraș care dispare de pe hartă
  // arată ca un oraș care nu există, nu ca unul unde platforma aleasă nu merge.
  useEffect(() => {
    for (const location of locations) {
      const marker = markersRef.current.get(location.name)
      if (!marker) continue
      const covered = !activePlatform || location.platforms.includes(activePlatform)
      marker.getElement().classList.toggle('is-dimmed', !covered)
    }
  }, [activePlatform, locations])

  // Orașul selectat: punct ridicat, popup deasupra lui, harta adusă peste el.
  useEffect(() => {
    const map = mapRef.current
    const popup = popupRef.current
    if (!map || !popup) return

    markersRef.current.forEach((marker, name) => {
      marker.getElement().classList.toggle('is-active', name === selected)
    })

    const location = locations.find((l) => l.name === selected)
    if (!location) {
      popup.remove()
      return
    }

    popupHost.replaceChildren(popupContent(location))
    popup.setLngLat([location.lon, location.lat]).addTo(map)

    // Din clipa asta harta arată un oraș ales, nu țara. O reîncadrare automată la următoarea
    // redimensionare i-ar fi mutat vederea de sub ochi.
    autoFitRef.current = false

    map.flyTo({ center: [location.lon, location.lat], zoom: Math.max(map.getZoom(), 7), duration: 700 })
  }, [selected, locations, popupHost])

  if (!MAPBOX_AVAILABLE) return <MapUnavailable />
  if (failure) return <MapUnavailable hint={failure} />

  return (
    <Box
      sx={{
        ...MAP_FRAME_SX,
        position: 'relative',
        borderRadius: `${TOKENS.radius.xl}px`,
        overflow: 'hidden',
        border: `1px solid ${TOKENS.border}`,
      }}
    >
      {/* Marker-ele și popupul sunt noduri DOM făcute de Mapbox, nu componente React, deci au
          nevoie de CSS real. Stă lângă componenta care le creează, nu într-un fișier global. */}
      <GlobalStyles
        styles={{
          '.coverage-marker': {
            display: 'block',
            padding: 0,
            border: '2px solid rgba(255,255,255,0.9)',
            borderRadius: '50%',
            background: TOKENS.primary,
            cursor: 'pointer',
            boxShadow: '0 2px 10px rgba(0,0,0,0.45)',
            transition: 'transform 140ms ease, background 140ms ease, opacity 140ms ease',
          },
          '.coverage-marker[data-size="sm"]': { width: 11, height: 11 },
          '.coverage-marker[data-size="md"]': { width: 15, height: 15 },
          '.coverage-marker[data-size="lg"]': { width: 21, height: 21 },
          '.coverage-marker:hover': { transform: 'scale(1.25)' },
          '.coverage-marker.is-dimmed': {
            background: 'rgba(255,255,255,0.22)',
            borderColor: 'rgba(255,255,255,0.35)',
            opacity: 0.75,
          },
          '.coverage-marker.is-active': {
            background: '#FFFFFF',
            transform: 'scale(1.4)',
            boxShadow: `0 0 0 6px ${TOKENS.primary}55`,
          },
          '.coverage-popup .mapboxgl-popup-content': {
            padding: '10px 13px',
            borderRadius: `${TOKENS.radius.lg}px`,
            boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
          },
          '.coverage-popup .mapboxgl-popup-tip': { borderTopColor: '#fff' },
        }}
      />
      <Box ref={containerRef} sx={mapContainerSx} />
    </Box>
  )
}

/**
 * Conținutul popupului, construit din DOM.
 *
 * Nu e JSX fiindcă Mapbox cere un nod real. Numele și cele trei mărci, atât: e aceeași informație
 * ca pe card, iar oricine deschide harta a venit după ea, nu după o fișă.
 */
function popupContent(location: RidesharingLocation): HTMLElement {
  const root = document.createElement('div')

  const title = document.createElement('div')
  title.textContent = location.name
  title.style.cssText = `font-weight:800;font-size:0.9rem;color:${TOKENS.ink};white-space:nowrap;margin-bottom:7px`
  root.appendChild(title)

  const row = document.createElement('div')
  row.style.cssText = 'display:flex;align-items:center;gap:11px'

  for (const platform of PLATFORMS) {
    const available = location.platforms.includes(platform.id)
    const img = document.createElement('img')
    img.src = platform.logo
    img.alt = `${platform.name}${available ? '' : ' — indisponibil'}`
    img.style.cssText =
      `height:13px;width:auto;` +
      // Marca stinsă, nu ascunsă: absența e o informație, iar un rând mai scurt ar fi obligat
      // ochiul să numere care logo lipsește.
      (available ? '' : 'opacity:0.18;filter:grayscale(1)')
    row.appendChild(img)
  }

  root.appendChild(row)
  return root
}
