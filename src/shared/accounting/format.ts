import { formatRo } from '../../utils/dateValue'
import type { Period } from './api/types'

/**
 * Formatarea românească a modulului de contabilitate: o singură implementare pentru ecrane,
 * mock-uri și explicațiile de calcul („1.000,00 × 21% = 210,00”).
 *
 * `useGrouping: 'always'`: fără el, unele versiuni ICU aplică pentru `ro` gruparea minimă de două
 * cifre și scriu `1234,56` în loc de `1.234,56`.
 */

const amountFormatter = new Intl.NumberFormat('ro-RO', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  useGrouping: 'always',
})

const rateFormatter = new Intl.NumberFormat('ro-RO', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
  useGrouping: 'always',
})

/** Valoarea afișată pentru un câmp lipsă. */
export const EMPTY = '—'

/** `1.234,56` */
export function formatAmount(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return EMPTY
  // `-0,00` apare după rotunjiri de tipul -0.001; nu înseamnă nimic pentru contabil.
  const normalized = Math.abs(value) < 0.005 ? 0 : value
  return amountFormatter.format(normalized)
}

/** `1.234,56 lei` */
export function formatLei(value: number | null | undefined): string {
  const amount = formatAmount(value)
  return amount === EMPTY ? EMPTY : `${amount} lei`
}

/** `1.234,56 EUR`; pentru RON, `lei`. */
export function formatMoney(value: number | null | undefined, currency: string | null | undefined): string {
  if (!currency || currency === 'RON') return formatLei(value)
  const amount = formatAmount(value)
  return amount === EMPTY ? EMPTY : `${amount} ${currency}`
}

/** `21%`, `2%`, `0,5%` */
export function formatRate(rate: number | null | undefined): string {
  if (rate === null || rate === undefined || Number.isNaN(rate)) return EMPTY
  return `${rateFormatter.format(rate)}%`
}

/** `dd.MM.yyyy` dintr-o dată ISO (`yyyy-MM-dd`) sau dintr-un moment ISO. */
export function formatDate(value: string | null | undefined): string {
  if (!value) return EMPTY
  // Momentele UTC se afișează în ziua locală, nu în ziua din șir.
  if (value.length > 10) {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return EMPTY
    const pad = (part: number) => String(part).padStart(2, '0')
    return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()}`
  }
  return formatRo(value) || EMPTY
}

/** `dd.MM.yyyy, HH:mm` */
export function formatDateTime(value: string | null | undefined): string {
  if (!value) return EMPTY
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return EMPTY
  const time = date.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })
  return `${formatDate(value)}, ${time}`
}

/** `01.01.2027–30.06.2027`, `de la 01.07.2027` */
export function formatValidity(validFrom: string, validTo: string | null | undefined): string {
  return validTo ? `${formatDate(validFrom)}–${formatDate(validTo)}` : `de la ${formatDate(validFrom)}`
}

/** `august 2026` dintr-un `2026-08`. */
export function formatPeriod(period: Period): string {
  const [year, month] = period.split('-').map(Number)
  if (!year || !month) return period
  return new Date(year, month - 1, 1).toLocaleDateString('ro-RO', { month: 'long', year: 'numeric' })
}

/** `08.2026` — forma scurtă, pentru tabele. */
export function formatPeriodShort(period: Period): string {
  const [year, month] = period.split('-')
  return year && month ? `${month}.${year}` : period
}

/** `1.000,00 × 21% = 210,00` — explicația unei linii de calcul. */
export function formatCalculation(base: number, rate: number, value: number): string {
  return `${formatAmount(base)} × ${formatRate(rate)} = ${formatAmount(value)}`
}

/**
 * Suma tastată de om → număr. Acceptă `1.248,50`, `1248,50`, `1248.50`, `1,248.50`; `null` dacă
 * nu e o sumă. Ultimul separator e cel zecimal, dacă are cel mult două cifre după el.
 */
export function parseAmount(text: string): number | null {
  const compact = text.replace(/\s|lei|RON|EUR/gi, '')
  if (!compact) return null
  const lastSeparator = Math.max(compact.lastIndexOf(','), compact.lastIndexOf('.'))
  const decimals = lastSeparator >= 0 ? compact.slice(lastSeparator + 1) : ''
  const hasDecimals = lastSeparator >= 0 && decimals.length > 0 && decimals.length <= 2
  const whole = (hasDecimals ? compact.slice(0, lastSeparator) : compact).replace(/[.,]/g, '')
  const normalized = hasDecimals ? `${whole}.${decimals}` : whole
  if (!/^-?\d+(\.\d{1,2})?$/.test(normalized)) return null
  return Number(normalized)
}
