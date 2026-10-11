import { alpha } from '@mui/material/styles'

import { DASHBOARD_TOKENS as T } from '../components/dashboard/dashboardTheme'

export function normalizeDocumentStatus(status: string): 'pending' | 'verified' | 'rejected' {
  const s = status.toLowerCase()
  if (s === 'verified' || s === 'approved') return 'verified'
  if (s === 'rejected') return 'rejected'
  return 'pending'
}

export function documentStatusLabel(status: string): string {
  switch (normalizeDocumentStatus(status)) {
    case 'verified':
      return 'Verificat'
    case 'rejected':
      return 'Respins'
    default:
      return 'În verificare'
  }
}

/**
 * Aceleași trei tonuri ca `StatusChip` din dashboard (alb/albastru + un singur roșu):
 * verificat = albastru, respins = roșu, în verificare = neutru. Din tokenii pielii, ca statusul să
 * se citească și în tema închisă (în cea implicită sunt exact valorile de dinainte).
 */
export function documentStatusColors(status: string): { color: string; bg: string } {
  switch (normalizeDocumentStatus(status)) {
    case 'verified':
      return { color: T.stateActive, bg: alpha(T.stateActive, 0.1) }
    case 'rejected':
      return { color: T.stateError, bg: alpha(T.stateError, 0.1) }
    default:
      return { color: T.stateNeutral, bg: alpha(T.ink, 0.06) }
  }
}
