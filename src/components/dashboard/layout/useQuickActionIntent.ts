import { useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'

import { QUICK_ACTION_PARAM, type QuickActionIntent } from '../../../config/dashboardNav'

/**
 * Ce i-a cerut meniul „+” paginii curente (`?actiune=…`), plus felul de a închide cererea.
 *
 * Pagina nu copiază intenția într-o stare printr-un efect: își derivă dialogul direct din ea
 * (`open = deschisManual || intent === 'cheltuiala'`) și o șterge la închidere. Așa, a doua apăsare
 * pe aceeași acțiune, de pe aceeași pagină, redeschide dialogul — adresa se schimbă din nou.
 */
export function useQuickActionIntent(): { intent: QuickActionIntent | null; clearIntent: () => void } {
  const [params, setParams] = useSearchParams()
  const intent = params.get(QUICK_ACTION_PARAM) as QuickActionIntent | null

  const clearIntent = useCallback(() => {
    setParams(
      (current) => {
        if (!current.has(QUICK_ACTION_PARAM)) return current
        const next = new URLSearchParams(current)
        next.delete(QUICK_ACTION_PARAM)
        return next
      },
      { replace: true },
    )
  }, [setParams])

  return { intent, clearIntent }
}
