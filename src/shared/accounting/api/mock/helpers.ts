import type {
  ExpenseCategoryRule,
  IsoDate,
  LedgerEntry,
  Period,
  SettingHistoryEntry,
  SettingKey,
  SettingValueMap,
  Validity,
} from '../types'

/** Funcții pure folosite și de fixtures, și de mock. */

/** Doar contra zgomotului de virgulă mobilă; rotunjirea fiscală pe declarație e DE CONFIRMAT. */
export const round2 = (value: number) => Math.round(value * 100) / 100

export const periodOf = (date: IsoDate): Period => date.slice(0, 7)

export function isValidAt(item: Validity, date: IsoDate): boolean {
  return item.validFrom <= date && (item.validTo === null || date <= item.validTo)
}

export function validAt<T extends Validity>(items: readonly T[], date: IsoDate, match?: (item: T) => boolean): T | null {
  return items.find((item) => (!match || match(item)) && isValidAt(item, date)) ?? null
}

/** Două intervale de valabilitate se suprapun (capete incluse). */
export function overlaps(a: Validity, b: Validity): boolean {
  const aEnd = a.validTo ?? '9999-12-31'
  const bEnd = b.validTo ?? '9999-12-31'
  return a.validFrom <= bEnd && b.validFrom <= aEnd
}

/** Ziua dinaintea unei date ISO. */
export function dayBefore(date: IsoDate): IsoDate {
  const [year, month, day] = date.split('-').map(Number)
  const previous = new Date(Date.UTC(year, month - 1, day - 1))
  return previous.toISOString().slice(0, 10)
}

export function lastDayOfPeriod(period: Period): IsoDate {
  const [year, month] = period.split('-').map(Number)
  return new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10)
}

export function nextPeriod(period: Period): Period {
  const [year, month] = period.split('-').map(Number)
  return month === 12 ? `${year + 1}-01` : `${year}-${String(month + 1).padStart(2, '0')}`
}

/** Lunile de la `from` la `to`, inclusiv. */
export function periodRange(from: Period, to: Period): Period[] {
  const periods: Period[] = []
  for (let current = from; current <= to; current = nextPeriod(current)) periods.push(current)
  return periods
}

/**
 * Istoricul unei setări cu `validTo` derivat din intrarea următoare. Intrările nu se
 * suprascriu niciodată: o valoare nouă doar închide intervalul celei vechi.
 */
export function withDerivedValidTo(history: SettingHistoryEntry[]): SettingHistoryEntry[] {
  const sorted = [...history].sort((a, b) => a.key.localeCompare(b.key) || a.validFrom.localeCompare(b.validFrom))
  return sorted.map((entry, index) => {
    const next = sorted[index + 1]
    return { ...entry, validTo: next && next.key === entry.key ? dayBefore(next.validFrom) : null }
  })
}

export function settingAt<K extends SettingKey>(
  history: SettingHistoryEntry[],
  key: K,
  date: IsoDate,
): SettingHistoryEntry<K> | null {
  const candidates = history
    .filter((entry) => entry.key === key && entry.validFrom <= date)
    .sort((a, b) => b.validFrom.localeCompare(a.validFrom))
  return (candidates[0] as SettingHistoryEntry<K> | undefined) ?? null
}

export function settingValueAt<K extends SettingKey>(
  history: SettingHistoryEntry[],
  key: K,
  date: IsoDate,
): SettingValueMap[K] | null {
  return settingAt(history, key, date)?.value ?? null
}

type Deductibility = Pick<
  LedgerEntry,
  'vehicleRelated' | 'deductibilityType' | 'deductiblePercent' | 'deductibleAmount' | 'deductibilityRule'
>

const PERCENT_BY_TYPE = { '100_PERCENT': 100, '50_PERCENT': 50, NON_DEDUCTIBLE: 0 } as const

/**
 * Oglinda lui `DeductibilityService.Resolve` (B6): categoria vine din `ExpenseCategoryRule`, iar
 * pentru cheltuielile auto procentul e setarea `vehicle_deductibility` valabilă la data
 * cheltuielii. `SPECIAL_RULE` rămâne fără procent (DE CONFIRMAT, §6 pct. 9).
 */
export function resolveDeductibility(
  entry: Pick<LedgerEntry, 'date' | 'transactionType' | 'amount' | 'category'>,
  history: SettingHistoryEntry[],
  categories: readonly ExpenseCategoryRule[],
): Deductibility {
  const none: Deductibility = {
    vehicleRelated: false,
    deductibilityType: null,
    deductiblePercent: null,
    deductibleAmount: null,
    deductibilityRule: null,
  }
  if (entry.transactionType !== 'EXPENSE' || !entry.category) return none

  const rule = validAt(categories, entry.date, (item) => item.category === entry.category)
  if (!rule) return none

  if (rule.vehicleRelated) {
    const setting = settingAt(history, 'vehicle_deductibility', entry.date)
    if (!setting) return { ...none, vehicleRelated: true }
    const percent = PERCENT_BY_TYPE[setting.value]
    return {
      vehicleRelated: true,
      deductibilityType: setting.value,
      deductiblePercent: percent,
      deductibleAmount: round2((Math.abs(entry.amount) * percent) / 100),
      deductibilityRule: { settingKey: 'vehicle_deductibility', ruleId: rule.id, validFrom: setting.validFrom },
    }
  }

  if (rule.defaultDeductibility === 'SPECIAL_RULE') {
    return {
      ...none,
      deductibilityType: 'SPECIAL_RULE',
      deductibilityRule: { settingKey: null, ruleId: rule.id, validFrom: rule.validFrom },
    }
  }

  const percent = PERCENT_BY_TYPE[rule.defaultDeductibility]
  return {
    vehicleRelated: false,
    deductibilityType: rule.defaultDeductibility,
    deductiblePercent: percent,
    deductibleAmount: round2((Math.abs(entry.amount) * percent) / 100),
    deductibilityRule: { settingKey: null, ruleId: rule.id, validFrom: rule.validFrom },
  }
}

/**
 * `RetentionService.MinimumRetentionUntil` (B8): 1 iulie al anului următor + N ani − 1 zi.
 * Pentru 2026 și 5 ani → 30.06.2032.
 */
export function retentionUntil(documentYear: number, yearsAfter: number, startMonthDay: string): IsoDate {
  return dayBefore(`${documentYear + 1 + yearsAfter}-${startMonthDay}`)
}

/** Hash hex determinist de 64 de caractere, ca stand-in pentru SHA-256 în fixtures. */
export function fakeSha256(seed: string): string {
  let hex = ''
  let state = 2166136261
  for (let round = 0; hex.length < 64; round++) {
    for (let index = 0; index < seed.length; index++) {
      state ^= seed.charCodeAt(index) + round
      state = Math.imul(state, 16777619) >>> 0
    }
    hex += state.toString(16).padStart(8, '0')
  }
  return hex.slice(0, 64)
}
