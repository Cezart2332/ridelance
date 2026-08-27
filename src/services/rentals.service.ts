import { api } from '../lib/axios'

/**
 * Statusul e derivat pe server; frontendul nu îl recalculează.
 *
 * `draft` și `cancelled` vin din decizii, restul din calendar — de aceea coexistă cu `lifecycle`,
 * care e partea stocată.
 */
export type RentalStatus = 'draft' | 'upcoming' | 'active' | 'ending_soon' | 'completed' | 'cancelled'

/** Ce s-a decis despre închiriere, spre deosebire de ce arată datele. */
export type RentalLifecycle = 'Draft' | 'Confirmed' | 'Cancelled'

export type TenantType = 'Individual' | 'Pfa' | 'Srl'

export interface Tenant {
  id: string
  name: string
  type: TenantType
  cnp: string | null
  idSeries: string | null
  idNumber: string | null
  cui: string | null
  regCom: string | null
  address: string | null
  phone: string | null
  email: string | null
  driverLicenseNumber: string | null
}

/** Datele unui chiriaș nou. Fără `id`: nu există încă. */
export type NewTenant = Omit<Tenant, 'id'>

export interface Rental {
  id: string
  /** Codul din documente: `RL-000123`. */
  publicCode: string
  carId: string
  carLabel: string
  tenant: Tenant
  lifecycle: RentalLifecycle
  startAtUtc: string
  endAtUtc: string
  closedAtUtc: string | null
  weeklyRentBani: number
  depositBani: number
  otherCostsBani: number
  hasKmLimit: boolean
  mileageLimit: number | null
  extraKmCostBani: number
  fuelRule: string | null
  fuelLevelAtPickup: string | null
  startMileage: number | null
  accessories: string[]
  accessoriesOther: string | null
  notes: string | null
  status: RentalStatus
  contractValueBani: number
}

export interface RentalSummary {
  activeCount: number
  monthlyContractValueBani: number
  upcomingHandoverCount: number
  availableCars: number
}

export interface RentalOverview {
  summary: RentalSummary
  rentals: Rental[]
}

/** Termenii unei închirieri, fără cine e chiriașul și fără ce mașină. */
export interface RentalTerms {
  startAtUtc: string
  endAtUtc: string
  weeklyRentBani: number
  depositBani: number
  otherCostsBani: number
  hasKmLimit: boolean
  mileageLimit: number | null
  extraKmCostBani: number
  fuelRule: string | null
  fuelLevelAtPickup: string | null
  startMileage: number | null
  accessories: string[]
  accessoriesOther: string | null
  notes: string | null
}

export interface RentalInput extends RentalTerms {
  carId: string
  /** Chiriaș existent. Când lipsește, se trimite `tenant`. */
  tenantId: string | null
  tenant: NewTenant | null
}

/**
 * Valorile cu care firma își completează singură formularul.
 *
 * Toate opționale: o flotă care nu le-a setat primește un formular gol, nu unul plin de zerouri
 * care par convenite. Se **copiază** în închiriere la creare — schimbarea lor nu atinge contractele
 * deja făcute, și nici invers.
 */
export interface RentalDefaults {
  weeklyRentBani: number | null
  depositBani: number | null
  minPeriodDays: number | null
  hasKmLimit: boolean
  mileageLimit: number | null
  extraKmCostBani: number | null
  fuelRule: string | null
  defaultConditions: string | null
}

export const rentalsService = {
  async getOverview(): Promise<RentalOverview> {
    const res = await api.get<RentalOverview>('/rentals')
    return res.data
  },

  async getTenants(): Promise<Tenant[]> {
    const res = await api.get<Tenant[]>('/rentals/tenants')
    return res.data
  },

  async getDefaults(): Promise<RentalDefaults> {
    const res = await api.get<RentalDefaults>('/rentals/defaults')
    return res.data
  },

  async saveDefaults(defaults: RentalDefaults): Promise<RentalDefaults> {
    const res = await api.put<RentalDefaults>('/rentals/defaults', defaults)
    return res.data
  },

  async create(input: RentalInput): Promise<string> {
    const res = await api.post<{ id: string }>('/rentals', input)
    return res.data.id
  },

  async update(id: string, terms: RentalTerms): Promise<void> {
    await api.put(`/rentals/${id}`, terms)
  },

  async close(id: string, endMileage: number | null): Promise<void> {
    await api.post(`/rentals/${id}/close`, { endMileage })
  },
}

/** Accesoriile standard, ca bife. Textul liber rămâne pentru restul. */
export const RENTAL_ACCESSORIES = [
  'Chei',
  'Carduri',
  'Cablu încărcare',
  'Adaptor',
  'Stingător',
  'Triunghi',
  'Trusă medicală',
]
