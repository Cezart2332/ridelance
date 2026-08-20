import type { SvgIconComponent } from '@mui/icons-material'
import AccountBalanceRoundedIcon from '@mui/icons-material/AccountBalanceRounded'
import AccountBalanceWalletRoundedIcon from '@mui/icons-material/AccountBalanceWalletRounded'
import CalculateRoundedIcon from '@mui/icons-material/CalculateRounded'
import ChatRoundedIcon from '@mui/icons-material/ChatRounded'
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded'
import DirectionsCarFilledRoundedIcon from '@mui/icons-material/DirectionsCarFilledRounded'
import FolderRoundedIcon from '@mui/icons-material/FolderRounded'
import FolderSpecialRoundedIcon from '@mui/icons-material/FolderSpecialRounded'
import GridViewRoundedIcon from '@mui/icons-material/GridViewRounded'
import HeadsetMicRoundedIcon from '@mui/icons-material/HeadsetMicRounded'
import HomeRoundedIcon from '@mui/icons-material/HomeRounded'
import InsertChartRoundedIcon from '@mui/icons-material/InsertChartRounded'
import LinkRoundedIcon from '@mui/icons-material/LinkRounded'
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded'
import PersonRoundedIcon from '@mui/icons-material/PersonRounded'
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded'
import RedeemRoundedIcon from '@mui/icons-material/RedeemRounded'
import ShieldRoundedIcon from '@mui/icons-material/ShieldRounded'
import ShoppingCartRoundedIcon from '@mui/icons-material/ShoppingCartRounded'
import WorkspacePremiumRoundedIcon from '@mui/icons-material/WorkspacePremiumRounded'

import type { DashboardNavConfig, NavEntry } from './dashboardNav'

/**
 * Sursa unică de adevăr pentru navigația Dashboard-ului PFA.
 *
 * Regula: orice link către o pagină de dashboard pleacă de aici. Un `<Link to="/app/dashboard/...">`
 * cu cale scrisă de mână într-o componentă e un bug, nu un scurtcircuit — când se schimbă un slug,
 * el rămâne în urmă și devine rută moartă.
 *
 * Fișierul alimentează, în ordine: sidebar-ul, tabelul de rute, bara de jos de pe mobil,
 * hub-ul de meniu mobil și titlurile din antet.
 */

/** Prefixul real al dashboard-ului PFA. Nu e `/dashboard` — acela redirecționează la `/demo`. */
export const DASHBOARD_ROOT = '/app/dashboard'

const at = (segment: string) => `${DASHBOARD_ROOT}/${segment}`

export const PFA_PATHS = {
  home: DASHBOARD_ROOT,

  accounting: at('contabilitate'),
  financialOverview: at('contabilitate/situatie-financiara'),
  expenses: at('contabilitate/cheltuieli'),
  taxes: at('contabilitate/taxe-declaratii'),
  bankAccount: at('contabilitate/cont-bancar'),
  invoices: at('contabilitate/facturi'),
  accountantChat: at('contabilitate/chat-contabil'),

  documents: at('documente'),
  docsPersonal: at('documente/personale'),
  docsPfa: at('documente/pfa'),
  docsVehicle: at('documente/masina'),
  docsRecurring: at('documente/recurente'),

  connections: at('conexiuni'),
  connBolt: at('conexiuni/bolt'),
  connUber: at('conexiuni/uber'),
  connOblio: at('conexiuni/oblio'),
  connBank: at('conexiuni/banca'),

  benefits: at('beneficii'),

  services: at('servicii'),
  svcCars: at('servicii/masini'),
  svcSubscriptions: at('servicii/abonamente'),
  svcIndividual: at('servicii/servicii-individuale'),
  svcInsurance: at('servicii/asigurari'),

  support: at('suport'),
  profile: at('profil'),

  /**
   * Istoricul plăților trăiește ca secțiune în Profil (spec §10.4), nu ca pagină separată.
   * Ancora e destinația reală; calea rămâne definită doar ca țintă pentru linkurile deja
   * plecate în notificări, care redirecționează aici.
   */
  paymentHistoryAnchor: `${at('profil')}#plati`,
  paymentHistory: at('profil/istoric-plati'),
} as const

export type PfaPath = (typeof PFA_PATHS)[keyof typeof PFA_PATHS]

export const PFA_NAV: NavEntry[] = [
  {
    kind: 'link',
    id: 'home',
    label: 'Acasă',
    icon: HomeRoundedIcon,
    path: PFA_PATHS.home,
    hint: 'Cum merge activitatea mea',
  },

  {
    kind: 'group',
    id: 'accounting',
    label: 'Contabilitate',
    icon: CalculateRoundedIcon,
    children: [
      {
        id: 'financial-overview',
        label: 'Situație financiară',
        path: PFA_PATHS.financialOverview,
        hint: 'Analiza detaliată a banilor',
      },
      { id: 'expenses', label: 'Cheltuieli', path: PFA_PATHS.expenses, hint: 'Ce poți deduce din taxe' },
      { id: 'taxes', label: 'Taxe & declarații', path: PFA_PATHS.taxes, hint: 'Estimări și termene' },
      { id: 'bank-account', label: 'Cont bancar', path: PFA_PATHS.bankAccount, hint: 'Cont conectat și tranzacții' },
      { id: 'invoices', label: 'Facturi', path: PFA_PATHS.invoices, hint: 'În curând', badge: 'coming-soon' },
      {
        id: 'accountant-chat',
        label: 'Chat contabil',
        path: PFA_PATHS.accountantChat,
        hint: 'Discută cu contabilul tău',
      },
    ],
  },

  {
    kind: 'group',
    id: 'documents',
    label: 'Documente',
    icon: DescriptionRoundedIcon,
    children: [
      { id: 'docs-personal', label: 'Documente personale', path: PFA_PATHS.docsPersonal, hint: 'Actele tale' },
      { id: 'docs-pfa', label: 'Documente PFA', path: PFA_PATHS.docsPfa, hint: 'Actele firmei' },
      { id: 'docs-vehicle', label: 'Documente mașină', path: PFA_PATHS.docsVehicle, hint: 'Actele autoturismului' },
      {
        id: 'docs-recurring',
        label: 'Documentație recurentă',
        path: PFA_PATHS.docsRecurring,
        hint: 'Ce trebuie încărcat lunar',
      },
    ],
  },

  {
    kind: 'group',
    id: 'connections',
    label: 'Conexiuni',
    icon: LinkRoundedIcon,
    children: [
      { id: 'conn-bolt', label: 'Bolt', path: PFA_PATHS.connBolt, hint: 'Conexiune API și conturi' },
      { id: 'conn-uber', label: 'Uber', path: PFA_PATHS.connUber, hint: 'Import date și conturi' },
      { id: 'conn-oblio', label: 'OBLIO', path: PFA_PATHS.connOblio, hint: 'Facturare' },
      { id: 'conn-bank', label: 'Bancă', path: PFA_PATHS.connBank, hint: 'Contul bancar PFA' },
    ],
  },

  {
    kind: 'link',
    id: 'benefits',
    label: 'Beneficii',
    icon: RedeemRoundedIcon,
    path: PFA_PATHS.benefits,
    hint: 'Oferte de la partenerii RIDElance',
  },

  {
    kind: 'group',
    id: 'services',
    label: 'Servicii',
    icon: GridViewRoundedIcon,
    children: [
      { id: 'svc-cars', label: 'Mașini', path: PFA_PATHS.svcCars, hint: 'Mașini de închiriat' },
      {
        id: 'svc-subscriptions',
        label: 'Abonamente',
        path: PFA_PATHS.svcSubscriptions,
        hint: 'Planul tău și schimbarea lui',
      },
      {
        id: 'svc-individual',
        label: 'Servicii individuale',
        path: PFA_PATHS.svcIndividual,
        hint: 'Cumperi separat, fără abonament',
      },
      { id: 'svc-insurance', label: 'Asigurări', path: PFA_PATHS.svcInsurance, hint: 'Oferte prin asigurari.ro' },
    ],
  },

  { kind: 'separator', id: 'sep-1' },

  { kind: 'link', id: 'support', label: 'Suport', icon: HeadsetMicRoundedIcon, path: PFA_PATHS.support, hint: 'Ajutor din partea RIDElance' },
  { kind: 'link', id: 'profile', label: 'Profil', icon: PersonRoundedIcon, path: PFA_PATHS.profile, hint: 'Datele și setările contului' },
  { kind: 'action', id: 'logout', label: 'Deconectare', icon: LogoutRoundedIcon },
]

/**
 * Iconițe pentru paginile care nu au item propriu în sidebar, dar apar în hub-ul mobil
 * sau au nevoie de un simbol în antet.
 */
export const EXTRA_PAGE_ICONS: Record<string, SvgIconComponent> = {
  [PFA_PATHS.paymentHistory]: ReceiptLongRoundedIcon,
}

/** Iconițele per pagină, folosite de hub-ul mobil. Grupurile împrumută iconița categoriei. */
export const LEAF_ICONS: Record<string, SvgIconComponent> = {
  [PFA_PATHS.financialOverview]: InsertChartRoundedIcon,
  [PFA_PATHS.expenses]: AccountBalanceWalletRoundedIcon,
  [PFA_PATHS.taxes]: CalculateRoundedIcon,
  [PFA_PATHS.bankAccount]: AccountBalanceRoundedIcon,
  [PFA_PATHS.invoices]: ReceiptLongRoundedIcon,
  [PFA_PATHS.accountantChat]: ChatRoundedIcon,
  [PFA_PATHS.docsPersonal]: FolderRoundedIcon,
  [PFA_PATHS.docsPfa]: FolderRoundedIcon,
  [PFA_PATHS.docsVehicle]: DirectionsCarFilledRoundedIcon,
  [PFA_PATHS.docsRecurring]: FolderSpecialRoundedIcon,
  [PFA_PATHS.connBolt]: LinkRoundedIcon,
  [PFA_PATHS.connUber]: LinkRoundedIcon,
  [PFA_PATHS.connOblio]: LinkRoundedIcon,
  [PFA_PATHS.connBank]: AccountBalanceRoundedIcon,
  [PFA_PATHS.svcCars]: DirectionsCarFilledRoundedIcon,
  [PFA_PATHS.svcSubscriptions]: WorkspacePremiumRoundedIcon,
  [PFA_PATHS.svcIndividual]: ShoppingCartRoundedIcon,
  [PFA_PATHS.svcInsurance]: ShieldRoundedIcon,
  ...EXTRA_PAGE_ICONS,
}

/**
 * Rutele vechi, dinainte ca dashboard-ul să aibă rute reale. Nu se șterg: linkurile
 * `?section=` au plecat deja în notificări push și e-mailuri, iar acelea trebuie să
 * aterizeze corect și peste un an.
 */
export const LEGACY_SECTION_ROUTES: Record<string, string> = {
  home: PFA_PATHS.home,
  more: PFA_PATHS.home,
  banca: PFA_PATHS.bankAccount,
  expenses: PFA_PATHS.expenses,
  doc_recurring: PFA_PATHS.docsRecurring,
  documents: PFA_PATHS.docsPersonal,
  support: PFA_PATHS.support,
  profile: PFA_PATHS.profile,
  istoric_plati: PFA_PATHS.paymentHistoryAnchor,
  cars: PFA_PATHS.svcCars,
  abonamente: PFA_PATHS.svcSubscriptions,
  servicii: PFA_PATHS.svcIndividual,
  asigurari: PFA_PATHS.svcInsurance,
  beneficii: PFA_PATHS.benefits,
  bolt_integration: PFA_PATHS.connBolt,
  platforms: PFA_PATHS.connBolt,
}

/** Titlurile din antet pentru paginile fără item de meniu. */
const EXTRA_PAGE_TITLES: Record<string, string> = {
  [PFA_PATHS.home]: 'Dashboard PFA',
}

/**
 * Configul complet al dashboard-ului PFA. Layout-ul primește doar obiectul ăsta — nu importă
 * nimic din fișierul de față și nu știe că PFA-ul există.
 */
export const PFA_NAV_CONFIG: DashboardNavConfig = {
  ownerType: 'Pfa',
  root: DASHBOARD_ROOT,
  menuLabel: 'Meniu Principal',
  entries: PFA_NAV,
  /** Versionată: o schimbare de structură invalidează starea veche. */
  storageKey: 'ridelance.pfa.nav.v1',
  /** Cele trei destinații directe din bara de jos. Restul intră sub „Meniu". */
  mobileTabs: [
    { path: PFA_PATHS.home, label: 'Acasă', icon: HomeRoundedIcon },
    { path: PFA_PATHS.profile, label: 'Profil', icon: PersonRoundedIcon },
    { path: PFA_PATHS.support, label: 'Suport', icon: HeadsetMicRoundedIcon },
  ],
  extraPageTitles: EXTRA_PAGE_TITLES,
  fallbackTitle: 'Dashboard PFA',
}
