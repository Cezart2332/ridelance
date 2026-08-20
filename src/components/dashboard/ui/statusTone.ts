/**
 * Patru tonuri. „Ok" e albastru (nu verde), „în așteptare" e neutru, iar roșul e rezervat
 * exclusiv pentru ce e efectiv greșit.
 *
 * `warning` s-a adăugat pentru stările care nu sunt încă o eroare, dar devin una dacă nu faci
 * nimic — un consimțământ bancar care expiră în șase zile (spec §3.4). Fără el, „expiră curând"
 * și „neconectat" ajungeau același chip gri, adică două din cele patru stări cerute arătau la fel.
 */
export type StatusTone = 'active' | 'neutral' | 'warning' | 'error'

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
