import { createContext, useContext } from 'react'

/**
 * Canalul prin care paginile SRL anunță că o acțiune n-are încă backend.
 *
 * Stă separat de `PendingBackend.tsx` pentru că un fișier care exportă și o componentă, și un
 * hook, rupe fast refresh-ul în dezvoltare.
 */

export type NotifyPending = (action?: string) => void

export const PendingBackendContext = createContext<NotifyPending | null>(null)

export function usePendingBackend(): NotifyPending {
  const notify = useContext(PendingBackendContext)
  if (!notify) {
    throw new Error('usePendingBackend cere PendingBackendProvider deasupra în arbore.')
  }
  return notify
}
