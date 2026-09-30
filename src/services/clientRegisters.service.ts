import { api } from '../lib/axios'
import type {
  AccountingYear,
  AddInventoryItemRequest,
  Asset,
  InventoryCount,
  InventoryItemRequest,
} from '../shared/accounting/api/types'

/** Registrele văzute de PFA (spec registre §8): inventarul de confirmat, activele, pachetele anuale. */
export const clientRegistersService = {
  /** Inventarierea de confirmat, altfel ultima finală; `null` dacă nu există niciuna. */
  async inventory(): Promise<InventoryCount | null> {
    const response = await api.get<InventoryCount | ''>('/pfa/inventory')
    return response.status === 204 || !response.data ? null : response.data
  },

  async updateItem(countId: string, itemId: string, request: InventoryItemRequest): Promise<InventoryCount> {
    return (await api.patch<InventoryCount>(`/pfa/inventory/${countId}/items/${itemId}`, request)).data
  },

  async addItem(countId: string, request: AddInventoryItemRequest): Promise<InventoryCount> {
    return (await api.post<InventoryCount>(`/pfa/inventory/${countId}/items`, request)).data
  },

  async submit(countId: string): Promise<InventoryCount> {
    return (await api.post<InventoryCount>(`/pfa/inventory/${countId}/submit`)).data
  },

  async assets(): Promise<Asset[]> {
    return (await api.get<Asset[]>('/pfa/assets')).data
  },

  async assetSheet(assetId: string): Promise<Blob> {
    return (await api.get<Blob>(`/pfa/assets/${assetId}/sheet`, { responseType: 'blob' })).data
  },

  async years(): Promise<AccountingYear[]> {
    return (await api.get<AccountingYear[]>('/pfa/years')).data
  },

  async yearPackage(year: number): Promise<Blob> {
    return (await api.get<Blob>(`/pfa/years/${year}/package`, { responseType: 'blob' })).data
  },
}
