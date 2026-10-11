/**
 * „Pielea” dashboardului: ce set de tokeni folosește `DASHBOARD_TOKENS`.
 *
 * - `default` — tot ce nu e dashboard de client (admin, site-ul public), exact ca până acum;
 * - `panel-light` / `panel-dark` — dashboardurile PFA și SRL, în stilul panoului de lucru
 *   (shadcn/ui: borduri de 1px în loc de umbre, colțuri mici), alb cu albastru sau negru cu
 *   albastru;
 * - `staff-light` / `staff-dark` — panourile Admin și Contabil: aceeași structură, în paleta zinc
 *   a panoului (`PANEL_TOKENS`). Fără ele, ecranele comune deschise de staff (formularul de mașină,
 *   asigurările, dialogurile) rămâneau albe sau cu text închis pe negru în tema închisă.
 *
 * Se alege **o singură dată, la încărcarea paginii**, din adresă și din preferința salvată. De ce
 * nu la rulare: peste o sută de fișiere citesc `DASHBOARD_TOKENS` la nivel de modul, în constante
 * de stil, și le trec prin `alpha()` — care are nevoie de culori concrete, nu de variabile CSS.
 * O piele aleasă la încărcare le dă tuturor valori reale, fără să rescriem fiecare ecran.
 *
 * Prețul: schimbarea temei și trecerea între un dashboard de client și restul aplicației
 * reîncarcă pagina (`SkinBoundary`). E o reîncărcare obișnuită, o dată.
 */
export type DashboardSkin = 'default' | 'panel-light' | 'panel-dark' | 'staff-light' | 'staff-dark'

export type DashboardThemeMode = 'light' | 'dark'

const STORAGE_KEY = 'rl-dashboard-theme'

/** Cheia de dinainte, când doar SRL avea temă închisă. Citită ca preferința să nu se piardă. */
const LEGACY_STORAGE_KEY = 'rl-srl-theme'

/**
 * Rădăcinile dashboardurilor cu piele de panou: PFA (`PFA_PATHS.home`) și SRL (`srlNavigation`).
 * Scrise aici ca modulul să n-aibă importuri. `/app/dashboard-srl` nu e prins de PFA: potrivirea
 * cere rădăcina exactă sau un `/` după ea.
 */
const PANEL_ROOTS = ['/app/dashboard', '/app/dashboard-srl', '/poster']

export function isPanelPath(pathname: string): boolean {
  return PANEL_ROOTS.some((root) => pathname === root || pathname.startsWith(`${root}/`))
}

export function storedThemeMode(): DashboardThemeMode {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY) ?? window.localStorage.getItem(LEGACY_STORAGE_KEY)
    return value === 'dark' ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

/** Panourile Admin și Contabil, cu tema lor (`PanelThemeProvider`). */
const STAFF_ROOTS = ['/admin', '/contabil']

/** Cheia temei panourilor Admin/Contabil. Implicit închisă, ca până acum. */
const STAFF_STORAGE_KEY = 'rl-panel-theme'

export function isStaffPath(pathname: string): boolean {
  return STAFF_ROOTS.some((root) => pathname === root || pathname.startsWith(`${root}/`))
}

export function storedStaffThemeMode(): DashboardThemeMode {
  try {
    return window.localStorage.getItem(STAFF_STORAGE_KEY) === 'light' ? 'light' : 'dark'
  } catch {
    return 'dark'
  }
}

/** Pielea potrivită unei adrese, cu preferința de acum. */
export function skinFor(pathname: string): DashboardSkin {
  if (isStaffPath(pathname)) return storedStaffThemeMode() === 'dark' ? 'staff-dark' : 'staff-light'
  if (!isPanelPath(pathname)) return 'default'
  return storedThemeMode() === 'dark' ? 'panel-dark' : 'panel-light'
}

function initialSkin(): DashboardSkin {
  try {
    return skinFor(window.location.pathname)
  } catch {
    return 'default'
  }
}

/** Pielea cu care s-a încărcat pagina. Nu se schimbă până la următoarea încărcare. */
export const ACTIVE_SKIN: DashboardSkin = initialSkin()

export const IS_PANEL_SKIN = ACTIVE_SKIN !== 'default'

export const IS_DARK_SKIN = ACTIVE_SKIN === 'panel-dark' || ACTIVE_SKIN === 'staff-dark'

/** Panourile Admin/Contabil: tokenii statici iau paleta zinc a panoului, nu albastrul clientului. */
export const IS_STAFF_SKIN = ACTIVE_SKIN === 'staff-light' || ACTIVE_SKIN === 'staff-dark'

/**
 * Fundalul paginii, pus imediat ce se încarcă modulul. Fără el, în tema închisă pagina ar clipi
 * deschis la fiecare încărcare, până apucă dashboardul să se monteze (ecranul de așteptare al
 * rutelor are culorile aplicației, nu ale pielii).
 */
if (IS_DARK_SKIN) {
  try {
    document.documentElement.style.backgroundColor = '#09090B'
    document.documentElement.style.colorScheme = 'dark'
    document.body.style.backgroundColor = '#09090B'
  } catch {
    // Fără document (teste de unitate) nu e nimic de pictat.
  }
}

/** Schimbă tema dashboardului și reîncarcă pagina, ca toate stilurile să pornească de la tokenii noi. */
export function setDashboardThemeMode(mode: DashboardThemeMode): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, mode)
    window.localStorage.removeItem(LEGACY_STORAGE_KEY)
  } catch {
    // Fără stocare (fereastră privată) tema nu are unde să rămână; nu reîncărcăm degeaba.
    return
  }
  window.location.reload()
}

/**
 * Schimbă tema panourilor Admin/Contabil. Variabilele `--rl-*` s-ar schimba și pe loc, dar tokenii
 * statici (formulare, dialoguri, ecrane comune cu clientul) sunt aleși la încărcare: fără
 * reîncărcare, jumătate din pagină ar rămâne în tema veche.
 */
export function setStaffThemeMode(mode: DashboardThemeMode): void {
  try {
    window.localStorage.setItem(STAFF_STORAGE_KEY, mode)
  } catch {
    return
  }
  if (skinFor(window.location.pathname) !== ACTIVE_SKIN) window.location.reload()
}
