/**
 * Numere de telefon românești, în formele pe care le tastează oamenii:
 * `0722 123 456`, `+40722123456`, `0040-722-123-456`.
 *
 * Validarea e permisivă cu spațiile și cratimele și strictă cu restul: un număr greșit înseamnă un
 * lead pe care nu-l mai poți suna.
 */
const RO_PHONE = /^(?:\+?40|0040|0)(7\d{8}|[23]\d{8})$/

export function normalizePhone(value: string): string {
  return value.replace(/[\s().-]/g, '')
}

export function isValidRoPhone(value: string): boolean {
  return RO_PHONE.test(normalizePhone(value))
}
