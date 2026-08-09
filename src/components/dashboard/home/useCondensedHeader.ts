import { useEffect, useRef, useState } from 'react'

/**
 * Spune dacă antetul paginii trebuie condensat, adică dacă utilizatorul a derulat
 * dincolo de primii câțiva pixeli.
 *
 * Nu se uită la `window.scrollY`: în `AppLayout` scroll-ul e intern, pe `<main>`, deci
 * `window.scrollY` rămâne 0 la infinit. Un `useScrollTrigger` ar avea nevoie de referința
 * acelui element, pe care pagina nu o are. Un santinel de 8px observat cu
 * `IntersectionObserver` funcționează indiferent cine e containerul de scroll — inclusiv
 * dacă layout-ul se schimbă mâine.
 */
export function useCondensedHeader() {
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const [condensed, setCondensed] = useState(false)

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel || typeof IntersectionObserver === 'undefined') return

    const observer = new IntersectionObserver(
      ([entry]) => setCondensed(!entry.isIntersecting),
      { threshold: 0 },
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [])

  return { sentinelRef, condensed }
}

/** Înălțimea aproximativă a antetului condensat — ancorele nu au voie să cadă sub bară. */
export const CONDENSED_HEADER_HEIGHT = 96
