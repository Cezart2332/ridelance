import { api } from '../lib/axios'

/** Statusul e derivat pe server din date; frontendul nu îl recalculează. */
export type RentalStatus = 'upcoming' | 'active' | 'ending_soon' | 'completed'

export type TenantType = 'Individual' | 'Pfa' | 'Srl'

export interface Rental {
  id: string
  carId: string
  carLabel: string
  tenantName: string
  tenantType: TenantType
  tenantFiscalCode: string | null
  tenantPhone: string | null
  tenantEmail: string | null
  startAtUtc: string
  endAtUtc: string
  closedAtUtc: string | null
  weeklyRentBani: number
  depositBani: number
  hasKmLimit: boolean
  extraKmCostBani: number
  fuelRule: string | null
  startMileage: number | null
  accessories: string | null
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

export interface RentalInput {
  carId: string
  tenantName: string
  tenantType: TenantType
  tenantFiscalCode: string | null
  tenantPhone: string | null
  tenantEmail: string | null
  startAtUtc: string
  endAtUtc: string
  weeklyRentBani: number
  depositBani: number
  hasKmLimit: boolean
  extraKmCostBani: number
  fuelRule: string | null
  startMileage: number | null
  accessories: string | null
  notes: string | null
}

export const rentalsService = {
  async getOverview(): Promise<RentalOverview> {
    const res = await api.get<RentalOverview>('/rentals')
    return res.data
  },

  async create(input: RentalInput): Promise<string> {
    const res = await api.post<{ id: string }>('/rentals', input)
    return res.data.id
  },

  async close(id: string, endMileage: number | null): Promise<void> {
    await api.post(`/rentals/${id}/close`, { endMileage })
  },
}
