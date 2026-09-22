import { api } from '../lib/axios'

/**
 * Profilul fiscal anual al PFA-ului. Același obiect în cele trei dashboarduri; diferă doar
 * ruta, care îi spune backendului cine cheamă. Accesul îl verifică backendul.
 */

export type FiscalProfileMode = 'pfa' | 'admin' | 'accounting'
export type FiscalProfileStatus = 'NOT_STARTED' | 'DRAFT' | 'COMPLETED'

/** Cheile din spec §4, exact. Datele sunt `yyyy-MM-dd`. */
export interface FiscalProfileAnswers {
  dataCorrect?: string | null
  correctionDetails?: string | null
  priorDocs?: string | null
  priorDocsLocation?: string | null
  employment?: string | null
  employmentStart?: string | null
  employmentEnd?: string | null
  pensioner?: string | null
  pensionerSince?: string | null
  student?: string | null
  ownPensionSystem?: string | null
  privateContact?: string | null
  otherIndependent?: string | null
  otherIndependentRecords?: string | null
  otherIncome?: string | null
  taxPaymentsMade?: string | null
  carriedLosses?: string | null
  cassOptIn?: string | null
  crossBorder?: string | null
  notes?: string | null
}

export type FiscalProfileKey = keyof FiscalProfileAnswers

export interface FiscalProfileFact<T> {
  value: T | null
  source: string
  observedAtUtc: string | null
}

export interface FiscalProfileConditions {
  askPriorDocs: boolean
  priorFrom: string | null
  priorTo: string | null
  askCarriedLosses: boolean
}

export interface FiscalProfileActor {
  userId: string
  name: string
  role: 'pfa' | 'admin' | 'accounting' | 'unknown'
}

export interface DataCorrection {
  id: string
  fields: string
  details: string
  state: 'Open' | 'Resolved'
  createdAtUtc: string
  resolvedAtUtc: string | null
}

export interface FiscalProfile {
  id: string
  pfaRegistrationId: string
  taxYear: number
  regime: string
  status: FiscalProfileStatus
  answers: FiscalProfileAnswers
  revision: number
  firstPromptShownAtUtc: string | null
  completedAtUtc: string | null
  estimatedTaxesUnlockedAtUtc: string | null
  updatedAtUtc: string
  lastChangedBy: FiscalProfileActor | null
  facts: {
    pfaName: string | null
    cui: string | null
    pfaRegisteredOn: FiscalProfileFact<string>
    activityStartedOn: FiscalProfileFact<string>
    accessGrantedAt: FiscalProfileFact<string>
    regime: string
  }
  conditions: FiscalProfileConditions
  corrections: DataCorrection[]
}

export interface FiscalProfileRevision {
  revision: number
  createdAtUtc: string
  actor: FiscalProfileActor
  changes: { field: string; oldValue: string | null; newValue: string | null }[]
  reason: string | null
}

export interface AdminCallTask {
  id: string
  pfaRegistrationId: string
  pfaUserId: string
  pfaName: string
  email: string | null
  phone: string | null
  taxYear: number
  reason: string
  state: 'OPEN' | 'DONE' | 'RESCHEDULED' | 'RESOLVED_BY_COMPLETION'
  ownerUserId: string | null
  ownerName: string | null
  callOutcome: string | null
  rescheduledToUtc: string | null
  createdAtUtc: string
  closedAtUtc: string | null
  profileStatus: FiscalProfileStatus
}

/** Anul fiscal curent, după calendarul României. */
export function currentTaxYear(): number {
  return Number(new Intl.DateTimeFormat('en', { year: 'numeric', timeZone: 'Europe/Bucharest' }).format(new Date()))
}

function base(mode: FiscalProfileMode, year: number, pfaId?: string): string {
  if (mode === 'pfa') return `/pfa/me/fiscal-profiles/${year}`
  return `/${mode === 'admin' ? 'admin' : 'accounting'}/pfas/${pfaId}/fiscal-profiles/${year}`
}

const ifMatch = (revision: number) => ({ headers: { 'If-Match': `"${revision}"` } })

export const fiscalProfileService = {
  get: async (mode: FiscalProfileMode, year: number, pfaId?: string): Promise<FiscalProfile> =>
    (await api.get<FiscalProfile>(base(mode, year, pfaId))).data,

  saveDraft: async (year: number, answers: FiscalProfileAnswers, revision: number): Promise<FiscalProfile> =>
    (await api.patch<FiscalProfile>(`${base('pfa', year)}/draft`, { answers }, ifMatch(revision))).data,

  complete: async (year: number, answers: FiscalProfileAnswers, revision: number): Promise<FiscalProfile> =>
    (await api.post<FiscalProfile>(`${base('pfa', year)}/complete`, { answers, confirmed: true }, ifMatch(revision))).data,

  /** Editare după completare (PFA) sau oricând (staff, cu motiv). */
  edit: async (
    mode: FiscalProfileMode,
    year: number,
    answers: FiscalProfileAnswers,
    revision: number,
    reason?: string,
    pfaId?: string,
  ): Promise<FiscalProfile> =>
    (await api.patch<FiscalProfile>(base(mode, year, pfaId), mode === 'pfa' ? { answers } : { answers, reason }, ifMatch(revision))).data,

  markPromptShown: async (year: number): Promise<FiscalProfile> =>
    (await api.post<FiscalProfile>(`${base('pfa', year)}/prompt-shown`)).data,

  revisions: async (mode: FiscalProfileMode, year: number, pfaId?: string): Promise<FiscalProfileRevision[]> =>
    (await api.get<FiscalProfileRevision[]>(`${base(mode, year, pfaId)}/revisions`)).data,

  resolveCorrection: async (mode: Exclude<FiscalProfileMode, 'pfa'>, id: string): Promise<DataCorrection> =>
    (await api.post<DataCorrection>(`/${mode}/data-corrections/${id}/resolve`)).data,

  tasks: async (includeClosed = false): Promise<AdminCallTask[]> =>
    (await api.get<AdminCallTask[]>('/admin/tasks', { params: { type: 'PROFILE_INCOMPLETE_30D', includeClosed } })).data,

  updateTask: async (
    id: string,
    body: { state?: AdminCallTask['state']; callOutcome?: string; rescheduledToUtc?: string | null; assignToMe?: boolean },
  ): Promise<AdminCallTask> => (await api.patch<AdminCallTask>(`/admin/tasks/${id}`, { assignToMe: false, ...body })).data,
}

/** Anunțul că profilul s-a schimbat: dashboardul își recitește estimările. */
export const FISCAL_PROFILE_CHANGED = 'ridelance:fiscal-profile-changed'

export function announceFiscalProfileChanged() {
  window.dispatchEvent(new Event(FISCAL_PROFILE_CHANGED))
}
