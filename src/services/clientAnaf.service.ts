import { api } from '../lib/axios'
import type { PfaEFactura, PfaSpv } from '../shared/accounting/api/types'

export const clientAnafService = {
  async spv(): Promise<PfaSpv> { return (await api.get<PfaSpv>('/pfa/accounting/spv')).data },
  async efactura(): Promise<Pick<PfaEFactura, 'link' | 'messages'>> { return (await api.get<Pick<PfaEFactura, 'link' | 'messages'>>('/pfa/accounting/efactura')).data },
  async spvFile(id: string): Promise<Blob> { return (await api.get<Blob>(`/pfa/accounting/spv/${id}/file`, { responseType: 'blob' })).data },
  async invoiceFile(id: string, kind: 'xml' | 'pdf'): Promise<Blob> { return (await api.get<Blob>(`/pfa/accounting/efactura/${id}/${kind}`, { responseType: 'blob' })).data },
}
