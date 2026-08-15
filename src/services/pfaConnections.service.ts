import { api } from '../lib/axios'

/** Starea integrării contului Oblio al clientului. Avansul se face manual, din admin. */
export type OblioIntegrationStatus = 'Pending' | 'Requested' | 'Active'

export interface OblioConnection {
  status: OblioIntegrationStatus
  connected: boolean
  accountEmail: string | null
  companyName: string | null
  cui: string | null
  consentsAccepted: boolean
  consentsAcceptedAtUtc: string | null
  /** Null cât timp nu există sincronizare per client. */
  lastSyncAtUtc: string | null
}

export const pfaConnectionsService = {
  getOblio: async (): Promise<OblioConnection> => {
    const response = await api.get<OblioConnection>('/pfa/connections/oblio')
    return response.data
  },
}
