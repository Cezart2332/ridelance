/** Inițialele din nume, fără „PFA” (în „POPESCU ION PFA” contează omul, nu forma juridică). */
export function initials(name: string): string {
  return name
    .replace(/\bPFA\b/gi, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

/** Căutare fără diacritice și fără majuscule, ca în backend. */
export function fold(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}
