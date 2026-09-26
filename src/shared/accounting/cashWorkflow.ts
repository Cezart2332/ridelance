import type { CashRegisterStatus } from './api/types'

/**
 * Traseul casei de marcat (spec §3.4, F7): INACTIV → ÎN VERIFICARE → ACTIV. Trecerea în `ACTIVE`
 * se face doar din `IN_VERIFICATION` și doar cu dovada de fiscalizare, deci activarea nu poate
 * sări peste verificare.
 */
export const CASH_TRANSITIONS: Readonly<Record<CashRegisterStatus, readonly CashRegisterStatus[]>> = {
  NOT_REQUIRED_CURRENT_CONFIGURATION: ['PENDING', 'IN_VERIFICATION'],
  PENDING: ['IN_VERIFICATION', 'NOT_REQUIRED_CURRENT_CONFIGURATION'],
  IN_VERIFICATION: ['ACTIVE', 'PENDING', 'NOT_REQUIRED_CURRENT_CONFIGURATION'],
  ACTIVE: ['NOT_REQUIRED_CURRENT_CONFIGURATION'],
}

export const CASH_STATUSES_REQUIRING_EVIDENCE: readonly CashRegisterStatus[] = ['ACTIVE']

export function canTransitionCash(from: CashRegisterStatus, to: CashRegisterStatus): boolean {
  return CASH_TRANSITIONS[from].includes(to)
}
