/**
 * Validarea CNP-ului în browser, ca userul să afle imediat că a greșit o cifră. Serverul
 * validează din nou (`CnpValidator` din Domain) — asta e doar feedback, nu o barieră.
 */

const WEIGHTS = [2, 7, 9, 1, 4, 6, 3, 5, 8, 2, 7, 9]

/**
 * Zerourile seturilor de cifre pe care le poate produce o tastatură reală sau un OCR. Fiecare set
 * are cele zece cifre pe coduri consecutive, deci valoarea e diferența față de zeroul lui.
 * NFKC rezolvă deja cifrele fullwidth și pe cele matematice; astea rămân.
 */
const DIGIT_ZEROS = [
  0x0030, // ASCII
  0x0660, // arabo-indic
  0x06f0, // arabo-indic extins (persan)
  0x0966, // devanagari
]

/**
 * Aduce un CNP la forma canonică: doar cifre ASCII, fără nimic altceva.
 *
 * Se aplică pe AMBELE părți ale oricărei comparații — ce a tastat userul și ce a citit OCR-ul.
 * Motivul e literal: un CNP corect pica față de OCR pentru că una dintre valori venea cu un
 * spațiu nedespărțitor, un zero-width din copy-paste sau o cratimă de separator. Comparația
 * compara ambalajul, nu numărul.
 */
export function normalizeCnp(raw: string | null | undefined): string {
  if (!raw) return ''

  let digits = ''
  for (const char of raw.normalize('NFKC')) {
    const code = char.codePointAt(0)!
    const zero = DIGIT_ZEROS.find((start) => code >= start && code <= start + 9)
    if (zero !== undefined) digits += String(code - zero)
  }

  return digits
}

/** Cele două valori sunt același CNP, după normalizare. Gol nu se potrivește cu nimic. */
export function cnpMatches(typed: string | null | undefined, other: string | null | undefined): boolean {
  const a = normalizeCnp(typed)
  const b = normalizeCnp(other)
  return a.length === 13 && a === b
}

function centuryOf(first: number): number | null {
  if (first === 1 || first === 2) return 1900
  if (first === 3 || first === 4) return 1800
  if (first === 5 || first === 6) return 2000
  // 7/8/9 — rezidenți străini; anul se deduce tot din 1900+.
  if (first >= 7 && first <= 9) return 1900
  return null
}

/** Data nașterii codificată în CNP, ca `yyyy-MM-dd`, sau null dacă e imposibilă. */
export function cnpBirthDate(raw: string): string | null {
  const cnp = normalizeCnp(raw)
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
export function cnpSex(raw: string): 'M' | 'F' | null {
  const cnp = normalizeCnp(raw)
  if (!/^\d{13}$/.test(cnp)) return null
  const first = Number(cnp[0])
  if ([1, 3, 5, 7].includes(first)) return 'M'
  if ([2, 4, 6, 8].includes(first)) return 'F'
  return null
}

/** 13 cifre cu cifră de control corectă și dată de naștere posibilă. */
export function isValidCnp(raw: string): boolean {
  const cnp = normalizeCnp(raw)
  if (!/^\d{13}$/.test(cnp)) return false

  const sum = WEIGHTS.reduce((acc, weight, i) => acc + Number(cnp[i]) * weight, 0)
  const remainder = sum % 11
  const checkDigit = remainder === 10 ? 1 : remainder

  return checkDigit === Number(cnp[12]) && cnpBirthDate(cnp) !== null
}
