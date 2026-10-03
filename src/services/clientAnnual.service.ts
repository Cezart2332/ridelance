import { api } from '../lib/axios'
import type { ClientAnnual } from '../shared/accounting/api/types'

/** Anul fiscal al PFA-ului, pentru el însuși (spec declarații F53): întrebarea despre alte venituri și D212. */
export const clientAnnualService = {
  async get(year: number): Promise<ClientAnnual> {
    return (await api.get<ClientAnnual>(`/pfa/annual/${year}`)).data
  },

  async answerExternalIncome(year: number, hasExternalIncome: boolean): Promise<void> {
    await api.put(`/pfa/annual/${year}/external-income`, { hasExternalIncome })
  },
}
