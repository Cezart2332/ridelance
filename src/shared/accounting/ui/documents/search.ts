/** Normalizarea pentru căutarea fragmentelor: fără diacritice, spații comprimate, litere mici. */
export function normalizeForSearch(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-̧̦ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}
