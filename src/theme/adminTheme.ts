import { createTheme } from '@mui/material/styles'

import { TOKENS } from '../constants/tokens'
import { fontStack } from './fontStack'

/**
 * Tema zonei de admin.
 *
 * Diferă de tema produsului (`src/main.tsx`) doar prin **densitate și ierarhie**: tipografie mai
 * mică și mai strânsă, umbre scoase în favoarea bordurilor, suprafețe plate. Fontul și culorile
 * sunt ale platformei — vin din `TOKENS` și din `fontStack`, exact ca în restul aplicației, ca
 * adminul să nu arate ca un produs străin lipit peste RIDElance.
 *
 * Se montează cu un `ThemeProvider` imbricat peste ecranele de admin, deci restul aplicației
 * rămâne neatins.
 *
 * Regula: nicio culoare hardcodată în componentele de admin. Tot ce e culoare vine de aici.
 */

const base = createTheme()

/**
 * MUI pune umbre pe aproape orice suprafață. Le anulăm pe cele joase — detașarea se face cu
 * `border: 1px solid divider` — și le păstrăm doar pe cele care chiar plutesc deasupra paginii.
 */
const shadows = [...base.shadows] as typeof base.shadows
for (let level = 1; level <= 7; level++) {
  shadows[level] = 'none'
}
shadows[8] = TOKENS.shadow.lg // Menu / Popover
shadows[16] = TOKENS.shadow.xl // Dialog / Drawer

export const adminTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: TOKENS.primary,
      dark: TOKENS.primaryStrong,
      light: 'rgba(92, 203, 245, 0.10)',
      contrastText: '#FFFFFF',
    },
    background: { default: TOKENS.surface, paper: TOKENS.paper },
    text: { primary: TOKENS.ink, secondary: TOKENS.textMuted, disabled: TOKENS.textSubtle },
    divider: TOKENS.border,
    // Scara neutră a platformei: aceleași suprafețe (`surfaceAlt`) și aceleași borduri
    // translucide, ca fundalurile discrete să se așeze peste orice, nu doar peste alb.
    grey: {
      50: TOKENS.surface,
      100: TOKENS.surfaceAlt,
      200: TOKENS.borderHover,
      300: 'rgba(26, 26, 46, 0.20)',
      500: TOKENS.textMuted,
      700: 'rgba(26, 26, 46, 0.75)',
      900: TOKENS.ink,
    },
    // Exclusiv pentru StatusBadge și textul acțiunilor distructive. Niciodată pe un buton
    // `contained`, niciodată ca fundal de iconiță.
    success: { main: '#15803D', light: '#F0FDF4', dark: '#BBF7D0' },
    warning: { main: '#A16207', light: '#FEFCE8', dark: '#FEF08A' },
    error: { main: '#B91C1C', light: '#FEF2F2', dark: '#FECACA' },
  },

  shadows,

  shape: { borderRadius: TOKENS.radius.md },

  transitions: {
    duration: {
      shortest: 200,
      shorter: 200,
      short: 200,
      standard: 200,
      complex: 200,
      enteringScreen: 200,
      leavingScreen: 200,
    },
    easing: {
      easeInOut: TOKENS.easing,
      easeOut: TOKENS.easing,
      easeIn: 'cubic-bezier(0.32, 0, 0.67, 0)',
      sharp: TOKENS.easing,
    },
  },

  typography: {
    fontFamily: fontStack,
    // Corpurile de text urcă în greutate față de MUI implicit, ca în restul platformei; ce
    // rămâne specific adminului sunt dimensiunile mici și `line-height`-urile strânse.
    h1: { fontSize: 22, fontWeight: 750, lineHeight: 1.25, letterSpacing: '-0.02em' },
    h2: { fontSize: 15, fontWeight: 700, lineHeight: 1.35, letterSpacing: '-0.01em' },
    subtitle2: { fontSize: 14, fontWeight: 600, lineHeight: 1.4 },
    body1: { fontSize: 14, fontWeight: 450, lineHeight: 1.5 },
    body2: { fontSize: 13, fontWeight: 450, lineHeight: 1.5 },
    caption: { fontSize: 13, fontWeight: 450, lineHeight: 1.4 },
    // UPPERCASE-ul implicit de pe Button e cel mai vizibil semn de „temă MUI neatinsă".
    button: { fontSize: 14, fontWeight: 650, textTransform: 'none' },
  },

  components: {
    MuiPaper: {
      defaultProps: { elevation: 0, variant: 'outlined' },
      styleOverrides: { root: { backgroundImage: 'none', borderRadius: TOKENS.radius.lg } },
    },
    MuiCard: { defaultProps: { elevation: 0, variant: 'outlined' } },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: TOKENS.radius.md,
          transition: `all ${TOKENS.duration} ${TOKENS.easing}`,
          '&:active': { transform: 'scale(0.98)' },
          '&.Mui-focusVisible': { boxShadow: '0 0 0 3px rgba(92, 203, 245, 0.35)' },
          '&.MuiButton-containedPrimary:hover': { backgroundColor: TOKENS.primaryStrong },
        },
        sizeMedium: { paddingBlock: 6, paddingInline: 12 },
      },
    },
    MuiTab: {
      styleOverrides: { root: { minHeight: 44, padding: '0 12px', fontSize: 14, fontWeight: 650 } },
    },
    MuiTabs: { styleOverrides: { indicator: { height: 2 } } },
    MuiListItemButton: { styleOverrides: { root: { minHeight: 44 } } },
    MuiChip: {
      styleOverrides: { root: { borderRadius: TOKENS.radius.sm, height: 22, fontSize: 12 } },
    },
    MuiTooltip: {
      defaultProps: { arrow: false },
      styleOverrides: {
        tooltip: {
          fontSize: 12,
          fontWeight: 600,
          backgroundColor: TOKENS.ink,
          borderRadius: TOKENS.radius.sm,
        },
      },
    },
    MuiDivider: { styleOverrides: { root: { borderColor: TOKENS.border } } },
    MuiLinearProgress: {
      styleOverrides: {
        root: { borderRadius: TOKENS.radius.full },
        bar: { borderRadius: TOKENS.radius.full },
      },
    },

    // `MuiPaper.defaultProps` de mai sus le-ar lăsa plate și fără umbră: sunt tot Paper.
    // Le readucem la suprafețe care plutesc, punctual.
    MuiMenu: { defaultProps: { slotProps: { paper: { elevation: 8, variant: 'elevation' } } } },
    MuiPopover: { defaultProps: { slotProps: { paper: { elevation: 8, variant: 'elevation' } } } },
    MuiDialog: { defaultProps: { slotProps: { paper: { elevation: 16, variant: 'elevation' } } } },
    MuiDrawer: { defaultProps: { slotProps: { paper: { elevation: 16, variant: 'elevation' } } } },
  },
})
