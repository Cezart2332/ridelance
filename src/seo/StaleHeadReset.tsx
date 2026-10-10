import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { hasActivePageSeo, resetSeo } from './pageSeo'

/**
 * Curăță `<head>`-ul venit de la server când se pleacă de pe pagina lui.
 *
 * O pagină pre-randată sau una cu etichetele puse de server (o mașină, o firmă) sosește cu titlul
 * ei deja în `<head>`. Dacă pagina vie îl revendică (`usePageSeo`), tot ea îl scoate la plecare.
 * Dacă nu apucă — mașina nu s-a încărcat — titlul ar rămâne lipit și pe pagina următoare.
 *
 * Stă înaintea rutelor în arbore: efectul lui rulează după curățarea paginii vechi și înaintea
 * efectelor paginii noi, deci nu calcă pe ce declară aceasta.
 */
export function StaleHeadReset() {
  const { pathname } = useLocation()
  const first = useRef(true)

  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    if (!hasActivePageSeo()) resetSeo()
  }, [pathname])

  return null
}
