import { alpha } from '@mui/material/styles'

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
 * verificat = albastru, respins = roșu, în verificare = neutru.
 */
export function documentStatusColors(status: string): { color: string; bg: string } {
  switch (normalizeDocumentStatus(status)) {
    case 'verified':
      return { color: '#0E7FA8', bg: alpha('#0E7FA8', 0.1) }
    case 'rejected':
      return { color: '#D32F2F', bg: alpha('#D32F2F', 0.1) }
    default:
      return { color: 'rgba(26, 26, 46, 0.6)', bg: alpha('#1a1a2e', 0.06) }
  }
}
