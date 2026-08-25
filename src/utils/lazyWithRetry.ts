import { lazy, type ComponentType, type LazyExoticComponent } from 'react'

const CHUNK_RELOAD_KEY = 'rl_chunk_reload'

export function clearChunkReloadFlag() {
  sessionStorage.removeItem(CHUNK_RELOAD_KEY)
}

/** Politica de reîncărcare, expusă ca s-o poată refolosi și `lazy` apelat direct. */
export function reloadOnceOnChunkError(error: unknown): never {
  if (!sessionStorage.getItem(CHUNK_RELOAD_KEY)) {
    sessionStorage.setItem(CHUNK_RELOAD_KEY, '1')
    window.location.reload()
  }
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
