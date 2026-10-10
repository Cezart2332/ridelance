import { alpha, createTheme, type Theme } from '@mui/material/styles'

import { DASHBOARD_TOKENS as T } from '../components/dashboard/dashboardTheme'
import { IS_DARK_SKIN } from '../components/dashboard/dashboardSkin'
import { fontStack } from './fontStack'

/**
 * Tema MUI a dashboardurilor PFA și SRL, în stilul panoului de lucru (shadcn/ui): borduri de 1px în loc de
 * umbre, colțuri mici, butoane plate. Culorile vin din `DASHBOARD_TOKENS`, care sunt deja în
 * pielea de panou (deschisă sau închisă) aleasă la încărcarea paginii — deci tema asta doar le duce și
 * la componentele MUI care nu primesc culori prin `sx`: meniuri, dialoguri, câmpuri, tabele.
 */
export function createDashboardPanelTheme(): Theme {
  const overlayShadow = IS_DARK_SKIN ? '0 12px 32px rgba(0, 0, 0, 0.6)' : '0 12px 32px rgba(15, 23, 42, 0.12)'
  const overlayPaper = {
    backgroundColor: T.paper,
    backgroundImage: 'none',
    border: `1px solid ${T.border}`,
    boxShadow: overlayShadow,
  }

  return createTheme({
    palette: {
      mode: IS_DARK_SKIN ? 'dark' : 'light',
      primary: { main: T.primary, dark: T.primaryStrong, contrastText: T.onPrimary },
      // Aceeași convenție ca tema panoului: `light` = fundalul insignei, `dark` = bordura ei.
      // Pe negru, fundalurile pastel ale MUI ar fi pete luminoase sub un text care nu se mai citește.
      ...(IS_DARK_SKIN
        ? {
            success: { main: '#4ADE80', light: '#0B2A17', dark: '#14532D' },
            warning: { main: T.stateWarning, light: '#2D2006', dark: '#713F12' },
            error: { main: T.stateError, light: '#2D1010', dark: '#7F1D1D' },
          }
        : {
            success: { main: '#15803D', light: '#F0FDF4', dark: '#BBF7D0' },
            warning: { main: T.stateWarning, light: '#FFFAEB', dark: '#FEDF89' },
            error: { main: T.stateError, light: '#FEF2F2', dark: '#FECACA' },
          }),
      background: { default: T.surface, paper: T.paper },
      text: { primary: T.ink, secondary: T.textMuted, disabled: T.textSubtle },
      divider: T.border,
      action: {
        hover: alpha(T.ink, 0.05),
        selected: alpha(T.primary, 0.12),
        disabledBackground: alpha(T.ink, 0.08),
        disabled: alpha(T.ink, 0.35),
      },
    },
    typography: {
      fontFamily: fontStack,
      button: { textTransform: 'none', fontWeight: 650 },
    },
    // Ca în tema aplicației: un număr în `borderRadius` înseamnă exact atâția pixeli.
    shape: { borderRadius: 1 },
    components: {
      MuiPaper: {
        // Tema închisă a MUI pune un văl alb peste hârtie, proporțional cu „elevația”.
        styleOverrides: { root: { backgroundImage: 'none' } },
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: { borderRadius: T.radius.md, boxShadow: 'none' },
          outlined: { borderColor: T.border, '&:hover': { borderColor: T.borderHover, backgroundColor: alpha(T.ink, 0.04) } },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: { borderRadius: T.radius.md },
          notchedOutline: { borderColor: T.border },
        },
      },
      MuiDialog: {
        styleOverrides: { paper: { ...overlayPaper, borderRadius: T.radius.xl } },
      },
      MuiMenu: {
        styleOverrides: { paper: { ...overlayPaper, borderRadius: T.radius.md } },
      },
      MuiPopover: {
        styleOverrides: { paper: { ...overlayPaper, borderRadius: T.radius.md } },
      },
      MuiAutocomplete: {
        styleOverrides: { paper: { ...overlayPaper, borderRadius: T.radius.md } },
      },
      MuiDrawer: {
        styleOverrides: { paper: { backgroundColor: T.paper, backgroundImage: 'none' } },
      },
      MuiMenuItem: {
        styleOverrides: { root: { borderRadius: T.radius.sm, marginInline: 4 } },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            backgroundColor: IS_DARK_SKIN ? '#FAFAFA' : '#0F172A',
            color: IS_DARK_SKIN ? '#09090B' : '#FFFFFF',
            fontWeight: 600,
            borderRadius: T.radius.sm,
          },
        },
      },
      MuiTableCell: {
        styleOverrides: { root: { borderBottomColor: T.border } },
      },
      MuiDivider: {
        styleOverrides: { root: { borderColor: T.border } },
      },
      MuiChip: {
        styleOverrides: { root: { borderRadius: T.radius.sm } },
      },
      MuiAlert: {
        styleOverrides: { root: { borderRadius: T.radius.md } },
      },
      MuiSkeleton: {
        styleOverrides: { root: { backgroundColor: alpha(T.ink, 0.08) } },
      },
    },
  })
}
