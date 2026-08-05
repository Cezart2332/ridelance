import { createTheme } from '@mui/material/styles'

/**
 * Tema zonei de admin.
 *
 * Trăiește separat de tema produsului (`src/main.tsx`), care e construită pe brandul RIDElance
 * și pe care o consumă site-ul public, onboardingul și dashboardurile de client. Aici avem
 * nevoie de altceva: o suprafață acromatică, densă, în care singurul accent marchează acțiunea
 * primară — o unealtă de operator, nu o pagină de produs.
 *
 * Se montează cu un `ThemeProvider` imbricat peste rutele de admin, deci restul aplicației
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
shadows[8] = '0 4px 16px rgba(24,24,27,0.08)' // Menu / Popover
shadows[16] = '0 12px 32px rgba(24,24,27,0.12)' // Dialog / Drawer

const DIVIDER = '#E7E7E9'

export const adminTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#2563EB', dark: '#1D4ED8', light: '#EFF6FF', contrastText: '#FFFFFF' },
    background: { default: '#FAFAFA', paper: '#FFFFFF' },
    text: { primary: '#18181B', secondary: '#52525B', disabled: '#A1A1AA' },
    divider: DIVIDER,
    grey: {
      50: '#FAFAFA',
      100: '#F4F4F5',
      200: '#E4E4E7',
      300: '#D4D4D8',
      500: '#71717A',
      700: '#3F3F46',
      900: '#18181B',
    },
    // Exclusiv pentru StatusBadge și textul acțiunilor distructive. Niciodată pe un buton
    // `contained`, niciodată ca fundal de iconiță.
    success: { main: '#15803D', light: '#F0FDF4', dark: '#BBF7D0' },
    warning: { main: '#A16207', light: '#FEFCE8', dark: '#FEF08A' },
    error: { main: '#B91C1C', light: '#FEF2F2', dark: '#FECACA' },
  },

  shadows,

  shape: { borderRadius: 8 },

  typography: {
    fontFamily: '"Inter", system-ui, sans-serif',
    h1: { fontSize: 24, fontWeight: 600, lineHeight: 1.3, letterSpacing: '-0.01em' },
    h2: { fontSize: 16, fontWeight: 600, lineHeight: 1.4 },
    subtitle2: { fontSize: 14, fontWeight: 500, lineHeight: 1.4 },
    body1: { fontSize: 14, fontWeight: 400, lineHeight: 1.5 },
    body2: { fontSize: 13, fontWeight: 400, lineHeight: 1.5 },
    caption: { fontSize: 13, fontWeight: 400, lineHeight: 1.4 },
    // UPPERCASE-ul implicit de pe Button e cel mai vizibil semn de „temă MUI neatinsă".
    button: { fontSize: 14, fontWeight: 500, textTransform: 'none' },
  },

  components: {
    MuiPaper: {
      defaultProps: { elevation: 0, variant: 'outlined' },
      styleOverrides: { root: { backgroundImage: 'none' } },
    },
    MuiCard: { defaultProps: { elevation: 0, variant: 'outlined' } },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: { sizeMedium: { paddingBlock: 6, paddingInline: 12 } },
    },
    MuiTab: { styleOverrides: { root: { minHeight: 44, padding: '0 12px', fontSize: 14 } } },
    MuiTabs: { styleOverrides: { indicator: { height: 2 } } },
    MuiListItemButton: { styleOverrides: { root: { minHeight: 44 } } },
    MuiChip: { styleOverrides: { root: { borderRadius: 6, height: 22, fontSize: 12 } } },
    MuiTooltip: { defaultProps: { arrow: false }, styleOverrides: { tooltip: { fontSize: 12 } } },
    MuiDivider: { styleOverrides: { root: { borderColor: DIVIDER } } },

    // `MuiPaper.defaultProps` de mai sus le-ar lăsa plate și fără umbră: sunt tot Paper.
    // Le readucem la suprafețe care plutesc, punctual.
    MuiMenu: { defaultProps: { slotProps: { paper: { elevation: 8, variant: 'elevation' } } } },
    MuiPopover: { defaultProps: { slotProps: { paper: { elevation: 8, variant: 'elevation' } } } },
    MuiDialog: { defaultProps: { slotProps: { paper: { elevation: 16, variant: 'elevation' } } } },
    MuiDrawer: { defaultProps: { slotProps: { paper: { elevation: 16, variant: 'elevation' } } } },
  },
})
