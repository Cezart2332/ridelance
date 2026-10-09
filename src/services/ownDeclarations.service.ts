import { api } from '../lib/axios'

export type OwnDeclarationType = 'D100' | 'D301' | 'D390' | 'D207' | 'D205' | 'D212'

/** O declarație generată de titularul PFAlone; XML-ul îl depune el în SPV. */
export interface OwnDeclaration {
  declarationId: string
  type: OwnDeclarationType
  period: string
  amount: number
  dueDate: string | null
  status: string
  /** Anualele nu au XML: se completează în formularul ANAF. */
  xmlDocumentId: string | null
}

export interface OwnGenerationResult {
  generated: boolean
  message: string
}

/** Generatorul de declarații al PFAlone (fără D700, care ține de onboarding). */
export const ownDeclarationsService = {
  async list(year: number): Promise<OwnDeclaration[]> {
    return (await api.get<OwnDeclaration[]>('/pfa/accounting/own-declarations', { params: { year } })).data
  },
  async generateMonthly(period: string): Promise<OwnGenerationResult> {
    return (await api.post<OwnGenerationResult>('/pfa/accounting/own-declarations/monthly', { period })).data
  },
  async generateAnnual(year: number): Promise<OwnGenerationResult> {
    return (await api.post<OwnGenerationResult>('/pfa/accounting/own-declarations/annual', { year })).data
  },
}
