import { LISTING_SOURCE_TO_API } from '../../../utils/carLabels'
import type { CarListingDetails, CreateCarRequest } from '../../../services/cars.service'

/**
 * Starea formularului de adăugare a unei mașini, pe cei șase pași.
 *
 * Ține **text**, nu numere, pentru câmpurile numerice: un `number` gol e `NaN` sau `0`, iar
 * ambele mint despre ce a scris utilizatorul. Conversia se face o singură dată, la trimitere.
 */

export interface CarDraft {
  // 1. Vehicul
  brand: string
  model: string
  year: string
  engine: string
  transmission: string
  color: string
  seats: string
  uberCategories: string[]
  boltCategories: string[]

  // 2. Ofertă
  pricePerWeek: string
  garantie: string
  offerType: string
  minimumPeriod: string
  status: string
  availableFrom: string
  conditions: string
  description: string
  badges: string[]
  /** Doar admin: prețul tăiat de deasupra celui curent. Gol înseamnă fără reducere. */
  oldPrice: string
  /** Doar admin: anunț adus din afara platformei, marcat ca atare în marketplace. */
  listingSource: string

  // 4. Locație
  /** Adresa aleasă din căutare sau citită înapoi din pin. Doar pentru afișare în formular. */
  address: string
  location: string
  zone: string
  latitude: number | null
  longitude: number | null
  showExactLocation: boolean
  useCompanyContacts: boolean

  // 5. Dosar
  plateNumber: string
  vin: string
  mileage: string
  firstRegistration: string
}

export const EMPTY_DRAFT: CarDraft = {
  brand: '',
  model: '',
  year: '',
  engine: 'Electric',
  transmission: 'Automată',
  color: '',
  seats: '5',
  uberCategories: [],
  boltCategories: [],

  pricePerWeek: '',
  garantie: '',
  offerType: 'Închiriere săptămânală',
  minimumPeriod: '2 luni',
  status: 'Disponibilă acum',
  availableFrom: '',
  conditions: '',
  description: '',
  badges: [],
  oldPrice: '',
  listingSource: 'Oferit de RIDElance',

  address: '',
  location: '',
  zone: '',
  latitude: null,
  longitude: null,
  showExactLocation: false,
  useCompanyContacts: true,

  plateNumber: '',
  vin: '',
  mileage: '',
  firstRegistration: '',
}

/**
 * Cine adaugă mașina.
 *
 * `owner` e un cont de flotă: anunțul se salvează inactiv, trece prin validare și prin plata
 * listării. `admin` adaugă direct în catalogul RIDElance, deci anunțul e activ din prima și poate
 * purta reducere și sursă externă — câmpuri pe care un proprietar nu le stabilește singur.
 */
export type WizardMode = 'owner' | 'admin'

export const STEPS = [
  { id: 'vehicul', title: 'Vehicul', hint: 'Date de bază' },
  { id: 'oferta', title: 'Ofertă', hint: 'Preț și condiții' },
  { id: 'poze', title: 'Poze', hint: 'Media anunțului' },
  { id: 'locatie', title: 'Locație', hint: 'Hartă și contact' },
  { id: 'dosar', title: 'Dosar', hint: 'Date opționale' },
  { id: 'preview', title: 'Preview', hint: 'Verificare și publicare' },
] as const

export type StepId = (typeof STEPS)[number]['id']

export const ENGINES = ['Electric', 'Hibrid', 'GPL', 'Benzină', 'Diesel']
export const TRANSMISSIONS = ['Automată', 'Manuală']
export const SEATS = ['4', '5', '7']
export const OFFER_TYPES = ['Închiriere săptămânală', 'La rămânere', 'Închiriere cu opțiune de cumpărare']
export const MINIMUM_PERIODS = ['Fără perioadă minimă', '1 lună', '2 luni', '3 luni']
export const AVAILABILITY = ['Disponibilă acum', 'Disponibilă de la o dată', 'Momentan indisponibilă']

/** Doar pentru admin. Etichetele vin din maparea comună, ca să nu existe o a doua listă. */
export const LISTING_SOURCES = Object.keys(LISTING_SOURCE_TO_API)

/** Avantajele afișate ca insigne pe anunț. Aceleași etichete ca în marketplace. */
export const BADGE_OPTIONS = [
  'Asigurare inclusă',
  'Mașină de schimb',
  'Service inclus',
  'Acceptă PFA',
  'Acceptă CIM',
  'Fără avans',
  'Kilometraj nelimitat',
]

/** Câmpurile fără de care anunțul nu poate fi publicat, pe pasul unde se completează. */
export const REQUIRED_BY_STEP: Record<StepId, (keyof CarDraft)[]> = {
  vehicul: ['brand', 'model', 'year'],
  oferta: ['pricePerWeek', 'description'],
  poze: [],
  locatie: ['location'],
  dosar: [],
  preview: [],
}

export function missingFields(draft: CarDraft, step: StepId): (keyof CarDraft)[] {
  return REQUIRED_BY_STEP[step].filter((key) => {
    const value = draft[key]
    return typeof value === 'string' ? value.trim() === '' : value == null
  })
}

/** Anunțul e publicabil doar dacă niciun pas nu are câmpuri obligatorii goale. */
export function blockingSteps(draft: CarDraft): StepId[] {
  return STEPS.map((s) => s.id).filter((id) => missingFields(draft, id).length > 0)
}

/** Cât din dosarul administrativ e completat — aceeași fracție pe care o punctează serverul. */
export function dossierCompletion(draft: CarDraft): number {
  const fields = [draft.plateNumber, draft.vin, draft.mileage, draft.firstRegistration]
  return fields.filter((value) => value.trim() !== '').length / fields.length
}

/** Data locală, ca UTC la prânz: fusul nu are voie s-o mute cu o zi înapoi. */
function toUtc(date: string): string | null {
  return date ? new Date(`${date}T12:00:00Z`).toISOString() : null
}

function toNumber(value: string): number | null {
  const trimmed = value.trim()
  if (trimmed === '') return null
  const parsed = Number(trimmed)
  return Number.isFinite(parsed) ? parsed : null
}

export function toDetails(draft: CarDraft): CarListingDetails {
  return {
    zone: draft.zone.trim() || null,
    latitude: draft.latitude,
    longitude: draft.longitude,
    showExactLocation: draft.showExactLocation,
    useCompanyContacts: draft.useCompanyContacts,
    color: draft.color.trim() || null,
    seats: toNumber(draft.seats),
    minimumPeriod: draft.minimumPeriod || null,
    conditions: draft.conditions.trim() || null,
    // Data contează doar pentru „disponibilă de la o dată"; altfel ar rămâne o valoare orfană.
    availableFromUtc: draft.status === 'Disponibilă de la o dată' ? toUtc(draft.availableFrom) : null,
    plateNumber: draft.plateNumber.trim() || null,
    vin: draft.vin.trim() || null,
    mileage: toNumber(draft.mileage),
    firstRegistrationAtUtc: toUtc(draft.firstRegistration),
  }
}

export function toCreateRequest(draft: CarDraft, mode: WizardMode = 'owner'): CreateCarRequest {
  const isAdmin = mode === 'admin'
  const oldPrice = isAdmin ? toNumber(draft.oldPrice) : null
  const price = toNumber(draft.pricePerWeek) ?? 0
  // Reducerea e reală doar dacă prețul vechi chiar e mai mare; altfel anunțul ar afișa o
  // tăietură care nu înseamnă nimic.
  const hasDiscount = oldPrice != null && oldPrice > price

  return {
    brand: draft.brand.trim(),
    model: draft.model.trim(),
    year: toNumber(draft.year) ?? new Date().getFullYear(),
    engine: draft.engine,
    transmission: draft.transmission,
    location: draft.location.trim(),
    pricePerWeek: price,
    oldPrice: hasDiscount ? oldPrice : undefined,
    discountActive: hasDiscount,
    garantie: toNumber(draft.garantie) ?? undefined,
    offerType: draft.offerType,
    status: draft.status === 'Disponibilă de la o dată' ? 'Disponibilă acum' : draft.status,
    uberCategories: draft.uberCategories,
    boltCategories: draft.boltCategories,
    badges: draft.badges,
    description: draft.description.trim(),
    // Proprietarul publică prin validarea și plata platformei, deci anunțul lui nu devine vizibil
    // de aici. Adminul scrie direct în catalog, unde nu e nimic de validat.
    active: isAdmin,
    listingSource: isAdmin
      ? (LISTING_SOURCE_TO_API[draft.listingSource] ?? 'Ridelance')
      : 'Ridelance',
    details: toDetails(draft),
  }
}
