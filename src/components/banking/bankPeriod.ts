/**
 * Perioada pe care se uită cineva la mișcările din cont: zi, săptămână, lună, an.
 *
 * Trăiește separat de panou fiindcă o folosesc trei ecrane (PFA, SRL, contabil) și un singur
 * serviciu. Ce pleacă spre server sunt două date calendaristice și o grupare — nu „an + lună",
 * cum era înainte: patru trepte nu încap în două numere, iar „ultimele 7 zile" n-are lună.
 */

export type BankPeriodKind = 'day' | 'week' | 'month' | 'year'

/** Cum se grupează coloanele din grafic. Pe un an vrei luni, pe o lună vrei zile. */
export type BankBucket = 'day' | 'week' | 'month'

export interface BankPeriod {
  kind: BankPeriodKind
  /** Ancora: ziua, sau o zi oarecare din săptămâna/luna/anul cerut. */
  anchor: Date
}

export interface BankRange {
  from: string
  to: string
  bucket: BankBucket
  label: string
}

export const BANK_PERIOD_LABELS: Record<BankPeriodKind, string> = {
  day: 'Zi',
  week: 'Săptămână',
  month: 'Lună',
  year: 'An',
}

const MONTHS = [
  'ianuarie', 'februarie', 'martie', 'aprilie', 'mai', 'iunie',
  'iulie', 'august', 'septembrie', 'octombrie', 'noiembrie', 'decembrie',
]

/** Data, fără oră și fără fus: serverul primește ziua calendaristică, nu un moment. */
function iso(date: Date): string {
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

/** Luni, nu duminică — la fel ca gruparea de pe server. */
function startOfWeek(date: Date): Date {
  const start = new Date(date)
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7))
  return start
}

export function rangeOf(period: BankPeriod): BankRange {
  const { kind, anchor } = period

  if (kind === 'day') {
    return {
      from: iso(anchor),
      to: iso(anchor),
      bucket: 'day',
      label: `${anchor.getDate()} ${MONTHS[anchor.getMonth()]} ${anchor.getFullYear()}`,
    }
  }

  if (kind === 'week') {
    const from = startOfWeek(anchor)
    const to = new Date(from)
    to.setDate(to.getDate() + 6)

    return {
      from: iso(from),
      to: iso(to),
      bucket: 'day',
      label: `${from.getDate()} ${MONTHS[from.getMonth()]} – ${to.getDate()} ${MONTHS[to.getMonth()]} ${to.getFullYear()}`,
    }
  }

  if (kind === 'month') {
    const from = new Date(anchor.getFullYear(), anchor.getMonth(), 1)
    const to = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0)

    return {
      from: iso(from),
      to: iso(to),
      bucket: 'day',
      label: `${MONTHS[from.getMonth()]} ${from.getFullYear()}`,
    }
  }

  const from = new Date(anchor.getFullYear(), 0, 1)
  const to = new Date(anchor.getFullYear(), 11, 31)

  return {
    from: iso(from),
    to: iso(to),
    // Pe un an, coloane lunare: 365 de bare nu se citesc.
    bucket: 'month',
    label: `${from.getFullYear()}`,
  }
}

/** Mută ancora cu un pas înainte sau înapoi, în unitatea perioadei curente. */
export function shift(period: BankPeriod, steps: number): BankPeriod {
  const anchor = new Date(period.anchor)

  switch (period.kind) {
    case 'day':
      anchor.setDate(anchor.getDate() + steps)
      break
    case 'week':
      anchor.setDate(anchor.getDate() + steps * 7)
      break
    case 'month':
      anchor.setMonth(anchor.getMonth() + steps)
      break
    case 'year':
      anchor.setFullYear(anchor.getFullYear() + steps)
      break
  }

  return { ...period, anchor }
}

/** Perioada curentă include ziua de azi — deci nu are sens să mergi mai departe. */
export function isCurrent(period: BankPeriod): boolean {
  const { from, to } = rangeOf(period)
  const today = iso(new Date())
  return today >= from && today <= to
}
