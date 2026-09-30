import { SRL_ROOT } from '../../config/srlNavigation'

/**
 * Zonele fiecărui rol. Adresa de revenire după login se folosește doar dacă e în zona contului
 * care tocmai a intrat.
 *
 * Fără verificarea asta, la delogarea de pe un cont în onboarding garda rutei ținea minte
 * `/onboarding/...`, iar următorul cont care intra — admin, firmă — ajungea în onboardingul PFA.
 */
const ROLE_AREAS: Record<string, readonly string[]> = {
  Client: ['/app/dashboard', '/onboarding'],
  CarPoster: [SRL_ROOT, '/onboarding-srl'],
  Admin: ['/admin'],
  Contabil: ['/contabil'],
}

/** Notificările sunt ale oricărui rol; una a altui cont pur și simplu nu se găsește. */
const SHARED_AREAS = ['/app/notificari']

const within = (pathname: string, area: string) => pathname === area || pathname.startsWith(`${area}/`)

/** Unde duce loginul: adresa cerută, dacă e a acestui rol, altfel `/app`, care alege după rol. */
export function loginDestination(returnTo: unknown, role: string | null | undefined): string {
  if (typeof returnTo !== 'string' || !returnTo.startsWith('/') || returnTo.startsWith('//') || returnTo.includes('\\')) {
    return '/app'
  }

  const pathname = returnTo.split(/[?#]/)[0]
  const areas = [...(ROLE_AREAS[role ?? ''] ?? []), ...SHARED_AREAS]
  return areas.some((area) => within(pathname, area)) ? returnTo : '/app'
}

/** Rolul are voie în zona asta. Folosit de gărzile paginilor care sunt ale unui singur rol. */
export function roleOwnsPath(role: string | null | undefined, pathname: string): boolean {
  return (ROLE_AREAS[role ?? ''] ?? []).some((area) => within(pathname, area))
}

/** Rolul căruia îi aparține adresa, dacă e în zona unui singur rol. */
export function roleForPath(pathname: string): string | null {
  return Object.entries(ROLE_AREAS).find(([, areas]) => areas.some((area) => within(pathname, area)))?.[0] ?? null
}

const ROLE_LABELS: Record<string, string> = {
  Client: 'PFA',
  CarPoster: 'firmă (SRL)',
  Admin: 'administrator',
  Contabil: 'contabil',
}

/** Numele rolului cum îl înțelege omul, pentru mesaje. */
export function roleLabel(role: string): string {
  return ROLE_LABELS[role] ?? role
}
