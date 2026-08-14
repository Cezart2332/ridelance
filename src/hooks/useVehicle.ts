import { useCallback, useEffect, useState } from 'react'

import { carsService, type Car } from '../services/cars.service'

export type VehicleLoadState = 'loading' | 'ready' | 'not-found' | 'error'

interface UseVehicleResult {
  car: Car | null
  state: VehicleLoadState
  retry: () => void
}

interface Loaded {
  /** `slug#încercare` — cât timp nu corespunde cererii curente, rezultatul e vechi. */
  key: string
  car: Car | null
  state: VehicleLoadState
}

/**
 * Mașina din spatele unui slug.
 *
 * Diferența dintre „nu există" și „n-am putut întreba" e păstrată intenționat: prima duce la o
 * pagină de 404 cu drum înapoi spre listă, a doua la un buton de reîncercare. Un ecran alb pentru
 * ambele ar fi cea mai proastă variantă.
 *
 * Starea de încărcare nu se setează din efect, ci se deduce: dacă rezultatul din memorie e al altui
 * slug (sau al unei încercări anterioare), înseamnă că cererea curentă e încă pe drum.
 */
export function useVehicle(slug: string | undefined): UseVehicleResult {
  const [loaded, setLoaded] = useState<Loaded | null>(null)
  const [attempt, setAttempt] = useState(0)

  const key = `${slug ?? ''}#${attempt}`

  useEffect(() => {
    if (!slug) return

    let cancelled = false

    carsService
      .getBySlug(slug)
      .then((data) => {
        if (!cancelled) setLoaded({ key, car: data, state: 'ready' })
      })
      .catch((error: unknown) => {
        if (cancelled) return
        const status = (error as { response?: { status?: number } }).response?.status
        setLoaded({ key, car: null, state: status === 404 ? 'not-found' : 'error' })
      })

    return () => {
      cancelled = true
    }
  }, [slug, key])

  const retry = useCallback(() => setAttempt((n) => n + 1), [])

  if (!slug) {
    return { car: null, state: 'not-found', retry }
  }

  const fresh = loaded?.key === key ? loaded : null
  return { car: fresh?.car ?? null, state: fresh?.state ?? 'loading', retry }
}
