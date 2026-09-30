import { api } from '../lib/axios'
import type { ExpenseDocumentUploadResult, ExpensePaymentChoice, LedgerEntry, MatchProposal } from '../shared/accounting/api/types'

/** Ce vede PFA-ul pe un rând (spec flux contabil §8). */
export type ClientTransactionState =
  | 'DOCUMENT_MISSING'
  | 'INVOICE_FOUND'
  | 'DOCUMENT_ATTACHED'
  | 'NEEDS_REVIEW'
  | 'PAYOUT_PENDING'
  | 'PAYOUT_RECONCILED'
  | 'TRANSFER'
  | 'TAX'
  | 'INCOME'

export interface ClientTransaction {
  id: string
  date: string
  amount: number
  title: string
  detail: string | null
  paymentMethod: 'BANK' | 'CASH' | 'MANUAL'
  state: ClientTransactionState
  /** Plata căreia i se poate asocia un bon, la `DOCUMENT_MISSING`. */
  ledgerEntryId: string | null
}

export interface ClientTransactions {
  attentionCount: number
  rows: ClientTransaction[]
  proposals: MatchProposal[]
}

export const clientLedgerService = {
  async transactions(from: string, to: string): Promise<ClientTransactions> {
    return (await api.get<ClientTransactions>('/pfa/ledger/transactions', { params: { from, to } })).data
  },

  async uploadReceipt(file: File): Promise<ExpenseDocumentUploadResult> {
    const form = new FormData()
    form.append('file', file)
    return (await api.post<ExpenseDocumentUploadResult>('/pfa/ledger/expense-documents', form, { headers: { 'Content-Type': 'multipart/form-data' } })).data
  },

  async confirmReceipt(expenseDocumentId: string, payment: ExpensePaymentChoice, ledgerEntryId: string | null, personalAmount: number | null): Promise<LedgerEntry> {
    return (await api.post<LedgerEntry>(`/pfa/ledger/expense-documents/${expenseDocumentId}/confirm`, { payment, ledgerEntryId, personalAmount })).data
  },

  async resolveProposal(id: string, accept: boolean): Promise<void> {
    await api.post(`/pfa/ledger/match-proposals/${id}/${accept ? 'accept' : 'reject'}`)
  },
}
