import { useCallback, useRef, useState } from 'react'

import {
  companyFormationService,
  type CompanyFormationState,
} from '../../../services/companyFormation.service'
import { getErrorMessage } from '../../../utils/errorHandler'
import { useOnboarding, useOnboardingResource } from '../useOnboarding'

/** Ce ține serverul, nu userul: statusuri și flaguri derivate, niciun câmp de formular. */
const DERIVED_KEYS = [
  'id',
  'pfaRegistrationId',
  'status',
  'currentStage',
  'isLocked',
  'adminNote',
  'prefilledFields',
  'personalDataComplete',
  'registeredOfficeComplete',
  'signature',
] as const

/**
 * Starea dosarului de înființare plus salvarea de draft.
 *
 * Două căi de salvare, pentru că au cerințe opuse:
 *
 * - `autosave` — la ieșirea din câmp. Trebuie să fie invizibil: nu blochează formularul, nu
 *   reîmprospătează restul onboardingului și nu suprascrie ce tastezi în câmpul următor. Din
 *   răspuns adoptă doar flagurile derivate de server.
 * - `submit` — „Continuă"/„Confirmă semnătura". Aici userul așteaptă un rezultat, deci butonul
 *   se blochează, se adoptă tot răspunsul și se reîmprospătează pașii.
 */
export function useCompanyFormation() {
  const { refresh } = useOnboarding()
  const { data: loaded } = useOnboardingResource('companyFormation', () =>
    companyFormationService.getState(),
  )

  const [local, setLocal] = useState<CompanyFormationState | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const state = local ?? loaded

  // Autosave-urile se pot suprapune (blur rapid între câmpuri); păstrăm doar răspunsul ultimei
  // cereri, ca una întârziată să nu suprascrie o salvare mai nouă.
  const requestId = useRef(0)

  // ...și le trimitem una după alta: două cereri concurente ar încerca amândouă să insereze
  // același proprietar nou, pentru că niciuna n-o vede pe cealaltă.
  const queue = useRef<Promise<unknown>>(Promise.resolve())

  const enqueue = useCallback(async (run: () => Promise<CompanyFormationState>) => {
    const previous = queue.current
    let release: () => void = () => {}
    queue.current = new Promise<void>((resolve) => {
      release = resolve
    })

    try {
      await previous.catch(() => {})
      return await run()
    } finally {
      release()
    }
  }, [])

  const autosave = useCallback(
    async (run: () => Promise<CompanyFormationState>) => {
      const id = ++requestId.current
      try {
        const next = await enqueue(run)
        if (id !== requestId.current) return next

        setError(null)
        // Câmpurile rămân ale userului: din răspuns luăm doar ce nu poate ști pagina.
        setLocal((current) => {
          if (!current) return next
          const merged = { ...current }
          for (const key of DERIVED_KEYS) {
            Object.assign(merged, { [key]: next[key] })
          }
          return merged
        })
        return next
      } catch (err) {
        if (id === requestId.current) setError(getErrorMessage(err))
        return null
      }
    },
    [enqueue],
  )

  const submit = useCallback(
    async (run: () => Promise<CompanyFormationState>) => {
      const id = ++requestId.current
      setSubmitting(true)
      setError(null)
      try {
        const next = await enqueue(run)
        if (id === requestId.current) {
          setLocal(next)
          // Doar aici: statusul pasului se poate schimba, deci rail-ul trebuie recalculat.
          void refresh()
        }
        return next
      } catch (err) {
        if (id === requestId.current) setError(getErrorMessage(err))
        return null
      } finally {
        if (id === requestId.current) setSubmitting(false)
      }
    },
    [enqueue, refresh],
  )

  return {
    state,
    /** Modificare locală, fără cerere — folosită la fiecare tastă. */
    patch: setLocal,
    autosave,
    submit,
    /** Doar acțiunile explicite blochează UI-ul; autosave-ul e tăcut. */
    submitting,
    error,
    setError,
  }
}
