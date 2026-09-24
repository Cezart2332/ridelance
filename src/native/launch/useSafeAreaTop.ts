import { useEffect, useState } from 'react'

/** Cât ocupă bara de stare, în pixeli — din `--sat` (index.html), măsurat pe un element ascuns. */
function measure(): number {
  const probe = document.createElement('div')
  probe.style.cssText = 'position:fixed;top:0;left:0;width:0;height:var(--sat);visibility:hidden;pointer-events:none'
  document.body.appendChild(probe)
  const height = probe.getBoundingClientRect().height
  probe.remove()
  return Math.round(height)
}

/**
 * Înălțimea barei de stare, pentru ce se calculează în pixeli: cortina se strânge exact cât
 * antetul de login, care urcă sub bara de stare. Se recitește la rotire.
 */
export function useSafeAreaTop(): number {
  const [top, setTop] = useState(() => (typeof document === 'undefined' ? 0 : measure()))
  useEffect(() => {
    const update = () => setTop(measure())
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])
  return top
}
