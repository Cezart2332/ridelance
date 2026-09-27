import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'

import { IS_NATIVE_APP } from '../native/platform'

/**
 * Deploy nou cât timp o filă e deschisă.
 *
 * Fiecare deploy șterge chunk-urile vechi de pe server. O filă deschisă dinainte cere, la primul
 * ecran încărcat lazy, un fișier care nu mai există — și singura ieșire e reîncărcarea paginii,
 * care venea la un clic oarecare, în mijlocul lucrului. Aici fila află din `/version.json` că
 * există o versiune nouă și se reîncarcă la următoarea navigare, când oricum se schimbă ecranul.
 */
const CHECK_INTERVAL_MS = 5 * 60_000

let newVersionAvailable = false

async function checkVersion() {
  try {
    const response = await fetch('/version.json', { cache: 'no-store' })
    if (!response.ok) return
    const { build } = (await response.json()) as { build?: string }
    if (build && build !== __APP_BUILD__) newVersionAvailable = true
  } catch {
    // Fără rețea: se verifică la următoarea ocazie.
  }
}

function watchEnabled() {
  return !import.meta.env.DEV && !IS_NATIVE_APP
}

/** Pornește verificarea: la revenirea în filă și din 5 în 5 minute. */
export function watchForNewVersion() {
  if (!watchEnabled()) return
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void checkVersion()
  })
  window.setInterval(() => void checkVersion(), CHECK_INTERVAL_MS)
}

/** Reîncarcă pagina la prima navigare după un deploy nou (adresa e deja cea nouă). */
export function useReloadOnNewVersion() {
  const location = useLocation()
  const first = useRef(true)
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    if (watchEnabled() && newVersionAvailable) window.location.reload()
  }, [location.pathname, location.search])
}
