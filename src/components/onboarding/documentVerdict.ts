/**
 * Verdictul unui document în onboarding, într-un singur loc.
 *
 * Verdictul îl dă doar echipa (admin sau contabil). AI-ul doar citește documentul (OCR) și nu
 * respinge nimic, deci `aiStatus` nu intră aici.
 */
interface Judged {
  status: string
}

/** Validat de echipă (admin sau contabil). */
export function isApprovedByTeam(document: Judged): boolean {
  const status = document.status.toLowerCase()
  return status === 'verified' || status === 'approved'
}

/** Respins de echipă. */
export function isDocumentRejected(document: Judged): boolean {
  return document.status.toLowerCase() === 'rejected'
}
