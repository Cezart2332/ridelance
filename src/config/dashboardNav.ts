import type { SvgIconComponent } from '@mui/icons-material'

import type { OwnerType } from './ownerType'

/**
 * Tipurile și regulile de navigație comune tuturor dashboard-urilor de business.
 *
 * Până acum trăiau în `pfaNavigation.ts`, iar `AppSidebar` / `AppHeader` / `AppLayout` importau
 * direct `PFA_NAV` și `PFA_PATHS`. Cu al doilea dashboard (SRL) asta ar fi însemnat fie clone de
 * layout, fie condiționale pe tip de cont împrăștiate prin componente — exact ce interzice
 * spec-ul §0.3.3.
 *
 * Regula nouă: layout-ul nu știe **niciun** meniu. Primește un `DashboardNavConfig` și îl
 * randează. `pfaNavigation.ts` și `srlNavigation.ts` sunt doar date.
 */

export type NavLeaf = {
  id: string
  label: string
  path: string
  /** Text scurt pentru hub-ul de meniu de pe mobil. */
  hint?: string
  badge?: 'coming-soon'
}

export type NavEntry =
  | ({ kind: 'link'; icon: SvgIconComponent } & NavLeaf)
  | { kind: 'group'; id: string; label: string; icon: SvgIconComponent; children: NavLeaf[] }
  | { kind: 'separator'; id: string }
  | { kind: 'action'; id: string; label: string; icon: SvgIconComponent }

export type NavGroupEntry = Extract<NavEntry, { kind: 'group' }>
export type NavLinkEntry = Extract<NavEntry, { kind: 'link' }>

/**
 * O destinație din bara de jos de pe mobil. Eticheta și iconița stau aici, nu în layout:
 * bara e o proiecție a meniului, nu o listă paralelă care poate rămâne în urmă.
 */
export type MobileTab = {
  path: string
  label: string
  icon: SvgIconComponent
}

/**
 * Tot ce îi trebuie layout-ului ca să randeze un dashboard. Un singur obiect per tip de cont,
 * ca adăugarea unei pagini să fie o linie de date, nu o modificare de componentă.
 */
export interface DashboardNavConfig {
  ownerType: OwnerType
  /** Rădăcina rutelor. E și calea paginii „Acasă". */
  root: string
  /** Eticheta de deasupra listei de navigație din sidebar. */
  menuLabel: string
  entries: NavEntry[]
  /**
   * Cheia sub care se rețin categoriile deschise. Distinctă per dashboard: altfel un
   * `id` de grup comun („documents") ar transporta starea dintr-un cont în celălalt.
   */
  storageKey: string
  /** Destinațiile directe din bara de jos de pe mobil. Restul intră sub „Meniu". */
  mobileTabs: readonly MobileTab[]
  /**
   * Itemi de navigație randați în subsol, sub lista principală și deasupra blocului de
   * identitate. Spec §2.1 cere ca Setările să iasă din listă fără să devină un buton
   * secundar: rămân link de navigație, cu aceeași stare activă.
   */
  bottomEntries?: NavEntry[]
  /** Titluri pentru paginile care nu au item propriu în meniu. */
  extraPageTitles?: Record<string, string>
  /** Titlul afișat când nicio rută nu se potrivește. */
  fallbackTitle: string
  /** Titlul filei de browser cât timp dashboardul e deschis (spec §1.1). */
  documentTitle: string
}

/** Categoriile colapsabile, în ordinea din meniu. */
export function navGroups(config: DashboardNavConfig): NavGroupEntry[] {
  return config.entries.filter((entry): entry is NavGroupEntry => entry.kind === 'group')
}

/** Toate frunzele navigabile, inclusiv linkurile de nivel unu. */
export function navLeaves(config: DashboardNavConfig): NavLeaf[] {
  return [...config.entries, ...(config.bottomEntries ?? [])].flatMap((entry) => {
    if (entry.kind === 'group') return entry.children
    if (entry.kind === 'link') return [{ id: entry.id, label: entry.label, path: entry.path, hint: entry.hint }]
    return []
  })
}

/**
 * Potrivirea rutei active. Se compară pe segmente, nu cu `startsWith`, ca `/profil` să nu
 * revendice `/profil/istoric-plati` doar pentru că e prefixul lui textual.
 */
function isPathActive(pathname: string, path: string): boolean {
  if (pathname === path) return true
  return pathname.startsWith(`${path}/`)
}

/** Frunza care corespunde rutei curente — cea mai specifică potrivire câștigă. */
export function findActiveLeaf(config: DashboardNavConfig, pathname: string): NavLeaf | undefined {
  const leaves = navLeaves(config)

  // Rădăcina se potrivește doar exact: `isPathActive` ar face-o să revendice tot dashboardul.
  if (pathname === config.root) {
    return leaves.find((leaf) => leaf.path === config.root)
  }

  return leaves
    .filter((leaf) => leaf.path !== config.root && isPathActive(pathname, leaf.path))
    .sort((a, b) => b.path.length - a.path.length)[0]
}

/** Grupul care conține ruta curentă. Rămâne deschis chiar dacă utilizatorul l-a închis manual. */
export function findActiveGroupId(config: DashboardNavConfig, pathname: string): string | undefined {
  return navGroups(config).find((group) => group.children.some((child) => isPathActive(pathname, child.path)))?.id
}

export function pageTitleFor(config: DashboardNavConfig, pathname: string): string {
  const extra = config.extraPageTitles?.[pathname]
  if (extra) return extra
  return findActiveLeaf(config, pathname)?.label ?? config.fallbackTitle
}
