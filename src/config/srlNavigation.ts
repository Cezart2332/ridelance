import DirectionsCarFilledRoundedIcon from '@mui/icons-material/DirectionsCarFilledRounded'
import HomeRoundedIcon from '@mui/icons-material/HomeRounded'
import ShieldRoundedIcon from '@mui/icons-material/ShieldRounded'

import type { DashboardNavConfig, NavEntry } from './dashboardNav'

/**
 * Navigația Dashboard-ului SRL. Aceleași reguli ca la PFA (`pfaNavigation.ts`): fișierul e
 * doar date, iar layout-ul le randează fără să știe ce dashboard servește.
 *
 * Starea de acum e cea reală, nu cea din spec: contul de flotă are trei secțiuni. Structura
 * completă din spec §2.1 (Flotă / Firmă / Financiar / Platformă) se adaugă în FAZA 1, pe măsură
 * ce paginile chiar există. Un meniu care trimite în gol e mai rău decât unul scurt.
 */

/**
 * Rădăcina rutelor SRL.
 *
 * Spec-ul §1.1 cerea `/dashboard/srl/*`, dar `/dashboard` e deja ocupat de un redirect public
 * către `/demo` (`components/layout/AppLayout.tsx`), iar dashboard-ul PFA stă pe `/app/dashboard`.
 * Paritatea reală cere prefixul `/app`. Vezi `NOTES-srl-restructure.md` §6.2.
 */
export const SRL_ROOT = '/app/dashboard-srl'

/** Ruta de dinainte de mutarea sub `/app`. Rămâne ca redirect — sesiuni deschise, linkuri trimise. */
export const SRL_LEGACY_ROOT = '/poster'

const at = (segment: string) => `${SRL_ROOT}/${segment}`

export const SRL_PATHS = {
  home: SRL_ROOT,
  cars: at('masini'),
  insurance: at('asigurari'),
} as const

export type SrlPath = (typeof SRL_PATHS)[keyof typeof SRL_PATHS]

export const SRL_NAV: NavEntry[] = [
  {
    kind: 'link',
    id: 'home',
    label: 'Acasă',
    icon: HomeRoundedIcon,
    path: SRL_PATHS.home,
    hint: 'Cum merge flota',
  },
  {
    kind: 'link',
    id: 'cars',
    label: 'Mașinile mele',
    icon: DirectionsCarFilledRoundedIcon,
    path: SRL_PATHS.cars,
    hint: 'Anunțurile și dosarele mașinilor',
  },
  {
    kind: 'link',
    id: 'insurance',
    label: 'Asigurări',
    icon: ShieldRoundedIcon,
    path: SRL_PATHS.insurance,
    hint: 'Oferte prin asigurari.ro',
  },
]

export const SRL_NAV_CONFIG: DashboardNavConfig = {
  ownerType: 'Srl',
  root: SRL_ROOT,
  menuLabel: 'SRL',
  entries: SRL_NAV,
  storageKey: 'ridelance.srl.nav.v1',
  mobileTabs: [
    { path: SRL_PATHS.home, label: 'Acasă', icon: HomeRoundedIcon },
    { path: SRL_PATHS.cars, label: 'Mașini', icon: DirectionsCarFilledRoundedIcon },
  ],
  fallbackTitle: 'Dashboard SRL',
}
