import { api } from '../lib/axios'
import type { FiscalProfileMode, FiscalProfileStatus } from './fiscalProfile.service'

/**
 * Taxele estimate (CAS, CASS, impozit, „cât să pui deoparte”) calculate de motorul din backend.
 * Frontendul nu calculează nimic: afișează ce vine de aici.
 */

export type TaxComponentName = 'CAS' | 'CASS' | 'INCOME_TAX' | 'PLATFORM_TAXES'

export type TaxStatus =
  | 'CALCULATING'
  | 'ESTIMATED'
  | 'INSUFFICIENT_DATA'
  | 'REQUIRES_CLARIFICATION'
  | 'RULE_UNAVAILABLE'
  | 'NOT_CONFIGURED'
  | 'ERROR'
  | 'PARTIAL'

export interface EstimatedTaxComponent {
  component: TaxComponentName
  status: TaxStatus
  amount: number | null
  reasonCode: string | null
  missingInputs: string[]
  /** Pașii calculului; doar pentru admin și contabilitate. */
  breakdown: Record<string, unknown> | null
}

export interface EstimatedReserve {
  status: TaxStatus
  total: number | null
  weekly: number | null
  annualEstimated: number | null
  missing: string[]
  reasonCode: string | null
  existingReserve: number | null
  existingReserveAssumedZero: boolean
  recordedTaxPayments: number
}

export interface EstimatedTaxes {
  taxYear: number
  locked: boolean
  profileStatus: FiscalProfileStatus | null
  asOf?: string | null
  status?: TaxStatus | null
  stale?: boolean
  reserve?: EstimatedReserve | null
  components?: EstimatedTaxComponent[] | null
  warnings?: string[] | null
  projection?: {
    netRealized: number
    netAnnualEstimated: number | null
    weeklyAverage: number | null
    weeksUsed: number
    weeksRemaining: number
  } | null
  profileRevision?: number | null
  ruleVersion?: string | null
  financialSnapshotId?: string | null
  runs?: {
    id: string
    createdAtUtc: string
    status: TaxStatus
    stale: boolean
    profileRevision: number
    ruleVersion: string | null
    asOf: string
  }[] | null
}

export interface TaxPayment {
  id: string
  type: string
  typeLabel: string
  periodYear: number
  periodMonth: number
  amountDue: number
  dueDate: string
  status: string
  statusLabel: string
}

function base(mode: FiscalProfileMode, year: number, pfaId?: string): string {
  if (mode === 'pfa') return `/pfa/me/estimated-taxes/${year}`
  return `/${mode === 'admin' ? 'admin' : 'accounting'}/pfas/${pfaId}/estimated-taxes/${year}`
}

/** Tipurile de declarații care sunt plăți ale taxelor anuale (se scad din rezervă). */
export const ANNUAL_TAX_TYPES = ['Cas', 'Cass', 'ImpozitVenit'] as const

export const estimatedTaxesService = {
  get: async (mode: FiscalProfileMode, year: number, pfaId?: string): Promise<EstimatedTaxes> =>
    (await api.get<EstimatedTaxes>(base(mode, year, pfaId))).data,

  recalculate: async (mode: FiscalProfileMode, year: number, pfaId?: string): Promise<EstimatedTaxes> =>
    (await api.post<EstimatedTaxes>(`${base(mode, year, pfaId)}/recalculate`)).data,

  setExistingReserve: async (year: number, amount: number | null): Promise<EstimatedTaxes> =>
    (await api.put<EstimatedTaxes>(`${base('pfa', year)}/existing-reserve`, { amount })).data,

  /** Plățile CAS/CASS/impozit ale anului, înregistrate de contabilă ca declarații „Plătită”. */
  payments: async (pfaId: string, year: number): Promise<TaxPayment[]> => {
    const items = (await api.get<TaxPayment[]>('/tax-obligations', { params: { pfaRegistrationId: pfaId, year } })).data ?? []
    return items.filter((item) => (ANNUAL_TAX_TYPES as readonly string[]).includes(item.type))
  },

  addPayment: async (pfaId: string, year: number, type: (typeof ANNUAL_TAX_TYPES)[number], amount: number, paidOn: string) =>
    (
      await api.post('/tax-obligations', {
        id: null,
        pfaRegistrationId: pfaId,
        type,
        periodYear: year,
        periodMonth: Number(paidOn.slice(5, 7)) || 1,
        amountDue: amount,
        dueDate: paidOn,
        status: 'Platita',
        documentId: null,
        note: null,
      })
    ).data,
}
