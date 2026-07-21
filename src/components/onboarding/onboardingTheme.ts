import { alpha } from '@mui/material/styles'
import type { OnboardingSectionStatus } from '../../services/onboarding.service'

/** Tokens partajate de paginile de onboarding (extrase din fostul RegisterPfaPage). */
export const TOKENS = {
  ink: '#1a1a2e',
  primary: '#5CCBF5',
  primaryStrong: '#45B8E2',
  paper: '#FFFFFF',
  surface: '#F8F9FC',
  border: 'rgba(0, 0, 0, 0.06)',
  borderHover: 'rgba(0, 0, 0, 0.12)',
  textMuted: 'rgba(26, 26, 46, 0.55)',
  radius: { md: 8, lg: 12, xl: 16, full: 9999 },
  shadow: {
    sm: '0 1px 2px rgba(0,0,0,0.04)',
    md: '0 2px 8px rgba(0,0,0,0.06)',
    glow: '0 2px 8px rgba(92,203,245,0.12)',
  },
}

export const inputSx = {
  '& .MuiOutlinedInput-root': {
    backgroundColor: '#fff',
    color: TOKENS.ink,
    borderRadius: TOKENS.radius.md,
    fontWeight: 500,
    '& .MuiOutlinedInput-notchedOutline': { borderColor: TOKENS.border },
    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: alpha(TOKENS.ink, 0.18),
    },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: TOKENS.primary,
      borderWidth: 2,
    },
  },
  '& .MuiInputBase-input::placeholder': {
    color: alpha(TOKENS.ink, 0.45),
    opacity: 1,
  },
}

export function sectionStatusLabel(status: OnboardingSectionStatus): string {
  switch (status) {
    case 'Locked': return 'Blocat'
    case 'InProgress': return 'În completare'
    case 'AwaitingValidation': return 'În validare'
    case 'Validated': return 'Validat'
    case 'Rejected': return 'Respins'
    default: return status
  }
}

export function sectionStatusChipSx(status: OnboardingSectionStatus) {
  switch (status) {
    case 'Validated':
      return { borderColor: alpha('#2e7d32', 0.2), color: '#2e7d32', backgroundColor: alpha('#2e7d32', 0.08) }
    case 'AwaitingValidation':
      return { borderColor: alpha('#ed6c02', 0.2), color: '#b54708', backgroundColor: alpha('#ed6c02', 0.1) }
    case 'Rejected':
      return { borderColor: alpha('#d32f2f', 0.2), color: '#b71c1c', backgroundColor: alpha('#d32f2f', 0.08) }
    case 'InProgress':
      return { borderColor: alpha(TOKENS.primary, 0.35), color: TOKENS.primaryStrong, backgroundColor: alpha(TOKENS.primary, 0.1) }
    default:
      return { borderColor: TOKENS.border, color: TOKENS.textMuted, backgroundColor: alpha(TOKENS.ink, 0.04) }
  }
}
