import { api } from '../lib/axios'

/**
 * Semnarea din email. Singurul serviciu care vorbește cu rute publice.
 *
 * Tokenul din URL e autentificarea: chiriașul n-are cont, deci nu există antet de autorizare de
 * trimis. Cererile merg prin aceeași instanță axios; interceptorul adaugă un token de sesiune doar
 * dacă există, iar aici nu există.
 */

export interface SignatureRequest {
  documentTitle: string
  rentalCode: string
  companyName: string
  tenantName: string
  documentId: string
  expiresAtUtc: string
}

export const signingService = {
  async get(token: string): Promise<SignatureRequest> {
    const res = await api.get<SignatureRequest>(`/signing/${token}`)
    return res.data
  },

  async downloadDocument(token: string): Promise<Blob> {
    const res = await api.get(`/signing/${token}/document`, { responseType: 'blob' })
    return res.data as Blob
  },

  async sign(token: string, signatureImage: string): Promise<void> {
    await api.post(`/signing/${token}`, { signatureImage })
  },
}
