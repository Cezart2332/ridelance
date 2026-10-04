import { api } from '../lib/axios'

export type ClientDeclarationState = 'IN_PREPARATION' | 'SUBMITTED' | 'CONFIRMED_BY_ANAF' | 'WITH_ACCOUNTANT'

/** O declarație a PFA-ului, din înregistrarea ei (QA 11): suma, termenul, starea, documentele. */
export interface ClientDeclaration {
  declarationId: string
  type: string
  period: string
  amount: number
  dueDate: string | null
  state: ClientDeclarationState
  pdfDocumentId: string | null
  receiptDocumentId: string | null
}

export const clientDeclarationsService = {
  async list(year: number): Promise<ClientDeclaration[]> {
    return (await api.get<ClientDeclaration[]>('/pfa/declarations', { params: { year } })).data
  },
}
