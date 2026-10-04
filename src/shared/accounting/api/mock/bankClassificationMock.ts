import { BANK_CLASSIFICATION_LABEL } from '../../statusLabels'
import type {
  BankClassification,
  ClassificationOption,
  LedgerEntry,
  LedgerTransactionType,
  RegisterExceptionGroup,
  RegisterExceptionKind,
} from '../types'
import { BANK_CLASSIFICATIONS } from '../types'

/**
 * Clasificarea bancară în mock (aceleași reguli ca `BankClassifications` și `RjipExplanations`
 * din backend): excepțiile RJIP, explicațiile din clasificare și regula „Aplică la toate similare”.
 */

export const BANK_FEE_CATEGORY = 'BANK_FEES'

const GROUPS: { kind: RegisterExceptionKind; label: string }[] = [
  { kind: 'UNIDENTIFIED_INCOME', label: 'Încasări neidentificate' },
  { kind: 'UNCLASSIFIED_PAYMENT', label: 'Plăți neclasificate' },
  { kind: 'TRANSFER_TO_CONFIRM', label: 'Transferuri de confirmat' },
  { kind: 'MISSING_DOCUMENT', label: 'Document lipsă' },
  { kind: 'UNRECONCILED_PAYOUT', label: 'Payout-uri de reconciliat' },
]

const TRANSFERS: BankClassification[] = ['OWNER_CONTRIBUTION', 'OWNER_WITHDRAWAL', 'INTERNAL_TRANSFER']

export function fits(classification: BankClassification, amount: number): boolean {
  if (['OWNER_CONTRIBUTION', 'ACTIVITY_INCOME', 'NON_TAXABLE'].includes(classification)) return amount > 0
  if (['OWNER_WITHDRAWAL', 'TAX_PAYMENT', 'BANK_FEE', 'EXPENSE'].includes(classification)) return amount < 0
  return amount !== 0
}

const option = (classification: BankClassification): ClassificationOption => ({ classification, label: BANK_CLASSIFICATION_LABEL[classification] })

export function exceptionOf(entry: LedgerEntry): RegisterExceptionKind | null {
  if (entry.stornoOfEntryId || entry.closedPeriodFlag) return null
  if (entry.transactionType === 'PLATFORM_SETTLEMENT') return 'UNRECONCILED_PAYOUT'
  if (entry.reconciliationStatus === 'NEEDS_REVIEW') {
    if (entry.proposedClassification && TRANSFERS.includes(entry.proposedClassification)) return 'TRANSFER_TO_CONFIRM'
    return entry.amount > 0 ? 'UNIDENTIFIED_INCOME' : 'UNCLASSIFIED_PAYMENT'
  }
  return entry.reconciliationStatus === 'UNMATCHED' ? 'MISSING_DOCUMENT' : null
}

export function exceptionGroups(entries: LedgerEntry[]): RegisterExceptionGroup[] {
  const items = entries
    .map((entry) => ({ entry, kind: exceptionOf(entry) }))
    .filter((item): item is { entry: LedgerEntry; kind: RegisterExceptionKind } => item.kind !== null)
    .sort((a, b) => a.entry.date.localeCompare(b.entry.date))
  return GROUPS.map((group) => ({
    ...group,
    items: items
      .filter((item) => item.kind === group.kind)
      .map(({ entry }) => {
        const bank = entry.source === 'BANK'
        return {
          ledgerEntryId: entry.id,
          date: entry.date,
          amount: entry.amount,
          bankDetails: [entry.counterparty, entry.description].filter(Boolean).join(' · '),
          proposal: entry.proposedClassification ? option(entry.proposedClassification) : null,
          options: bank ? BANK_CLASSIFICATIONS.filter((value) => fits(value, entry.amount)).map(option) : [],
          canApplyToSimilar: bank && nameKey(entry).length >= 3,
        }
      }),
  })).filter((group) => group.items.length > 0)
}

/** Numele contrapartidei (sau detaliile), normalizat și fără cifre: cheia regulii învățate. */
export function nameKey(entry: LedgerEntry): string {
  const source = entry.counterparty || entry.description
  return source
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/[^A-Z ]/g, ' ')
    .split(' ')
    .filter((word) => word.length > 0 && !['SRL', 'SA', 'BV', 'OU', 'PFA'].includes(word))
    .join(' ')
}

const TARGET: Record<BankClassification, { type: LedgerTransactionType; category: string | null }> = {
  OWNER_CONTRIBUTION: { type: 'OWNER_CONTRIBUTION', category: null },
  OWNER_WITHDRAWAL: { type: 'OWNER_WITHDRAWAL', category: null },
  INTERNAL_TRANSFER: { type: 'INTERNAL_TRANSFER', category: null },
  TAX_PAYMENT: { type: 'TAX', category: null },
  BANK_FEE: { type: 'EXPENSE', category: BANK_FEE_CATEGORY },
  ACTIVITY_INCOME: { type: 'INCOME', category: null },
  NON_TAXABLE: { type: 'OTHER', category: null },
  EXPENSE: { type: 'EXPENSE', category: null },
}

/** Aplică clasificarea pe înregistrare (mutabil, ca restul mock-ului). */
export function applyClassification(entry: LedgerEntry, classification: BankClassification): void {
  const target = TARGET[classification]
  entry.transactionType = target.type
  entry.category = target.category ?? (classification === 'EXPENSE' ? entry.category : null)
  entry.proposedClassification = null
  entry.reconciliationStatus = classification === 'EXPENSE' ? 'UNMATCHED' : 'MATCHED'
  entry.status = 'VERIFIED'
  entry.deductibleAmount = classification === 'BANK_FEE' ? Math.abs(entry.amount) : entry.transactionType === 'EXPENSE' ? entry.deductibleAmount : null
  entry.rowVersion = String(Number(entry.rowVersion) + 1)
}

/** Clasificarea deja aplicată, după tip. */
function classificationOf(entry: LedgerEntry): BankClassification | null {
  switch (entry.transactionType) {
    case 'OWNER_CONTRIBUTION':
      return 'OWNER_CONTRIBUTION'
    case 'OWNER_WITHDRAWAL':
      return 'OWNER_WITHDRAWAL'
    case 'INTERNAL_TRANSFER':
      return 'INTERNAL_TRANSFER'
    case 'TAX':
      return 'TAX_PAYMENT'
    case 'EXPENSE':
      return entry.category === BANK_FEE_CATEGORY ? 'BANK_FEE' : 'EXPENSE'
    case 'INCOME':
      return 'ACTIVITY_INCOME'
    case 'OTHER':
      return entry.reconciliationStatus === 'MATCHED' ? 'NON_TAXABLE' : null
    default:
      return null
  }
}

/** Explicația RJIP: din clasificare la tranzacțiile din bancă, descrierea sistemului în rest. */
export function explain(entry: LedgerEntry, categoryLabel: (category: string) => string | undefined): string {
  if (entry.source !== 'BANK' || entry.eFacturaMessageId || entry.settlementGroupId) {
    return entry.counterparty && !entry.description.includes(entry.counterparty) ? `${entry.description} – ${entry.counterparty}` : entry.description
  }
  if (entry.reconciliationStatus === 'NEEDS_REVIEW') {
    const state = entry.proposedClassification ? 'neclasificată' : 'neidentificată'
    return entry.amount > 0 ? `Încasare ${state}` : `Plată ${state}`
  }
  const documented = entry.documentLabel.length > 0 && !entry.documentLabel.startsWith('Extras')
  const classification = classificationOf(entry)
  let text: string
  if (classification === 'EXPENSE') {
    text = entry.category ? (categoryLabel(entry.category) ?? 'Cheltuială din activitate') : documented ? 'Cheltuială' : 'Cheltuială neclasificată'
  } else if (classification) {
    text = BANK_CLASSIFICATION_LABEL[classification]
  } else {
    text = entry.amount > 0 ? 'Încasare neidentificată' : 'Plată neidentificată'
  }
  return documented ? `${text}, ${entry.documentLabel.charAt(0).toLowerCase()}${entry.documentLabel.slice(1)}` : text
}

/** „Extras bancar, ref. XXXXXXXX”: felul și numărul documentului. */
export function bankDocument(entry: LedgerEntry): string {
  const reference = (entry.externalId ?? entry.id).replace(/[^A-Za-z0-9]/g, '')
  return `Extras bancar, ref. ${reference.slice(-8).toUpperCase()}`
}
