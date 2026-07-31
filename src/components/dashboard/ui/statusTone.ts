/**
 * Trei tonuri, atât. „Ok" e albastru (nu verde), „în așteptare" e neutru,
 * iar roșul e rezervat exclusiv pentru ce e efectiv greșit.
 */
export type StatusTone = 'active' | 'neutral' | 'error'

export function documentStatusTone(status: string | null | undefined): StatusTone {
  const s = (status ?? '').toLowerCase()
  if (s === 'verified' || s === 'approved') return 'active'
  if (s === 'rejected') return 'error'
  return 'neutral'
}

export function documentStatusText(status: string | null | undefined): string {
  const s = (status ?? '').toLowerCase()
  if (s === 'verified' || s === 'approved') return 'Verificat'
  if (s === 'rejected') return 'Respins'
  return 'În verificare'
}
