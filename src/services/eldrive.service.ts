import { api } from '../lib/axios'

export interface EldriveConnection {
  connected: boolean
  email: string | null
  /** Starea la Eldrive: `accepted` când adresa are deja cont Eldrive. */
  status: string | null
  connectedAtUtc: string | null
}

export interface EldriveInviteAdmin {
  id: string
  userId: string
  clientName: string
  accountEmail: string
  eldriveEmail: string
  eldriveInviteId: number
  status: string
  createdAtUtc: string
  removedAtUtc: string | null
  subscriptionStatus: string | null
  /** Fals pe o invitație activă: clientul a renunțat la abonament, deci Eldrive trebuie scos. */
  subscriptionActive: boolean
}

export const eldriveService = {
  async getConnection(): Promise<EldriveConnection> {
    return (await api.get<EldriveConnection>('/connections/eldrive')).data
  },

  async connect(email: string): Promise<EldriveConnection> {
    return (await api.post<EldriveConnection>('/connections/eldrive', { email })).data
  },

  async listInvites(): Promise<EldriveInviteAdmin[]> {
    return (await api.get<EldriveInviteAdmin[]>('/admin/eldrive/invites')).data
  },

  async removeInvite(id: string): Promise<void> {
    await api.delete(`/admin/eldrive/invites/${id}`)
  },
}
