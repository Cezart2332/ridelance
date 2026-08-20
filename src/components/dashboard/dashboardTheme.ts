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

  /**
   * Rampa albastră — singura codare cromatică pentru date.
   * O pereche de valori (Bolt/Uber, Numerar/Card) folosește accent + accentSoft.
   * accentSoft e sub 3:1 pe alb, deci suma se scrie mereu lângă swatch.
   */
  accent: '#0E7FA8',
  accentSoft: '#7FC9E3',
  accentWash: 'rgba(14, 127, 168, 0.08)',

  /**
   * Semnale de stare. Nu se folosesc decorativ — doar pe StatusChip
   * și pe mesajele de eroare. „Ok" e albastru, nu verde.
   */
  stateActive: '#0E7FA8',
  stateNeutral: 'rgba(26, 26, 46, 0.6)',
  stateError: '#D32F2F',
  /**
   * Ce **urmează** să fie greșit: un consimțământ care expiră, un termen care se apropie.
   * Aceeași ambră ca `HOME_TOKENS.warn[600]`, ca dashboardul să nu aibă două galbenuri.
   */
  stateWarning: '#B54708',
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

/**
 * Fundalurile avatarelor fără logo încărcat. Spec §3.1 cere un fallback „pe fundal din paletă,
 * derivat determinist din nume", iar tokenii nu aveau o rampă pentru așa ceva.
 *
 * Alese deliberat în familia albastru → violet → ardezie: verdele, ambra și roșul au înțeles de
 * stare în dashboard, iar un avatar roșu ar citi ca o eroare. Toate au contrast ≥ 4.5:1 cu textul
 * alb pe care îl poartă.
 */
export const AVATAR_PALETTE = [
  DASHBOARD_TOKENS.accent,
  '#1D4ED8',
  '#4F46E5',
  '#6D28D9',
  '#9333EA',
  '#334155',
] as const

/** Horizontal scroll for wide tables on small screens */
export const responsiveTableContainerSx: SxProps<Theme> = {
  overflowX: 'auto',
  WebkitOverflowScrolling: 'touch',
  width: '100%',
  maxWidth: '100%',
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
