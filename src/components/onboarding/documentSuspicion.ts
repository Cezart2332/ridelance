import { isAiPending, type DocumentSummary } from '../../services/document.service'

const byNewest = (a: DocumentSummary, b: DocumentSummary) =>
  new Date(b.uploadedAtUtc).getTime() - new Date(a.uploadedAtUtc).getTime()

/**
 * Motivul pentru care cel mai nou document din categorii e suspect (CNP diferit de buletin, fără
 * ștampilă, PDF din Word), sau `null`. Doar pentru documente trecute: unul respins sau încă în
 * verificare își are deja starea lui.
 */
export function suspicionOf(documents: DocumentSummary[], categories: string[]): string | null {
  const newest = documents.filter((d) => categories.includes(d.category)).sort(byNewest)[0]
  if (!newest || isAiPending(newest)) return null
  if (newest.status.toLowerCase() === 'rejected' || newest.aiStatus === 'Failed') return null
  return newest.aiSuspicionReasons?.[0] ?? null
}
