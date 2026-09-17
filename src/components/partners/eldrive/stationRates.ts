import { ELDRIVE_TARIFFS, type EldriveStation } from '../../../data/eldrive'

/**
 * Tarifele unei stații, citite din `ELDRIVE_TARIFFS` — nu rescrise aici. Harta, lista și cardul
 * arată aceleași sume ca blocul de tarife de deasupra, fiindcă vin din același loc.
 */
function priceOf(key: string): string {
  return ELDRIVE_TARIFFS.find((tariff) => tariff.key === key)?.price ?? '—'
}

export const NIGHT_PRICE = priceOf('night')
export const DAY_PRICE = priceOf('day')
export const NONSTOP_PRICE = priceOf('nonstop')

/** Verdele tarifului non-stop — singura stare pe care harta o colorează diferit. */
export const NONSTOP_COLOR = '#16A34A'

export function stationRateLabel(station: EldriveStation): string {
  return station.tariff === 'nonstop'
    ? `${NONSTOP_PRICE} lei/kWh non-stop`
    : `${NIGHT_PRICE} lei/kWh noaptea, ${DAY_PRICE} lei/kWh ziua`
}

export function googleMapsUrl(station: EldriveStation): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${station.address}, România`)}`
}

/**
 * Waze pe adresă, nu pe coordonate: la stațiile marcate `approximate` punctul e la nivel de
 * stradă, iar adresa scrisă e cea care duce la încărcător.
 */
export function wazeUrl(station: EldriveStation): string {
  return `https://www.waze.com/ul?q=${encodeURIComponent(`${station.address}, România`)}&navigate=yes`
}
