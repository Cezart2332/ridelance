import { api } from '../lib/axios'

/** Plafoanele și cotele unui an. Cotele sunt fracții (0,25 = 25%). */
export interface TaxParametersValues {
  minWageReference: number
  cassMinThreshold: number
  casThreshold12: number
  casThreshold24: number
  cassMaxBase: number
  casRate: number
  cassRate: number
  incomeTaxRate: number
  carriedLossOffsetLimit: number
}

export interface TaxParametersResponse {
  taxYear: number
  /** Ce se folosește acum în calcul. `null` când anul nu are plafoane deloc. */
  current: TaxParametersValues | null
  /** Valorile din fișierul anului (ANAF), pentru comparație și resetare. */
  defaults: TaxParametersValues | null
  isOverridden: boolean
  ruleVersion: string | null
  source: string | null
  updatedAtUtc: string | null
  availableYears: number[]
}

export const adminTaxParametersService = {
  async get(year?: number): Promise<TaxParametersResponse> {
    const { data } = await api.get<TaxParametersResponse>('/admin/tax-parameters', { params: year ? { year } : undefined })
    return data
  },

  async save(year: number, values: TaxParametersValues): Promise<TaxParametersResponse> {
    const { data } = await api.put<TaxParametersResponse>(`/admin/tax-parameters/${year}`, values)
    return data
  },

  async reset(year: number): Promise<TaxParametersResponse> {
    const { data } = await api.delete<TaxParametersResponse>(`/admin/tax-parameters/${year}`)
    return data
  },
}
