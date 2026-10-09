import { api } from '../lib/axios'
import type {
  AccountingYear,
  AddInventoryItemRequest,
  Asset,
  InventoryCount,
  ManualLedgerEntryRequest,
  InventoryItemRequest,
  RjipView,
  RefView,
} from '../shared/accounting/api/types'

/** Registrele văzute de PFA (spec registre §8): inventarul de confirmat, activele, pachetele anuale. */
export const clientRegistersService = {
  async rjip(year: number): Promise<RjipView> {
    return (await api.get<RjipView>('/pfa/accounting/registers/rjip', { params: { from: `${year}-01-01`, to: `${year}-12-31` } })).data
  },
  async ref(year: number): Promise<RefView> {
    return (await api.get<RefView>('/pfa/accounting/registers/ref', { params: { year } })).data
  },
  /** PFAlone: o încasare sau o plată trecută de el în registru. */
  async addEntry(request: Omit<ManualLedgerEntryRequest, 'reason'>): Promise<void> {
    await api.post('/pfa/accounting/registers/entries', { ...request, reason: '' })
  },
  async deleteEntry(id: string): Promise<void> {
    await api.delete(`/pfa/accounting/registers/entries/${id}`)
  },
  async exportRegister(kind: 'rjip' | 'ref' | 'inventory', year: number): Promise<Blob> {
    return (await api.get<Blob>(`/pfa/accounting/registers/${kind}/export`, { params: kind === 'rjip' ? { from: `${year}-01-01`, to: `${year}-12-31` } : { year }, responseType: 'blob' })).data
  },
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
