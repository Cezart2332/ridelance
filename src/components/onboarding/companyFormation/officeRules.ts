import type { Adresa } from '../../../services/companyFormation.service'

const ADDRESS_KEYS: (keyof Adresa)[] = [
  'judet',
  'localitate',
  'strada',
  'numar',
  'bloc',
  'scara',
  'etaj',
  'apartament',
  'codPostal',
]

export const sameAddress = (a: Adresa, b: Adresa) =>
  ADDRESS_KEYS.every((k) => (a[k] ?? '') === (b[k] ?? ''))

export const hasAddress = (a: Adresa) => Boolean(a.judet && a.localitate && a.strada && a.numar)

/** Ce mai lipsește din adresa sediului, ca butonul dezactivat să spună de ce e dezactivat. */
export function missingOfficeFields(a: Adresa): string[] {
  const required: [keyof Adresa, string][] = [
    ['judet', 'județul'],
    ['localitate', 'localitatea'],
    ['strada', 'strada'],
    ['numar', 'numărul'],
  ]

  const missing = required.filter(([key]) => !a[key]).map(([, label]) => label)
  // Codul poștal are o cerință în plus față de „completat": șase cifre.
  if ((a.codPostal ?? '').length !== 6) missing.push('codul poștal (6 cifre)')

  return missing
}
