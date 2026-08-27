/**
 * Oferta Eldrive pentru clienții RIDElance.
 *
 * Într-un singur fișier pentru că apare în două locuri — pagina publică de Parteneri și Beneficii
 * din dashboard — iar un tarif scris de două ori e un tarif care va ajunge diferit.
 *
 * Textele sunt cele din materialul primit de la partener, cu o singură abatere: sumele se scriu cu
 * virgulă, ca peste tot în interfața românească. Cifrele nu se rotunjesc și nu se recalculează
 * nicăieri — se afișează exact așa cum sunt negociate.
 */

export interface EldriveTariff {
  key: string
  title: string
  /** Rândul mic de sub titlu: la ce stații și în ce interval se aplică. */
  scope: string
  price: string
  /** Unitatea, cu precizarea care ține de tariful ăsta. */
  unit: string
  /** Tariful mic poartă accentul mărcii: culoarea spune când merită încărcat. */
  highlighted: boolean
}

export const ELDRIVE_TARIFFS: EldriveTariff[] = [
  {
    key: 'night',
    title: 'Tarif noapte',
    scope: 'Stațiile eligibile 22:00–06:00',
    price: '1,50',
    unit: 'lei / kWh · TVA inclus',
    highlighted: true,
  },
  {
    key: 'day',
    title: 'Tarif zi',
    scope: 'Stațiile eligibile 06:00–22:00',
    price: '2,30',
    unit: 'lei / kWh · TVA inclus',
    highlighted: false,
  },
  {
    key: 'nonstop',
    title: 'Non-stop',
    scope: 'Mega Mall & Unirea',
    price: '1,50',
    unit: 'lei / kWh · 24/7',
    highlighted: true,
  },
]

/** Blocul „ce e integrat la noi": numărul de stații și ce se vede despre ele. */
export const ELDRIVE_INTEGRATION = {
  badge: 'Integrat în RIDElance',
  title: 'Harta interactivă',
  stationCount: 17,
  text: 'stații afișate cu listă, pin-uri, porturi și navigare',
}

export const ELDRIVE_NETWORK = {
  stationCount: 17,
  area: 'București + Ilfov',
}

/** Textele secțiunii de hartă. Se afișează doar când există stații — vezi `ELDRIVE_STATIONS`. */
export const ELDRIVE_MAP_SECTION = {
  title: 'Harta stațiilor Eldrive incluse în ofertă',
  text:
    'Secțiune dedicată în pagina de Parteneri. Poți vedea toate stațiile eligibile, lista completă ' +
    'în stânga, detalii despre putere și conectori, plus navigare rapidă din telefon.',
  facts: ['17 locații', 'București + Ilfov', 'Tarife RIDElance'],
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
