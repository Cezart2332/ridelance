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
      contrastText: TOKENS.ink,
    },
    background: { default: '#F5F7FA', paper: TOKENS.paper },
    text: { primary: TOKENS.ink, secondary: '#626B7A', disabled: '#77808E' },
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
    h1: { fontSize: 28, fontWeight: 700, lineHeight: 1.25, letterSpacing: '-0.035em' },
    h2: { fontSize: 17, fontWeight: 650, lineHeight: 1.4, letterSpacing: '-0.015em' },
    h3: { fontSize: 24, fontWeight: 700, lineHeight: 1.3, letterSpacing: '-0.025em' },
    h4: { fontSize: 28, fontWeight: 700, lineHeight: 1.3, letterSpacing: '-0.035em' },
    h5: { fontSize: 22, fontWeight: 650, lineHeight: 1.35 },
    h6: { fontSize: 17, fontWeight: 650, lineHeight: 1.4 },
    subtitle2: { fontSize: 14, fontWeight: 600, lineHeight: 1.4 },
    body1: { fontSize: 14, fontWeight: 450, lineHeight: 1.65 },
    body2: { fontSize: 13, fontWeight: 450, lineHeight: 1.6 },
    caption: { fontSize: 12, fontWeight: 450, lineHeight: 1.5 },
    // UPPERCASE-ul implicit de pe Button e cel mai vizibil semn de „temă MUI neatinsă".
    button: { fontSize: 14, fontWeight: 650, textTransform: 'none' },
  },

  components: {
    MuiPaper: {
      defaultProps: { elevation: 0, variant: 'outlined' },
      styleOverrides: { root: { backgroundImage: 'none', borderRadius: `${TOKENS.radius.md}px` } },
    },
    MuiCard: { defaultProps: { elevation: 0, variant: 'outlined' } },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: `${TOKENS.radius.md}px`,
          transition: `all ${TOKENS.duration} ${TOKENS.easing}`,
          '&:active': { transform: 'scale(0.98)' },
          '&.Mui-focusVisible': { boxShadow: '0 0 0 3px rgba(92, 203, 245, 0.35)' },
          '&.MuiButton-containedPrimary:hover': { backgroundColor: TOKENS.primaryStrong },
          '&.MuiButton-text.MuiButton-colorPrimary': { color: TOKENS.ink },
          '&.MuiButton-outlined.MuiButton-colorPrimary': { color: TOKENS.ink, borderColor: TOKENS.borderHover },
        },
        sizeMedium: { paddingBlock: 9, paddingInline: 16 },
      },
    },
    MuiTab: {
      styleOverrides: { root: { minHeight: 48, padding: '0 16px', fontSize: 13, fontWeight: 600, textTransform: 'none', '&.Mui-selected': { color: TOKENS.ink } } },
    },
    MuiTabs: { styleOverrides: { root: { minHeight: 48 }, indicator: { height: 3, borderRadius: '3px 3px 0 0' } } },
    MuiTextField: { defaultProps: { size: 'small' } },
    MuiOutlinedInput: { styleOverrides: { root: { backgroundColor: TOKENS.paper, fontSize: 14 } } },
    MuiTableCell: { styleOverrides: {
      root: { borderColor: TOKENS.border, padding: '16px 20px', fontVariantNumeric: 'tabular-nums' },
      head: { backgroundColor: '#F8FAFC', color: '#626B7A', fontWeight: 600, fontSize: 12, whiteSpace: 'nowrap' },
    } },
    MuiTableRow: { styleOverrides: { root: { '&:last-child td': { borderBottom: 0 } } } },
    MuiDialogTitle: { styleOverrides: { root: { fontWeight: 650, fontSize: 20, padding: '24px 24px 16px' } } },
    MuiDialogActions: { styleOverrides: { root: { padding: '16px 24px 24px', gap: 8 } } },
    MuiAlert: { styleOverrides: { root: { borderRadius: 10, alignItems: 'center' } } },
    MuiListItemButton: { styleOverrides: { root: { minHeight: 44 } } },
    MuiChip: {
      styleOverrides: { root: { borderRadius: `${TOKENS.radius.sm}px`, height: 22, fontSize: 12 } },
    },
    MuiTooltip: {
      defaultProps: { arrow: false },
      styleOverrides: {
        tooltip: {
          fontSize: 12,
          fontWeight: 600,
          backgroundColor: TOKENS.ink,
          borderRadius: `${TOKENS.radius.sm}px`,
        },
      },
    },
    MuiDivider: { styleOverrides: { root: { borderColor: TOKENS.border } } },
    MuiLinearProgress: {
      styleOverrides: {
        root: { borderRadius: `${TOKENS.radius.full}px` },
        bar: { borderRadius: `${TOKENS.radius.full}px` },
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
