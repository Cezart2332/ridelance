import type { DeclarationAction, DeclarationStatus } from './api/types'

/**
 * Mașina de stări a unei versiuni de declarație (spec §3.2), într-un singur loc: mock-ul o
 * aplică, iar ecranele o folosesc ca să nu afișeze acțiuni pe care backendul le-ar refuza cu 409.
 */

/** Tranzițiile de status permise, exact lista din §3.2. */
export const DECLARATION_STATUS_TRANSITIONS: Readonly<Record<DeclarationStatus, readonly DeclarationStatus[]>> = {
  NOT_APPLICABLE: [],
  BLOCKED_MISSING_DOCUMENTS: [],
  BLOCKED_NEEDS_REVIEW: [],
  DRAFT: ['GENERATED'],
  GENERATED: ['VALIDATED', 'VALIDATION_FAILED'],
  VALIDATION_FAILED: ['GENERATED'],
  VALIDATED: ['READY_TO_SIGN'],
  READY_TO_SIGN: ['SIGNED'],
  SIGNED: ['SUBMITTED'],
  SUBMITTED: ['ACCEPTED', 'REJECTED'],
  // Din ACCEPTED nu se mișcă versiunea: se creează una nouă, RECTIFICATIVE, în GENERATED.
  ACCEPTED: [],
  REJECTED: ['GENERATED'],
}

export function canTransition(from: DeclarationStatus, to: DeclarationStatus): boolean {
  return DECLARATION_STATUS_TRANSITIONS[from].includes(to)
}

/** Din ce status pornește fiecare acțiune a endpoint-ului `transitions`. */
export const DECLARATION_ACTION_SOURCES: Readonly<Record<DeclarationAction, readonly DeclarationStatus[]>> = {
  VALIDATE: ['GENERATED'],
  MARK_SIGNED: ['READY_TO_SIGN'],
  MARK_SUBMITTED: ['SIGNED'],
  MARK_REJECTED: ['SUBMITTED'],
  REGENERATE: ['VALIDATION_FAILED', 'REJECTED'],
}

/** Statusul-țintă al acțiunilor deterministe. `VALIDATE` depinde de rezultatul validării. */
export const DECLARATION_ACTION_TARGETS: Readonly<Record<Exclude<DeclarationAction, 'VALIDATE'>, DeclarationStatus>> = {
  MARK_SIGNED: 'SIGNED',
  MARK_SUBMITTED: 'SUBMITTED',
  MARK_REJECTED: 'REJECTED',
  REGENERATE: 'GENERATED',
}

/** Acțiunile cu notă obligatorie. */
export const ACTIONS_REQUIRING_NOTE: readonly DeclarationAction[] = ['MARK_REJECTED']

/** Toate operațiile din UI pe o versiune, inclusiv cele cu endpoint propriu. */
export type DeclarationOperation = DeclarationAction | 'UPLOAD_RECEIPT' | 'CREATE_RECTIFICATION'

export function isActionAllowed(status: DeclarationStatus, action: DeclarationAction): boolean {
  return DECLARATION_ACTION_SOURCES[action].includes(status)
}

/**
 * Operațiile disponibile pe versiunea curentă. `CREATE_RECTIFICATION` se aplică declarației, dar
 * pornește doar dintr-o versiune curentă `ACCEPTED`.
 */
export function availableOperations(status: DeclarationStatus): DeclarationOperation[] {
  const operations: DeclarationOperation[] = (Object.keys(DECLARATION_ACTION_SOURCES) as DeclarationAction[])
    .filter((action) => isActionAllowed(status, action))
  if (status === 'SUBMITTED') operations.push('UPLOAD_RECEIPT')
  if (status === 'ACCEPTED') operations.push('CREATE_RECTIFICATION')
  return operations
}

/**
 * Traseul „fericit”, pentru stepper-ul din dosar. Stările de eroare (`VALIDATION_FAILED`,
 * `REJECTED`) se afișează pe pasul la care au apărut.
 */
export const DECLARATION_STEPPER: readonly DeclarationStatus[] = [
  'GENERATED',
  'VALIDATED',
  'READY_TO_SIGN',
  'SIGNED',
  'SUBMITTED',
  'ACCEPTED',
]

/** Statusurile după care documentele sursă nu se mai pot edita (§3.1 `LOCKED`: „dincolo de GENERATED”). */
export const DECLARATION_STATUSES_LOCKING_DOCUMENTS: readonly DeclarationStatus[] = [
  'VALIDATED',
  'READY_TO_SIGN',
  'SIGNED',
  'SUBMITTED',
  'ACCEPTED',
]
