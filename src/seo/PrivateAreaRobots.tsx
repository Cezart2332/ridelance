import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Zonele care nu au ce căuta în rezultatele de căutare: conturile, onboardingul, plata, linkurile
 * cu token. Serverul răspunde cu aceeași pagină pe orice adresă, deci „nu indexa” se spune de aici.
 *
 * Înregistrarea rămâne indexabilă: e pagina prin care intră un client nou.
 */
const PRIVATE_PREFIXES = [
  '/app',
  '/admin',
  '/contabil',
  '/onboarding',
  '/onboarding-srl',
  '/poster',
  '/autentificare',
  '/confirmare-email',
  '/parola-uitata',
  '/inregistrare/abonament',
  '/inregistrare/succes',
  '/checkout',
  '/banca',
  '/semneaza',
  '/invitatie',
  '/demo',
  '/dev',
]

const AREA = 'data-seo-area'

function isPrivateArea(pathname: string): boolean {
  return PRIVATE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
}

/**
 * Pune `noindex` cât timp adresa e într-o zonă privată și îl scoate la ieșire. Atinge doar eticheta
 * pusă de el: paginile publice își gestionează singure `<head>`-ul (`usePageSeo`).
 */
export function PrivateAreaRobots() {
  const { pathname } = useLocation()
  const isPrivate = isPrivateArea(pathname)

  useEffect(() => {
    const existing = document.head.querySelector<HTMLMetaElement>('meta[name="robots"]')
    if (!isPrivate) {
      if (existing?.hasAttribute(AREA)) existing.remove()
      return
    }
    const meta = existing ?? document.createElement('meta')
    meta.setAttribute('name', 'robots')
    meta.setAttribute('content', 'noindex, nofollow')
    meta.setAttribute(AREA, '')
    if (!existing) document.head.appendChild(meta)
  }, [isPrivate, pathname])

  return null
}
