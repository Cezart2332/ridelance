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
    /** Perioada fără date, estimată din media săptămânală („01.01.2026 – 30.04.2026”). */
    uncoveredPeriod?: string | null
    uncoveredWeeks?: number
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

/** O lună de dinainte de RIDElance: ce a trecut contabilul și ce avem deja din platforme. */
export interface PriorPeriodMonth {
  month: number
  /** `null` = luna nu e completată. */
  income: number | null
  expenses: number | null
  platformIncome: number
  platformExpenses: number
  /** Luna intrării în RIDElance, acoperită doar de la data intrării. */
  joinMonth: boolean
  updatedAtUtc: string | null
}

export interface PriorPeriod {
  year: number
  requiredFrom: string
  joinedOn: string | null
  months: PriorPeriodMonth[]
}

export type StaffMode = Exclude<FiscalProfileMode, 'pfa'>

function priorPeriodUrl(mode: StaffMode, pfaId: string, year: number): string {
  return `/${mode === 'admin' ? 'admin' : 'accounting'}/pfas/${pfaId}/prior-period/${year}`
}

export const priorPeriodService = {
  get: async (mode: StaffMode, pfaId: string, year: number): Promise<PriorPeriod> =>
    (await api.get<PriorPeriod>(priorPeriodUrl(mode, pfaId, year))).data,

  /** Lunile cu ambele sume `null` se șterg. */
  save: async (
    mode: StaffMode,
    pfaId: string,
    year: number,
    months: { month: number; income: number | null; expenses: number | null }[],
  ): Promise<PriorPeriod> => (await api.put<PriorPeriod>(priorPeriodUrl(mode, pfaId, year), { months })).data,
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
