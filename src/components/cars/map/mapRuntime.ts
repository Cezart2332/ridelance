import type { Map as MapboxMap } from 'mapbox-gl'

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
  watchdog = window.setTimeout(() => {
    settle(
      'Harta nu a răspuns. Cel mai des e un Content-Security-Policy care blochează ' +
        'api.mapbox.com sau worker-ul (`worker-src blob:`) — verifică tab-ul Network și ' +
        'consola pentru erori CSP.',
    )
  }, LOAD_TIMEOUT_MS)

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
