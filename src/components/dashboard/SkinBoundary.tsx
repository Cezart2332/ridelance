import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

import { ACTIVE_SKIN, skinFor } from './dashboardSkin'

/**
 * Ține pielea dashboardului în pas cu adresa. Pielea se alege la încărcarea paginii; când
 * navigarea trece granița dintre dashboardul SRL și restul aplicației (după login, la deconectare),
 * pagina se reîncarcă o dată, ca tokenii să fie ai zonei în care a ajuns omul.
 */
export function SkinBoundary() {
  const { pathname } = useLocation()

  useEffect(() => {
    if (skinFor(pathname) !== ACTIVE_SKIN) {
      window.location.reload()
    }
  }, [pathname])

  return null
}
