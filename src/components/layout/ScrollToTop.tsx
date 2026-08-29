import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Secțiunile care își păstrează singure poziția în pagină.
 *
 * La „Parteneri" fiecare partener e o rută proprie, iar tab-urile lui sunt, tehnic, navigări.
 * Derulat până la conținut, un click pe alt partener trimitea pagina înapoi sus — adică exact
 * lucrul pe care un rând de tab-uri promite că nu-l face. Navigările ÎN interiorul acestor
 * prefixe nu mai derulează; intrarea în secțiune, din altă parte, încă o face.
 */
const KEEPS_OWN_SCROLL = ['/parteneri']

const sectionOf = (pathname: string) =>
  KEEPS_OWN_SCROLL.find((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))

export function ScrollToTop() {
  const { pathname } = useLocation()
  const previous = useRef<string | null>(null)

  useEffect(() => {
    const section = sectionOf(pathname)
    const cameFromSameSection = section !== undefined && section === sectionOf(previous.current ?? '')

    previous.current = pathname

    if (cameFromSameSection) return

    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [pathname])

  return null
}
