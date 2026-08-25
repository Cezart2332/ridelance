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

/** O linie de pe factura de emis. Prețul în bani, ca peste tot. */
export interface NewInvoiceLine {
  name: string
  quantity: number
  priceBani: number
  measuringUnit: string
  vatPercent: number
  vatIncluded: boolean
}

export interface IssueInvoiceInput {
  seriesName: string
  clientName: string
  clientCif: string | null
  clientEmail: string | null
  clientAddress: string | null
  clientCity: string | null
  clientState: string | null
  /** Scadența ca număr de zile de la emitere. `0` înseamnă fără scadență. */
  dueDateDays: number
  lines: NewInvoiceLine[]
  note: string | null
  sendToSpv: boolean
}

export interface IssuedInvoiceResult {
  seriesName: string
  number: string
  link: string | null
}

/** Datele publice ale unei firme, din registrul ANAF. */
export interface CompanyLookup {
  cui: string
  name: string
  address: string | null
  city: string | null
  county: string | null
  registrationNumber: string | null
  vatPayer: boolean
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

  /** Emite factura pe contul Oblio al proprietarului. Oblio o numerotează, nu noi. */
  async issue(input: IssueInvoiceInput): Promise<IssuedInvoiceResult> {
    const res = await api.post<IssuedInvoiceResult>('/invoices/issue', input)
    return res.data
  },

  /**
   * Caută firma după CUI, pentru precompletare.
   *
   * `null` când registrul n-o are sau nu răspunde: un CUI negăsit nu e o eroare de arătat, e un
   * formular care rămâne de completat de mână.
   */
  async lookupCompany(cui: string): Promise<CompanyLookup | null> {
    try {
      const res = await api.get<CompanyLookup>(`/invoices/company/${encodeURIComponent(cui)}`)
      return res.data
    } catch {
      return null
    }
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
