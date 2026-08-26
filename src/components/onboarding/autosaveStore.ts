import { useCallback, useEffect, useSyncExternalStore } from 'react'

import type { Autosave } from '../../hooks/useAutosave'

/**
 * Puntea dintre autosave-ul unui panou și rail-ul dreapta, unde specul cere să apară indicatorul.
 *
 * Starea de salvare aparține panoului (fiecare scrie pe alt endpoint), iar rail-ul trăiește în
 * shell — deci trebuie urcată. Nu printr-un context clasic: publicarea s-ar face dintr-un
 * `useEffect`, adică `setState` în effect, exact ce interzice regula de lint din proiect (și pe
 * bună dreptate — ar produce un render în cascadă la fiecare tastă).
 *
 * Un store extern cu `useSyncExternalStore` rezolvă asta: scrierea e o simplă mutație plus o
 * notificare, iar re-randarea o cere React doar cui e abonat.
 */
export interface AutosaveSnapshot {
  status: Autosave<unknown>['status']
  savedAt: Date | null
  retry: () => void
  /** Există modificări netrimise. Runnerul îl citește ca să nu retrimită ce e deja pe server. */
  dirty: boolean
  /**
   * Trimite acum ce e în așteptare. No-op când nu e nimic — de asta e sigur de apelat oricând.
   * `false` înseamnă că a rămas ceva nesalvat.
   */
  flush: () => Promise<boolean>
}

let snapshot: AutosaveSnapshot | null = null
const listeners = new Set<() => void>()

/**
 * Ultimul autosave publicat, citibil imperativ.
 *
 * Runnerul are nevoie de `flush` în mijlocul unui handler asincron, nu la randare, deci nu-l
 * poate lua printr-un hook: un `useSyncExternalStore` i-ar da valoarea de la ultimul render.
 */
export const currentAutosave = (): AutosaveSnapshot | null => snapshot

const emit = () => listeners.forEach((listener) => listener())

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

const getSnapshot = () => snapshot

function publish(next: AutosaveSnapshot | null) {
  // Aceeași stare nu declanșează re-randare: `schedule` se apelează la fiecare tastă.
  const sameForRender =
    snapshot?.status === next?.status &&
    snapshot?.savedAt?.getTime() === next?.savedAt?.getTime()

  // `snapshot` se actualizează oricum: `flush` și `dirty` sunt citite imperativ, iar o referință
  // veche ar goli autosave-ul pasului anterior. Doar notificarea abonaților se sare.
  snapshot = next
  if (!sameForRender) emit()
}

/** Rail-ul dreapta citește de aici. */
export const useAutosaveSnapshot = () => useSyncExternalStore(subscribe, getSnapshot, getSnapshot)

/**
 * Panoul își publică starea de salvare. Se curăță la demontare, ca rail-ul să nu rămână cu
 * „Salvat" de la un pas pe care userul l-a părăsit.
 */
export function usePublishAutosave(
  autosave: Pick<AutosaveSnapshot, 'status' | 'savedAt' | 'retry' | 'dirty' | 'flush'>,
) {
  const { status, savedAt, retry, dirty, flush } = autosave

  const stableRetry = useCallback(() => retry(), [retry])
  const stableFlush = useCallback(() => flush(), [flush])

  useEffect(() => {
    publish({ status, savedAt, retry: stableRetry, dirty, flush: stableFlush })
    return () => publish(null)
  }, [status, savedAt, stableRetry, dirty, stableFlush])
}
