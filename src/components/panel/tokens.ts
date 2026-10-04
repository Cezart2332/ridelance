import { TOKENS } from '../../constants/tokens'
import { DASHBOARD_TOKENS } from '../dashboard/dashboardTheme'
import type { SxProps, Theme } from '@mui/material/styles'

/**
 * `TOKENS` (și `DASHBOARD_TOKENS`) pentru ecranele care se deschid în panoul Admin/Contabil: aceleași
 * chei, dar fiecare culoare citește variabila `--rl-*` a temei panoului și cade pe valoarea veche
 * în afara lui. Astfel o componentă comună cu zona clientului arată ca înainte acolo și urmează
 * tema (închisă sau deschisă) în panou.
 */
const themed = (name: string, fallback: string) => `var(--rl-${name}, ${fallback})`

export const PANEL_COMPAT_TOKENS = {
  ...TOKENS,
  ink: themed('fg', TOKENS.ink),
  textMain: themed('fg', TOKENS.textMain),
  primary: themed('primary', TOKENS.primary),
  primaryStrong: themed('primary-hover', TOKENS.primaryStrong),
  /** Textul de pe un fundal `primary`. */
  primaryFg: themed('primary-fg', TOKENS.ink),
  paper: themed('card', TOKENS.paper),
  surface: themed('card-alt', TOKENS.surface),
  surfaceAlt: themed('muted', TOKENS.surfaceAlt),
  border: themed('border', TOKENS.border),
  borderHover: themed('border-strong', TOKENS.borderHover),
  textMuted: themed('text-muted', TOKENS.textMuted),
  textSubtle: themed('text-subtle', TOKENS.textSubtle),
  accent: themed('blue-text', DASHBOARD_TOKENS.accent),
  accentWash: themed('blue-bg', DASHBOARD_TOKENS.accentWash),
  stateError: themed('red-text', DASHBOARD_TOKENS.stateError),
  stateActive: themed('blue-text', DASHBOARD_TOKENS.stateActive),
  stateWarning: themed('yellow-text', DASHBOARD_TOKENS.stateWarning),
  shadow: {
    sm: themed('shadow', TOKENS.shadow.sm),
    md: themed('shadow', TOKENS.shadow.md),
    lg: themed('shadow', TOKENS.shadow.lg),
    xl: themed('shadow', TOKENS.shadow.xl),
    glow: themed('shadow', TOKENS.shadow.glow),
  },
}

export const PANEL_COMPAT_DASHBOARD_TOKENS = {
  ...DASHBOARD_TOKENS,
  ink: PANEL_COMPAT_TOKENS.ink,
  primary: PANEL_COMPAT_TOKENS.primary,
  primaryStrong: PANEL_COMPAT_TOKENS.primaryStrong,
  primaryFg: PANEL_COMPAT_TOKENS.primaryFg,
  paper: PANEL_COMPAT_TOKENS.paper,
  surface: PANEL_COMPAT_TOKENS.surface,
  surfaceAlt: PANEL_COMPAT_TOKENS.surfaceAlt,
  border: PANEL_COMPAT_TOKENS.border,
  borderHover: PANEL_COMPAT_TOKENS.borderHover,
  textMuted: PANEL_COMPAT_TOKENS.textMuted,
  textSubtle: PANEL_COMPAT_TOKENS.textSubtle,
  accent: PANEL_COMPAT_TOKENS.accent,
  accentWash: PANEL_COMPAT_TOKENS.accentWash,
  stateError: PANEL_COMPAT_TOKENS.stateError,
  stateActive: PANEL_COMPAT_TOKENS.stateActive,
  stateWarning: PANEL_COMPAT_TOKENS.stateWarning,
  shadow: { ...DASHBOARD_TOKENS.shadow, ...PANEL_COMPAT_TOKENS.shadow },
}

/**
 * `alpha()` pentru culori date ca variabile CSS (MUI `alpha` acceptă doar culori concrete). Doar
 * pentru ecranele panoului: `color-mix` cere un browser recent.
 */
export function fade(color: string, amount: number): string {
  return `color-mix(in srgb, ${color} ${Math.round(amount * 1000) / 10}%, transparent)`
}

/** Câmpuri comune cu zona clientului, care urmează tema când sunt deschise de staff. */
export const panelCompatInputSx: SxProps<Theme> = {
  '& .MuiOutlinedInput-root': {
    backgroundColor: PANEL_COMPAT_DASHBOARD_TOKENS.surface,
    color: PANEL_COMPAT_DASHBOARD_TOKENS.ink,
    borderRadius: `var(--rl-input-radius, ${DASHBOARD_TOKENS.radius.md}px)`,
    fontWeight: 500,
    '& .MuiOutlinedInput-notchedOutline': { borderColor: PANEL_COMPAT_DASHBOARD_TOKENS.border },
    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: fade(PANEL_COMPAT_DASHBOARD_TOKENS.ink, 0.18) },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: PANEL_COMPAT_DASHBOARD_TOKENS.primary, borderWidth: 2 },
  },
  '& .MuiInputBase-input::placeholder': { color: fade(PANEL_COMPAT_DASHBOARD_TOKENS.ink, 0.45), opacity: 1 },
}
