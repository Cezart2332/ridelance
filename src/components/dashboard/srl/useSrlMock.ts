import { useEffect, useState } from 'react'

/**
 * Sursa de date a paginilor SRL în FAZA 1.
 *
 * Spec §6.2 cere ca stările de loading și de eroare să existe și să se randeze, deși nu se face
 * niciun request. Fără ele, wiring-ul din FAZA 2 ar însemna nu „schimbă sursa", ci „construiește
 * două stări noi în fiecare pagină" — exact munca pe care faza statică trebuie să o elimine.
 *
 * Comută `MOCK_STATE` ca să vezi celelalte două stări în timp ce lucrezi la o pagină.
 */

export type MockState = 'ready' | 'loading' | 'error'

/** Starea în care randează toate paginile SRL. Se schimbă manual, în timpul dezvoltării. */
const MOCK_STATE: MockState = 'ready'

/** Întârziere simulată, ca scheletul de loading să apuce să fie vizibil măcar o clipă. */
const MOCK_DELAY_MS = 250

export interface MockResult<T> {
  data: T | null
  loading: boolean
  error: string | null
}

export function useSrlMock<T>(value: T): MockResult<T> {
  const [loading, setLoading] = useState(MOCK_STATE === 'loading')

  useEffect(() => {
    if (MOCK_STATE !== 'loading') return
    const timer = setTimeout(() => setLoading(false), MOCK_DELAY_MS)
    return () => clearTimeout(timer)
  }, [])

  if (MOCK_STATE === 'error') {
    return { data: null, loading: false, error: 'Nu am putut încărca datele. Încearcă din nou.' }
  }

  return { data: loading ? null : value, loading, error: null }
}
