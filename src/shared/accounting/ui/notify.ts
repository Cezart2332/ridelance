import { createContext, useContext, useState } from 'react'

import { errorMessage } from './useApi'

export type NotifySeverity = 'success' | 'error' | 'info' | 'warning'

export interface Notice {
  id: number
  message: string
  severity: NotifySeverity
}

export const NotifyContext = createContext<((message: string, severity?: NotifySeverity) => void) | null>(null)

/** Mesajele scurte de după o acțiune (snackbar-ul din `AccountingArea`). */
export function useNotify() {
  const notify = useContext(NotifyContext)
  return notify ?? (() => undefined)
}

/**
 * O acțiune asincronă cu stare de lucru și eroare afișată în snackbar. Întoarce `true` dacă a
 * reușit, ca apelantul să închidă dialogul sau să reîncarce.
 */
export function useAction() {
  const notify = useNotify()
  const [busy, setBusy] = useState<string | null>(null)

  const run = async (key: string, action: () => Promise<unknown>, success?: string): Promise<boolean> => {
    setBusy(key)
    try {
      await action()
      if (success) notify(success, 'success')
      return true
    } catch (error) {
      notify(errorMessage(error), 'error')
      return false
    } finally {
      setBusy(null)
    }
  }

  return { busy, run }
}
