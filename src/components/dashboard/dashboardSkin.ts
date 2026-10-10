/**
 * „Pielea” dashboardului: ce set de tokeni folosește `DASHBOARD_TOKENS`.
 *
 * - `default` — dashboardul PFA și tot restul, exact ca până acum;
 * - `srl-light` / `srl-dark` — dashboardul SRL, în stilul panoului de lucru (shadcn/ui: borduri de
 *   1px în loc de umbre, colțuri mici), alb cu albastru sau negru cu albastru.
 *
 * Se alege **o singură dată, la încărcarea paginii**, din adresă și din preferința salvată. De ce
 * nu la rulare: peste o sută de fișiere citesc `DASHBOARD_TOKENS` la nivel de modul, în constante
 * de stil, și le trec prin `alpha()` — care are nevoie de culori concrete, nu de variabile CSS.
 * O piele aleasă la încărcare le dă tuturor valori reale, fără să atingem niciun ecran PFA.
 *
 * Prețul: schimbarea temei și trecerea între SRL și restul aplicației reîncarcă pagina
 * (`SkinBoundary`). E o reîncărcare obișnuită, o dată.
 */
export type DashboardSkin = 'default' | 'srl-light' | 'srl-dark'

export type SrlThemeMode = 'light' | 'dark'

const STORAGE_KEY = 'rl-srl-theme'

/** Rădăcinile dashboardului SRL. Aceleași ca în `srlNavigation`, scrise aici ca modulul să n-aibă importuri. */
const SRL_ROOTS = ['/app/dashboard-srl', '/poster']

export function isSrlPath(pathname: string): boolean {
  return SRL_ROOTS.some((root) => pathname === root || pathname.startsWith(`${root}/`))
}

export function storedSrlThemeMode(): SrlThemeMode {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === 'dark' ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

/** Pielea potrivită unei adrese, cu preferința de acum. */
export function skinFor(pathname: string): DashboardSkin {
  if (!isSrlPath(pathname)) return 'default'
  return storedSrlThemeMode() === 'dark' ? 'srl-dark' : 'srl-light'
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

export const IS_SRL_SKIN = ACTIVE_SKIN !== 'default'

export const IS_DARK_SKIN = ACTIVE_SKIN === 'srl-dark'

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

/** Schimbă tema SRL și reîncarcă pagina, ca toate stilurile să pornească de la tokenii noi. */
export function setSrlThemeMode(mode: SrlThemeMode): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, mode)
  } catch {
    // Fără stocare (fereastră privată) tema nu are unde să rămână; nu reîncărcăm degeaba.
    return
  }
  window.location.reload()
}
