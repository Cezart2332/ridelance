import type {
  BankConnectionStatus,
  ClientWorkspaceRow,
  DeclarationCell,
  DeclarationStatus,
  DeclarationType,
  PfaMonthStatus,
  Period,
  VatRegistrationStatus,
} from '../../api/types'

/**
 * Culorile și textele scurte din „Clienți PFA” și „Rezumat”, ca în macheta aprobată: o bulină
 * și un cuvânt, fără explicații dedesubt.
 */
export type Tone = 'green' | 'yellow' | 'red' | 'blue' | 'gray'

export const TONES: Record<Tone, { bg: string; border: string; text: string; dot: string }> = {
  green: { bg: '#F0FDF4', border: '#BBF7D0', text: '#15803D', dot: '#16A34A' },
  yellow: { bg: '#FEFCE8', border: '#FEF08A', text: '#A16207', dot: '#EAB308' },
  red: { bg: '#FEF2F2', border: '#FECACA', text: '#B91C1C', dot: '#DC2626' },
  blue: { bg: 'rgba(92,203,245,0.14)', border: 'rgba(92,203,245,0.45)', text: '#2B8FB8', dot: '#5CCBF5' },
  gray: { bg: '#F3F5F7', border: '#E3E7EB', text: '#6B6B7B', dot: '#9A9AA8' },
}

export const INK = '#1a1a2e'
export const MUTED = '#6B6B7B'
export const BODY = '#4A4A5E'
export const HAIRLINE = 'rgba(0,0,0,0.06)'
export const PRIMARY = '#5CCBF5'

export const DECLARATION_TYPES: DeclarationType[] = ['D100', 'D301', 'D390']

export interface Cell {
  tone: Tone
  label: string
  /** Motivul complet, pentru tooltip. */
  title?: string
}

/** Starea unei cereri D700, într-un cuvânt. */
export const VAT_STATUS_CELL: Record<VatRegistrationStatus, Cell> = {
  WAITING_FOR_DATA: { tone: 'red', label: 'Lipsesc date' },
  GENERATED: { tone: 'gray', label: 'Neverificată' },
  VALIDATION_FAILED: { tone: 'red', label: 'Validare picată' },
  READY_FOR_REVIEW: { tone: 'yellow', label: 'De verificat' },
  APPROVED: { tone: 'blue', label: 'De depus' },
  REJECTED: { tone: 'red', label: 'Respinsă' },
  SUBMITTED: { tone: 'blue', label: 'Depusă' },
  REGISTERED: { tone: 'green', label: 'Cod primit' },
}

/** Luna fiscală de lucru: luna trecută (declarațiile se depun până pe 25 a lunii curente). */
export function currentFiscalPeriod(today = new Date()): Period {
  const date = new Date(today.getFullYear(), today.getMonth() - 1, 1)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

export function recentPeriods(last: Period, count = 12): Period[] {
  const [year, month] = last.split('-').map(Number)
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(year, month - 1 - index, 1)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
  })
}

/** „Lipsă Uber”, „De verificat”, „Complete”. */
export function documentsCell(row: Pick<ClientWorkspaceRow, 'monthStatus' | 'reason'>): Cell | null {
  switch (row.monthStatus) {
    case null:
      return null
    case 'READY':
      return { tone: 'green', label: 'Complete' }
    case 'NEEDS_REVIEW':
      return { tone: 'yellow', label: 'De verificat', title: row.reason ?? undefined }
    case 'MISSING_DOCUMENTS': {
      const platform = row.reason?.includes('Uber') ? ' Uber' : row.reason?.includes('Bolt') ? ' Bolt' : ''
      return { tone: 'red', label: `Lipsă${platform}`, title: row.reason ?? undefined }
    }
    default:
      return { tone: 'gray', label: 'Neprocesat' }
  }
}

export function bankCell(status: BankConnectionStatus | null): Cell {
  switch (status) {
    case 'LINKED':
      return { tone: 'green', label: 'Conectată' }
    case 'CREATED':
    case 'PENDING':
      return { tone: 'yellow', label: 'În curs' }
    case 'EXPIRED':
    case 'ERROR':
    case 'REVOKED':
      return { tone: 'red', label: 'De reconectat' }
    default:
      return { tone: 'gray', label: 'Neconectată' }
  }
}

const DECLARATION_WORD: Partial<Record<DeclarationStatus, Cell>> = {
  DRAFT: { tone: 'gray', label: 'Negenerată' },
  GENERATED: { tone: 'blue', label: 'De validat' },
  VALIDATION_FAILED: { tone: 'red', label: 'Validare picată' },
  VALIDATED: { tone: 'blue', label: 'De semnat' },
  READY_TO_SIGN: { tone: 'blue', label: 'De semnat' },
  SIGNED: { tone: 'blue', label: 'De depus' },
  SUBMITTED: { tone: 'yellow', label: 'Fără recipisă' },
  ACCEPTED: { tone: 'green', label: 'Depusă' },
  REJECTED: { tone: 'red', label: 'Respinsă' },
}

/** Starea unei declarații într-un cuvânt; `null` = nimic de arătat încă. */
export function declarationCell(cell: DeclarationCell | undefined): Cell | null {
  if (!cell?.status || cell.status === 'NOT_APPLICABLE' || cell.status.startsWith('BLOCKED')) return null
  return DECLARATION_WORD[cell.status] ?? null
}

/** Declarațiile care contează în lună (fără N/A și fără cele blocate). */
export function applicableDeclarations(declarations: Partial<Record<DeclarationType, DeclarationCell>>): DeclarationCell[] {
  return DECLARATION_TYPES.map((type) => declarations[type]).filter(
    (cell): cell is DeclarationCell => Boolean(cell?.status) && cell!.status !== 'NOT_APPLICABLE',
  )
}

const ORDER: DeclarationStatus[] = [
  'VALIDATION_FAILED',
  'REJECTED',
  'GENERATED',
  'VALIDATED',
  'READY_TO_SIGN',
  'SIGNED',
  'SUBMITTED',
  'ACCEPTED',
]

/** Cea mai puțin avansată declarație generată: ea spune pasul următor. */
export function laggingDeclaration(
  declarations: Partial<Record<DeclarationType, DeclarationCell>>,
): { type: DeclarationType; cell: DeclarationCell } | null {
  const generated = DECLARATION_TYPES.flatMap((type) => {
    const cell = declarations[type]
    return cell?.declarationId && cell.status && ORDER.includes(cell.status) ? [{ type, cell }] : []
  })
  if (generated.length === 0) return null
  return generated.sort((a, b) => ORDER.indexOf(a.cell.status!) - ORDER.indexOf(b.cell.status!))[0]
}

export function isFinished(row: Pick<ClientWorkspaceRow, 'declarations'>): boolean {
  const cells = applicableDeclarations(row.declarations)
  return cells.length > 0 && cells.every((cell) => cell.status === 'ACCEPTED')
}

export function monthStatusTone(status: PfaMonthStatus | null): Tone {
  return status === 'READY' ? 'green' : status === 'NEEDS_REVIEW' ? 'yellow' : status === 'MISSING_DOCUMENTS' ? 'red' : 'gray'
}

export function initials(name: string): string {
  return name
    .replace(/\bPFA\b/gi, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}
