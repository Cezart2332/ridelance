/**
 * Unitatea de preț e săptămâna, peste tot (spec §5). Echivalentul zilnic e strict informativ:
 * se calculează aici, nu vine din API, tocmai ca să nu poată fi confundat cu un tarif real.
 */
export function approxDailyPrice(weeklyPrice: number): number {
  return Math.round(weeklyPrice / 7)
}

/** `1.250` — separatorul de mii românesc, fără zecimale: prețurile sunt sume rotunde. */
export function formatLei(value: number): string {
  return value.toLocaleString('ro-RO', { maximumFractionDigits: 0 })
}
