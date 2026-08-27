/**
 * Oferta Eldrive pentru clienții RIDElance.
 *
 * Într-un singur fișier pentru că apare în două locuri — pagina publică de Parteneri și Beneficii
 * din dashboard — iar un tarif scris de două ori e un tarif care va ajunge diferit.
 *
 * Cifrele vin din materialul primit de la partener. Nu se rotunjesc și nu se recalculează nicăieri
 * în interfață: se afișează exact așa cum sunt negociate.
 */

export interface EldriveTariff {
  /** Cheia de culoare din bandă. */
  kind: 'night' | 'day'
  label: string
  /** Ora de început, 0–24. Intervalul poate trece peste miezul nopții. */
  fromHour: number
  toHour: number
  /** Scris cu virgulă, ca peste tot în interfața românească. */
  price: string
}

/** Tariful de bază, cel care depinde de oră. */
export const ELDRIVE_TARIFFS: EldriveTariff[] = [
  { kind: 'night', label: 'Noapte', fromHour: 22, toHour: 6, price: '1,50' },
  { kind: 'day', label: 'Zi', fromHour: 6, toHour: 22, price: '2,30' },
]

/**
 * Stațiile unde tariful de noapte se aplică tot timpul.
 *
 * E o excepție de la bandă, nu un al treilea tarif: aceeași sumă, alt program. De aceea stă lipită
 * de bandă în interfață, nu într-un card alături — altfel ar arăta ca o a treia opțiune de preț.
 */
export const ELDRIVE_NONSTOP = {
  price: '1,50',
  stations: 'Mega Mall și Unirea',
}

export const ELDRIVE_UNIT = 'lei / kWh'
export const ELDRIVE_VAT_NOTE = 'TVA inclus'

export const ELDRIVE_NETWORK = {
  stationCount: 17,
  area: 'București și Ilfov',
}

/** Ce vezi în platformă pentru fiecare stație. */
export const ELDRIVE_CAPABILITIES = [
  {
    title: 'Listă completă de stații',
    text: 'Vezi într-un singur loc toate stațiile incluse în beneficiu, cu adresă exactă și date utile.',
  },
  {
    title: 'Detalii tehnice',
    text: 'Fiecare stație poate afișa număr de porturi, putere, tipuri de conectori și alte informații relevante.',
  },
  {
    title: 'Navigare rapidă',
    text: 'Butoane directe către Google Maps sau Waze, utile mai ales în utilizarea de pe telefon.',
  },
]

export interface EldriveStation {
  name: string
  address: string
  latitude: number
  longitude: number
  /** Putere în kW, dacă e cunoscută. */
  powerKw?: number
  connectors?: string[]
}

/**
 * Stațiile eligibile, pentru harta din pagina de Parteneri.
 *
 * Goală deocamdată: materialul de la partener numără 17 stații în București și Ilfov, dar fișierul
 * cu adresele și coordonatele lor n-a ajuns la noi. Nu se inventează — o stație pusă la o adresă
 * greșită trimite un șofer cu bateria goală în locul nepotrivit.
 *
 * Interfața se comportă corect cu lista goală: secțiunea de hartă pur și simplu nu se randează, iar
 * numărul din text vine din `ELDRIVE_NETWORK`, care e o cifră comunicată, nu una derivată din listă.
 * Când vin datele, se completează aici și restul merge singur.
 */
export const ELDRIVE_STATIONS: EldriveStation[] = []

/**
 * Ora curentă → tariful activ. Intervalul de noapte trece peste miezul nopții, deci comparația e
 * „sau", nu „și".
 */
export function eldriveTariffAt(date: Date): EldriveTariff {
  const hour = date.getHours() + date.getMinutes() / 60
  const night = ELDRIVE_TARIFFS.find((t) => t.kind === 'night')!
  return hour >= night.fromHour || hour < night.toHour
    ? night
    : ELDRIVE_TARIFFS.find((t) => t.kind === 'day')!
}
