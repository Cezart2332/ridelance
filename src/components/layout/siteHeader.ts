import { createContext, useContext, useLayoutEffect } from 'react'

/**
 * Cine poate ascunde bara RIDElance de sus a site-ului public.
 *
 * Mini-site-ul unei firme are bara lui, cu logo-ul firmei și un buton înapoi spre RIDElance: două
 * bare una peste alta ar fi făcut pagina să pară a noastră, nu a firmei. Decizia stă la pagină, nu
 * într-o listă de adrese din layout: `/:companySlug` prinde orice adresă cu un singur segment, iar
 * doar pagina știe dacă a găsit o firmă sau arată un 404 (care își păstrează bara).
 */
export const SiteHeaderContext = createContext<(hidden: boolean) => void>(() => undefined)

/**
 * Ascunde bara de sus cât timp componenta e montată și `hidden` e adevărat. `useLayoutEffect`,
 * nu `useEffect`: bara dispare înaintea primului cadru desenat, fără să clipească.
 */
export function useHideSiteHeader(hidden: boolean): void {
  const setHidden = useContext(SiteHeaderContext)

  useLayoutEffect(() => {
    if (!hidden) return
    setHidden(true)
    return () => setHidden(false)
  }, [hidden, setHidden])
}
