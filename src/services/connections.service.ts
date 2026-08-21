import { api } from '../lib/axios'

/** Cele patru stări vizuale din spec §3.4. Pragul „expiră curând" e decis pe server. */
export type IntegrationStatus = 'disconnected' | 'connected' | 'expiring' | 'error'

export type IntegrationProvider = 'Oblio' | 'Bank' | 'Eldrive'

export interface Integration {
  provider: IntegrationProvider
  status: IntegrationStatus
  connectedAtUtc: string | null
  expiresAtUtc: string | null
  lastSyncAtUtc: string | null
  errorMessage: string | null
  /** `false` când integrarea nu poate fi conectată încă — cardul o spune, nu ascunde. */
  available: boolean
  details: { label: string; value: string }[]
}

export const connectionsService = {
  async getAll(): Promise<Integration[]> {
    const res = await api.get<Integration[]>('/connections')
    return res.data
  },
}
