import { api } from '../lib/axios'

export type TaxObligationStatus = 'InPregatire' | 'Depusa' | 'DePlata' | 'Platita'

export interface TaxObligation {
  id: string
  type: string
  typeLabel: string
  periodYear: number
  periodMonth: number
  periodLabel: string
  amountDue: number
  dueDate: string
  status: TaxObligationStatus
  statusLabel: string
  /** Calculat pe server, în fusul României. Frontendul nu compară date. */
  isOverdue: boolean
  daysUntilDue: number | null
  documentId: string | null
  note: string | null
  updatedAtUtc: string
}

export const taxObligationsService = {
  /** Fără `pfaRegistrationId` întoarce obligațiile utilizatorului curent. */
  getAll: async (pfaRegistrationId?: string, year?: number): Promise<TaxObligation[]> => {
    const response = await api.get<TaxObligation[]>('/tax-obligations', {
      params: { pfaRegistrationId, year },
    })
    return response.data
  },
}
