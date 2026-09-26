import type { LedgerEntry, LedgerTransactionType, PaymentMethod } from '../../api/types'
import { formatAmount, parseAmount } from '../../format'

export interface LedgerFormValues {
  date: string
  documentLabel: string
  counterparty: string
  description: string
  transactionType: LedgerTransactionType
  paymentMethod: PaymentMethod
  amount: string
  category: string
}

export function emptyLedgerForm(date: string): LedgerFormValues {
  return {
    date,
    documentLabel: '',
    counterparty: '',
    description: '',
    transactionType: 'EXPENSE',
    paymentMethod: 'BANK',
    amount: '',
    category: '',
  }
}

export function ledgerFormFrom(entry: LedgerEntry): LedgerFormValues {
  return {
    date: entry.date,
    documentLabel: entry.documentLabel,
    counterparty: entry.counterparty ?? '',
    description: entry.description,
    transactionType: entry.transactionType,
    paymentMethod: entry.paymentMethod,
    amount: formatAmount(entry.amount),
    category: entry.category ?? '',
  }
}

/** Valorile formularului ca modificări; `null` dacă suma nu e validă. Plățile se salvează negative. */
export function ledgerFormValues(values: LedgerFormValues) {
  const parsed = parseAmount(values.amount)
  if (parsed === null) return null
  const outgoing = values.transactionType === 'EXPENSE' || values.transactionType === 'TAX'
  const amount = outgoing ? -Math.abs(parsed) : values.transactionType === 'INCOME' ? Math.abs(parsed) : parsed
  return {
    date: values.date,
    documentLabel: values.documentLabel.trim(),
    counterparty: values.counterparty.trim() || null,
    description: values.description.trim(),
    transactionType: values.transactionType,
    paymentMethod: values.paymentMethod,
    amount,
    category: values.transactionType === 'EXPENSE' ? values.category || null : null,
  }
}
