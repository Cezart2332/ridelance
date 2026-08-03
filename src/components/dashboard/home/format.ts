/**
 * Formatarea ro-RO, o singură implementare (spec §10).
 * Regula: în KPI tiles sumele peste 1000 se afișează fără zecimale; în tabel și în
 * breakdown-uri, mereu cu două zecimale.
 */

const currencyFormatter = new Intl.NumberFormat('ro-RO', {
  style: 'currency',
  currency: 'RON',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const compactFormatter = new Intl.NumberFormat('ro-RO', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

const decimalFormatter = new Intl.NumberFormat('ro-RO', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const oneDecimalFormatter = new Intl.NumberFormat('ro-RO', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
})

/** „10.652,00 lei" */
export function formatCurrency(value: number): string {
  return currencyFormatter.format(value).replace('RON', 'lei').trim()
}

/** „10.652 lei" — pentru KPI tiles; sub 1000 păstrează zecimalele, ca să nu piardă sens. */
export function formatCompact(value: number): string {
  const rounded = Math.abs(value) >= 1000 ? compactFormatter.format(value) : decimalFormatter.format(value)
  return `${rounded} lei`
}

/** Etichetele de axă rămân fără zecimale — pe axă contează ordinul de mărime, nu banii. */
export function formatAxisNumber(value: number): string {
  return compactFormatter.format(value)
}

/** „184 h" */
export function formatHours(value: number): string {
  return `${oneDecimalFormatter.format(value)} h`
}

/** „2.140 km" */
export function formatDistance(value: number): string {
  return `${oneDecimalFormatter.format(value)} km`
}

/** „57,89 lei/h" */
export function formatRate(value: number, unit: string): string {
  return `${decimalFormatter.format(value)} lei/${unit}`
}

/** „24.06.2026" dintr-un ISO date sau datetime. */
export function formatDate(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('ro-RO', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

/** „14:32" în ora locală. */
export function formatTime(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })
}

/** „31 min" */
export function formatDuration(minutes: number): string {
  return `${Math.round(minutes)} min`
}

export function formatPercent(ratio: number, digits = 0): string {
  return `${new Intl.NumberFormat('ro-RO', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(ratio * 100)}%`
}

/** „1–30 iunie 2026" / „24 mai – 12 iunie 2026" — subtitlul de perioadă din topbar. */
export function formatPeriodLabel(from: string, to: string): string {
  const start = new Date(`${from}T00:00:00`)
  const end = new Date(`${to}T00:00:00`)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return ''

  const month = (date: Date) => date.toLocaleDateString('ro-RO', { month: 'long' })

  if (start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth()) {
    return `${start.getDate()}–${end.getDate()} ${month(end)} ${end.getFullYear()}`
  }

  if (start.getFullYear() === end.getFullYear()) {
    return `${start.getDate()} ${month(start)} – ${end.getDate()} ${month(end)} ${end.getFullYear()}`
  }

  return `${start.getDate()} ${month(start)} ${start.getFullYear()} – ${end.getDate()} ${month(end)} ${end.getFullYear()}`
}

/** „iunie 2026" dintr-un „2026-06". */
export function formatFiscalMonth(month: string): string {
  const [year, monthNumber] = month.split('-').map(Number)
  if (!year || !monthNumber) return month
  const date = new Date(year, monthNumber - 1, 1)
  return date.toLocaleDateString('ro-RO', { month: 'long', year: 'numeric' })
}

/** Câmpurile lipsă se scriu „—", niciodată „N/A" și niciodată celulă goală. */
export const EMPTY_FIELD = '—'
