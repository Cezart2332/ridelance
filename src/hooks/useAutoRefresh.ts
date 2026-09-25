import { useEffect, useRef } from 'react'

/**
 * Rulează `refresh` la fiecare `intervalMs` cât timp `enabled` e adevărat și fila e vizibilă.
 * Într-o filă ascunsă nu cere nimic; când redevine vizibilă, reîmprospătează imediat, ca
 * datele să nu aștepte următorul interval.
 */
export function useAutoRefresh(refresh: () => void | Promise<void>, intervalMs: number, enabled = true) {
  const refreshRef = useRef(refresh)
  useEffect(() => {
    refreshRef.current = refresh
  }, [refresh])

  useEffect(() => {
    if (!enabled) return
    let running = false
    const tick = async () => {
      // O cerere lentă nu se suprapune peste următoarea.
      if (running || document.visibilityState !== 'visible') return
      running = true
      try {
        await refreshRef.current()
      } catch {
        // Reîmprospătarea din fundal nu întrerupe pagina; datele vechi rămân pe ecran.
      } finally {
        running = false
      }
    }
    const timer = window.setInterval(() => void tick(), intervalMs)
    const onVisible = () => {
      if (document.visibilityState === 'visible') void tick()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [enabled, intervalMs])
}
