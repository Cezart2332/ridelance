import { CASH_REGISTER_STATUS, DECLARATION_STATUS } from '../../statusLabels'
import type { CashRegisterStatus, DeclarationStatus } from '../../api/types'

/** Etichetele românești ale jurnalului de audit (tabul „Istoric”). */

const ENTITY_LABEL: Record<string, string> = {
  PlatformDocument: 'Document platformă',
  DocumentExtraction: 'Date citite din document',
  DeclarationVersion: 'Declarație',
  PfaAccountingSettings: 'Setări contabilitate',
  CashRegisterState: 'Casă de marcat',
  CashEvidence: 'Dovadă fiscalizare',
  PfaAccountingEngagement: 'Colaborare',
  HandoverPackage: 'Dosar de predare',
  LedgerEntry: 'Tranzacție',
  ExpenseDocument: 'Document cheltuială',
  ZReport: 'Raport Z',
  Asset: 'Activ',
  AccountingPeriod: 'Perioadă contabilă',
  PeriodCorrection: 'Corecție controlată',
}

const ACTION_LABEL: Record<string, string> = {
  UPLOAD: 'Încărcare',
  CONFIRM: 'Confirmare',
  MANUAL_EDIT: 'Modificare manuală',
  GENERATE: 'Generare',
  RECTIFICATION: 'Rectificativă creată',
  APPEND: 'Valoare nouă',
  DEACTIVATE: 'Inactivare',
  UPDATE: 'Modificare',
  VERIFY: 'Verificare',
  CREATE_MANUAL: 'Adăugare manuală',
  CREATE: 'Creare',
  CLOSE: 'Închiderea lunii',
  PERIOD_CORRECTION: 'Corecție controlată',
}

export function entityLabel(entity: string): string {
  return ENTITY_LABEL[entity] ?? entity
}

export function actionLabel(action: string): string {
  if (action.startsWith('STATUS_')) {
    const status = action.slice('STATUS_'.length) as DeclarationStatus
    return `Status: ${DECLARATION_STATUS[status]?.label ?? status}`
  }
  if (action.startsWith('CASH_')) {
    const status = action.slice('CASH_'.length) as CashRegisterStatus
    return `Cash: ${CASH_REGISTER_STATUS[status]?.label ?? status}`
  }
  return ACTION_LABEL[action] ?? action
}

/** Valoarea unui câmp din `before`/`after`, pe un rând. */
export function auditValue(value: unknown): string {
  if (value === null || value === undefined) return '—'
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return JSON.stringify(value)
}

/** Câmpurile care diferă între `before` și `after`. */
export function changedFields(before: Record<string, unknown> | null, after: Record<string, unknown> | null): string[] {
  const keys = new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})])
  return [...keys].filter((key) => JSON.stringify(before?.[key]) !== JSON.stringify(after?.[key]))
}
