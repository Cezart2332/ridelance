/**
 * Regula lunii contabile, pereche cu `Application/Accounting/AccountingPeriod.cs` din backend.
 *
 * Contabilul închide luna pe 25 ale lunii următoare. Documentele pentru o lună se cer de pe 26 ale
 * ei până pe 25 ale lunii următoare: pentru septembrie, de pe 26 septembrie până pe 25 octombrie.
 * Un document încărcat în intervalul ăsta se socotește la luna aceea. Toate datele, ora României.
 */

const ROMANIA_TZ = 'Europe/Bucharest'

/** Ziua din luna următoare în care contabilul închide luna. */
export const ACCOUNTING_CLOSE_DAY = 25

export interface AccountingMonth {
  year: number
  /** 1–12 */
  month: number
}

/** Ziua calendaristică din România pentru un moment dat. */
function romaniaDay(date: Date): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: ROMANIA_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const pick = (type: string) => Number(parts.find((part) => part.type === type)?.value)
  return { year: pick('year'), month: pick('month'), day: pick('day') }
}

/**
 * Luna pentru care se cer documente la momentul dat: de pe 26 încolo luna curentă, până pe 25
 * inclusiv luna trecută. Tot asta e și luna la care se socotește un document încărcat atunci.
 */
export function requestedAccountingMonth(date = new Date()): AccountingMonth {
  const { year, month, day } = romaniaDay(date)
  if (day > ACCOUNTING_CLOSE_DAY) return { year, month }
  return month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 }
}

/** Documentul încărcat la momentul dat se socotește la luna contabilă dată? */
export function isUploadedInAccountingMonth(uploadedAtUtc: string, target: AccountingMonth): boolean {
  const owner = requestedAccountingMonth(new Date(uploadedAtUtc))
  return owner.year === target.year && owner.month === target.month
}

/** Ultima zi în care se mai primesc documente pentru luna dată (25 ale lunii următoare). */
export function accountingDeadline({ year, month }: AccountingMonth): Date {
  return new Date(Date.UTC(year, month, ACCOUNTING_CLOSE_DAY, 12))
}

/** „septembrie 2026". */
export function formatAccountingMonth({ year, month }: AccountingMonth): string {
  return new Intl.DateTimeFormat('ro-RO', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(Date.UTC(year, month - 1, 15)),
  )
}

/** „25 octombrie". */
export function formatAccountingDeadline(target: AccountingMonth): string {
  return new Intl.DateTimeFormat('ro-RO', { day: 'numeric', month: 'long', timeZone: 'UTC' }).format(
    accountingDeadline(target),
  )
}

/** Cheie stabilă a lunii, `2026-09`. */
export function accountingMonthKey({ year, month }: AccountingMonth): string {
  return `${year}-${String(month).padStart(2, '0')}`
}
