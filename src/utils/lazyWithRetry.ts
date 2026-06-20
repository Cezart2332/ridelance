import { lazy, type ComponentType, type LazyExoticComponent } from 'react'

const CHUNK_RELOAD_KEY = 'rl_chunk_reload'

export function clearChunkReloadFlag() {
  sessionStorage.removeItem(CHUNK_RELOAD_KEY)
}

function reloadOnceOnChunkError(error: unknown): never {
  if (!sessionStorage.getItem(CHUNK_RELOAD_KEY)) {
    sessionStorage.setItem(CHUNK_RELOAD_KEY, '1')
    window.location.reload()
  }
  throw error
}

export function lazyWithRetry<T extends ComponentType<unknown>>(
  factory: () => Promise<{ default: T }>,
): LazyExoticComponent<T> {
  return lazy(() => factory().catch(reloadOnceOnChunkError))
}
