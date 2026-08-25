import { api } from '../lib/axios'

/** Statusul e derivat pe server din sumele venite din Oblio; frontendul nu îl recalculează. */
export type InvoiceStatus = 'paid' | 'partial' | 'unpaid' | 'canceled'

export interface OblioConnection {
  connected: boolean
  companyName: string | null
  cif: string | null
  seriesName: string | null
  availableSeries: string[]
  errorMessage: string | null
  lastSyncAtUtc: string | null
}

export interface Invoice {
  seriesName: string
  number: string
  issueDate: string
  dueDate: string | null
  clientName: string
  clientCif: string | null
  totalBani: number
  collectedBani: number
  link: string | null
  status: InvoiceStatus
  /** Neîncasată și trecută de scadență. Calculat pe server, cu aceeași zi de referință. */
  overdue: boolean
}

export interface InvoiceSummary {
  issuedBani: number
  issuedCount: number
  collectedBani: number
  collectedCount: number
  outstandingBani: number
  overdueCount: number
}

export interface InvoicesOverview {
  connection: OblioConnection
  summary: InvoiceSummary
  invoices: Invoice[]
}

export interface OblioConnectInput {
  clientId: string
  clientSecret: string
  cif: string
  seriesName: string | null
}

export const invoicesService = {
  async getOverview(from?: string, to?: string): Promise<InvoicesOverview> {
    const res = await api.get<InvoicesOverview>('/invoices', {
      params: { from: from || undefined, to: to || undefined },
    })
    return res.data
  },

  async connectOblio(input: OblioConnectInput): Promise<OblioConnection> {
    const res = await api.post<OblioConnection>('/invoices/oblio/connect', input)
    return res.data
  },

  async disconnectOblio(): Promise<void> {
    await api.delete('/invoices/oblio')
  },

  async collect(seriesName: string, number: string, amountBani: number, paymentMethod: string): Promise<void> {
    await api.post('/invoices/collect', { seriesName, number, amountBani, paymentMethod })
  },

  async cancel(seriesName: string, number: string): Promise<void> {
    await api.post('/invoices/cancel', { seriesName, number })
  },
}
