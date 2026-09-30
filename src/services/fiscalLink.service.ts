import { api } from '../lib/axios'

export interface FiscalLinkRegister {
  id: string
  serialNumber: string | null
  /** Starea la FiscalLink: `Active` pentru o casă activată. */
  status: string
  isOnline: boolean
  /** Casa a fost adăugată după serie și așteaptă confirmarea din aplicația FiscalLink. */
  awaitingClientConsent: boolean
  activatedAtUtc: string | null
}

export interface FiscalLinkConnection {
  connected: boolean
  activationCode: string | null
  activationLink: string | null
  registers: FiscalLinkRegister[]
  /** FiscalLink n-a răspuns: conexiunea există, dar datele live lipsesc. */
  error: string | null
}

export const fiscalLinkService = {
  async get(): Promise<FiscalLinkConnection> {
    return (await api.get<FiscalLinkConnection>('/connections/fiscallink')).data
  },

  async connect(): Promise<FiscalLinkConnection> {
    return (await api.post<FiscalLinkConnection>('/connections/fiscallink')).data
  },
}
