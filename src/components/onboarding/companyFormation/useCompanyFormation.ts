import { useCallback, useRef, useState } from 'react'

import {
  companyFormationService,
  type CompanyFormationState,
} from '../../../services/companyFormation.service'
import { getErrorMessage } from '../../../utils/errorHandler'
import { useOnboarding, useOnboardingResource } from '../useOnboarding'

/**
 * Starea dosarului de înființare plus salvarea de draft.
 *
 * Formularul urmărește serverul până când userul îl atinge, apoi rămâne al lui: altfel un
 * răspuns de autosave întors în timpul tastării ar muta cursorul sau ar readuce o valoare
 * pe care userul tocmai o ștergea.
 */
export function useCompanyFormation() {
  const { refresh } = useOnboarding()
  const { data: loaded } = useOnboardingResource('companyFormation', () =>
    companyFormationService.getState(),
  )

  const [local, setLocal] = useState<CompanyFormationState | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const state = local ?? loaded

  // Autosave-urile se pot suprapune (blur rapid între câmpuri); păstrăm doar răspunsul ultimei
  // cereri, ca una întârziată să nu suprascrie o salvare mai nouă.
  const requestId = useRef(0)

  // ...și le trimitem una după alta: două cereri concurente ar încerca amândouă să insereze
  // același proprietar nou, pentru că niciuna n-o vede pe cealaltă.
  const queue = useRef<Promise<unknown>>(Promise.resolve())

  const save = useCallback(
    async (run: () => Promise<CompanyFormationState>) => {
      const id = ++requestId.current
      setSaving(true)
      setError(null)

      const previous = queue.current
      let release: () => void = () => {}
      queue.current = new Promise<void>((resolve) => {
        release = resolve
      })

      try {
        await previous.catch(() => {})
        const next = await run()
        if (id === requestId.current) {
          setLocal(next)
          void refresh()
        }
        return next
      } catch (err) {
        if (id === requestId.current) {
          setError(getErrorMessage(err))
        }
        return null
      } finally {
        release()
        if (id === requestId.current) {
          setSaving(false)
        }
      }
    },
    [refresh],
  )

  return {
    state,
    /** Modificare locală, fără cerere — folosită la fiecare tastă. */
    patch: setLocal,
    save,
    saving,
    error,
    setError,
  }
}
