import { useEffect, useRef, useState } from 'react'

const DURATION_MS = 600

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Numărătoare ascendentă doar la prima montare (spec §7). La schimbarea filtrelor
 * valoarea sare direct — reanimarea la fiecare filtru devine obositoare și întârzie citirea.
 */
export function useCountUp(value: number): number {
  const [displayed, setDisplayed] = useState(() => (prefersReducedMotion() ? value : 0))
  const isFirstRun = useRef(true)

  useEffect(() => {
    // Valorile sosite după prima animație se aplică direct, fără să reanimeze.
    if (!isFirstRun.current || prefersReducedMotion()) {
      isFirstRun.current = false
      setDisplayed(value)
      return
    }

    isFirstRun.current = false
    const start = performance.now()
    let frame = 0

    const step = (now: number) => {
      const progress = Math.min(1, (now - start) / DURATION_MS)
      const eased = 1 - (1 - progress) ** 3
      setDisplayed(value * eased)
      if (progress < 1) frame = requestAnimationFrame(step)
    }

    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [value])

  return displayed
}
