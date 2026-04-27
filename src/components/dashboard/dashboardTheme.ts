import type { SxProps, Theme } from '@mui/material/styles'
import { alpha } from '@mui/material/styles'

export const DASHBOARD_TOKENS = {
  ink: '#1a1a2e',
  primary: '#5CCBF5',
  primaryStrong: '#45B8E2',
  paper: '#FFFFFF',
  surface: '#FAFAFA',
  surfaceAlt: '#F5F5F7',
  border: 'rgba(0, 0, 0, 0.06)',
  borderHover: 'rgba(0, 0, 0, 0.12)',
  textMuted: 'rgba(26, 26, 46, 0.6)',
  textSubtle: 'rgba(26, 26, 46, 0.4)',
  radius: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    full: 999,
  },
  shadow: {
    sm: '0 4px 14px rgba(16, 24, 40, 0.05)',
    md: '0 10px 28px rgba(16, 24, 40, 0.08)',
    glow: '0 0 0 3px rgba(92, 203, 245, 0.16)',
  },
}

export const dashboardInputSx: SxProps<Theme> = {
  '& .MuiOutlinedInput-root': {
    backgroundColor: DASHBOARD_TOKENS.surface,
    color: DASHBOARD_TOKENS.ink,
    borderRadius: DASHBOARD_TOKENS.radius.md,
    fontWeight: 500,
    '& .MuiOutlinedInput-notchedOutline': { borderColor: DASHBOARD_TOKENS.border },
    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: alpha(DASHBOARD_TOKENS.ink, 0.18),
    },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: DASHBOARD_TOKENS.primary,
      borderWidth: 2,
    },
  },
  '& .MuiInputBase-input::placeholder': {
    color: alpha(DASHBOARD_TOKENS.ink, 0.45),
    opacity: 1,
  },
}
