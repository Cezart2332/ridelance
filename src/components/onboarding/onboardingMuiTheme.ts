import { createTheme } from '@mui/material/styles'

import { fontStack } from '../../theme/fontStack'
import { TOKENS } from './onboardingTheme'

/**
 * Tema fluxului de înrolare.
 *
 * Există ca să nu mai scriem `sx={{ borderRadius: '16px', border: '1px solid ...' }}` în fiecare
 * card: radius-urile, tipografia și stările semantice cerute de spec trăiesc aici, o singură dată.
 *
 * Culorile sunt ale platformei (`TOKENS`), nu albastrul din spec — același raționament ca la
 * `src/theme/adminTheme.ts`: onboardingul e primul ecran al produsului, nu poate arăta ca un
 * produs străin lipit peste RIDElance.
 *
 * Se montează cu un `ThemeProvider` imbricat în `OnboardingShell`, deci dashboardul rămâne neatins.
 */

const base = createTheme()

/**
 * Delimitarea se face prin borduri, nu prin umbre — specul cere „umbră aproape inexistentă" pe
 * card. Anulăm elevațiile joase și păstrăm doar suprafețele care chiar plutesc.
 */
const shadows = [...base.shadows] as typeof base.shadows
for (let level = 1; level <= 7; level++) {
  shadows[level] = 'none'
}
shadows[1] = TOKENS.shadow.sm // cardul central
shadows[8] = TOKENS.shadow.lg // Menu / Popover
shadows[16] = TOKENS.shadow.xl // Dialog / Drawer

export const onboardingMuiTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: TOKENS.primary,
      dark: TOKENS.primaryStrong,
      light: TOKENS.primarySoft,
      contrastText: '#FFFFFF',
    },
    background: { default: TOKENS.surface, paper: TOKENS.paper },
    text: { primary: TOKENS.ink, secondary: TOKENS.textMuted, disabled: TOKENS.textSubtle },
    divider: TOKENS.border,
    success: { main: TOKENS.success, light: 'rgba(46, 125, 50, 0.10)' },
    warning: { main: TOKENS.pending, light: 'rgba(237, 108, 2, 0.12)' },
    error: { main: TOKENS.danger, light: 'rgba(211, 47, 47, 0.10)' },
  },

  shadows,

  // `1` = pixeli exacți, ca în tema globală (`src/main.tsx`): `borderRadius: 12` înseamnă 12px.
  shape: { borderRadius: 1 },

  transitions: {
    duration: {
      shortest: 150,
      shorter: 200,
      short: 200,
      standard: 200,
      complex: 300,
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
    // Scara din spec §9. `h5` e întrebarea de pe card — cel mai mare text din flux.
    h5: { fontSize: 24, fontWeight: 600, lineHeight: 1.3, letterSpacing: '-0.02em' },
    subtitle1: { fontSize: 18, fontWeight: 600, lineHeight: 1.4 },
    subtitle2: { fontSize: 16, fontWeight: 600, lineHeight: 1.4 },
    body1: { fontSize: 15, fontWeight: 450, lineHeight: 1.5 },
    body2: { fontSize: 14, fontWeight: 400, lineHeight: 1.5 },
    caption: { fontSize: 13, fontWeight: 400, lineHeight: 1.5 },
    overline: {
      fontSize: 12,
      fontWeight: 700,
      lineHeight: 1.2,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
    },
    button: { fontSize: 15, fontWeight: 650, textTransform: 'none' },
  },

  components: {
    MuiPaper: {
      styleOverrides: { root: { backgroundImage: 'none' } },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: TOKENS.radius.button,
          transition: `all ${TOKENS.duration} ${TOKENS.easing}`,
          '&:active': { transform: 'scale(0.98)' },
          '&.Mui-focusVisible': { boxShadow: `0 0 0 3px ${TOKENS.primaryEdge}` },
          '&.MuiButton-containedPrimary:hover': { backgroundColor: TOKENS.primaryStrong },
        },
        sizeLarge: { paddingBlock: 10, paddingInline: 24 },
      },
    },
    MuiChip: {
      styleOverrides: { root: { borderRadius: TOKENS.radius.md, fontWeight: 600 } },
    },
    MuiDivider: { styleOverrides: { root: { borderColor: TOKENS.border } } },
    MuiLinearProgress: {
      styleOverrides: {
        root: { borderRadius: TOKENS.radius.full, backgroundColor: TOKENS.primaryTint },
        bar: { borderRadius: TOKENS.radius.full },
      },
    },
    MuiTooltip: {
      defaultProps: { arrow: false },
      styleOverrides: {
        tooltip: {
          fontSize: 12,
          fontWeight: 600,
          backgroundColor: TOKENS.ink,
          borderRadius: TOKENS.radius.md,
          padding: '6px 10px',
        },
      },
    },
    MuiMenu: {
      defaultProps: { slotProps: { paper: { elevation: 8 } } },
      styleOverrides: { paper: { borderRadius: TOKENS.radius.lg } },
    },
    MuiDialog: {
      defaultProps: { slotProps: { paper: { elevation: 16 } } },
      styleOverrides: { paper: { borderRadius: TOKENS.radius.xl } },
    },
    MuiAlert: {
      styleOverrides: { root: { borderRadius: TOKENS.radius.lg, fontSize: 14 } },
    },
  },
})
