/** Textele cu care codul vechi umplea câmpurile goale. Sunt tot goluri, doar mai lungi. */
const EMPTY_PLACEHOLDERS = ['nu se aplică', 'nu este completat', 'necompletat', '—', '-']

/** Un câmp e gol și dacă poartă unul dintre substitutele de mai sus. */
export const isEmptyValue = (value?: string | null): boolean =>
  value === null ||
  value === undefined ||
  value.trim() === '' ||
  EMPTY_PLACEHOLDERS.includes(value.trim().toLowerCase())
