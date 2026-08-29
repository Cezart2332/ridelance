import AccountBalanceRoundedIcon from '@mui/icons-material/AccountBalanceRounded'
import BuildRoundedIcon from '@mui/icons-material/BuildRounded'
import BusinessRoundedIcon from '@mui/icons-material/BusinessRounded'
import CalculateRoundedIcon from '@mui/icons-material/CalculateRounded'
import DirectionsCarFilledRoundedIcon from '@mui/icons-material/DirectionsCarFilledRounded'
import GridViewRoundedIcon from '@mui/icons-material/GridViewRounded'
import HeadsetMicRoundedIcon from '@mui/icons-material/HeadsetMicRounded'
import HomeRoundedIcon from '@mui/icons-material/HomeRounded'
import LinkRoundedIcon from '@mui/icons-material/LinkRounded'
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded'
import RedeemRoundedIcon from '@mui/icons-material/RedeemRounded'
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded'

import type { DashboardNavConfig, NavEntry } from './dashboardNav'

/**
 * Navigația Dashboard-ului SRL. Aceleași reguli ca la PFA (`pfaNavigation.ts`): fișierul e
 * doar date, iar layout-ul le randează fără să știe ce dashboard servește.
 *
 * Structura urmează spec §2.1. Itemii ale căror pagini încă nu există poartă
 * `badge: 'coming-soon'` și randează `ComingSoon` — spec-ul le presupunea construite (vezi
 * `NOTES-srl-restructure.md` §6.1), dar un meniu care ascunde faptul că pagina e goală e mai
 * rău decât unul care o spune.
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

  // ── Flotă ──
  cars: at('masini'),
  addCar: at('masini/adauga'),
  /** Pagina unei mașini. `:carId` se înlocuiește la navigare — vezi `carPath`. */
  car: at('masini/:carId'),
  rentals: at('inchirieri'),
  maintenance: at('mentenanta'),

  // ── Firmă ──
  profile: at('profil'),
  companyPage: at('pagina-firmei'),
  companyDocuments: at('documente-societate'),
  services: at('servicii'),

  // ── Financiar ──
  accounting: at('contabilitate'),
  bankAccount: at('contabilitate/cont-bancar'),
  invoices: at('contabilitate/facturi'),
  fiscal: at('contabilitate/fiscal'),

  // ── Platformă ──
  connections: at('conexiuni'),
  benefits: at('beneficii'),
  support: at('suport'),

  settings: at('setari'),
} as const

export type SrlPath = (typeof SRL_PATHS)[keyof typeof SRL_PATHS]

/** Calea către pagina unei mașini. Într-un singur loc, ca ruta și linkurile să nu poată diverge. */
export const srlCarPath = (carId: string) => SRL_PATHS.car.replace(':carId', carId)

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
    kind: 'group',
    id: 'fleet',
    label: 'Flotă',
    icon: DirectionsCarFilledRoundedIcon,
    children: [
      { id: 'cars', label: 'Mașinile mele', path: SRL_PATHS.cars, hint: 'Flota și acțiunile pe fiecare mașină' },
      // Cele două de mai jos sunt istoric la nivel de flotă: se operează din pagina mașinii.
      { id: 'rentals', label: 'Închirieri', path: SRL_PATHS.rentals, hint: 'Istoricul contractelor' },
      { id: 'maintenance', label: 'Mentenanță', path: SRL_PATHS.maintenance, hint: 'Istoric service și costuri' },
    ],
  },

  {
    kind: 'group',
    id: 'company',
    label: 'Firmă',
    icon: BusinessRoundedIcon,
    children: [
      { id: 'profile', label: 'Profil', path: SRL_PATHS.profile, hint: 'Datele și identitatea firmei' },
      { id: 'company-page', label: 'Pagina firmei', path: SRL_PATHS.companyPage, hint: 'Linkul public al firmei' },
      { id: 'company-documents', label: 'Documente societate', path: SRL_PATHS.companyDocuments, hint: 'Actele firmei' },
      { id: 'services', label: 'Servicii', path: SRL_PATHS.services, hint: 'Ce poți cumpăra prin RIDElance' },
    ],
  },

  {
    kind: 'group',
    id: 'accounting',
    label: 'Contabilitate',
    icon: CalculateRoundedIcon,
    children: [
      { id: 'bank-account', label: 'Cont bancar', path: SRL_PATHS.bankAccount, hint: 'Cont conectat și tranzacții' },
      { id: 'invoices', label: 'Facturi', path: SRL_PATHS.invoices, hint: 'Emise prin Oblio' },
      { id: 'fiscal', label: 'Fiscal', path: SRL_PATHS.fiscal, hint: 'Regim fiscal și termene' },
    ],
  },

  { kind: 'separator', id: 'sep-1' },

  {
    kind: 'link',
    id: 'connections',
    label: 'Conexiuni',
    icon: LinkRoundedIcon,
    path: SRL_PATHS.connections,
    hint: 'Oblio, bancă, eldrive',
  },
  {
    kind: 'link',
    id: 'benefits',
    label: 'Beneficii',
    icon: RedeemRoundedIcon,
    path: SRL_PATHS.benefits,
    hint: 'Oferte de la partenerii RIDElance',
  },
]

/**
 * Ies din lista principală, dar rămân itemi de navigație (spec §2.1). Suportul coboară aici
 * lângă Setări: și el e despre cont, nu despre activitatea flotei.
 */
const SRL_BOTTOM_NAV: NavEntry[] = [
  {
    kind: 'link',
    id: 'support',
    label: 'Suport',
    icon: HeadsetMicRoundedIcon,
    path: SRL_PATHS.support,
    hint: 'Ajutor din partea RIDElance',
  },
  {
    kind: 'link',
    id: 'settings',
    label: 'Setări',
    icon: SettingsRoundedIcon,
    path: SRL_PATHS.settings,
    hint: 'Preferințe operaționale',
  },
]

/** Iconițele per pagină, pentru antet și pentru hub-ul mobil. */
export const SRL_LEAF_ICONS: Record<string, typeof HomeRoundedIcon> = {
  [SRL_PATHS.cars]: DirectionsCarFilledRoundedIcon,
  [SRL_PATHS.rentals]: ReceiptLongRoundedIcon,
  [SRL_PATHS.maintenance]: BuildRoundedIcon,
  [SRL_PATHS.services]: GridViewRoundedIcon,
  [SRL_PATHS.bankAccount]: AccountBalanceRoundedIcon,
  [SRL_PATHS.invoices]: ReceiptLongRoundedIcon,
  [SRL_PATHS.fiscal]: CalculateRoundedIcon,
}

export const SRL_NAV_CONFIG: DashboardNavConfig = {
  ownerType: 'Srl',
  root: SRL_ROOT,
  menuLabel: 'SRL',
  entries: SRL_NAV,
  bottomEntries: SRL_BOTTOM_NAV,
  storageKey: 'ridelance.srl.nav.v1',
  mobileTabs: [
    { path: SRL_PATHS.home, label: 'Acasă', icon: HomeRoundedIcon },
    { path: SRL_PATHS.cars, label: 'Mașini', icon: DirectionsCarFilledRoundedIcon },
    { path: SRL_PATHS.support, label: 'Suport', icon: HeadsetMicRoundedIcon },
  ],
  fallbackTitle: 'Dashboard SRL',
  documentTitle: 'RIDElance — Dashboard SRL',
}
