/**
 * Conversiile dintre data stocată și data citită de om.
 *
 * Stocarea rămâne ISO (`aaaa-ll-zz`), aceeași formă pe care o trimitea `<input type="date">`, deci
 * nimic din API-uri sau din starea formularelor nu se schimbă. Afișarea e cea românească
 * (`zz.ll.aaaa`), fixă — nu urmează limba sistemului, cum face inputul nativ.
 *
 * Într-un fișier fără componente, ca `DateField` să nu-și piardă reîncărcarea la cald: un modul
 * care exportă și componente, și funcții, rupe fast refresh.
 */

export interface DateParts {
  year: number
  /** 0-based, ca în `Date`. */
  month: number
  day: number
}

const pad = (value: number) => String(value).padStart(2, '0')

export const toIso = ({ year, month, day }: DateParts) => `${year}-${pad(month + 1)}-${pad(day)}`

/** ISO → părți. Respinge și datele imposibile („2026-02-31"), nu doar formatul greșit. */
export function parseIso(value: string | null | undefined): DateParts | null {
  if (!value) return null
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value)
  if (!match) return null

  const year = Number(match[1])
  const month = Number(match[2]) - 1
  const day = Number(match[3])
  const probe = new Date(year, month, day)

  if (probe.getFullYear() !== year || probe.getMonth() !== month || probe.getDate() !== day) {
    return null
  }

  return { year, month, day }
}

/** ISO → `zz.ll.aaaa`. Șir gol pentru o valoare lipsă sau invalidă. */
export function formatRo(value: string | null | undefined): string {
  const parts = parseIso(value)
  return parts ? `${pad(parts.day)}.${pad(parts.month + 1)}.${parts.year}` : ''
}

/**
 * Ce a tastat utilizatorul → ISO, sau `null` dacă încă nu e o dată.
 *
 * Acceptă punct, slash sau linie ca separator: se tastează `12/03/1990` la fel de des ca
 * `12.03.1990`, iar respingerea unuia dintre ele ar fi o regulă fără motiv.
 */
export function parseRo(text: string): string | null {
  const match = /^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/.exec(text.trim())
  if (!match) return null

  const iso = toIso({
    day: Number(match[1]),
    month: Number(match[2]) - 1,
    year: Number(match[3]),
  })

  return parseIso(iso) ? iso : null
}

export const startOfToday = (): DateParts => {
  const now = new Date()
  return { year: now.getFullYear(), month: now.getMonth(), day: now.getDate() }
}

export const compareParts = (a: DateParts, b: DateParts) =>
  a.year - b.year || a.month - b.month || a.day - b.day

/** Ziua vecină, peste granițe de lună și de an. */
export function shiftDay(parts: DateParts, days: number): DateParts {
  const moved = new Date(parts.year, parts.month, parts.day + days)
  return { year: moved.getFullYear(), month: moved.getMonth(), day: moved.getDate() }
}

/** Aceeași zi din altă lună, retrasă la ultima zi validă („31 ianuarie" + 1 lună = 28/29 februarie). */
export function shiftMonth(parts: DateParts, months: number): DateParts {
  const target = new Date(parts.year, parts.month + months, 1)
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate()
  return {
    year: target.getFullYear(),
    month: target.getMonth(),
    day: Math.min(parts.day, lastDay),
  }
}

/** Câte rânduri are grila. Fix 6, ca popoverul să nu-și schimbe înălțimea de la o lună la alta. */
export const WEEK_ROWS = 6

/**
 * Cele 42 de zile ale grilei, luni-first, cu zilele lunilor vecine incluse.
 *
 * Vecinele se afișează estompat, dar rămân apăsabile: „31 martie" e vizibil pe grila lui aprilie,
 * iar un utilizator care îl vede și nu-l poate apăsa nu înțelege de ce.
 */
export function buildMonthGrid(year: number, month: number): DateParts[] {
  const leading = (new Date(year, month, 1).getDay() + 6) % 7
  const first = new Date(year, month, 1 - leading)

  return Array.from({ length: WEEK_ROWS * 7 }, (_, index) => {
    const date = new Date(first.getFullYear(), first.getMonth(), first.getDate() + index)
    return { year: date.getFullYear(), month: date.getMonth(), day: date.getDate() }
  })
}

/** Anii oferiți în saltul rapid: o fereastră în jurul celui vizibil, tăiată de min/max. */
export function yearWindow(viewYear: number, minYear?: number, maxYear?: number): number[] {
  const start = Math.max(minYear ?? viewYear - 60, viewYear - 60)
  const end = Math.min(maxYear ?? viewYear + 10, viewYear + 10)
  return Array.from({ length: Math.max(end - start + 1, 1) }, (_, index) => start + index)
}
