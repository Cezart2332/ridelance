import type { SxProps, Theme } from '@mui/material/styles'
import { alpha } from '@mui/material/styles'

import { TOKENS as GLOBAL } from '../../constants/tokens'
import { ACTIVE_SKIN, type DashboardSkin } from './dashboardSkin'

const DEFAULT_TOKENS = {
  ink: '#1a1a2e',
  primary: '#5CCBF5',
  primaryStrong: '#45B8E2',
  paper: GLOBAL.paper,
  // Fundalul vine din tokenii globali, nu scris a doua oară: dashboardul și site-ul public
  // trebuie să aibă exact aceeași tentă, altfel trecerea dintre ele se vede.
  surface: GLOBAL.surface,
  surfaceAlt: GLOBAL.surfaceAlt,
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
  /** Textul de pe un fundal plin `primary` sau `accent`. */
  onPrimary: '#FFFFFF',
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
 * Dashboardul SRL, deschis: același alb cu albastru, în structura panoului de lucru (shadcn/ui).
 * Suprafețele se despart prin borduri de 1px, nu prin umbre, iar colțurile sunt mici.
 */
const SRL_LIGHT_TOKENS: typeof DEFAULT_TOKENS = {
  ...DEFAULT_TOKENS,
  paper: '#FFFFFF',
  surface: '#F8FAFC',
  surfaceAlt: '#F1F5F9',
  border: '#E2E8F0',
  borderHover: '#CBD5E1',
  textMuted: '#64748B',
  textSubtle: '#94A3B8',
  stateNeutral: '#64748B',
  radius: { xs: 4, sm: 6, md: 8, lg: 10, xl: 12, full: 999 },
  shadow: {
    sm: 'none',
    md: 'none',
    glow: '0 0 0 3px rgba(92, 203, 245, 0.2)',
  },
}

/**
 * Dashboardul SRL, închis: negru cu același albastru. Aceeași structură ca varianta deschisă;
 * se schimbă doar culorile. Albastrul de accent e cel de brand (pe negru, cel închis din varianta
 * deschisă nu s-ar citi), iar textul de pe butoanele pline e închis, nu alb.
 */
const SRL_DARK_TOKENS: typeof DEFAULT_TOKENS = {
  ...SRL_LIGHT_TOKENS,
  ink: '#FAFAFA',
  primary: '#5CCBF5',
  primaryStrong: '#8ADAF8',
  paper: '#131316',
  surface: '#09090B',
  surfaceAlt: '#1C1C1F',
  border: '#27272A',
  borderHover: '#3F3F46',
  textMuted: '#A1A1AA',
  textSubtle: '#71717A',
  accent: '#5CCBF5',
  accentSoft: '#1E6F8C',
  accentWash: 'rgba(92, 203, 245, 0.12)',
  stateActive: '#5CCBF5',
  stateNeutral: '#A1A1AA',
  stateError: '#F87171',
  stateWarning: '#FBBF24',
  onPrimary: '#06202B',
  shadow: {
    sm: 'none',
    md: 'none',
    glow: '0 0 0 3px rgba(92, 203, 245, 0.28)',
  },
}

const SKINS: Record<DashboardSkin, typeof DEFAULT_TOKENS> = {
  default: DEFAULT_TOKENS,
  'srl-light': SRL_LIGHT_TOKENS,
  'srl-dark': SRL_DARK_TOKENS,
}

/** Tokenii dashboardului, în pielea cu care s-a încărcat pagina (vezi `dashboardSkin`). */
export const DASHBOARD_TOKENS = SKINS[ACTIVE_SKIN]

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
    borderRadius: `${DASHBOARD_TOKENS.radius.md}px`,
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
