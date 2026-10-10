/**
 * „Pielea” dashboardului: ce set de tokeni folosește `DASHBOARD_TOKENS`.
 *
 * - `default` — tot ce nu e dashboard de client (admin, site-ul public), exact ca până acum;
 * - `panel-light` / `panel-dark` — dashboardurile PFA și SRL, în stilul panoului de lucru
 *   (shadcn/ui: borduri de 1px în loc de umbre, colțuri mici), alb cu albastru sau negru cu
 *   albastru.
 *
 * Se alege **o singură dată, la încărcarea paginii**, din adresă și din preferința salvată. De ce
 * nu la rulare: peste o sută de fișiere citesc `DASHBOARD_TOKENS` la nivel de modul, în constante
 * de stil, și le trec prin `alpha()` — care are nevoie de culori concrete, nu de variabile CSS.
 * O piele aleasă la încărcare le dă tuturor valori reale, fără să rescriem fiecare ecran.
 *
 * Prețul: schimbarea temei și trecerea între un dashboard de client și restul aplicației
 * reîncarcă pagina (`SkinBoundary`). E o reîncărcare obișnuită, o dată.
 */
export type DashboardSkin = 'default' | 'panel-light' | 'panel-dark'

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

/** Pielea potrivită unei adrese, cu preferința de acum. */
export function skinFor(pathname: string): DashboardSkin {
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

export const IS_DARK_SKIN = ACTIVE_SKIN === 'panel-dark'

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
