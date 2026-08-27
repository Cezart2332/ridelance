import type { SxProps, Theme } from '@mui/material/styles'
import type { Map as MapboxMap } from 'mapbox-gl'

/**
 * Stilul containerului în care Mapbox își montează pânza.
 *
 * Selectorul dublat pe `.mapboxgl-map` nu e paranoia. `mapbox-gl.css` conține
 * `.mapboxgl-map { position: relative; overflow: hidden }`, iar Mapbox pune clasa aia chiar pe
 * containerul nostru. O clasă emotion are aceeași specificitate ca ea, deci cine câștigă depinde
 * de ordinea în care ajung stilurile în `<head>` — și ordinea diferă între dev și build, fiindcă
 * CSS-ul hărții vine cu un chunk încărcat la cerere.
 *
 * Când câștiga Mapbox, containerul rămânea `position: relative` fără înălțime — `inset: 0` nu
 * mai făcea nimic — iar `overflow: hidden` tăia tot ce era înăuntru. Harta se construia corect,
 * nu arunca nicio eroare și nu se vedea absolut nimic.
 *
 * `&.mapboxgl-map` produce `.css-xxx.mapboxgl-map`, cu o clasă în plus, deci câștigă indiferent
 * de ordine. Înălțimea explicită e plasa de siguranță: chiar dacă poziționarea ar pierde din nou,
 * containerul tot umple părintele.
 */
export const mapContainerSx: SxProps<Theme> = {
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  '&.mapboxgl-map': {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
  },
}

/**
 * Cele trei moduri în care o hartă Mapbox rămâne goală fără să se plângă nimeni.
 *
 * 1. **Eroare pe care n-o ascultă nimeni.** Mapbox nu aruncă: emite `error` pe hartă. Fără un
 *    listener, un token respins sau un stil care nu se încarcă lasă o pânză goală și o consolă
 *    curată — exact „harta nu se vede, dar nu dă eroare".
 * 2. **Container fără dimensiune la creare.** O hartă construită într-un dialog care se animează,
 *    într-un tab ascuns sau într-un pas de wizard încă neafișat primește 0×0 și rămâne așa:
 *    Mapbox măsoară containerul o singură dată, la construcție.
 *
 * 3. **Blocaj mut.** Harta se construiește, pânza există, dar `load` nu vine niciodată și nici
 *    `error`: worker-ul `mapbox-gl` n-a pornit, sau un CSP de pe proxy blochează `worker-src
 *    blob:` ori `connect-src api.mapbox.com`. Nimic nu apare nici pe hartă, nici în consola
 *    paginii — eroarea, dacă există, e în worker. De aici vine „un spațiu alb, fără eroare".
 *
 * Toate trei trăiesc aici, nu în fiecare componentă: sunt aceleași pentru harta flotei și pentru
 * alegerea pinului, iar un fix prins într-una singură e chiar felul în care s-a ajuns aici.
 */

/**
 * Cât așteptăm `load` înainte să declarăm harta blocată.
 *
 * Generos intenționat: pe o conexiune slabă stilul plus primele tile-uri pot dura. Un prag mic ar
 * transforma un mobil lent într-un raport de defect.
 */
const LOAD_TIMEOUT_MS = 12_000

/**
 * Eroarea e fatală pentru hartă, sau doar un incident?
 *
 * Un tile care lipsește e recuperabil — harta rămâne folosibilă și n-are rost s-o înlocuim cu un
 * mesaj. Autentificarea respinsă și stilul care nu se încarcă nu sunt: fără ele nu se desenează
 * nimic, niciodată.
 */
function fatalReason(event: unknown): string | null {
  const error = (event as { error?: { status?: number; message?: string } })?.error
  if (!error) return null

  if (error.status === 401 || error.status === 403) {
    return 'Tokenul Mapbox a fost respins. Verifică `VITE_MAPBOX_TOKEN` și restricțiile de domeniu ale tokenului.'
  }

  const message = error.message ?? ''

  if (message.includes('style') || message.includes('Style')) {
    return 'Stilul hărții nu s-a putut încărca. Verifică tokenul și accesul la api.mapbox.com.'
  }

  // Rețea căzută la prima cerere: fără stil, harta nu pornește deloc.
  if (message.includes('Failed to fetch') || message.includes('NetworkError')) {
    return 'Nu s-a putut ajunge la Mapbox. Verifică conexiunea sau dacă rețeaua blochează api.mapbox.com.'
  }

  return null
}

/**
 * Leagă diagnosticele de o hartă proaspăt creată. Întoarce funcția de curățare.
 *
 * @param onFatal Primește motivul citibil când harta nu mai are cum să funcționeze.
 */
export function attachMapDiagnostics(
  map: MapboxMap,
  container: HTMLElement,
  onFatal: (reason: string) => void,
): () => void {
  let settled = false
  // Declarat înaintea lui `settle`, care îl golește: altfel `settle` ar citi un `const` aflat
  // încă în zona moartă temporală dacă vreun eveniment ar apuca să vină mai devreme.
  let watchdog = 0

  const settle = (reason: string | null) => {
    if (settled) return
    settled = true
    window.clearTimeout(watchdog)
    if (reason) onFatal(reason)
  }

  const onError = (event: unknown) => {
    const reason = fatalReason(event)

    if (reason) {
      settle(reason)
      return
    }

    // Restul rămâne în consolă: e util la depanare, dar nu justifică ascunderea hărții.
    console.warn('[mapbox]', (event as { error?: unknown })?.error ?? event)
  }

  map.on('error', onError)
  map.on('load', () => settle(null))

  // Plasa de siguranță pentru blocajul mut: nici `load`, nici `error`. Fără ea, ecranul rămâne
  // gol la nesfârșit și nimeni n-are de unde ști de ce.
  const armWatchdog = () => {
    watchdog = window.setTimeout(() => {
      // Un tab în fundal nu primește cadre, deci Mapbox n-are cum să desenezeze și `load` nu vine.
      // Fără garda asta, orice pagină lăsată deschisă într-un tab inactiv ar raporta un defect
      // care nu există. Ceasul repornește când utilizatorul se întoarce la ea.
      if (document.visibilityState !== 'visible') {
        armWatchdog()
        return
      }

      settle(
        'Harta nu a răspuns. Cel mai des e un Content-Security-Policy care blochează ' +
          'api.mapbox.com sau worker-ul (`worker-src blob:`) — verifică tab-ul Network și ' +
          'consola pentru erori CSP.',
      )
    }, LOAD_TIMEOUT_MS)
  }

  armWatchdog()

  // Containerul își poate primi dimensiunea după crearea hărții. `resize` e idempotent, deci
  // îl putem chema la fiecare schimbare fără să ne pese care dintre ele a fost cea reală.
  const observer = new ResizeObserver(() => map.resize())
  observer.observe(container)

  return () => {
    settled = true
    window.clearTimeout(watchdog)
    observer.disconnect()
    map.off('error', onError)
  }
}

/**
 * Paleta hărții: fond întunecat, cu culorile lăsate să iasă din el.
 *
 * Două variante deschise au picat înainte, pe același lucru: pe un uscat aproape alb, străzile
 * albe și pastilele albe n-aveau de ce se desprinde, iar adâncirea fundalului le apropia doar
 * cu un pas. Problema nu era nuanța, ci că totul stătea în aceeași jumătate a scalei.
 *
 * Pe fond întunecat raportul se rezolvă de la sine: tot ce punem deasupra — pastile albe, card
 * alb, etichete deschise — e la capătul opus al scalei. Iar culorile devin în sfârșit vizibile,
 * pentru că apa și verdele nu mai trebuie să concureze cu albul: pe negru, un albastru saturat
 * se vede, pe alb-pal se spăla.
 *
 * Uscatul stă în familia lui `TOKENS.ink`, nu pe negru pur: negrul absolut sub un card alb dă un
 * contrast dur, iar harta ar fi ieșit din restul platformei.
 */
const MAP_PALETTE = {
  land: '#111A28',
  water: '#17587C',
  green: '#1C4A38',
  road: '#44637E',
  building: '#1A2433',
  label: '#DCE9F2',
  labelHalo: '#111A28',
}

/**
 * Straturile pe care le atingem, recunoscute după id. Stilurile Mapbox n-au o taxonomie, doar
 * convenții de denumire.
 *
 * Din familia drumurilor se albește doar rețeaua carosabilă — `road-simple` și perechile ei de
 * pod și tunel. Restul rămân cum sunt: potecile, treptele, trotuarele și calea ferată se
 * desenează diferit tocmai ca să nu fie confundate cu străzi, iar `-case` e conturul sub asfalt.
 * Vopsite toate cu aceeași culoare, harta pierde exact ierarhia pentru care o citește cineva.
 */
const NOT_A_ROADWAY = /case|rail|path|steps|pedestrian|trail|cycleway|piste/

function layerRole(id: string): keyof typeof MAP_PALETTE | null {
  if (id.includes('water')) return 'water'
  if (id.includes('park') || id.includes('landuse') || id.includes('pitch') || id.includes('grass')) return 'green'
  if (id.includes('building')) return 'building'
  if (/road|bridge|tunnel/.test(id) && !NOT_A_ROADWAY.test(id)) return 'road'
  return null
}

/**
 * Recolorează stilul încărcat, strat cu strat.
 *
 * Fiecare `setPaintProperty` e izolat: id-urile straturilor aparțin stilului Mapbox, nu nouă, și
 * se pot schimba fără preaviz la o versiune nouă. Un id dispărut trebuie să lase harta
 * necolorată, nu s-o dărâme — de aceea nimic de aici nu are voie să arunce mai departe.
 */
export function applyBrandTint(map: MapboxMap): void {
  // Numele proprietăților se iau din semnătura lui Mapbox, nu ca `string`: dacă una dispare
  // dintr-o versiune, vrem eroare la compilare, nu un `setPaintProperty` care tace la rulare.
  const paint = (
    layerId: string,
    property: Parameters<MapboxMap['setPaintProperty']>[1],
    value: Parameters<MapboxMap['setPaintProperty']>[2],
  ) => {
    try {
      map.setPaintProperty(layerId, property, value)
    } catch {
      // Strat inexistent în versiunea asta de stil. Harta rămâne validă fără el.
    }
  }

  const layers = map.getStyle()?.layers
  if (!layers) return

  for (const layer of layers) {
    if (layer.type === 'background') {
      paint(layer.id, 'background-color', MAP_PALETTE.land)
      continue
    }

    if (layer.type === 'symbol') {
      // Etichetele urcă pe ink, cu halou alb: pe fundalul colorat, gri-ul implicit se pierdea.
      paint(layer.id, 'text-color', MAP_PALETTE.label)
      paint(layer.id, 'text-halo-color', MAP_PALETTE.labelHalo)
      paint(layer.id, 'text-halo-width', 1.2)
      continue
    }

    const role = layerRole(layer.id)
    if (!role) continue

    if (layer.type === 'fill') {
      paint(layer.id, 'fill-color', MAP_PALETTE[role])
    } else if (layer.type === 'line') {
      paint(layer.id, 'line-color', MAP_PALETTE[role])
    }
  }
}
