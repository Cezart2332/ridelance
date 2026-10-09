/**
 * E.164, cu aceleași reguli ca `PlatformContactRules` de pe backend: „0712345678",
 * „0040712345678" și „+40 712 345 678" sunt același număr, iar ce se salvează e forma canonică.
 */
export function toE164(value: string): string | null {
  const raw = value.trim()
  if (raw === '') return null

  const hadPlus = raw.startsWith('+')
  let digits = raw.replace(/\D/g, '')
  if (digits === '') return null

  if (!hadPlus) {
    if (digits.startsWith('00')) digits = digits.slice(2)
    else if (digits.startsWith('0')) digits = `40${digits.slice(1)}`
  }

  return digits.length >= 8 && digits.length <= 15 ? `+${digits}` : null
}
