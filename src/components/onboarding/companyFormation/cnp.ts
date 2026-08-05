/**
 * Validarea CNP-ului în browser, ca userul să afle imediat că a greșit o cifră. Serverul
 * validează din nou (`CnpValidator` din Domain) — asta e doar feedback, nu o barieră.
 */

const WEIGHTS = [2, 7, 9, 1, 4, 6, 3, 5, 8, 2, 7, 9]

function centuryOf(first: number): number | null {
  if (first === 1 || first === 2) return 1900
  if (first === 3 || first === 4) return 1800
  if (first === 5 || first === 6) return 2000
  // 7/8/9 — rezidenți străini; anul se deduce tot din 1900+.
  if (first >= 7 && first <= 9) return 1900
  return null
}

/** Data nașterii codificată în CNP, ca `yyyy-MM-dd`, sau null dacă e imposibilă. */
export function cnpBirthDate(cnp: string): string | null {
  if (!/^\d{13}$/.test(cnp)) return null

  const century = centuryOf(Number(cnp[0]))
  if (century === null) return null

  const year = century + Number(cnp.slice(1, 3))
  const month = Number(cnp.slice(3, 5))
  const day = Number(cnp.slice(5, 7))

  if (month < 1 || month > 12) return null
  // `new Date` normalizează zilele imposibile (32 ianuarie → 1 februarie), deci verificăm după.
  const date = new Date(Date.UTC(year, month - 1, day))
  if (date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null

  return date.toISOString().slice(0, 10)
}

/** „M" / „F" după prima cifră. */
export function cnpSex(cnp: string): 'M' | 'F' | null {
  if (!/^\d{13}$/.test(cnp)) return null
  const first = Number(cnp[0])
  if ([1, 3, 5, 7].includes(first)) return 'M'
  if ([2, 4, 6, 8].includes(first)) return 'F'
  return null
}

/** 13 cifre cu cifră de control corectă și dată de naștere posibilă. */
export function isValidCnp(cnp: string): boolean {
  if (!/^\d{13}$/.test(cnp)) return false

  const sum = WEIGHTS.reduce((acc, weight, i) => acc + Number(cnp[i]) * weight, 0)
  const remainder = sum % 11
  const checkDigit = remainder === 10 ? 1 : remainder

  return checkDigit === Number(cnp[12]) && cnpBirthDate(cnp) !== null
}
