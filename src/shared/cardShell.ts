import type { Theme } from '@mui/material/styles'

import { IS_PANEL_SKIN } from '../components/dashboard/dashboardSkin'

/**
 * Conturul cardurilor comune (estimări fiscale, profil fiscal), după pielea încărcată.
 *
 * În dashboardul de client (pielea de panou) sunt carduri ca vecinii lor de pe „Acasă”: bordură
 * de 1px, colțuri de 12px, fără umbră — stilul shadcn/ui, în tema deschisă și în cea închisă.
 * În rest (contabil, admin) rămân cum erau: umbră ușoară, colțuri mici.
 */
export function cardShellSx(theme: Theme) {
  return IS_PANEL_SKIN
    ? { border: `1px solid ${theme.palette.divider}`, borderRadius: '12px', boxShadow: 'none' }
    : { borderRadius: 2, boxShadow: theme.shadows[1] }
}
