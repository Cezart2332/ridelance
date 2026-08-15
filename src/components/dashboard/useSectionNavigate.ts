import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

import { LEGACY_SECTION_ROUTES, PFA_PATHS } from '../../config/pfaNavigation'

/**
 * Punte între vechiul `onNavigate('expenses')` și rutele reale.
 *
 * Componentele de secțiune primesc de ani buni id-uri de secțiune, nu căi. În loc să le
 * rescriem pe toate odată cu rutarea, traducem id-ul aici. Pe măsură ce fiecare secțiune e
 * mutată (PR 2 și următoarele), își primește calea direct și iese din tabel — când tabelul
 * rămâne folosit doar de shim-ul de compatibilitate, hook-ul ăsta se poate șterge.
 */
export function useSectionNavigate(): (sectionId: string) => void {
  const navigate = useNavigate()

  return useCallback(
    (sectionId: string) => {
      navigate(LEGACY_SECTION_ROUTES[sectionId] ?? PFA_PATHS.home)
    },
    [navigate],
  )
}
