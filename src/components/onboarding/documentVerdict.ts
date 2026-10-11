/**
 * Verdictul unui document în onboarding, într-un singur loc.
 *
 * Verificarea automată e doar primul filtru. Dacă un om din echipă a validat documentul, verdictul
 * lui bate „respins” de la AI: altfel documentul rămânea roșu la client și pasul nu mai înainta,
 * deși adminul îl aprobase.
 */
interface Judged {
  status: string
  aiStatus?: string | null
}

/** Validat de echipă (admin sau contabil). */
export function isApprovedByTeam(document: Judged): boolean {
  const status = document.status.toLowerCase()
  return status === 'verified' || status === 'approved'
}

/** Respins: de echipă, sau de verificarea automată fără ca echipa să fi spus altceva. */
export function isDocumentRejected(document: Judged): boolean {
  if (document.status.toLowerCase() === 'rejected') return true
  return document.aiStatus === 'Failed' && !isApprovedByTeam(document)
}

/** Verificarea automată a picat sau n-a putut rula, iar echipa încă nu s-a pronunțat. */
export function isAiBlocking(document: Judged): boolean {
  return (document.aiStatus === 'Failed' || document.aiStatus === 'Error') && !isApprovedByTeam(document)
}
