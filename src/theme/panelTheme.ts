import { createTheme, type Theme } from '@mui/material/styles'

import { fontStack } from './fontStack'

/**
 * Tema panourilor de lucru (Admin și Contabil), în stilul shadcn/ui: paleta zinc, borduri de 1px în
 * loc de umbre, densitate mare. Întunecată implicit, cu varianta deschisă la un clic.
 *
 * Culorile stau o singură dată aici. Componentele le citesc din tema MUI (`text.secondary`,
 * `divider`) sau, unde au nevoie de un ton anume, din variabilele CSS `--rl-*` puse de
 * `PanelThemeProvider` pe `:root` cât timp panoul e deschis.
 */
export type PanelMode = 'dark' | 'light'

export interface PanelTokens {
  bg: string
  sidebar: string
  card: string
  cardAlt: string
  input: string
  hover: string
  muted: string
  border: string
  borderStrong: string
  fg: string
  fgSoft: string
  textMuted: string
  textSubtle: string
  primary: string
  primaryFg: string
  primaryHover: string
  ring: string
  brand: string
  green: Tone
  yellow: Tone
  red: Tone
  blue: Tone
  gray: Tone
}

export interface Tone {
  bg: string
  border: string
  text: string
  dot: string
}

export const PANEL_TOKENS: Record<PanelMode, PanelTokens> = {
  dark: {
    bg: '#09090b',
    sidebar: '#0b0b0d',
    card: '#161618',
    cardAlt: '#111113',
    input: '#202023',
    hover: '#1c1c1f',
    muted: '#27272a',
    border: '#27272a',
    borderStrong: '#3f3f46',
    fg: '#fafafa',
    fgSoft: '#e4e4e7',
    textMuted: '#a1a1aa',
    textSubtle: '#71717a',
    primary: '#fafafa',
    primaryFg: '#09090b',
    primaryHover: '#e4e4e7',
    ring: '#71717a',
    brand: '#5CCBF5',
    green: { bg: 'rgba(34,197,94,0.09)', border: '#15803d', text: '#4ade80', dot: '#22c55e' },
    yellow: { bg: 'rgba(245,158,11,0.08)', border: '#78350f', text: '#fbbf24', dot: '#f59e0b' },
    red: { bg: 'rgba(239,68,68,0.09)', border: '#7f1d1d', text: '#f87171', dot: '#ef4444' },
    blue: { bg: 'rgba(92,203,245,0.08)', border: '#155e75', text: '#7dd3fc', dot: '#5CCBF5' },
    gray: { bg: '#18181b', border: '#3f3f46', text: '#a1a1aa', dot: '#71717a' },
  },
  light: {
    bg: '#fafafa',
    sidebar: '#f4f4f5',
    card: '#ffffff',
    cardAlt: '#fafafa',
    input: '#ffffff',
    hover: '#f4f4f5',
    muted: '#f4f4f5',
    border: '#e4e4e7',
    borderStrong: '#d4d4d8',
    fg: '#09090b',
    fgSoft: '#27272a',
    textMuted: '#71717a',
    textSubtle: '#71717a',
    primary: '#18181b',
    primaryFg: '#fafafa',
    primaryHover: '#27272a',
    ring: '#a1a1aa',
    brand: '#5CCBF5',
    green: { bg: '#f0fdf4', border: '#bbf7d0', text: '#15803d', dot: '#16a34a' },
    yellow: { bg: '#fefce8', border: '#fef08a', text: '#a16207', dot: '#eab308' },
    red: { bg: '#fef2f2', border: '#fecaca', text: '#b91c1c', dot: '#dc2626' },
    blue: { bg: '#f0f9ff', border: '#bae6fd', text: '#0369a1', dot: '#0ea5e9' },
    gray: { bg: '#f4f4f5', border: '#e4e4e7', text: '#52525b', dot: '#a1a1aa' },
  },
}

/** Numele variabilelor CSS, ca `var(--rl-fg)`, pentru culorile citite din `sx` și din stiluri. */
export const PANEL_VARS = {
  bg: 'var(--rl-bg)',
  sidebar: 'var(--rl-sidebar)',
  card: 'var(--rl-card)',
  cardAlt: 'var(--rl-card-alt)',
  input: 'var(--rl-input)',
  hover: 'var(--rl-hover)',
  muted: 'var(--rl-muted)',
  border: 'var(--rl-border)',
  borderStrong: 'var(--rl-border-strong)',
  fg: 'var(--rl-fg)',
  fgSoft: 'var(--rl-fg-soft)',
  textMuted: 'var(--rl-text-muted)',
  textSubtle: 'var(--rl-text-subtle)',
  primary: 'var(--rl-primary)',
  primaryFg: 'var(--rl-primary-fg)',
  brand: 'var(--rl-brand)',
} as const

const kebab = (key: string) => key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)

/** Variabilele `--rl-*` ale unui mod: culorile de bază și cele cinci tonuri (`--rl-green-text` …). */
export function panelCssVars(mode: PanelMode): Record<string, string> {
  const tokens = PANEL_TOKENS[mode]
  const vars: Record<string, string> = {}
  for (const [key, value] of Object.entries(tokens)) {
    if (typeof value === 'string') {
      vars[`--rl-${kebab(key)}`] = value
    } else {
      for (const [part, color] of Object.entries(value as Tone)) vars[`--rl-${key}-${part}`] = color
    }
  }
  // Panoul nu folosește umbre: bordurile despart suprafețele (`PANEL_COMPAT_TOKENS.shadow`).
  vars['--rl-shadow'] = 'none'
  vars['--rl-input-radius'] = '7px'
  return vars
}

export function createPanelTheme(mode: PanelMode): Theme {
  const t = PANEL_TOKENS[mode]
  const base = createTheme({ palette: { mode } })
  const shadows = [...base.shadows] as Theme['shadows']
  for (let level = 1; level < shadows.length; level++) shadows[level] = 'none'
  const floating = mode === 'dark' ? '0 14px 30px rgba(0,0,0,0.45)' : '0 10px 30px rgba(9,9,11,0.10)'
  shadows[8] = floating
  shadows[16] = floating
  shadows[24] = floating

  return createTheme({
    palette: {
      mode,
      primary: { main: t.primary, dark: t.primaryHover, light: t.muted, contrastText: t.primaryFg },
      secondary: { main: t.brand, contrastText: '#09090b' },
      background: { default: t.bg, paper: t.card },
      text: { primary: t.fg, secondary: t.textMuted, disabled: t.textSubtle },
      divider: t.border,
      action: {
        hover: t.hover,
        selected: t.muted,
        disabledBackground: t.muted,
        disabled: t.textSubtle,
        focus: t.muted,
      },
      grey: {
        50: t.cardAlt,
        100: t.muted,
        200: t.border,
        300: t.borderStrong,
        500: t.textMuted,
        700: t.fgSoft,
        900: t.fg,
      },
      success: { main: t.green.text, light: t.green.bg, dark: t.green.border, contrastText: t.fg },
      warning: { main: t.yellow.text, light: t.yellow.bg, dark: t.yellow.border, contrastText: t.fg },
      error: { main: t.red.text, light: t.red.bg, dark: t.red.border, contrastText: t.fg },
      info: { main: t.blue.text, light: t.blue.bg, dark: t.blue.border, contrastText: t.fg },
    },
    shadows,
    shape: { borderRadius: 8 },
    typography: {
      fontFamily: fontStack,
      h1: { fontSize: 22, fontWeight: 650, lineHeight: 1.25, letterSpacing: '-0.025em' },
      h2: { fontSize: 15, fontWeight: 600, lineHeight: 1.4, letterSpacing: '-0.01em' },
      h3: { fontSize: 20, fontWeight: 650, lineHeight: 1.3, letterSpacing: '-0.025em' },
      h4: { fontSize: 22, fontWeight: 650, lineHeight: 1.3, letterSpacing: '-0.025em' },
      h5: { fontSize: 18, fontWeight: 650, lineHeight: 1.35 },
      h6: { fontSize: 15, fontWeight: 600, lineHeight: 1.4 },
      subtitle1: { fontSize: 14, fontWeight: 600 },
      subtitle2: { fontSize: 13, fontWeight: 600, lineHeight: 1.4 },
      body1: { fontSize: 14, lineHeight: 1.6 },
      body2: { fontSize: 13, lineHeight: 1.55 },
      caption: { fontSize: 12, lineHeight: 1.5 },
      button: { fontSize: 13, fontWeight: 600, textTransform: 'none', letterSpacing: 0 },
    },
    components: {
      MuiButtonBase: {
        styleOverrides: { root: { '&.Mui-focusVisible': { outline: `2px solid ${t.ring}`, outlineOffset: 2 } } },
      },
      MuiCssBaseline: { styleOverrides: { body: { backgroundColor: t.bg, color: t.fg, colorScheme: mode } } },
      MuiPaper: {
        defaultProps: { elevation: 0, variant: 'outlined' },
        styleOverrides: { root: { backgroundImage: 'none', backgroundColor: t.card, borderColor: t.border, borderRadius: 10 } },
      },
      MuiCard: { defaultProps: { elevation: 0, variant: 'outlined' } },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: {
            borderRadius: 7,
            minHeight: 34,
            paddingInline: 12,
            paddingBlock: 6,
            fontSize: 13,
            transition: 'background-color 150ms, border-color 150ms, color 150ms',
            '&.Mui-focusVisible': { boxShadow: `0 0 0 2px ${t.bg}, 0 0 0 4px ${t.ring}` },
          },
          sizeSmall: { minHeight: 30, paddingInline: 10, fontSize: 12 },
          sizeLarge: { minHeight: 40, paddingInline: 16, fontSize: 14 },
          contained: {
            '&.MuiButton-colorPrimary': { backgroundColor: t.primary, color: t.primaryFg, '&:hover': { backgroundColor: t.primaryHover } },
            '&.MuiButton-colorError': { backgroundColor: t.red.dot, color: '#fff', '&:hover': { backgroundColor: t.red.border } },
          },
          outlined: {
            borderColor: t.borderStrong,
            color: t.fg,
            backgroundColor: t.input,
            '&:hover': { backgroundColor: t.muted, borderColor: t.borderStrong },
            '&.MuiButton-colorError': { color: t.red.text, borderColor: t.red.border },
          },
          text: { color: t.fg, '&:hover': { backgroundColor: t.muted }, '&.MuiButton-colorError': { color: t.red.text } },
        },
      },
      MuiIconButton: {
        styleOverrides: { root: { borderRadius: 7, color: t.fgSoft, '&:hover': { backgroundColor: t.muted } } },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            backgroundColor: t.input,
            borderRadius: 7,
            fontSize: 13,
            '& .MuiOutlinedInput-notchedOutline': { borderColor: t.borderStrong },
            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: t.ring },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: t.ring, borderWidth: 1, boxShadow: `0 0 0 1px ${t.ring}` },
          },
          input: { '&::placeholder': { color: t.textSubtle, opacity: 1 } },
        },
      },
      MuiInputLabel: { styleOverrides: { root: { fontSize: 13, color: t.textMuted, '&.Mui-focused': { color: t.fg } } } },
      MuiTextField: { defaultProps: { size: 'small' } },
      MuiSelect: { defaultProps: { size: 'small' } },
      MuiFormHelperText: { styleOverrides: { root: { fontSize: 12, marginInline: 0 } } },
      MuiTableContainer: { styleOverrides: { root: { backgroundColor: t.card } } },
      MuiTableCell: {
        styleOverrides: {
          root: { borderColor: t.border, padding: '10px 12px', fontSize: 13, color: t.fgSoft, fontVariantNumeric: 'tabular-nums' },
          head: { backgroundColor: t.card, color: t.textMuted, fontWeight: 600, fontSize: 12, whiteSpace: 'nowrap', height: 40, paddingBlock: 0 },
        },
      },
      MuiTableRow: {
        styleOverrides: { root: { '&:last-child td': { borderBottom: 0 }, '&.MuiTableRow-hover:hover': { backgroundColor: t.hover } } },
      },
      MuiTablePagination: { styleOverrides: { root: { color: t.textMuted, fontSize: 12 } } },
      MuiChip: {
        styleOverrides: {
          root: { borderRadius: 999, height: 22, fontSize: 11, fontWeight: 600, border: `1px solid ${t.borderStrong}`, backgroundColor: t.input, color: t.fgSoft },
          label: { paddingInline: 8 },
          colorSuccess: { backgroundColor: t.green.bg, borderColor: t.green.border, color: t.green.text },
          colorWarning: { backgroundColor: t.yellow.bg, borderColor: t.yellow.border, color: t.yellow.text },
          colorError: { backgroundColor: t.red.bg, borderColor: t.red.border, color: t.red.text },
          colorInfo: { backgroundColor: t.blue.bg, borderColor: t.blue.border, color: t.blue.text },
          colorPrimary: { backgroundColor: t.muted, borderColor: t.borderStrong, color: t.fg },
          outlined: { backgroundColor: 'transparent' },
        },
      },
      MuiTabs: {
        styleOverrides: {
          root: { minHeight: 36 },
          indicator: { height: 2, backgroundColor: t.fg },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: { minHeight: 36, padding: '0 12px', fontSize: 13, fontWeight: 600, color: t.textMuted, textTransform: 'none', '&.Mui-selected': { color: t.fg } },
        },
      },
      MuiDialog: {
        defaultProps: { slotProps: { paper: { elevation: 16, variant: 'elevation' } } },
        styleOverrides: { paper: { backgroundColor: t.cardAlt, border: `1px solid ${t.border}`, borderRadius: 12 } },
      },
      MuiDialogTitle: { styleOverrides: { root: { fontWeight: 650, fontSize: 16, padding: '18px 20px 10px' } } },
      MuiDialogContent: { styleOverrides: { root: { padding: '8px 20px' } } },
      MuiDialogActions: { styleOverrides: { root: { padding: '12px 20px 18px', gap: 8 } } },
      MuiBackdrop: { styleOverrides: { root: { '&:not(.MuiBackdrop-invisible)': { backgroundColor: 'rgba(0,0,0,0.6)' } } } },
      MuiDrawer: {
        defaultProps: { slotProps: { paper: { elevation: 16, variant: 'elevation' } } },
        styleOverrides: { paper: { backgroundColor: t.cardAlt, borderColor: t.border, borderRadius: 0 } },
      },
      MuiMenu: {
        defaultProps: { slotProps: { paper: { elevation: 8, variant: 'elevation' } } },
        styleOverrides: { paper: { backgroundColor: t.card, border: `1px solid ${t.borderStrong}`, borderRadius: 8 }, list: { padding: 4 } },
      },
      MuiPopover: {
        defaultProps: { slotProps: { paper: { elevation: 8, variant: 'elevation' } } },
        styleOverrides: { paper: { backgroundColor: t.card, border: `1px solid ${t.borderStrong}`, borderRadius: 8 } },
      },
      MuiAutocomplete: {
        styleOverrides: { paper: { backgroundColor: t.card, border: `1px solid ${t.borderStrong}` }, option: { fontSize: 13 } },
      },
      MuiMenuItem: {
        styleOverrides: { root: { fontSize: 13, borderRadius: 6, minHeight: 34, '&:hover': { backgroundColor: t.muted }, '&.Mui-selected': { backgroundColor: t.muted } } },
      },
      MuiListItemButton: { styleOverrides: { root: { borderRadius: 7 } } },
      MuiAlert: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            fontSize: 13,
            alignItems: 'center',
            border: '1px solid',
            '& .MuiAlert-icon': { color: 'inherit' },
            '&.MuiAlert-colorSuccess': { backgroundColor: t.green.bg, borderColor: t.green.border, color: t.green.text },
            '&.MuiAlert-colorWarning': { backgroundColor: t.yellow.bg, borderColor: t.yellow.border, color: t.yellow.text },
            '&.MuiAlert-colorError': { backgroundColor: t.red.bg, borderColor: t.red.border, color: t.red.text },
            '&.MuiAlert-colorInfo': { backgroundColor: t.cardAlt, borderColor: t.border, color: t.fgSoft },
            '&.MuiAlert-filled': { backgroundColor: t.card },
          },
        },
      },
      MuiTooltip: {
        defaultProps: { arrow: false },
        styleOverrides: { tooltip: { fontSize: 12, fontWeight: 500, backgroundColor: t.primary, color: t.primaryFg, borderRadius: 6 } },
      },
      MuiDivider: { styleOverrides: { root: { borderColor: t.border } } },
      MuiLinearProgress: {
        styleOverrides: { root: { height: 5, borderRadius: 999, backgroundColor: t.muted }, bar: { borderRadius: 999, backgroundColor: t.fgSoft } },
      },
      MuiCheckbox: { styleOverrides: { root: { color: t.borderStrong, '&.Mui-checked': { color: t.fg } } } },
      MuiSwitch: {
        styleOverrides: {
          switchBase: { '&.Mui-checked': { color: t.primaryFg, '& + .MuiSwitch-track': { backgroundColor: t.primary, opacity: 1 } } },
          track: { backgroundColor: t.borderStrong, opacity: 1 },
        },
      },
      MuiAccordion: { styleOverrides: { root: { backgroundColor: t.card, '&:before': { display: 'none' } } } },
      MuiSkeleton: { styleOverrides: { root: { backgroundColor: t.muted } } },
      MuiSnackbarContent: { styleOverrides: { root: { backgroundColor: t.card, color: t.fg, border: `1px solid ${t.borderStrong}` } } },
    },
  })
}
