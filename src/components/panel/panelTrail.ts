import { createContext, useContext, useEffect } from 'react'

/**
 * Pașii din dreapta breadcrumb-ului, puși de pagina deschisă (de ex. numele clientului). Pagina îi
 * scoate la ieșire.
 */
export const TrailContext = createContext<(trail: string[]) => void>(() => undefined)

export function usePanelTrail(trail: string[]) {
  const set = useContext(TrailContext)
  const key = trail.join('\u0000')
  useEffect(() => {
    set(key ? key.split('\u0000') : [])
    return () => set([])
  }, [key, set])
}
