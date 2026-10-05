import { DECLARATION_STATUS, type StatusDescriptor } from '../../statusLabels'
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

const toneVars = (name: Tone) => ({ bg: `var(--rl-${name}-bg)`, border: `var(--rl-${name}-border)`, text: `var(--rl-${name}-text)`, dot: `var(--rl-${name}-dot)` })

/** Culorile vin din tema panoului (`--rl-*`), ca tonurile să se potrivească în tema închisă și în cea deschisă. */
export const TONES: Record<Tone, { bg: string; border: string; text: string; dot: string }> = {
  green: toneVars('green'),
  yellow: toneVars('yellow'),
  red: toneVars('red'),
  blue: toneVars('blue'),
  gray: toneVars('gray'),
}

export const INK = 'var(--rl-fg)'
export const MUTED = 'var(--rl-text-muted)'
export const BODY = 'var(--rl-fg-soft)'
export const HAIRLINE = 'var(--rl-border)'
export const PRIMARY = 'var(--rl-brand)'

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

export function currentCalendarPeriod(today = new Date()): Period {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Bucharest', year: 'numeric', month: '2-digit' }).format(today)
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

const TONE_OF: Record<StatusDescriptor['tone'], Tone> = {
  success: 'green',
  warning: 'yellow',
  error: 'red',
  neutral: 'gray',
}

/**
 * Starea unei declarații, cu aceeași etichetă ca peste tot (QA 5): un singur dicționar,
 * `DECLARATION_STATUS`. `null` = nimic de arătat încă.
 */
export function declarationCell(cell: DeclarationCell | undefined): Cell | null {
  if (!cell?.status || cell.status === 'NOT_APPLICABLE' || cell.status.startsWith('BLOCKED')) return null
  const descriptor = DECLARATION_STATUS[cell.status]
  return { tone: TONE_OF[descriptor.tone] ?? 'gray', label: descriptor.label }
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
