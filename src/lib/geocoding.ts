import { MAPBOX_AVAILABLE, MAPBOX_TOKEN } from './mapbox'

/**
 * Căutarea unei adrese și traducerea inversă, prin Mapbox Geocoding.
 *
 * Se apelează direct din browser, cu token-ul publishable — la fel ca harta. Nu trece prin
 * backendul nostru: ar fi însemnat un proxy care nu adaugă nimic, doar latență.
 */

export interface GeocodeResult {
  /** Adresa completă, așa cum o scrie Mapbox. */
  label: string
  latitude: number
  longitude: number
  /** Localitatea, extrasă din context — populează câmpul „Oraș". */
  city: string | null
  /** Cartierul sau sectorul, când există. */
  zone: string | null
}

const BASE = 'https://api.mapbox.com/geocoding/v5/mapbox.places'

/** Rezultatele se limitează la România: platforma nu închiriază mașini în altă parte. */
const COMMON = 'country=ro&language=ro&limit=5'

interface MapboxFeature {
  place_name?: string
  center?: [number, number]
  text?: string
  place_type?: string[]
  context?: { id: string; text: string }[]
}

function toResult(feature: MapboxFeature): GeocodeResult | null {
  if (!feature.center || feature.center.length !== 2) return null

  const context = feature.context ?? []
  const find = (prefix: string) => context.find((c) => c.id.startsWith(prefix))?.text ?? null

  // Când rezultatul **este** localitatea, `text` e chiar numele ei; altfel vine din context.
  const isPlace = feature.place_type?.includes('place') ?? false
  const city = isPlace ? (feature.text ?? null) : find('place')

  return {
    label: feature.place_name ?? feature.text ?? '',
    longitude: feature.center[0],
    latitude: feature.center[1],
    city,
    // Sectoarele Bucureștiului vin ca `locality`, cartierele ca `neighborhood`.
    zone: find('neighborhood') ?? find('locality'),
  }
}

export async function searchAddress(query: string, signal?: AbortSignal): Promise<GeocodeResult[]> {
  if (!MAPBOX_AVAILABLE || query.trim().length < 3) return []

  const url = `${BASE}/${encodeURIComponent(query.trim())}.json?${COMMON}&access_token=${MAPBOX_TOKEN}`
  const response = await fetch(url, { signal })
  if (!response.ok) return []

  const data = (await response.json()) as { features?: MapboxFeature[] }
  return (data.features ?? []).map(toResult).filter((r): r is GeocodeResult => r !== null)
}

/** Adresa unui punct de pe hartă — folosită după ce utilizatorul mută pinul. */
export async function reverseGeocode(
  latitude: number,
  longitude: number,
  signal?: AbortSignal,
): Promise<GeocodeResult | null> {
  if (!MAPBOX_AVAILABLE) return null

  const url = `${BASE}/${longitude},${latitude}.json?country=ro&language=ro&limit=1&access_token=${MAPBOX_TOKEN}`
  const response = await fetch(url, { signal })
  if (!response.ok) return null

  const data = (await response.json()) as { features?: MapboxFeature[] }
  const first = data.features?.[0]
  return first ? toResult(first) : null
}
