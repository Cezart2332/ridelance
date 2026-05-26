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

export function documentStatusColors(status: string): { color: string; bg: string } {
  switch (normalizeDocumentStatus(status)) {
    case 'verified':
      return { color: '#2e7d32', bg: alpha('#2e7d32', 0.1) }
    case 'rejected':
      return { color: '#d32f2f', bg: alpha('#d32f2f', 0.1) }
    default:
      return { color: '#b54708', bg: alpha('#ed6c02', 0.1) }
  }
}
