import { api } from '../lib/axios'

export interface ServiceOrder {
  id: string
  serviceKey: string
  serviceTitle: string
  customerName: string
  customerEmail: string
  customerPhone: string
  status: string
  amountBani: number | null
  createdAtUtc: string
  paidAtUtc: string | null
}

export const serviceOrdersService = {
  async getAllAdmin(status?: string): Promise<ServiceOrder[]> {
    const res = await api.get<ServiceOrder[]>('/payments/service-orders', {
      params: status ? { status } : undefined,
    })
    return res.data
  },
}
