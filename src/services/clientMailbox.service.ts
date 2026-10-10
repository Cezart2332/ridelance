import { api } from '../lib/axios'

export type ClientMailboxStatus = 'NotCreated' | 'Creating' | 'Active' | 'Failed' | 'Transferred'

/** Emailul operațional al clientului, cum îl vede adminul. Fără parole. */
export interface ClientMailbox {
  status: ClientMailboxStatus
  address: string | null
  /** Identitatea RIDElance; există doar cât emailul e activ. */
  opsIdentityAddress: string | null
  lastError: string | null
  activatedAtUtc: string | null
  transferredAtUtc: string | null
  /** Documentul „Predare email”, după offboarding. */
  handoverDocumentId: string | null
}

export interface OpsCredentials {
  address: string
  password: string
}

/** Emailurile de azi față de limitele planului Migadu. */
export interface MailboxUsage {
  incomingToday: number
  incomingLimit: number
  outgoingToday: number
  outgoingLimit: number
  storageGb: number
  /** Peste 80% din oricare limită. */
  alert: boolean
}

/** Setările pe care agentul le pune în Thunderbird. Aceleași ca pe server (`MailboxServers`). */
export const MAILBOX_SERVERS = {
  imap: { host: 'imap.migadu.com', port: 993, security: 'SSL/TLS' },
  smtp: { host: 'smtp.migadu.com', port: 465, security: 'SSL/TLS' },
} as const

export const clientMailboxService = {
  async get(pfaId: string): Promise<ClientMailbox> {
    return (await api.get<ClientMailbox>(`/admin/onboarding/${pfaId}/mailbox`)).data
  },

  /** „Creează” sau „Reîncearcă”: intră în coadă, crearea o face serverul în fundal. */
  async request(pfaId: string): Promise<ClientMailbox> {
    return (await api.post<ClientMailbox>(`/admin/onboarding/${pfaId}/mailbox`)).data
  },

  /** Fiecare apel se scrie în jurnalul de audit. */
  async revealCredentials(pfaId: string): Promise<OpsCredentials> {
    return (await api.post<OpsCredentials>(`/admin/onboarding/${pfaId}/mailbox/credentials`)).data
  },

  /** Offboarding: parolă nouă, identitatea RIDElance ștearsă, documentul de predare generat. */
  async transfer(pfaId: string): Promise<ClientMailbox> {
    return (await api.post<ClientMailbox>(`/admin/onboarding/${pfaId}/mailbox/transfer`)).data
  },

  async usage(): Promise<MailboxUsage> {
    return (await api.get<MailboxUsage>('/admin/mailboxes/usage')).data
  },

  /** Adresa operațională a clientului logat; `null` cât nu are una. */
  async own(): Promise<string | null> {
    const response = await api.get<{ address: string } | ''>('/pfa/mailbox')
    return response.status === 204 || !response.data ? null : response.data.address
  },
}
