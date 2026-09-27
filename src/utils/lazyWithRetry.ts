import { lazy, type ComponentType, type LazyExoticComponent } from 'react'

const CHUNK_RELOAD_KEY = 'rl_chunk_reload_at'

/**
 * Cât trebuie să treacă între două reîncărcări pentru un chunk lipsă. Marcajul nu se mai șterge
 * la pornire: un chunk care lipsește și după reîncărcare (server sau rețea cu probleme) ducea la
 * reîncărcări la nesfârșit. Acum, în fereastra asta, eroarea ajunge la ecran în loc de încă un refresh.
 */
const RELOAD_WINDOW_MS = 30_000

function readReloadAt(): number {
  try {
    return Number(sessionStorage.getItem(CHUNK_RELOAD_KEY) ?? 0)
  } catch {
    return 0
  }
}

/** Reîncarcă pagina pentru un chunk lipsă, cel mult o dată la 30 de secunde. */
export function reloadForMissingChunk(): boolean {
  if (Date.now() - readReloadAt() < RELOAD_WINDOW_MS) return false
  try {
    sessionStorage.setItem(CHUNK_RELOAD_KEY, String(Date.now()))
  } catch {
    // Fără sessionStorage nu avem cum ține socoteala: nu riscăm o buclă.
    return false
  }
  window.location.reload()
  return true
}

/** Politica de reîncărcare, expusă ca s-o poată refolosi și `lazy` apelat direct. */
export function reloadOnceOnChunkError(error: unknown): never {
  reloadForMissingChunk()
  throw error
}

/**
 * `lazy`, plus o reîncărcare unică atunci când chunk-ul lipsește de pe server.
 *
 * Constrângerea `ComponentType<unknown>` acceptă doar componente fără props — props-urile sunt
 * contravariante. Pentru componentele cu props, folosește `lazy` direct și dă-i
 * <see cref="reloadOnceOnChunkError"/> ca `catch`; vezi `components/cars/map/LazyMaps.tsx`.
 */
export function lazyWithRetry<T extends ComponentType<unknown>>(
  factory: () => Promise<{ default: T }>,
): LazyExoticComponent<T> {
  return lazy(() => factory().catch(reloadOnceOnChunkError))
}
