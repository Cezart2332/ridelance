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
}

let snapshot: AutosaveSnapshot | null = null
const listeners = new Set<() => void>()

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
  if (
    snapshot?.status === next?.status &&
    snapshot?.savedAt?.getTime() === next?.savedAt?.getTime()
  ) {
    return
  }

  snapshot = next
  emit()
}

/** Rail-ul dreapta citește de aici. */
export const useAutosaveSnapshot = () => useSyncExternalStore(subscribe, getSnapshot, getSnapshot)

/**
 * Panoul își publică starea de salvare. Se curăță la demontare, ca rail-ul să nu rămână cu
 * „Salvat" de la un pas pe care userul l-a părăsit.
 */
export function usePublishAutosave(autosave: Pick<AutosaveSnapshot, 'status' | 'savedAt' | 'retry'>) {
  const { status, savedAt, retry } = autosave

  const stableRetry = useCallback(() => retry(), [retry])

  useEffect(() => {
    publish({ status, savedAt, retry: stableRetry })
    return () => publish(null)
  }, [status, savedAt, stableRetry])
}
