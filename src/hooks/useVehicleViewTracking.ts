import { useEffect, useRef } from 'react'

import { carsService } from '../services/cars.service'

/** Cât stă cineva pe pagină înainte să conteze ca vizualizare. */
const DELAY_MS = 2000

const keyOf = (carId: string) => `vdp_view:${carId}`

/**
 * O vizualizare se înregistrează la intrarea pe pagina de detaliu — și nicăieri altundeva
 * (spec §18).
 *
 * Trei filtre, fiecare pentru un mod diferit de a umfla cifra:
 * - două secunde de așteptare, ca o intrare din greșeală să nu conteze;
 * - tab-ul trebuie să fie în prim-plan, altfel se așteaptă până redevine (prefetch, tab deschis
 *   „pentru mai târziu");
 * - o cheie în `sessionStorage`, ca refresh-ul și Back/Forward să nu mai trimită.
 *
 * Serverul deduplică oricum 30 de minute per vizitator — filtrele de aici nu sunt garanția, doar
 * bunul-simț de a nu trimite degeaba.
 */
export function useVehicleViewTracking(carId: string | undefined, enabled = true) {
  // StrictMode montează de două ori în dev; fără asta, fiecare pagină ar trimite dublu.
  const sentRef = useRef(false)

  useEffect(() => {
    if (!carId || !enabled || sentRef.current) return

    let alreadySeen = false
    try {
      alreadySeen = sessionStorage.getItem(keyOf(carId)) !== null
    } catch {
      // Storage blocat (mod privat, cookie policy): rămâne deduplicarea de pe server.
      alreadySeen = false
    }
    if (alreadySeen) return

    let timer: ReturnType<typeof setTimeout> | null = null

    const send = () => {
      if (sentRef.current) return
      sentRef.current = true

      try {
        sessionStorage.setItem(keyOf(carId), String(Date.now()))
      } catch {
        // Vezi mai sus.
      }

      carsService.trackView(carId).catch((error: unknown) => {
        if (import.meta.env.DEV) {
          console.warn('[vdp] view tracking failed', error)
        }
      })
    }

    const start = () => {
      timer = setTimeout(send, DELAY_MS)
    }

    const onVisibility = () => {
      if (document.visibilityState !== 'visible') return
      document.removeEventListener('visibilitychange', onVisibility)
      start()
    }

    if (document.visibilityState === 'visible') {
      start()
    } else {
      document.addEventListener('visibilitychange', onVisibility)
    }

    return () => {
      if (timer) clearTimeout(timer)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [carId, enabled])
}
