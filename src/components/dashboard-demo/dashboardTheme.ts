import type { SxProps, Theme } from '@mui/material/styles'
import { alpha } from '@mui/material/styles'

export const DASHBOARD_TOKENS = {
  ink: '#152447',
  primary: '#1A64ED',
  primaryStrong: '#0E47BC',
  paper: '#FFFFFF',
  surface: '#F7FAFF',
  surfaceAlt: '#EDF3FF',
  border: 'rgba(21, 36, 71, 0.08)',
  borderHover: 'rgba(21, 36, 71, 0.15)',
  textMuted: 'rgba(21, 36, 71, 0.65)',
  textSubtle: 'rgba(21, 36, 71, 0.45)',
  radius: {
    md: 6,
    lg: 8,
    xl: 10,
    full: 999,
  },
  shadow: {
    sm: '0 1px 3px rgba(21,36,71,0.04), 0 1px 2px rgba(21,36,71,0.03)',
    md: '0 4px 20px rgba(21,36,71,0.06), 0 1px 3px rgba(21,36,71,0.04)',
    glow: '0 8px 32px rgba(26,100,237,0.18)',
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
