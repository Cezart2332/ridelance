import { SITE_NAME } from './pageSeo'

/** Cât dintr-o descriere ajunge într-un rezultat de căutare. */
const MAX_DESCRIPTION_LENGTH = 160

const collapse = (text: string | null | undefined) => (text ?? '').split(/\s+/).filter(Boolean).join(' ')

/**
 * Descrierea paginii unei firme: sloganul ei; altfel începutul descrierii; altfel o propoziție
 * despre ce e pagina.
 *
 * Aceeași regulă e scrisă și pe server (`GetPageHeadQuery.CompanyDescription`), care pune
 * descrierea în pagină înainte să pornească aplicația. Trebuie ținute identice.
 */
export function companyDescription(legalName: string, tagline: string | null, about: string | null): string {
  const text = collapse(tagline) || collapse(about)
  if (!text) return `${legalName} — mașini de închiriat pentru ridesharing, pe ${SITE_NAME}.`
  return text.length <= MAX_DESCRIPTION_LENGTH ? text : `${text.slice(0, MAX_DESCRIPTION_LENGTH - 1).trimEnd()}…`
}
